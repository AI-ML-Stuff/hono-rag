demo ur: rag-demo.keshab.co.in

```txt
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

npx wrangler d1 execute rag-knowledge-db --remote --command "CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, text TEXT NOT NULL)"
npx wrangler d1 execute rag-knowledge-db --command "CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, text TEXT NOT NULL)"

npx wrangler d1 execute rag-knowledge-db --remote --command "INSERT INTO notes (text) VALUES ('The best pizza topping is pepperoni')"
