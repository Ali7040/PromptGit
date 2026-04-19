import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ChangeType = 'equal' | 'insert' | 'delete';

export interface DiffLine {
  type: ChangeType;
  lineNumber?: number;
  content: string;
}

export interface DiffResult {
  fromVersion: string;
  toVersion: string;
  lines: DiffLine[];
  stats: { added: number; removed: number; unchanged: number };
}

@Injectable()
export class DiffService {
  constructor(private prisma: PrismaService) {}

  async diffVersions(
    promptId: string,
    fromTag: string,
    toTag: string
  ): Promise<DiffResult> {
    const [from, to] = await Promise.all([
      this.prisma.promptVersion.findUniqueOrThrow({
        where: { promptId_versionTag: { promptId, versionTag: fromTag } },
      }),
      this.prisma.promptVersion.findUniqueOrThrow({
        where: { promptId_versionTag: { promptId, versionTag: toTag } },
      }),
    ]);

    const lines = this.computeDiff(from.content, to.content);

    const stats = {
      added: lines.filter((l) => l.type === 'insert').length,
      removed: lines.filter((l) => l.type === 'delete').length,
      unchanged: lines.filter((l) => l.type === 'equal').length,
    };

    return {
      fromVersion: fromTag,
      toVersion: toTag,
      lines,
      stats,
    };
  }

  /**
   * Uses LCS (Longest Common Subsequence) to compute a line-level diff.
   * This is conceptually similar to Myers diff used in Git.
   */
  private computeDiff(a: string, b: string): DiffLine[] {
    const aLines = a ? a.split('\n') : [];
    const bLines = b ? b.split('\n') : [];

    const result: DiffLine[] = [];

    const lcs = this.buildLCS(aLines, bLines);

    let i = 0;
    let j = 0;

    for (const [ai, bi] of lcs) {
      // deletions (from old)
      while (i < ai) {
        result.push({
          type: 'delete',
          content: aLines[i],
          lineNumber: i + 1,
        });
        i++;
      }

      // insertions (from new)
      while (j < bi) {
        result.push({
          type: 'insert',
          content: bLines[j],
          lineNumber: j + 1,
        });
        j++;
      }

      // equal line
      result.push({
        type: 'equal',
        content: aLines[ai],
        lineNumber: ai + 1,
      });

      i++;
      j++;
    }

    // remaining deletions
    while (i < aLines.length) {
      result.push({
        type: 'delete',
        content: aLines[i],
        lineNumber: i + 1,
      });
      i++;
    }

    // remaining insertions
    while (j < bLines.length) {
      result.push({
        type: 'insert',
        content: bLines[j],
        lineNumber: j + 1,
      });
      j++;
    }

    return result;
  }

  private buildLCS(a: string[], b: string[]): [number, number][] {
    const m = a.length;
    const n = b.length;

    const dp: number[][] = Array.from({ length: m + 1 }, () =>
      new Array(n + 1).fill(0)
    );

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const result: [number, number][] = [];

    let i = m;
    let j = n;

    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        result.unshift([i - 1, j - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return result;
  }
}