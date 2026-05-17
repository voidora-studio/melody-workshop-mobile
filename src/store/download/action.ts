import state from './state'

export default {
  getState() {
    return state
  },
  setList(list: LX.Download.ListItem[]) {
    state.list = list
    global.state_event.downloadListChanged([...list])
  },
  addItem(item: LX.Download.ListItem) {
    state.list.push(item)
    global.state_event.downloadListChanged([...state.list])
  },
  updateItem(id: string, data: Partial<LX.Download.ListItem>) {
    const index = state.list.findIndex(i => i.id === id)
    if (index < 0) return
    Object.assign(state.list[index], data)
    global.state_event.downloadListChanged([...state.list])
  },
  removeItem(id: string) {
    const index = state.list.findIndex(i => i.id === id)
    if (index < 0) return
    state.list.splice(index, 1)
    global.state_event.downloadListChanged([...state.list])
  },
  clearCompleted() {
    state.list = state.list.filter(i => i.status !== 'completed')
    global.state_event.downloadListChanged([...state.list])
  },
  clearAll() {
    state.list = []
    global.state_event.downloadListChanged([])
  },
}
