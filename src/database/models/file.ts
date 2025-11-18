import mongoose, { Document, Schema } from "mongoose";
import { KnowledgeCategory } from "../../types";

/**
 * File metadata document interface
 */
export interface IFileUpload extends Document {
  file_id: string;
  file_name: string;
  file_path: string;
  category: KnowledgeCategory;
  uploaded_at: Date;
  file_size: number;
  mime_type: string;
  processed: boolean;
  chunk_count?: number;
}

/**
 * File metadata schema
 */
const fileUploadSchema = new Schema<IFileUpload>({
  file_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  file_name: {
    type: String,
    required: true,
  },
  file_path: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: Object.values(KnowledgeCategory),
    required: true,
    index: true,
  },
  uploaded_at: {
    type: Date,
    default: Date.now,
  },
  file_size: {
    type: Number,
    required: true,
  },
  mime_type: {
    type: String,
    required: true,
  },
  processed: {
    type: Boolean,
    default: false,
  },
  chunk_count: {
    type: Number,
    default: 0,
  },
});

export const FileUploaddata = mongoose.model<IFileUpload>(
  "file_upload",
  fileUploadSchema
);
