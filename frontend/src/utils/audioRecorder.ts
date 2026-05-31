// AudioRecorder — captures user microphone using AudioWorklet for low latency,
// downsamples to 16kHz Mono linear PCM, and encodes to base64.

export class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private onAudioChunk: (base64Data: string) => void;

  constructor(onAudioChunk: (base64Data: string) => void) {
    this.onAudioChunk = onAudioChunk;
  }

  init() {
    console.log('[AudioRecorder] init() called.');
    if (!this.audioContext) {
      console.log('[AudioRecorder] Creating new AudioContext.');
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
    }
  }

  async start() {
    console.log('[AudioRecorder] start() called.');
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      console.log('[AudioRecorder] Closing previous AudioContext...');
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.init();
    
    if (!this.audioContext) {
      console.error('[AudioRecorder] audioContext is not initialized.');
      return;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        console.log('[AudioRecorder] AudioContext is suspended. Resuming...');
        await this.audioContext.resume();
        console.log('[AudioRecorder] AudioContext resumed successfully.');
      }

      console.log('[AudioRecorder] Requesting microphone access...');
      try {
        // Try the default OS negotiated stream first
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
      } catch (err: any) {
        // If the default stream is locked by the OS (NotReadableError)
        // We can attempt to bypass the Windows default device wrapper by explicitly requesting actual hardware IDs
        if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          console.warn('[AudioRecorder] Default audio failed. Enumerating hardware devices to bypass OS lock...');
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInputs = devices.filter(d => d.kind === 'audioinput');
          let success = false;
          
          for (const device of audioInputs) {
            // Skip virtual 'default' and 'communications' wrappers as they are the ones usually locked
            if (device.deviceId === 'default' || device.deviceId === 'communications') continue;
            try {
              console.log(`[AudioRecorder] Trying physical hardware device: ${device.label || device.deviceId}`);
              this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: device.deviceId } }
              });
              success = true;
              break;
            } catch (fallbackErr) {
              console.warn(`[AudioRecorder] Device ${device.label} also failed:`, fallbackErr);
            }
          }
          if (!success) throw err; // If all physical hardware fails, throw the original error
        } else {
          throw err;
        }
      }
      console.log('[AudioRecorder] Microphone access granted.');

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      console.log('[AudioRecorder] Loading AudioWorklet module from static URL /recorder-worklet.js...');
      await this.audioContext.audioWorklet.addModule('/recorder-worklet.js');
      console.log('[AudioRecorder] AudioWorklet module loaded successfully.');

      this.workletNode = new AudioWorkletNode(this.audioContext, 'recorder-worklet', {
        processorOptions: { chunkSize: 2048 }
      });

      const inputSampleRate = this.audioContext.sampleRate;
      console.log(`[AudioRecorder] Input sample rate detected: ${inputSampleRate}Hz. Target: 16000Hz.`);

      this.workletNode.port.onmessage = (e) => {
        const float32Chunk = e.data as Float32Array;
        const downsampled = this.downsample(float32Chunk, inputSampleRate, 16000);
        const base64 = this.int16ToBase64(downsampled);
        this.onAudioChunk(base64);
      };

      this.sourceNode.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination);

      console.log('[AudioRecorder] AudioWorklet pipeline successfully connected and streaming.');
    } catch (err) {
      console.error('[AudioRecorder] Failed during recording startup:', err);
      throw err;
    }
  }

  stop() {
    console.log('[AudioRecorder] stop() called.');
    if (this.workletNode && this.sourceNode) {
      console.log('[AudioRecorder] Stopping worklet node...');
      this.workletNode.port.postMessage({ type: 'stop' });
      this.sourceNode.disconnect();
      this.workletNode.disconnect();
    }
    if (this.mediaStream) {
      console.log('[AudioRecorder] Stopping media stream tracks...');
      this.mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      console.log('[AudioRecorder] Closing AudioContext...');
      this.audioContext.close();
    }
    this.workletNode = null;
    this.sourceNode = null;
    this.mediaStream = null;
    this.audioContext = null;
    console.log('[AudioRecorder] Cleaned up all recording resources.');
  }

  private downsample(buffer: Float32Array, inputSampleRate: number, outputSampleRate: number): Int16Array {
    if (outputSampleRate === inputSampleRate) {
      return this.convertFloat32ToInt16(buffer);
    }
    if (outputSampleRate > inputSampleRate) {
      return this.convertFloat32ToInt16(buffer);
    }

    const sampleRateRatio = inputSampleRate / outputSampleRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Int16Array(newLength);
    
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0;
      let count = 0;

      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }

      let s = count > 0 ? accum / count : 0;
      s = Math.max(-1, Math.min(1, s)); // Clamping
      result[offsetResult] = s < 0 ? s * 0x8000 : s * 0x7fff;
      
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }

    return result;
  }

  private convertFloat32ToInt16(buffer: Float32Array): Int16Array {
    const l = buffer.length;
    const buf = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      buf[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return buf;
  }

  private int16ToBase64(buffer: Int16Array): string {
    const bytes = new Uint8Array(buffer.buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
