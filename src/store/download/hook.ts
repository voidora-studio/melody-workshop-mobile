import { useEffect, useState } from 'react'
import state, { type InitState } from './state'

export const useDownloadList = () => {
  const [list, setList] = useState(state.list)

  useEffect(() => {
    const handleUpdate = (newList: InitState['list']) => {
      setList(newList)
    }
    global.state_event.on('downloadListChanged', handleUpdate)
    return () => {
      global.state_event.off('downloadListChanged', handleUpdate)
    }
  }, [])

  return list
}
