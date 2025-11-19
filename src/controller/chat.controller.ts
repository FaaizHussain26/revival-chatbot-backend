import { Request, Response } from "express";
import {
  deleteChatResponse,
  getAllResponses,
  getChatHistoryResponse,
  getChatResponse,
} from "../services/openai.service";

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;
    const chats = await getAllResponses(limit, skip);

    res.status(200).json({
      success: true,
      message: "Chats fetched successfully.",
      data: chats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching chats",
      error: error.message,
    });
  }
};

export const createChat = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { messages, category, chatId } = req.body;
    if (!category || category.length === 0) {
      res.status(400).json({
        success: false,
        message: "Category is required",
      });
      return;
    }

    if (!messages || messages.length === 0) {
      res.status(202).json({
        success: true,
        message: "Chat created successfully.",
        data: {
          role: "assistant",
          content: `You have selected ${category}. Responses will now be tailored accordingly`,
          category: category,
        },
      });
      return;
    }
    const response = await getChatResponse(messages, category, chatId);

    res.status(202).json({
      success: true,
      message: "Chat created successfully.",
      data: response,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error creating chat",
      error: error.message,
    });
  }
};

export const getChatHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { chatId } = req.params;
    if (!chatId) {
      res.status(400).json({ error: "chatId are required" });
      return;
    }
    const response = await getChatHistoryResponse(chatId);
    res.status(202).json({
      success: true,
      message: "Chat history fetched successfully.",
      data: response,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching chat history",
      error: error.message,
    });
  }
};

export const deleteChat = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id;
    const result = await deleteChatResponse(id);

    res.status(202).json({
      success: true,
      message: result,
    });
  } catch (error: any) {
    console.error("Delete chat error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting chat history",
      error: error.message,
    });
  }
};
