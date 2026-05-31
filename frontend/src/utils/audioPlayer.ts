// AudioPlayer — Decodes and plays chunks of 24kHz Mono 16-bit linear PCM audio
// returned by Gemini Live. Schedules buffers sequentially to ensure gap-free playback.

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private sampleRate: number;
  private activeSources: AudioBufferSourceNode[] = [];

  constructor(sampleRate: number = 24000) {
    this.sampleRate = sampleRate;
  }

  init() {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.nextStartTime = this.audioContext.currentTime;
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  playChunk(base64Data: string) {
    this.init();
    if (!this.audioContext) return;

    try {
      const int16Buffer = this.base64ToInt16(base64Data);
      const float32Buffer = this.int16ToFloat32(int16Buffer);

      // Create a 1-channel (mono) buffer at the configured sample rate
      const audioBuffer = this.audioContext.createBuffer(1, float32Buffer.length, this.sampleRate);
      audioBuffer.getChannelData(0).set(float32Buffer);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      const now = this.audioContext.currentTime;
      // If we've drifted or had a pause, align nextStartTime to current audio context time
      const playTime = Math.max(now, this.nextStartTime);
      
      source.start(playTime);
      this.activeSources.push(source);

      // Remove source from tracking list once it has completed playing
      source.onended = () => {
        this.activeSources = this.activeSources.filter((s) => s !== source);
      };

      // Set the next scheduled start time exactly at the end of this buffer
      this.nextStartTime = playTime + audioBuffer.duration;
    } catch (err) {
      console.error('[AudioPlayer] Error processing audio playback chunk:', err);
    }
  }

  stop() {
    console.log('[AudioPlayer] Stopping audio queue playback.');
    // Cancel all scheduled source nodes
    this.activeSources.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Source might have already ended or not started yet
      }
    });
    this.activeSources = [];
    if (this.audioContext) {
      this.nextStartTime = this.audioContext.currentTime;
    } else {
      this.nextStartTime = 0;
    }
  }

  close() {
    this.stop();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.audioContext = null;
  }

  private base64ToInt16(base64: string): Int16Array {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Int16Array(bytes.buffer);
  }

  private int16ToFloat32(buffer: Int16Array): Float32Array {
    const floatBuffer = new Float32Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      floatBuffer[i] = buffer[i] / 32768.0; // Rescale Int16 range to [-1.0, 1.0]
    }
    return floatBuffer;
  }
}
