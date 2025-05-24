import { tool } from 'ai'
import { z } from 'zod'

import { Context } from 'hono'
type Note = {
  id: string;
  text: string;
}

export default function getNotesTools(c: Context) {
  return {
    retrieveNotes: tool({
      description: 'A tool to retrieve relevent notes from Vector index. It returns the relevent notes based on the search query.',
      parameters: z.object({ question: z.string().describe('The search query to find relevant documents') }),
      execute: async ({ question }) => {

        if (!c.env.AI || !c.env.VECTORIZE || !c.env.DB) {
          throw new Error("Required environment variables are not set.");
        }

        const embeddings = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: question })
        const vectors = embeddings.data[0]

        const vectorQuery = await c.env.VECTORIZE.query(vectors, { topK: 1 });
        console.log("Vector query results:", vectorQuery)
        const vecId = vectorQuery.matches[0]?.id

        let notes: string[] = []
        if (vecId) {
          const query = `SELECT * FROM notes WHERE id = ?`
          const { results } = await c.env.DB.prepare(query).bind(vecId).all()
          if (results) notes = results.map((note: Note) => note.text)
        }
        const contextMessage = notes.length
          ? `Context:\n${notes.map(note => `- ${note}`).join("\n")}`
          : ""

        return contextMessage
      }
    })
  }
}