# enroll

- [`list`](#list)
  - [`list([getInitialBroadcast])`](#listgetinitialbroadcast)
- [`tree`](#tree)
  - [`tree([getInitialBroadcast])`](#treegetinitialbroadcast)
- [`enrollment`](#enrollment)

## `list`

```javascript
import { list } from "enroll"

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
```

The implementation is heavily inspired by how subscriptions are implemented in Redux. This is reflected in the tests, some of which are adapted Redux tests.

### `list([getInitialBroadcast])`

`getInitialBroadcast` is a function that returns an initial value for the listener to be called with upon subscribe.

**Instance methods:**

- `subscribe(listener)`
  - `listener` is a function.
- `broadcast([...args])`

## `tree`

```javascript
import { tree } from "enroll"

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
```

### `tree([getInitialBroadcast])`

`getInitialBroadcast` is a function that returns an initial value for the listener to be called with upon subscribe.

**Instance methods:**

- `subscribe(listener)`
  - `listener` is an object with a single branch, where the outermost node is a function.
- `broadcast([...args])`

**Note:**

A function identity can only be added to a specific path in the tree once, the same function identity can however be added to multiple unique paths in the same tree (with separate `subscribe` calls).

## `enrollment`

Combines `list` and `tree`.

```javascript
import { enrollment } from "enroll"

const channels = enrollment()

channels.subscribe(console.log.bind(null, "first"))
channels.subscribe({ a: console.log.bind(null, "second") })

channels.broadcast("one")
// first one
channels.broadcast({ a: "two" })
// first { a: 'two' }
// second two
```
