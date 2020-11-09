const test = require("ava")
const sinon = require("sinon")
const { list } = require("../source/list.js")

test("it is a function", (t) => {
  t.is(typeof list, "function")
})

test("there is a subscribe method", (t) => {
  const channel = list()

  t.is(typeof channel.subscribe, "function")
})

test("there is a broadcast method", (t) => {
  const channel = list()

  t.is(typeof channel.broadcast, "function")
})

test("subscribe throws if listener is not a function", (t) => {
  const channel = list()

  t.throws(() => channel.subscribe())
  t.throws(() => channel.subscribe(""))
  t.throws(() => channel.subscribe(0))
  t.throws(() => channel.subscribe([]))
  t.throws(() => channel.subscribe({}))
})

// https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L196
test("it supports multiple subscriptions", (t) => {
  const channel = list()
  const listenerA = sinon.fake()
  const listenerB = sinon.fake()

  let unsubscribeListenerA = channel.subscribe(listenerA)

  channel.broadcast()

  t.true(listenerA.calledOnce)
  t.true(listenerB.notCalled)

  channel.broadcast()

  t.true(listenerA.calledTwice)
  t.true(listenerB.notCalled)

  const unsubscribeListenerB = channel.subscribe(listenerB)

  t.true(listenerA.calledTwice)
  t.true(listenerB.notCalled)

  channel.broadcast()

  t.true(listenerA.calledThrice)
  t.true(listenerB.calledOnce)

  unsubscribeListenerA()

  t.true(listenerA.calledThrice)
  t.true(listenerB.calledOnce)

  channel.broadcast()

  t.true(listenerA.calledThrice)
  t.true(listenerB.calledTwice)

  unsubscribeListenerB()

  t.true(listenerA.calledThrice)
  t.true(listenerB.calledTwice)

  channel.broadcast()

  t.true(listenerA.calledThrice)
  t.true(listenerB.calledTwice)

  unsubscribeListenerA = channel.subscribe(listenerA)

  t.true(listenerA.calledThrice)
  t.true(listenerB.calledTwice)

  channel.broadcast()

  t.is(listenerA.callCount, 4)
  t.true(listenerB.calledTwice)
})

// https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L243
test("it only removes listener once when unsubscribe is called", (t) => {
  const channel = list()

  const listenerA = sinon.fake()
  const listenerB = sinon.fake()

  const unsubscribeListenerA = channel.subscribe(listenerA)
  channel.subscribe(listenerB)

  unsubscribeListenerA()
  unsubscribeListenerA()

  channel.broadcast()

  t.true(listenerA.notCalled)
  t.true(listenerB.calledOnce)
})

// https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L259
test("it only removes the relevant listener when unsubscribe is called", (t) => {
  const channel = list()
  const listener = sinon.fake()

  channel.subscribe(listener)

  const unsubscribeSecond = channel.subscribe(listener)

  unsubscribeSecond()
  unsubscribeSecond()

  channel.broadcast()

  t.true(listener.calledOnce)
})

// https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L273
test("it supports removing a subscription within a subscription", (t) => {
  const channel = list()

  const listenerA = sinon.fake()
  const listenerB = sinon.fake()
  const listenerC = sinon.fake()

  channel.subscribe(listenerA)

  const unsubscribeListenerB = channel.subscribe(() => {
    listenerB()
    unsubscribeListenerB()
  })

  channel.subscribe(listenerC)

  channel.broadcast()
  channel.broadcast()

  t.true(listenerA.calledTwice)
  t.true(listenerB.calledOnce)
  t.true(listenerC.calledTwice)
})

// https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L294
test("notifies all subscribers about current broadcast regardless if any of them gets unsubscribed in the process", (t) => {
  const channel = list()
  const unsubscribeHandles = []

  const unsubscribeAll = () =>
    unsubscribeHandles.forEach((unsubscribe) => unsubscribe())

  const listenerA = sinon.fake()
  const listenerB = sinon.fake()
  const listenerC = sinon.fake()

  unsubscribeHandles.push(channel.subscribe(() => listenerA()))

  unsubscribeHandles.push(
    channel.subscribe(() => {
      listenerB()
      unsubscribeAll()
    })
  )

  unsubscribeHandles.push(channel.subscribe(() => listenerC()))

  channel.broadcast()

  t.true(listenerA.calledOnce)
  t.true(listenerB.calledOnce)
  t.true(listenerC.calledOnce)

  channel.broadcast()

  t.true(listenerA.calledOnce)
  t.true(listenerB.calledOnce)
  t.true(listenerC.calledOnce)
})

// https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L325
test("it only notifies active listeners at the moment of current broadcast", (t) => {
  const channel = list()

  const listenerA = sinon.fake()
  const listenerB = sinon.fake()
  const listenerC = sinon.fake()

  let addedListenerC = false

  const maybeAddListenerC = () => {
    if (!addedListenerC) {
      addedListenerC = true
      channel.subscribe(() => listenerC())
    }
  }

  channel.subscribe(() => listenerA())

  channel.subscribe(() => {
    listenerB()
    maybeAddListenerC()
  })

  channel.broadcast()

  t.true(listenerA.calledOnce)
  t.true(listenerB.calledOnce)
  t.true(listenerC.notCalled)

  channel.broadcast()

  t.true(listenerA.calledTwice)
  t.true(listenerB.calledTwice)
  t.true(listenerC.calledOnce)
})

// https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L357
test("it uses the last snapshot of subscriptions during nested broadcast", (t) => {
  const channel = list()

  const listenerA = sinon.fake()
  const listenerB = sinon.fake()
  const listenerC = sinon.fake()
  const listenerD = sinon.fake()

  let unsubscribeListenerD

  const unsubscribeListenerA = channel.subscribe(() => {
    listenerA()

    t.true(listenerA.calledOnce)
    t.true(listenerB.notCalled)
    t.true(listenerC.notCalled)
    t.true(listenerD.notCalled)

    unsubscribeListenerA()

    unsubscribeListenerD = channel.subscribe(listenerD)

    channel.broadcast()

    t.true(listenerA.calledOnce)
    t.true(listenerB.calledOnce)
    t.true(listenerC.calledOnce)
    t.true(listenerD.calledOnce)
  })

  channel.subscribe(listenerB)
  channel.subscribe(listenerC)

  channel.broadcast()

  t.true(listenerA.calledOnce)
  t.true(listenerB.calledTwice)
  t.true(listenerC.calledTwice)
  t.true(listenerD.calledOnce)

  unsubscribeListenerD()

  channel.broadcast()

  t.true(listenerA.calledOnce)
  t.true(listenerB.calledThrice)
  t.true(listenerC.calledThrice)
  t.true(listenerD.calledOnce)
})

test("it gets the initial broadcast once when subscribing", (t) => {
  const getInitialBroadcast = sinon.fake(() => 1)
  const channel = list(getInitialBroadcast)
  const listener = sinon.fake()
  const unsubscribe = channel.subscribe(listener)

  t.true(getInitialBroadcast.calledOnce)
  t.true(listener.calledOnceWithExactly(1))

  channel.broadcast(2)

  t.true(listener.calledTwice)

  t.deepEqual(
    listener.getCalls().map(({ args }) => args),
    [[1], [2]]
  )

  unsubscribe()

  channel.broadcast(3)

  t.true(listener.calledTwice)
})

test("it throws when initial broadcast value is not a function", (t) => {
  t.throws(() => list(""))
  t.throws(() => list(1))
  t.throws(() => list({}))
  t.throws(() => list([]))
})

test("it returns the current subscribers via the .current property", (t) => {
  const listenerA = sinon.fake()
  const listenerB = sinon.fake()

  const channel = list()

  const unsubscribeListenerA = channel.subscribe(listenerA)

  t.deepEqual(channel.current, [listenerA])

  channel.subscribe(listenerB)

  t.deepEqual(channel.current, [listenerA, listenerB])

  unsubscribeListenerA()

  t.deepEqual(channel.current, [listenerB])
})

test("internal listeners array cannot be mutated via '.current'", (t) => {
  const listenerA = sinon.fake()

  const channel = list()

  channel.subscribe(listenerA)

  channel.current.splice(0, 1)

  t.deepEqual(channel.current, [listenerA])
})
