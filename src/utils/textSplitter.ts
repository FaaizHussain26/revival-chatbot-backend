/**
 * Recursive character text splitter
 * Splits text into chunks while trying to preserve semantic meaning
 */

interface TextSplitterConfig {
  chunkSize: number;
  chunkOverlap: number;
  separators?: string[];
}

export class RecursiveCharacterTextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];

  constructor(config: TextSplitterConfig) {
    this.chunkSize = config.chunkSize || 2000;
    this.chunkOverlap = config.chunkOverlap || 100;
    this.separators = config.separators || [
      "\n\n", // Paragraph breaks
      "\n", // Line breaks
      ". ", // Sentences
      "! ",
      "? ",
      "; ",
      ": ",
      ", ",
      " ", // Words
      "", // Characters (fallback)
    ];
  }

  /**
   * Split text into chunks
   */
  splitText(text: string): string[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Clean the text
    const cleanedText = text.trim();

    if (cleanedText.length <= this.chunkSize) {
      return [cleanedText];
    }

    return this.recursiveSplit(cleanedText, this.separators);
  }

  /**
   * Recursively split text using different separators
   */
  private recursiveSplit(text: string, separators: string[]): string[] {
    const chunks: string[] = [];
    const separator = separators[0];

    if (separator === "") {
      // Last resort: split by character
      return this.splitByCharacter(text);
    }

    const splits = text.split(separator);
    let currentChunk = "";

    for (let i = 0; i < splits.length; i++) {
      const split = splits[i];
      const potentialChunk = currentChunk
        ? currentChunk + separator + split
        : split;

      if (potentialChunk.length <= this.chunkSize) {
        currentChunk = potentialChunk;
      } else {
        // Current chunk is full
        if (currentChunk) {
          chunks.push(currentChunk);

          // Add overlap from the end of current chunk
          const overlapStart = Math.max(
            0,
            currentChunk.length - this.chunkOverlap
          );
          currentChunk =
            currentChunk.substring(overlapStart) + separator + split;
        } else {
          // Single split is too large, try next separator
          const subChunks = this.recursiveSplit(split, separators.slice(1));
          chunks.push(...subChunks);
          currentChunk = "";
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Split text by character (fallback method)
   */
  private splitByCharacter(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + this.chunkSize, text.length);
      chunks.push(text.substring(start, end));
      start += this.chunkSize - this.chunkOverlap;
    }

    return chunks;
  }
}

/**
 * Create a text splitter with default configuration
 */
export const createTextSplitter = (): RecursiveCharacterTextSplitter => {
  return new RecursiveCharacterTextSplitter({
    chunkSize: parseInt("2000"),
    chunkOverlap: parseInt("100"),
  });
};
