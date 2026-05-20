import { NativeModules } from 'react-native'

const { AudioDecoderModule } = NativeModules

interface DecodeResult {
  pcmFilePath: string
  sampleRate: number
  totalSamples: number
  channels: number
}

/**
 * Decode audio to raw mono PCM via Android's hardware-accelerated MediaCodec.
 * Returns temp .pcm file path + metadata.
 */
export const decodeAudio = (filePath: string): Promise<DecodeResult> => {
  if (!AudioDecoderModule) {
    return Promise.reject(new Error('AudioDecoderModule not available'))
  }
  return AudioDecoderModule.decodeAudio(filePath) as Promise<DecodeResult>
}

export default AudioDecoderModule
