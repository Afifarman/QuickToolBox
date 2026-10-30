import { NextResponse } from 'next/server';
import { getClientKey, rateLimit } from '../../../lib/security/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MODEL_PREFERENCE = process.env.GEMINI_AGENT_MODEL || process.env.GEMINI_MODEL || '';
const MAX_MESSAGE = 6000;
const MAX_TURNS = 4;
const SYSTEM_INSTRUCTION = `You are QuickToolBox Agent, a helpful bilingual (Bangla/English) assistant.
Understand the user's goal, make a short plan for multi-step requests, and use the available functions when useful.
Never claim you changed files, deployed code, accessed accounts, edited an image, sent a message, or performed an external action unless a provided tool actually did it.
The available tools are limited to planning and text assistance; they cannot modify accounts or files.
If a request needs a website feature not listed in the catalog, explain the limitation honestly.
Use the same language as the user where practical. Keep answers clear and actionable.`;

const functionDeclarations = [
  {
    name: 'create_task_plan',
    description: 'Break a user goal into an ordered, practical plan. Use for multi-step tasks.',
    parameters: {
      type: 'OBJECT',
      properties: {
        goal: { type: 'STRING', description: 'The goal to accomplish' },
        constraints: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Known constraints or preferences' },
      },
      required: ['goal'],
    },
  },
  {
    name: 'create_checklist',
    description: 'Create a concise checklist for a task.',
    parameters: {
      type: 'OBJECT',
      properties: {
        task: { type: 'STRING', description: 'Task to make a checklist for' },
        count: { type: 'INTEGER', description: 'Desired number of checklist items, 3 to 10' },
      },
      required: ['task'],
    },
  },
  {
    name: 'summarize_text',
    description: 'Summarize user-provided text into key points. Use only text provided in the arguments.',
    parameters: {
      type: 'OBJECT',
      properties: {
        text: { type: 'STRING', description: 'Text to summarize' },
      },
      required: ['text'],
    },
  },
  {
    name: 'explain_concept',
    description: 'Create a simple explanation of a concept for a learner.',
    parameters: {
      type: 'OBJECT',
      properties: {
        concept: { type: 'STRING', description: 'Concept to explain' },
        level: { type: 'STRING', description: 'Audience level, such as beginner or diploma student' },
      },
      required: ['concept'],
    },
  },
  {
    name: 'list_quicktoolbox_tools',
    description: 'List the known QuickToolBox tool categories and describe what the agent can help with. Do not claim this is a live scan.',
    parameters: { type: 'OBJECT', properties: {} },
  },
];

function runTool(name, args = {}) {
  if (name === 'create_task_plan') {
    const goal = String(args.goal || 'Complete the requested task').slice(0, 500);
    const constraints = Array.isArray(args.constraints) ? args.constraints.slice(0, 8).map((x) => String(x).slice(0, 180)) : [];
    return {
      goal,
      steps: [
        'Confirm the expected result and constraints.',
        'Break the goal into small, verifiable steps.',
        'Complete the first step and check its result.',
        'Continue step by step, handling errors before proceeding.',
        'Verify the final outcome and summarize what was actually completed.',
      ],
      constraints,
      note: 'This is a plan only; no external action was performed.',
    };
  }
  if (name === 'create_checklist') {
    const count = Math.max(3, Math.min(10, Number(args.count) || 5));
    const items = [
      'Define the expected result.',
      'Check prerequisites and available resources.',
      'Complete the task in small steps.',
      'Verify the result against the original goal.',
      'Handle errors and retry safely if needed.',
      'Review security and privacy implications.',
      'Record what is completed and what remains.',
      'Test with a realistic example.',
      'Check accessibility and mobile usability.',
      'Document any follow-up work.',
    ];
    return { task: String(args.task || 'Requested task').slice(0, 300), checklist: items.slice(0, count) };
  }
  if (name === 'summarize_text') {
    const text = String(args.text || '').slice(0, 5000);
    const sentences = text.split(/(?<=[.!?।])\s+/).filter(Boolean);
    return { summary: sentences.slice(0, Math.min(5, Math.max(2, Math.ceil(sentences.length / 3)))).join(' ') || text };
  }
  if (name === 'explain_concept') {
    return {
      concept: String(args.concept || '').slice(0, 300),
      audience: String(args.level || 'beginner').slice(0, 100),
      instruction: 'Explain the concept in plain language, define key terms, give one practical example, and finish with two review questions.',
    };
  }
  if (name === 'list_quicktoolbox_tools') {
    return {
      tools: [
        { name: 'AI Assistant', path: '/ai', capability: 'Text generation, rewriting and summarizing through configured AI providers' },
        { name: 'AI Prompts', path: '/ai-prompts', capability: 'Help compose prompts' },
        { name: 'AI Photo Editor', path: '/ai-photo-editor', capability: 'Image editing flow, subject to provider/API availability' },
        { name: 'Student Tools', path: '/student-tools', capability: 'Study support tools' },
        { name: 'CV Maker', path: '/cv-maker', capability: 'CV/resume creation' },
      ],
      limitation: 'This is a static known list, not a live health check of each page or API.',
    };
  }
  throw new Error('Unsupported tool');
}

async function discoverAgentModels(key) {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', {
    headers: { 'x-goog-api-key': key.trim() },
    signal: AbortSignal.timeout(8000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(response.status === 429
      ? 'Gemini quota/rate limit reached. Please wait and retry.'
      : 'Could not verify available Gemini models for this API key.');
    error.status = response.status === 429 ? 429 : 502;
    throw error;
  }
  const available = (data.models || [])
    .filter(model => Array.isArray(model.supportedGenerationMethods) && model.supportedGenerationMethods.includes('generateContent'))
    .map(model => String(model.name || '').replace(/^models\\//, ''))
    .filter(name => /flash/i.test(name) && !/image|audio|tts|embedding|live|robotics/i.test(name));
  const preferred = MODEL_PREFERENCE && available.includes(MODEL_PREFERENCE) ? [MODEL_PREFERENCE] : [];
  return [...new Set([...preferred, ...available.filter(name => !/preview|experimental|latest/i.test(name)), ...available])].slice(0, 3);
}

async function callGemini(contents, key, model) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key.trim() },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents,
        tools: [{ functionDeclarations }],
        toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
        generationConfig: { temperature: 0.35, maxOutputTokens: 1200 },
      }),
      signal: AbortSignal.timeout(18000),
    },
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const status = response.status;
    const message = status === 429
      ? 'AI provider quota/rate limit reached. Please wait and try again.'
      : status === 401 || status === 403
        ? 'Gemini API key is invalid or does not have access to this model.'
        : 'AI provider is temporarily unavailable. Check the API key, model access and provider quota.';
    const error = new Error(message);
    error.status = status === 429 ? 429 : status === 404 || status === 400 ? 404 : 502;
    throw error;
  }
  return data;
}

export async function GET() {
  const configured = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY);
  return NextResponse.json({ ok: true, configured, model: MODEL_PREFERENCE || 'auto-discovery', tools: functionDeclarations.map(({ name, description }) => ({ name, description })) });
}

export async function POST(request) {
  const limit = rateLimit(getClientKey(request, 'ai-agent'), { limit: 12, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'অনেক বেশি অনুরোধ হয়েছে। কয়েক মিনিট পরে আবার চেষ্টা করুন।' }, {
      status: 429,
      headers: { 'Retry-After': String(limit.retryAfter) },
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const message = String(body?.message || '').trim();
    if (!message) return NextResponse.json({ error: 'একটি প্রশ্ন বা কাজ লিখুন।' }, { status: 400 });
    if (message.length > MAX_MESSAGE) return NextResponse.json({ error: 'বার্তাটি ৬,০০০ অক্ষরের মধ্যে রাখুন।' }, { status: 413 });

    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!key) return NextResponse.json({ error: 'AI Agent চালু নেই: Vercel Environment Variables-এ GEMINI_API_KEY যোগ করে নতুন deployment করতে হবে।' }, { status: 503 });

    const models = await discoverAgentModels(key);
    if (!models.length) return NextResponse.json({ error: 'এই API Key-তে Tool Calling সমর্থিত Gemini Flash model পাওয়া যায়নি।' }, { status: 503 });
    const contents = [{ role: 'user', parts: [{ text: message }] }];
    const toolsUsed = [];
    let selectedModel = models[0];

    for (let turn = 0; turn < MAX_TURNS; turn += 1) {
      let data;
      try { data = await callGemini(contents, key, selectedModel); }
      catch (modelError) {
        if (modelError?.status === 404 && models.length > 1) {
          selectedModel = models[1];
          data = await callGemini(contents, key, selectedModel);
        } else throw modelError;
      }
      const candidate = data?.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      if (!parts.length) throw new Error('AI provider returned an empty response.');

      const functionCalls = parts.filter((part) => part.functionCall?.name);
      if (!functionCalls.length) {
        const text = parts.map((part) => part.text || '').filter(Boolean).join('\n').trim();
        if (!text) throw new Error('AI provider did not return usable text.');
        return NextResponse.json({ ok: true, text, model: selectedModel, toolsUsed });
      }

      contents.push({ role: 'model', parts });
      const functionResponses = [];
      for (const part of functionCalls) {
        const { name, args } = part.functionCall;
        const result = runTool(name, args || {});
        toolsUsed.push(name);
        functionResponses.push({ functionResponse: { name, response: { result } } });
      }
      contents.push({ role: 'user', parts: functionResponses });
    }

    const finalData = await callGemini(contents, key, selectedModel);
    const finalParts = finalData?.candidates?.[0]?.content?.parts || [];
    const finalText = finalParts.map((part) => part.text || '').filter(Boolean).join('\n').trim();
    if (!finalText) throw new Error('Agent reached its tool-step limit before producing a final answer.');
    return NextResponse.json({ ok: true, text: finalText, model: selectedModel, toolsUsed, note: 'Tool-step limit reached.' });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      return NextResponse.json({ error: 'AI Agent-এর উত্তর পেতে বেশি সময় লাগছে। আবার চেষ্টা করুন।' }, { status: 504 });
    }
    const status = Number(error?.status) || 502;
    console.error('[QuickToolBox Agent] Request failed:', { status, name: error?.name || 'Error' });
    return NextResponse.json({ error: error?.message || 'AI Agent আপাতত উত্তর দিতে পারছে না। আবার চেষ্টা করুন।' }, { status });
  }
}
