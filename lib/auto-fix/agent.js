import { Agent } from '@openai/agents';
import { tool } from '@openai/agents';
import { z } from 'zod';

const diagnosisSchema = z.object({
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum(['build', 'runtime', 'auth', 'tool', 'dependency', 'configuration', 'unknown']),
  summary: z.string(),
  likelyCause: z.string(),
  recommendedFix: z.string(),
  filesToInspect: z.array(z.string()),
});

export function createAutoFixAgent({ inspectRepository }) {
  const inspectRepoTool = tool({
    name: 'inspect_repository',
    description: 'Inspect a QuickToolBox repository file or directory before proposing a fix. Never modify production.',
    parameters: z.object({
      path: z.string().describe('Repository-relative path such as app/login/page.js or package.json'),
    }),
    execute: async ({ path }) => inspectRepository(path),
  });

  return new Agent({
    name: 'QuickToolBox Auto-Fix Agent',
    model: 'gpt-5.4',
    instructions: `You are the QuickToolBox software repair agent. Diagnose the supplied problem using the repository inspection tool before proposing changes. You may recommend a repair, but you must never deploy to production, modify main, expose secrets, or claim a fix is verified unless tests/build actually passed. Prefer the smallest safe change. Return concise JSON matching the diagnosis schema.`,
    tools: [inspectRepoTool],
    outputType: diagnosisSchema,
  });
}
