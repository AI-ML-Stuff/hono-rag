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
import { RAG_SYSTEM_PROMPT_WITH_TOOLS } from "./prompts/rag-prompts";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(logger())
app.use(cors())

app.post("/message", async (c) => {
  try {
  const groq = createGroq({apiKey: c.env.GROQ_API_KEY})
  const model = groq('llama-3.3-70b-versatile')
  const body = await c.req.json();
  const query = body.query || 'What is the Bebababo?'
  const testTools = getTestTools(c)
  const weatherTools = getWeatherTools(c)
  console.log('Query:', query)
  const result= await generateText({
    model: model,
    messages: [
      { role: 'system', content: RAG_SYSTEM_PROMPT_WITH_TOOLS },
      { role: 'user', content: query },
    ],
    tools: {...testTools, ...weatherTools},
    maxSteps: 5,
  })
  console.log(result)

  return c.json(result)
}catch (error) {  
  console.error('Error in /message route:', error);
  return c.json({ error: `An error occurred while processing your request. ${error}` }, 500); 
}
});

app.post("/stream", async (c) => {
  const groq = createGroq({apiKey: c.env.GROQ_API_KEY})
  const model = groq('llama-3.3-70b-versatile')
  const body = await c.req.json();
  const query = body.query || 'What is the Bebababo?'
  const testTools = getTestTools(c)
  const weatherTools = getWeatherTools(c)
  console.log('Query:', query)
  const result= streamText({
    model: model,
    messages: [
      { role: 'system', content: RAG_SYSTEM_PROMPT_WITH_TOOLS },
      { role: 'user', content: query },
    ],
    tools: {...testTools, ...weatherTools},
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

export default app;
