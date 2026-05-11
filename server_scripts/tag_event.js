//ServerEvents.generateData('after_mods', event => {
//
//  event.json(
//    'kubejs:fuel_values/custom_fuels',
//
//    {
//      "values": {
//        "tfc:ore/bituminous_coal": 1600,
//        "tfc:ore/lignite": 1200,
//      }
//    }
//  )
//
//})

ServerEvents.tags('item', event => {
  //event.add('c:ingots/iron', '#c:ingots/wrought_iron')
  event.add('create:blaze_burner_fuel/regular', 'tfc:ore/bituminous_coal')
  event.add('create:blaze_burner_fuel/regular', 'tfc:ore/lignite')
  event.add('createlowheated:burner_starters', 'tfc:flint_and_pyrite')
  event.add('createlowheated:burner_starters', 'createdieselgenerators:lighter')
  event.add('createlowheated:burner_starters', 'tfc:firestarter')
  event.add('c:ingots/iron', 'tfc:metal/ingot/wrought_iron')
  event.add('c:slimeballs', 'tfc:glue')
  event.add('c:slime_balls', 'tfc:glue')

  const list = []
  Item.getList().forEach(item => {
    const id = item.id.toString()

    if (id.startsWith('tfc:wood/stripped_log/')) {
      list.push(id)
    }
  })
  event.add('c:stripped_logs', list)
  list = []
  Item.getList().forEach(item => {
    const id = item.id.toString()

    if (id.startsWith('tfc:wood/stripped_wood/')) {
      list.push(id)
    }
  })
  event.add('c:stripped_woods', list)
  event.add('c:glass', '#c:glass_blocks')
})
ServerEvents.tags('fluid', e => {
  e.add('createburnerfuel:burner_fuel', 'createdieselgenerators:gasoline')
  e.add('createburnerfuel:burner_fuel', 'createdieselgenerators:diesel')
  e.add('createburnerfuel:burner_fuel', 'createdieselgenerators:biodiesel')
  e.add('createburnerfuel:burner_fuel', 'createpropulsion:turpentine')
  e.add('createburnerfuel:burner_fuel', 'createdieselgenerators:plant_oil')
})