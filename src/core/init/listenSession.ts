import { initListenSession, recordPlayStart, recordPlayEnd } from '@/core/listenSession'

export default () => {
  void initListenSession()

  global.app_event.on('musicToggled', () => {
    recordPlayEnd()
    recordPlayStart()
  })

  global.state_event.on('playStateChanged', (isPlaying: boolean) => {
    if (!isPlaying) {
      recordPlayEnd()
    }
  })
}
