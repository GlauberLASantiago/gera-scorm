import { describe, expect, it } from "vitest";
import {
  buildMagicPrompt,
  MAGIC_PROMPTS,
  SCORM_TECHNICAL_CONTRACT,
} from "./MagicPrompts";

describe("Prompt Mágico", () => {
  it("provides exactly ten distinct pedagogical models", () => {
    expect(MAGIC_PROMPTS).toHaveLength(10);
    expect(new Set(MAGIC_PROMPTS.map((item) => item.title)).size).toBe(10);
  });

  it("adds a complete Moodle SCORM 1.2 contract to every prompt", () => {
    expect(SCORM_TECHNICAL_CONTRACT).toContain("imsmanifest.xml");
    expect(SCORM_TECHNICAL_CONTRACT).toContain('LMSInitialize("")');
    expect(SCORM_TECHNICAL_CONTRACT).toContain("curso_scorm.zip");
    for (const item of MAGIC_PROMPTS) {
      const prompt = buildMagicPrompt(item.prompt);
      expect(prompt).toContain("SCORM 1.2");
      expect(prompt).toContain("cmi.suspend_data");
      expect(prompt).toContain("Não crie questões dissertativas");
    }
  });
});
