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

## Development Roadmap — Completed Features (✅) / Pending (⬜)

The following features from lx-music-desktop have been ported to mobile.

### ✅ Priority 1 — High Impact, Low Effort (全部已完成)

- ✅ **听歌记录+统计** — `src/core/listenSession.ts`, shown in About page with export/clear
- ✅ **激活行歌词放大** — `playDetail.isZoomActiveLrc` setting, applied via scale transform in lyric lines
- ✅ **歌词延迟滚动** — `playDetail.lyricDelayScroll` setting, adjustable delay in ms
- ✅ **歌词菜单（复制/搜索）** — Long-press on lyric line → Alert with Copy/Search options
- ✅ **更新日志弹窗** — `VersionChangeLogModal` with version history data
- ✅ **首次使用欢迎覆盖层** — `WelcomeOverlay` shown on first launch, sets `common.isShowWelcome`
- ✅ **查找重复歌曲** — `DuplicateMusicModal` with merge action by name+singer
- ✅ **逐字歌词进度** — lxlyric parser + word-level rendering in LrcLine component, gated by `player.isPlayLxlrc`

### ✅ Priority 2 — Download Enhancements

| Feature | Status | Implementation |
|---------|--------|---------------|
| **下载保存路径设置** | ✅ Done | `getDownloadPath` reads `download.savePath`, falls back to default. |
| **按列表名称分组保存** | ✅ Done | `getListName()` looks up list by ID, creates subdirectory when `download.groupByList` is enabled. |
| **嵌入封面到音频文件** | ✅ UI done | `download.embedCover` checkbox. Requires ID3 library (not available). |
| **嵌入歌词到音频文件** | ✅ UI done | `download.embedLyric` + sub-options. Requires ID3 library. |
| **下载独立 LRC 文件** | ✅ Partially done | `writeLrcFile` prepared. `isDownloadLrc` setting exists. Needs async lyric fetching during download. |
| **LRC 文件编码选择** | ✅ Done | `download.lyricEncoding` selection wired to `writeLrcFile` (utf-8/gbk). |
| **下载完成通知** | ✅ Done | `download.completeNotification` shows toast on download completion. |
| **文件校验** | ⬜ Not implemented | Check file size after download. |

### ✅ Priority 3 — Visual & UI Polish

| Feature | Status | Notes |
|---------|--------|-------|
| **播放栏进度条样式** | ✅ Done | `playDetail.progressStyle` with 3 styles (mini/middle/full). |
| **全局 UI 字体大小** | ✅ Done | `common.fontSize` already exists in Basic/FontSize.tsx with `useFontSize()` hook. |
| **主题编辑器** | ✅ Done | `ThemeEditor.tsx` — color picker grid, create/save/apply custom themes (up to 10). |
| **背景图片（按主题）** | ✅ Done | Built-in BG images selectable in theme editor (水墨/月夜/极光/木叶/新年 + none). |
| **Melody Workshop 主题包** | ✅ Done | 4 preset themes: 旋律之春, 旋律落日, 旋律午夜, 旋律樱花. |
| **自定义字体选择** | ⬜ Not implemented | `common.fontFamily` type/defs exist. Needs system font enumeration. |

### ✅ Priority 4 — Desktop Lyric Enhancements

| Feature | Status | Implementation |
|---------|--------|---------------|
| **行间距调整** | ✅ Passed to native | Setting `desktopLyric.lineGap` wired through `showDesktopLyricView`. Native `LyricModule.java` needs `lineGap` handling. |
| **激活行放大** | ✅ Passed to native | Setting `desktopLyric.isZoomActiveLine` wired. Native needs implementation. |
| **已播放颜色渐变终点色** | ✅ Passed to native | Setting `desktopLyric.style.lyricPlayedColorEnd` wired. Native needs implementation. |
| **字体粗细** | ✅ Passed to native | Setting `desktopLyric.style.fontWeight` wired. Native needs implementation. |
| **字体选择** | ✅ Passed to native | Setting `desktopLyric.fontFamily` wired. Native needs implementation. |
| **显示方向** | ✅ Passed to native | Setting `desktopLyric.direction` wired. Native needs implementation. |
| **滚动对齐** | ✅ Passed to native | Setting `desktopLyric.scrollAlign` wired. Native needs implementation. |
| **文本对齐** | ✅ Passed to native | Setting `desktopLyric.textAlign` wired. Native needs implementation. |
| **省略号模式** | ✅ Passed to native | Setting `desktopLyric.ellipsisMode` wired. Native needs implementation. |
| **暂停时自动隐藏** | ✅ Done | `desktopLyric.autoHideOnPause` wired to play state. |

### ✅ Priority 5 — Smaller Features

| Feature | Status | Notes |
|---------|--------|-------|
| **音乐评论查看** | ✅ Done | Full hot/new comment tabs with per-source fetching via music SDK. |
| **导出列表为 TXT/CSV** | ✅ Done | Export option in Mylist menu. |
| **应用内快捷键** | ⬜ Skipped per user request | Hardware button mapping excluded. |
| **快捷键冲突检测/录制 UI** | ⬜ Skipped per user request | Excluded with keyboard shortcuts. |
| **桌面歌词 Melody Workshop 渐变** | ✅ Done | `lyricPlayedColorEnd` setting passed to native module. |
| **构建/提交信息显示** | ✅ Done | `buildInfo.ts` with commit hash/date displayed in About page. |

### Implementation Pattern

When adding a new feature:

1. Add setting key + type to `src/types/app_setting.d.ts`
2. Add default value to `src/config/defaultSetting.ts`
3. Add migration in `src/config/migrateSetting.ts` if needed
4. Add i18n keys in `src/lang/zh-cn.json`, `en-us.json`, `zh-tw.json`
5. Create component in `src/screens/Home/Views/Setting/settings/{Category}/` (use `CheckBoxItem` for booleans)
6. Wire the setting into relevant UI or core logic
