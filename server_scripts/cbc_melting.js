ServerEvents.recipes(event => {
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

        event.custom({
            type: 'createbigcannons:melting',
            heat_requirement: heatRequirement,
            ingredients: ingredientArray,
            processing_time: processingTime,
            results: [{
                amount: resultFluid.get('amount').getAsInt(),
                id: resultFluid.get('id').getAsString()
            }]
        })
    })
})