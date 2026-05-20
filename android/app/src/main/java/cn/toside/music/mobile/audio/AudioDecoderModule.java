package cn.toside.music.mobile.audio;

import android.media.MediaCodec;
import android.media.MediaExtractor;
import android.media.MediaFormat;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.ShortBuffer;

/**
 * Android native audio decoder using platform MediaCodec (hardware-accelerated).
 *
 * Decodes compressed audio (MP3/AAC/FLAC/etc.) to raw 16-bit PCM Float32Array
 * at the original sample rate, preserving full quality.
 *
 * Implements the document requirement:
 *   "音频解码：expo-av / react-native-audio-api 获取音频 Float32Array"
 * using Android's most efficient codec path.
 *
 * Data flow:
 *   MediaExtractor (demux) → MediaCodec (decode) → 16-bit PCM shorts
 *   → downmix to mono (average channels) → write to temp .pcm file
 *   → return { pcmFilePath, sampleRate, totalSamples } to JS
 *
 * JS side reads the .pcm file via react-native-fs and converts to Float32Array.
 */
public class AudioDecoderModule extends ReactContextBaseJavaModule {

  AudioDecoderModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "AudioDecoderModule";
  }

  @ReactMethod
  public void decodeAudio(String filePath, Promise promise) {
    new Thread(() -> {
      try {
        WritableMap result = decodeAudioFile(filePath);
        promise.resolve(result);
      } catch (Exception e) {
        promise.reject("DECODE_ERROR", e.getMessage(), e);
      }
    }).start();
  }

  private WritableMap decodeAudioFile(String inputPath) throws IOException {
    File inputFile = new File(inputPath);
    if (!inputFile.exists()) {
      throw new IOException("Audio file not found: " + inputPath);
    }

    MediaExtractor extractor = new MediaExtractor();
    try {
      extractor.setDataSource(inputPath);
    } catch (IOException e) {
      extractor.release();
      throw new IOException("Failed to set data source: " + e.getMessage());
    }

    // Find the first audio track
    int audioTrackIndex = -1;
    MediaFormat format = null;
    for (int i = 0; i < extractor.getTrackCount(); i++) {
      MediaFormat trackFormat = extractor.getTrackFormat(i);
      String mime = trackFormat.getString(MediaFormat.KEY_MIME);
      if (mime != null && mime.startsWith("audio/")) {
        audioTrackIndex = i;
        format = trackFormat;
        break;
      }
    }

    if (audioTrackIndex < 0) {
      extractor.release();
      throw new IOException("No audio track found in file");
    }

    extractor.selectTrack(audioTrackIndex);

    String mime = format.getString(MediaFormat.KEY_MIME);
    int sampleRate = format.containsKey(MediaFormat.KEY_SAMPLE_RATE)
        ? format.getInteger(MediaFormat.KEY_SAMPLE_RATE)
        : 44100;
    int channelCount = format.containsKey(MediaFormat.KEY_CHANNEL_COUNT)
        ? format.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
        : 2;

    // Create hardware-accelerated decoder at original sample rate
    MediaCodec codec = MediaCodec.createDecoderByType(mime);
    codec.configure(format, null, null, 0);
    codec.start();

    // Temp output file for raw PCM
    File tempFile = File.createTempFile("pcm_", ".pcm",
        getReactApplicationContext().getCacheDir());
    FileOutputStream fos = new FileOutputStream(tempFile);

    MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
    boolean sawInputEOS = false;
    boolean sawOutputEOS = false;
    int totalSamplesOut = 0;
    ByteBuffer[] codecInputBuffers = codec.getInputBuffers();
    ByteBuffer[] codecOutputBuffers = codec.getOutputBuffers();

    while (!sawOutputEOS) {
      if (!sawInputEOS) {
        int inputBufIndex = codec.dequeueInputBuffer(10000);
        if (inputBufIndex >= 0) {
          ByteBuffer inputBuf = codecInputBuffers[inputBufIndex];
          int sampleSize = extractor.readSampleData(inputBuf, 0);
          if (sampleSize < 0) {
            codec.queueInputBuffer(inputBufIndex, 0, 0, 0,
                MediaCodec.BUFFER_FLAG_END_OF_STREAM);
            sawInputEOS = true;
          } else {
            long presentationTimeUs = extractor.getSampleTime();
            codec.queueInputBuffer(inputBufIndex, 0, sampleSize,
                presentationTimeUs, 0);
            extractor.advance();
          }
        }
      }

      int outputBufIndex = codec.dequeueOutputBuffer(info, 10000);
      if (outputBufIndex >= 0) {
        ByteBuffer outputBuf = codecOutputBuffers[outputBufIndex];
        if (outputBuf != null && info.size > 0) {
          ShortBuffer shortBuf = outputBuf.order(ByteOrder.nativeOrder())
              .asShortBuffer();
          shortBuf.rewind();
          int shortCount = info.size / 2;

          // Downmix stereo→mono by averaging channels
          for (int i = 0; i < shortCount; i += channelCount) {
            int sum = 0;
            int count = 0;
            for (int ch = 0; ch < channelCount && (i + ch) < shortCount; ch++) {
              sum += shortBuf.get(i + ch);
              count++;
            }
            short monoSample = (short)(sum / count);
            fos.write(monoSample & 0xFF);
            fos.write((monoSample >> 8) & 0xFF);
            totalSamplesOut++;
          }
        }
        codec.releaseOutputBuffer(outputBufIndex, false);

        if ((info.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
          sawOutputEOS = true;
        }
      } else if (outputBufIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
        codecOutputBuffers = codec.getOutputBuffers();
      }
    }

    fos.flush();
    fos.close();
    codec.stop();
    codec.release();
    extractor.release();

    WritableMap result = Arguments.createMap();
    result.putString("pcmFilePath", tempFile.getAbsolutePath());
    result.putInt("sampleRate", sampleRate);
    result.putInt("totalSamples", totalSamplesOut);
    result.putInt("channels", 1); // Always mono output

    return result;
  }
}
