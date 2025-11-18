import openai from "../config/openai";

/**
 * Embedding service
 * Generates vector embeddings using OpenAI's API
 */

/**
 * Generate embeddings for multiple text chunks
 * Processes in batches to avoid rate limits
 */
export const generateEmbeddings = async (
  texts: string[]
): Promise<number[][]> => {
  try {
    if (texts.length === 0) {
      return [];
    }

    console.log(`🔄 Generating embeddings for ${texts.length} chunks...`);

    // OpenAI allows up to 2048 inputs per request for embeddings
    const batchSize = 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      const response = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: batch,
        encoding_format: "float",
      });

      const batchEmbeddings = response.data.map((item) => item.embedding);
      allEmbeddings.push(...batchEmbeddings);

      console.log(
        `✅ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          texts.length / batchSize
        )}`
      );
    }

    return allEmbeddings;
  } catch (error: any) {
    console.error("❌ Error generating embeddings:", error);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
};

/**
 * Generate embedding for a single text (used for query embedding)
 */
export const generateQueryEmbedding = async (
  text: string
): Promise<number[]> => {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error: any) {
    console.error("❌ Error generating query embedding:", error);
    throw new Error(`Failed to generate query embedding: ${error.message}`);
  }
};
