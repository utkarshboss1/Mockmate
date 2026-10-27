import { groq, GROQ_MODEL } from '../../lib/groq';
import type { AIProvider } from './ai-provider';

export class GroqAIProvider implements AIProvider {
  async completeJSON(prompt: string, temperature: number): Promise<string> {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: GROQ_MODEL,
      temperature,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Groq returned an empty response');
    return content;
  }
}
