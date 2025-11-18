import mongoose, { Document, Schema } from 'mongoose';
import { KnowledgeCategory } from '../../types';


/**
 * Document chunk interface for vector storage
 */
export interface IChunk extends Document {
  text: string;
  embedding: number[];
  metadata: {
    file_id: string;
    category: KnowledgeCategory;
    chunk_index: number;
    source?: string;
    url?: string;
  };
  created_at: Date;
}

/**
 * Chunk schema with vector embedding support
 * IMPORTANT: The 'embedding' field must have a Vector Search index in MongoDB Atlas
 */
const chunkSchema = new Schema<IChunk>({
  text: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    required: true
    // Vector Search index should be created on this field in MongoDB Atlas
    // Index name: 'vector_index'
    // Type: vectorSearch
    // Dimensions: 3072 (for text-embedding-3-large)
  },
  metadata: {
    file_id: {
      type: String,
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: Object.values(KnowledgeCategory),
      required: true,
      index: true
    },
    chunk_index: {
      type: Number,
      required: true
    },
    source: {
      type: String,
      default: 'upload'
    },
    url: {
      type: String
    }
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
chunkSchema.index({ 'metadata.file_id': 1, 'metadata.chunk_index': 1 });
chunkSchema.index({ 'metadata.category': 1, created_at: -1 });

export const Chunk = mongoose.model<IChunk>('Chunk', chunkSchema);