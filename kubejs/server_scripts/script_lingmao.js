// priority: 0

settings.logAddedRecipes = true
settings.logRemovedRecipes = true
settings.logSkippedRecipes = false
settings.logErroringRecipes = true

console.info('Hello, World! (You will see this line every time server resources reload)')

onEvent('recipes', event => {
	event.remove({ id: 'immersiveengineering:blueprint/component_iron' })
	event.custom(
		{"type":"immersiveengineering:blueprint","inputs":[{"count":1,"base_ingredient":{"tag":"forge:plates/iron"}},{"tag":"forge:ingots/copper"},{"item":"create:cogwheel"},{"item":"create:shaft"}],"category":"components","result":{"item":"immersiveengineering:component_iron","count":2}}
	)
	event.remove({id: 'immersiveengineering:blueprint/component_steel' })
	event.custom(
		{"type":"immersiveengineering:blueprint","inputs":[{"count":1,"base_ingredient":{"tag":"forge:plates/steel"}},{"item":"create:large_cogwheel"},{"item":"create:cogwheel"},{"item":"create:andesite_alloy"},{"item":"create:shaft"}],"category":"components","result":{"item":"immersiveengineering:component_steel","count":2}}
	)
	event.remove({id: 'immersiveengineering:blueprint/electron_tube' })
	event.custom(
		{"type":"immersiveengineering:blueprint","inputs":[{"tag":"forge:glass_panes"},{"tag":"forge:plates/nickel"},{"tag":"forge:plates/copper"},{"tag":"forge:wires/electrum"}],"category":"components","result":{"item":"immersiveengineering:electron_tube","count":3}}
	)
	event.remove({id:'immersiveengineering:blueprint/light_bulb'})
	event.custom(
		{"type":"immersiveengineering:blueprint","inputs":[{"tag":"forge:glass_panes"},{"count":3,"base_ingredient":[{"tag":"forge:wires/electrum"}]},{"tag":"forge:ingots/copper"}],"category":"components","result":{"item":"immersiveengineering:light_bulb","count":3}}
	)
	event.custom(
		{"type":"immersiveengineering:arc_furnace","results":[{"count":1,"base_ingredient":{"item":"immersiveengineering:ingot_hop_graphite"}}],"additives":[],"input":{"count":8,"base_ingredient":{"item":"immersiveengineering:dust_hop_graphite"}},"time":200,"energy":102400}
	)
	event.remove({id:'immersiveengineering:crafting/light_engineering'})
	event.shaped('2x immersiveengineering:light_engineering', [
		'UIU',
		'SWS',
		'CIC'
	], {
		U: '#forge:plates/iron',
		I: '#forge:ingots/iron',
		S: 'create:shaft',
		W: 'immersiveengineering:wirecoil_copper',
		C: '#forge:wires/copper'
	})
	event.remove({id:'immersiveengineering:crafting/heavy_engineering'})
	event.shaped('2x immersiveengineering:heavy_engineering',[
		'CEC',
		'STM',
		'CEC'
	],{
		C: 'immersiveengineering:component_steel',
		E: 'immersiveengineering:ingot_electrum',
		S: 'create:shaft',
		T: '#forge:sheetmetals/steel',
		M: 'create:mechanical_piston'
	})
	event.remove({id:'immersiveengineering:crafting/rs_engineering'})
	event.shaped('2x immersiveengineering:rs_engineering',[
		'QIQ',
		'RBR',
		'QIQ'
	],{
		Q: 'create:polished_rose_quartz',
		I: '#forge:plates/iron',
		R: '#forge:dusts/redstone',
		B: '#forge:storage_blocks/redstone'
	})
	event.remove({id:'immersiveengineering:crafting/radiator'})
	event.shaped('3x immersiveengineering:radiator',[
		'IFI',
		'IEI',
		'CFC'
	],{
		I: 'minecraft:iron_bars',
		F: 'create:fluid_pipe',
		E: 'create:encased_fan',
		C: '#forge:plates/copper'
	})
	event.remove({id:'immersiveengineering:crafting/generator'})
	event.shaped('immersiveengineering:generator',[
		'UIU',
		'SWS',
		'CIC'
	],{
		U: '#forge:plates/iron',
		I: '#forge:ingots/iron',
		S: 'create:shaft',
		W: 'immersiveengineering:wirecoil_copper',
		C: '#forge:wires/copper'
	})
	event.remove({id:'immersiveengineering:crafting/blastfurnace_preheater'})
	event.shaped('immersiveengineering:blastfurnace_preheater',[
		'CEC',
		'IFI',
		'IFI'
	],{
		C: '#forge:ingots/copper',
		E: 'create:encased_fan',
		I: '#forge:ingots/iron',
		F: 'immersiveengineering:fluid_pipe'
	})
	event.remove({id:'immersiveengineering:crafting/dynamo'})
	event.shaped('immersiveengineering:dynamo',[
		'C  ',
		'IGS',
		'C  '
	],{
		C: '#forge:ingots/copper',
		I: '#forge:sheetmetals/iron',
		G: 'immersiveengineering:generator',
		S: 'create:shaft'
	})
	event.remove({id:'immersiveengineering:crafting/fluid_pump'})
	event.shaped('immersiveengineering:fluid_pump',[
		' C ',
		'IMI',
		'CFC'
	],{
		C: 'immersiveengineering:component_iron',
		I: '#forge:plates/iron',
		M: 'create:mechanical_pump',
		F: 'immersiveengineering:fluid_pipe'
	})
	event.remove({id:'immersiveengineering:crafting/thermoelectric_generator'})
	event.shaped('immersiveengineering:thermoelectric_generator',[
		' E ',
		'LGL',
		'PSP'
	],{
		E: 'create:encased_fan',
		L: '#forge:plates/lead',
		G: 'immersiveengineering:generator',
		P: 'create:polished_rose_quartz',
		S: '#forge:sheetmetals/steel'
	})
	event.remove({id:'create:crafting/kinetics/speedometer'})
	event.shaped('create:speedometer',[
		' I ',
		'FAI',
		' S '
	],{
		I: 'immersiveengineering:component_iron',
		F: '#forge:compasses',
		A: 'create:andesite_casing',
		S: 'create:shaft'
	})
	event.remove({id:'create:crafting/kinetics/empty_blaze_burner'})
	event.shaped('create:empty_blaze_burner',[
		'I I',
		'I I',
		'EBF'
	],{
		I: 'minecraft:iron_bars',
		E: 'create:encased_fan',
		B: 'immersiveengineering:blastbrick',
		F: 'immersiveengineering:fluid_pipe'
	})
	event.remove({id:'create:crafting/kinetics/mechanical_saw'})
	event.shaped('create:mechanical_saw',[
		' S ',
		' A ',
		' I '
	],{
		S: '#forge:sawblades',
		A: 'create:andesite_casing',
		I: 'immersiveengineering:component_iron'
	})
	//event.remove({id:'create:crafting/kinetics/mechanical_drill'})
	//event.shaped('create:mechanical_drill',[
		//' D ',
		//' A ',
		//' I '
	//],{
		//D: 'immersiveengineering:drillhead_iron',
		//A: 'create:andesite_casing',
		//I: 'immersiveengineering:component_iron'
	//})
	event.remove({id:'immersiveengineering:crafting/drillhead_iron'})
	event.shaped('immersiveengineering:drillhead_iron',[
		' I ',
		'SII',
		' I '
	],{
		I: '#forge:plates/iron',
		S: 'create:shaft'
	})
	event.remove({id:'immersiveengineering:crafting/drillhead_steel'})
	event.shaped('immersiveengineering:drillhead_steel',[
		' G ',
		'SGG',
		' G '
	],{
		G: '#forge:plates/steel',
		S: 'create:shaft'
	})
	event.remove({id:'create:crafting/kinetics/rotation_speed_controller'})
	event.shaped('create:rotation_speed_controller',[
		' M ',
		' B ',
		'SIS'
	],{
		M: 'create:precision_mechanism',
		B: 'create:brass_casing',
		S: 'immersiveengineering:component_steel',
		I: 'immersiveengineering:component_iron'
	})
	event.remove({id:'create:crafting/kinetics/mechanical_arm'})
	event.shaped('create:mechanical_arm',[
		'SSH',
		'SB ',
		'CMC'
	],{
		S: '#forge:rods/steel',
		H: 'create:brass_hand',
		B: 'create:brass_casing',
		C: 'immersiveengineering:component_steel',
		M: 'create:precision_mechanism'
	})
	event.remove({id:'immersiveengineering:crafting/cloche'})
	event.recipes.createMechanicalCrafting('immersiveengineering:cloche',[
		' GSG ',
		' GLG ',
		' G G ',
		' ITI ',
		' CEC '
	],{
		G: '#forge:glass_panes',
		S: 'immersiveengineering:component_steel',
		L: 'immersiveengineering:light_bulb',
		I: 'immersiveengineering:component_iron',
		T: '#forge:treated_wood',
		C: '#immersiveengineering:circuits/pcb',
		E: 'immersiveengineering:light_engineering'
	})
	event.remove({id:'simpleplanes:furnace_engine'})
	event.recipes.createMechanicalCrafting('simpleplanes:furnace_engine',[
		'LSRSL',
		'SEBES',
		'RBFBR',
		'SEBES',
		'LSRSL'
	],{
		L: 'create:fluid_pipe',
		S: '#forge:plates/aluminum',
		R: 'immersiveengineering:radiator',
		E: 'create:steam_engine',
		B: 'create:blaze_burner',
		F: 'create:flywheel'
	})
	event.remove({id:'simpleplanes:electric_engine'})
	event.recipes.createMechanicalCrafting('simpleplanes:electric_engine',[
		'ALRLA',
		'AEGEA',
		'RGFGR',
		'AEGEA',
		'ALRLA'
	],{
		R: 'immersiveengineering:radiator',
		L: 'create:fluid_pipe',
		A: '#forge:plates/aluminum',
		E: 'createaddition:electric_motor',
		G: 'create:gearbox',
		F: 'create:flywheel'
	})
	event.custom(
		{
			"type":"createaddition:rolling",
			"input": {
				  "tag": "#forge:ingots/steel"
			},
			"result": {
				"tag": "#forge:ingots/steel",
				"count": 2
			}
		}
	)
	event.remove({id:'immersiveengineering:crafting/hammercrushing_copper'})
	event.remove({id:'immersiveengineering:crafting/hammercrushing_aluminum'})
	event.remove({id:'immersiveengineering:crafting/hammercrushing_lead'})
	event.remove({id:'immersiveengineering:crafting/hammercrushing_silver'})
	event.remove({id:'immersiveengineering:crafting/hammercrushing_nickel'})
	event.remove({id:'immersiveengineering:crafting/hammercrushing_uranium'})
	event.remove({id:'immersiveengineering:crafting/hammercrushing_gold'})
	event.remove({id:'immersiveengineering:crafting/hammercrushing_iron'})

	event.remove({id:'immersiveengineering:crafting/raw_hammercrushing_copper'})
	event.remove({id:'immersiveengineering:crafting/raw_hammercrushing_aluminum'})
	event.remove({id:'immersiveengineering:crafting/raw_hammercrushing_lead'})
	event.remove({id:'immersiveengineering:crafting/raw_hammercrushing_silver'})
	event.remove({id:'immersiveengineering:crafting/raw_hammercrushing_nickel'})
	event.remove({id:'immersiveengineering:crafting/raw_hammercrushing_uranium'})
	event.remove({id:'immersiveengineering:crafting/raw_hammercrushing_gold'})
	event.remove({id:'immersiveengineering:crafting/raw_hammercrushing_iron'})

	event.remove({id:'engineersdecor:dependent/small_solar_panel_recipe'})
	event.shaped('engineersdecor:small_solar_panel',[
		'RRR',
		'AEA',
		' S '
	],{
		R: 'create:polished_rose_quartz',
		A: '#forge:plates/aluminum',
		E: 'immersiveengineering:electron_tube',
		S: '#forge:plates/steel'
	})
	event.remove({id:'engineersdecor:independent/small_electrical_furnace_recipe'})
	event.shaped('engineersdecor:small_electrical_furnace',[
		'ICI',
		'WLW',
		'S S'
	],{
		I: 'immersiveengineering:component_iron',
		C: '#forge:ingots/copper',
		W: 'immersiveengineering:coil_lv',
		L: 'engineersdecor:small_lab_furnace',
		S: '#forge:plates/steel'
	})
	event.remove({id:'simpleplanes:solar_panel'})
	event.shaped('simpleplanes:solar_panel',[
		'SSS',
		'AWA',
		'   '
	],{
		S: 'engineersdecor:small_solar_panel',
		A: '#forge:plates/aluminum',
		W: 'immersiveengineering:wirecoil_copper'
	})
	event.remove({id:'simpleplanes:armor'})
	event.shaped('simpleplanes:armor',[
		'ISI',
		'ATA',
		'   '
	],{
		I: 'immersiveengineering:insulating_glass',
		S: '#forge:rods/steel',
		A: '#forge:plates/aluminum',
		T: '#forge:plates/steel'
	})
	event.remove({id:'simpleplanes:floaty_bedding'})
	event.shaped('simpleplanes:floaty_bedding',[
		'S S',
		'C C',
		'C C'
	],{
		S: '#forge:rods/steel',
		C: 'immersiveengineering:cushion'
	})
	event.remove({id:'create:item_application/railway_casing'})
	event.shaped('create:railway_casing',[
		'S S',
		'ECH',
		' I '
	],{
		S: '#forge:plates/steel',
		E: 'create:steam_engine',
		C: 'create:brass_casing',
		H: 'create:shaft',
		I: 'immersiveengineering:component_iron'
	})
	// Change recipes here
})

onEvent('item.tags', event => {
	// Get the #forge:cobblestone tag collection and add Diamond Ore to it
	// event.get('forge:cobblestone').add('minecraft:diamond_ore')

	// Get the #forge:cobblestone tag collection and remove Mossy Cobblestone from it
	// event.get('forge:cobblestone').remove('minecraft:mossy_cobblestone')
})