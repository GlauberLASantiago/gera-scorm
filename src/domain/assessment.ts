import type { Block, Progress } from "./model";
export function grade(b: Block, answer: string[]): number | null {
  if (b.questionType === "open") return null;
  if (!b.correct.length) return 0;
  const normalize = (s: string) => s.trim().toLocaleLowerCase("pt-BR");
  if (b.questionType === "multiple")
    return [...answer].sort().join("|") === [...b.correct].sort().join("|")
      ? 100
      : 0;
  return answer.map(normalize).join("|") === b.correct.map(normalize).join("|")
    ? 100
    : 0;
}
export function metrics(p: Progress, total: number) {
  const graded = p.attempts.filter((a) => a.score !== null);
  const latest = new Map(graded.map((a) => [a.blockId, a.score!]));
  return {
    percent: total ? Math.round((p.completed.length / total) * 100) : 0,
    xp:
      p.completed.length * 50 +
      Array.from(latest.values()).filter((s) => s >= 70).length * 100,
    score: latest.size
      ? Math.round(
          Array.from(latest.values()).reduce((a, b) => a + b, 0) / latest.size,
        )
      : 0,
  };
}
