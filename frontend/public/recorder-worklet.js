class RecorderWorklet extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.isActive = true;
    const configuredChunkSize = options?.processorOptions?.chunkSize;
    this.chunkSize = Number.isInteger(configuredChunkSize) && configuredChunkSize > 0
      ? configuredChunkSize
      : 2048;
    this.chunkBuffer = new Float32Array(this.chunkSize);
    this.writeOffset = 0;

    this.port.onmessage = (event) => {
      if (event?.data?.type === 'stop') {
        this.isActive = false;
      }
    };
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) {
      return this.isActive;
    }

    const monoChannel = input[0];
    if (!monoChannel || monoChannel.length === 0) {
      return this.isActive;
    }

    for (let i = 0; i < monoChannel.length; i++) {
      this.chunkBuffer[this.writeOffset] = monoChannel[i];
      this.writeOffset++;

      if (this.writeOffset === this.chunkSize) {
        const emittedChunk = new Float32Array(this.chunkBuffer);
        this.port.postMessage(emittedChunk, [emittedChunk.buffer]);
        this.writeOffset = 0;
      }
    }

    return this.isActive;
  }
}

registerProcessor('recorder-worklet', RecorderWorklet);
