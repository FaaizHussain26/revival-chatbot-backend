import express from "express";
import {
  createChat,
  deleteChat,
  getAll,
  getChatHistory,
} from "../controller/chat.controller";

const chatRouter = express.Router();

chatRouter.post("/", createChat);
chatRouter.get("/", getAll);
chatRouter.get("/history/:chatId", getChatHistory);
chatRouter.delete("/:id", deleteChat);
export default chatRouter;
