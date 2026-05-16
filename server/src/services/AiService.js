process.loadEnvFile();

const { GigaChat } = require("gigachat");
const { Agent } = require("node:https");

class AiService {
  static getCredentials() {
    return process.env.GIGACHAT_CREDENTIALS || process.env.GIGACHAT_API_KEY;
  }

  static buildSystemPrompt({ difficulty, programmingLanguage, topic }) {
    const normalizedTopic = topic?.trim();

    return [
      "Ты технический интервьюер для учебного приложения CodeArena.",
      `Уровень пользователя: ${difficulty}.`,
      `Язык программирования: ${programmingLanguage}.`,
      normalizedTopic
        ? `Тема тренировки: ${normalizedTopic}.`
        : "Тема тренировки не указана.",
      `Если диалог только начинается, Всегда приветствуй пользователя и дай одну задачу с технического собеседования уровня ${difficulty}.`,
      "Если пользователь задаёт уточняющие вопросы по задаче, отвечай по существу и сохраняй контекст диалога.",
      "Не давай полное готовое решение задачи.",
      "Отвечай на русском языке.",
    ].join(" ");
  }

  // static buildContinuePrompt({ difficulty, programmingLanguage, [messages] }) {
   

  //   return [
  //     "Ты технический интервьюер для учебного приложения CodeArena.",
  //     `Уровень пользователя: ${difficulty}.`,
  //     `Язык программирования: ${programmingLanguage}.`,
  //     `проанализируй ${messages}`
  //       ? `Тема тренировки: ${normalizedTopic}.`
  //       : "Тема тренировки не указана.",
  //     `Если диалог только начинается, Всегда приветствуй пользователя и дай одну задачу с технического собеседования уровня ${difficulty}.`,
  //     "Если пользователь задаёт уточняющие вопросы по задаче, отвечай по существу и сохраняй контекст диалога.",
  //     "Не давай полное готовое решение задачи.",
  //     "Отвечай на русском языке.",
  //   ].join(" ");
  // }
  static buildFirstUserPrompt({ difficulty, programmingLanguage, topic }) {
    const normalizedTopic = topic?.trim();

    return [
      `Начни тренировочное интервью для уровня ${difficulty}.`,
      `Язык: ${programmingLanguage}.`,
      normalizedTopic ? `Тема: ${normalizedTopic}.` : "",
      "Сформулируй одну задачу и кратко опиши требования к решению.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  static normalizeMessages(messages = []) {
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

  static createClient() {
    const httpsAgent = new Agent({
      rejectUnauthorized: false,
    });

    const credentials = this.getCredentials();

    if (!credentials) {
      throw new Error(
        "Не найден ключ авторизации GigaChat. Укажите GIGACHAT_CREDENTIALS или GIGACHAT_API_KEY в .env",
      );
    }

    return new GigaChat({
      model: "GigaChat",
      credentials,
      httpsAgent,
    });
  }

  static async requestChat(client, messages) {
    let response;

    try {
      response = await client.chat({ messages });
    } catch (error) {
      return error;
    }

    const answer = response.choices[0]?.message?.content?.trim();

    if (!answer) {
      throw new Error("GigaChat не вернул текстовый ответ");
    }

    return answer;
  }

  static parseClarificationResponse(answer) {
    const normalized = answer.trim();

    try {
      return JSON.parse(normalized);
    } catch {
      if (normalized.toUpperCase().startsWith("CLARIFY:")) {
        return {
          needsClarification: true,
          clarificationQuestion: normalized.replace(/^CLARIFY:\s*/i, "").trim(),
        };
      }

      return {
        needsClarification: false,
      };
    }
  }

  static async getClarificationDecision(client, payload) {
    const { difficulty, programmingLanguage, topic, message, messages } =
      payload;

    const history = this.normalizeMessages(messages);
    const normalizedMessage = typeof message === "string" ? message.trim() : "";

    const answer = await this.requestChat(client, [
      {
        role: "system",
        content: [
          "Ты помощник технического интервьюера.",
          "Определи, достаточно ли данных для основного ответа пользователю.",
          'Если данных достаточно, ответь строго JSON: {"needsClarification": false}.',
          'Если нужны уточнения, ответь строго JSON: {"needsClarification": true, "clarificationQuestion": "..."}.',
          "Не добавляй пояснений вне JSON.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          difficulty,
          programmingLanguage,
          topic: topic || null,
          message: normalizedMessage || null,
          messages: history,
        }),
      },
    ]);

    return this.parseClarificationResponse(answer);
  }

  static async getAiAnswer({
    difficulty,
    programmingLanguage,
    topic,
    message,
    messages,
  }) {
    const client = this.createClient();
    const clarificationDecision = await this.getClarificationDecision(client, {
      difficulty,
      programmingLanguage,
      topic,
      message,
      messages,
    });

    if (
      clarificationDecision?.needsClarification &&
      clarificationDecision?.clarificationQuestion
    ) {
      return {
        answer: clarificationDecision.clarificationQuestion,
      };
    }

    const chatMessages = [
      {
        role: "system",
        content: this.buildSystemPrompt({
          difficulty,
          programmingLanguage,
          topic,
        }),
      },
      ...this.normalizeMessages(messages),
    ];

    const normalizedMessage = typeof message === "string" ? message.trim() : "";

    if (normalizedMessage) {
      chatMessages.push({
        role: "user",
        content: normalizedMessage,
      });
    }

    if (chatMessages.length === 1) {
      chatMessages.push({
        role: "user",
        content: this.buildFirstUserPrompt({
          difficulty,
          programmingLanguage,
          topic,
        }),
      });
    }

    const answer = await this.requestChat(client, chatMessages);

    return {
      answer,
    };
  }
}

module.exports = AiService;
