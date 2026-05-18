// ============================================================================
// 批量从TFC密封大桶配方创建Create发酵配方
// 线性流水线：解析 → 过滤 → 计算倍率 → 生成Basin/Bulk配方
// ============================================================================

var BULK_FLUID_LIMIT = 72000;

/**
 * 创建贯穿转换流程的上下文对象
 * @param {Internal.RecipeEventJS} event - 配方事件
 * @returns {Object} 包含事件引用、统计计数器和常量
 */
function createConverterData(event) {
    return {
        event: event,
        stats: { basin: 0, bulk: 0, skipped: 0 },
        FLUID_SLOT_LIMIT: 1000
    };
}

/**
 * 从TFC配方JSON中提取关键字段
 * @param {Internal.JsonObject} json - 配方的JSON对象
 * @param {Object} data - 转换上下文
 * @param {Internal.Recipe} recipe - TFC配方
 * @returns {Object} 标准化后的配方数据对象
 */
function createRecipeData(json, data, recipe) {
    var result = {
        inputItem: null,
        inputFluid: null,
        outputItem: null,
        outputFluid: null,
        sealTime: 0,
        basinMaxMultiplier: Infinity,
        basinMultiplier: 0,
        recipeId: recipe ? recipe.getId() : null,
        base: 0,
        itemMultiplier: 0,
        fluidMultiplier: 0,
        fluidAddition: 0
    };

    result.inputItem = parseJsonField(json, 'input_item');
    result.inputFluid = parseJsonField(json, 'input_fluid');
    result.outputItem = parseJsonField(json, 'output_item');
    result.outputFluid = parseJsonField(json, 'output_fluid');
    if (json.has('seal_time')) {
        result.sealTime = json.get('seal_time').getAsInt();
    } else if (json.has('duration')) {
        result.sealTime = json.get('duration').getAsInt();
    }

    return result;
}

/**
 * 安全解析JSON字段
 * @param {Internal.JsonObject} json - JSON对象
 * @param {string} fieldName - 字段名
 * @returns {Object|null} 解析后的对象，失败返回null
 */
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

/**
 * 获取物品最大堆叠数（tag输入时取该tag下所有物品的最小值）
 * @param {Object} itemData - {item/tag, count}
 * @returns {number|null} 最大堆叠数
 */
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

/**
 * 计算Basin配方的理论最大倍率
 * 受输入/输出物品堆叠上限和1000mB流体槽限制
 * @param {Object} recipeData - 配方数据
 * @param {Object} data - 转换上下文（提供FLUID_SLOT_LIMIT）
 * @returns {number} 理论最大倍率
 */
function calculateBasinMaxMultiplier(recipeData, data) {
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

/**
 * 计算Bulk配方的基础倍率
 * 公式: floor(9 / 物品数)，同时为流体增益×2预留72000上限空间
 * @param {Object} recipeData - 配方数据
 * @returns {number} 基础倍率（为0时无法生成Bulk配方）
 */
function calculateBulkBase(recipeData) {
    var originalItemCount = recipeData.inputItem ? 1 : 0;
    if (originalItemCount === 0) return 0;

    var base = Math.floor(9 / originalItemCount);

    if (recipeData.inputFluid && recipeData.inputFluid.amount > 0) {
        var inputAmt = recipeData.inputFluid.amount;
        if (recipeData.outputFluid && recipeData.outputFluid.amount > 0) {
            base = Math.min(base, Math.floor(BULK_FLUID_LIMIT / (2 * inputAmt)));
            base = Math.min(base, Math.floor(BULK_FLUID_LIMIT / (2 * recipeData.outputFluid.amount)));
        } else {
            base = Math.min(base, Math.floor(BULK_FLUID_LIMIT / inputAmt));
        }
    }

    return base;
}

/**
 * 判断是否为陈酿酒配方（物品×1，流体×3.6的特殊倍率）
 * @param {Object} recipeData - 配方数据
 * @returns {boolean}
 */
function isAgedAlcohol(recipeData) {
    var fluidId = null;
    if (recipeData.outputFluid) {
        fluidId = recipeData.outputFluid.id || recipeData.outputFluid.fluid;
    }
    return fluidId && fluidId.indexOf('tfcagedalcohol:aged') === 0;
}

/**
 * 解析Bulk配方的倍率参数
 * 特殊配方（陈酿酒）整体覆盖所有倍率并跳过通用策略；
 * 通用配方依次应用流体增益（×2）和满池返还（向上取整到1000的倍数）
 * @param {Object} recipeData - 配方数据（会被修改）
 */
function resolveBulkParams(recipeData) {
    var base = recipeData.base;
    var hasInputFluid = recipeData.inputFluid && recipeData.inputFluid.amount > 0;
    var hasOutputFluid = recipeData.outputFluid && recipeData.outputFluid.amount > 0;

    if (isAgedAlcohol(recipeData)) {
        recipeData.itemMultiplier = 1;
        recipeData.fluidMultiplier = 3.6;
        recipeData.fluidAddition = 0;
        return;
    }

    recipeData.itemMultiplier = base;
    recipeData.fluidMultiplier = base;
    recipeData.fluidAddition = 0;

    if (hasInputFluid && hasOutputFluid) {
        recipeData.fluidMultiplier = base * 2;
    }

    if (hasInputFluid && !hasOutputFluid) {
        var totalInput = recipeData.inputFluid.amount * recipeData.fluidMultiplier;
        var remainder = totalInput % 1000;
        if (remainder > 0) {
            recipeData.fluidAddition = 1000 - remainder;
            var fluidId = recipeData.inputFluid.fluid || recipeData.inputFluid.tag;
            if (fluidId) {
                recipeData.outputFluid = { id: fluidId, amount: 0 };
            }
        }
    }
}

/**
 * 构建Basin配方的输入列表（物品和流体使用同一倍率）
 * @param {Object} inputItem - 输入物品
 * @param {Object} inputFluid - 输入流体
 * @param {number} multiplier - 倍率
 * @returns {Array} ingredients数组
 */
function buildBasinIngredients(inputItem, inputFluid, multiplier) {
    var ingredients = [];

    if (inputItem) {
        if (inputItem.type === 'tfc:and' && inputItem.children) {
            for (var i = 0; i < multiplier; i++) {
                ingredients.push({ type: 'tfc:and', children: inputItem.children });
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
            ingredients.push({ type: 'fluid_stack', fluid: inputFluid.fluid, amount: amount });
        } else if (inputFluid.tag && amount > 0) {
            ingredients.push({ type: 'fluid_tag', fluid_tag: inputFluid.tag, amount: amount });
        }
    }

    return ingredients;
}

/**
 * 构建Basin配方的输出列表（物品和流体使用同一倍率）
 * @param {Object} outputItem - 输出物品
 * @param {Object} outputFluid - 输出流体
 * @param {number} multiplier - 倍率
 * @returns {Array} results数组
 */
function buildBasinResults(outputItem, outputFluid, multiplier) {
    var results = [];

    if (outputItem) {
        var itemId = outputItem.id || outputItem.item;
        if (itemId) {
            var singleResult = { id: itemId };
            var outputCount = (outputItem.count || 1) * multiplier;
            if (outputCount > 1) singleResult.count = outputCount;
            if (outputItem.chance) singleResult.chance = outputItem.chance;
            results.push(singleResult);
        }
    }

    if (outputFluid) {
        var fluidId = outputFluid.id || outputFluid.fluid;
        if (fluidId && outputFluid.amount > 0) {
            results.push({ id: fluidId, amount: outputFluid.amount * multiplier });
        }
    }

    return results;
}

/**
 * 构建Bulk配方的输入列表（物品/流体独立倍率，含满池返还的fluidAddition）
 * @param {Object} recipeData - 配方数据（含itemMultiplier/fluidMultiplier/fluidAddition）
 * @returns {Array} ingredients数组
 */
function buildBulkIngredients(recipeData) {
    var ingredients = [];
    var inputItem = recipeData.inputItem;
    var inputFluid = recipeData.inputFluid;

    if (inputItem) {
        for (var i = 0; i < recipeData.itemMultiplier; i++) {
            if (inputItem.type === 'tfc:and' && inputItem.children) {
                ingredients.push({ type: 'tfc:and', children: inputItem.children });
            } else if (inputItem.item) {
                ingredients.push({ item: inputItem.item });
            } else if (inputItem.tag) {
                ingredients.push({ tag: inputItem.tag });
            }
        }
    }

    if (inputFluid) {
        var fluidAmount = inputFluid.amount * recipeData.fluidMultiplier + recipeData.fluidAddition;
        if (fluidAmount > 0) {
            if (inputFluid.fluid) {
                ingredients.push({ type: 'fluid_stack', fluid: inputFluid.fluid, amount: fluidAmount });
            } else if (inputFluid.tag) {
                ingredients.push({ type: 'fluid_tag', fluid_tag: inputFluid.tag, amount: fluidAmount });
            }
        }
    }

    return ingredients;
}

/**
 * 构建Bulk配方的输出列表（物品/流体独立倍率，含满池返还的fluidAddition）
 * @param {Object} recipeData - 配方数据
 * @returns {Array} results数组
 */
function buildBulkResults(recipeData) {
    var results = [];
    var outputItem = recipeData.outputItem;
    var outputFluid = recipeData.outputFluid;

    if (outputItem) {
        var itemId = outputItem.id || outputItem.item;
        if (itemId) {
            var singleResult = { id: itemId };
            var outputCount = (outputItem.count || 1) * recipeData.itemMultiplier;
            if (outputCount > 1) singleResult.count = outputCount;
            if (outputItem.chance) singleResult.chance = outputItem.chance;
            results.push(singleResult);
        }
    }

    if (outputFluid && outputFluid.amount >= 0) {
        var fluidId = outputFluid.id || outputFluid.fluid;
        if (fluidId) {
            var fluidAmount = outputFluid.amount * recipeData.fluidMultiplier + recipeData.fluidAddition;
            if (fluidAmount > 0) {
                results.push({ id: fluidId, amount: fluidAmount });
            }
        }
    }

    return results;
}

/**
 * 尝试生成Basin Fermenting配方（处理时间=sealTime/5，至少100tick）
 * @param {Object} data - 转换上下文
 * @param {Internal.Recipe} recipe - 原TFC配方（用于生成ID）
 * @param {Object} recipeData - 配方数据
 */
function tryBasinFermenting(data, recipe, recipeData) {
    if (recipeData.basinMultiplier < 1) return;

    var ingredients = buildBasinIngredients(recipeData.inputItem, recipeData.inputFluid, recipeData.basinMultiplier);
    var results = buildBasinResults(recipeData.outputItem, recipeData.outputFluid, recipeData.basinMultiplier);

    if (results.length === 0 || ingredients.length === 0) return;

    var processingTime = Math.max(100, Math.round(recipeData.sealTime / 5));

    data.event.custom({
        type: 'createdieselgenerators:basin_fermenting',
        ingredients: ingredients,
        processing_time: processingTime,
        results: results
    }).id('kubejs:tfc_barrel_sealed/basin/' + recipeData.basinMultiplier + '_' + recipe.getId().replace(':', '_'));

    data.stats.basin++;
}

/**
 * 尝试生成Bulk Fermenting配方（处理时间=sealTime/4，至少100tick）
 * @param {Object} data - 转换上下文
 * @param {Internal.Recipe} recipe - 原TFC配方（用于生成ID）
 * @param {Object} recipeData - 配方数据
 */
function tryBulkFermenting(data, recipe, recipeData) {
    if (recipeData.itemMultiplier <= 0) return;

    var ingredients = buildBulkIngredients(recipeData);
    var results = buildBulkResults(recipeData);

    if (results.length === 0 || ingredients.length === 0) return;

    var processingTime = Math.max(100, Math.round(recipeData.sealTime / 4));
    var multStr = recipeData.itemMultiplier + '_' + recipeData.fluidMultiplier;

    data.event.custom({
        type: 'createdieselgenerators:bulk_fermenting',
        ingredients: ingredients,
        processing_time: processingTime,
        results: results
    }).id('kubejs:tfc_barrel_sealed/bulk/' + multStr + '_' + recipe.getId().replace(':', '_'));

    data.stats.bulk++;
}

/**
 * 转换单个TFC密封大桶配方：解析 → 过滤modifiers → 计算倍率 → 生成Basin和Bulk配方
 * @param {Object} data - 转换上下文
 * @param {Internal.Recipe} recipe - TFC密封大桶配方
 */
function convertSingleRecipe(data, recipe) {
    var json = recipe.json;
    var recipeData = createRecipeData(json, data, recipe);

    if (recipeData.outputItem && recipeData.outputItem.modifiers) {
        data.stats.skipped++;
        return;
    }

    if (!recipeData.outputItem && !recipeData.outputFluid) {
        data.stats.skipped++;
        return;
    }

    if (recipeData.recipeId === 'tfc:barrel/mortar') {
        data.stats.skipped++;
        return;
    }

    recipeData.basinMaxMultiplier = calculateBasinMaxMultiplier(recipeData, data);
    recipeData.basinMultiplier = Math.floor(recipeData.basinMaxMultiplier);

    recipeData.base = calculateBulkBase(recipeData);
    resolveBulkParams(recipeData);

    tryBasinFermenting(data, recipe, recipeData);
    tryBulkFermenting(data, recipe, recipeData);
}

/**
 * 验证TFC堆叠限制是否已正确加载
 * 首次加载时TFC堆叠修改可能尚未生效，getMaxStackSize可能返回错误的64
 * @param {Object} data - 转换上下文
 * @returns {boolean} true=堆叠正确，false=需要重载
 */
function verifyStackSizeLoaded(data) {
    var expected = 32;
    var actual = Item.of('minecraft:white_wool', 1).getMaxStackSize();

    if (actual !== expected) {
        var msg = Text.red('[生物柴油修复] 堆叠限制未正确加载（羊毛=' + actual + '，期望=' + expected + '），请执行 /reload 后重试，否则配方倍率可能不准确');
        if (data.event.server) {
            data.event.server.tell(msg);
        }
        console.error('[生物柴油修复] 堆叠限制验证失败：羊毛实际=' + actual + '，期望=' + expected + '，请执行 /reload 后重试，否则配方倍率可能不准确');
        return false;
    }

    console.info('[生物柴油修复] 堆叠限制验证通过（羊毛=' + actual + '）');
    return true;
}

/**
 * 批量转换所有TFC密封大桶配方
 * @param {Object} data - 转换上下文
 */
function convertAllRecipes(data) {
    data.event.forEachRecipe({ type: 'tfc:barrel_sealed' }, function(recipe) {
        convertSingleRecipe(data, recipe);
    });
}

ServerEvents.recipes(function(event) {
    var data = createConverterData(event);
    verifyStackSizeLoaded(data);
    convertAllRecipes(data);
});
