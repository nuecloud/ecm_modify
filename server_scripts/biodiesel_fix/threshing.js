/**
 * TFC 谷物脱粒自动化脚本
 * 
 * 问题描述：
 * TFC 的谷物（小麦、大麦等）需要用小刀手工脱粒，Create 模组会自动将 TFC 的高级无序合成配方
 * 转换为 mixing 配方，导致玩家可以用动力搅拌器自动脱粒，但原配方的工具耐久损耗和干草副产物
 * 逻辑无法在 Create mixing 中正确实现。
 * 
 * 解决方案：
 * 1. 删除 TFC 原版谷物脱粒配方（tfc:crafting/food/<crop>_grain）
 * 2. 重建配方并添加 _manual_only 后缀，阻止 Create 自动生成 mixing 配方
 * 3. 手动创建 Create mixing 配方，实现：
 *    - 输入：非腐败的原始作物（继承 TFC 的 not_rotten 条件）
 *    - 输出：谷物粒（100%）+ 干草（85%概率）
 * 
 * 架构说明：
 * 脚本遍历 #c:foods/grain 标签下的所有物品，按命名空间分发处理逻辑。
 * 各命名空间只需实现自己的：配方ID构造、原配方JSON解析、输入/输出提取、Create mixing ID
 * 
 * 共享逻辑（统一在参数检查后执行）：
 * - 删除原配方
 * - 重建带 _manual_only 后缀的配方
 * - 创建 Create mixing 自动化配方
 * 
 * 扩展方式：
 * 添加 else if (grainId.startsWith('<namespace>:')) 分支，
 * 在分支内设置 recipeId、recipeJson、inputIngredient、outputId、outputCount、mixingId。
 * else return; 保留，作为白名单机制，确保任何新命名空间都必须显式处理。
 */
ServerEvents.recipes(event => {
    // 获取 c:foods/grain 标签下的所有物品栈
    var grainStacks = Ingredient.of('#c:foods/grain').stackArray;
    var processed = 0;

    // 遍历每个谷物粒
    grainStacks.forEach(stack => {
        // 获取物品 ID，如 "tfc:food/wheat_grain"
        var grainId = String(stack.getItem());

        // ========== 命名空间分发 ==========
        // 初始化各命名空间通用变量
        var recipeId = null;
        var recipeJson = null;
        var inputIngredient = null;
        var outputId = null;
        var outputCount = 1;
        var mixingId = null;

        if (grainId.startsWith('tfc:')) {
            // === TFC 命名空间处理 ===
            
            // 从谷物粒 ID 推导原始作物 ID
            // tfc:food/wheat_grain → tfc:food/wheat
            var rawCropId = grainId.substring(0, grainId.lastIndexOf('_grain'));
            
            // 构建配方 ID：tfc:crafting/food/<crop>_grain
            recipeId = 'tfc:crafting/' + rawCropId.substring(4) + '_grain';
            mixingId = 'kubejs:mixing/tfc_threshing/' + rawCropId.substring(4).replace('/', '_');

            // 查找对应的原版配方并解析 JSON
            var recipes = event.findRecipes({ id: recipeId });
            if (recipes.isEmpty()) return;
            var jsonStr = recipes.getFirst().json.toString();
            recipeJson = JSON.parse(jsonStr);

            // 查找 ingredients 中带 children 的复合 ingredient（TFC 的 and 条件）
            // 这通常包含原始作物和 not_rotten 条件
            for (var i = 0; i < recipeJson.ingredients.length; i++) {
                if (recipeJson.ingredients[i].children) {
                    inputIngredient = recipeJson.ingredients[i];
                    break;
                }
            }
            if (!inputIngredient) return;

            // 提取配方输出信息
            outputCount = recipeJson.result.stack.count || 1;
            outputId = recipeJson.result.stack.id;

        } else {
            // 其他命名空间（如 firmalife）暂不处理
            return;
        }
        // ========== 命名空间分发结束 ==========

        // 检查是否成功提取了所有必要参数
        if (!recipeId || !recipeJson || !inputIngredient || !outputId || !mixingId) return;

        // ========== 共享逻辑 ==========
        
        // 删除原版配方
        event.remove({ id: recipeId });
        
        // 重建配方并添加 _manual_only 后缀，阻止 Create 自动生成 mixing
        event.custom(recipeJson).id(recipeId + '_manual_only');

        // 创建 Create mixing 配方
        event.recipes.create.mixing(
            [
                // 主产物：谷物粒（100%概率）
                CreateItem.of(Item.of(outputId, outputCount), 1.0),
                // 副产物：干草（85%概率）
                CreateItem.of(Item.of('tfc:straw'), 0.85)
            ],
            // 输入：继承原版配方的复合 ingredient（包含 not_rotten 条件）
            [Ingredient.of(inputIngredient, 1)],
            // 处理时间：100 ticks = 5 秒
            100
        ).id(mixingId);

        processed++;
    });

    // 输出处理结果日志
    if (processed > 0) {
        console.info('[脱粒] 处理了 ' + processed + ' 个谷物脱粒配方：');
        console.info('[脱粒] - 删除了原 TFC 手工配方并重建 _manual_only 版本');
        console.info('[脱粒] - 创建了 Create mixing 自动化配方（85%概率产干草）');
    }
});
