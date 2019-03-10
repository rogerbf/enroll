import { concat, omit, call, map } from "call-tree"
import { difference } from "simple-difference"

const toString = value => Object.prototype.toString.call(value)

const OBJECT = toString({})

const wrapListener = listener => (...args) => listener(...args)

export default () => {
  let current = {}
  let next = current

  const snapshot = () => {
    if (difference(next, current) === null) {
      next = { ...current }
    }
  }

  const subscribe = listener => {
    const listenerType = toString(listener)

    if (listenerType !== OBJECT) {
      throw new Error(`Expected ${ OBJECT }, received ${ listenerType }.`)
    }

    let subscribed = true

    snapshot()

    const wrapped = map(listener, wrapListener)

    next = concat(next, wrapped)

    return () => {
      if (!subscribed) {
        return void 0
      }

      subscribed = false

      snapshot()

      next = omit(next, wrapped)

      return listener
    }
  }

  const broadcast = (...args) => {
    current = next

    call(current, ...args)
  }

  const prepare = fn => {
    current = next

    const tree = fn(current)

    return call.bind(null, tree)
  }

  return {
    subscribe,
    broadcast,
    prepare,
  }
}
