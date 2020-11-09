import { list } from "./list.js"
import { toString } from "./to-string.js"
import { tree } from "./tree.js"
import { FUNCTION, OBJECT } from "./types.js"

export const enrollment = (getInitialBroadcast) => {
  const _list = list(getInitialBroadcast)
  const _tree = tree(getInitialBroadcast)

  const subscribe = (listener) => {
    switch (toString(listener)) {
      case FUNCTION:
        return _list.subscribe(listener)

      case OBJECT:
        return _tree.subscribe(listener)

      default:
        throw new TypeError(
          `Expected a ${FUNCTION} or ${OBJECT}, got ${toString(listener)}`
        )
    }
  }

  const broadcast = (...args) => [
    _list.broadcast(...args),
    _tree.broadcast(...args),
  ]

  const enrollment = {
    subscribe,
    broadcast,
  }

  Object.defineProperty(enrollment, "current", {
    get() {
      return [_list.current, _tree.current]
    },
  })

  return enrollment
}
