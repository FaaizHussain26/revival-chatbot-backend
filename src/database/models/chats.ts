import mongoose from "mongoose";
import { KnowledgeCategory } from "../../types";

const chatSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
  },

  choices: {
    type: Array,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: String,
    enum: Object.values(KnowledgeCategory),
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Chat = mongoose.model("chats", chatSchema);

export default Chat;
