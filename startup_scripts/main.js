ItemEvents.modification(event => {
  event.modify('tfc:ore/bituminous_coal', item => {
    item.burnTime = 1600
  })
  event.modify('tfc:ore/lignite', item => {
    item.burnTime = 1200
  })
})