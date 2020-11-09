import { toString } from "./to-string"
import { FUNCTION } from "./types.js"

export const list = (getInitialBroadcast) => {
  if (
    getInitialBroadcast !== undefined &&
    toString(getInitialBroadcast) !== FUNCTION
  ) {
    throw new TypeError(
      `Expected argument of type ${FUNCTION}, got ${toString(
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

  const subscribe = (listener) => {
    const listenerType = toString(listener)

    if (listenerType !== FUNCTION) {
      throw new TypeError(`Expected ${FUNCTION}, got ${listenerType}.`)
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

    current.forEach((listener) => listener(...args))
  }

  return Object.defineProperty(
    {
      subscribe,
      broadcast,
    },
    "current",
    {
      get() {
        snapshot()

        return [...next]
      },
    }
  )
}
