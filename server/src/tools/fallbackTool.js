const { tool } = require("@langchain/core/tools");

const fallbackTool = tool(
  async () => {
    return `Ошибка подключения к Ai сервису`;
  },
  {
    name: "fallback_tool",
    description: "Используется, если нет данных от Ai",
  },
);

module.exports = {
  fallbackTool,
};
