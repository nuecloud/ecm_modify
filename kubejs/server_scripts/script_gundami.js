//禁用物品右键
onEvent('block.right_click', event=>{
    let banBlockList = ["lightmanscurrency:coinmint","lightmanscurrency:terminal","lightmanscurrency:gem_terminal","lightmanscurrency:item_trader_interface","lightmanscurrency:paygate","lctech:fluid_trader_interface","lctech:energy_trader_interface","create:filter","create:attribute_filter"]
    if(banBlockList.indexOf(event.block)!=-1){
      event.cancel();
    }
  })

  onEvent('item.right_click', event=>{
    let banItemList = ["create:filter","create:attribute_filter"]
    if(banItemList.indexOf(event.item)!=-1){
      event.cancel();
    }
  })