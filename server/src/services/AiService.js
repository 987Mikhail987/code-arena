process.loadEnvFile?.();

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4.1-mini";

function buildInstructions({ difficulty, programmingLanguage, topic }) {
  const normalizedTopic = topic?.trim();
  const topicLine = normalizedTopic
    ? `Тема тренировки: ${normalizedTopic}.`
    : "Тема тренировки не указана, выбери уместную тему сам.";

  return [
    "Ты технический интервьюер для тренировочного собеседования.",
    `Уровень кандидата: ${difficulty}.`,
    `Основной язык программирования: ${programmingLanguage}.`,
    topicLine,
    "Если это первый запрос, дай одну практическую задачу для собеседования.",
    "Структура ответа для первого сообщения: краткий контекст, сама задача, требования, что ожидается от кандидата.",
    "Если пользователь задаёт уточняющие вопросы по задаче, отвечай по существу и сохраняй контекст интервью.",
    "Не уходи в посторонние темы. Общайся на русском языке.",
  ].join(" ");
}

function buildInitialPrompt({ difficulty, programmingLanguage, topic }) {
  const normalizedTopic = topic?.trim();

  return [
    `Начни тренировочное интервью для уровня ${difficulty}.`,
    `Язык программирования: ${programmingLanguage}.`,
    normalizedTopic ? `Тема: ${normalizedTopic}.` : "",
    "Сформулируй одну задачу с собеседования и кратко объясни, что нужно сделать кандидату.",
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
        (message.role === "user" ||
          message.role === "assistant" ||
          message.role === "ai") &&
        typeof message.content === "string" &&
        message.content.trim(),
    )
    .map((message) => ({
      role: message.role === "ai" ? "assistant" : message.role,
      content: message.content.trim(),
    }));
}

function extractOutputText(responseData) {
  const output = Array.isArray(responseData.output) ? responseData.output : [];

  return output
    .flatMap((item) => {
      if (item.type !== "message" || !Array.isArray(item.content)) {
        return [];
      }

      return item.content;
    })
    .filter(
      (contentItem) =>
        contentItem.type === "output_text" && typeof contentItem.text === "string",
    )
    .map((contentItem) => contentItem.text)
    .join("\n")
    .trim();
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

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(
        responseData?.error?.message || "AI вернул ошибку",
      );
    }

    const answer = extractOutputText(responseData);

    if (!answer) {
      throw new Error("AI не вернул текстовый ответ");
    }

    return {
      answer,
      responseId: responseData.id,
      model: responseData.model,
    };
  }
}
module.exports = AiService;
