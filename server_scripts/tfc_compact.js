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
  event.remove({ output: 'create:blaze_burner' })
  event.remove({ output: 'create:empty_blaze_burner' })

  event.recipes.tfc.heating(
    'minecraft:iron_nugget',
    1500
  ).fluidOutput(Fluid.of('tfc:metal/cast_iron', 10))
  event.recipes.tfc.heating(
    'minecraft:iron_block',
    1500
  ).fluidOutput(Fluid.of('tfc:metal/cast_iron', 900))


  event.replaceInput(
    { input: 'minecraft:blast_furnace' },
    'minecraft:blast_furnace',
    'tfc:blast_furnace'
  )
  event.replaceInput(
    { input: 'create:empty_blaze_burner' },
    'create:empty_blaze_burner',
    'createlowheated:basic_burner'
  )
})
