ServerEvents.recipes(event => {
  event.shaped(
    Item.of('minecraft:soul_sand'),
    [
      'AAA',
      'ABA',
      'AAA'
    ],
    {
      A: '#c:foods/raw_meat',
      B: '#c:gravels'
    }
  )
  event.shaped(
    Item.of('create:empty_blaze_burner'),
    [
      ' A ',
      'ABC',
      ' C '
    ],
    {
      A: '#c:sheets/red_steel',
      B: '#c:gravels',
      C: '#c:sheets/blue_steel'
    }
  )

  event.shaped(
    Item.of('drivebywire:wire'),
    [
      ' A ',
      ' B ',
      ' A '
    ],
    {
      A: 'electroenergetics:connector',
      B: 'electroenergetics:insulated_wire'
    }
  )
  event.shaped(
    Item.of('drivebywire:controller_hub'),
    [
      '   ',
      'ABA',
      '   '
    ],
    {
      A: 'create_connected:redstone_link_wildcard',
      B: 'simulated:linked_typewriter'
    }
  )
  event.shaped(
    Item.of('create:belt_connector'),
    [
      '   ',
      'AAA',
      'AAA'
    ],
    {
      A: 'afc:rubber_bar'
    }
  )
  event.shapeless(Item.of('minecraft:glowstone', 4),
    [
      '4x #c:cobblestones',
      '#tfc:gem_powders'
    ]
  )

  event.shapeless(Item.of('drivebywire:wire_cutter'),
    [
      'drivebywire:wire',
      'createdieselgenerators:wire_cutters'
    ]
  )
  event.shapeless(Item.of('create:andesite_alloy', 8),
    [
      '#c:cobblestones',
      '#c:ingots/iron'
    ]
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

  event.replaceInput(
    { input: 'minecraft:slime_ball' },
    'minecraft:slime_ball',
    'tfc:glue'
  )

  event.replaceInput(
    { input: 'minecraft:copper_ingot' },
    'minecraft:copper_ingot',
    '#c:ingots/copper'
  )

  event.replaceInput(
    { input: 'minecraft:copper_block' },
    'minecraft:copper_block',
    '#c:storage_blocks/copper'
  )

  event.replaceInput(
    { input: 'minecraft:dried_kelp' },
    'minecraft:dried_kelp',
    'tfc:food/dried_kelp'
  )

  event.replaceInput(
    { input: 'minecraft:honeycomb' },
    'minecraft:honeycomb',
    'firmalife:food/raw_honey'
  )

  event.replaceInput(
    { input: 'minecraft:honeycomb' },
    'minecraft:honeycomb',
    'firmalife:food/raw_honey'
  )


  event.recipes.tfc.heating(
    'minecraft:iron_nugget',
    1500
  ).fluidOutput(Fluid.of('tfc:metal/cast_iron', 10))
  event.recipes.tfc.heating(
    'minecraft:iron_block',
    1500
  ).fluidOutput(Fluid.of('tfc:metal/cast_iron', 900))

})