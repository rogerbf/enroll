# enroll

## `root`

```javascript
import { root } from "enroll"

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
```

## `tree`

```javascript
import { tree } from "enroll"

const channel = tree()

const unsubscribe = channel.subscribe({ a: console.log, b: console.log })

channel.broadcast({ a: `can you hear me` })
// can you hear me
// undefined

channel.subscribe({ a: console.log })

channel.broadcast({ a: `your circuit's dead`, b: `can you hear me` })
// your circuit's dead
// your circuit's dead
// can you hear me

unsubscribe()

channel.broadcast({ a: `there's something wrong` })
// there's something wrong
```
