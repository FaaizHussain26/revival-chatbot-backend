import { Request, Response } from "express";
import { KnowledgeCategory } from "../types";
import { processDocument } from "../services/document.service";
import { FileUploaddata } from "../database/models/file";

export const uploadFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
      return;
    }
    const { category } = req.body;

    if (
      !category ||
      !Object.values(KnowledgeCategory).includes(category as KnowledgeCategory)
    ) {
      res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${Object.values(
          KnowledgeCategory
        ).join(", ")}`,
      });
      return;
    }

    const fileId = `${req.file.originalname} ${Date.now()}`;
    const fileMetadata = await FileUploaddata.create({
      file_id: fileId,
      file_name: req.file.originalname,
      file_path: req.file.path,
      category: category as KnowledgeCategory,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      processed: false,
    });

    // Start background processing (don't await)
    processDocument(fileId, req.file.path, category as KnowledgeCategory).catch(
      (error) => {
        console.error("Background processing error:", error);
      }
    );

    res.status(201).json({
      success: true,
      message: "File uploaded successfully. Processing in background.",
      data: {
        file_id: fileMetadata.file_id,
        file_name: fileMetadata.file_name,
        category: fileMetadata.category,
        uploaded_at: fileMetadata.uploaded_at,
        processed: fileMetadata.processed,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "File upload failed",
      error: error.message,
    });
  }
};


export const getFileStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { fileId } = req.params;

    const fileUploaddata = await FileUploaddata.findOne({ file_id: fileId });

    if (!fileUploaddata) {
      res.status(404).json({
        success: false,
        message: "File not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        file_id: fileUploaddata.file_id,
        file_name: fileUploaddata.file_name,
        category: fileUploaddata.category,
        uploaded_at: fileUploaddata.uploaded_at,
        processed: fileUploaddata.processed,
        chunk_count: fileUploaddata.chunk_count,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to get file status",
      error: error.message,
    });
  }
};

