// ============================================================================
// 批量从TFC即时大桶配方创建Create Mixing配方
// 支持：tfc:barrel_instant（物品+流体）和 tfc:barrel_instant_fluid（纯流体）
// 倍增方案与 ferenting_from_barrel.js 的 Basin 配方一致：
//   物品受堆叠上限约束，流体受 1000mB 单槽约束
// ============================================================================

/**
 * 创建贯穿转换流程的上下文对象
 * @param {Internal.RecipeEventJS} event - 配方事件
 * @returns {Object} 包含事件引用、统计计数器和常量
 */
function createConverterData(event) {
    return {
        event: event,
        stats: { instant: 0, instantFluid: 0, skipped: 0 },
        FLUID_SLOT_LIMIT: 1000,
        PROCESSING_TIME: 100
    };
}

/**
 * 从 tfc:barrel_instant 配方 JSON 中提取物品和流体字段
 * @param {Internal.JsonObject} json - 配方的JSON对象
 * @param {Internal.Recipe} recipe - TFC配方
 * @returns {Object} 标准化后的 inputItem/inputFluid/outputItem/outputFluid
 */
function createInstantData(json, recipe) {
    return {
        inputItem: parseJsonField(json, 'input_item'),
        inputFluid: parseJsonField(json, 'input_fluid'),
        outputItem: parseJsonField(json, 'output_item'),
        outputFluid: parseJsonField(json, 'output_fluid'),
        recipeId: recipe ? recipe.getId() : null
    };
}

/**
 * 从 tfc:barrel_instant_fluid 配方 JSON 中提取纯流体混合字段
 * @param {Internal.JsonObject} json - 配方的JSON对象
 * @param {Internal.Recipe} recipe - TFC配方
 * @returns {Object} 包含 primaryFluid/addedFluid/outputFluid
 */
function createInstantFluidData(json, recipe) {
    return {
        primaryFluid: parseJsonField(json, 'primary_fluid'),
        addedFluid: parseJsonField(json, 'added_fluid'),
        outputFluid: parseJsonField(json, 'output_fluid'),
        recipeId: recipe ? recipe.getId() : null
    };
}

/**
 * 安全解析 JSON 字段
 * @param {Internal.JsonObject} json - JSON对象
 * @param {string} fieldName - 字段名
 * @returns {Object|null} 解析后的对象，失败返回 null
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
 * 获取物品最大堆叠数（tag 输入时取该 tag 下所有物品的最小值）
 * @param {Object} itemData - {item/tag, count}
 * @returns {number|null} 最大堆叠数
 */
function getMaxStackSize(itemData) {
    var itemId = itemData.item || itemData.tag;
    if (!itemId) return null;
    try {
        if (itemData.tag) {
            var tagItems = Ingredient.of('#' + itemData.tag).stackArray;
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
 * 计算理论上最大整数倍率
 * 综合约束：输入/输出物品堆叠上限、输入/输出流体 1000mB 槽上限
 * @param {Object} recipeData - 配方数据
 * @param {Object} data - 转换上下文（提供 FLUID_SLOT_LIMIT）
 * @returns {number} 理论最大倍率
 */
function calculateMaxMultiplier(recipeData, data) {
    var maxMultiplier = Infinity;

    if (recipeData.inputItem) {
        if ((recipeData.inputItem.type === 'neoforge:compound' || recipeData.inputItem.type === 'tfc:and') && recipeData.inputItem.children) {
            for (var i = 0; i < recipeData.inputItem.children.length; i++) {
                var child = recipeData.inputItem.children[i];
                var maxStack = getMaxStackSize(child);
                if (maxStack) {
                    maxMultiplier = Math.min(maxMultiplier, Math.floor(maxStack / (recipeData.inputItem.count || 1)));
                }
            }
        } else {
            var itemId = recipeData.inputItem.item || recipeData.inputItem.tag;
            if (itemId) {
                var count = recipeData.inputItem.count || 1;
                var maxStack = getMaxStackSize(recipeData.inputItem);
                if (maxStack) {
                    maxMultiplier = Math.min(maxMultiplier, Math.floor(maxStack / count));
                }
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
                    maxMultiplier = Math.min(maxMultiplier, Math.floor(maxStack / count));
                }
            } catch (e) {
                maxMultiplier = Math.min(maxMultiplier, Math.floor(64 / count));
            }
        }
    }

    if (recipeData.inputFluid && recipeData.inputFluid.amount > 0) {
        maxMultiplier = Math.min(maxMultiplier, Math.floor(data.FLUID_SLOT_LIMIT / recipeData.inputFluid.amount));
    }

    if (recipeData.outputFluid && recipeData.outputFluid.amount > 0) {
        maxMultiplier = Math.min(maxMultiplier, Math.floor(data.FLUID_SLOT_LIMIT / recipeData.outputFluid.amount));
    }

    return maxMultiplier;
}

/**
 * 构建 mixing 配方的 ingredients 数组
 *   普通物品 → 'count item' 字符串简写
 *   复合/AND类型 → Ingredient.of(inputItem, count) 原样透传
 *   流体 → Fluid.of(fluidId, amount)
 * @param {Object} inputItem - 输入物品数据
 * @param {Object} inputFluid - 输入流体数据
 * @param {number} multiplier - 倍率
 * @returns {Array} ingredients 数组
 */
function buildIngredients(inputItem, inputFluid, multiplier) {
    var ingredients = [];

    if (inputItem) {
        if ((inputItem.type === 'neoforge:compound' || inputItem.type === 'tfc:and') && inputItem.children) {
            var count = (inputItem.count || 1) * multiplier;
            ingredients.push(Ingredient.of(inputItem, count));
        } else {
            var itemId = inputItem.item || inputItem.tag;
            if (itemId) {
                var count = (inputItem.count || 1) * multiplier;
                if (inputItem.tag) {
                    ingredients.push(Ingredient.of('#' + itemId, count));
                } else {
                    ingredients.push(count + 'x ' + itemId);
                }
            }
        }
    }

    if (inputFluid) {
        var fluidId = inputFluid.fluid;
        var amount = inputFluid.amount * multiplier;
        
        if (fluidId) {
            if (amount > 0) {
                try {
                    ingredients.push(Fluid.of(fluidId, amount));
                } catch (e) {
                }
            }
        } else {
            // 处理流体标签
            var fluidTag = inputFluid.fluid_tag || inputFluid.tag;
            if (fluidTag && amount > 0) {
                ingredients.push(Fluid.sizedIngredientOf('#' + fluidTag, amount));
            }
        }
    }

    return ingredients;
}

/**
 * 构建 mixing 配方的 results 数组
 *   物品 → CreateItem.of(ItemStack.of(itemId, count), chance)
 *   流体 → Fluid.of(fluidId, amount)
 * @param {Object} outputItem - 输出物品数据
 * @param {Object} outputFluid - 输出流体数据
 * @param {number} multiplier - 倍率
 * @returns {Array} results 数组
 */
function buildResults(outputItem, outputFluid, multiplier) {
    var results = [];

    if (outputItem) {
        var itemId = outputItem.id || outputItem.item;
        if (itemId) {
            var count = (outputItem.count || 1) * multiplier;
            if (outputItem.chance) {
                results.push(CreateItem.of(Item.of(itemId, count), outputItem.chance));
            } else {
                results.push(CreateItem.of(Item.of(itemId, count), 1.0));
            }
        }
    }

    if (outputFluid) {
        var fluidId = outputFluid.id || outputFluid.fluid;
        if (fluidId) {
            var amount = outputFluid.amount * multiplier;
            if (amount > 0) {
                try {
                    Fluid.of(fluidId, amount);
                    results.push(Fluid.of(fluidId, amount));
                } catch (e) {
                }
            }
        }
    }

    return results;
}

/**
 * 处理单个 tfc:barrel_instant 配方 → Create Mixing
 *   有 modifier 的 output 跳过（如食物腐烂）；否则按倍率生成
 * @param {Object} data - 转换上下文
 * @param {Internal.Recipe} recipe - TFC配方
 */
function processInstantRecipe(data, recipe) {
    var json = recipe.json;
    var recipeData = createInstantData(json, recipe);

    if (recipeData.outputItem && recipeData.outputItem.modifiers) {
        data.stats.skipped++;
        return;
    }

    var multiplier = calculateMaxMultiplier(recipeData, data);
    if (multiplier < 1) return;

    var ingredients = buildIngredients(recipeData.inputItem, recipeData.inputFluid, multiplier);
    var results = buildResults(recipeData.outputItem, recipeData.outputFluid, multiplier);

    if (results.length === 0 || ingredients.length === 0) {
        data.stats.skipped++;
        return;
    }

    data.event.recipes.create.mixing(results, ingredients, data.PROCESSING_TIME)
        .id('kubejs:tfc_barrel_instant/mixing/' + multiplier + '_' + recipe.getId().replace(':', '_'));

    data.stats.instant++;
}

/**
 * 处理单个 tfc:barrel_instant_fluid 配方 → Create Mixing
 *   纯流体混合：两路流体输入 → 一路流体输出
 * @param {Object} data - 转换上下文
 * @param {Internal.Recipe} recipe - TFC配方
 */
function processInstantFluidRecipe(data, recipe) {
    var json = recipe.json;
    var recipeData = createInstantFluidData(json, recipe);

    var primaryAmt = recipeData.primaryFluid ? recipeData.primaryFluid.amount : 0;
    var addedAmt = recipeData.addedFluid ? recipeData.addedFluid.amount : 0;
    var outputAmt = recipeData.outputFluid ? recipeData.outputFluid.amount : 0;

    if (primaryAmt <= 0 || addedAmt <= 0 || outputAmt <= 0) {
        data.stats.skipped++;
        return;
    }

    var multiplier = Math.floor(data.FLUID_SLOT_LIMIT / Math.max(primaryAmt, addedAmt, outputAmt));
    if (multiplier < 1) return;

    var primaryId = recipeData.primaryFluid.fluid;
    var addedId = recipeData.addedFluid.fluid;
    var outputId = recipeData.outputFluid.id || recipeData.outputFluid.fluid;

    if (!primaryId || !addedId || !outputId) {
        data.stats.skipped++;
        return;
    }

    try {
        Fluid.of(primaryId, primaryAmt);
        Fluid.of(addedId, addedAmt);
        Fluid.of(outputId, outputAmt);
    } catch (e) {
        data.stats.skipped++;
        return;
    }

    var ingredients = [
        Fluid.of(primaryId, primaryAmt * multiplier),
        Fluid.of(addedId, addedAmt * multiplier)
    ];

    var results = [
        Fluid.of(outputId, outputAmt * multiplier)
    ];

    data.event.recipes.create.mixing(results, ingredients, data.PROCESSING_TIME)
        .id('kubejs:tfc_barrel_instant_fluid/mixing/' + multiplier + '_' + recipe.getId().replace(':', '_'));

    data.stats.instantFluid++;
}

ServerEvents.recipes(function(event) {
    var data = createConverterData(event);

    event.forEachRecipe({ type: 'tfc:barrel_instant' }, function(recipe) {
        processInstantRecipe(data, recipe);
    });

    event.forEachRecipe({ type: 'tfc:barrel_instant_fluid' }, function(recipe) {
        processInstantFluidRecipe(data, recipe);
    });

    console.info('[生物柴油修复] barrel_instant→mixing 转换完成: instant=' + data.stats.instant + ', instant_fluid=' + data.stats.instantFluid + ', skipped=' + data.stats.skipped);
});