try {
  process.loadEnvFile();
} catch (error) {
  if (error.code !== "ENOENT") {
    throw error;
  }
}

const { GigaChat } = require("gigachat");
const { Agent } = require("node:https");

const AI_CONTEXT_LIMIT = 6000;
const AI_CONTEXT_SOFT_LIMIT = 4800;

class AiService {
  static get AI_CONTEXT_LIMIT() {
    return AI_CONTEXT_LIMIT;
  }

  static get AI_CONTEXT_SOFT_LIMIT() {
    return AI_CONTEXT_SOFT_LIMIT;
  }

  static getCredentials() {
    return process.env.GIGACHAT_CREDENTIALS || process.env.GIGACHAT_API_KEY;
  }

  static getContextLength({ topic, message, messages, code }) {
    const topicLength = typeof topic === "string" ? topic.length : 0;
    const messageLength = typeof message === "string" ? message.length : 0;
    const codeLength = typeof code === "string" ? code.length : 0;

    const messagesLength = Array.isArray(messages)
      ? messages.reduce((total, currentMessage) => {
          if (typeof currentMessage === "string") {
            return total + currentMessage.length;
          }

          if (!currentMessage || typeof currentMessage !== "object") {
            return total;
          }

          const contentLength =
            typeof currentMessage.content === "string"
              ? currentMessage.content.length
              : 0;
          const metadataCodeLength =
            typeof currentMessage.metadata?.code === "string"
              ? currentMessage.metadata.code.length
              : 0;
          const taskDescriptionLength =
            typeof currentMessage.metadata?.task?.description === "string"
              ? currentMessage.metadata.task.description.length
              : 0;

          return (
            total +
            contentLength +
            metadataCodeLength +
            taskDescriptionLength
          );
        }, 0)
      : 0;

    return topicLength + messageLength + codeLength + messagesLength;
  }

  static getInterviewItemStats(messages = []) {
    if (!Array.isArray(messages)) {
      return {
        practiceCount: 0,
        theoryCount: 0,
      };
    }

    return messages.reduce(
      (stats, message) => {
        if (
          !message ||
          (message.role !== "assistant" && message.role !== "ai")
        ) {
          return stats;
        }

        if (message.metadata?.itemType === "theory") {
          stats.theoryCount += 1;
          return stats;
        }

        if (message.metadata?.itemType === "practice" || message.metadata?.task) {
          stats.practiceCount += 1;
        }

        return stats;
      },
      {
        practiceCount: 0,
        theoryCount: 0,
      },
    );
  }

  static getPreferredNextItemType(messages = [], isFirstRequest = false) {
    if (isFirstRequest) {
      return "practice";
    }

    const { practiceCount, theoryCount } = this.getInterviewItemStats(messages);

    if (practiceCount - theoryCount * 2 >= 2) {
      return "theory";
    }

    return "practice";
  }

  static buildSystemPrompt({
    difficulty,
    programmingLanguage,
    topic,
    preferredNextItemType,
  }) {
    const normalizedTopic = topic?.trim();
    const nextItemDescription =
      preferredNextItemType === "theory"
        ? "теоретический вопрос"
        : "практическая задача";

    return [
      "Ты технический интервьюер для учебного приложения CodeArena.",
      `Уровень: ${difficulty}.`,
      `Язык: ${programmingLanguage}.`,
      normalizedTopic
        ? `Тема: ${normalizedTopic}.`
        : "Тема не указана.",
      "Первое сообщение: приветствие и практическая задача с task.description, task.starterCode, task.editorLanguage.",
      "Дальше держи баланс: 30% теория, 70% практика.",
      `Предпочтительный следующий шаг: ${nextItemDescription}.`,
      preferredNextItemType === "theory"
        ? "Сейчас обязательно задай именно теоретический вопрос без starterCode и с task:null."
        : "Сейчас обязательно выдай практическую задачу с task.description, task.starterCode и task.editorLanguage.",
      "Теория: task:null, вопрос только в chatMessage.",
      "Практика: task с description, starterCode, editorLanguage.",
      "Если пользователь задаёт уточняющий вопрос, дай направление или 1-2 подсказки без нового вопроса, если он не нужен.",
      "Если есть код, оцени правильность, алгоритм, сложность, читаемость и крайние случаи.",
      "Если ответ верен или задача решена, выдай следующий вопрос или задачу.",
      "После слабого ответа дай шаг легче, после хорошего - сложнее, после среднего - того же уровня.",
      "Никогда не давай готовое решение, полный код или полный ответ за пользователя.",
      "Отвечай только на русском языке.",
      "Верни только валидный JSON без markdown, текста до или после JSON.",
      "Экранируй двойные кавычки внутри строк; в примерах используй одинарные кавычки.",
      'Формат: {"chatMessage":"string","task":null или {"description":"string","starterCode":"string","editorLanguage":"string"},"review":null или {"summary":"string","improvements":["string"],"score":number}}.',
      "chatMessage видит пользователь: без JSON и служебных полей.",
      "review заполняй только при анализе ответа пользователя.",
    ].join(" ");
  }

  static buildFirstUserPrompt({ difficulty, programmingLanguage, topic }) {
    const normalizedTopic = topic?.trim();

    return [
      `Начни тренировочное интервью для уровня ${difficulty}.`,
      `Язык: ${programmingLanguage}.`,
      normalizedTopic ? `Тема: ${normalizedTopic}.` : "",
      "Поздоровайся и выдай первую практическую задачу.",
      "Поле task обязательно должно быть заполнено.",
      "В task обязательно должны быть description, starterCode и editorLanguage.",
      "Не давай готовое решение.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  static buildForcedTheoryMessages({
    difficulty,
    programmingLanguage,
    topic,
    messages,
  }) {
    const normalizedTopic = topic?.trim();
    const history = this.normalizeMessages(messages).slice(-8);

    return [
      {
        role: "system",
        content: [
          "Ты технический интервьюер CodeArena.",
          `Уровень: ${difficulty}.`,
          `Язык: ${programmingLanguage}.`,
          normalizedTopic ? `Тема: ${normalizedTopic}.` : "Тема не указана.",
          "Сгенерируй именно теоретический вопрос для собеседования.",
          "Не давай практическую задачу, starterCode, код или готовое решение.",
          "Верни только валидный JSON без markdown.",
          'Формат: {"chatMessage":"string","task":null,"review":null}.',
        ].join(" "),
      },
      ...history,
      {
        role: "user",
        content:
          "Дай следующий теоретический вопрос. В поле task обязательно верни null.",
      },
    ];
  }

  static withInterviewItemType(aiData, itemType) {
    return {
      ...aiData,
      metadata: {
        ...(aiData.metadata || {}),
        itemType,
      },
    };
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

  // static extractJson(text) {
  //   const normalized = text.trim();

  //   try {
  //     return JSON.parse(normalized);
  //   } catch {
  //     const match = normalized.match(/\{[\s\S]*\}/);

  //     if (!match) {
  //       throw new Error("AI не вернул JSON");
  //     }

  //     return JSON.parse(match[0]);
  //   }
  // }

  static extractJson(text) {
    const source = String(text || "").trim();

    let start = -1;
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < source.length; i += 1) {
      const char = source[i];

      if (start === -1) {
        if (char === "{") {
          start = i;
          depth = 1;
        }
        continue;
      }

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) {
        continue;
      }

      if (char === "{") {
        depth += 1;
        continue;
      }

      if (char === "}") {
        depth -= 1;

        if (depth === 0) {
          return JSON.parse(source.slice(start, i + 1));
        }
      }
    }

    throw new Error("AI не вернул валидный JSON");
  }

  static extractLooseAiPayload(text) {
    const source = String(text || "").trim();

    const chatMessageMatch = source.match(
      /"chatMessage"\s*:\s*"([\s\S]*?)"\s*,\s*"task"\s*:/,
    );

    const chatMessage = chatMessageMatch ? chatMessageMatch[1].trim() : "";

    const taskKeyIndex = source.search(/"task"\s*:/);

    if (taskKeyIndex === -1) {
      throw new Error("AI не вернул task");
    }

    const taskValueStart = source.indexOf(":", taskKeyIndex) + 1;
    const reviewKeyMatch = source
      .slice(taskValueStart)
      .match(/,\s*"review"\s*:/);

    const taskRaw = reviewKeyMatch
      ? source
          .slice(taskValueStart, taskValueStart + reviewKeyMatch.index)
          .trim()
      : source.slice(taskValueStart).trim().replace(/}\s*$/, "");

    let task = null;

    if (taskRaw !== "null") {
      task = JSON.parse(taskRaw);
    }

    let review = null;

    const reviewKeyIndex = source.search(/"review"\s*:/);

    if (reviewKeyIndex !== -1) {
      const reviewValueStart = source.indexOf(":", reviewKeyIndex) + 1;
      const reviewRaw = source
        .slice(reviewValueStart)
        .trim()
        .replace(/}\s*$/, "");

      if (reviewRaw && reviewRaw !== "null") {
        review = JSON.parse(reviewRaw);
      }
    }

    return {
      chatMessage,
      task,
      review,
    };
  }

  static normalizeAiPayload(parsed, answer, programmingLanguage) {
    const chatMessage = String(
      parsed.chatMessage || parsed.answer || "",
    ).trim();

    const task = parsed.task
      ? {
          description: String(parsed.task.description || "").trim(),
          starterCode: String(parsed.task.starterCode || "").trim(),
          editorLanguage: String(
            parsed.task.editorLanguage || programmingLanguage,
          ).trim(),
        }
      : null;

    const review = parsed.review
      ? {
          summary: String(parsed.review.summary || "").trim(),
          improvements: Array.isArray(parsed.review.improvements)
            ? parsed.review.improvements.map((item) => String(item))
            : [],
          score:
            typeof parsed.review.score === "number"
              ? parsed.review.score
              : null,
        }
      : null;

    return {
      answer: chatMessage || this.cleanFallbackAnswer(answer),
      metadata: {
        task,
        review,
      },
    };
  }

  static cleanFallbackAnswer(text) {
    const cleaned = String(text || "")
      .replace(/^```(?:json|javascript|typescript|js|ts|python)?/i, "")
      .replace(/```$/i, "")
      .replace(/```[\s\S]*?```/g, "")
      .trim();

    const chatMessageMatch = cleaned.match(
      /"chatMessage"\s*:\s*"((?:\\.|[^"\\])*)"/,
    );

    if (chatMessageMatch) {
      try {
        return JSON.parse(`"${chatMessageMatch[1]}"`).trim();
      } catch {
        return chatMessageMatch[1].trim();
      }
    }

    if (/^\s*\{[\s\S]*\}\s*$/.test(cleaned)) {
      return "Я подготовил ответ, но не смог корректно выделить текст для чата. Попробуй отправить сообщение ещё раз.";
    }

    return cleaned;
  }

  // static parseAiResponse(answer, programmingLanguage) {
  //   try {
  //     const parsed = this.extractJson(answer);

  //     const chatMessage = String(
  //       parsed.chatMessage || parsed.answer || "",
  //     ).trim();

  //     return {
  //       answer: chatMessage || answer.trim(),
  //       metadata: {
  //         task: parsed.task
  //           ? {
  //               description: String(parsed.task.description || "").trim(),
  //               starterCode: String(parsed.task.starterCode || "").trim(),
  //               editorLanguage: String(
  //                 parsed.task.editorLanguage || programmingLanguage,
  //               ).trim(),
  //             }
  //           : null,
  //         review: parsed.review || null,
  //       },
  //     };
  //   } catch {
  //     return {
  //       answer: answer.trim(),
  //       metadata: null,
  //     };
  //   }
  // }

  static parseAiResponse(answer, programmingLanguage) {
    try {
      const parsed = this.extractJson(answer);

      return this.normalizeAiPayload(parsed, answer, programmingLanguage);
    } catch {
      try {
        const parsed = this.extractLooseAiPayload(answer);

        return this.normalizeAiPayload(parsed, answer, programmingLanguage);
      } catch {
        return {
          answer: this.cleanFallbackAnswer(answer),
          metadata: null,
        };
      }
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
    const preferredNextItemType = this.getPreferredNextItemType(
      messages,
      isFirstRequest,
    );

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
          preferredNextItemType,
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
    const aiData = this.parseAiResponse(answer, programmingLanguage);

    if (preferredNextItemType === "theory" && aiData.metadata?.task) {
      const theoryAnswer = await this.requestChat(
        client,
        this.buildForcedTheoryMessages({
          difficulty,
          programmingLanguage,
          topic,
          messages,
        }),
      );
      const theoryData = this.parseAiResponse(theoryAnswer, programmingLanguage);

      return this.withInterviewItemType(
        {
          ...theoryData,
          metadata: {
            ...(theoryData.metadata || {}),
            task: null,
          },
        },
        "theory",
      );
    }

    return this.withInterviewItemType(aiData, preferredNextItemType);
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

  static buildInterviewFeedbackInput({
    difficulty,
    programmingLanguage,
    topic,
    messages,
    code,
  }) {
    const buildTranscript = (sourceMessages) =>
      sourceMessages
        .map((message) => `${message.role}: ${message.content}`)
        .join("\n\n");

    const normalizedMessages = Array.isArray(messages) ? messages : [];
    const normalizedCode =
      typeof code === "string" && code.trim() ? code.trim() : "";

    const buildPayload = (sourceMessages, sourceCode, isShortened = false) =>
      [
        `Уровень интервью: ${difficulty}.`,
        `Язык программирования: ${programmingLanguage}.`,
        topic ? `Тема: ${topic}.` : "Тема не указана.",
        isShortened
          ? "История интервью сокращена из-за лимита контекста."
          : "История интервью:",
        buildTranscript(sourceMessages) || "Сообщения отсутствуют.",
        sourceCode
          ? `Код пользователя:\n\`\`\`${programmingLanguage}\n${sourceCode}\n\`\`\``
          : "Код пользователя не передан.",
      ].join("\n\n");

    const fullPayload = buildPayload(normalizedMessages, normalizedCode);

    if (fullPayload.length <= AI_CONTEXT_SOFT_LIMIT) {
      return fullPayload;
    }

    const shortenedMessages = normalizedMessages.slice(-12);
    const codeLimit = Math.floor(
      Math.min(1600, Math.max(0, AI_CONTEXT_SOFT_LIMIT / 2)),
    );
    const shortenedCode =
      normalizedCode.length > codeLimit
        ? normalizedCode.slice(-codeLimit)
        : normalizedCode;
    const shortenedPayload = buildPayload(
      shortenedMessages,
      shortenedCode,
      true,
    );

    return shortenedPayload.length > AI_CONTEXT_SOFT_LIMIT
      ? shortenedPayload.slice(0, AI_CONTEXT_SOFT_LIMIT)
      : shortenedPayload;
  }

  static async generateInterviewFeedback({
    difficulty,
    programmingLanguage,
    topic,
    messages,
    code,
  }) {
    const client = this.createClient();

    const answer = await this.requestChat(client, [
      {
        role: "system",
        content: [
          "Ты технический интервьюер для учебного приложения CodeArena.",
          "Дай только итоговый анализ завершённого интервью.",
          "Не добавляй приветствие, JSON, markdown и служебные пояснения.",
          "Не предлагай новую задачу и не решай задачи за пользователя.",
          "Отвечай только на русском языке.",
          "Структура ответа строго: 1. Итог. 2. Что получилось хорошо. 3. Что улучшить.",
        ].join(" "),
      },
      {
        role: "user",
        content: this.buildInterviewFeedbackInput({
          difficulty,
          programmingLanguage,
          topic,
          messages,
          code,
        }),
      },
    ]);

    return answer;
  }
}

module.exports = AiService;
