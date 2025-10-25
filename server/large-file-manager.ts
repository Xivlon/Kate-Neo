/**
 * Large File Manager Service
 * 
 * Handles efficient loading and navigation of large files through:
 * - Chunked/incremental loading
 * - Line offset indexing for fast random access
 * - Streaming file reading
 * - Memory-efficient buffer management
 */

import * as fs from 'fs';
import * as readline from 'readline';
import { EventEmitter } from 'events';

/**
 * Configuration for large file handling
 */
export interface LargeFileConfig {
  /** Chunk size in lines for incremental loading */
  chunkSize: number;
  /** Maximum file size to load entirely (in bytes) */
  maxFullLoadSize: number;
  /** Enable line offset indexing */
  enableIndexing: boolean;
}

/**
 * Text chunk representing a portion of a file
 */
export interface TextChunk {
  /** Starting line number (0-based) */
  startLine: number;
  /** Number of lines in chunk */
  lineCount: number;
  /** Text content */
  content: string;
  /** Byte offset in file */
  byteOffset: number;
  /** Byte length */
  byteLength: number;
}

/**
 * Line index entry for fast navigation
 */
interface LineIndexEntry {
  /** Line number (0-based) */
  line: number;
  /** Byte offset in file */
  offset: number;
  /** Line length in bytes */
  length: number;
}

/**
 * File metadata
 */
export interface FileMetadata {
  /** File path */
  path: string;
  /** Total file size in bytes */
  size: number;
  /** Total number of lines (if indexed) */
  lineCount?: number;
  /** Whether file is indexed */
  indexed: boolean;
  /** Encoding */
  encoding: BufferEncoding;
}

/**
 * Large File Manager
 */
export class LargeFileManager extends EventEmitter {
  private config: LargeFileConfig;
  private lineOffsets: Map<string, LineIndexEntry[]> = new Map();
  private fileMetadata: Map<string, FileMetadata> = new Map();

  constructor(config: Partial<LargeFileConfig> = {}) {
    super();
    this.config = {
      chunkSize: config.chunkSize ?? 1000,
      maxFullLoadSize: config.maxFullLoadSize ?? 5 * 1024 * 1024, // 5MB
      enableIndexing: config.enableIndexing ?? true,
    };
  }

  /**
   * Check if file should be handled as large file
   */
  async shouldUseLargeFileHandling(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.promises.stat(filePath);
      return stats.size > this.config.maxFullLoadSize;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string): Promise<FileMetadata> {
    if (this.fileMetadata.has(filePath)) {
      return this.fileMetadata.get(filePath)!;
    }

    const stats = await fs.promises.stat(filePath);
    const metadata: FileMetadata = {
      path: filePath,
      size: stats.size,
      indexed: false,
      encoding: 'utf-8',
    };

    this.fileMetadata.set(filePath, metadata);
    return metadata;
  }

  /**
   * Build line offset index for fast random access
   */
  async buildLineIndex(filePath: string): Promise<void> {
    if (this.lineOffsets.has(filePath)) {
      return; // Already indexed
    }

    console.log(`[LargeFileManager] Building line index for ${filePath}`);
    const startTime = Date.now();

    const lineOffsets: LineIndexEntry[] = [];
    let currentOffset = 0;
    let lineNumber = 0;

    const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      const lineLength = Buffer.byteLength(line, 'utf-8') + 1; // +1 for newline
      
      lineOffsets.push({
        line: lineNumber,
        offset: currentOffset,
        length: lineLength,
      });

      currentOffset += lineLength;
      lineNumber++;
    }

    this.lineOffsets.set(filePath, lineOffsets);

    // Update metadata
    const metadata = await this.getFileMetadata(filePath);
    metadata.indexed = true;
    metadata.lineCount = lineOffsets.length;

    const elapsed = Date.now() - startTime;
    console.log(`[LargeFileManager] Indexed ${lineOffsets.length} lines in ${elapsed}ms`);
    
    this.emit('indexed', { filePath, lineCount: lineOffsets.length, elapsed });
  }

  /**
   * Get chunk of file by line range
   */
  async getChunk(filePath: string, startLine: number, lineCount: number): Promise<TextChunk> {
    // Ensure file is indexed
    if (!this.lineOffsets.has(filePath)) {
      if (this.config.enableIndexing) {
        await this.buildLineIndex(filePath);
      } else {
        throw new Error('File not indexed and indexing is disabled');
      }
    }

    const offsets = this.lineOffsets.get(filePath)!;
    const totalLines = offsets.length;

    // Clamp line range
    const actualStartLine = Math.max(0, Math.min(startLine, totalLines - 1));
    const actualEndLine = Math.min(actualStartLine + lineCount, totalLines);
    const actualLineCount = actualEndLine - actualStartLine;

    if (actualLineCount === 0) {
      return {
        startLine: actualStartLine,
        lineCount: 0,
        content: '',
        byteOffset: 0,
        byteLength: 0,
      };
    }

    // Calculate byte range to read
    const firstLineOffset = offsets[actualStartLine].offset;
    const lastLineOffset = offsets[actualEndLine - 1];
    const byteLength = lastLineOffset.offset + lastLineOffset.length - firstLineOffset;

    // Read the specific byte range
    const content = await this.readFileRange(filePath, firstLineOffset, byteLength);

    return {
      startLine: actualStartLine,
      lineCount: actualLineCount,
      content,
      byteOffset: firstLineOffset,
      byteLength,
    };
  }

  /**
   * Read a specific byte range from file
   */
  private async readFileRange(filePath: string, offset: number, length: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const buffer = Buffer.allocUnsafe(length);
      
      fs.open(filePath, 'r', (err, fd) => {
        if (err) {
          reject(err);
          return;
        }

        fs.read(fd, buffer, 0, length, offset, (err, bytesRead) => {
          fs.close(fd, (closeErr) => {
            if (err || closeErr) {
              reject(err || closeErr);
              return;
            }

            resolve(buffer.toString('utf-8', 0, bytesRead));
          });
        });
      });
    });
  }

  /**
   * Find line offset using binary search
   */
  findLineOffset(filePath: string, lineNumber: number): number | null {
    const offsets = this.lineOffsets.get(filePath);
    if (!offsets || lineNumber < 0 || lineNumber >= offsets.length) {
      return null;
    }

    return offsets[lineNumber].offset;
  }

  /**
   * Get visible range for viewport
   * Returns the line range that should be loaded based on viewport
   */
  getVisibleRange(
    totalLines: number,
    viewportTop: number,
    viewportHeight: number,
    lineHeight: number,
    overscan: number = 10
  ): { startLine: number; endLine: number; lineCount: number } {
    const visibleLines = Math.ceil(viewportHeight / lineHeight);
    const startLine = Math.floor(viewportTop / lineHeight);
    
    // Add overscan for smooth scrolling
    const bufferedStartLine = Math.max(0, startLine - overscan);
    const bufferedEndLine = Math.min(totalLines, startLine + visibleLines + overscan);
    
    return {
      startLine: bufferedStartLine,
      endLine: bufferedEndLine,
      lineCount: bufferedEndLine - bufferedStartLine,
    };
  }

  /**
   * Stream file line by line
   */
  async *streamLines(filePath: string): AsyncGenerator<string, void, unknown> {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      yield line;
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats(filePath: string): Promise<{
    size: number;
    lineCount: number;
    indexed: boolean;
    averageLineLength: number;
  }> {
    const metadata = await this.getFileMetadata(filePath);
    
    if (!metadata.indexed && this.config.enableIndexing) {
      await this.buildLineIndex(filePath);
    }

    const offsets = this.lineOffsets.get(filePath);
    const lineCount = offsets?.length ?? 0;
    const averageLineLength = lineCount > 0 ? metadata.size / lineCount : 0;

    return {
      size: metadata.size,
      lineCount,
      indexed: metadata.indexed,
      averageLineLength,
    };
  }

  /**
   * Clear index for file
   */
  clearIndex(filePath: string): void {
    this.lineOffsets.delete(filePath);
    this.fileMetadata.delete(filePath);
  }

  /**
   * Clear all indices
   */
  clearAll(): void {
    this.lineOffsets.clear();
    this.fileMetadata.clear();
  }

  /**
   * Get memory usage statistics
   */
  getMemoryUsage(): {
    indexedFiles: number;
    totalLineIndices: number;
    estimatedMemoryBytes: number;
  } {
    let totalLineIndices = 0;
    for (const offsets of Array.from(this.lineOffsets.values())) {
      totalLineIndices += offsets.length;
    }

    // Rough estimate: each line index entry takes ~24 bytes (3 numbers)
    const estimatedMemoryBytes = totalLineIndices * 24;

    return {
      indexedFiles: this.lineOffsets.size,
      totalLineIndices,
      estimatedMemoryBytes,
    };
  }
}
