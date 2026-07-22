export const clients = ['Claude CLI', 'Codex', 'Cursor', 'Continue', 'Cline', 'Roo Code']

export const features = [
  { eyebrow: '01', title: 'One gateway, every model', text: 'Connect GPT, Claude, Gemini, local runners, and private endpoints behind a single OpenAI-style interface.' },
  { eyebrow: '02', title: 'Made for long agent runs', text: 'Reliable routing, retries, traces, and budgets help coding agents keep moving without surprise spend.' },
  { eyebrow: '03', title: 'Usage you can actually read', text: 'Track tokens, teams, keys, and workspace limits with clear credit lines before billing becomes a mystery.' },
]

export const modelCards = [
  { label: 'ANTHROPIC', mark: 'A', title: 'Claude without key juggling', chips: ['Opus route', 'Sonnet route', 'Haiku route'], text: 'Use native-style messages support through Kiwi, then swap model tiers without changing your client setup.' },
  { label: 'OPENAI', mark: 'O', title: 'GPT and Codex in one lane', chips: ['Llama live', 'mini tiers', 'Codex ready'], text: 'Keep OpenAI-compatible chat completions, token-aware usage, and reasoning model access behind one Kiwi endpoint.' },
  { label: 'EDITORS & CLIS', mark: 'K', title: 'Wire once, work anywhere', chips: ['Cursor', 'Roo Code', 'Cline', 'Continue'], text: 'Add your Kiwi key as a custom provider in the tools you already use. Same base URL, same team budget, every model.' },
]

export const aboutCards = [
  { title: 'What it is', text: 'Kiwi LLM is a model gateway that brings hosted LLMs, custom providers, and private backends behind one OpenAI-compatible endpoint.' },
  { title: 'How it works', text: 'Create a Kiwi key, choose your routes, and send requests as usual. Kiwi handles provider auth, model selection, token usage, and credits.' },
  { title: 'Who it is for', text: 'Builders using Codex, Claude CLI, Cursor, Cline, and internal tools who want every model available without managing a pile of vendor keys.' },
]

export const docExamples = [
  { title: 'Claude CLI', note: 'Messages route compatible', code: ['export ANTHROPIC_API_KEY=Kiwi_••••', 'export ANTHROPIC_BASE_URL=https://api.kiwillm.in/v1', 'claude "review this pull request"'] },
  { title: 'OpenAI SDK', note: 'OpenAI-compatible route', code: ['from openai import OpenAI', 'client = OpenAI(', '  api_key="Kiwi_••••",', '  base_url="https://api.kiwillm.in/v1"', ')', 'client.chat.completions.create(model="llama-3.2-1b")'] },
  { title: 'Cursor / Roo / Cline', note: 'Use as a custom provider', code: ['Provider:  OpenAI Compatible', 'Base URL:  https://api.kiwillm.in/v1', 'API Key:   Kiwi_••••', 'Model:     llama-3.2-1b or any live model'] },
  { title: 'Codex CLI', note: 'Chat completions endpoint', code: ['export OPENAI_API_KEY=Kiwi_••••', 'export OPENAI_BASE_URL=https://api.kiwillm.in/v1', 'codex "scaffold a fastapi service"'] },
]

export const docFeatures = [
  { title: 'OpenAI-compatible', text: 'Use chat completions and messages-style routes through one authenticated Kiwi endpoint.' },
  { title: 'Route-level model control', text: 'Pin a key to a preferred model, or leave it open so any supported model id can pass through Kiwi.' },
  { title: 'Live credit tracking', text: 'Meter input and output tokens per request, then watch team spend update without waiting for invoices.' },
  { title: 'Team invite credits', text: 'Issue redeemable workspace codes, gift balances, and onboarding credits for new builders or teams.' },
  { title: 'Drop-in IDE support', text: 'Paste one base URL and one API key into Cursor, Roo Code, Cline, Continue, or your own internal client.' },
  { title: 'No provider lock-in', text: 'Change upstream vendors, pricing rules, or fallback models server-side while your app keeps the same endpoint.' },
]

export const pricingPlans = [
  { price: '$5', name: 'Starter', credits: '$50 Credits' },
  { price: '$10', name: 'Pro', credits: '$100 Credits' },
  { price: '$20', name: 'Ultra', credits: '$250 Credits' },
  { price: '$30', name: 'Max', credits: '$500 Credits', badge: 'BEST VALUE' },
]

export const footerColumns = [
  { title: 'Products', links: [{ label: 'Pricing', href: '/top-up' }, { label: 'AI Models', href: '/models' }, { label: 'Documentation', href: '/docs' }, { label: 'Support', href: '/support' }, { label: 'Status', href: '/status' }, { label: 'Changelog', href: '/changelog' }] },
  { title: 'Contact', links: [{ label: 'Contact Us', href: '/contact' }, { label: 'Email Support', href: 'mailto:support@kiwillm.in' }] },
  { title: 'Programs', links: [{ label: 'Creator Program', href: '/creator-program' }] },
  { title: 'Company', links: [{ label: 'Blogs', href: '/blog' }, { label: 'Refund Policy', href: '/refund-policy' }, { label: 'Privacy Policy', href: '/privacy' }, { label: 'Terms & Conditions', href: '/terms' }, { label: 'Cookie Policy', href: '/cookie-policy' }, { label: 'Acceptable Use', href: '/acceptable-use' }] },
  { title: 'Social', links: [{ label: 'Telegram', href: 'https://t.me/kiwillm' }, { label: 'Discord', href: 'https://discord.gg/RCZXtvyByj' }, { label: 'Twitter', href: 'https://x.com/KIWILLM' }, { label: 'GitHub', href: '/github' }] },
]

export const pageLinks = [
  { label: '🎁 Spin & Earn ($1000 Prize)', href: '/invite', badge: true },
  { label: 'Docs', href: '/docs' },
  { label: 'Models', href: '/models' },
  { label: 'Top up', href: '/top-up' },
]

export const dashboardPlaceholders = ['Credit balance', 'Requests', 'Tokens', 'Credits used']

export const topUpPlans = [
  { price: '$5', name: 'Starter Pack', credits: '$50 Credits', bonus: '10x Value Bonus' },
  { price: '$10', name: 'Pro Pack', credits: '$100 Credits', bonus: '10x Value Bonus' },
  { price: '$20', name: 'Ultra Pack', credits: '$250 Credits', bonus: '12.5x Value Bonus' },
  { price: '$30', name: 'Max Pack', credits: '$500 Credits', bonus: '16.6x Best Value' },
]

export const modelFilters = ['All', 'Text', 'Code', 'Reasoning', 'Image', 'Video']

export const docsCodeBlocks = [
  { section: 'Quick test', title: 'OPENAI-STYLE REQUEST', code: `curl https://api.kiwillm.in/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_KIWI_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "llama-3.2-1b",
    "messages": [{"role":"user","content":"hello"}]
  }'` },
  { section: 'Quick test', title: 'ANTHROPIC-STYLE REQUEST', code: `curl https://api.kiwillm.in/v1/messages \\
  -H "x-api-key: YOUR_KIWI_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet P1",
    "max_tokens": 256,
    "messages": [{"role":"user","content":"hello"}]
  }'` },
  { section: 'Quick test', title: 'LIST MODELS', code: 'curl https://api.kiwillm.in/v1/models -H "Authorization: Bearer YOUR_KIWI_KEY"' },
  { section: 'Images', title: 'CURL', code: `curl https://api.kiwillm.in/v1/images/generations \\
  -H "Authorization: Bearer YOUR_KIWI_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "flux",
    "prompt": "a luminous kiwi dashboard floating in deep space",
    "n": 1,
    "size": "1024x1024"
  }'` },
  { section: 'Images', title: 'NODE / TYPESCRIPT', code: `import OpenAI from "openai";\n\nconst client = new OpenAI({\n  apiKey: "YOUR_KIWI_KEY",\n  baseURL: "https://api.kiwillm.in/v1",\n});\n\nconst image = await client.images.generate({\n  model: "flux",\n  prompt: "a luminous kiwi dashboard floating in deep space",\n  n: 1,\n  size: "1024x1024",\n});\n\nconsole.log(image.data?.[0]?.url);` },
  { section: 'Video', title: 'CURL', code: `curl https://api.kiwillm.in/v1/video/generations \\
  -H "Authorization: Bearer YOUR_KIWI_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "sora",
    "prompt": "a slow dolly shot through a neon server room",
    "n": 1
  }'` },
  { section: 'Video', title: 'JAVASCRIPT FETCH', code: `const res = await fetch("https://api.kiwillm.in/v1/video/generations", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer YOUR_KIWI_KEY",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({\n    model: "sora",\n    prompt: "a slow dolly shot through a neon server room",\n    n: 1,\n  }),\n});\n\nconst video = await res.json();\nconsole.log(video.data?.[0]?.url ?? video);` },
  { section: 'Claude', title: 'MACOS / LINUX', code: `export ANTHROPIC_BASE_URL="https://api.kiwillm.in/v1"\nexport ANTHROPIC_API_KEY="YOUR_KIWI_KEY"\nexport ANTHROPIC_MODEL="claude-sonnet P1"\n\nclaude "explain this repository"` },
  { section: 'Claude', title: 'WINDOWS POWERSHELL', code: `$env:ANTHROPIC_BASE_URL = "https://api.kiwillm.in/v1"\n$env:ANTHROPIC_API_KEY = "YOUR_KIWI_KEY"\n$env:ANTHROPIC_MODEL = "claude-sonnet P1"\n\nclaude "hello"` },
  { section: 'Aider', title: 'ANTHROPIC MODE', code: `export ANTHROPIC_API_KEY="YOUR_KIWI_KEY"\nexport ANTHROPIC_API_BASE="https://api.kiwillm.in/v1"\naider --model anthropic/claude-sonnet P1` },
  { section: 'Aider', title: 'OPENAI MODE', code: `export OPENAI_API_KEY="YOUR_KIWI_KEY"\nexport OPENAI_API_BASE="https://api.kiwillm.in/v1"\naider --model openai/llama-3.2-1b` },
  { section: 'Continue', title: 'CONFIG.JSON', code: `{\n  "models": [\n    {\n      "title": "Kiwi - Coding Agent",\n      "provider": "openai",\n      "model": "llama-3.2-1b",\n      "apiBase": "https://api.kiwillm.in/v1",\n      "apiKey": "YOUR_KIWI_KEY"\n    }\n  ]\n}` },
  { section: 'SDK', title: 'PYTHON', code: `from openai import OpenAI\n\nclient = OpenAI(\n    api_key="YOUR_KIWI_KEY",\n    base_url="https://api.kiwillm.in/v1",\n)\n\nresp = client.chat.completions.create(\n    model="llama-3.2-1b",\n    messages=[{"role": "user", "content": "hi"}],\n)\nprint(resp.choices[0].message.content)` },
  { section: 'SDK', title: 'NODE / TYPESCRIPT', code: `import OpenAI from "openai";\n\nconst client = new OpenAI({\n  apiKey: "YOUR_KIWI_KEY",\n  baseURL: "https://api.kiwillm.in/v1",\n});\n\nconst r = await client.chat.completions.create({\n  model: "llama-3.2-1b",\n  messages: [{ role: "user", content: "hi" }],\n});\nconsole.log(r.choices[0].message.content);` },
]
