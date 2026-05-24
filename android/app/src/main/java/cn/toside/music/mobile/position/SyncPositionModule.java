package cn.toside.music.mobile.position;

import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.util.Log;

import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.lang.reflect.Field;
import java.lang.reflect.Method;

/**
 * Wall-clock position tracker — matches HTML5 Audio.currentTime on desktop.
 *
 * The fundamental Android audio issue: ExoPlayer.getCurrentPosition()
 * reports the AudioTrack CONSUMED position (what the audio HAL has read),
 * not the actual SPEAKER OUTPUT position.  On this Huawei device the HAL
 * adds ~50-109ms of internal buffering, making the consumed position lead.
 *
 * Our fix: we observe the ExoPlayer position at 60fps and classify three
 * states — INIT (position == 0, audio buffering), PLAYING (position
 * increasing), and STABLE (paused, position unchanged).
 *
 * At the INIT→PLAYING transition (cold start) we set the wall-clock base
 * to -BUFFER_LATENCY_MS so the returned position reads 0 when audio
 * actually reaches the speaker — matching desktop's audio.currentTime=0.
 * During PLAYING we advance at wall-clock speed (the audio output rate).
 * During STABLE we freeze the position.
 * BUFFER_LATENCY_MS (80ms default) accounts for the AudioTrack buffer.
 */
public class SyncPositionModule extends ReactContextBaseJavaModule {
    private ReactApplicationContext reactContext;
    private boolean initialized;
    private long lastAttempt;
    private Object binder;
    private Object manager;
    private boolean havePlaybackMethod;
    private Method getPlaybackMethod;
    private Method getPositionOnPlayback;
    private boolean cacheUpdaterStarted;
    private volatile double cachedPosition = -1.0;

    // --- state machine ---
    // INIT:     position has been 0 since cache loop started
    // PLAYING:  position is changing, wall-clock mode active
    // STABLE:   position hasn't changed for 3+ reads (~48ms)
    private static final int ST_INIT    = 0;
    private static final int ST_PLAYING = 1;
    private static final int ST_STABLE  = 2;
    private int state = ST_INIT;

    // Estimated AudioTrack buffer latency in ms.
    // ExoPlayer.getCurrentPosition() reports the CONSUMED position (what the
    // AudioTrack has read from the decoder), not the SPEAKER OUTPUT position.
    // The audio HAL adds internal buffering of ~50-109ms on typical devices.
    // We subtract this estimate so the returned position aligns with what the
    // user actually hears — matching desktop's HTML5 Audio.currentTime.
    // 80ms is a safe default for most Android devices.
    private static final int BUFFER_LATENCY_MS = 80;

    // Wall-clock base: the returned position = basePositionMs + (nowMs - baseTimeMs)
    private long basePositionMs;
    private long baseTimeMs;

    // Detection helpers
    private long prevPosMs;          // previous raw ExoPlayer position
    private int stableCount;         // consecutive reads at same position
    private boolean firstTickDone;   // have we completed at least one tick

    SyncPositionModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() { return "SyncPositionModule"; }

    // -------------------------------------------------------- initialization

    private synchronized void ensureInitialized() {
        if (initialized) {
            if (binder != null && manager != null) return;
            initialized = false;
        }
        long now = System.currentTimeMillis();
        if (lastAttempt != 0 && now - lastAttempt < 2000) return;
        lastAttempt = now;

        try {
            CatalystInstance catalyst = reactContext.getCatalystInstance();
            if (catalyst == null) return;
            NativeModule musicModule = catalyst.getNativeModule("TrackPlayerModule");
            if (musicModule == null) return;

            Field binderField = musicModule.getClass().getDeclaredField("binder");
            binderField.setAccessible(true);
            binder = binderField.get(musicModule);
            if (binder == null) return;

            Field managerField = binder.getClass().getDeclaredField("manager");
            managerField.setAccessible(true);
            manager = managerField.get(binder);
            if (manager == null) return;

            try {
                getPlaybackMethod = manager.getClass().getMethod("getPlayback");
                havePlaybackMethod = true;
            } catch (NoSuchMethodException e) {
                havePlaybackMethod = false;
                Log.e("SyncPosition", "getPlayback() not found on " + manager.getClass().getName());
                return;
            }

            Object testPlayback = getPlaybackMethod.invoke(manager);
            if (testPlayback != null) {
                try {
                    getPositionOnPlayback = testPlayback.getClass().getMethod("getPosition");
                } catch (NoSuchMethodException e) {
                    Log.e("SyncPosition", "getPosition() not found on " + testPlayback.getClass().getName());
                }
            }

            initialized = true;
            Log.d("SyncPosition", "initialized, starting cache loop (wall-clock mode)");
            if (!cacheUpdaterStarted) startPositionCache();
        } catch (Exception e) {
            Log.e("SyncPosition", "init error", e);
        }
    }

    /** Called early from JS init so the cache loop is already warm when
     *  the user presses play. */
    @ReactMethod
    public void startModule() {
        ensureInitialized();
    }

    // -------------------------------------------------------- cache loop

    private synchronized void startPositionCache() {
        if (cacheUpdaterStarted) return;
        if (!initialized || getPlaybackMethod == null) return;
        cacheUpdaterStarted = true;
        tick();
    }

    private void postTick() {
        new Handler(Looper.getMainLooper()).postDelayed(this::tick, 16);
    }

    private void tick() {
        long posMs;
        try {
            Object playback = getPlaybackMethod.invoke(manager);
            if (playback == null) { if (state == ST_INIT) cachedPosition = 0.0; postTick(); return; }
            Method pm = getPositionOnPlayback;
            if (pm == null) pm = playback.getClass().getMethod("getPosition");
            posMs = (long) pm.invoke(playback);
        } catch (Exception e) {
            if (state == ST_INIT) cachedPosition = 0.0;
            postTick();
            return;
        }

        long nowMs = SystemClock.elapsedRealtime();
        double result;

        // ---------------------------------------------------------------- state machine

        boolean steady = (posMs == prevPosMs);
        if (steady) stableCount++; else stableCount = 0;

        // Seek: position jumps >200ms between 60fps reads
        boolean seek = !steady && firstTickDone && Math.abs(posMs - prevPosMs) > 200;
        prevPosMs = posMs;
        firstTickDone = true;

        if (seek) {
            // AudioTrack buffer was flushed → position IS the true output position
            // Still apply latency offset to handle any residual buffer frames.
            basePositionMs = Math.max(0, posMs - BUFFER_LATENCY_MS / 2);
            baseTimeMs = nowMs;
            state = ST_PLAYING;
            result = Math.max(0, basePositionMs) / 1000.0;
            Log.d("SyncPosition", "seek → base=" + basePositionMs + "ms");

        } else if (stableCount >= 3 && state != ST_STABLE) {
            // Position stable for 3+ reads → paused/drained → position is accurate
            state = ST_STABLE;
            basePositionMs = posMs;
            baseTimeMs = nowMs;
            result = posMs / 1000.0;
            Log.d("SyncPosition", "stable → base=" + posMs + "ms");

        } else if (state == ST_STABLE) {
            // Check for resume: position changed → playback resumed
            if (!steady && posMs != basePositionMs) {
                basePositionMs = Math.max(0, posMs - BUFFER_LATENCY_MS);
                baseTimeMs = nowMs;
                state = ST_PLAYING;
                result = Math.max(0, basePositionMs) / 1000.0;
                Log.d("SyncPosition", "stable→playing, base=" + basePositionMs + "ms");
            } else {
                // Still paused, return frozen position
                result = basePositionMs / 1000.0;
            }

        } else if (state == ST_INIT) {
            if (posMs == 0) {
                // Still in audio pre-roll (buffer filling, no output yet)
                result = 0.0;
            } else {
                // First non-zero position detected — AudioTrack just started
                // consuming frames, but speaker output hasn't started yet.
                // The audio HAL buffer (~BUFFER_LATENCY_MS) must fill first.
                // We set basePositionMs negative so the wall-clock correctly
                // reads 0 when audio actually reaches the speaker.
                basePositionMs = -BUFFER_LATENCY_MS;
                baseTimeMs = nowMs;
                state = ST_PLAYING;
                result = 0.0;
                Log.d("SyncPosition", "cold start → wall-clock from now, latency=" + BUFFER_LATENCY_MS + "ms");
            }

        } else if (stableCount == 0 && state == ST_PLAYING) {
            // Normal wall-clock behaviour: position = base + real-time elapsed.
            // Clamp to 0 so the negative offset only affects the first buffer
            // fill period — no position < 0 is ever returned.
            long elapsedMs = nowMs - baseTimeMs;
            result = Math.max(0, basePositionMs + elapsedMs) / 1000.0;

        } else {
            // Edge cases: first tick in PLAYING after a stable→unstable transition
            // or position just started changing.  Position is accurate at the
            // transition point, so refresh the base.
            if (state == ST_STABLE) {
                // Should not reach here (handled above), but just in case
                basePositionMs = posMs;
                baseTimeMs = nowMs;
                state = ST_PLAYING;
            }
            result = (basePositionMs + (nowMs - baseTimeMs)) / 1000.0;
        }

        cachedPosition = result;
        postTick();
    }

    // -------------------------------------------------------- JS interface

    @ReactMethod(isBlockingSynchronousMethod = true)
    public double getPosition() {
        if (!initialized && !cacheUpdaterStarted) return -1.0;
        return cachedPosition;
    }
}
