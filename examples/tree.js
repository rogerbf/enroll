const { tree } = require("../")

const channels = tree()

const unsubscribe = channels.subscribe({
  a: console.log.bind(null, "a1:"),
  b: console.log.bind(null, "b1:"),
})

channels.broadcast({ a: "can you hear me" })
// a1: can you hear me

channels.subscribe({ a: console.log.bind(null, "a2:") })

channels.broadcast({ a: "your circuit's dead", b: "can you hear me" })
// a1: your circuit's dead
// a2: your circuit's dead
// b1: can you hear me

unsubscribe()

channels.broadcast({ a: "there's something wrong" })
// a2: there's something wrong
