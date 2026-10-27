// ============================================================
// ai.service.ts — AI Business Logic Layer (Groq LLaMA 3.3 70B)
// ============================================================

import {
  PolishFeedbackInput,
  PrepAdvisorInput,
  polishedFeedbackOutputSchema,
  prepAdvisorOutputSchema,
} from './ai.validator';
import { prisma } from '../../lib/prisma';
import { isMockStorage } from '../../mockStore/mode';
import { AIProvider } from '../../infrastructure/ai/ai-provider';
import { GroqAIProvider } from '../../infrastructure/ai/groq-ai.provider';

export class AIService {
  constructor(private provider: AIProvider = new GroqAIProvider()) {}

  async polishFeedback(input: PolishFeedbackInput) {
    const prompt = `You are a Senior Staff Software Engineer and Technical Interviewer at a top tier tech company.
Analyze the following raw interview notes taken during a ${input.interviewType.replace('_', ' ')} mock interview session and refine them into a professional evaluation scorecard.

RAW NOTES:
"${input.rawNotes}"

Respond STRICTLY in raw JSON format (without markdown codeblock syntax) matching this structure:
{
  "professionalSummary": "A clear, encouraging 2-3 sentence executive summary of the performance.",
  "strengths": ["Strength point 1", "Strength point 2", "Strength point 3"],
  "weaknesses": ["Improvement point 1", "Improvement point 2"],
  "learningRecommendations": ["Actionable recommendation/resource 1", "Actionable recommendation/resource 2"]
}`;

    try {
      const text = await this.provider.completeJSON(prompt, 0.3);
      return polishedFeedbackOutputSchema.parse(JSON.parse(text));
    } catch (error) {
      console.error('Groq AI feedback polish failed:', error);
      return {
        professionalSummary: `AI polish was unavailable. Use these interview notes to complete the evaluation: ${input.rawNotes}`,
        strengths: ['Add observed strengths from the interview notes.'],
        weaknesses: ['Add specific improvement areas observed during the interview.'],
        learningRecommendations: ['Add one practice exercise tied to the feedback.'],
        usedFallback: true,
      };
    }
  }

  async generatePrepAdvisor(userId: string, input: PrepAdvisorInput) {
    // Query candidate's past interview scorecards to personalize advice
    const pastBookings = !isMockStorage()
      ? await prisma.booking.findMany({
          where: { candidateId: userId, status: 'COMPLETED' },
          take: 3,
          include: { feedback: true },
        })
      : [];

    const pastFeedbacksSummary = pastBookings
      .filter((b: any) => b.feedback)
      .map((b: any) => `Session (${b.interviewType}): ${b.feedback?.rawNotes}`)
      .join('\n');

    const prompt = `You are a Senior Tech Career & Interview Preparation Advisor.
Create a personalized 4-Week Interview Preparation Roadmap for a candidate targeting:
Target Role: ${input.targetRole}
${input.targetCompany ? `Target Company: ${input.targetCompany}` : 'Target Company: not specified — keep the plan role-focused'}

Candidate's Past Interview Feedback History:
${pastFeedbacksSummary || 'No past interview feedback available yet. Generate a general top-tier roadmap for this role.'}

Respond STRICTLY in raw JSON format matching this structure:
{
  "targetRole": "${input.targetRole}",
  "weeklyPlan": [
    { "week": 1, "focus": "Topic/Area", "tasks": ["Task 1", "Task 2"] },
    { "week": 2, "focus": "Topic/Area", "tasks": ["Task 1", "Task 2"] },
    { "week": 3, "focus": "Topic/Area", "tasks": ["Task 1", "Task 2"] },
    { "week": 4, "focus": "Topic/Area", "tasks": ["Task 1", "Task 2"] }
  ],
  "topStrategyTips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

    try {
      const text = await this.provider.completeJSON(prompt, 0.4);
      return prepAdvisorOutputSchema.parse(JSON.parse(text));
    } catch (error) {
      console.error('Groq AI prep advisor failed:', error);
      return {
        targetRole: input.targetRole,
        weeklyPlan: [
          { week: 1, focus: 'Role fundamentals', tasks: ['List core skills for the target role.', 'Review one foundational topic each day.'] },
          { week: 2, focus: 'Problem solving', tasks: ['Practice timed role-relevant problems.', 'Write down and review missed edge cases.'] },
          { week: 3, focus: 'System and communication', tasks: ['Practice explaining a solution aloud.', 'Review a design or project relevant to the role.'] },
          { week: 4, focus: 'Interview practice', tasks: ['Complete a full mock interview.', 'Review gaps and prepare concise examples.'] },
        ],
        topStrategyTips: ['Keep a short log of mistakes and revisit it daily.', 'Practice explaining tradeoffs clearly.', 'Reserve time for rest before interview day.'],
        usedFallback: true,
      };
    }
  }
}

export const aiService = new AIService();
