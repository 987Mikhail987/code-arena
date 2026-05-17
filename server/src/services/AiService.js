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
      `Текущий уровень пользователя: ${difficulty}.`,
      `Основной язык программирования: ${programmingLanguage}.`,
      normalizedTopic
        ? `Тема тренировки: ${normalizedTopic}.`
        : "Тема тренировки не указана.",
      "Если диалог только начинается, поприветствуй пользователя и дай одну задачу с технического собеседования на текущем уровне.",
      "Если в истории или текущем сообщении есть код пользователя, проанализируй решение.",
      "Нужно определить, правильно ли решена задача, где можно улучшить код, алгоритм, читаемость, сложность или обработку крайних случаев.",
      "После анализа обязательно дай следующую задачу.",
      "Если пользователь справился плохо, следующая задача должна быть легче.",
      "Если пользователь справился хорошо, следующая задача должна быть немного сложнее.",
      "Если пользователь справился средне, следующая задача должна быть того же уровня, но с другой формулировкой.",
      "Никогда не давай полное готовое решение текущей задачи.",
      "Если пользователь просит показать решение, дать готовый код, решить задачу за него или написать полный ответ, откажись от полного решения.",
      "Вместо полного решения дай только направление, 1-2 подсказки по алгоритму, укажи на следующий шаг или предложи задачу полегче.",
      "Отвечай только на русском языке.",
      "Всегда отвечай строго валидным JSON без markdown.",
      'Формат: {"chatMessage":"string","task":null или {"description":"string","starterCode":"string","editorLanguage":"string"},"review":null или {"summary":"string","improvements":["string"],"score":number}}.',
      "chatMessage показывается пользователю в чате.",
      "task заполняй только если выдаешь новую задачу или новый стартовый код.",
      "review заполняй только если анализируешь решение пользователя.",
      "Никогда не давай полное готовое решение.",
      "Если пользователь просит подсказку, дай направление, идею или 1-2 вопроса, но не готовый код.",
      "Структурируй ответ так: 1. Оценка решения. 2. Что улучшить. 3. Следующая задача.",
    ].join(" ");
  }

  static buildFirstUserPrompt({ difficulty, programmingLanguage, topic }) {
    const normalizedTopic = topic?.trim();

    return [
      `Начни тренировочное интервью для уровня ${difficulty}.`,
      `Язык: ${programmingLanguage}.`,
      normalizedTopic ? `Тема: ${normalizedTopic}.` : "",
      "Поздоровайся и выдай первую задачу.",
      "Поле task обязательно должно быть заполнено.",
      "Не давай готовое решение.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  static normalizeMessages(messages = []) {
    if (!Array.isArray(messages)) {
      return [];
    }

    return messages
      .map((message) => {
        if (typeof message === "string" && message.trim()) {
          return {
            role: "assistant",
            content: message.trim(),
          };
        }

        if (
          message &&
          typeof message.content === "string" &&
          message.content.trim() &&
          (message.role === "user" ||
            message.role === "assistant" ||
            message.role === "ai")
        ) {
          return {
            role: message.role === "ai" ? "assistant" : message.role,
            content: [
              message.content.trim(),
              message.metadata?.code
                ? `\nКод пользователя:\n${message.metadata.code}`
                : "",
              message.metadata?.task?.description
                ? `\nТекущая задача:\n${message.metadata.task.description}`
                : "",
            ].join(""),
          };
        }

        return null;
      })
      .filter(Boolean);
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
      const providerError = error?.response?.data || error?.message || error;

      if (
        providerError &&
        typeof providerError === "object" &&
        providerError.message === "credentials doesn't match db data"
      ) {
        throw new Error(
          "Неверный ключ авторизации GigaChat. Проверьте GIGACHAT_CREDENTIALS/GIGACHAT_API_KEY в .env: для gigachat нужен credentials-ключ, выданный в кабинете GigaChat.",
          { cause: error },
        );
      }

      throw new Error(
        typeof providerError === "string"
          ? providerError
          : providerError?.message || "Ошибка запроса к GigaChat",
        { cause: error },
      );
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
          "Если в истории уже есть задача, решение пользователя или код, обычно данных достаточно.",
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

  static extractJson(text) {
    const normalized = text.trim();

    try {
      return JSON.parse(normalized);
    } catch {
      const match = normalized.match(/\{[\s\S]*\}/);

      if (!match) {
        throw new Error("AI не вернул JSON");
      }

      return JSON.parse(match[0]);
    }
  }

  static parseAiResponse(answer, programmingLanguage) {
    try {
      const parsed = this.extractJson(answer);

      const chatMessage = String(
        parsed.chatMessage || parsed.answer || "",
      ).trim();

      return {
        answer: chatMessage || answer.trim(),
        metadata: {
          task: parsed.task
            ? {
                description: String(parsed.task.description || "").trim(),
                starterCode: String(parsed.task.starterCode || "").trim(),
                editorLanguage: String(
                  parsed.task.editorLanguage || programmingLanguage,
                ).trim(),
              }
            : null,
          review: parsed.review || null,
        },
      };
    } catch {
      return {
        answer: answer.trim(),
        metadata: null,
      };
    }
  }

  static async getAiAnswer({
    difficulty,
    programmingLanguage,
    topic,
    message,
    messages,
  }) {
    const client = this.createClient();
    const normalizedMessages = this.normalizeMessages(messages);
    const normalizedMessage = typeof message === "string" ? message.trim() : "";
    const isFirstRequest =
      normalizedMessages.length === 0 && normalizedMessage.length === 0;

    if (!isFirstRequest) {
      const clarificationDecision = await this.getClarificationDecision(
        client,
        {
          difficulty,
          programmingLanguage,
          topic,
          message,
          messages,
        },
      );

      if (
        clarificationDecision?.needsClarification &&
        clarificationDecision?.clarificationQuestion
      ) {
        return {
          answer: clarificationDecision.clarificationQuestion,
        };
      }
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
      ...normalizedMessages,
    ];

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

    return this.parseAiResponse(answer, programmingLanguage);
  }

  static async getInterviewResult({
    difficulty,
    programmingLanguage,
    topic,
    messages,
  }) {
    const client = this.createClient();

    const answer = await this.requestChat(client, [
      {
        role: "system",
        content: [
          "Ты технический интервьюер.",
          "Сформируй финальный результат интервью.",
          "Ответь строго JSON без markdown.",
          'Формат: {"summary":"string","score":number,"strengths":["string"],"weaknesses":["string"],"recommendations":["string"]}.',
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          difficulty,
          programmingLanguage,
          topic,
          messages: this.normalizeMessages(messages),
        }),
      },
    ]);

    return this.extractJson(answer);
  }

  static async generateInterviewFeedback({
    difficulty,
    programmingLanguage,
    topic,
    messages,
    code,
  }) {
    const client = this.createClient();

    const transcript = (messages || [])
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n\n");

    const answer = await this.requestChat(client, [
      {
        role: "system",
        content: [
          "Ты технический интервьюер для учебного приложения CodeArena.",
          "Тебе нужно дать итоговый feedback по завершённому интервью.",
          "Проанализируй все сообщения интервью и код пользователя.",
          "Скажи, прошел бы пользователь интервью или нет.",
          "Укажи сильные стороны ответа.",
          "Укажи, что можно улучшить в коде, алгоритме и рассуждениях.",
          "Укажи, какие темы стоит повторить.",
          "Отвечай только на русском языке.",
          "Структурируй ответ так: 1. Итог. 2. Что получилось хорошо. 3. Что улучшить.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          `Уровень интервью: ${difficulty}.`,
          `Язык программирования: ${programmingLanguage}.`,
          topic ? `Тема: ${topic}.` : "Тема не указана.",
          "История интервью:",
          transcript || "Сообщения отсутствуют.",
          typeof code === "string" && code.trim()
            ? `Код пользователя:\n\`\`\`${programmingLanguage}\n${code.trim()}\n\`\`\``
            : "Код пользователя не передан.",
        ].join("\n\n"),
      },
    ]);

    return answer;
  }
}

module.exports = AiService;
