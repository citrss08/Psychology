# Psychology SL — IB 2027 study notebook with Lin

An interactive digital notebook for IB Psychology SL (first assessment 2027): class-note study guides, research studies, exam practice, a searchable glossary, and **Lin**, an AI tutor that works from the notes on this site.

## What Lin does

| Feature | Where |
|---|---|
| **Context-aware tutor**: explains, simplifies, compares, gives examples, plans answers and explains why an answer is right or wrong. Before each answer, Lin retrieves the matching notes, key terms and studies from this site, cites them, and labels anything that goes beyond the notes. | Floating **Lin** panel (bottom-right), or the **Study with Lin** buttons inside every topic |
| **Flashcard repository**: generated from the site's notes, searchable, filterable by unit, grouped by topic. You can create, edit, delete, review (Leitner spaced repetition), export and import cards. | **Study Lab → Flashcards** |
| **Mock examinations**: Quick check, Paper 1 style or Paper 2 style questions generated from the notes, with a hidden mark scheme. Lin marks your answers and gives a mark, feedback, a model answer and improvements, then names your weak areas. | **Study Lab → Mock exams** |
| **Progress**: scores by unit, recurring weak areas (each with "Flashcards on this", "Explain with Lin" and "Open in notes"). Lin also uses your weak areas when tutoring and writing new exams. | **Study Lab → Progress** |

Lin can be **minimised** (–) to a small button or **hidden** (✕) completely. Reopen it with **Ask Lin** in the top bar or **Alt + L**.

Flashcards, exam attempts (including answers you're still writing) and chat history are saved in the browser's `localStorage`, so they're still there next session on the same browser. To move them to another device, use **Export** and **Import**.

## Setup: where your API key goes

Lin works with a **Google Gemini** key (`GEMINI_API_KEY`) or an **Anthropic Claude** key (`ANTHROPIC_API_KEY`). The key is read **only on the server**, from an environment variable. It is never sent to the browser or written into front-end code.

### Run locally

1. Copy `.env.example` to a new file called **`.env`** in the project root.
2. Open `.env` and paste your key after the equals sign on the line marked **HERE**:
   ```
   GEMINI_API_KEY=AIza...your key...
   ```
   You can get a Gemini key at <https://aistudio.google.com/apikey>. For Claude instead, set `ANTHROPIC_API_KEY=sk-ant-...`.
3. Start the server. It needs Node 18 or newer and has no dependencies to install:
   ```
   npm start
   ```
4. Open <http://localhost:3000>.

`.env` is listed in `.gitignore`, so your real key is never committed.

### Deploy on Vercel

1. Import the repository into Vercel and choose the `psychology-improved` branch. No build step is needed.
2. Go to **Project → Settings → Environment Variables** and add `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY`) with your key.
3. Redeploy. The static site is served as before, and `api/lin.js` becomes the `/api/lin` endpoint.

> GitHub Pages can only serve static files. The notebook still works there, but Lin needs a server (local or Vercel) to reach the AI. If no server is available, Lin shows a clear message instead of failing silently.

### Optional settings (`.env`)

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_MODEL` | `gemini-2.5-flash` | The Gemini model Lin uses. |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-5` | The Claude model Lin uses (when using a Claude key). |
| `LIN_PROVIDER` | automatic | `gemini` or `anthropic`, only needed if both keys are set. |
| `LIN_RATE_LIMIT` | `60` | Maximum AI requests per visitor IP every 10 minutes. This protects your API budget. |

## Project structure

```
index.html          page markup (notebook + Study Lab section + "Ask Lin" button)
styles.css          original notebook styles
content.js          ALL course content (notes, glossary, studies, practice, quiz):
                    shared by the website and by Lin's retrieval
script.js           notebook rendering (units, tabs, search, quiz, glossary)
lin.css / lin.js    Lin chat panel, topic integration, flashcards, mock exams, progress
api/lin.js          Vercel serverless endpoint  → POST /api/lin
server.js           local dev server (static files + /api/lin, loads .env)
server/lin-core.js  AI logic: tutoring, flashcard/exam generation, grading (Gemini or Claude)
server/retrieval.js BM25 search index over content.js (Lin's "read the notes" step)
.env.example        configuration template (copy to .env)
```

To change or add course content, edit `content.js`. The website and Lin both pick it up automatically.
