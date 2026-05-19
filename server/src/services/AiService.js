try {
  process.loadEnvFile();
} catch (error) {
  if (error.code !== "ENOENT") {
    throw error;
  }
}

const { GigaChat } = require("gigachat");
const { Agent } = require("node:https");
const { getAnswer } = require("../agent");

const AI_CONTEXT_LIMIT = 6000;
const AI_CONTEXT_SOFT_LIMIT = 4800;
const THEORY_QUESTIONS_BEFORE_FIRST_TASK = 2;
const MAX_CLARIFICATIONS_BEFORE_NEXT_TASK = 2;

class AiService {
  static get AI_CONTEXT_LIMIT() {
    return AI_CONTEXT_LIMIT;
  }

  static get AI_CONTEXT_SOFT_LIMIT() {
    return AI_CONTEXT_SOFT_LIMIT;
  }

  static get MAX_CLARIFICATIONS_BEFORE_NEXT_TASK() {
    return MAX_CLARIFICATIONS_BEFORE_NEXT_TASK;
  }

  static getCredentials() {
    return process.env.GIGACHAT_API_KEY;
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
            total + contentLength + metadataCodeLength + taskDescriptionLength
          );
        }, 0)
      : 0;

    return topicLength + messageLength + codeLength + messagesLength;
  }

  static getClarificationCount(messages = []) {
    if (!Array.isArray(messages)) {
      return 0;
    }

    let clarificationCount = 0;

    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];

      if (!message || typeof message !== "object") {
        continue;
      }

      const isAssistantMessage =
        message.role === "assistant" || message.role === "ai";

      const hasInterviewItem =
        message.metadata?.itemType ||
        message.metadata?.task ||
        message.metadata?.review;

      if (isAssistantMessage && hasInterviewItem) {
        break;
      }

      if (isAssistantMessage && message.metadata?.needsClarification) {
        clarificationCount += 1;
      }
    }

    return clarificationCount;
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

        if (
          message.metadata?.itemType === "practice" ||
          message.metadata?.task
        ) {
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
      return "theory";
    }

    const { practiceCount, theoryCount } = this.getInterviewItemStats(messages);

    if (practiceCount === 0) {
      return theoryCount < THEORY_QUESTIONS_BEFORE_FIRST_TASK
        ? "theory"
        : "practice";
    }

    const totalInterviewItems = practiceCount + theoryCount;
    const currentTheoryRatio =
      totalInterviewItems > 0 ? theoryCount / totalInterviewItems : 0;

    if (practiceCount >= 2 && currentTheoryRatio < 0.3) {
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
      normalizedTopic ? `Тема: ${normalizedTopic}.` : "Тема не указана.",
      "Первые шаги интервью должны быть теоретическими вопросами без задачи в редакторе.",
      `До первой практической задачи задай ${THEORY_QUESTIONS_BEFORE_FIRST_TASK} теоретических вопроса.`,
      "После теоретического блока выдай практическую задачу, связанную с обсужденными вопросами.",
      "Дальше держи баланс: около 30% теория, 70% практика.",
      `Предпочтительный следующий шаг: ${nextItemDescription}.`,
      preferredNextItemType === "theory"
        ? "Сейчас обязательно задай именно теоретический вопрос без starterCode и с task:null."
        : "Сейчас обязательно выдай практическую задачу с task.description, task.starterCode и task.editorLanguage.",
      "Теория: task:null, вопрос только в chatMessage.",
      "Практика: task с description, starterCode, editorLanguage.",
      "Если пользователь задаёт уточняющий вопрос, дай направление или 1-2 подсказки без нового вопроса, если он не нужен.",
      "Если есть код, оцени правильность, алгоритм, сложность, читаемость и крайние случаи.",
      "Если ответ на теорию принят, переходи к следующему теоретическому вопросу или к практической задаче по сценарию.",
      "Если практическая задача решена, выдай следующий вопрос или задачу.",
      "После слабого ответа дай задачу легче на другую тему, после хорошего - сложнее, после среднего - того же уровня.",
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
      "Поздоровайся как интервьюер и задай первый теоретический вопрос.",
      "Не выдавай практическую задачу в первом сообщении.",
      "Поле task обязательно должно быть null.",
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

  static buildForcedPracticeMessages({
    difficulty,
    programmingLanguage,
    topic,
    messages,
    changeTopic = false,
  }) {
    const normalizedTopic = topic?.trim();
    const history = this.normalizeMessages(messages).slice(-6);

    return [
      {
        role: "system",
        content: [
          "Ты технический интервьюер CodeArena.",
          `Уровень: ${difficulty}.`,
          `Язык: ${programmingLanguage}.`,

          normalizedTopic && !changeTopic
            ? `Тема: ${normalizedTopic}.`
            : "Выбери новую тему самостоятельно.",

          changeTopic
            ? "Пользователь НЕ справился с предыдущей задачей."
            : "Продолжи интервью.",

          changeTopic ? "НУЖНО полностью сменить тему." : "",

          changeTopic
            ? "Категорически запрещено повторять предыдущую задачу."
            : "",

          changeTopic
            ? "Категорически запрещено просить пользователя продолжить прошлую задачу."
            : "",

          changeTopic
            ? "Категорически запрещено упоминать прошлую задачу."
            : "",

          changeTopic ? "Новая задача должна быть проще предыдущей." : "",

          "Задача должна быть похожа на реальное техническое собеседование.",

          "Не давай готовое решение.",

          "Не проси пользователя предоставить попытку решения старой задачи.",

          "Верни только валидный JSON без markdown.",

          'Формат: {"chatMessage":"string","task":{"description":"string","starterCode":"string","editorLanguage":"string"},"review":null}.',
        ]
          .filter(Boolean)
          .join(" "),
      },

      ...history,

      {
        role: "user",
        content: changeTopic
          ? "Предыдущая задача провалена. Сгенерируй НОВУЮ задачу на ДРУГУЮ тему."
          : "Выдай следующую практическую задачу.",
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
    try {
      const answer = await getAnswer(messages);

      if (!answer) {
        throw new Error("AI не вернул текстовый ответ");
      }

      return String(answer).trim();
    } catch (error) {
      const providerError = error?.response?.data || error?.message || error;

      throw new Error(
        typeof providerError === "string"
          ? providerError
          : providerError?.message || "Ошибка запроса к AI",
        { cause: error },
      );
    }
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
    const {
      difficulty,
      programmingLanguage,
      topic,
      message,
      messages,
      code,
      clarificationCount = 0,
    } = payload;

    const history = this.normalizeMessages(messages);
    const normalizedMessage = typeof message === "string" ? message.trim() : "";

    const answer = await this.requestChat(client, [
      {
        role: "system",
        content: [
          "Ты помощник технического интервьюера CodeArena.",

          "Твоя задача — определить, хватает ли данных для продолжения интервью, проверки ответа пользователя или перехода к следующему этапу.",

          "Учитывай clarificationCount — сколько уточнений уже было задано по текущему заданию.",

          "Анализируй историю сообщений, код пользователя, предыдущие задачи и ответы.",

          "Если пользователь дал полностью неправильный ответ, не понимает решение, отвечает не по теме, прислал случайный текст, пустой ответ, или несколько раз подряд не может продвинуться по задаче — НЕ задавай уточняющие вопросы.",

          "Вместо этого нужно завершить текущую задачу и перейти к новой теме или новой задаче.",

          "Если пользователь явно застрял, ошибается концептуально или не может решить задачу после нескольких попыток — считай, что текущая задача провалена.",

          "Если clarificationCount >= 2 — больше НЕ задавай уточнений.",

          "Если пользователь не справился или clarificationCount >= 1, ответь строго JSON:",
          '{"needsClarification": false, "forceNextTask": true, "changeTopic": true}.',

          "Если данных достаточно для обычного продолжения интервью, проверки решения или генерации следующего вопроса — ответь строго JSON:",
          '{"needsClarification": false}.',

          "Если действительно нужны уточнения И clarificationCount < 2 И пользователь в целом движется в правильном направлении — ответь строго JSON:",
          '{"needsClarification": true, "clarificationQuestion": "..."}.',

          "Уточняющий вопрос должен:",
          "- быть коротким;",
          "- помогать пользователю двигаться дальше;",
          "- НЕ раскрывать решение;",
          "- НЕ содержать готовый код;",
          "- НЕ содержать полный алгоритм.",

          "Если в истории уже есть:",
          "- код пользователя;",
          "- решение;",
          "- теоретический ответ;",
          "- описание задачи;",
          "- попытка решения;",
          "то обычно данных уже достаточно и уточнения НЕ нужны.",

          "Никогда не пиши пояснения вне JSON.",

          "Никогда не используй markdown.",

          "Никогда не добавляй текст до или после JSON.",

          "Допустимы только 3 формата ответа:",

          '{"needsClarification": false}',

          '{"needsClarification": true, "clarificationQuestion": "..."}',

          '{"needsClarification": false, "forceNextTask": true, "changeTopic": true}',
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
          code: typeof code === "string" && code.trim() ? code.trim() : null,
          clarificationCount,
        }),
      },
    ]);

    return this.parseClarificationResponse(answer);
  }

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
    code,
    clarificationCount = null,
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
      const currentClarificationCount =
        typeof clarificationCount === "number"
          ? clarificationCount
          : this.getClarificationCount(messages);

      const clarificationDecision = await this.getClarificationDecision(
        client,
        {
          difficulty,
          programmingLanguage,
          topic,
          message,
          messages,
          code,
          clarificationCount: currentClarificationCount,
        },
      );

      if (
        clarificationDecision?.forceNextTask ||
        (clarificationDecision?.needsClarification &&
          currentClarificationCount >= MAX_CLARIFICATIONS_BEFORE_NEXT_TASK)
      ) {
        const practiceAnswer = await this.requestChat(
          client,
          this.buildForcedPracticeMessages({
            difficulty,
            programmingLanguage,
            topic,
            messages,
          }),
        );

        const practiceData = this.parseAiResponse(
          practiceAnswer,
          programmingLanguage,
        );

        const fallbackPracticeData = practiceData.metadata?.task
          ? practiceData
          : {
              ...practiceData,
              metadata: {
                ...(practiceData.metadata || {}),
                task: {
                  description: practiceData.answer,
                  starterCode: "// Напишите решение здесь",
                  editorLanguage: programmingLanguage,
                },
              },
            };

        return this.withInterviewItemType(
          {
            ...fallbackPracticeData,
            answer:
              "Идем дальше\n" +
              fallbackPracticeData.answer,
          },
          "practice",
        );
      }

      if (
        clarificationDecision?.needsClarification &&
        clarificationDecision?.clarificationQuestion
      ) {
        return {
          answer: clarificationDecision.clarificationQuestion,
          metadata: {
            needsClarification: true,
          },
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

    const lastHistoryMessage = normalizedMessages.at(-1);
    const shouldAppendCurrentMessage =
      normalizedMessage &&
      !(
        lastHistoryMessage?.role === "user" &&
        lastHistoryMessage.content === normalizedMessage
      );

    if (shouldAppendCurrentMessage) {
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

      const theoryData = this.parseAiResponse(
        theoryAnswer,
        programmingLanguage,
      );

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

    if (preferredNextItemType === "practice" && !aiData.metadata?.task) {
      const practiceAnswer = await this.requestChat(
        client,
        this.buildForcedPracticeMessages({
          difficulty,
          programmingLanguage,
          topic,
          messages,
        }),
      );

      const practiceData = this.parseAiResponse(
        practiceAnswer,
        programmingLanguage,
      );

      return this.withInterviewItemType(
        practiceData.metadata?.task
          ? practiceData
          : {
              ...practiceData,
              metadata: {
                ...(practiceData.metadata || {}),
                task: {
                  description: practiceData.answer,
                  starterCode: "// Напишите решение здесь",
                  editorLanguage: programmingLanguage,
                },
              },
            },
        "practice",
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
          "Структура ответа строго: 1. Итог. 2. Что получилось хорошо. 3. Что улучшить. Какие темы следует повторить",
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
