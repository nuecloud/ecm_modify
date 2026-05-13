// =============================================================================
// 机械动力冲压板与TFC锻造薄板修复脚本
// =============================================================================
// 问题：
//   - Create冲压板（sheet）与TFC锻造薄板共用 c:sheets/<金属> 标签
//   - 导致TFC配方可以误用Create冲压板，造成经济不平衡
//   - 需要将两者在标签层面分离，同时保留合理的转换途径
//
// 解决方案：
//   1. 扫描所有物品，收集TFC单层/双层锻造板
//   2. 为每种金属创建独立的kubejs标签（仅包含TFC锻造板）
//   3. 替换TFC及其附属模组配方中的标签引用，使其只使用TFC板
//   4. 为Create冲压板添加独立的加热熔化配方
//   5. 添加冲压板与TFC锻造板的双向转换配方
// =============================================================================

// =============================================================================
// 配置数据区域 - 方便修改和调试
// =============================================================================

// 其他模组冲压板映射表
// 用途：建立Create等模组的冲压板与TFC锻造板的对应关系
// 格式: c:plates/<材料> -> {item: 冲压板物品ID, temperature: 熔化温度(摄氏度)}
// 注意：这里的温度用于判断加热级别和熔化配方
const otherModPlateMap = {
    'c:plates/copper':          {'item':'create:copper_sheet','temperature':1080},
    'c:plates/wrought_iron':    {'item':'create:iron_sheet','temperature':1538},
    'c:plates/gold':            {'item':'create:golden_sheet','temperature':1064},
    'c:plates/brass':           {'item':'create:brass_sheet','temperature':940},
    'c:plates/zinc':            {'item':'createdeco:zinc_sheet','temperature':419}
}

// TFC及其附属模组列表
// 这些模组的配方如果使用了c:sheets/*标签，都需要替换
const tfcMods = ['tfc','firmalife','tfcastikorcarts','tfc_items','tfcfertigation']

// =============================================================================
// 脚本主体
// =============================================================================

// 全局变量：存储扫描到的TFC板材物品ID
const singleSheetsMetalList = []  // TFC单层锻造板（tfc:metal/sheet/*）
const doubleSheetsMetalList = []  // TFC双层锻造板（tfc:metal/double_sheet/*）

// 主映射表：所有板材关系的核心数据
// 键：公共标签（如 c:sheets/copper, c:plates/copper, c:double_sheets/copper）
// 值：包含以下字段的对象
//   - tfcItemID:    对应的TFC锻造板物品ID
//   - sheetItemID:  对应的其他模组冲压板物品ID（如create:copper_sheet）
//   - fluidID:      熔化后产出的流体ID（如tfc:metal/copper）
//   - fluidAmount:  熔化后产出的流体数量（单层100mB，双层200mB）
//   - temperature:  熔化温度（摄氏度）
//   - tagID:        用于配方输入的材料标签ID
const sheetsItemMap = {}

// =============================================================================
// 标签事件：扫描物品并建立独立的TFC板材标签
// 执行时机：服务器启动时，用于注册自定义物品标签
// =============================================================================
ServerEvents.tags('item', event => {
    // 步骤1: 扫描所有注册的物品，收集TFC锻造板
    // 通过检查物品ID前缀来区分单层板和双层板
    Item.getList().forEach(item => {
        const id = item.id.toString()
        if (id.startsWith('tfc:metal/sheet/')) {
            singleSheetsMetalList.push(id)
        } else if (id.startsWith('tfc:metal/double_sheet/')) {
            doubleSheetsMetalList.push(id)
        }
    })

    // 步骤2: 处理单层锻造板
    // 为每种金属创建kubejs:tfc_single_sheets/<metal>标签，并填充sheetsItemMap
    singleSheetsMetalList.forEach(itemID => {
        // 从物品ID中提取金属类型（如 'copper', 'iron', 'wrought_iron'）
        const metalType = itemID.split('/')[2]
        
        // 创建独立标签，仅包含TFC锻造板，不包含Create冲压板
        event.add(`kubejs:tfc_single_sheets/${metalType}`, itemID)
        
        // 构建相关的公共标签列表（c:sheets和c:plates都指向同一映射）
        // 这样无论配方使用哪种标签，都能正确关联到TFC物品
        const publicTags = [`c:sheets/${metalType}`,`c:plates/${metalType}`]
        publicTags.forEach(tag => {
            // 延迟初始化：如果映射不存在则创建空对象
            if (!sheetsItemMap[tag]) sheetsItemMap[tag] = {}
            
            // 记录TFC锻造板物品ID
            sheetsItemMap[tag].tfcItemID = itemID
            // 单层板熔化产出100mB流体（TFC标准）
            sheetsItemMap[tag].fluidAmount = 100
            
            // 特殊处理：锻铁（wrought_iron）加热后产出铸铁液而非铁液
            // 这是TFC的冶金机制：锻铁是熟铁，加热后渗碳变成铸铁
            if (metalType == 'wrought_iron') {
                sheetsItemMap[tag].fluidID = `tfc:metal/cast_iron`
                // 标签中的wrought_iron替换为iron，因为流体是cast_iron
                sheetsItemMap[tag].tagID = tag.replace('wrought_iron','iron')
            } else {
                sheetsItemMap[tag].fluidID = `tfc:metal/${metalType}`
                sheetsItemMap[tag].tagID = tag
            }
            
            // 如果有对应的其他模组冲压板（如Create），加入映射关系
            if (otherModPlateMap[tag]) {
                sheetsItemMap[tag].sheetItemID = otherModPlateMap[tag].item
                sheetsItemMap[tag].temperature = otherModPlateMap[tag].temperature
            }
        })
    })

    // 步骤3: 处理双层锻造板（逻辑与单层板类似，但流体数量翻倍）
    doubleSheetsMetalList.forEach(itemID => {
        const metalType = itemID.split('/')[2]
        
        // 创建双层板的独立标签
        event.add(`kubejs:tfc_double_sheets/${metalType}`, itemID)
        
        // 双层板对应的公共标签
        const publicTags = [`c:double_sheets/${metalType}`,`c:double_plates/${metalType}`]
        publicTags.forEach(tag => {
            if (!sheetsItemMap[tag]) sheetsItemMap[tag] = {}
            
            sheetsItemMap[tag].tfcItemID = itemID
            // 双层板熔化产出200mB流体（是单层板的两倍）
            sheetsItemMap[tag].fluidAmount = 200
            
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
// 配方事件：替换标签引用并添加新配方
// 执行时机：服务器启动时，用于修改和注册配方
// =============================================================================
ServerEvents.recipes(event => {
    // =========================================================================
    // 部分1: 替换TFC相关模组配方中的标签引用
    // 目的：让TFC及其附属模组的配方只能使用TFC锻造板，不能使用Create冲压板
    // =========================================================================
    // 使用从配置文件导入的 tfcMods 列表
    // 这些模组的配方如果使用了c:sheets/*标签，都需要替换
    tfcMods.forEach(mod => {
        // 替换单层板标签
        // 将配方输入中的 #c:sheets/<metal> 替换为 #kubejs:tfc_single_sheets/<metal>
        // 这样TFC配方只会消耗TFC锻造板，不会误消耗Create冲压板
        singleSheetsMetalList.forEach(itemID => {
            const metalType = itemID.split('/')[2]
            event.replaceInput(
                {mod: mod},                          // 只替换指定模组的配方
                `#c:sheets/${metalType}`,            // 原标签（包含Create冲压板）
                `#kubejs:tfc_single_sheets/${metalType}`  // 新标签（仅TFC板）
            )
        })
        
        // 替换双层板标签（逻辑同上）
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
    // 部分2: 为每个冲压板添加新配方
    // 包括：熔化配方、与TFC板的双向转换配方
    // =========================================================================
    Object.entries(sheetsItemMap).forEach(([tag, data]) => {
        // 只处理有对应冲压板的金属（如铜、铁、金、黄铜、锌）
        // 如果sheetItemID或temperature不存在，说明该金属没有对应的冲压板
        if (data.sheetItemID && data.temperature) {
            // 将物品ID中的冒号替换为斜杠，用于构建安全的配方ID（避免ID冲突）
            const safeSheetItemID = data.sheetItemID.replace(':', '/')
            const safeFluidID = data.fluidID.replace(':', '/')
            
            // =====================================================================
            // 1. 冲压板熔化配方
            // 用途：让冲压板可以通过加热变成金属液，与TFC机制保持一致
            // =====================================================================
            // 1.1 TFC加热配方：冲压板 -> 对应金属液
            // 将冲压板放在TFC加热设备上，达到指定温度后熔化成液体
            const tfcHeatingRecipeId = `kubejs:tfc/heating/${safeFluidID}/${safeSheetItemID}`
            event.recipes.tfc.heating(data.sheetItemID, data.temperature)
                .fluidOutput(Fluid.of(data.fluidID, data.fluidAmount))
                .id(tfcHeatingRecipeId)
            
            // 1.2 Create Big Cannons熔化配方
            // 如果安装了CBC模组，冲压板也可以在CBC的熔炉中熔化
            const cbcMeltingRecipeId = `kubejs:createbigcannons/melting/${safeFluidID}/${safeSheetItemID}`
            // 温度>1080°C需要超高温（superheated），否则普通加热（heated）
            const cbcHeatRequirement = data.temperature > 1080 ? 'superheated' : 'heated'
            // 处理时间：基础400tick + 温度差 * 系数
            // 温度越高，熔化时间越长（1080°C=400tick, 1500°C≈600tick）
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
            // 2. 冲压板与TFC锻造板的双向转换配方
            // 目的：允许玩家在两种板材之间转换，但需要付出一定代价（助焊剂）
            // =====================================================================
            // 2.1 塑形配方：2个冲压板 + 助焊剂 -> 1个TFC锻造板
            // 模拟金属加工：冲压板通过加热和助焊剂焊接成锻造板
            const safeTfcItemID = data.tfcItemID.replace(':', '/')
            const plateToSheetCompactingRecipeId = `kubejs:create/compacting/${safeTfcItemID}/${safeSheetItemID}`
            const compactingRecipe = event.recipes.create.compacting(
                data.tfcItemID,  // 输出：TFC锻造板
                [
                    Ingredient.of(`#${data.tagID}`, 2),  // 输入：2个冲压板（使用标签，兼容其他模组）
                    Ingredient.of(`tfc:powder/flux`)      // 消耗：助焊剂（增加成本）
                ]
            )
            
            // 根据金属熔点选择加热级别
            if (data.temperature > 1080) {
                compactingRecipe.superheated()  // 高熔点金属需要超高温
            } else {
                compactingRecipe.heated()       // 低熔点金属只需普通加热
            }
            compactingRecipe.id(plateToSheetCompactingRecipeId)
            
            // 2.2 切削配方：1个TFC锻造板 -> 2个冲压板
            // 模拟金属加工：锻造板可以通过机械切割成两个冲压板
            // 注意：不返还助焊剂，所以逆向转换是有损耗的
            const sheetToPlateCuttingRecipeId = `kubejs:create/cutting/${safeSheetItemID}/${safeTfcItemID}`
            event.recipes.create.cutting(`2x ${data.sheetItemID}`, `${data.tfcItemID}`)
                .id(sheetToPlateCuttingRecipeId)
        }
    })
})