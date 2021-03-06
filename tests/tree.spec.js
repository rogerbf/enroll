const test = require("ava")
const sinon = require("sinon")
const { tree } = require("../source/tree.js")

test("it is a function", (t) => {
  t.is(typeof tree, "function")
})

test("there is a subscribe method", (t) => {
  const channel = tree()

  t.is(typeof channel.subscribe, "function")
})

test("there is a broadcast method", (t) => {
  const channel = tree()

  t.is(typeof channel.broadcast, "function")
})

test("it throws if listener is not an object", (t) => {
  const channel = tree()

  t.throws(() => channel.subscribe())
  t.throws(() => channel.subscribe(""))
  t.throws(() => channel.subscribe(0))
  t.throws(() => channel.subscribe([]))
  t.throws(() => channel.subscribe(() => {}))
})

// https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L196
test("it supports multiple subscriptions", (t) => {
  const channel = tree()

  const listenerA = sinon.fake()
  const listenerB = sinon.fake()

  let unsubscribeListenerA = channel.subscribe({ a: listenerA })

  channel.broadcast({ a: "a" })

  t.true(listenerA.calledOnce)
  t.true(listenerB.notCalled)

  channel.broadcast({ a: "a" })

  t.true(listenerA.calledTwice)
  t.true(listenerB.notCalled)

  const unsubscribeListenerB = channel.subscribe({ b: listenerB })

  t.true(listenerA.calledTwice)
  t.true(listenerB.notCalled)

  channel.broadcast({ a: "a", b: "b" })

  t.true(listenerA.calledThrice)
  t.true(listenerB.calledOnce)

  unsubscribeListenerA()

  t.true(listenerA.calledThrice)
  t.true(listenerB.calledOnce)

  channel.broadcast({ a: "a", b: "b" })

  t.true(listenerA.calledThrice)
  t.true(listenerB.calledTwice)

  unsubscribeListenerB()

  t.true(listenerA.calledThrice)
  t.true(listenerB.calledTwice)

  channel.broadcast({ a: "a", b: "b" })

  t.true(listenerA.calledThrice)
  t.true(listenerB.calledTwice)

  unsubscribeListenerA = channel.subscribe({ a: listenerA })

  t.true(listenerA.calledThrice)
  t.true(listenerB.calledTwice)

  channel.broadcast({ a: "a", b: "b" })

  t.is(listenerA.callCount, 4)
  t.true(listenerB.calledTwice)
})

// https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L243
test("it only removes listener once when unsubscribe is called", (t) => {
  const channel = tree()

  const listenerA = sinon.fake()
  const listenerB = sinon.fake()

  const unsubscribeListenerA = channel.subscribe({ a: listenerA })

  channel.subscribe({ b: listenerB })

  t.deepEqual(unsubscribeListenerA(), { a: listenerA })
  t.is(unsubscribeListenerA(), undefined)

  channel.broadcast({ b: "b" })

  t.true(listenerA.notCalled)
  t.true(listenerB.calledOnce)
})

test("the same listener can only be added once to the same path", (t) => {
  const channel = tree()

  const listener = sinon.fake()

  const unsubscribeFirst = channel.subscribe({ a: listener })
  const unsubscribeSecond = channel.subscribe({ a: listener })

  channel.broadcast({ a: "a" })

  t.true(listener.calledOnce)

  unsubscribeFirst()

  channel.broadcast({ a: "a" })

  t.true(listener.calledOnce)

  unsubscribeSecond()

  channel.broadcast({ a: "a" })

  t.true(listener.calledOnce)
})

// https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L273
test("it supports removing a subscription within a subscription", (t) => {
  const channel = tree()

  const listenerA = sinon.fake()
  const listenerB = sinon.fake()
  const listenerC = sinon.fake()

  channel.subscribe({ a: listenerA })

  const unsubscribeListenerB = channel.subscribe({
    a: () => {
      listenerB()
      unsubscribeListenerB()
    },
  })

  channel.subscribe({ a: listenerC })

  channel.broadcast({ a: "a" })
  channel.broadcast({ a: "a" })

  t.true(listenerA.calledTwice)
  t.true(listenerB.calledOnce)
  t.true(listenerC.calledTwice)
})

// https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L294
test("it notifies all subscribers about current broadcast regardless if any of them gets unsubscribed in the process", (t) => {
  const channel = tree()

  const unsubscribeHandles = []

  const unsubscribeAll = () =>
    unsubscribeHandles.forEach((unsubscribe) => unsubscribe())

  const listenerA = sinon.fake()
  const listenerB = sinon.fake()
  const listenerC = sinon.fake()

  unsubscribeHandles.push(channel.subscribe({ a: () => listenerA() }))

  unsubscribeHandles.push(
    channel.subscribe({
      a: () => {
        listenerB()
        unsubscribeAll()
      },
    })
  )

  unsubscribeHandles.push(channel.subscribe({ a: () => listenerC() }))

  channel.broadcast({ a: "a" })

  t.true(listenerA.calledOnce)
  t.true(listenerB.calledOnce)
  t.true(listenerC.calledOnce)

  channel.broadcast()

  t.true(listenerA.calledOnce)
  t.true(listenerB.calledOnce)
  t.true(listenerC.calledOnce)
})

// https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L325
test("it notifies only subscribers active at the moment of current broadcast", (t) => {
  const channel = tree()

  const listenerA = sinon.fake()
  const listenerB = sinon.fake()
  const listenerC = sinon.fake()

  let listenerCAdded = false

  const maybeAddListenerC = () => {
    if (!listenerCAdded) {
      listenerCAdded = true
      channel.subscribe({ a: () => listenerC() })
    }
  }

  channel.subscribe({ a: () => listenerA() })

  channel.subscribe({
    a: () => {
      listenerB()
      maybeAddListenerC()
    },
  })

  channel.broadcast({ a: "a" })

  t.true(listenerA.calledOnce)
  t.true(listenerB.calledOnce)
  t.true(listenerC.notCalled)

  channel.broadcast({ a: "a" })

  t.true(listenerA.calledTwice)
  t.true(listenerB.calledTwice)
  t.true(listenerC.calledOnce)
})

// https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L357
test("it uses the last snapshot of subscribers during nested broadcast", (t) => {
  const channel = tree()

  const listenerA = sinon.fake()
  const listenerB = sinon.fake()
  const listenerC = sinon.fake()
  const listenerD = sinon.fake()

  let unsubscribeListenerC

  const unsubscribeListenerA = channel.subscribe({
    a: () => {
      listenerA()

      t.true(listenerA.calledOnce)
      t.true(listenerB.notCalled)
      t.true(listenerC.notCalled)
      t.true(listenerD.notCalled)

      unsubscribeListenerA()

      unsubscribeListenerC = channel.subscribe({ a: listenerD })

      channel.broadcast({ a: "a" })

      t.true(listenerA.calledOnce)
      t.true(listenerB.calledOnce)
      t.true(listenerC.calledOnce)
      t.true(listenerD.calledOnce)
    },
  })

  channel.subscribe({ a: listenerB })
  channel.subscribe({ a: listenerC })

  channel.broadcast({ a: "a" })

  t.true(listenerA.calledOnce)
  t.true(listenerB.calledTwice)
  t.true(listenerC.calledTwice)
  t.true(listenerD.calledOnce)

  unsubscribeListenerC()

  channel.broadcast({ a: "a" })

  t.true(listenerA.calledOnce)
  t.true(listenerB.calledThrice)
  t.true(listenerC.calledThrice)
  t.true(listenerD.calledOnce)
})

test("it gets the initial broadcast once when subscribing", (t) => {
  const getInitialBroadcast = sinon.fake(() => 1)
  const channel = tree(getInitialBroadcast)
  const listener = { a: sinon.fake() }
  const unsubscribe = channel.subscribe(listener)

  t.true(getInitialBroadcast.calledOnce)
  t.true(listener.a.calledOnceWithExactly(1))

  channel.broadcast({ a: 2 })

  t.true(listener.a.calledTwice)

  t.deepEqual(
    listener.a.getCalls().map(({ args }) => args),
    [[1], [2]]
  )

  unsubscribe()

  channel.broadcast({ a: 3 })

  t.true(listener.a.calledTwice)
})

test("it throws an error if getInitialBroadcast is not a function", (t) => {
  t.throws(() => tree(""))
  t.throws(() => tree(1))
  t.throws(() => tree({}))
  t.throws(() => tree([]))
})

test("it returns the current subscribers via the .current property", (t) => {
  const listenerA = sinon.fake()
  const listenerB = sinon.fake()

  const channel = tree()

  const unsubscribeListenerA = channel.subscribe({ a: listenerA })

  t.deepEqual(channel.current, { a: listenerA })

  channel.subscribe({ a: listenerB })

  t.deepEqual(channel.current, { a: [listenerA, listenerB] })

  unsubscribeListenerA()

  t.deepEqual(channel.current, { a: listenerB })
})

test("internal listeners array cannot be mutated via '.current'", (t) => {
  const listenerA = sinon.fake()

  const channel = tree()

  channel.subscribe({ a: listenerA })

  delete channel.current.a

  t.deepEqual(channel.current, { a: listenerA })
})
