// ============================================================================
// 批量从TFC密封大桶配方创建Create发酵配方（策略模式重构版）
// ============================================================================
// 
// 策略模式实现：
// 1. 分析配方属性，添加策略标记（strategy type）
// 2. 注册不同策略的处理函数
// 3. 执行时根据标记自动选择并执行对应策略
// ============================================================================

// ============================================================================
// 策略注册表
// 每个策略包含：condition(recipeData) -> bool  用于判断是否适用
//               handler(data, recipe, recipeData) -> bool  返回true表示已处理，false表示继续
// 策略按注册顺序执行，前面的策略可以为后面的策略添加标记数据（如bulkParams）
// ============================================================================
var recipeStrategies = {};

// 注册策略
function registerStrategy(name, condition, handler) {
    recipeStrategies[name] = {
        condition: condition,
        handler: handler
    };
}

// ============================================================================
// 数据结构定义
// ============================================================================

// 配方转换器数据（贯穿整个转换流程的上下文对象）
function createConverterData(event) {
    return {
        event: event,
        stats: {
            basin: 0,   // Basin Fermenting 配方生成计数
            bulk: 0,    // Bulk Fermenting 配方生成计数
            skipped: 0  // 跳过的配方计数（如带modifiers的配方）
        },
        FLUID_SLOT_LIMIT: 1000  // Create流体槽上限 (mB)
    };
}

// 配方数据对象（每个TFC配方对应一个实例，策略按需修改其字段）
function createRecipeData(json, data, recipe) {
    var result = {
        inputItem: null,
        inputFluid: null,
        outputItem: null,
        outputFluid: null,
        sealTime: 0,
        maxMultiplier: Infinity,      // 理论最大倍增倍数（受堆叠/流体槽限制）
        flooredMultiplier: 0,         // 向下取整后的倍数（用于Basin配方）
        recipeId: recipe ? recipe.getId() : null,
        // bulkParams 由各策略逐步修改，最终用于 Bulk Fermenting 配方生成
        bulkParams: {
            itemMultiplier: 0,        // 物品倍增倍率
            fluidMultiplier: 0,       // 流体倍增倍率（可与物品倍率不同）
            fluidAddition: 0          // 额外添加/返还的流体量 (mB)
        }
    };
    
    // 提取数据
    result.inputItem = parseJsonField(json, 'input_item');
    result.inputFluid = parseJsonField(json, 'input_fluid');
    result.outputItem = parseJsonField(json, 'output_item');
    result.outputFluid = parseJsonField(json, 'output_fluid');
    // 支持 seal_time 和 duration 两种字段名
    if (json.has('seal_time')) {
        result.sealTime = json.get('seal_time').getAsInt();
    } else if (json.has('duration')) {
        result.sealTime = json.get('duration').getAsInt();
    } else {
        result.sealTime = 0;
    }
    
    return result;
}

// ============================================================================
// 工具函数
// ============================================================================

// 解析 JSON 字段
function parseJsonField(json, fieldName) {
    if (json.has(fieldName)) {
        try {
            return JSON.parse(json.get(fieldName).toString());
        } catch (e) {
            return null;
        }
    }
    return null;
}

// 获取物品最大堆叠数
// 当输入是tag时，取该tag下所有物品中最小的maxStackSize（保守估计，防止溢出）
function getMaxStackSize(itemData) {
    var itemId = itemData.item || itemData.tag;
    if (!itemId) return null;
    
    try {
        if (itemData.tag) {
            var tagItems = Ingredient.of('#' + itemData.tag).items;
            if (tagItems && tagItems.length > 0) {
                var minStack = tagItems[0].getMaxStackSize();
                for (var i = 1; i < tagItems.length; i++) {
                    if (tagItems[i].getMaxStackSize() < minStack) {
                        minStack = tagItems[i].getMaxStackSize();
                    }
                }
                return minStack;
            }
        } else {
            return Item.of(itemId, 1).getMaxStackSize();
        }
    } catch (e) {
        return 64;
    }
    return null;
}

// 计算最大倍增倍数（取输入物品/输出物品/输入流体/输出流体四项限制的最小值）
// 输入物品受堆叠上限约束，输出物品同理；流体受 FLUID_SLOT_LIMIT (1000mB) 约束
function calculateMaxMultiplier(recipeData, data) {
    var maxMultiplier = Infinity;
    
    if (recipeData.inputItem) {
        var itemId = recipeData.inputItem.item || recipeData.inputItem.tag;
        if (itemId) {
            var count = recipeData.inputItem.count || 1;
            var maxStack = getMaxStackSize(recipeData.inputItem);
            if (maxStack) {
                maxMultiplier = Math.min(maxMultiplier, maxStack / count);
            }
        }
    }
    
    if (recipeData.outputItem) {
        var outputId = recipeData.outputItem.id || recipeData.outputItem.item;
        if (outputId) {
            var count = recipeData.outputItem.count || 1;
            try {
                var maxStack = Item.of(outputId, 1).getMaxStackSize();
                if (maxStack) {
                    maxMultiplier = Math.min(maxMultiplier, maxStack / count);
                }
            } catch (e) {
                maxMultiplier = Math.min(maxMultiplier, 64 / count);
            }
        }
    }
    
    if (recipeData.inputFluid && recipeData.inputFluid.amount > 0) {
        maxMultiplier = Math.min(maxMultiplier, data.FLUID_SLOT_LIMIT / recipeData.inputFluid.amount);
    }
    
    if (recipeData.outputFluid && recipeData.outputFluid.amount > 0) {
        maxMultiplier = Math.min(maxMultiplier, data.FLUID_SLOT_LIMIT / recipeData.outputFluid.amount);
    }
    
    return maxMultiplier;
}

// 构建 Basin Fermenting ingredients（物品和流体使用相同倍率）
function buildIngredients(inputItem, inputFluid, multiplier) {
    var ingredients = [];
    
    if (inputItem) {
        if (inputItem.type === 'tfc:and' && inputItem.children) {
            for (var i = 0; i < multiplier; i++) {
                ingredients.push({
                    type: 'tfc:and',
                    children: inputItem.children
                });
            }
        } else {
            for (var i = 0; i < multiplier; i++) {
                if (inputItem.item) {
                    ingredients.push({ item: inputItem.item });
                } else if (inputItem.tag) {
                    ingredients.push({ tag: inputItem.tag });
                }
            }
        }
    }
    
    if (inputFluid) {
        var amount = inputFluid.amount * multiplier;
        if (inputFluid.fluid && amount > 0) {
            ingredients.push({
                type: 'fluid_stack',
                fluid: inputFluid.fluid,
                amount: amount
            });
        } else if (inputFluid.tag && amount > 0) {
            ingredients.push({
                type: 'fluid_tag',
                fluid_tag: inputFluid.tag,
                amount: amount
            });
        }
    }
    
    return ingredients;
}

// 构建 Basin Fermenting results（物品和流体使用相同倍率）
function buildResults(outputItem, outputFluid, multiplier) {
    var results = [];
    
    if (outputItem) {
        var itemId = outputItem.id || outputItem.item;
        if (itemId) {
            var singleResult = { id: itemId };
            var outputCount = (outputItem.count || 1) * multiplier;
            if (outputCount > 1) {
                singleResult.count = outputCount;
            }
            if (outputItem.chance) {
                singleResult.chance = outputItem.chance;
            }
            results.push(singleResult);
        }
    }
    
    if (outputFluid) {
        var fluidId = outputFluid.id || outputFluid.fluid;
        if (fluidId && outputFluid.amount > 0) {
            results.push({
                id: fluidId,
                amount: outputFluid.amount * multiplier
            });
        }
    }
    
    return results;
}

// 构建 Bulk Fermenting ingredients（支持独立的物品和流体倍率，以及流体返还）
// fluidAddition 用于处理满池减益策略中返还剩余流体的场景
function buildBulkIngredients(inputItem, inputFluid, bulkParams) {
    var ingredients = [];
    
    if (inputItem) {
        var itemMult = bulkParams.itemMultiplier;
        for (var i = 0; i < itemMult; i++) {
            if (inputItem.type === 'tfc:and' && inputItem.children) {
                ingredients.push({
                    type: 'tfc:and',
                    children: inputItem.children
                });
            } else if (inputItem.item) {
                ingredients.push({ item: inputItem.item });
            } else if (inputItem.tag) {
                ingredients.push({ tag: inputItem.tag });
            }
        }
    }
    
    if (inputFluid) {
        var fluidAmount = inputFluid.amount * bulkParams.fluidMultiplier + bulkParams.fluidAddition;
        if (fluidAmount > 0) {
            if (inputFluid.fluid) {
                ingredients.push({
                    type: 'fluid_stack',
                    fluid: inputFluid.fluid,
                    amount: fluidAmount
                });
            } else if (inputFluid.tag) {
                ingredients.push({
                    type: 'fluid_tag',
                    fluid_tag: inputFluid.tag,
                    amount: fluidAmount
                });
            }
        }
    }
    
    return ingredients;
}

// 构建 Bulk Fermenting results（支持独立的物品和流体倍率，以及流体返还）
// outputFluid.amount >= 0 允许零量输出流体（用于满池减益策略的流体返还标记）
function buildBulkResults(outputItem, outputFluid, bulkParams) {
    var results = [];
    
    if (outputItem) {
        var itemId = outputItem.id || outputItem.item;
        if (itemId) {
            var singleResult = { id: itemId };
            var outputCount = (outputItem.count || 1) * bulkParams.itemMultiplier;
            if (outputCount > 1) {
                singleResult.count = outputCount;
            }
            if (outputItem.chance) {
                singleResult.chance = outputItem.chance;
            }
            results.push(singleResult);
        }
    }
    
    if (outputFluid && outputFluid.amount >= 0) {
        var fluidId = outputFluid.id || outputFluid.fluid;
        if (fluidId) {
            var fluidAmount = outputFluid.amount * bulkParams.fluidMultiplier + bulkParams.fluidAddition;
            if (fluidAmount > 0) {
                results.push({
                    id: fluidId,
                    amount: fluidAmount
                });
            }
        }
    }
    
    return results;
}

// ============================================================================
// 策略：配方分析（添加标记）
// ============================================================================

// 策略1：计算 bulk 倍率（默认物品和流体同步倍率）
// 逻辑：原配方输入物品数决定每"组"大小，floor(9 / 原物品数) = 每批最多处理几组
registerStrategy('bulk_multiplier_check', function(recipeData) {
    // 计算原配方输入物品数
    var originalItemCount = 0;
    if (recipeData.inputItem) {
        originalItemCount = 1;
    }
    
    // 计算 bulk 倍率：floor(9 / 原物品数)
    var multiplier = Math.floor(9 / originalItemCount);
    
    // 将倍率参数存储到 recipeData 中（默认同步倍率）
    recipeData.bulkParams.itemMultiplier = multiplier;
    recipeData.bulkParams.fluidMultiplier = multiplier;
    recipeData.bulkParams.fluidAddition = 0;
    
    // 如果倍率 > 0，则 bulk_fermenting 可用
    return multiplier > 0;
}, function(data, recipe, recipeData) {
    // 这个策略只是添加标记，不做实际处理
    return false; // 继续后续策略
});

// 策略2：流体增益（有流体输出的配方，流体倍率翻倍）
// 原因：输入和输出的流体独立占用流体槽，翻倍可以更好地利用槽位
registerStrategy('bulk_fluid_bonus', function(recipeData) {
    // 条件：有流体输出且输入流体量 > 0
    if (recipeData.outputFluid && recipeData.outputFluid.amount > 0 && 
        recipeData.inputFluid && recipeData.inputFluid.amount > 0) {
        // 流体倍率 = 物品倍率 * 2（确保输入与输出流体同步倍增）
        var itemMult = recipeData.bulkParams.itemMultiplier || 1;
        recipeData.bulkParams.fluidMultiplier = itemMult * 2;
        recipeData.bulkParams.fluidAddition = 0;
        return true;
    }
    return false;
}, function(data, recipe, recipeData) {
    // 标记已添加，不做实际处理
    return false;
});

// 策略2.1：满池减益（有输入流体但无输出流体，需返还剩余流体）
// 当输入流体 < 1000mB 且配方无输出流体时，bulk 后会产生"空余"流体槽
// 此策略将剩余的流体返还到输出中（创造一个虚拟输出流体标记）
registerStrategy('bulk_fluid_return', function(recipeData) {
    // 条件：有输入流体但无输出流体，且输入流体量 < 1000
    if (recipeData.inputFluid && recipeData.inputFluid.amount > 0 && 
        (!recipeData.outputFluid || recipeData.outputFluid.amount <= 0) &&
        recipeData.inputFluid.amount < 1000) {
        // 计算返还量：1000 - (输入流体量 * itemMultiplier)
        var inputAmount = recipeData.inputFluid.amount;
        var itemMult = recipeData.bulkParams.itemMultiplier || 1;
        var consumed = inputAmount * itemMult;
        var returnAmount = 1000 - consumed;
        
        // 设置参数：流体倍率与物品倍率相同，添加返还量
        recipeData.bulkParams.fluidMultiplier = itemMult;
        recipeData.bulkParams.fluidAddition = returnAmount;
        
        // 创建虚拟输出流体（用于buildBulkResults处理返还）
        var fluidId = recipeData.inputFluid.fluid || recipeData.inputFluid.tag;
        if (fluidId) {
            recipeData.outputFluid = { id: fluidId, amount: 0 };
        }
        
        return true;
    }
    return false;
}, function(data, recipe, recipeData) {
    // 标记已添加，不做实际处理
    return false;
});

// 策略2.2：特殊配方处理（如 mortar 输出过多，限制倍率为6防止溢出）
registerStrategy('bulk_special_recipe', function(recipeData) {
    // 直接判断配方ID
    if (recipeData.recipeId === 'tfc:barrel/mortar') {
        recipeData.bulkParams.itemMultiplier = 6;  // 特殊物品倍率
        recipeData.bulkParams.fluidMultiplier = 6; // 特殊流体倍率
        recipeData.bulkParams.fluidAddition = 0;
        return true;
    }
    return false;
}, function(data, recipe, recipeData) {
    // 标记已添加，不做实际处理
    return false;
});

// 策略2.3：陈酿酒配方（输出流体以 tfcagedalcohol:aged 开头）
// 陈酿酒需要特殊倍率：物品不倍增，仅流体按 3.6 倍处理
registerStrategy('bulk_aged_alcohol', function(recipeData) {
    // 检查输出流体ID是否以 tfcagedalcohol:aged 开头
    var fluidId = null;
    if (recipeData.outputFluid) {
        fluidId = recipeData.outputFluid.id || recipeData.outputFluid.fluid;
    }
    if (fluidId && fluidId.indexOf('tfcagedalcohol:aged') === 0) {
        recipeData.bulkParams.itemMultiplier = 1;     // 物品倍率1
        recipeData.bulkParams.fluidMultiplier = 3.6; // 陈酿酒流体倍率
        recipeData.bulkParams.fluidAddition = 0;
        return true;
    }
    return false;
}, function(data, recipe, recipeData) {
    // 标记已添加，不做实际处理
    return false;
});

// 策略3：跳过带 modifiers 的配方（如带有NBT标签的输出物，无法在Create配方中表达）
registerStrategy('skip_modifiers', function(recipeData) {
    return recipeData.outputItem && recipeData.outputItem.modifiers;
}, function(data, recipe, recipeData) {
    data.stats.skipped++;
    return true; // 已处理，不再执行后续策略
});

// 策略4：Basin Fermenting（处理倍率 >= 1 的配方，物品流体同步倍率）
// 处理时间 = sealTime / 5（最少100tick），用于单槽批量发酵
registerStrategy('basin_fermenting', function(recipeData) {
    return recipeData.flooredMultiplier >= 1;
}, function(data, recipe, recipeData) {
    var multiplier = recipeData.flooredMultiplier;
    var ingredients = buildIngredients(recipeData.inputItem, recipeData.inputFluid, multiplier);
    var results = buildResults(recipeData.outputItem, recipeData.outputFluid, multiplier);
    
    if (results.length === 0 || ingredients.length === 0) {
        return false;
    }
    
    var processingTime = Math.max(100, Math.round(recipeData.sealTime / 5));
    var multStr = multiplier.toString();
    
    data.event.custom({
        type: 'createdieselgenerators:basin_fermenting',
        ingredients: ingredients,
        processing_time: processingTime,
        results: results
    }).id('kubejs:tfc_barrel_sealed/basin/' + multStr + '_' + recipe.getId().replace(':', '_'));
    
    data.stats.basin++;
    return true;
});

// 策略5：Bulk Fermenting（使用 bulkParams，物品和流体可独立倍率）
// 处理时间 = sealTime / 4（最少100tick），九个槽位同时发酵
registerStrategy('bulk_fermenting', function(recipeData) {
    // 检查是否有有效的 bulkParams（itemMultiplier > 0）
    return recipeData.bulkParams && recipeData.bulkParams.itemMultiplier > 0;
}, function(data, recipe, recipeData) {
    // 获取 bulk 参数
    var bulkParams = recipeData.bulkParams;
    
    // 使用独立的构建函数处理 bulk 配方
    var ingredients = buildBulkIngredients(recipeData.inputItem, recipeData.inputFluid, bulkParams);
    var results = buildBulkResults(recipeData.outputItem, recipeData.outputFluid, bulkParams);
    
    if (results.length === 0 || ingredients.length === 0) {
        return false;
    }
    
    var processingTime = Math.max(100, Math.round(recipeData.sealTime / 4));
    var multStr = bulkParams.itemMultiplier.toString() + '_' + bulkParams.fluidMultiplier.toString();
    
    data.event.custom({
        type: 'createdieselgenerators:bulk_fermenting',
        ingredients: ingredients,
        processing_time: processingTime,
        results: results
    }).id('kubejs:tfc_barrel_sealed/bulk/' + multStr + '_' + recipe.getId().replace(':', '_'));
    
    data.stats.bulk++;
    return true;
});

// ============================================================================
// 主流程
// ============================================================================

// 分析配方：计算倍率，然后遍历所有策略的 condition，将适用的策略名存入 recipeData.strategies
// 注意：condition 可能有副作用（如修改 bulkParams），这是设计如此，用于策略间的数据传递
function analyzeRecipe(recipeData, data) {
    // 计算倍数
    recipeData.maxMultiplier = calculateMaxMultiplier(recipeData, data);
    recipeData.flooredMultiplier = Math.floor(recipeData.maxMultiplier);
    
    // 根据条件收集适用的策略
    recipeData.strategies = [];
    for (var strategyName in recipeStrategies) {
        if (recipeStrategies.hasOwnProperty(strategyName)) {
            var strategy = recipeStrategies[strategyName];
            if (strategy.condition(recipeData)) {
                recipeData.strategies.push(strategyName);
            }
        }
    }
}

// 按 analyzeRecipe 收集的策略顺序执行所有 handler
// handler 返回 true 表示已处理（如 skip 策略），但目前不影响后续策略继续执行
function executeStrategies(data, recipe, recipeData) {
    for (var i = 0; i < recipeData.strategies.length; i++) {
        var strategyName = recipeData.strategies[i];
        var strategy = recipeStrategies[strategyName];
        if (strategy) {
            var result = strategy.handler(data, recipe, recipeData);
            if (result === true) {
                // 策略已处理，可以选择继续或中断
                // 这里可以根据需要决定是否继续
            }
        }
    }
}

// 转换单个配方：解析 → 快速过滤 → 分析策略 → 执行策略
function convertSingleRecipe(data, recipe) {
    var json = recipe.json;
    
    var recipeData = createRecipeData(json, data, recipe);
    
    // 快速过滤：带modifiers的配方无法在Create中表达，提前跳过（与策略3重复但更高效）
    if (recipeData.outputItem && recipeData.outputItem.modifiers) {
        data.stats.skipped++;
        return;
    }
    
    // 分析配方，添加策略标记
    analyzeRecipe(recipeData, data);
    
    // 执行所有适用的策略
    executeStrategies(data, recipe, recipeData);
}

// 批量转换
function convertAllRecipes(data) {
    console.info('[生物柴油修复] 开始批量转换TFC密封大桶配方...');
    
    data.event.forEachRecipe({ type: 'tfc:barrel_sealed' }, function(recipe) {
        convertSingleRecipe(data, recipe);
    });
    
    console.info('[生物柴油修复] 完成！Basin: ' + data.stats.basin + 
                ', Bulk: ' + data.stats.bulk + 
                ', 跳过: ' + data.stats.skipped);
}

// ============================================================================
// 执行
// 入口：遍历所有 tfc:barrel_sealed 配方，逐个转换为 Create 发酵配方
// ============================================================================
ServerEvents.recipes(function(event) {
    var data = createConverterData(event);
    convertAllRecipes(data);
});
