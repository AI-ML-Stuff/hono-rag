import {tool} from 'ai'
import {z} from 'zod'

import { Context } from 'hono'

export function getTestTools(ctx: Context) {
  return {
    testTool: tool({
      description: 'A tool to test the AI model tool use.',
      parameters: z.object({ 
        query: z.string().describe('The search query to find relevant documents') 
      }),
      execute: async ({query}) => {
        // For now, we'll just return a mock response
        console.log(`Executing test tool with query: ${query}`);
        return "Tested: " + query;
      }
    }),
  }
}