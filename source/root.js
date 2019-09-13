const toString = value => Object.prototype.toString.call(value)

const FUNCTION = toString(Function)

export default getInitialBroadcast => {
  if (
    getInitialBroadcast !== undefined &&
    toString(getInitialBroadcast) !== FUNCTION
  ) {
    throw new TypeError(
      `Expected argument of type ${FUNCTION} got ${toString(
        getInitialBroadcast
      )}`
    )
  }

  let current = []
  let next = current

  const snapshot = () => {
    if (next === current) {
      next = current.slice()
    }
  }

  const subscribe = listener => {
    const listenerType = toString(listener)

    if (listenerType !== FUNCTION) {
      throw new Error(`Expected ${FUNCTION}, received ${listenerType}.`)
    }

    let subscribed = true

    snapshot()

    next.push(listener)

    getInitialBroadcast && listener(getInitialBroadcast())

    return () => {
      if (!subscribed) {
        return void 0
      }

      subscribed = false

      snapshot()

      return next.splice(next.indexOf(listener), 1)
    }
  }

  const broadcast = (...args) => {
    current = next

    current.forEach(listener => listener(...args))
  }

  return {
    subscribe,
    broadcast,
  }
}
