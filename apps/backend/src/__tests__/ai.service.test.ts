import { afterEach, describe, expect, it, vi } from 'vitest';
import { InterviewType } from '@interviewiq/shared';
import { AIService } from '../modules/ai/ai.service';
import { AIProvider } from '../infrastructure/ai/ai-provider';

vi.hoisted(() => {
  process.env.STORAGE_MODE = 'memory';
});

afterEach(() => vi.restoreAllMocks());

describe('AIService provider output handling', () => {
  it('validates model output against the scorecard schema', async () => {
    const provider = {
      completeJSON: vi.fn().mockResolvedValue(
        JSON.stringify({
          professionalSummary: 'Clear, structured problem solving.',
          strengths: ['Explains tradeoffs'],
          weaknesses: ['Could test edge cases earlier'],
          learningRecommendations: ['Practice boundary-value testing'],
        }),
      ),
    } satisfies AIProvider;
    const service = new AIService(provider);

    const result = await service.polishFeedback({
      rawNotes: 'The candidate explained a solution and tested several cases.',
      interviewType: InterviewType.TECHNICAL_CODING,
    });

    expect(result).toEqual({
      professionalSummary: 'Clear, structured problem solving.',
      strengths: ['Explains tradeoffs'],
      weaknesses: ['Could test edge cases earlier'],
      learningRecommendations: ['Practice boundary-value testing'],
    });
  });

  it('returns a deterministic scorecard fallback when model output is invalid', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const service = new AIService({ completeJSON: vi.fn().mockResolvedValue('{"strengths":[]}') });

    const result = await service.polishFeedback({
      rawNotes: 'The candidate explained a solution and tested several cases.',
      interviewType: InterviewType.TECHNICAL_CODING,
    });

    expect(result).toMatchObject({ usedFallback: true });
    expect(result.professionalSummary).toContain('The candidate explained a solution');
  });
});
