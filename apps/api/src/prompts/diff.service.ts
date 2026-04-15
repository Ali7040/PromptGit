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

  async diffVersions(promptId: string, fromTag: string, toTag: string): Promise<DiffResult> {
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

    return { fromVersion: fromTag, toVersion: toTag, lines, stats };
  }

  /**
   * Myers diff algorithm — same algorithm Git uses internally.
   * Returns line-level hunks suitable for side-by-side rendering.
   */
  private computeDiff(a: string, b: string): DiffLine[] {
    const aLines = a.split('\n');
    const bLines = b.split('\n');
    const result: DiffLine[] = [];

    // LCS-based diff
    const lcs = this.buildLCS(aLines, bLines);
    let i = 0;
    let j = 0;

    for (const [ai, bi] of lcs) {
      while (i < ai) {
        result.push({ type: 'delete', lineNumber: i + 1, content: aLines[i] });
        i++;
      }
      while (j < bi) {
        result.push({ type: 'insert', lineNumber: j + 1, content: bLines[j] });
        j++;
      }
      result.push({ type: 'equal', content: aLines[ai] });
      i++;
      j++;
    }

    while (i < aLines.length) {
      result.push({ type: 'delete', lineNumber: i + 1, content: aLines[i++] });
    }
    while (j < bLines.length) {
      result.push({ type: 'insert', lineNumber: j + 1, content: bLines[j++] });
    }

    return result;
  }

  private buildLCS(a: string[], b: string[]): [number, number][] {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
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
