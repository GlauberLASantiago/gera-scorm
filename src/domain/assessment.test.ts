import { describe, it, expect } from "vitest";
import { grade, metrics } from "./assessment";
import { newBlock, emptyProgress, exampleCourse, fromTemplate } from "./model";
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
  it("never automatically grades open answers", () =>
    expect(
      grade({ ...newBlock("quiz"), questionType: "open" }, ["reflection"]),
    ).toBeNull());
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
  it("creates independent template ids", () =>
    expect(fromTemplate("Aula EAD").id).not.toBe(fromTemplate("Aula EAD").id));
});
