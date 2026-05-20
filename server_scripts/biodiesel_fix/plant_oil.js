// ============================================================================
// 植物油标签扩展与 Create Compacting 榨油配方
// ============================================================================

// ---------------------------------------------------------------------------
// 1. 扩展 c:plantoil 标签，将 TFC 和 Firmalife 的油类加入
// ---------------------------------------------------------------------------
ServerEvents.tags('minecraft:fluid', event => {
    event.add('c:plantoil', [
        'tfc:olive_oil',
        'tfc:canola_oil',
        'firmalife:soybean_oil'
    ]);
});

// ---------------------------------------------------------------------------
// 2. 创建 Create Compacting 榨油配方
// ---------------------------------------------------------------------------
ServerEvents.recipes(event => {
    // 橄榄 → 橄榄油: 10个橄榄压榨出800mB橄榄油
    // 注意：橄榄会腐败，使用 TFC.ingredient.and() 组合 notRotten 限制非腐败输入
    event.recipes.create.compacting(
        [Fluid.of('tfc:olive_oil', 800)],
        [
            TFC.ingredient.and(Ingredient.of('tfc:food/olive'), TFC.ingredient.notRotten()).withCount(10)
        ]
    ).id('kubejs:compacting/createdieselgenerators/tfc_olive/olive_oil');

    // 油菜种子 → 菜籽油: 10个油菜种子压榨出800mB菜籽油
    event.recipes.create.compacting(
        [Fluid.of('tfc:canola_oil', 800)],
        [
            Ingredient.of('tfc:seeds/canola').withCount(10)
        ]
    ).id('kubejs:compacting/createdieselgenerators/tfc_canola/canola_oil');

    // 脱水大豆 → 大豆油: 4个脱水大豆压榨出1000mB大豆油
    // 脱水大豆会腐败，使用 TFC.ingredient.and() 组合 notRotten 限制非腐败输入
    event.recipes.create.compacting(
        [Fluid.of('firmalife:soybean_oil', 1000)],
        [
            TFC.ingredient.and(Ingredient.of('firmalife:food/dehydrated_soybeans'), TFC.ingredient.notRotten()).withCount(4)
        ]
    ).id('kubejs:compacting/createdieselgenerators/firmalife_soybean/soybean_oil');

    console.info('[植物油] 榨油配方注册完成');
});
