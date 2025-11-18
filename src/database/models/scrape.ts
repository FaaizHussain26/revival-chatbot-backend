import mongoose, { Document, Schema } from "mongoose";
import { KnowledgeCategory } from "../../types";


export interface IScrapedSource extends Document {
  url: string;
  category: KnowledgeCategory;
  content_hash: string;
  last_scraped: Date;
  chunk_count: number;
  status: "active" | "failed" | "processing";
  error_message?: string;
}


const scrapedSourceSchema = new Schema<IScrapedSource>({
  url: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  category: {
    type: String,
    enum: Object.values(KnowledgeCategory),
    required: true,
  },
  content_hash: {
    type: String,
    required: true,
  },
  last_scraped: {
    type: Date,
    default: Date.now,
  },
  chunk_count: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["active", "failed", "processing"],
    default: "active",
  },
  error_message: {
    type: String,
  },
});

export const ScrapedSource = mongoose.model<IScrapedSource>(
  "scraped_source",
  scrapedSourceSchema
);
