import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { generateText, streamText, tool } from "ai";
import z from "zod";
import { createWorkersAI } from "workers-ai-provider";
import { createGroq } from '@ai-sdk/groq';
// import { retrieverTool } from "./tools/retriever-tool";
import { getTestTools } from "./tools/test-tool";
import { getWeatherTools } from "./tools/weather-tool";
import getNotesTools from "./tools/notes-tools";
export { RAGWorkflow } from "./workflows/RAG-Workflow";
import { RAG_SYSTEM_PROMPT_WITH_TOOLS } from "./prompts/rag-prompts";

const app = new Hono<{ Bindings: CloudflareBindings }>();

export const customLogger = (message: string, ...rest: string[]) => {
  console.log(message, ...rest)
}

app.use(logger(customLogger))
app.use(cors())

app.post("/message", async (c) => {
  try {
    const groq = createGroq({ apiKey: c.env.GROQ_API_KEY })
    const model = groq('llama-3.3-70b-versatile')
    const body = await c.req.json();
    const query = body.query || 'What is the Bebababo?'
    const testTools = getTestTools(c)
    const weatherTools = getWeatherTools(c)
    console.log('Query:', query)
    const result = await generateText({
      model: model,
      messages: [
        { role: 'system', content: RAG_SYSTEM_PROMPT_WITH_TOOLS },
        { role: 'user', content: query },
      ],
      tools: { ...testTools, ...weatherTools },
      maxSteps: 5,
    })
    console.log(result)

    return c.json(result)
  } catch (error) {
    console.error('Error in /message route:', error);
    return c.json({ error: `An error occurred while processing your request. ${error}` }, 500);
  }
});

app.post("/stream", async (c) => {
  const groq = createGroq({ apiKey: c.env.GROQ_API_KEY })
  const model = groq('llama-3.3-70b-versatile')
  const body = await c.req.json();
  const query = body.query || 'What is the Bebababo?'
  const testTools = getTestTools(c)
  const weatherTools = getWeatherTools(c)
  console.log('Query:', query)
  const result = streamText({
    model: model,
    system: RAG_SYSTEM_PROMPT_WITH_TOOLS,
    messages: [
      { role: 'user', content: query },
    ],
    tools: { ...testTools, ...weatherTools },
    maxSteps: 5,
    toolCallStreaming: true,
  })

  return result.toDataStreamResponse({
    headers: {
      "Content-Type": "text/x-unknown",
      "content-encoding": "identity",
      "transfer-encoding": "chunked",
    },
  });
});


//###########################  Notes API  ####################################
app.get("/notes", async (c) => {
  const question = c.req.query('text')
  console.log("Question:", question);
  if (!question) return c.text("Missing question", 400);
  const workersai = createWorkersAI({ binding: c.env.AI });
  const model = workersai('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    safePrompt: true,
  });
  const notesTools = getNotesTools(c)

  const result = streamText({
    model: model,
    system: 'You are an AI assistant that answers questions based on a database of notes. You have access to notes retriver tool. If you do not know the answer, say "I do not know". Dont mention the tool in your answer.',
    messages: [
      { role: 'user', content: question },
    ],
    tools: {...notesTools},
    toolCallStreaming: true,
    toolChoice: 'required',
    maxSteps: 5,
  })
  return result.toDataStreamResponse({
    headers: {
      "Content-Type": "text/x-unknown",
      "content-encoding": "identity",
      "transfer-encoding": "chunked",
    },
  });
})


app.post("/notes", async (c) => {
  const { text } = await c.req.json();
  customLogger("Creating note:", text);
  if (!text) return c.text("Missing text", 400);
  await c.env.RAG_WORKFLOW.create({ params: { text } });
  return c.text("Created note", 201);
});


export default app;
