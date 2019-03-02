const toString = value => Object.prototype.toString.call(value)
const FUNCTION = toString(() => {})

export default () => {
  let current = []
  let next = current

  const prepareNext = () => {
    if (next === current) {
      next = current.slice()
    }
  }

  return {
    subscribe: listener => {
      const listenerType = toString(listener)

      if (listenerType !== FUNCTION) {
        throw new Error(`Expected ${ FUNCTION }, received ${ listenerType }.`)
      }

      let subscribed = true
      prepareNext()
      next.push(listener)

      return () => {
        if (!subscribed) {
          return void 0
        }

        subscribed = false
        prepareNext()

        return next.splice(next.indexOf(listener), 1)
      }
    },
    broadcast: (...args) => {
      current = next

      current.forEach(listener => listener(...args))
    },
  }
}
