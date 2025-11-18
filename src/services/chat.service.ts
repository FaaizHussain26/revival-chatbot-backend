import Chat from "../database/models/chats";
import { KnowledgeCategory } from "../types";

export type Message = {
  role: string;
  message: string;
  timestamp: Date;
};

const saveChatMessage = async (
  conversationId: string,
  category: KnowledgeCategory,
  aiResponse: string,
  userMessage: string
) => {
  try {
    let chat = await Chat.findOne({ chatId: conversationId });

    if (!chat) {
      chat = new Chat({
        chatId: conversationId,
        category: category,
        choices: [
          { role: "user", messages: userMessage, timestamp: new Date() },
          { role: "assistant", messages: aiResponse, timestamp: new Date() },
        ],
      });
    } else {
      chat.choices = chat.choices || [];
      chat.choices.push(
        { role: "user", messages: userMessage, timestamp: new Date() },
        { role: "assistant", messages: aiResponse, timestamp: new Date() }
      );
      chat.updatedAt = new Date();
    }

    await chat.save();
  } catch (error) {
    console.error("Error saving chat message:", error);
    throw error;
  }
};

export { saveChatMessage };
