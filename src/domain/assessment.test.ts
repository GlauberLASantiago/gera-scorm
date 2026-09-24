import { describe, it, expect } from "vitest";
import { grade, metrics } from "./assessment";
import {
  newBlock,
  emptyProgress,
  exampleCourse,
  fromTemplate,
  templates,
} from "./model";
describe("assessment", () => {
  it("ignores option order in multiple responses but rejects partial answers", () => {
    const b = {
      ...newBlock("quiz"),
      questionType: "multiple" as const,
      correct: ["a", "b"],
    };
    expect(grade(b, ["b", "a"])).toBe(100);
    expect(grade(b, ["a"])).toBe(0);
  });
  it("scores an incorrect objective answer automatically", () =>
    expect(
      grade({ ...newBlock("quiz"), correct: ["correct"] }, ["incorrect"]),
    ).toBe(0));
  it("normalizes case and surrounding whitespace in fill answers", () =>
    expect(
      grade(
        { ...newBlock("quiz"), questionType: "fill", correct: ["Moodle"] },
        [" moodle "],
      ),
    ).toBe(100));
  it("does not inflate XP with repeated quiz attempts", () => {
    const p = emptyProgress();
    p.completed = ["page"];
    p.attempts = [1, 2].map(() => ({
      blockId: "quiz",
      answer: ["a"],
      score: 100,
      time: 1,
      date: "",
    }));
    expect(metrics(p, 2)).toEqual({ percent: 50, xp: 150, score: 100 });
  });
  it("includes a gradable question in the sample course", () => {
    const quiz = exampleCourse().modules[0].pages[2].blocks[0];
    expect(quiz.items.some((i) => i.id === quiz.correct[0])).toBe(true);
  });
  it("creates six distinct, reusable pedagogical experiences", () => {
    expect(Object.keys(templates)).toHaveLength(6);
    const first = fromTemplate("Leitura guiada + questões");
    const second = fromTemplate("Leitura guiada + questões");
    expect(first.id).not.toBe(second.id);
    expect(first.modules.flatMap((m) => m.pages).length).toBeGreaterThan(1);
    expect(
      first.modules
        .flatMap((m) => m.pages.flatMap((p) => p.blocks))
        .filter((b) => b.type === "quiz").length,
    ).toBeGreaterThanOrEqual(6);
  });
});
