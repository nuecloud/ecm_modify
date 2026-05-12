ServerEvents.recipes(event => {
    let recipeCounter = 0 // 提示配方ID重复，所以额外加入计数器来防止配方ID重复
    
    event.forEachRecipe({ type: 'tfc:heating' }, recipe => {
        const json = recipe.json
        if (!json.has('result_fluid')) return
        
        const resultFluid = json.get('result_fluid')
        const ingredient = json.get('ingredient')
        const ingredientArray = ingredient.isJsonArray() 
            ? JSON.parse(ingredient.toString())
            : [JSON.parse(ingredient.toString())]
        
        const allValid = ingredientArray.every(ing => {
            if (ing.item) {
                return Item.exists(ing.item)
            }
            if (ing.tag) {
                return !Ingredient.of(`#${ing.tag}`).isEmpty()
            }
            return false
        })
        
        if (!allValid) return
        
        const temperature = json.has('temperature') ? json.get('temperature').getAsFloat() : 0
        const heatRequirement = temperature > 1080 ? 'superheated' : 'heated'
        
        // 基准 1080°C → 20s (400 tick)，1500°C → 30s (600 tick)，线性插值
        // 斜率: (600-400) / (1500-1080) ≈ 0.476 tick/°C
        const processingTime = Math.round(400 + (temperature - 1080) * (200 / 420))
        
        // 生成唯一的配方 ID
        const inputKey = ingredientArray.map(ing => {
            if (ing.item) {
                return `item/${ing.item.replace(':', '/')}`
            }
            if (ing.tag) {
                return `tag/${ing.tag.replace(':', '/')}`
            }
            return 'unknown'
        }).join('_')
        
        const fluidId = resultFluid.get('id').getAsString().replace(':', '/')
        const recipeId = `kubejs:createbigcannons/melting/${fluidId}/${inputKey}_${recipeCounter++}`
        
        // =====================================================================
        // 机械动力冲压板与TFC锻造薄板修复
        // 替换标签，确保只使用TFC锻造板而不混用Create冲压板
        // =====================================================================
        // 替换c:sheets/*标签为kubejs:tfc_single_sheets/*
        // 替换c:double_sheets/*标签为kubejs:tfc_double_sheets/*
        ingredientArray.forEach(ing => {
            if (ing.tag) {
                if (ing.tag.startsWith('c:sheets/')) {
                    ing.tag = ing.tag.replace('c:sheets/', 'kubejs:tfc_single_sheets/')
                } else if (ing.tag.startsWith('c:double_sheets/')) {
                    ing.tag = ing.tag.replace('c:double_sheets/', 'kubejs:tfc_double_sheets/')
                }
            }
        })
        event.custom({
            type: 'createbigcannons:melting',
            heat_requirement: heatRequirement,
            ingredients: ingredientArray,
            processing_time: processingTime,
            results: [{
                amount: resultFluid.get('amount').getAsInt(),
                id: resultFluid.get('id').getAsString()
            }]
        }).id(recipeId)
    })
})