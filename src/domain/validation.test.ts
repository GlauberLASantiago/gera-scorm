import { describe, expect, it } from "vitest";
import { exampleCourse } from "./model";
import { publishingIssues, validateCourse } from "./validation";

describe("course validation", () => {
  it("migrates legacy open questions to gradable fill-in questions", () => {
    const legacy = exampleCourse() as any;
    const block = legacy.modules[0].pages[2].blocks[0];
    block.questionType = "open";
    block.correct = ["legacy-answer"];

    const migrated = validateCourse(legacy);
    const migratedBlock = migrated.modules[0].pages[2].blocks[0];

    expect(migratedBlock.questionType).toBe("fill");
    expect(migratedBlock.correct).toEqual([]);
    expect(publishingIssues(migrated)).toContain(
      `${migrated.modules[0].pages[2].title}: defina a resposta correta de ${migratedBlock.title}.`,
    );
  });
});
