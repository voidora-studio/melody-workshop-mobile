import RNFS from 'react-native-fs'
import { decodeAudio } from './nativeModules/audioDecoder'

/**
 * Decode a compressed audio file (MP3/AAC/FLAC/etc.) to mono PCM Float32Array
 * using Android's hardware-accelerated MediaCodec.
 *
 * This implements the document requirement:
 *   "音频解码：expo-av / react-native-audio-api 获取音频 Float32Array"
 *
 * Since expo-av requires Expo and react-native-audio-api requires RN 0.76+,
 * we use Android's platform MediaCodec which is hardware-accelerated and
 * preserves the original sample rate without quality loss.
 */
export const decodeAudioToPCM = async(filePath: string): Promise<{ pcm: Float32Array; sampleRate: number }> => {
  // 1. Native hardware decode → writes mono 16-bit PCM to temp file
  const { pcmFilePath, sampleRate, totalSamples } = await decodeAudio(filePath)

  // 2. Read PCM file
  const base64 = await RNFS.readFile(pcmFilePath, 'base64')
  const binaryStr = (global as any).atob(base64) as string

  // 3. Parse 16-bit signed little-endian PCM → Float32Array [-1.0, 1.0]
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const pcm = new Float32Array(totalSamples)
  for (let i = 0; i < totalSamples; i++) {
    pcm[i] = dataView.getInt16(i * 2, true) / 32768.0
  }

  // 4. Clean up temp file
  void RNFS.unlink(pcmFilePath).catch(() => {})

  return { pcm, sampleRate }
}

export const isAudioDecodingAvailable = (): boolean => {
  try {
    const { NativeModules } = require('react-native')
    return !!NativeModules.AudioDecoderModule
  } catch {
    return false
  }
}
