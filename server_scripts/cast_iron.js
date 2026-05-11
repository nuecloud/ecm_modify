ServerEvents.recipes(event => {

    // 阶段 1: 流体 + 木炭粉 + 模具 → TFC 生铁方坯
    event.recipes.create.mixing(
        [CreateItem.of('tfc:raw_iron_bloom')],
        [Fluid.of('tfc:metal/cast_iron', 100), '6x tfc:powder/charcoal']
    ).processingTime(6000).superheated()

    // 阶段 2: 生铁方坯 → 精铁方坯（5 次压力机）
    event.recipes.create.sequenced_assembly(
        [CreateItem.of('tfc:refined_iron_bloom', 1.0)],
        'tfc:raw_iron_bloom',
        [event.recipes.create.pressing('tfc:raw_iron_bloom', 'tfc:raw_iron_bloom')]
    ).transitionalItem('tfc:raw_iron_bloom').loops(5)

    // 阶段 3: 精铁方坯 → 锻铁锭（5 次压力机）
    event.recipes.create.sequenced_assembly(
        [CreateItem.of('tfc:metal/ingot/wrought_iron', 1.0)],
        'tfc:refined_iron_bloom',
        [event.recipes.create.pressing('tfc:refined_iron_bloom', 'tfc:refined_iron_bloom')]
    ).transitionalItem('tfc:refined_iron_bloom').loops(10)
})