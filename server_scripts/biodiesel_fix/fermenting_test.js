// ============================================================================
// 测试脚本：真正创建配方，测试完整方案
// ============================================================================

ServerEvents.recipes(function(event) {
    console.info('[测试] 开始测试4个示例配方（真正创建配方）...');
    
    var stats = { basin: 0, bulk: 0, skipped: 0 };
    var FLUID_SLOT_LIMIT = 1000;
    
    // ============================================================================
    // 工具函数
    // ============================================================================

    // 计算 basin 倍率：受限的物品堆叠数和流体<1000的同步物体与流体倍率
    function calculateBasinMultiplier(inputItem, inputFluid, outputItem, outputFluid) {
        var maxMult = Infinity;

        // 输入物品堆叠限制
        if (inputItem) {
            var itemCount = inputItem.count || 1;
            var itemId = inputItem.item || inputItem.tag;
            if (itemId) {
                try {
                    var maxStack = 64; // 默认值
                    if (inputItem.tag) {
                        var items = Ingredient.of('#' + inputItem.tag).items;
                        if (items && items.length > 0) {
                            maxStack = items[0].getMaxStackSize();
                        }
                    } else {
                        maxStack = Item.of(itemId, 1).getMaxStackSize();
                    }
                    maxMult = Math.min(maxMult, maxStack / itemCount);
                } catch (e) {
                    maxMult = Math.min(maxMult, 64 / itemCount);
                }
            }
        }

        // 输出物品堆叠限制
        if (outputItem) {
            var itemCount = outputItem.count || 1;
            var itemId = outputItem.id || outputItem.item;
            if (itemId) {
                try {
                    var maxStack = Item.of(itemId, 1).getMaxStackSize();
                    maxMult = Math.min(maxMult, maxStack / itemCount);
                } catch (e) {
                    maxMult = Math.min(maxMult, 64 / itemCount);
                }
            }
        }

        // 输入流体限制（必须 < 1000）
        if (inputFluid && inputFluid.amount > 0) {
            maxMult = Math.min(maxMult, 1000 / inputFluid.amount);
        }

        // 输出流体限制（必须 < 1000）
        if (outputFluid && outputFluid.amount > 0) {
            maxMult = Math.min(maxMult, 1000 / outputFluid.amount);
        }

        return Math.floor(maxMult);
    }

    function buildBasinIngredients(inputItem, inputFluid, multiplier) {
        var ingredients = [];

        if (inputItem && multiplier > 0) {
            for (var i = 0; i < multiplier; i++) {
                if (inputItem.item) {
                    ingredients.push({ item: inputItem.item });
                } else if (inputItem.tag) {
                    ingredients.push({ tag: inputItem.tag });
                }
            }
        }

        if (inputFluid && multiplier > 0) {
            var fluidAmount = inputFluid.amount * multiplier;
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

    function buildBasinResults(outputItem, outputFluid, multiplier) {
        var results = [];

        if (outputItem && multiplier > 0) {
            var itemId = outputItem.id || outputItem.item;
            if (itemId) {
                var singleResult = { id: itemId };
                var outputCount = (outputItem.count || 1) * multiplier;
                if (outputCount > 1) {
                    singleResult.count = outputCount;
                }
                results.push(singleResult);
            }
        }

        if (outputFluid && outputFluid.amount > 0 && multiplier > 0) {
            var fluidId = outputFluid.id || outputFluid.fluid;
            if (fluidId) {
                var fluidAmount = outputFluid.amount * multiplier;
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

    function buildBulkIngredients(inputItem, inputFluid, bulkParams) {
        var ingredients = [];

        if (inputItem) {
            var itemMult = bulkParams.itemMultiplier;
            for (var i = 0; i < itemMult; i++) {
                if (inputItem.item) {
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
    // 测试用例1：FirmaLife 奶酪
    // ============================================================================
    console.info('--- 测试1：FirmaLife 奶酪 ---');

    var test1 = {
        recipeId: 'firmalife:barrel/cheese',
        duration: 1000,
        input_item: { count: 1, item: 'firmalife:cheesecloth' },
        input_fluid: { amount: 1000, tag: 'firmalife:milks' },
        output_item: { count: 1, id: 'firmalife:cheesecloth' },
        output_fluid: { amount: 1000, id: 'firmalife:cream' }
    };

    // Basin倍率计算：min(64/1, 64/1, 1000/1000, 1000/1000) = 1
    var basinMult1 = calculateBasinMultiplier(test1.input_item, test1.input_fluid, test1.output_item, test1.output_fluid);
    console.info('[测试1] Basin倍率: ' + basinMult1);

    var bulkParams1 = {
        itemMultiplier: 9,
        fluidMultiplier: 9,
        fluidAddition: 0
    };

    // Basin Fermenting（同步倍率）
    var ingredients1_basin = buildBasinIngredients(test1.input_item, test1.input_fluid, basinMult1);
    var results1_basin = buildBasinResults(test1.output_item, test1.output_fluid, basinMult1);

    event.custom({
        type: 'createdieselgenerators:basin_fermenting',
        ingredients: ingredients1_basin,
        processing_time: Math.max(100, Math.round(test1.duration / 5)),
        results: results1_basin
    }).id('kubejs:test/basin/firmalife_barrel_cheese');

    stats.basin++;
    console.info('[测试] 创建 Basin: ' + test1.recipeId);
    console.info('  BasinMultiplier: ' + basinMult1);
    console.info('  Ingredients: ' + JSON.stringify(ingredients1_basin));
    console.info('  Results: ' + JSON.stringify(results1_basin));

    // Bulk Fermenting
    var ingredients1_bulk = buildBulkIngredients(test1.input_item, test1.input_fluid, bulkParams1);
    var results1_bulk = buildBulkResults(test1.output_item, test1.output_fluid, bulkParams1);

    event.custom({
        type: 'createdieselgenerators:bulk_fermenting',
        ingredients: ingredients1_bulk,
        processing_time: Math.max(100, Math.round(test1.duration / 4)),
        results: results1_bulk
    }).id('kubejs:test/bulk/firmalife_barrel_cheese');

    stats.bulk++;
    console.info('[测试] 创建 Bulk: ' + test1.recipeId);
    console.info('  BulkParams: ' + JSON.stringify(bulkParams1));
    console.info('  Ingredients: ' + JSON.stringify(ingredients1_bulk));
    console.info('  Results: ' + JSON.stringify(results1_bulk));
    
    // ============================================================================
    // 测试用例2：陈酿玉米威士忌
    // ============================================================================
    console.info('--- 测试2：陈酿玉米威士忌 ---');

    var test2 = {
        recipeId: 'tfc:barrel/aged_corn_whiskey',
        duration: 691200,
        input_fluid: { fluid: 'tfc:corn_whiskey', amount: 10000 },
        output_fluid: { id: 'tfcagedalcohol:aged_corn_whiskey', amount: 10000 }
    };

    // Basin倍率计算：min(1000/10000, 1000/10000) = 0.1 → floor = 0
    var basinMult2 = calculateBasinMultiplier(null, test2.input_fluid, null, test2.output_fluid);
    console.info('[测试2] Basin倍率: ' + basinMult2);

    var bulkParams2 = {
        itemMultiplier: 1,
        fluidMultiplier: 3.6,
        fluidAddition: 0
    };

    // Basin Fermenting（倍率为0，不创建）
    if (basinMult2 > 0) {
        var ingredients2_basin = buildBasinIngredients(null, test2.input_fluid, basinMult2);
        var results2_basin = buildBasinResults(null, test2.output_fluid, basinMult2);

        event.custom({
            type: 'createdieselgenerators:basin_fermenting',
            ingredients: ingredients2_basin,
            processing_time: Math.max(100, Math.round(test2.duration / 5)),
            results: results2_basin
        }).id('kubejs:test/basin/tfc_barrel_aged_corn_whiskey');

        stats.basin++;
        console.info('[测试] 创建 Basin: ' + test2.recipeId);
        console.info('  BasinMultiplier: ' + basinMult2);
    } else {
        console.info('[测试] Basin倍率=0，跳过创建 Basin');
    }

    // Bulk Fermenting
    var ingredients2_bulk = buildBulkIngredients(null, test2.input_fluid, bulkParams2);
    var results2_bulk = buildBulkResults(null, test2.output_fluid, bulkParams2);

    event.custom({
        type: 'createdieselgenerators:bulk_fermenting',
        ingredients: ingredients2_bulk,
        processing_time: Math.max(100, Math.round(test2.duration / 4)),
        results: results2_bulk
    }).id('kubejs:test/bulk/tfc_barrel_aged_corn_whiskey');

    stats.bulk++;
    console.info('[测试] 创建 Bulk: ' + test2.recipeId);
    console.info('  BulkParams: ' + JSON.stringify(bulkParams2));
    console.info('  Ingredients: ' + JSON.stringify(ingredients2_bulk));
    console.info('  Results: ' + JSON.stringify(results2_bulk));
    
    // ============================================================================
    // 测试用例3：black_wool（无流体输出，需返还染料）
    // ============================================================================
    console.info('--- 测试3：black_wool ---');

    var test3 = {
        recipeId: 'tfc:barrel/black_wool',
        duration: 1200,
        input_item: { count: 1, item: 'minecraft:white_wool' },
        input_fluid: { fluid: 'tfc:black_dye', amount: 25 },
        output_item: { count: 1, id: 'minecraft:black_wool' }
    };

    // Basin倍率计算：min(64/1, 1000/25) = 40
    var basinMult3 = calculateBasinMultiplier(test3.input_item, test3.input_fluid, test3.output_item, null);
    console.info('[测试3] Basin倍率: ' + basinMult3);

    // 计算返还量：25 * 9 = 225, 1000 - 225 = 775
    var bulkParams3 = {
        itemMultiplier: 9,
        fluidMultiplier: 9,
        fluidAddition: 775
    };

    // 创建虚拟输出流体（用于buildBulkResults处理返还）
    var virtualOutputFluid3 = { id: 'tfc:black_dye', amount: 0 };

    // Basin Fermenting（无返还逻辑，因为 basin 倍率是受限计算出来的）
    var ingredients3_basin = buildBasinIngredients(test3.input_item, test3.input_fluid, basinMult3);
    var results3_basin = buildBasinResults(test3.output_item, null, basinMult3);

    if (results3_basin.length > 0 && ingredients3_basin.length > 0) {
        event.custom({
            type: 'createdieselgenerators:basin_fermenting',
            ingredients: ingredients3_basin,
            processing_time: Math.max(100, Math.round(test3.duration / 5)),
            results: results3_basin
        }).id('kubejs:test/basin/tfc_barrel_black_wool');

        stats.basin++;
        console.info('[测试] 创建 Basin: ' + test3.recipeId);
        console.info('  BasinMultiplier: ' + basinMult3);
        console.info('  Ingredients: ' + JSON.stringify(ingredients3_basin));
        console.info('  Results: ' + JSON.stringify(results3_basin));
    }

    // Bulk Fermenting（有返还逻辑）
    var ingredients3_bulk = buildBulkIngredients(test3.input_item, test3.input_fluid, bulkParams3);
    var results3_bulk = buildBulkResults(test3.output_item, virtualOutputFluid3, bulkParams3);

    event.custom({
        type: 'createdieselgenerators:bulk_fermenting',
        ingredients: ingredients3_bulk,
        processing_time: Math.max(100, Math.round(test3.duration / 4)),
        results: results3_bulk
    }).id('kubejs:test/bulk/tfc_barrel_black_wool');

    stats.bulk++;
    console.info('[测试] 创建 Bulk: ' + test3.recipeId);
    console.info('  BulkParams: ' + JSON.stringify(bulkParams3));
    console.info('  Ingredients: ' + JSON.stringify(ingredients3_bulk));
    console.info('  Results: ' + JSON.stringify(results3_bulk));
    
    // ============================================================================
    // 测试用例4：mortar（特殊配方）
    // ============================================================================
    console.info('--- 测试4：mortar ---');

    var test4 = {
        recipeId: 'tfc:barrel/mortar',
        duration: 7200,
        input_item: { count: 1, tag: 'c:sands' },
        input_fluid: { fluid: 'tfc:limewater', amount: 100 },
        output_item: { count: 16, id: 'tfc:mortar' }
    };

    // Basin倍率计算：min(64/1, 64/16, 1000/100) = 4
    var basinMult4 = calculateBasinMultiplier(test4.input_item, test4.input_fluid, test4.output_item, null);
    console.info('[测试4] Basin倍率: ' + basinMult4);

    var bulkParams4 = {
        itemMultiplier: 6,
        fluidMultiplier: 6,
        fluidAddition: 0
    };

    // Basin Fermenting（倍率4，是受限计算得出的）
    var ingredients4_basin = buildBasinIngredients(test4.input_item, test4.input_fluid, basinMult4);
    var results4_basin = buildBasinResults(test4.output_item, null, basinMult4);

    if (results4_basin.length > 0 && ingredients4_basin.length > 0) {
        event.custom({
            type: 'createdieselgenerators:basin_fermenting',
            ingredients: ingredients4_basin,
            processing_time: Math.max(100, Math.round(test4.duration / 5)),
            results: results4_basin
        }).id('kubejs:test/basin/tfc_barrel_mortar');

        stats.basin++;
        console.info('[测试] 创建 Basin: ' + test4.recipeId);
        console.info('  BasinMultiplier: ' + basinMult4);
        console.info('  Ingredients: ' + JSON.stringify(ingredients4_basin));
        console.info('  Results: ' + JSON.stringify(results4_basin));
    }

    // Bulk Fermenting（特殊倍率6）
    var ingredients4_bulk = buildBulkIngredients(test4.input_item, test4.input_fluid, bulkParams4);
    var results4_bulk = buildBulkResults(test4.output_item, null, bulkParams4);
    
    event.custom({
        type: 'createdieselgenerators:bulk_fermenting',
        ingredients: ingredients4_bulk,
        processing_time: Math.max(100, Math.round(test4.duration / 4)),
        results: results4_bulk
    }).id('kubejs:test/bulk/tfc_barrel_mortar');
    
    stats.bulk++;
    console.info('[测试] 创建 Bulk: ' + test4.recipeId);
    console.info('  BulkParams: ' + JSON.stringify(bulkParams4));
    console.info('  Ingredients: ' + JSON.stringify(ingredients4_bulk));
    console.info('  Results: ' + JSON.stringify(results4_bulk));
    
    // ============================================================================
    // 完成
    // ============================================================================
    console.info('[测试] 完成！Basin: ' + stats.basin + ', Bulk: ' + stats.bulk);
});
