ServerEvents.recipes(event => {

  event.remove({ output: 'minecraft:iron_ingot' })
  event.remove({ output: 'minecraft:gold_ingot' })
  event.remove({ output: 'minecraft:gold_block' })
  event.remove({ output: 'create:brass_block' })
  event.remove({ output: 'create:blaze_burner' })
  event.remove({ output: 'create:empty_blaze_burner' })
  event.remove({ id: /^createbigcannons:melting\// })
  event.remove({ id: /^createbigcannons:compacting\// })
  event.remove({ output: 'minecraft:copper_ingot' })
  event.remove({ output: 'minecraft:copper_block' })
  event.remove({ output: 'minecraft:dried_kelp' })
  event.remove({ output: 'minecraft:honeycomb' })
  event.remove({
    mod: 'functionalstorage',
    id: /.*_upgrade/
  })

})