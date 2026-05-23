ServerEvents.recipes(event => {
  event.shapeless(Item.of('create:andesite_alloy', 8),
    [
      '#c:cobblestones',
      '#c:ingots/zinc'
    ]
  )
  event.shapeless(Item.of('create:andesite_alloy', 8),
    [
      '#c:cobblestones',
      '#c:ingots/iron'
    ]
  )

  event.replaceInput(
    { input: 'minecraft:slime_ball' },
    'minecraft:slime_ball',
    'tfc:glue'
  )

  //metal
  event.replaceInput(
    { input: 'minecraft:iron_ingot' },
    'minecraft:iron_ingot',
    '#c:ingots/wrought_iron'
  )
  event.replaceOutput(
    { output: 'minecraft:iron_ingot' },
    'minecraft:iron_ingot',
    'tfc:metal/ingot/wrought_iron'
  )
  event.remove({ output: 'minecraft:iron_ingot' })
  event.remove({ output: 'minecraft:gold_ingot' })
  event.remove({ output: 'minecraft:gold_block' })
  event.remove({ output: 'create:brass_block' })

  event.recipes.tfc.heating(
    'minecraft:iron_nugget',
    1500
  ).fluidOutput(Fluid.of('tfc:metal/cast_iron', 10))
  event.recipes.tfc.heating(
    'minecraft:iron_block',
    1500
  ).fluidOutput(Fluid.of('tfc:metal/cast_iron', 900))


  // 将 mod 配方中的原版高炉替换为 TFC firebox（造价更低）
  event.replaceInput(
    { input: 'minecraft:blast_furnace' },
    'minecraft:blast_furnace',
    'tfc:firebox'
  )

  // create blaze_burner - 使用 tfc:firebox 替代昂贵的 tfc:blast_furnace
  event.shaped(
    Item.of('create:blaze_burner'),
    [
      ' A ',
      'ABA',
      ' C '
    ],
    {
      A: '#farmerstfc:magma_block',
      B: 'tfc:firebox',
      C: 'create:empty_blaze_burner'
    }
  )
})
