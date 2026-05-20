# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies (use npmmirror mirror)
npm install --registry=https://registry.npmmirror.com

# Start Metro dev server
npm start
npm run sc          # start with cache reset

# Run on Android device (requires ADB + Metro running)
npm run dev         # react-native run-android --active-arch-only

# Build APKs
npm run pack:android:debug    # ./gradlew assembleDebug (from project root)
npm run pack:android          # gradlew.bat assembleRelease (from android/)

# Bundle JS for testing
npm run bundle-android

# Lint
npm run lint
npm run lint:fix

# TypeScript check
npx tsc --noEmit

# Clean
npm run clear       # gradlew clean
```

### Build Checklist

Before each build, increment version numbers in these files:

1. `package.json` — increment `version` (semver string) and `versionCode` (integer)
2. `publish/version.json` — update `version` to match `package.json`

`versionCode` is a monotonically increasing integer (1, 2, 3...). `version` follows semver (`major.minor.patch`). Bump minor for new features, patch for bug fixes, major for breaking changes. Keep both files in sync — `android/app/build.gradle` reads `versionCode` and `version` from `package.json`, and `publish/version.json` is what the update checker fetches remotely.

## Architecture Overview

### Framework
- **React Native 0.73.11** with `react-native-navigation` (v7, native stack — no React Navigation)
- Custom event-driven state management (not Redux/MobX), using a simple pub/sub `Event` class
- Android-only (no iOS/HarmonyOS support)

### Project Structure (`src/`)

```
src/
  app.ts              — Entry point, boots init then pushes home screen
  config/
    constant.ts       — Navigation menus, storage keys, constants
    defaultSetting.ts — All app settings with defaults
    globalData.ts     — Defines `global.lx` global state object
  event/
    Event.ts          — Simple pub/sub event emitter base class
    stateEvent.ts     — Typed state events (configUpdated, playInfoChanged, navActiveIdUpdated, etc.)
  store/              — State modules (each has state.ts + action.ts + hook.ts)
    setting/          — App settings (key-value flat store)
    player/           — Player state (play info, progress, music info)
    list/             — Playlist state
    common/           — UI state (nav tab, font size, status bar)
    search/           — Search state (text, type, history, suggestions)
    download/         — Download queue state
    theme/            — Theme state
    sync/             — Data sync state
    songlist/, leaderboard/, dislikeList/, hotSearch/, userApi/, version/
  core/               — Business logic modules
    init/             — App initialization sequence
    player/           — Player control (play, pause, next, timeout exit)
    music/            — Music URL fetching (online/download/local)
    download/         — Download queue management
    list.ts           — List management (CRUD for playlists)
    common.ts         — updateSetting, setLanguage, showPactModal
    search/           — Search logic
    desktopLyric.ts   — Desktop Lyrics overlay (Android native)
    sync.ts, version.ts, theme.ts, dislikeList.ts, songlist.ts
  screens/
    Home/             — Main app screen (PagerView with tabs)
      Vertical/       — Vertical layout (phone)
        Main.tsx      — PagerView with 6 tabs: search, songlist, leaderboard, mylist, download, settings
        DrawerNav.tsx — Side drawer navigation menu
      Horizontal/     — Horizontal layout (tablet)
    PlayDetail/       — Now-playing screen (vertical + horizontal layouts)
    SonglistDetail/   — Song list detail screen
    Comment/          — Comment screen
  components/         — Shared UI components (Button, Text, Icon, Menu, Badge, Input, etc.)
  navigation/         — react-native-navigation setup (screen registration, modals)
  plugins/            — Player engine (react-native-track-player wrapper), storage, sync
  lang/               — i18n (zh-cn, zh-tw, en-us) via flat JSON key-value
  types/              — TypeScript type declarations (*.d.ts) under `declare namespace LX`
  utils/              — Utilities (fs, data persistence, tools, music SDK, native modules)
  theme/              — Theme system (createThemes.js generates themes)
```

### Key Patterns

**State Management**: Each store module has state.ts (mutable singleton), action.ts (mutators that emit events), and hook.ts (React hooks using useState + global.state_event listeners). No Redux — stores mutate directly and emit typed events via `global.state_event`.

**Event System**: Two global buses — `global.state_event` (typed, for reactive state updates) and `global.app_event` (untyped, for app-level events like `searchTypeChanged`). Components subscribe in useEffect.

**Settings**: Flat key-value store defined in `src/types/app_setting.d.ts` as `LX.AppSetting`. All keys are dot-separated strings (e.g. `player.timeoutExit`, `search.isAutoClear`). Defaults in `src/config/defaultSetting.ts`. Access via `useSettingValue('key')` hook. Update via `updateSetting({ 'key': value })` from `@/core/common`.

**Navigation**: Uses `react-native-navigation` native stack. Main home screen uses `react-native-pager-view` for tab swiping. Tab definitions in `config/constant.ts` (`NAV_MENUS`). Drawer menu in `Vertical/DrawerNav.tsx`. Page visibility is lazy — each page component in `Vertical/Main.tsx` listens to `navActiveIdUpdated` and renders on demand.

**TypeScript**: Types are declared globally under `declare namespace LX` in `src/types/*.d.ts`. Key types: `LX.AppSetting`, `LX.Music.MusicInfo`, `LX.Music.MusicInfoOnline`, `LX.Download.ListItem`, `LX.Player.*`. The `lx-music-desktop/` directory is excluded from tsconfig to prevent namespace pollution.

**i18n**: Flat JSON files in `src/lang/`. Keys use snake_case. Accessed via `useI18n()` hook returning `t('key')` function.

### ADB & Device Testing
```bash
# Check device
adb devices
# Port forward Metro
adb reverse tcp:8081 tcp:8081
# Trigger menu key
npm run menu
```

### Android Build Notes
- `applicationId`: `cn.toside.music.mobile.ws` (coexists with original LX Music)
- `namespace` in build.gradle: `cn.toside.music.mobile`
- Debug builds skip JS bundling — requires Metro server
- `ANDROID_HOME` or `local.properties` must point to the SDK

### Implementation Pattern

When adding a new feature:

1. Add setting key + type to `src/types/app_setting.d.ts`
2. Add default value to `src/config/defaultSetting.ts`
3. Add migration in `src/config/migrateSetting.ts` if needed
4. Add i18n keys in `src/lang/zh-cn.json`, `en-us.json`, `zh-tw.json`
5. Create component in `src/screens/Home/Views/Setting/settings/{Category}/` (use `CheckBoxItem` for booleans)
6. Wire the setting into relevant UI or core logic

#Purpose
```
# 逐字歌词功能开发方案（React Native 项目 AI 提示词）

## 目标
为 React Native 音乐播放器集成逐字过渡歌词动画，实现从左到右逐字填充高亮效果，对标 Apple Music，60fps 流畅。

## 技术选型
- 歌词渲染：`react-native-transcript-karaoke`
- 歌词解析：`@applemusic-like-lyrics/lyric` 的 `parseLrc`（提取逻辑复用于 JS 层）
- 本地强制对齐：`tiny-align` + `pinyin-pro`（在 `react-native-worklets-core` 或 Web Worker 中执行）
- 音频解码：`expo-av` / `react-native-audio-api` 获取音频 Float32Array
- 缓存：`@react-native-async-storage/async-storage` 存储精确逐字歌词 JSON
- 多线程：`react-native-reanimated` Worklets 或 WebView Worker 回退方案

## 核心数据流
LRC 歌词 + 缓存音频 ArrayBuffer → 强制对齐引擎（后台线程）→ 精确逐字时间轴（LyricLine[]）→ 缓存 AsyncStorage → 传给 Karaoke 组件

## 目录结构
```

**src/**\
**├── components/**\
**│   └── LyricsView\.tsx            # 歌词展示组件**\
**├── utils/**\
**│   ├── lyricsCache.ts            # AsyncStorage 操作**\
**│   ├── lrcParser.ts              # LRC 解析 & 匀速降级**\
**│   ├── alignmentManager.ts       # 对齐主控（渐进式、超时降级）**\
**│   ├── preAlignScheduler.ts      # 预对齐调度**\
**│   └── phonemeUtils.ts           # 汉字→音素**\
**├── workers/**\
**│   └── alignWorker.js             # 对齐 Worker（逐句发送结果）**

````

## 关键实现要点

### 1. 歌词缓存 (lyricsCache.ts)
- 使用 `AsyncStorage`，键格式：`@lyrics:songId`，值：`JSON.stringify(LyricLine[])`
- 提供 `get(songId): Promise<LyricLine[] | null>` 和 `set(songId, data: LyricLine[]): Promise<void>`

### 2. 匀速降级 (lrcParser.ts)
- `convertLrcToAmllFallback(lrcText: string): LyricLine[]` 将 LRC 转为逐字数据，字间时长平均分配
- 对齐失败或超时时作为兜底

### 3. 音素转换 (phonemeUtils.ts)
- `textToPhonemes(text: string): string[]` 使用 `pinyin-pro` 获取拼音并映射为音素集合

### 4. 渐进式对齐管理器 (alignmentManager.ts)
- 函数 `getLyricsDataProgressive(songId, lrcText, audioArrayBuffer, options)`
  - `options.onLineReady(index, LyricLine)` 逐行回调
  - `options.onComplete(LyricLine[])` 完成回调
  - `options.timeout` 超时降级（默认 15s）
- 流程：先查缓存 → 若命中直接 resolve；否则解码音频 → 创建 Worker → 启动超时定时器
- 收到每行数据时调用 `onLineReady`，超时或错误时用匀速数据填充未完成行

### 5. 预对齐调度 (preAlignScheduler.ts)
- 串行队列，`addTask(songId, lrcText, audioArrayBuffer)`
- 触发时机：
  - 歌曲下载完成后立即触发（最高优先级）
  - 播放列表加载时取前 5~10 首入队
  - 应用空闲时处理剩余

### 6. 歌词展示组件 (LyricsView.tsx)
- 状态：`lyrics`（LyricLine[]，初始用匀速数据填满），`loading`
- 流程：
  - 收到 `songId`、`lrcText`、`cachedAudioPath` 后，立即用匀速数据初始化 `lyrics`
  - 启动 `getLyricsDataProgressive`，在 `onLineReady` 中替换对应索引行数据
  - 首句就绪后关闭 loading，渲染 `Karaoke` 组件
- 加载 UI：半透明遮罩 + `ActivityIndicator` + “获取中...” 文字
- 使用 `Karaoke` 组件：
  ```tsx
  <Karaoke
    transcript={formatToTranscript(lyrics)}
    progress={currentTime}
    progressType="seconds"
    activeStyle={{color: '#fff'}}
    style={{color: 'rgba(255,255,255,0.5)'}}
  />
````

- `formatToTranscript` 将 `LyricLine[]` 转为 `[mm:ss.SS]歌词行` 格式字符串

### 7. 对齐执行环境

- 优先方案：`react-native-reanimated` Worklets 后台线程执行
- 回退方案：WebView 内嵌 Worker 通信
- 音频数据通过 `expo-av` 或 `react-native-audio-api` 获取 PCM 数据

## 用户体验

- 缓存命中：瞬间展示精确歌词
- 首次播放：显示“获取中...”约 0.5\~2 秒（对齐第一句），随后歌词逐句精准
- 预对齐覆盖后：首次播放也无需等待

## 类型定义

```ts
interface LyricWord { word: string; startTime: number; endTime: number; }
interface LyricLine { startTime: number; endTime: number; words: LyricWord[]; }
```

## 依赖清单

```
react-native-transcript-karaoke
@applemusic-like-lyrics/lyric
tiny-align
pinyin-pro
@react-native-async-storage/async-storage
react-native-reanimated（Worklets 线程）
expo-av 或 react-native-audio-api（音频解码）
```

## 注意事项

- 播放器需提供歌曲唯一 `songId`
- 音频缓存需能转为 `ArrayBuffer` 或 PCM Float32Array
- 仅允许 1 个对齐任务同时运行，防止内存峰值
- 对齐失败静默降级为匀速方案