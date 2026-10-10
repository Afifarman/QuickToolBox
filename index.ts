import 'dotenv/config';
import { generateText } from 'ai';

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error(
      'Missing AI_GATEWAY_API_KEY. Add it to .env.local (never commit that file).',
    );
  }

  const { text } = await generateText({
    model: 'moonshotai/kimi-k3',
    prompt:
      'Invent a joyful new annual holiday. Give it a memorable name, explain its purpose, and describe three traditions people celebrate with.',
  });

  if (!text.trim()) {
    throw new Error('The model returned an empty response.');
  }

  console.log(text);
}

main().catch((error: unknown) => {
  // Do not print environment variables or request headers.
  console.error('AI Gateway example failed:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
});
