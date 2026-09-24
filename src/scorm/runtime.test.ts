// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { courseRuntime } from "./runtime";
import { createCourse, newBlock, newPage } from "../domain/model";
let data: Record<string, string>;
let api: Record<string, ReturnType<typeof vi.fn>>;
beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '<div id="course"></div>';
  const memory = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => memory.get(k) || null,
    setItem: (k: string, v: string) => memory.set(k, v),
    clear: () => memory.clear(),
  });
  data = {};
  api = {
    LMSInitialize: vi.fn(() => "true"),
    LMSGetValue: vi.fn((k: string) => data[k] || ""),
    LMSSetValue: vi.fn((k: string, v: string) => {
      data[k] = v;
      return "true";
    }),
    LMSCommit: vi.fn(() => "true"),
    LMSFinish: vi.fn(() => "true"),
  };
  (window as any).API = api;
  window.scrollTo = vi.fn();
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete (window as any).API;
  delete (window as any).API_1484_11;
  delete (window as any).speechSynthesis;
  delete (window as any).SpeechSynthesisUtterance;
});
const button = (text: string) =>
  Array.from(document.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(text),
  )!;
describe("SCORM runtime", () => {
  it("initializes, completes and commits a reading course", () => {
    const c = createCourse();
    courseRuntime(c, "1.2");
    expect(api.LMSInitialize).toHaveBeenCalledWith("");
    expect(data["cmi.core.lesson_status"]).toBe("incomplete");
    button("Concluir").click();
    expect(data["cmi.core.lesson_status"]).toBe("completed");
    expect(JSON.parse(data["cmi.suspend_data"]).completed).toEqual([
      c.modules[0].pages[0].id,
    ]);
    expect(api.LMSCommit).toHaveBeenCalled();
  });
  it("blocks completion until required quiz has a submitted answer", () => {
    const c = createCourse();
    const b = newBlock("quiz");
    b.correct = [b.items[0].id];
    c.modules[0].pages[0].blocks = [b];
    courseRuntime(c, "1.2");
    button("Concluir").click();
    expect(data["cmi.core.lesson_status"]).toBe("incomplete");
    expect(document.body.textContent).toContain("Conclua a atividade");
    const radio = document.querySelector("input")!;
    radio.checked = true;
    radio.dispatchEvent(new Event("change"));
    document
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { cancelable: true }));
    expect(data["cmi.core.score.raw"]).toBe("100");
    expect(data["cmi.interactions.0.result"]).toBe("correct");
    button("Concluir").click();
    expect(data["cmi.core.lesson_status"]).toBe("passed");
  });
  it("restores location and completed pages from LMS suspend_data", () => {
    const c = createCourse();
    const second = newPage("Segunda");
    c.modules[0].pages.push(second);
    data["cmi.suspend_data"] = JSON.stringify({
      completed: [c.modules[0].pages[0].id],
      attempts: [],
      seconds: 15,
      location: second.id,
    });
    courseRuntime(c, "1.2");
    expect(document.querySelector("main h1")?.textContent).toBe("Segunda");
    expect(document.body.textContent).toContain("50% concluído");
  });
  it("uses SCORM 2004 fields and methods", () => {
    delete (window as any).API;
    const a = {
      Initialize: api.LMSInitialize,
      GetValue: api.LMSGetValue,
      SetValue: api.LMSSetValue,
      Commit: api.LMSCommit,
      Terminate: api.LMSFinish,
    };
    (window as any).API_1484_11 = a;
    courseRuntime(createCourse(), "2004");
    button("Concluir").click();
    expect(data["cmi.completion_status"]).toBe("completed");
    expect(data["cmi.progress_measure"]).toBe("1.0000");
    expect(data["cmi.session_time"]).toMatch(/^PT\d+S$/);
    expect(data["cmi.objectives.0.id"]).toBe("course-mastery");
  });
  it("automatically grades fill-in responses", () => {
    const c = createCourse();
    const b = {
      ...newBlock("quiz"),
      questionType: "fill" as const,
      correct: ["Minha resposta"],
    };
    c.modules[0].pages[0].blocks = [b as any];
    courseRuntime(c, "1.2");
    const field = document.querySelector("textarea")!;
    field.value = "Minha resposta";
    field.dispatchEvent(new Event("input"));
    document
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { cancelable: true }));
    expect(JSON.parse(data["cmi.suspend_data"]).attempts[0].score).toBe(100);
    expect(data["cmi.interactions.0.result"]).toBe("correct");
  });
  it("reads the page aloud using the configured course language", () => {
    const c = createCourse();
    c.language = "es-ES";
    const speak = vi.fn();
    (window as any).speechSynthesis = {
      cancel: vi.fn(),
      speak,
      getVoices: () => [{ lang: "es-ES", name: "Test voice" }],
    };
    (window as any).SpeechSynthesisUtterance = class {
      text: string;
      lang = "";
      voice = null;
      constructor(text: string) {
        this.text = text;
      }
    };
    courseRuntime(c, "1.2");
    button("Ouvir esta página").click();
    expect(speak).toHaveBeenCalledOnce();
    expect(speak.mock.calls[0][0].lang).toBe("es-ES");
  });
});
