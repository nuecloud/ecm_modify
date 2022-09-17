

onEvent('recipes', event => {

    //在此处编写代码
    //删除cgm原有枪械
    event.remove({ id: 'cgm:pistol' })
    event.remove({ id: 'cgm:shotgun' })
    event.remove({ id: 'cgm:rifle' })
    event.remove({ id: 'cgm:grenade_launcher' })
    event.remove({ id: 'cgm:bazooka' })
    event.remove({ id: 'cgm:mini_gun' })
    event.remove({ id: 'cgm:assault_rifle' })
    event.remove({ id: 'cgm:machine_pistol' })
    event.remove({ id: 'cgm:heavy_rifle' })
    //删除枪械配件
    // event.remove({ id: 'cgm:grenade_launcher' })
    // event.remove({ id: 'cgm:grenade_launcher' })
    // event.remove({ id: 'cgm:grenade_launcher' })


    // 枪管: 'immersiveengineering:gunpart_barrel'
    // 木组件: 'kubejs:wooden_firearm_parts'
    // 木握把: 'immersiveengineering:wooden_grip'   握柄
    // 钢组件: 'kubejs:steel_firearm_parts'
    // 钢零件: 'immersiveengineering:component_steel' 钢机械零件
    // 钢板: 'immersiveengineering:plate_steel'
    // 击锤: 'immersiveengineering:gunpart_hammer'
    // 玻璃板: 'minecraft:glass_pane'

    //增加配方: annihilator
    // event.remove({ id: 'ww1guns:annihilator' })
    event.custom(
        {
            "type": "cgm:workbench",
            "result": {
                "item": "ww1guns:annihilator"
            },
            "materials": [{
                "item": "immersiveengineering:gunpart_hammer", "count": 1
            },
            {
                "item": "immersiveengineering:gunpart_barrel", "count": 2
            },
            {
                "item": "kubejs:wooden_firearm_parts", "count": 1
            },
            {
                "item": "immersiveengineering:wooden_grip", "count": 2
            },
            {
                "item": "kubejs:steel_firearm_parts", "count": 4
            },
            {
                "item": "immersiveengineering:component_steel", "count": 2
            },
            {
                "item": "immersiveengineering:plate_steel", "count": 1
            }

            ]
        }
    )

    // Item.of('ww1guns:mg15na', '{AmmoCount:100}')
    event.custom(
        {
            "type": "cgm:workbench",
            "result": {
                "item": "ww1guns:mg15na"
            },
            "materials": [{
                "item": "immersiveengineering:gunpart_hammer", "count": 1
            },
            {
                "item": "immersiveengineering:gunpart_barrel", "count": 3
            },
            {
                "item": "kubejs:wooden_firearm_parts", "count": 1
            },
            {
                "item": "immersiveengineering:wooden_grip", "count": 1
            },
            {
                "item": "kubejs:steel_firearm_parts", "count": 8
            },
            {
                "item": "immersiveengineering:component_steel", "count": 4
            },
            {
                "item": "immersiveengineering:plate_steel", "count": 1
            }

            ]
        }
    )
    // Item.of('ww1guns:model825', '{AmmoCount:16}')
    event.custom(
        {
            "type": "cgm:workbench",
            "result": {
                "item": "ww1guns:model825"
            },
            "materials": [{
                "item": "immersiveengineering:gunpart_hammer", "count": 1
            },
            {
                "item": "immersiveengineering:gunpart_barrel", "count": 3
            },
            {
                "item": "kubejs:wooden_firearm_parts", "count": 4
            },
            {
                "item": "kubejs:steel_firearm_parts", "count": 6
            },
            {
                "item": "immersiveengineering:component_steel", "count": 3
            }

            ]
        }
    )

    // Item.of('ww1guns:m1917lmg', '{AmmoCount:20}')
    event.custom(
        {
            "type": "cgm:workbench",
            "result": {
                "item": "ww1guns:m1917lmg"
            },
            "materials": [{
                "item": "immersiveengineering:gunpart_hammer", "count": 1
            },
            {
                "item": "immersiveengineering:gunpart_barrel", "count": 3
            },
            {
                "item": "kubejs:wooden_firearm_parts", "count": 3
            },
            {
                "item": "immersiveengineering:wooden_grip", "count": 1
            },
            {
                "item": "kubejs:steel_firearm_parts", "count": 5
            },
            {
                "item": "immersiveengineering:component_steel", "count": 3
            },
            {
                "item": "immersiveengineering:plate_steel", "count": 1
            }

            ]
        }
    )

    // Item.of('ww1guns:m1918bar', '{AmmoCount:20}')
    event.custom(
        {
            "type": "cgm:workbench",
            "result": {
                "item": "ww1guns:m1918bar"
            },
            "materials": [{
                "item": "immersiveengineering:gunpart_hammer", "count": 1
            },
            {
                "item": "immersiveengineering:gunpart_barrel", "count": 3
            },
            {
                "item": "kubejs:wooden_firearm_parts", "count": 4
            },
            {
                "item": "kubejs:steel_firearm_parts", "count": 5
            },
            {
                "item": "immersiveengineering:component_steel", "count": 3
            }


            ]
        }
    )

    // Item.of('ww1guns:mp18', '{AmmoCount:30}')
    event.custom(
        {
            "type": "cgm:workbench",
            "result": {
                "item": "ww1guns:mp18"
            },
            "materials": [{
                "item": "immersiveengineering:gunpart_hammer", "count": 1
            },
            {
                "item": "immersiveengineering:gunpart_barrel", "count": 2
            },
            {
                "item": "kubejs:wooden_firearm_parts", "count": 4
            },
            {
                "item": "kubejs:steel_firearm_parts", "count": 3
            },
            {
                "item": "immersiveengineering:component_steel", "count": 3
            },
            {
                "item": "immersiveengineering:plate_steel", "count": 1
            },
            {
                "item": "minecraft:glass_pane", "count": 1
            }
            ]
        }
    )
    // Item.of('ww1guns:martinihenry', '{AmmoCount:1}')
    event.custom(
        {
            "type": "cgm:workbench",
            "result": {
                "item": "ww1guns:martinihenry"
            },
            "materials": [{
                "item": "immersiveengineering:gunpart_hammer", "count": 1
            },
            {
                "item": "immersiveengineering:gunpart_barrel", "count": 4
            },
            {
                "item": "kubejs:wooden_firearm_parts", "count": 4
            },
            {
                "item": "kubejs:steel_firearm_parts", "count": 1
            },
            {
                "item": "immersiveengineering:component_iron", "count": 1
            }
            ]
        }
    )

    // Item.of('ww1guns:model10a', '{AmmoCount:6}')
    event.custom(
        {
            "type": "cgm:workbench",
            "result": {
                "item": "ww1guns:model10a"
            },
            "materials": [{
                "item": "immersiveengineering:gunpart_hammer", "count": 1
            },
            {
                "item": "immersiveengineering:gunpart_barrel", "count": 3
            },
            {
                "item": "kubejs:wooden_firearm_parts", "count": 5
            },
            {
                "item": "kubejs:steel_firearm_parts", "count": 3
            },
            {
                "item": "immersiveengineering:component_steel", "count": 2
            }
        ]
        }
    )

    // Item.of('ww1guns:automatic12g', '{AmmoCount:6}')
    event.custom(
        {
            "type": "cgm:workbench",
            "result": {
                "item": "ww1guns:automatic12g"
            },
            "materials": [{
                "item": "immersiveengineering:gunpart_hammer", "count": 1
            },
            {
                "item": "immersiveengineering:gunpart_barrel", "count": 3
            },
            {
                "item": "kubejs:wooden_firearm_parts", "count": 3
            },
            {
                "item": "kubejs:steel_firearm_parts", "count": 3
            },
            {
                "item": "immersiveengineering:component_steel", "count": 3
            }
        ]
        }
    )



})


