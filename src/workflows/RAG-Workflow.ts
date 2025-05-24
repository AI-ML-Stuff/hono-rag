import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
interface Env {
  GROQ_API_KEY: string;
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  AI: Ai;
  ASSETS: Fetcher;
  RAG_WORKFLOW: Workflow;
}

type Note = {
  id: string;
  text: string;
}

type Params = {
  text: string;
};

export class RAGWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const env = this.env
    const { text } = event.payload;
    console.log("RAGWorkflow started with text:", text)
    let texts: string[] = [text]

    texts = await step.do('split text', async () => {
      const splitter = new RecursiveCharacterTextSplitter({
        // These can be customized to change the chunking size
        chunkSize: 1000,
        chunkOverlap: 300,
      });
      const output = await splitter.createDocuments([text]);
      return output.map(doc => doc.pageContent);
    })

    console.log("RecursiveCharacterTextSplitter generated ${texts.length} chunks")

    for (const index in texts) {
      const text = texts[index]
      const record = await step.do(`create database record: ${index}/${texts.length}`, async () => {
        const query = "INSERT INTO notes (text) VALUES (?) RETURNING *"

        const { results } = await env.DB.prepare(query)
          .bind(text)
          .run<Note>()

        const record = results[0]
        if (!record) throw new Error("Failed to create note")
        return record;
      })

      const embedding = await step.do(`generate embedding: ${index}/${texts.length}`, async () => {
        const embeddings = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: text })
        const values = embeddings.data[0]
        if (!values) throw new Error("Failed to generate vector embedding")
        return values
      })

      await step.do(`insert vector: ${index}/${texts.length}`, async () => {
        return env.VECTORIZE.upsert([
          {
            id: record.id.toString(),
            values: embedding,
          }
        ]);
      })
    }
  }
}