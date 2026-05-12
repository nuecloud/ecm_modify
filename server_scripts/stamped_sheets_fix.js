// =============================================================================
// 机械动力冲压板与TFC锻造薄板修复脚本
// =============================================================================
// 问题：Create冲压板与TFC锻造薄板使用相同的c:sheets标签，导致经济不平衡
// 解决方案：
//   1. 创建独立的kubejs标签专门供TFC相关配方使用
//   2. 替换TFC及其附属模组配方中的标签引用
//   3. 添加冲压板的独立加热配方和双向转换配方
// =============================================================================

// 全局变量
const singleSheetsMetalList = []  // TFC单层板物品列表
const doubleSheetsMetalList = []  // TFC双层板物品列表

// 其他模组冲压板映射（用于建立与TFC锻造板的关系）
// 格式: c:plates/<材料> -> {item: 冲压板物品ID, temperature: 熔化温度}
const otherModPlateMap = {
    'c:plates/copper':          {'item':'create:copper_sheet','temperature':1080},
    'c:plates/wrought_iron':    {'item':'create:iron_sheet','temperature':1538},
    'c:plates/gold':            {'item':'create:golden_sheet','temperature':1064},
    'c:plates/brass':           {'item':'create:brass_sheet','temperature':940},
    'c:plates/zinc':            {'item':'createdeco:zinc_sheet','temperature':419}
}

// 主映射表：所有板材关系的核心数据
// 格式: tag -> {
//   tfcItemID: TFC锻造板物品ID,
//   sheetItemID: 对应其他模组冲压板物品ID,
//   fluidID: 熔化后产出流体ID,
//   fluidAmount: 熔化后产出流体数量,
//   temperature: 熔化温度,
//   tagID: 使用的材料标签ID
// }
const sheetsItemMap = {}

// =============================================================================
// 标签事件：建立独立的TFC板材标签
// =============================================================================
ServerEvents.tags('item', event => {
    // 步骤1: 扫描所有物品，收集TFC锻造板
    Item.getList().forEach(item => {
        const id = item.id.toString()
        if (id.startsWith('tfc:metal/sheet/')) {
            singleSheetsMetalList.push(id)
        } else if (id.startsWith('tfc:metal/double_sheet/')) {
            doubleSheetsMetalList.push(id)
        }
    })

    // 步骤2: 处理单层锻造板
    singleSheetsMetalList.forEach(itemID => {
        const metalType = itemID.split('/')[2]
        
        // 创建独立标签 kubejs:tfc_single_sheets/<材料>，仅包含TFC锻造板
        event.add(`kubejs:tfc_single_sheets/${metalType}`, itemID)
        
        // 构建相关的公共标签映射
        const publicTags = [`c:sheets/${metalType}`,`c:plates/${metalType}`]
        publicTags.forEach(tag => {
            if (!sheetsItemMap[tag]) sheetsItemMap[tag] = {}
            
            sheetsItemMap[tag].tfcItemID = itemID
            sheetsItemMap[tag].fluidAmount = 100  // 单层板熔化产出100mB
            
            // 锻铁板特殊处理：加热产出铸铁液而非铁液
            if (metalType == 'wrought_iron') {
                sheetsItemMap[tag].fluidID = `tfc:metal/cast_iron`
                sheetsItemMap[tag].tagID = tag.replace('wrought_iron','iron')
            } else {
                sheetsItemMap[tag].fluidID = `tfc:metal/${metalType}`
                sheetsItemMap[tag].tagID = tag
            }
            
            // 如果有对应的其他模组冲压板，加入映射
            if (otherModPlateMap[tag]) {
                sheetsItemMap[tag].sheetItemID = otherModPlateMap[tag].item
                sheetsItemMap[tag].temperature = otherModPlateMap[tag].temperature
            }
        })
    })

    // 步骤3: 处理双层锻造板
    doubleSheetsMetalList.forEach(itemID => {
        const metalType = itemID.split('/')[2]
        
        // 创建独立标签 kubejs:tfc_double_sheets/<材料>
        event.add(`kubejs:tfc_double_sheets/${metalType}`, itemID)
        
        const publicTags = [`c:double_sheets/${metalType}`,`c:double_plates/${metalType}`]
        publicTags.forEach(tag => {
            if (!sheetsItemMap[tag]) sheetsItemMap[tag] = {}
            
            sheetsItemMap[tag].tfcItemID = itemID
            sheetsItemMap[tag].fluidAmount = 200  // 双层板熔化产出200mB
            
            if (metalType == 'wrought_iron') {
                sheetsItemMap[tag].fluidID = `tfc:metal/cast_iron`
                sheetsItemMap[tag].tagID = tag.replace('wrought_iron','iron')
            } else {
                sheetsItemMap[tag].fluidID = `tfc:metal/${metalType}`
                sheetsItemMap[tag].tagID = tag
            }
            
            if (otherModPlateMap[tag]) {
                sheetsItemMap[tag].sheetItemID = otherModPlateMap[tag].item
                sheetsItemMap[tag].temperature = otherModPlateMap[tag].temperature
            }
        })
    })
})

// =============================================================================
// 配方事件：替换标签并添加新配方
// =============================================================================
ServerEvents.recipes(event => {
    // =========================================================================
    // 部分1: 替换TFC相关模组配方中的标签引用
    // =========================================================================
    const tfcMods = ['tfc','firmalife','tfcastikorcarts','tfc_items','tfcfertigation']
    
    tfcMods.forEach(mod => {
        // 替换单层板标签：c:sheets/* -> kubejs:tfc_single_sheets/*
        singleSheetsMetalList.forEach(itemID => {
            const metalType = itemID.split('/')[2]
            event.replaceInput(
                {mod: mod},
                `#c:sheets/${metalType}`,
                `#kubejs:tfc_single_sheets/${metalType}`
            )
        })
        
        // 替换双层板标签：c:double_sheets/* -> kubejs:tfc_double_sheets/*
        doubleSheetsMetalList.forEach(itemID => {
            const metalType = itemID.split('/')[2]
            event.replaceInput(
                {mod: mod},
                `#c:double_sheets/${metalType}`,
                `#kubejs:tfc_double_sheets/${metalType}`
            )
        })
    })

    // =========================================================================
    // 部分2: 为每个冲压板添加配方
    // =========================================================================
    Object.entries(sheetsItemMap).forEach(([tag, data]) => {
        // 只处理有对应冲压板的金属
        if (data.sheetItemID && data.temperature) {
            const safeSheetItemID = data.sheetItemID.replace(':', '_')
            
            // =====================================================================
            // 1. 冲压板熔化配方
            // =====================================================================
            // 1.1 TFC加热配方：冲压板 -> 对应金属液(100mB)
            const tfcHeatingRecipeId = `kubejs:tfc/heating/${safeSheetItemID}`
            event.recipes.tfc.heating(data.sheetItemID, data.temperature)
                .fluidOutput(Fluid.of(data.fluidID, data.fluidAmount))
                .id(tfcHeatingRecipeId)
            
            // 1.2 Create Big Cannons熔化配方
            const cbcMeltingRecipeId = `kubejs:createbigcannons/melting/${safeSheetItemID}`
            const cbcHeatRequirement = data.temperature > 1080 ? 'superheated' : 'heated'
            const processingTime = Math.round(400 + (data.temperature - 1080) * (200 / 420))
            const ingredientArray = [{tag: data.tagID}]
            
            event.custom({
                type: 'createbigcannons:melting',
                heat_requirement: cbcHeatRequirement,
                ingredients: ingredientArray,
                processing_time: processingTime,
                results: [{
                    amount: data.fluidAmount,
                    id: data.fluidID
                }]
            }).id(cbcMeltingRecipeId)

            // =====================================================================
            // 2. 冲压板与锻造板双向转换
            // =====================================================================
            // 2.1 塑形配方：2个冲压板 + 助焊剂 -> TFC锻造板
            const plateToSheetCompactingRecipeId = `kubejs:create/compacting/${safeSheetItemID}`
            const compactingRecipe = event.recipes.create.compacting(
                data.tfcItemID,
                [
                    Ingredient.of(`#${data.tagID}`, 2),
                    Ingredient.of(`tfc:powder/flux`)
                ]
            )
            
            if (data.temperature < 1080) {
                compactingRecipe.heated()
            } else {
                compactingRecipe.superheated()
            }
            compactingRecipe.id(plateToSheetCompactingRecipeId)
            
            // 2.2 切削配方：TFC锻造板 -> 2个冲压板（不返还助焊剂）
            const sheetToPlateCuttingRecipeId = `kubejs:create/cutting/${safeSheetItemID}`
            event.recipes.create.cutting(`2x ${data.sheetItemID}`, `${data.tfcItemID}`)
                .id(sheetToPlateCuttingRecipeId)
        }
    })
})