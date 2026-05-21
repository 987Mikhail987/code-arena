const { HumanMessage, SystemMessage } = require("@langchain/core/messages");
const { createReactAgent } = require("@langchain/langgraph/prebuilt");
const { GigaChat } = require("langchain-gigachat");
const { OpenRouter } = require("@openrouter/sdk");
const { Agent } = require("node:https");

const { fallbackTool } = require("../tools/fallbackTool");




const deepseek = new OpenRouter({
  apiKey: process.env.DEEPSEEK_API_KEY,
});


async function invokeDeepseek(messages){
const kekw = await deepseek.chat.send({
  chatRequest: {
    model: "deepseek/deepseek-v4-flash:free",
    messages: messages.map((message) => ({
      role: message.role === "ai" ? "assistant" : message.role,
      content: message.content,
    })),
  },
});
return getAnswerContent(kekw);
}

const httpsAgent = new Agent({
  rejectUnauthorized: false,
});

const agentTools = [fallbackTool];

const agentModel = new GigaChat({
  credentials: process.env.GIGACHAT_API_KEY,
  model: "GigaChat",
  httpsAgent,
});
const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function invokeOpenRouter(messages) {
  const result = await openrouter.chat.send({
    chatRequest: {
      model: "openai/gpt-oss-120b:free",
      messages: messages.map((message) => ({
        role: message.role === "ai" ? "assistant" : message.role,
        content: message.content,
      })),
    },
  });

  return result?.choices?.[0]?.message?.content?.trim() || "";
}

function normalizeMessages(messages = []) {
  return messages.map((message) => {
    if (message.role === "system") {
      return new SystemMessage(message.content);
    }

    return new HumanMessage(message.content);
  });
}

function getAnswerContent(result) {
  const lastMessage = result?.messages?.at(-1);

  if (typeof lastMessage?.content === "string") {
    return lastMessage.content.trim();
  }

  if (Array.isArray(lastMessage?.content)) {
    return lastMessage.content
      .map((item) => (typeof item?.text === "string" ? item.text : ""))
      .join(" ")
      .trim();
  }

  return "";
}

async function invokeAgent(llm, messages) {
  const result = await createReactAgent({
    llm,
    tools: agentTools,
  }).invoke({
    messages: normalizeMessages(messages),
  });

  return getAnswerContent(result);
}

async function getAnswer(messages) {

  
  try {
    const answerGiga = await invokeAgent(agentModel, messages);
    if (answerGiga) {
      return answerGiga;
    }
  } catch (error) {
    console.log(error);
  }
try {
  const answer = await invokeDeepseek(messages);
  if (answer) {
    return answer;
  }
} catch (error) {
  console.log(error);
}
  try {
    const answerOpen = await invokeOpenRouter(messages);
    if (answerOpen) {
      return answerOpen;
    }
  } catch {

    return fallbackTool.invoke({});
  }
}

module.exports = {
  getAnswer,
};
