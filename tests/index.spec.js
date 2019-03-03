let enroll

if (process.env.NODE_ENV === `development`) {
  enroll = require(`../source`).default
} else {
  enroll = require(`../`)
}

describe(`enroll`, () => {
  it(`is a function`, () => {
    expect(typeof enroll).toEqual(`function`)
  })

  it(`has the expected api`, () => {
    const channel = enroll()

    expect(typeof channel.subscribe).toEqual(`function`)
    expect(typeof channel.broadcast).toEqual(`function`)
  })

  it(`throws if listener is not a function`, () => {
    const channel = enroll()

    expect(() => channel.subscribe()).toThrow()
    expect(() => channel.subscribe(``)).toThrow()
    expect(() => channel.subscribe(0)).toThrow()
    expect(() => channel.subscribe([])).toThrow()
    expect(() => channel.subscribe({})).toThrow()
  })

  // https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L196
  it(`supports multiple subscriptions`, () => {
    const channel = enroll()

    const listenerA = jest.fn()
    const listenerB = jest.fn()

    let unsubscribeA = channel.subscribe(listenerA)
    channel.broadcast()
    expect(listenerA.mock.calls.length).toBe(1)
    expect(listenerB.mock.calls.length).toBe(0)

    channel.broadcast()
    expect(listenerA.mock.calls.length).toBe(2)
    expect(listenerB.mock.calls.length).toBe(0)

    const unsubscribeB = channel.subscribe(listenerB)
    expect(listenerA.mock.calls.length).toBe(2)
    expect(listenerB.mock.calls.length).toBe(0)

    channel.broadcast()
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(1)

    unsubscribeA()
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(1)

    channel.broadcast()
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(2)

    unsubscribeB()
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(2)

    channel.broadcast()
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(2)

    unsubscribeA = channel.subscribe(listenerA)
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(2)

    channel.broadcast()
    expect(listenerA.mock.calls.length).toBe(4)
    expect(listenerB.mock.calls.length).toBe(2)
  })

  // https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L243
  it(`only removes listener once when unsubscribe is called`, () => {
    const channel = enroll()

    const listenerA = jest.fn()
    const listenerB = jest.fn()

    const unsubscribeA = channel.subscribe(listenerA)
    channel.subscribe(listenerB)

    unsubscribeA()
    unsubscribeA()

    channel.broadcast()
    expect(listenerA.mock.calls.length).toBe(0)
    expect(listenerB.mock.calls.length).toBe(1)
  })

  // https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L259
  it(`only removes relevant listener when unsubscribe is called`, () => {
    const channel = enroll()

    const listener = jest.fn()

    channel.subscribe(listener)
    const unsubscribeSecond = channel.subscribe(listener)

    unsubscribeSecond()
    unsubscribeSecond()

    channel.broadcast()
    expect(listener.mock.calls.length).toBe(1)
  })

  // https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L273
  it(`supports removing a subscription within a subscription`, () => {
    const channel = enroll()

    const listenerA = jest.fn()
    const listenerB = jest.fn()
    const listenerC = jest.fn()

    channel.subscribe(listenerA)
    const unSubB = channel.subscribe(() => {
      listenerB()
      unSubB()
    })
    channel.subscribe(listenerC)

    channel.broadcast()
    channel.broadcast()

    expect(listenerA.mock.calls.length).toBe(2)
    expect(listenerB.mock.calls.length).toBe(1)
    expect(listenerC.mock.calls.length).toBe(2)
  })

  // https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L294
  it(`notifies all subscribers about current broadcast regardless if any of them gets unsubscribed in the process`, () => {
    const channel = enroll()

    const unsubscribeHandles = []
    const doUnsubscribeAll = () =>
      unsubscribeHandles.forEach(unsubscribe => unsubscribe())

    const listener1 = jest.fn()
    const listener2 = jest.fn()
    const listener3 = jest.fn()

    unsubscribeHandles.push(channel.subscribe(() => listener1()))
    unsubscribeHandles.push(
      channel.subscribe(() => {
        listener2()
        doUnsubscribeAll()
      })
    )
    unsubscribeHandles.push(channel.subscribe(() => listener3()))

    channel.broadcast()
    expect(listener1.mock.calls.length).toBe(1)
    expect(listener2.mock.calls.length).toBe(1)
    expect(listener3.mock.calls.length).toBe(1)

    channel.broadcast()
    expect(listener1.mock.calls.length).toBe(1)
    expect(listener2.mock.calls.length).toBe(1)
    expect(listener3.mock.calls.length).toBe(1)
  })

  // https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L325
  it(`notifies only subscribers active at the moment of current broadcast`, () => {
    const channel = enroll()

    const listener1 = jest.fn()
    const listener2 = jest.fn()
    const listener3 = jest.fn()

    let listener3Added = false
    const maybeAddThirdListener = () => {
      if (!listener3Added) {
        listener3Added = true
        channel.subscribe(() => listener3())
      }
    }

    channel.subscribe(() => listener1())
    channel.subscribe(() => {
      listener2()
      maybeAddThirdListener()
    })

    channel.broadcast()
    expect(listener1.mock.calls.length).toBe(1)
    expect(listener2.mock.calls.length).toBe(1)
    expect(listener3.mock.calls.length).toBe(0)

    channel.broadcast()
    expect(listener1.mock.calls.length).toBe(2)
    expect(listener2.mock.calls.length).toBe(2)
    expect(listener3.mock.calls.length).toBe(1)
  })

  // https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L357
  it(`uses the last snapshot of subscribers during nested broadcast`, () => {
    const channel = enroll()

    const listener1 = jest.fn()
    const listener2 = jest.fn()
    const listener3 = jest.fn()
    const listener4 = jest.fn()

    let unsubscribe4
    const unsubscribe1 = channel.subscribe(() => {
      listener1()
      expect(listener1.mock.calls.length).toBe(1)
      expect(listener2.mock.calls.length).toBe(0)
      expect(listener3.mock.calls.length).toBe(0)
      expect(listener4.mock.calls.length).toBe(0)

      unsubscribe1()
      unsubscribe4 = channel.subscribe(listener4)
      channel.broadcast()

      expect(listener1.mock.calls.length).toBe(1)
      expect(listener2.mock.calls.length).toBe(1)
      expect(listener3.mock.calls.length).toBe(1)
      expect(listener4.mock.calls.length).toBe(1)
    })
    channel.subscribe(listener2)
    channel.subscribe(listener3)

    channel.broadcast()
    expect(listener1.mock.calls.length).toBe(1)
    expect(listener2.mock.calls.length).toBe(2)
    expect(listener3.mock.calls.length).toBe(2)
    expect(listener4.mock.calls.length).toBe(1)

    unsubscribe4()
    channel.broadcast()
    expect(listener1.mock.calls.length).toBe(1)
    expect(listener2.mock.calls.length).toBe(3)
    expect(listener3.mock.calls.length).toBe(3)
    expect(listener4.mock.calls.length).toBe(1)
  })

  // https://github.com/reduxjs/redux/blob/792ac5ae541a7c0792908df8f4e2da334184e74f/test/createStore.spec.js#L413
  it(`does not leak private listeners array`, done => {
    const channel = enroll()

    channel.subscribe(function() {
      expect(this).toBe(undefined)
      done()
    })

    channel.broadcast()
  })
})
