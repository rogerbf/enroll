const enroll = require(`../`)

const channel = enroll()

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
