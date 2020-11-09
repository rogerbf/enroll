const { enrollment } = require("../")

const channels = enrollment()

channels.subscribe(console.log.bind(null, "first"))
channels.subscribe({ a: console.log.bind(null, "second") })

channels.broadcast("one")
// first one
channels.broadcast({ a: "two" })
// first { a: 'two' }
// second two
