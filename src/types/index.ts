import { Request } from "express";

/**
 * Knowledge categories supported by the system
 */
export enum KnowledgeCategory {
  SPONSORS = "sponsor",
  Patient = "patient",
  Physician = "physician",
  Others = "others",
  Scraped = "scraped",
}

export interface DocumentChunk {
  text: string;
  embedding: number[];
  metadata: {
    file_id: string;
    category: KnowledgeCategory;
    chunk_index: number;
    source?: string;
    url?: string;
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
