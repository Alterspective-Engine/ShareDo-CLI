/**
 * Streaming utilities for large file operations
 */

import { Readable, Writable, Transform } from 'stream';
import { promisify } from 'util';
import { pipeline as pipelineCallback } from 'stream';

export const pipeline = promisify(pipelineCallback);

/**
 * Progress tracking options for streaming operations
 */
export interface IStreamProgress {
  onProgress?: (bytesProcessed: number, totalBytes?: number) => void;
  totalBytes?: number;
}

/**
 * Create a progress tracking transform stream
 */
export function createProgressStream(options: IStreamProgress): Transform {
  let bytesProcessed = 0;
  
  return new Transform({
    transform(chunk, encoding, callback) {
      bytesProcessed += chunk.length;
      if (options.onProgress) {
        options.onProgress(bytesProcessed, options.totalBytes);
      }
      callback(null, chunk);
    }
  });
}

/**
 * Stream utilities for handling large data
 */
export class StreamUtils {
  /**
   * Convert a Buffer to a Readable stream
   */
  static bufferToStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }
  
  /**
   * Convert a stream to a Buffer
   */
  static async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
  
  /**
   * Pipe a stream with progress tracking
   */
  static async pipeWithProgress(
    source: Readable,
    destination: Writable,
    options?: IStreamProgress
  ): Promise<void> {
    const streams: (Readable | Transform | Writable)[] = [source];
    
    if (options) {
      streams.push(createProgressStream(options));
    }
    
    streams.push(destination);
    
    await pipeline(...streams);
  }
  
  /**
   * Create a chunked upload stream
   */
  static createChunkedStream(chunkSize: number = 1024 * 1024): Transform {
    let buffer = Buffer.alloc(0);
    
    return new Transform({
      transform(chunk, encoding, callback) {
        buffer = Buffer.concat([buffer, chunk]);
        
        while (buffer.length >= chunkSize) {
          const chunkToSend = buffer.slice(0, chunkSize);
          buffer = buffer.slice(chunkSize);
          this.push(chunkToSend);
        }
        
        callback();
      },
      
      flush(callback) {
        if (buffer.length > 0) {
          this.push(buffer);
        }
        callback();
      }
    });
  }
}