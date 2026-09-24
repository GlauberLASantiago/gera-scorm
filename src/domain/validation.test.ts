import { describe, expect, it } from "vitest";
import { exampleCourse, fromTemplate, templates } from "./model";
import { publishingIssues, validateCourse } from "./validation";

describe("course validation", () => {
  it("rejects unsupported legacy question types", () => {
    const legacy = exampleCourse() as any;
    legacy.modules[0].pages[2].blocks[0].questionType = "open";
    expect(() => validateCourse(legacy)).toThrow("Bloco inválido");
  });
  it("ships every template ready to preview and publish", () => {
    for (const name of Object.keys(templates)) {
      const course = validateCourse(fromTemplate(name));
      expect(publishingIssues(course), name).toEqual([]);
      expect(course.modules.flatMap((m) => m.pages)).not.toHaveLength(0);
    }
  });
});
