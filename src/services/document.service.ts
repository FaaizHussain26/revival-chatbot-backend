import mammoth from "mammoth";
import fs from "fs";

import { createTextSplitter } from "../utils/textSplitter";

import { KnowledgeCategory } from "../types";
import { Chunk } from "../database/models/chunk";
import { FileUploaddata } from "../database/models/file";
import { generateEmbeddings } from "./embedding.service";

export const extractTextFromDocx = async (
  filePath: string
): Promise<string> => {
  try {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error: any) {
    console.error("Error extracting text from DOCX:", error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
};

export const processDocument = async (
  fileId: string,
  filePath: string,
  category: KnowledgeCategory
): Promise<void> => {
  try {
    console.log(`📄 Processing document: ${fileId}`);
    const text = await extractTextFromDocx(filePath);

    if (!text || text.trim().length === 0) {
      throw new Error("No text content found in document");
    }

    console.log(`✅ Extracted ${text.length} characters`);

    const textSplitter = createTextSplitter();
    const chunks = textSplitter.splitText(text);

    console.log(`✅ Split into ${chunks.length} chunks`);

    const embeddings = await generateEmbeddings(chunks);

    console.log(`✅ Generated embeddings`);

    const chunkDocuments = chunks.map((chunkText, index) => ({
      text: chunkText,
      embedding: embeddings[index],
      metadata: {
        file_id: fileId,
        category: category,
        chunk_index: index,
        source: "upload",
      },
    }));

    await Chunk.insertMany(chunkDocuments);

    console.log(`✅ Stored ${chunks.length} chunks in database`);

    await FileUploaddata.findOneAndUpdate(
      { file_id: fileId },
      {
        processed: true,
        chunk_count: chunks.length,
      }
    );

    console.log(`✅ Document processing completed: ${fileId}`);
  } catch (error: any) {
    console.error(`❌ Error processing document ${fileId}:`, error);

    await FileUploaddata.findOneAndUpdate(
      { file_id: fileId },
      { processed: false }
    );

    throw error;
  }
};

/**
 * Delete document and its chunks
 */
export const deleteDocument = async (fileId: string): Promise<void> => {
  try {
    // Delete all chunks associated with the file
    await Chunk.deleteMany({ "metadata.file_id": fileId });

    // Get file metadata to delete physical file
    const fileMetadata = await FileUploaddata.findOne({ file_id: fileId });

    if (fileMetadata && fs.existsSync(fileMetadata.file_path)) {
      fs.unlinkSync(fileMetadata.file_path);
    }

    // Delete file metadata
    await FileUploaddata.deleteOne({ file_id: fileId });

    console.log(`✅ Deleted document and chunks: ${fileId}`);
  } catch (error: any) {
    console.error(`❌ Error deleting document ${fileId}:`, error);
    throw error;
  }
};
