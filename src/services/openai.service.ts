import { ChatCompletionMessageParam } from "openai/resources/chat";
import openai from "../config/openai";
import Chat from "../database/models/chats";
import { saveChatMessage } from "./chat.service";
import { vectorSearch } from "./vector.search";
import { KnowledgeCategory } from "../types";
import getPrompts from "../constant/prompts";

export interface ChatResponse {
  role: "assistant";
  content: string;
  category?: KnowledgeCategory;
  chatId: string;
}

export const getAllResponses = async (limit = 50, skip = 0) => {
  return await Chat.find().limit(limit).skip(skip).lean().exec();
};

export const getChatResponse = async (
  message: string,
  category?: KnowledgeCategory,
  chatId?: string
): Promise<ChatResponse> => {
  let history = [];

  if (chatId) {
    const chat = await Chat.findOne({ chatId });
    if (!chat) {
      throw new Error("Chat not found");
    }

    if (chat?.choices) {
      history = chat.choices;
    }
  }

  const relevantChunks = await vectorSearch(
    message,
    category as KnowledgeCategory
  );
  const context = relevantChunks
    .map((chunk, index) => `[${index + 1}] ${chunk.text}`)
    .join("\n\n");

  const conversationHistory: ChatCompletionMessageParam[] =
    history && history.length > 0
      ? history.slice(-6).map(
          (msg) =>
            ({
              role: msg.role === "user" ? "user" : "assistant",
              content: msg.message || msg.messages || "",
            } as ChatCompletionMessageParam)
        )
      : [];

  const fullMessages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: getPrompts(context, category || KnowledgeCategory.Scraped),
    },
    ...conversationHistory,
    {
      role: "user",
      content: message,
    },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: fullMessages,
    temperature: 0.7,
    max_tokens: 512,
    top_p: 1,
  });

  const assistantMessageContent =
    completion.choices[0].message.content ||
    "I apologize, but I could not generate a response.";

  await saveChatMessage(
    chatId || completion.id,
    category as KnowledgeCategory,
    assistantMessageContent,
    message
  );

  return {
    role: "assistant",
    content: assistantMessageContent,
    category: category,
    chatId: chatId || completion.id,
  };
};

export const getChatHistoryResponse = async (
  chatId: string
): Promise<ChatResponse[]> => {
  try {
    const history = await Chat.findOne({ chatId: chatId })
      .select("choices")
      .lean();

    if (!history) {
      throw new Error("Chat history not found");
    }

    const conversation = history.choices ?? [];
    return conversation.map((msg) => ({
      role: "assistant" as const,
      content: msg.message || msg.messages || "",
      chatId: chatId,
    }));
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
};

export const deleteChatResponse = async (chatId: string): Promise<String> => {
  try {
    const result = await Chat.deleteOne({ chatId: chatId });
    if (result.deletedCount === 0) {
      throw new Error("Conversation not found");
    }
    return "Conversation deleted successfully";
  } catch (error) {
    console.error("Delete chat error:", error);
    throw error;
  }
};
