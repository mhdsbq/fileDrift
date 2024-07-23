export class ChunkedFileReader {
  private readonly mtuLimit = 16300; // Copied from peer js
  private readonly bufferSize = 100;

  private _file: File;
  private _fileReader: FileReader;
  private _buffer: ArrayBuffer[] = [];
  private _bufferedChunkIdx = -1;

  public loadingChunks = true;
  public chunkSize = this.mtuLimit;
  public totalChunks: number = 0;
  public chunkIndex = 0;
  public readChunkSizeBytes = 0;

  constructor(file: File) {
    this._file = file;
    this._fileReader = new FileReader();
  }

  readNextChunk(): ArrayBuffer | undefined {
    if (this.chunkIndex > this.totalChunks) {
      return;
    }

    if (this._buffer.length == 0) {
      alert(
        'ERROR: NO CHUNK BUFFERED... NEED TO INCREASE CHUNK SIZE.. THIS IS FOR DEBUG PURPOSE ONLY, Check logs for more info'
      );
      console.error('adjust buffer size');
      return;
    }

    const chunk = this._buffer.shift();
    if (!this.loadingChunks) {
      this.loadChunks();
    }

    this.chunkIndex++;
    this.readChunkSizeBytes += chunk?.byteLength || 0;
    return chunk;
  }

  async loadChunks(): Promise<void> {
    this.loadingChunks = true;
    return new Promise(async (resolve, reject) => {
      this.totalChunks = Math.ceil(this._file.size / this.chunkSize);

      while (this._buffer.length < this.bufferSize && this._bufferedChunkIdx <= this.totalChunks) {
        const chunk = await this.readChunk(this._bufferedChunkIdx + 1);
        this._buffer.push(chunk);
        this._bufferedChunkIdx += 1;
      }
      this.loadingChunks = false;
      resolve();
    });
  }

  private readChunk(chunkIndex: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const start = chunkIndex * this.chunkSize;
      const end = Math.min(start + this.chunkSize, this._file.size);

      const chunk = this._file.slice(start, end);
      this._fileReader.onload = (e) => resolve(e.target!.result as ArrayBuffer);
      this._fileReader.onerror = (err) => reject(err);

      this._fileReader.readAsArrayBuffer(chunk);
    });
  }
}
