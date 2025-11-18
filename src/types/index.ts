import { Request } from "express";

/**
 * Knowledge categories supported by the system
 */
export enum KnowledgeCategory {
  SPONSORS = "sponsor",
  Patient = "patient",
  Physician = "physician",
  Others = "others",
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

// /**
//  * Chat request payload
//  */
// export interface ChatRequest {
//   message: string;
//   category: KnowledgeCategory;
//   conversation_id?: string;
// }

// /**
//  * Chat response payload
//  */
// export interface ChatResponse {
//   response: string;
//   conversation_id: string;
//   sources?: string[];
// }

// /**
//  * File upload metadata
//  */
// export interface FileUploadMetadata {
//   file_name: string;
//   file_path: string;
//   category: KnowledgeCategory;
//   uploaded_by: string;
//   uploaded_at: Date;
//   file_id: string;
//   file_size: number;
//   mime_type: string;
// }

// /**
//  * Vector search result
//  */
// export interface VectorSearchResult {
//   text: string;
//   score: number;
//   metadata: {
//     file_id: string;
//     category: KnowledgeCategory;
//     chunk_index: number;
//     source?: string;
//   };
// }

// /**
//  * Scraped source tracking
//  */
// export interface ScrapedSourceData {
//   url: string;
//   category: KnowledgeCategory;
//   content_hash: string;
//   last_scraped: Date;
//   chunk_count: number;
// }
