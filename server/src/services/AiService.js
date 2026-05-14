const { GigaChat } = require("gigachat");
const { Agent } = require("node:https");

class AiService {
  static async generateAnswer(promt) {
    const { content, type, level } = promt;

    const httpsAgent = new Agent({
      rejectUnauthorized: false,
    });

    const client = new GigaChat({
      model: "GigaChat",
      credentials: process.env.GIGACHAT_API_KEY,
      httpsAgent: httpsAgent,
    });

    const response = await client.chat({
      messages: [
        {
          role: "system",
          content: `Ты — API-сервер, для разработчиков. Запрос типа:${type} и уровень пользователя: ${level}Твой ответ должен содержать ТОЛЬКО валидный JSON. Запрещено писать любой текст до или после JSON.Структура ответа: {"problem": "...", "solution": "...", "explanation": "..."} и проследи за форматированием, что бы json, корректно парсился через JSON.PARSE. Проверь ТРИ раза и если надо сделай валидный JSON файл и удаляй "" вначале и в конце файла, так же следи за тем чтобы: специальные символы экранировались `,
        },
        {
          role: "user",
          content: `Задача: ${content}`,
        },
      ],
    });

    const jsonString = response.choices[0].message.content
      .trim()
      .replace(/^.*?(\{.*\}).*$/, "$1");

    const answer = JSON.parse(jsonString);
    //сделать проверку для валидации ответа с помощью библиотеки zod 
    //в случае некорректного ответа, повторный запрос или дефолтный ответ. 
    return answer;
  }
}
module.exports = AiService;
