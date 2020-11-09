import { concat, map, mergeWith, omit } from "call-tree"
import { toString } from "./to-string.js"
import { FUNCTION, OBJECT } from "./types.js"

export const tree = (getInitialBroadcast) => {
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

  let current = {}
  let next = current

  const snapshot = () => {
    if (next === current) {
      next = { ...current }
    }
  }

  const subscribe = (listener) => {
    if (toString(listener) !== OBJECT) {
      throw new TypeError(
        `Expected argument of type ${OBJECT} got ${toString(listener)}`
      )
    }

    let subscribed = true

    snapshot()

    next = concat(listener, next)

    if (getInitialBroadcast) {
      map((fn) => fn(getInitialBroadcast()), listener)
    }

    return () => {
      if (!subscribed) {
        return void 0
      }

      subscribed = false

      snapshot()

      next = omit(listener, next)

      return listener
    }
  }

  const broadcast = (message) => {
    current = next

    return mergeWith(
      (message, listener) => message && listener(message),
      message,
      current
    )
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

        return { ...next }
      },
    }
  )
}
