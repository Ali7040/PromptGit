import { Injectable } from '@nestjs/common';

export interface PromptScores {
  clarity: number;        // 0-10: how easy the prompt is to understand
  specificity: number;    // 0-10: how specific the instructions are
  safety: number;         // 0-10: presence of safety guardrails
  structure: number;      // 0-10: organization and formatting quality
  effectiveness: number;  // 0-10: predicted task completion quality
  overall: number;        // weighted average
}

@Injectable()
export class PromptScorerService {
  /**
   * Heuristic scoring — fast, no API calls.
   * Used to quantify before/after enhancement deltas.
   */
  async score(content: string): Promise<PromptScores> {
    const words = content.split(/\s+/).length;
    const hasVariables = /{[\w_]+}/.test(content);
    const hasStructure = /^#{1,3}\s|^\*\*|^-\s|^\d+\./m.test(content);
    const hasSafety = /do not|don't|avoid|refuse|never|prohibited/i.test(content);
    const hasExamples = /example:|for instance:|e\.g\.|such as/i.test(content);
    const hasFormat = /json|markdown|bullet|list|numbered|format:/i.test(content);

    const clarity = Math.min(10, Math.max(1,
      5 + (words > 20 ? 1 : -2) + (words < 200 ? 1 : -1) + (hasStructure ? 2 : 0),
    ));

    const specificity = Math.min(10, Math.max(1,
      4 + (hasFormat ? 2 : 0) + (hasExamples ? 2 : 0) + (hasVariables ? 1 : 0) + (words > 50 ? 1 : 0),
    ));

    const safety = Math.min(10, Math.max(1, hasSafety ? 8 : 4));

    const structure = Math.min(10, Math.max(1,
      3 + (hasStructure ? 3 : 0) + (hasVariables ? 2 : 0) + (content.includes('\n') ? 2 : 0),
    ));

    const effectiveness = Math.round(clarity * 0.3 + specificity * 0.4 + structure * 0.2 + safety * 0.1);
    const overall = parseFloat(((clarity + specificity + safety + structure + effectiveness) / 5).toFixed(1));

    return { clarity, specificity, safety, structure, effectiveness, overall };
  }
}
