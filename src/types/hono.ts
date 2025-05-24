import type {
  Hono,
  Context as HonoContext,
  MiddlewareHandler as HonoMiddlewareHandler,
} from "hono";

export interface Env {
  ASSETS: Fetcher;
  GROQ_API_KEY: string;
  VECTORIZE_INDEX: Vectorize;
  DB: D1Database;
}

export type Variables = Record<string, string>;

export type App = Hono<{ Bindings: Env; Variables: Variables }>;

export type MiddlewareHandler = HonoMiddlewareHandler<{
  Bindings: Env;
  Variables: Variables;
}>;
export type Context = HonoContext<{ Bindings: Env; Variables: Variables }>;
export type Next = () => Promise<void>;




// Define the document schema for D1
export interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding: number[];
}


// Define VectorizeDB match type
export interface VectorizeMatch {
  id: string;
  score: number;
}

// Define VectorizeDB query response type
export interface VectorizeQueryResponse {
  matches: VectorizeMatch[];
}