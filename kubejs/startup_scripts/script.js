// priority: 0

console.info('Hello, World! (You will only see this line once in console, during startup)')

onEvent('item.registry', event => {
         event.create('unformed_sturdy_sheet').displayName('未成形的坚固板')
         event.create('component_electronic_adv').displayName('未完成的高级逻辑组件')
         event.create('component_logic_circuit').displayName('未完成的电路板')
         event.create('steel_firearm_parts').displayName('钢制枪械组件')
         event.create('wooden_firearm_parts').displayName('木制枪械组件')
         event.create('formed_sturdy_sheet').displayName('成形的坚固板')
         event.create('chamfered_steel_pipe').displayName('己加工的钢管')
         event.create('component_wooden_firearm_parts').displayName('未完成的木制枪械组件')
         event.create('unpolished_wooden_firearm_parts').displayName('未打磨的木制枪械组件')
         event.create('unpolished_steel_firearm_parts').displayName('未打磨的钢制枪械组件')
         event.create('component_gunpart_hammer').displayName('未完成的击锤')
         event.create('small_portions_gunpowder').displayName('小份火药')
         event.create('no12_projectiles').displayName('一堆12号弹丸')
         event.create('shotgun_warheads').displayName('霰弹枪弹头')
         event.create('oneheaded_shotgun_warheads').displayName('独头霰弹枪弹头')
         event.create('primer').displayName('底火')
         event.create('pistol_casings').displayName('手枪弹壳')
         event.create('rifle_shells').displayName('步枪弹壳')
         event.create('rifle_shells_mold').displayName('步枪弹壳模具')
         event.create('pistol_casings_mold').displayName('手枪弹壳模具')
         event.create('medical_kits').displayName('医疗包')
         event.create('ethanol_bottled').displayName('瓶装乙醇')
         event.create('component_pistol_ammunition').displayName('未完成的手枪弹药')
         event.create('component_shotgun_ammunition').displayName('未完成的霰弹枪弹药')
         event.create('component_oneheaded_shotgun_ammunition').displayName('未完成的独头霰弹枪弹头')
         event.create('component_rifle_ammunition').displayName('未完成的步枪弹药')
         event.create('unpolished_records').displayName('未打磨的唱片')
         event.create('polished_records').displayName('未染色的唱片')
         event.create('jute_injection').displayName('黄麻碱针剂')
         event.create('test').displayName('测试物品')
})
onEvent('fluid.registry', event => {
         event.create("jute").displayName("黄麻碱").textureFlowing('./assets/kubejs/textures/block/jute.png');
})
onEvent('item.tooltip', tooltip => {
    tooltip.add('kubejs:medical_kits',['蹲下右键以使用','§3提供：立刻回复生命值，提供2.2s生命恢复,总恢复4点生命值','§4冷却：2.8s'])
    tooltip.add('immersiveengineering:watermill','§4该物品禁用合成')
    tooltip.add('lightmanscurrency:coinmint','§4该物品禁用合成')
    tooltip.add('lightmanscurrency:terminal','§4该物品禁用合成')
    tooltip.add('lightmanscurrency:portable_terminal','§4该物品禁用合成')
    tooltip.add('lightmanscurrency:gem_terminal','§4该物品禁用合成')
    tooltip.add('lightmanscurrency:portable_gem_terminal','§4该物品禁用合成')
    tooltip.add('lightmanscurrency:item_trader_interface','§4该物品禁用合成')
    tooltip.add('lightmanscurrency:paygate','§4该物品禁用合成')
    tooltip.add('lctech:fluid_trader_interface','§4该物品禁用合成')
    tooltip.add('lctech:energy_trader_interface','§4该物品禁用合成')
})