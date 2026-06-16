ServerEvents.recipes(event => {
    event.recipes.create.mixing(
        [Item.of('tfc:mortar', 64)],
        [Ingredient.of('#c:sands', 4), Fluid.of('tfc:limewater', 400)]
    ).id('kubejs:tfc_barrel_sealed/mixing/mortar')
})
