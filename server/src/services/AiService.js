process.loadEnvFile?.();

const OpenAI = require("openai");

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

function buildInstructions({ difficulty, programmingLanguage, topic }) {
  const normalizedTopic = topic?.trim();

  return [
    "Ты технический интервьюер для тренировочного собеседования.",
    `Уровень кандидата: ${difficulty}.`,
    `Основной язык программирования: ${programmingLanguage}.`,
    normalizedTopic
      ? `Тема тренировки: ${normalizedTopic}.`
      : "Тема тренировки не указана, выбери подходящую тему самостоятельно.",
    "Если это начало диалога, дай одну задачу с собеседования.",
    "Если пользователь задаёт уточняющие вопросы, отвечай по существу и сохраняй контекст интервью.",
    "Общайся на русском языке.",
  ].join(" ");
}

function buildInitialPrompt({ difficulty, programmingLanguage, topic }) {
  const normalizedTopic = topic?.trim();

  return [
    `Начни тренировочное интервью для уровня ${difficulty}.`,
    `Язык программирования: ${programmingLanguage}.`,
    normalizedTopic ? `Тема: ${normalizedTopic}.` : "",
    "Сформулируй одну задачу с собеседования и кратко объясни требования к решению.",
  ]
    .filter(Boolean)
    .join(" ");
}

function normalizeMessages(messages = []) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter(
      (message) =>
        message &&
        typeof message.content === "string" &&
        message.content.trim() &&
        (message.role === "user" ||
          message.role === "assistant" ||
          message.role === "ai"),
    )
    .map((message) => ({
      role: message.role === "ai" ? "assistant" : message.role,
      content: message.content.trim(),
    }));
}

class AiService {
  static async getAiAnswer({
    difficulty,
    programmingLanguage,
    topic,
    message,
    previousResponseId,
    messages,
  }) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY не найден в переменных окружения");
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const input = normalizeMessages(messages);
    const normalizedMessage = typeof message === "string" ? message.trim() : "";

    if (normalizedMessage) {
      input.push({
        role: "user",
        content: normalizedMessage,
      });
    }

    if (input.length === 0) {
      input.push({
        role: "user",
        content: buildInitialPrompt({ difficulty, programmingLanguage, topic }),
      });
    }

    const requestBody = {
      model: DEFAULT_MODEL,
      instructions: buildInstructions({
        difficulty,
        programmingLanguage,
        topic,
      }),
      input,
    };

    if (previousResponseId?.trim()) {
      requestBody.previous_response_id = previousResponseId.trim();
    }

    const response = await openai.responses.create(requestBody);
    const answer = response.output_text?.trim();

    if (!answer) {
      throw new Error("AI не вернул текстовый ответ");
    }

    return {
      answer,
      responseId: response.id,
      model: response.model,
    };
  }
}

module.exports = AiService;
