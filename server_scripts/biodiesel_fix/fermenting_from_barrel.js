// ============================================================================
// 批量从TFC密封大桶配方创建Create发酵配方
// ============================================================================

ServerEvents.recipes(event => {
    console.info('[生物柴油修复] 开始批量转换TFC密封大桶配方为Create发酵配方...');
    
    let convertedCount = 0;
    let skippedCount = 0;
    
    event.forEachRecipe({ type: 'tfc:barrel_sealed' }, recipe => {
        const json = recipe.json;
        
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
        
        // 检查输入物品堆叠数量
        if (inputItem) {
            let itemId = inputItem.item || inputItem.tag;
            if (itemId) {
                let count = inputItem.count || 1;
                try {
                    let maxStack;
                    if (inputItem.tag) {
                        let tagItems = Ingredient.of(`#${inputItem.tag}`).items;
                        if (tagItems && tagItems.length > 0) {
                            let minStack = tagItems[0].maxStack;
                            for (let i = 1; i < tagItems.length; i++) {
                                if (tagItems[i].maxStack < minStack) {
                                    minStack = tagItems[i].maxStack;
                                }
                            }
                            maxStack = minStack;
                        }
                    } else {
                        maxStack = Item.of(itemId, 1).items[0].maxStack;
                    }
                    if (maxStack && count > maxStack) {
                        skippedCount++;
                        return;
                    }
                } catch (e) {
                    if (count > 64) {
                        skippedCount++;
                        return;
                    }
                }
            }
        }
        
        // 检查输出物品堆叠数量
        if (outputItem) {
            let outputId = outputItem.id || outputItem.item;
            if (outputId) {
                let count = outputItem.count || 1;
                try {
                    let maxStack = Item.of(outputId, 1).items[0].maxStack;
                    if (maxStack && count > maxStack) {
                        skippedCount++;
                        return;
                    }
                } catch (e) {
                    if (count > 64) {
                        skippedCount++;
                        return;
                    }
                }
            }
        }
        
        // 检查流体量
        if (inputFluid && inputFluid.amount > 1000) {
            skippedCount++;
            return;
        }
        if (outputFluid && outputFluid.amount > 1000) {
            skippedCount++;
            return;
        }
        
        // 跳过modifiers
        if (outputItem && outputItem.modifiers) {
            skippedCount++;
            return;
        }
        
        let sealTime = json.has('seal_time') ? json.get('seal_time').getAsInt() : 0;
        let ingredients = [];
        let results = [];
        
        // 添加输入物品
        if (inputItem) {
            if (inputItem.type === 'tfc:and' && inputItem.children) {
                let count = inputItem.count || 1;
                for (let i = 0; i < count; i++) {
                    ingredients.push({
                        type: 'tfc:and',
                        children: inputItem.children
                    });
                }
            } else {
                let itemId = inputItem.item || inputItem.tag;
                if (itemId && typeof itemId === 'string' && itemId.includes('food/')) {
                    let count = inputItem.count || 1;
                    for (let i = 0; i < count; i++) {
                        ingredients.push({
                            type: 'tfc:and',
                            children: [
                                inputItem.item ? { item: inputItem.item } : { tag: inputItem.tag },
                                { type: 'tfc:not_rotten' }
                            ]
                        });
                    }
                } else {
                    let count = inputItem.count || 1;
                    if (inputItem.item) {
                        for (let i = 0; i < count; i++) {
                            ingredients.push({ item: inputItem.item });
                        }
                    } else if (inputItem.tag) {
                        for (let i = 0; i < count; i++) {
                            ingredients.push({ tag: inputItem.tag });
                        }
                    }
                }
            }
        }
        
        // 添加输入流体
        if (inputFluid) {
            if (inputFluid.fluid && inputFluid.amount > 0) {
                ingredients.push({
                    type: 'fluid_stack',
                    fluid: inputFluid.fluid,
                    amount: inputFluid.amount
                });
            } else if (inputFluid.tag && inputFluid.amount > 0) {
                ingredients.push({
                    type: 'fluid_tag',
                    fluid_tag: inputFluid.tag,
                    amount: inputFluid.amount
                });
            }
        }
        
        // 添加输出物品
        if (outputItem) {
            let itemId = outputItem.id || outputItem.item;
            if (itemId) {
                let singleResult = { id: itemId };
                if (outputItem.count && outputItem.count > 1) {
                    singleResult.count = outputItem.count;
                }
                if (outputItem.chance) {
                    singleResult.chance = outputItem.chance;
                }
                results.push(singleResult);
            }
        }
        
        // 添加输出流体
        if (outputFluid) {
            let fluidId = outputFluid.id || outputFluid.fluid;
            if (fluidId && outputFluid.amount > 0) {
                results.push({
                    id: fluidId,
                    amount: outputFluid.amount
                });
            }
        }
        
        let processingTime = Math.max(100, Math.round(sealTime / 5));
        
        if (results.length > 0 && ingredients.length > 0) {
            event.custom({
                type: 'createdieselgenerators:basin_fermenting',
                ingredients: ingredients,
                processing_time: processingTime,
                results: results
            }).id(`kubejs:tfc_barrel_sealed/${recipe.getId().replace(':', '_')}`);
            convertedCount++;
        } else {
            skippedCount++;
        }
    });
    
    console.info(`[生物柴油修复] 完成！共转换 ${convertedCount} 个配方，跳过 ${skippedCount} 个`);
});
