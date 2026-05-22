ServerEvents.recipes(event => {
    event.custom({
        type: 'createdieselgenerators:distillation',
        ingredients: [{
            type: 'fluid_tag',
            fluid_tag: 'tfc:alcohols',
            amount: 1000
        }],
        heat_requirement: 'heated',
        processing_time: 100,
        results: [
            { id: 'minecraft:water', amount: 400 },
            { id: 'createdieselgenerators:ethanol', amount: 600 }
        ]
    }).id('kubejs:distillation/createdieselgenerators/tfc_alcohols/ethanol')

    event.custom({
        type: 'createdieselgenerators:distillation',
        ingredients: [{
            type: 'fluid_tag',
            fluid_tag: 'tfcagedalcohol:aged_alcohols',
            amount: 1000
        }],
        heat_requirement: 'heated',
        processing_time: 100,
        results: [
            { id: 'minecraft:water', amount: 200 },
            { id: 'createdieselgenerators:ethanol', amount: 800 }
        ]
    }).id('kubejs:distillation/createdieselgenerators/tfcagedalcohol_aged_alcohols/ethanol')
})
