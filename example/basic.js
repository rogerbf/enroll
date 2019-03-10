const { root } = require(`../`)

const channel = root()

const unsubscribe = channel.subscribe(console.log)

channel.broadcast(`can you hear me`)
// can you hear me

channel.subscribe(console.log)

channel.broadcast(`your circuit's dead`)
// your circuit's dead
// your circuit's dead

unsubscribe()

channel.broadcast(`there's something wrong`)
// there's something wrong
