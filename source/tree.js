import { create } from "call-tree"

export default () => {
  const tree = create()

  return {
    broadcast: (...args) => tree(...args),
    subscribe: tree.attach,
    prepare: tree.prepare,
  }
}
