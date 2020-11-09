const { list } = require("../")

const channel = list()

const unsubscribe = channel.subscribe(console.log.bind(null, "first:"))

channel.broadcast("can you hear me")
// first: can you hear me

channel.subscribe(console.log.bind(null, "second:"))

channel.broadcast("your circuit's dead")
// first: your circuit's dead
// second: your circuit's dead

unsubscribe()

channel.broadcast("there's something wrong")
// second: there's something wrong
