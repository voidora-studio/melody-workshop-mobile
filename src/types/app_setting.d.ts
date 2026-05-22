import type { I18n } from '@/lang/i18n'

declare global {
  namespace LX {
    type AddMusicLocationType = 'top' | 'bottom'

    interface AppSetting {
      version: string
      /**
       * 是否跟随系统切换亮暗主题
       */
      'common.isAutoTheme': boolean

      /**
       * 语言id
       */
      'common.langId': I18n['locale'] | null

      /**
       * api id
       */
      'common.apiSource': string

      /**
       * 音源名称类型，原名、别名
       */
      'common.sourceNameType': 'alias' | 'real'

      /**
       * 歌曲分享方式
       */
      'common.shareType': 'system' | 'clipboard'

      /**
       * 是否同意软件协议
       */
      'common.isAgreePact': boolean

      /**
       * 是否已显示欢迎页
       */
      'common.isShowWelcome': boolean

      /**
       * 是否在键盘弹出时隐藏播放栏
       */
      'common.autoHidePlayBar': boolean

      /**
       * 抽屉组件弹出方向
       */
      'common.drawerLayoutPosition': 'left' | 'right'

      /**
       * 启用首页滑动
       */
      'common.homePageScroll': boolean

      /**
       * 允许通过底栏进度条调整进度
       */
      'common.allowProgressBarSeek': boolean

      /**
       * 是否显示返回按钮
       */
      'common.showBackBtn': boolean

      /**
       * 是否显示退出按钮
       */
      'common.showExitBtn': boolean

      /**
       * 使用系统文件选择器
       */
      'common.useSystemFileSelector': boolean

      /**
       * 总是保留状态栏高度
       */
      'common.alwaysKeepStatusbarHeight': boolean

      /**
       * 是否启用动画效果
       */
      'common.isShowAnimation': boolean

      /**
       * 是否启用随机动画
       */
      'common.randomAnimate': boolean

      /**
       * 主题id
       */
      'theme.id': string

      /**
       * 亮色主题id
       */
      'theme.lightId': string

      /**
       * 暗色主题id
       */
      'theme.darkId': string

      /**
       * 隐藏黑色主题背景
       */
      'theme.hideBgDark': boolean

      /**
       * 动态背景
       */
      'theme.dynamicBg': boolean

      /**
       * 字体阴影
       */
      'theme.fontShadow': boolean

      /**
       * 启动时自动播放歌曲
       */
      'player.startupAutoPlay': boolean

      /**
       * 启动后打开歌曲详细界面
       */
      'player.startupPushPlayDetailScreen': boolean

      /**
       * 切歌模式
       */
      'player.togglePlayMethod': 'listLoop' | 'random' | 'list' | 'singleLoop' | 'none'

      /**
       * 优先播放的音质
       */
      'player.playQuality': LX.Quality

      /**
       * 启动软件时是否恢复上次播放进度
       */
      'player.isSavePlayTime': boolean

      /**
       * 音量大小
       */
      'player.volume': number

      /**
       * 是否静音
       */
      'player.isMute': boolean

      /**
       * 播放速率
       */
      'player.playbackRate': number

      /**
       * 缓存大小设置 unit MB
       */
      'player.cacheSize': string

      /**
       * 定时暂停播放-倒计时时间
       */
      'player.timeoutExit': string

      /**
       * 定时暂停播放-是否等待歌曲播放完毕再暂停
       */
      'player.timeoutExitPlayed': boolean

      /**
       * 点击相同列表内的歌曲切歌时是否清空已播放列表（随机模式下列表内所有歌曲会重新参与随机）
       */
      'player.isAutoCleanPlayedList': boolean

      /**
       * 其他应用播放声音时是否自动暂停
       */
      'player.isHandleAudioFocus': boolean

      /**
       * 播放错误时自动跳过
       */
      'player.autoSkipOnError': boolean

      /**
       * 是否播放Karaoke/KK歌词
       */
      'player.isPlayLxlrc': boolean

      /**
       * 是否启用音频卸载功能（这可以节省耗电量，没有播放异常问题不建议关闭）
       */
      'player.isEnableAudioOffload': boolean

      /**
       * 是否显示歌词翻译
       */
      'player.isShowLyricTranslation': boolean

      /**
       * 是否显示歌词罗马音
       */
      'player.isShowLyricRoma': boolean

      /**
       * 是否在通知栏显示歌曲图片
       */
      'player.isShowNotificationImage': boolean

      /**
       * 是否将歌词从简体转换为繁体
       */
      'player.isS2t': boolean

      /**
       * 是否调换翻译歌词与罗马音歌词位置
       */
      'player.isSwapLyricTranslationAndRoma': boolean

      /**
       * 是否启用蓝牙歌词
       */
      'player.isShowBluetoothLyric': boolean

      /**
       * 是否启用蓝牙完整歌词
       */
      'player.isShowBluetoothFullLyric': boolean

      /**
       * 播放详情页-是否缩放当前播放的歌词行
       */
      'playDetail.isZoomActiveLrc': boolean

      /**
       * 播放详情页-歌词延迟滚动时间(ms)
       */
      'playDetail.lyricDelayScroll': number

      /**
       * 播放详情页-进度条样式
       */
      'playDetail.progressStyle': 'mini' | 'middle' | 'full'

      /**
       * 播放详情页-是否允许通过歌词调整播放进度
       */
      // 'playDetail.isShowLyricProgressSetting': boolean

      /**
       * 播放详情页-歌词对齐方式
       */
      'playDetail.style.align': 'center' | 'left' | 'right'

      /**
       * 竖屏歌词字体大小
       */
      'playDetail.vertical.style.lrcFontSize': number

      /**
       * 横屏歌词字体大小
       */
      'playDetail.horizontal.style.lrcFontSize': number

      /**
       * 播放详情页-是否允许通过歌词调整播放进度
       */
      'playDetail.isShowLyricProgressSetting': boolean

      /**
       * 是否启用桌面歌词
       */
      'desktopLyric.enable': boolean

      /**
       * 是否锁定桌面歌词
       */
      'desktopLyric.isLock': boolean

      /**
       * 桌面歌词窗口宽度
       */
      'desktopLyric.width': number

      /**
       * 桌面歌词最大行数
       */
      'desktopLyric.maxLineNum': number

      /**
       * 桌面歌词是否使用单行显示
       */
      'desktopLyric.isSingleLine': boolean

      /**
       * 桌面歌词是否启用歌词切换动画
       */
      'desktopLyric.showToggleAnima': boolean

      /**
       * 桌面歌词窗口x坐标
       */
      'desktopLyric.position.x': number

      /**
       * 桌面歌词窗口y坐标
       */
      'desktopLyric.position.y': number

      /**
       * 歌词水平对齐方式
       */
      'desktopLyric.textPosition.x': 'left' | 'center' | 'right'

      /**
       * 歌词垂直对齐方式
       */
      'desktopLyric.textPosition.y': 'top' | 'center' | 'bottom'

      /**
       * 桌面歌词字体大小
       */
      'desktopLyric.style.fontSize': number

      /**
       * 桌面歌词字体透明度
       */
      'desktopLyric.style.opacity': number

      /**
       * 桌面歌词未播放字体颜色
       */
      'desktopLyric.style.lyricUnplayColor': string

      /**
        * 桌面歌词已播放字体颜色
        */
      'desktopLyric.style.lyricPlayedColor': string

      /**
        * 桌面歌词字体阴影颜色
        */
      'desktopLyric.style.lyricShadowColor': string

      /**
       * 桌面歌词行间距
       */
      'desktopLyric.lineGap': number

      /**
       * 桌面歌词-激活行放大
       */
      'desktopLyric.isZoomActiveLine': boolean

      /**
       * 桌面歌词-已播放颜色渐变终点
       */
      'desktopLyric.style.lyricPlayedColorEnd': string

      /**
       * 桌面歌词字体粗细
       */
      'desktopLyric.style.fontWeight': number

      /**
       * 桌面歌词字体名称
       */
      'desktopLyric.fontFamily': string

      /**
       * 桌面歌词显示方向
       */
      'desktopLyric.direction': 'horizontal' | 'vertical'

      /**
       * 桌面歌词滚动对齐方式
       */
      'desktopLyric.scrollAlign': 'top' | 'center'

      /**
       * 桌面歌词文本对齐
       */
      'desktopLyric.textAlign': 'left' | 'center' | 'right'

      /**
       * 桌面歌词省略号模式
       */
      'desktopLyric.ellipsisMode': boolean

      /**
       * 暂停时自动隐藏桌面歌词
       */
      'desktopLyric.autoHideOnPause': boolean

      /**
       * 是否显示热门搜索
       */
      'search.isShowHotSearch': boolean

      /**
       * 是否显示搜索历史
       */
      'search.isShowHistorySearch': boolean

      /**
       * 切换页面时自动清空搜索内容
       */
      'search.isAutoClear': boolean

      /**
       * 切换页面时自动清空搜索输入框
       */
      'odc.isAutoClearSearchInput': boolean

      /**
       * 切换页面时自动清空搜索列表
       */
      'odc.isAutoClearSearchList': boolean

      /**
       * 是否自动聚焦搜索框
       */
      'search.isFocusSearchBox': boolean

      /**
       * 是否启用双击列表里的歌曲时自动切换到当前列表播放（仅对歌单、排行榜有效）
       */
      'list.isClickPlayList': boolean

      /**
       * 是否显示歌曲来源（仅对我的列表有效）
       */
      'list.isShowSource': boolean

      /**
       * 是否显示歌曲专辑名
       */
      'list.isShowAlbumName': boolean

      /**
       * 是否显示歌曲时长
       */
      'list.isShowInterval': boolean

      /**
       * 是否自动恢复列表滚动位置（仅对我的列表有效）
       */
      'list.isSaveScrollLocation': boolean

      /**
       * 添加歌曲到我的列表时的方式
       */
      'list.addMusicLocationType': AddMusicLocationType

      /**
       * 是否显示列表操作按钮列
       */
      'list.actionButtonsVisible': boolean

      /**
       * 文件命名方式
       */
      'download.fileName': '歌名 - 歌手' | '歌手 - 歌名' | '歌名'

      /**
       * 最大同时下载数量
       */
      'download.maxDownloadNum': string

      /**
       * 跳过已存在的文件
       */
      'download.skipExistFile': boolean

      /**
       * 是否下载歌词
       */
      'download.isDownloadLrc': boolean

      /**
       * 歌曲源不可用时，是否启用换源下载
       */
      'download.isUseOtherSource': boolean

      /**
       * 默认下载音质
       */
      'download.quality': LX.Quality

      /**
       * 下载保存路径
       */
      'download.savePath': string

      /**
       * 按列表名称分组保存下载文件
       */
      'download.groupByList': boolean

      /**
       * 在音频文件中嵌入封面图
       */
      'download.embedCover': boolean

      /**
       * 在音频文件中嵌入歌词
       */
      'download.embedLyric': boolean

      /**
       * 嵌入歌词包含翻译
       */
      'download.embedLyricTranslation': boolean

      /**
       * 嵌入歌词包含罗马音
       */
      'download.embedLyricRoma': boolean

      /**
       * 嵌入歌词包含KX歌词
       */
      'download.embedLyricLxlrc': boolean

      /**
       * 下载歌词文件编码
       */
      'download.lyricEncoding': 'utf-8' | 'gbk'

      /**
       * 下载完成通知
       */
      'download.completeNotification': boolean

      /**
       * 是否启用同步
       */
      'sync.enable': boolean

      /**
       * 同步模式
       */
      'sync.mode': 'server' | 'client'

      /**
       * 同步服务端端口号
       */
      'sync.server.port': string

      /**
       * 同步客户端地址
       */
      'sync.client.host': string

      /**
       * 最大历史快照数量
       */
      'sync.server.maxSsnapshotNum': string

      /**
       * 是否启用网络代理
       */
      'network.proxy.enable': boolean

      /**
       * 网络代理主机地址
       */
      'network.proxy.host': string

      /**
       * 网络代理端口
       */
      'network.proxy.port': string

      /**
       * 更新下载镜像地址（留空使用 GitHub 直连）
       */
      'version.githubMirror': string

      /**
       * 是否启用OpenAPI服务
       */
      'openAPI.enable': boolean

      /**
       * OpenAPI服务端口
       */
      'openAPI.port': string

      /**
       * OpenAPI是否绑定局域网
       */
      'openAPI.bindLan': boolean
    }
  }
}

