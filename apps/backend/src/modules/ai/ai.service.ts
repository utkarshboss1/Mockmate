// ============================================================
// ai.service.ts — AI Business Logic Layer (Groq LLaMA 3.3 70B)
// ============================================================

import { groq, GROQ_MODEL } from '../../lib/groq';
import { PolishFeedbackInput, PrepAdvisorInput } from './ai.validator';
import { prisma, isDbConnected } from '../../lib/prisma';

export class AIService {
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
      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: GROQ_MODEL,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const text = response.choices[0]?.message?.content || '{}';
      return JSON.parse(text);
    } catch (error) {
      console.error('Groq AI feedback polish failed, using fallback parser:', error);
      return {
        professionalSummary: input.rawNotes.slice(0, 200) + '...',
        strengths: ['Demonstrated problem-solving intent', 'Communicated thought process'],
        weaknesses: ['Review edge cases and space complexity optimizations'],
        learningRecommendations: ['Practice LeetCode medium problems under timed constraints'],
      };
    }
  }

  async generatePrepAdvisor(userId: string, input: PrepAdvisorInput) {
    // Query candidate's past interview scorecards to personalize advice
    const pastBookings = isDbConnected()
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
${input.targetCompany ? `Target Company: ${input.targetCompany}` : ''}

Candidate's Past Interview Feedback History:
${pastFeedbacksSummary || 'No past interview feedback available yet. Generate a general top-tier roadmap.'}

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
      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: GROQ_MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
      });

      const text = response.choices[0]?.message?.content || '{}';
      return JSON.parse(text);
    } catch (error) {
      console.error('Groq AI prep advisor failed, using fallback roadmap:', error);
      return {
        targetRole: input.targetRole,
        weeklyPlan: [
          { week: 1, focus: 'Data Structures & Algorithms Basics', tasks: ['Arrays, Strings, Hash Maps', 'Two Pointers & Sliding Window'] },
          { week: 2, focus: 'Trees, Graphs & Dynamic Programming', tasks: ['Binary Tree Traversal (DFS/BFS)', 'DP Core Patterns'] },
          { week: 3, focus: 'System Design & Architecture', tasks: ['Scalability, Caching, Databases', 'Design Rate Limiter / Key-Value Store'] },
          { week: 4, focus: 'Mock Interviews & Behavioral Prep', tasks: ['STAR Method Behavioral Stories', 'Timed 60-min Mock Interviews'] },
        ],
        topStrategyTips: [
          'Always think out loud before writing any code.',
          'Start with a brute force solution, state time complexity, then optimize.',
          'Ask clarifying questions about input bounds and constraints first.',
        ],
      };
    }
  }
}

export const aiService = new AIService();
