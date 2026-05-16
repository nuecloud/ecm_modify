// ============================================================================
// 批量从TFC密封大桶配方创建Create发酵配方
// ============================================================================
// 
// 功能说明：
// - 遍历所有 TFC 密封大桶配方 (tfc:barrel_sealed)
// - 将其转换为 Create Diesel Generators 的 Basin Fermenting 配方
// - 自动计算配方倍增倍数，实现高吞吐单次发酵
//
// 核心技术难点与解决方案：
// ----------------------------------------------------------------------------
// 问题：TFC 的 tfc:not_rotten 条件只能在 TFC 配方系统中解析
// 当在 Create 配方中使用 { type: 'tfc:and', children: [...] } 结构时，
// 无法通过设置 count 属性实现数量倍增（会导致 JSON 解析错误）
//
// 解决方案：用数组重复代替 count 属性倍增
// - 对于普通物品：重复 { item: 'xxx' } N 次
// - 对于带条件的物品：重复 { type: 'tfc:and', children: [...] } N 次
// - 流体和输出仍使用 amount/count 属性倍增（它们不受此限制）
// ----------------------------------------------------------------------------
//
// 倍增倍数计算规则：
// 1. 输入物品：maxStack / count
// 2. 输出物品：maxStack / count  
// 3. 输入流体：1000 / amount（Basin 流体槽容量）
// 4. 输出流体：1000 / amount
// 取以上最小值作为 maxMultiplier，向下取整后使用
// ============================================================================

ServerEvents.recipes(event => {
    console.info('[生物柴油修复] 开始批量转换TFC密封大桶配方为Create发酵配方...');
    
    let convertedCount = 0;  // 成功转换的配方数
    let skippedCount = 0;    // 跳过的配方数
    
    // 遍历所有 TFC 密封大桶配方
    event.forEachRecipe({ type: 'tfc:barrel_sealed' }, recipe => {
        const json = recipe.json;
        
        // 1. 提取配方的输入输出数据
        let inputItem = null;
        if (json.has('input_item')) {
            inputItem = JSON.parse(json.get('input_item').toString());
        }
        
        let inputFluid = null;
        if (json.has('input_fluid')) {
            inputFluid = JSON.parse(json.get('input_fluid').toString());
        }
        
        let outputItem = null;
        if (json.has('output_item')) {
            outputItem = JSON.parse(json.get('output_item').toString());
        }
        
        let outputFluid = null;
        if (json.has('output_fluid')) {
            outputFluid = JSON.parse(json.get('output_fluid').toString());
        }
        
        // 2. 计算最大倍增倍数 maxMultiplier
        const FLUID_SLOT_LIMIT = 1000;  // Basin 流体槽最大容量
        let maxMultiplier = Infinity;   // 初始值设为无穷大
        
        // 2.1 根据输入物品堆叠限制计算
        if (inputItem) {
            let itemId = inputItem.item || inputItem.tag;
            if (itemId) {
                let count = inputItem.count || 1;
                try {
                    let maxStack;
                    if (inputItem.tag) {
                        // 处理标签类型，取标签中堆叠最小的物品
                        let tagItems = Ingredient.of(`#${inputItem.tag}`).items;
                        if (tagItems && tagItems.length > 0) {
                            let minStack = tagItems[0].getMaxStackSize();
                            for (let i = 1; i < tagItems.length; i++) {
                                if (tagItems[i].getMaxStackSize() < minStack) {
                                    minStack = tagItems[i].getMaxStackSize();
                                }
                            }
                            maxStack = minStack;
                        }
                    } else {
                        // 处理单个物品
                        maxStack = Item.of(itemId, 1).getMaxStackSize();
                    }
                    if (maxStack) {
                        maxMultiplier = Math.min(maxMultiplier, maxStack / count);
                    }
                } catch (e) {
                    // 获取失败时使用默认值 64
                    maxMultiplier = Math.min(maxMultiplier, 64 / count);
                }
            }
        }

        // 2.2 根据输出物品堆叠限制计算
        if (outputItem) {
            let outputId = outputItem.id || outputItem.item;
            if (outputId) {
                let count = outputItem.count || 1;
                try {
                    let maxStack = Item.of(outputId, 1).getMaxStackSize();
                    if (maxStack) {
                        maxMultiplier = Math.min(maxMultiplier, maxStack / count);
                    }
                } catch (e) {
                    maxMultiplier = Math.min(maxMultiplier, 64 / count);
                }
            }
        }

        // 2.3 根据输入流体限制计算
        if (inputFluid && inputFluid.amount > 0) {
            maxMultiplier = Math.min(maxMultiplier, FLUID_SLOT_LIMIT / inputFluid.amount);
        }

        // 2.4 根据输出流体限制计算
        if (outputFluid && outputFluid.amount > 0) {
            maxMultiplier = Math.min(maxMultiplier, FLUID_SLOT_LIMIT / outputFluid.amount);
        }

        // 3. 确定最终倍增倍数（向下取整）
        let flooredMultiplier = Math.floor(maxMultiplier);

        // 4. 过滤条件检查
        // 4.1 倍数小于1则跳过（无法倍增）
        if (flooredMultiplier < 1) {
            skippedCount++;
            return;
        }
        
        // 4.2 跳过带有 modifiers 的配方（复杂逻辑暂不处理）
        if (outputItem && outputItem.modifiers) {
            skippedCount++;
            return;
        }
        
        // 5. 构建新配方的 ingredients 和 results
        let sealTime = json.has('seal_time') ? json.get('seal_time').getAsInt() : 0;
        let ingredients = [];
        let results = [];
        
        // 5.1 添加输入物品（核心：用数组重复实现倍增）
        if (inputItem) {
            if (inputItem.type === 'tfc:and' && inputItem.children) {
                // 情况A：原始配方已有 tfc:and 结构（如带 not_rotten 条件的食物）
                // 直接重复整个 tfc:and 对象 N 次（保留原始条件）
                for (let i = 0; i < flooredMultiplier; i++) {
                    ingredients.push({
                        type: 'tfc:and',
                        children: inputItem.children
                    });
                }
            } else {
                // 情况B：普通物品（包括食物类但没有显式 not_rotten 条件的）
                // 直接重复 N 次，不添加额外条件（尊重原始配方意图）
                for (let i = 0; i < flooredMultiplier; i++) {
                    if (inputItem.item) {
                        ingredients.push({ item: inputItem.item });
                    } else if (inputItem.tag) {
                        ingredients.push({ tag: inputItem.tag });
                    }
                }
            }
        }
        
        // 5.2 添加输入流体（用 amount 属性倍增）
        if (inputFluid) {
            let amount = inputFluid.amount * flooredMultiplier;
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
        
        // 5.3 添加输出物品（用 count 属性倍增）
        if (outputItem) {
            let itemId = outputItem.id || outputItem.item;
            if (itemId) {
                let singleResult = { id: itemId };
                let outputCount = (outputItem.count || 1) * flooredMultiplier;
                if (outputCount > 1) {
                    singleResult.count = outputCount;
                }
                if (outputItem.chance) {
                    singleResult.chance = outputItem.chance;
                }
                results.push(singleResult);
            }
        }

        // 5.4 添加输出流体（用 amount 属性倍增）
        if (outputFluid) {
            let fluidId = outputFluid.id || outputFluid.fluid;
            if (fluidId && outputFluid.amount > 0) {
                results.push({
                    id: fluidId,
                    amount: outputFluid.amount * flooredMultiplier
                });
            }
        }
        
        // 6. 计算处理时间（转换 TFC 时间单位到 Create 时间单位）
        let processingTime = Math.max(100, Math.round(sealTime / 5));
        let multStr = flooredMultiplier.toString();

        // 7. 创建并注册新配方
        if (results.length > 0 && ingredients.length > 0) {
            event.custom({
                type: 'createdieselgenerators:basin_fermenting',
                ingredients: ingredients,
                processing_time: processingTime,
                results: results
            }).id(`kubejs:tfc_barrel_sealed/${multStr}_${recipe.getId().replace(':', '_')}`);
            convertedCount++;
        } else {
            skippedCount++;
        }
    });
    
    // 输出统计信息
    console.info(`[生物柴油修复] 完成！共转换 ${convertedCount} 个配方，跳过 ${skippedCount} 个`);
});
