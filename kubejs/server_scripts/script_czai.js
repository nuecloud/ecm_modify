// priority: 0

settings.logAddedRecipes = true
settings.logRemovedRecipes = true
settings.logSkippedRecipes = false
settings.logErroringRecipes = true

console.info('Hello, World! (You will see this line every time server resources reload)')

onEvent('recipes', event => {

     event.remove({id: 'immersiveengineering:crafting/gunpart_hammer'})    //移除击锤原版合成
     event.remove({id: 'immersiveengineering:crafting/gunpart_barrel'})    //移除枪管原版合成
     event.remove({id: 'immersiveengineering:blueprint/component_electronic_adv'})    //移除高级逻辑组件原版合成
     event.remove({id: 'immersiveengineering:crafting/wooden_grip'})    //移除木握柄原版合成
     event.remove({output: 'create:precision_mechanism', type: 'create:sequenced_assembly'})    //移除原版精密构建合成
     event.remove({id: 'immersiveengineering:crafting/empty_shell'})    //移除合成台大型弹壳配方
     event.remove({id: 'immersiveengineering:bottling/empty_shell'})    //移除原版灌装机合成
     event.remove({id: 'createoreexcavation:vein_finder'})    //移除合成台勘矿稿配方
     event.remove({id: 'create:crafting/kinetics/schedule'})       //移除原版列车时刻表合成
     event.remove({id: 'create:sequenced_assembly/sturdy_sheet'})    //移出原版坚固板合成
     event.remove({id: 'etched:blank_music_disc'})      //移除原版空白唱片合成
     event.remove({id: 'immersiveengineering:crafting/watermill'})     //移出原版水车合成
     event.remove({id: 'lightmanscurrency:coinmint'})
     event.remove({id: 'lightmanscurrency:terminal'})
     event.remove({id: 'lightmanscurrency:terminal2'})
     event.remove({id: 'lightmanscurrency:portable_terminal'})
     event.remove({id: 'lightmanscurrency:gem_terminal'})
     event.remove({id: 'lightmanscurrency:gem_terminal2'})
     event.remove({id: 'lightmanscurrency:portable_gem_terminal'})
     event.remove({id: 'lightmanscurrency:item_trader_interface'})
     event.remove({id: 'lightmanscurrency:paygate'})
     event.remove({id: 'lctech:fluid_trader_interface'})
     event.remove({id: 'lctech:energy_trader_interface'})
     //移除所有可远程交易终端和印币机
     event.remove({id: 'create:crafting/kinetics/attribute_filter'})
     event.remove({id: 'create:crafting/kinetics/filter'})

     event.recipes.createSequencedAssembly([             //电路板
        Item.of('immersiveengineering:logic_circuit').withChance(100.0),
        'immersiveengineering:electron_tube',
        'immersiveengineering:capacitor_lv',
        'createaddition:gold_wire',
        'immersiveengineering:component_electronic_adv',
      ], 'immersiveengineering:circuit_board', [
        event.recipes.createDeploying('kubejs:component_logic_circuit', ['kubejs:component_logic_circuit', 'immersiveengineering:electron_tube']),
        event.recipes.createDeploying('kubejs:component_logic_circuit', ['kubejs:component_logic_circuit', 'immersiveengineering:capacitor_lv']),
        event.recipes.createDeploying('kubejs:component_logic_circuit', ['kubejs:component_logic_circuit', 'createaddition:gold_wire']),
        event.recipes.createDeploying('kubejs:component_logic_circuit', ['kubejs:component_logic_circuit', 'immersiveengineering:component_electronic_adv']),
      ]).transitionalItem('kubejs:component_electronic_adv').loops(2)//半成品注册名

    event.recipes.createSequencedAssembly([             //高级逻辑组件
        Item.of('immersiveengineering:component_electronic_adv').withChance(100.0),
        'createaddition:capacitor',
        'immersiveengineering:electron_tube',
        'createaddition:gold_wire',
      ], 'immersiveengineering:plate_duroplast', [
        event.recipes.createDeploying('kubejs:component_electronic_adv', ['kubejs:component_electronic_adv', 'createaddition:capacitor']),
        event.recipes.createDeploying('kubejs:component_electronic_adv', ['kubejs:component_electronic_adv', 'immersiveengineering:electron_tube']),
        event.recipes.createDeploying('kubejs:component_electronic_adv', ['kubejs:component_electronic_adv', 'createaddition:gold_wire']),
      ]).transitionalItem('kubejs:component_electronic_adv').loops(2)//半成品注册名

   event.recipes.createCutting('immersiveengineering:wooden_grip', "kubejs:wooden_firearm_parts")    //木握把

   event.recipes.createDeploying(['kubejs:chamfered_steel_pipe','immersiveengineering:drillhead_steel'],['immersiveengineering:stick_steel','immersiveengineering:drillhead_steel'])//已经加工的钢管
   event.recipes.createDeploying(['immersiveengineering:gunpart_barrel','immersiveengineering:screwdriver'],['kubejs:chamfered_steel_pipe','immersiveengineering:screwdriver'])//枪管
    event.recipes.createSequencedAssembly([             //精密构件
           Item.of('create:precision_mechanism').withChance(100.0),
           '#forge:plates/iron',
           'immersiveengineering:component_iron',
           'immersiveengineering:component_steel',
           'immersiveengineering:wire_steel',
           'create:cogwheel'
         ], '#forge:plates/iron', [
           event.recipes.createDeploying('create:incomplete_precision_mechanism', ['create:incomplete_precision_mechanism', 'immersiveengineering:component_iron']),
           event.recipes.createDeploying('create:incomplete_precision_mechanism', ['create:incomplete_precision_mechanism', 'immersiveengineering:component_steel']),
           event.recipes.createDeploying('create:incomplete_precision_mechanism', ['create:incomplete_precision_mechanism', 'immersiveengineering:wire_steel']),
           event.recipes.createDeploying('create:incomplete_precision_mechanism', ['create:incomplete_precision_mechanism', 'create:cogwheel']),
         ]).transitionalItem('create:incomplete_precision_mechanism').loops(2)

    event.recipes.createSequencedAssembly([             //击锤
           Item.of('immersiveengineering:gunpart_hammer').withChance(100.0),
           '#forge:plates/steel',
           'immersiveengineering:component_iron'
         ], '#forge:plates/steel', [
           event.recipes.createDeploying('kubejs:component_gunpart_hammer', ['kubejs:component_gunpart_hammer', 'immersiveengineering:component_iron']),
           event.recipes.createCutting('kubejs:component_gunpart_hammer','kubejs:component_gunpart_hammer'),
           event.recipes.createCutting('kubejs:component_gunpart_hammer','kubejs:component_gunpart_hammer')
         ]).transitionalItem('kubejs:component_gunpart_hammer').loops(1)

    event.recipes.createSequencedAssembly([             //木制枪械零件(未打磨)
           Item.of('2x kubejs:unpolished_wooden_firearm_parts').withChance(100.0),
           'immersiveengineering:treated_wood_horizontal',
           'minecraft:honeycomb'
         ], 'immersiveengineering:treated_wood_horizontal', [
           event.recipes.createCutting('kubejs:component_wooden_firearm_parts','kubejs:component_wooden_firearm_parts'),
           event.recipes.createCutting('kubejs:component_wooden_firearm_parts','kubejs:component_wooden_firearm_parts'),
           event.recipes.createFilling('kubejs:component_wooden_firearm_parts',['kubejs:component_wooden_firearm_parts',Fluid.of('immersiveengineering:plantoil',100)])
         ]).transitionalItem('kubejs:component_wooden_firearm_parts').loops(1)
    event.recipes.createCutting('2x kubejs:unpolished_steel_firearm_parts','#forge:plates/steel')   //钢制枪械零件(未打磨)
    event.recipes.createSandpaperPolishing('kubejs:wooden_firearm_parts','kubejs:unpolished_wooden_firearm_parts')   //木制枪械零件
    event.recipes.createSandpaperPolishing('kubejs:steel_firearm_parts','kubejs:unpolished_steel_firearm_parts')    //钢制枪械零件
    event.recipes.createCutting('immersiveengineering:wooden_grip','kubejs:wooden_firearm_parts')    //木握把
    event.recipes.createFilling('kubejs:unformed_sturdy_sheet',['immersiveengineering:mold_plate',Fluid.of('createbigcannons:molten_cast_iron',1000)])   //未成形坚固板
    event.recipes.createDeploying(['kubejs:formed_sturdy_sheet','immersiveengineering:mold_plate','immersiveengineering:screwdriver'],['kubejs:unformed_sturdy_sheet','immersiveengineering:screwdriver'])    //成形的坚固板

    event.custom(                     //加固板
        {
           "type":"immersiveengineering:arc_furnace",
           "results":[
           {
              "count":1,
              "base_ingredient":{
               "item":"create:sturdy_sheet"
              }
            }],
           "additives":[{"item":"immersiveengineering:dust_coke"}],
        "input":{"item":"kubejs:formed_sturdy_sheet"},
        "time":100,"energy":51200
        }
   )

    event.custom({                              //黄麻碱
      "type":"immersiveengineering:squeezer",
      "fluid":{"fluid":"kubejs:jute","amount":25},
      "input":{"count":64,"base_ingredient":{"item":"immersiveengineering:hemp_fiber"}},
      "energy":19200
      })

    event.recipes.createFilling('kubejs:jute_injection',['kubejs:ethanol_bottled',Fluid.of('kubejs:jute', 250)])    //黄麻碱针剂

   event.recipes.createDeploying('kubejs:shotgun_warheads',['kubejs:no12_projectiles','minecraft:paper'])    //霰弹枪弹头

   event.recipes.createDeploying('9x kubejs:primer',['kubejs:small_portions_gunpowder','#forge:nuggets/lead'])    //底火

  event.custom({                              //手枪弹壳模具
   "type":"immersiveengineering:blueprint",
   "inputs":[{"count":3,"base_ingredient":{"tag":"forge:plates/steel"}},
   {"item":"immersiveengineering:wirecutter"}],
   "category":"molds",
   "result":{"item":"kubejs:rifle_shells_mold"}
   })

  event.custom({                              //步枪弹壳模具
   "type":"immersiveengineering:blueprint",
   "inputs":[{"count":3,"base_ingredient":{"tag":"forge:plates/steel"}},
   {"item":"immersiveengineering:wirecutter"}],
   "category":"molds",
   "result":{"item":"kubejs:pistol_casings_mold"}
   })


   event.custom({                              //小份火药
     "type":"immersiveengineering:metal_press",
      "mold":"immersiveengineering:mold_unpacking",
      "result":{"item":"kubejs:small_portions_gunpowder","count":18},
      "input":{"tag":"forge:gunpowder"},
      "energy":2400
      })

   event.custom({                              //12号弹丸
     "type":"immersiveengineering:metal_press",
      "mold":"immersiveengineering:mold_unpacking",
      "result":{"item":"kubejs:no12_projectiles","count":4},
      "input":{"tag":"forge:ingots/copper"},
      "energy":2400
      })

      event.recipes.createSequencedAssembly([             //独头霰弹枪弹头
                 Item.of('4x kubejs:oneheaded_shotgun_warheads').withChance(100.0),
                 '#forge:ingots/steel'
               ], '#forge:ingots/steel', [
                 event.recipes.createCutting('kubejs:component_oneheaded_shotgun_ammunition', 'kubejs:component_oneheaded_shotgun_ammunition'),
                 event.recipes.createCutting('kubejs:component_oneheaded_shotgun_ammunition', 'kubejs:component_oneheaded_shotgun_ammunition'),
               ]).transitionalItem('kubejs:component_oneheaded_shotgun_ammunition').loops(1)

   event.custom({                              //手枪弹壳
        "type":"immersiveengineering:metal_press",
         "mold":"kubejs:pistol_casings_mold",
         "result":{"item":"kubejs:pistol_casings","count":18},
         "input":{"tag":"forge:ingots/copper"},
         "energy":2400
         })

   event.custom({                              //步枪弹壳
        "type":"immersiveengineering:metal_press",
         "mold":"kubejs:rifle_shells_mold",
         "result":{"item":"kubejs:rifle_shells","count":9},
         "input":{"tag":"forge:ingots/copper"},
         "energy":2400
         })

   event.custom({                              //大型弹壳(霰弹)
        "type":"immersiveengineering:metal_press",
         "mold":"immersiveengineering:mold_bullet_casing",
         "result":{"item":"immersiveengineering:empty_shell","count":5},
         "input":{"tag":"forge:ingots/copper"},
         "energy":2400
         })

    event.recipes.createSequencedAssembly([             //霰弹枪弹药
           Item.of('ww1guns:12_gauge').withChance(100.0),
           'immersiveengineering:empty_shell',
           'kubejs:primer',
           'kubejs:small_portions_gunpowder',
           'kubejs:shotgun_warheads'
         ], 'immersiveengineering:empty_shell', [
           event.recipes.createDeploying('kubejs:component_shotgun_ammunition', ['kubejs:component_shotgun_ammunition', 'kubejs:primer']),
           event.recipes.createDeploying('kubejs:component_shotgun_ammunition', ['kubejs:component_shotgun_ammunition', 'kubejs:small_portions_gunpowder']),
           event.recipes.createDeploying('kubejs:component_shotgun_ammunition', ['kubejs:component_shotgun_ammunition', 'kubejs:small_portions_gunpowder']),
           event.recipes.createDeploying('kubejs:component_shotgun_ammunition', ['kubejs:component_shotgun_ammunition', 'kubejs:small_portions_gunpowder']),
           event.recipes.createDeploying('kubejs:component_shotgun_ammunition', ['kubejs:component_shotgun_ammunition', 'kubejs:shotgun_warheads']),
         ]).transitionalItem('kubejs:component_shotgun_ammunition').loops(1)

    event.recipes.createSequencedAssembly([             //独头霰弹枪弹药
           Item.of('ww1guns:slug').withChance(100.0),
           'immersiveengineering:empty_shell',
           'kubejs:primer',
           'kubejs:small_portions_gunpowder',
           'kubejs:oneheaded_shotgun_warheads'
         ], 'immersiveengineering:empty_shell', [
           event.recipes.createDeploying('kubejs:component_shotgun_ammunition', ['kubejs:component_shotgun_ammunition', 'kubejs:primer']),
           event.recipes.createDeploying('kubejs:component_shotgun_ammunition', ['kubejs:component_shotgun_ammunition', 'kubejs:small_portions_gunpowder']),
           event.recipes.createDeploying('kubejs:component_shotgun_ammunition', ['kubejs:component_shotgun_ammunition', 'kubejs:small_portions_gunpowder']),
           event.recipes.createDeploying('kubejs:component_shotgun_ammunition', ['kubejs:component_shotgun_ammunition', 'kubejs:small_portions_gunpowder']),
           event.recipes.createDeploying('kubejs:component_shotgun_ammunition', ['kubejs:component_shotgun_ammunition', 'kubejs:oneheaded_shotgun_warheads']),
         ]).transitionalItem('kubejs:component_shotgun_ammunition').loops(1)

    event.recipes.createSequencedAssembly([             //手枪弹药
               Item.of('ww1guns:handgun_ammo').withChance(100.0),
               'kubejs:pistol_casings',
               'kubejs:primer',
               'kubejs:small_portions_gunpowder',
               '#forge:nuggets/brass'
             ], 'kubejs:pistol_casings', [
               event.recipes.createDeploying('kubejs:component_pistol_ammunition', ['kubejs:component_pistol_ammunition', 'kubejs:primer']),
               event.recipes.createDeploying('kubejs:component_pistol_ammunition', ['kubejs:component_pistol_ammunition', 'kubejs:small_portions_gunpowder']),
               event.recipes.createDeploying('kubejs:component_pistol_ammunition', ['kubejs:component_pistol_ammunition', '#forge:nuggets/brass']),
             ]).transitionalItem('kubejs:component_pistol_ammunition').loops(1)

    event.recipes.createSequencedAssembly([             //步枪弹药
                   Item.of('ww1guns:rifle_ammo').withChance(100.0),
                   'kubejs:pistol_casings',
                   'kubejs:primer',
                   'kubejs:small_portions_gunpowder',
                   '#forge:nuggets/constantan'
                 ], 'kubejs:rifle_shells', [
                   event.recipes.createDeploying('kubejs:component_rifle_ammunition', ['kubejs:component_rifle_ammunition', 'kubejs:primer']),
                   event.recipes.createDeploying('kubejs:component_rifle_ammunition', ['kubejs:component_rifle_ammunition', 'kubejs:small_portions_gunpowder']),
                   event.recipes.createDeploying('kubejs:component_rifle_ammunition', ['kubejs:component_rifle_ammunition', 'kubejs:small_portions_gunpowder']),
                   event.recipes.createDeploying('kubejs:component_rifle_ammunition', ['kubejs:component_rifle_ammunition', '#forge:nuggets/constantan']),
                 ]).transitionalItem('kubejs:component_pistol_ammunition').loops(1)

  event.recipes.createFilling('kubejs:ethanol_bottled',['minecraft:glass_bottle',Fluid.of('createaddition:bioethanol',250)])          //瓶装乙醇(生物乙醇)
  event.recipes.createFilling('kubejs:ethanol_bottled',['minecraft:glass_bottle',Fluid.of('immersiveengineering:ethanol',250)])       //瓶装乙醇(乙醇)
  event.recipes.createCutting('2x kubejs:unpolished_records', 'immersiveengineering:plate_duroplast')
  event.recipes.createSandpaperPolishing('kubejs:polished_records', 'kubejs:unpolished_records')
  event.recipes.createDeploying('etched:blank_music_disc', ['kubejs:polished_records','minecraft:black_dye'])     //空白唱片



  event.shapeless('create:schedule', ['#forge:plates/steel', 'minecraft:paper'])       //列车时刻表

   event.shaped('kubejs:medical_kits',[     //医疗包
       'h h',
       ' e ',
       'h h'
   ],{
       h:'immersiveengineering:hemp_fabric',
       e:'kubejs:ethanol_bottled'
   })

   event.shaped('createoreexcavation:vein_finder',[     //勘矿稿
          'hss',
          ' t ',
          ' t '
      ],{
          h:Item.of('immersiveengineering:hammer', '{Damage:0}'),
          s:'#forge:ingots/steel',
          t:'immersiveengineering:stick_treated'
      })

      event.shaped('create:white_sail',[     //白色风帆
          'sss',
          'shs',
          'sss'
      ],{
          s:'#forge:rods/wooden',
          h:'immersiveengineering:hemp_fabric'
      })

	event.recipes.createoreexcavation.drilling([
	   Item.of('immersiveengineering:raw_aluminum').withChance(0.8),
	   Item.of('minecraft:raw_iron').withChance(0.2)],
	   '{"text": "粗铝土开采"}', 8, 800    //20%出铁
	).biomeWhitelist('forge:is_overworld').stress(64).id("raw_aluminum");     //铝土开采

    event.recipes.createoreexcavation.drilling([
      Item.of('immersiveengineering:raw_lead').withChance(0.8),
      Item.of('immersiveengineering:dust_sulfur').withChance(0.5),
      Item.of('immersiveengineering:raw_silver').withChance(0.01)],
      '{"text": "粗铅开采"}', 6, 800  //50%硫磺，1%银
    ).biomeWhitelist('forge:is_overworld').stress(128).id("raw_aluminum");    //铅开采

    event.recipes.createoreexcavation.drilling([
          Item.of('immersiveengineering:raw_silver').withChance(0.8),
          Item.of('minecraft:raw_copper').withChance(0.2),   //铜 20%
          Item.of('minecraft:raw_gold').withChance(0.07),    //金  7%
          Item.of('immersiveengineering:raw_uranium').withChance(0.02),   //铀  2%
          Item.of('immersiveengineering:raw_lead').withChance(0.01),     //铅   1%
          Item.of('create:raw_zinc').withChance(0.4)],   //锌  40%
          '{"text": "粗铅开采"}', 5, 800
        ).biomeWhitelist('forge:is_overworld').stress(256).id("raw_silver");    //银开采

    event.recipes.createoreexcavation.drilling([
          Item.of('immersiveengineering:raw_nickel').withChance(0.8),
          Item.of('minecraft:raw_iron').withChance(0.2),   //铁 20%
          Item.of('immersiveengineering:dust_sulfur').withChance(0.1)],    //硫磺  10%
          '{"text": "粗镍开采"}', 6, 800
        ).biomeWhitelist('forge:is_overworld').stress(128).id("raw_nickel");    //镍开采

    event.recipes.createoreexcavation.drilling(Item.of('immersiveengineering:raw_uranium').withChance(0.8),'{"text": "粗铀开采"}', 3, 1200).biomeWhitelist('forge:is_overworld').stress(256).id("raw_uranium");    //铀开采
    event.recipes.createoreexcavation.extracting(Fluid.of('immersivepetroleum:crudeoil', 1000), '{"text": "石油"}', 5, 1200).biomeWhitelist('forge:is_overworld').stress(256).drill('createoreexcavation:diamond_drill').id("crudeoil");     //石油开采

})

  onEvent('item.right_click', event => {       //医疗包实现
     if(event.player.mainHandItem.id == "kubejs:medical_kits" && event.player.crouching){      //检测是否手持医疗包并且蹲下
          event.player.heal(1);              //立刻恢复一点生命值
          event.item.count--;                //减去一个物品
          event.player.addItemCooldown("kubejs:medical_kits",56);    //这行是冷却时间，单位tick
      event.player.potionEffects.add("minecraft:regeneration",45,2,false,false);      //这行是生命恢复buff，第一个是持续时间，单位tick，第二个是等级
     }
})


//禁用物品右键
onEvent('block.right_click', event=>{
  let banBlockList = ["lightmanscurrency:coinmint","lightmanscurrency:terminal","lightmanscurrency:gem_terminal","lightmanscurrency:item_trader_interface","lightmanscurrency:paygate","lctech:fluid_trader_interface","lctech:energy_trader_interface"]
  if(banBlockList.indexOf(event.block)!=-1){
    event.cancel();
  }
})