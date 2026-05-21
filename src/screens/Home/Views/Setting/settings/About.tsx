import { memo, useState, useCallback, useEffect } from 'react'
import { View, TouchableOpacity } from 'react-native'

import Section from '../components/Section'

import { createStyle, openUrl, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { showPactModal } from '@/core/common'
import { getListenStats, clearListenSessions, exportSessionsJson } from '@/core/listenSession'
import { buildInfo } from '@/config/buildInfo'

const formatDuration = (ms: number): string => {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  if (hours > 0) return `${hours}h${minutes}m`
  return `${minutes}m`
}

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const [, refresh] = useState(0)

  const stats = getListenStats()
  const doRefresh = useCallback(() => refresh(n => n + 1), [])

  // Re-render stats when listen session data changes
  useEffect(() => {
    const onMusicToggled = () => doRefresh()
    const onPlayState = (isPlaying: boolean) => {
      if (!isPlaying) doRefresh()
    }
    global.app_event.on('musicToggled', onMusicToggled)
    global.state_event.on('playStateChanged', onPlayState)
    return () => {
      global.app_event.off('musicToggled', onMusicToggled)
      global.state_event.off('playStateChanged', onPlayState)
    }
  }, [doRefresh])

  const handleClear = () => {
    void clearListenSessions().then(doRefresh)
    toast(t('listen_session_clear'))
  }

  const handleExport = () => {
    void exportSessionsJson().then(json => {
      toast(t('listen_session_export_success'))
    })
  }

  const openHomePage = () => {
    void openUrl('https://github.com/lyswhut/lx-music-mobile#readme')
  }
  const openIssuePage = () => {
    void openUrl('https://github.com/lyswhut/lx-music-mobile/issues?q=is%3Aissue+')
  }
  const openGHReleasePage = () => {
    void openUrl('https://github.com/lyswhut/lx-music-mobile/releases')
  }
  const openFAQPage = () => {
    void openUrl('https://lyswhut.github.io/lx-music-doc/mobile/faq')
  }
  const openPactModal = () => {
    showPactModal()
  }
  const openPartPage = () => {
    void openUrl('https://github.com/lyswhut/lx-music-mobile#%E9%A1%B9%E7%9B%AE%E5%8D%8F%E8%AE%AE')
  }

  const textLinkStyle = {
    ...styles.text,
    textDecorationLine: 'underline',
    color: theme['c-primary-font'],
  } as const

  return (
    <Section title={t('setting_about')}>
      {/* Listen Session Stats */}
      {stats.totalSessions > 0 ? (
        <View style={styles.statsContainer}>
          <View style={styles.statsHeader}>
            <Text style={styles.boldText}>{t('listen_session_title')}</Text>
            <View style={styles.statsActions}>
              <TouchableOpacity onPress={handleExport} style={styles.statsBtn}>
                <Text style={textLinkStyle}>{t('listen_session_export')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClear} style={styles.statsBtn}>
                <Text style={textLinkStyle}>{t('listen_session_clear')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>{t('listen_session_total_sessions')}: </Text>
            <Text style={styles.statsValue}>{stats.totalSessions}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>{t('listen_session_total_time')}: </Text>
            <Text style={styles.statsValue}>{formatDuration(stats.totalDuration)}</Text>
          </View>
          {stats.topArtists.length > 0 && (
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>{t('listen_session_top_artists')}: </Text>
              <Text style={styles.statsValue}>{stats.topArtists.slice(0, 3).map(a => a.name).join('、')}</Text>
            </View>
          )}
          {stats.topSongs.length > 0 && (
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>{t('listen_session_top_songs')}: </Text>
              <Text style={styles.statsValue}>{stats.topSongs.slice(0, 3).map(s => s.name).join('、')}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.part}>
          <Text style={styles.text}>{t('listen_session_no_data')}</Text>
        </View>
      )}

      <View style={styles.part}>
        <Text style={styles.text}>旋律工坊 由 wzystudio 维护发行。界面与图标已按本发行版统一设计。</Text>
      </View>
      {/*
      <View style={styles.part}>
        <Text style={styles.text}>发行说明：本发行版由 wzystudio 独立维护与分发，与上游 GitHub Release 无绑定关系；若未配置独立更新源，版本检查仍可能指向开源上游，请以本页说明为准。</Text>
      </View>
      */}
      <View style={styles.part}>
        <Text style={styles.boldText}>源项目说明</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>本软件基于开源项目 LX Music（洛雪音乐助手）（移动版）衍生而来，遵循其 Apache-2.0 许可。</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>上游源代码与文档：</Text>
        <TouchableOpacity onPress={openHomePage}>
          <Text style={textLinkStyle}>https://github.com/lyswhut/lx-music-mobile</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>上游发布与问题反馈（原版项目）：</Text>
        <TouchableOpacity onPress={openGHReleasePage}>
          <Text style={textLinkStyle}>GitHub Releases</Text>
        </TouchableOpacity>
        <Text style={styles.text}> · </Text>
        <TouchableOpacity onPress={openIssuePage}>
          <Text style={textLinkStyle}>Issues</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>使用问题可参考上游整理的常见问题：</Text>
        <TouchableOpacity onPress={openFAQPage}>
          <Text style={textLinkStyle}>移动版常见问题</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>本发行版没有客服，使用问题请先阅读上述文档与源项目 Issue 区说明。</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text} />
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>本软件仅供学习与技术研究，请遵守当地法律法规；音乐请支持正版。</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text} />
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>你已签署本软件的</Text>
        <TouchableOpacity onPress={openPactModal}><Text style={styles.text} color={theme['c-primary-font']}>许可协议</Text></TouchableOpacity>
        <Text style={styles.text}>，协议的在线版本在</Text>
        <TouchableOpacity onPress={openPartPage}><Text style={textLinkStyle}>源项目协议说明</Text></TouchableOpacity>
        <Text style={styles.text}>。</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>By: </Text>
        <Text style={styles.text}>wzystudio（旋律工坊）</Text>
      </View>
      <View style={{ ...styles.buildInfoContainer, borderTopColor: theme['c-primary-light-300-alpha-800'] + '' }}>
        <Text style={styles.buildInfoText}>Build: {buildInfo.commitHash}</Text>
        <Text style={styles.buildInfoText}>Date: {buildInfo.commitDate}</Text>
        <Text style={styles.buildInfoText}>Built: {buildInfo.buildTime}</Text>
      </View>
    </Section>
  )
})

const styles = createStyle({
  part: {
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  text: {
    fontSize: 14,
    textAlignVertical: 'bottom',
  },
  boldText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlignVertical: 'bottom',
  },
  buildInfoContainer: {
    marginLeft: 15,
    marginRight: 15,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  buildInfoText: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },
  statsContainer: {
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.3)',
    borderRadius: 8,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsActions: {
    flexDirection: 'row',
  },
  statsBtn: {
    paddingHorizontal: 8,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 13,
    color: '#999',
  },
  statsValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
})
