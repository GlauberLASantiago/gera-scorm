// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { exportCourse, previewHTML } from "./export";
import { exampleCourse, newBlock } from "../domain/model";
function bytes(blob: Blob) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = reject;
    r.readAsArrayBuffer(blob);
  });
}
describe("portable exports", () => {
  it("produces a complete ZIP with executable self-contained runtime", async () => {
    const course = exampleCourse();
    const zip = await JSZip.loadAsync(
      await bytes(await exportCourse(course, "1.2")),
    );
    for (const path of [
      "index.html",
      "imsmanifest.xml",
      "js/player.js",
      "css/player.css",
      "data/course.json",
      "data/course.js",
    ])
      expect(zip.file(path), path).toBeTruthy();
    const script = await zip.file("js/player.js")!.async("string");
    expect(() => new Function(script)).not.toThrow();
    const xml = new DOMParser().parseFromString(
      await zip.file("imsmanifest.xml")!.async("string"),
      "text/xml",
    );
    expect(xml.querySelector("parsererror")).toBeNull();
    for (const entry of xml.querySelectorAll("file"))
      expect(zip.file(entry.getAttribute("href")!)).toBeTruthy();
  });
  it("sanitizes authored HTML and escapes closing script tags in preview", () => {
    const c = exampleCourse();
    const b = newBlock("text");
    b.body = '<img src=x onerror="alert(1)"><script>alert(2)</script>';
    c.modules[0].pages[0].blocks = [b];
    c.title = "</script><script>alert(3)</script>";
    const html = previewHTML(c);
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("<script>alert(3)");
    expect(html.match(/<script>/g)?.length).toBe(1);
  });
  it("renders mathematics as portable MathML", async () => {
    const c = exampleCourse();
    c.modules[0].pages[0].blocks = [
      { ...newBlock("formula"), body: "\\frac{a}{b}" },
    ];
    const zip = await JSZip.loadAsync(
      await bytes(await exportCourse(c, "2004")),
    );
    const data = JSON.parse(
      await zip.file("data/course.json")!.async("string"),
    );
    expect(data.modules[0].pages[0].blocks[0].formulaHtml).toContain("<math");
  });
});
