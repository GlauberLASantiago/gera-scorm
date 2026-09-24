import { describe, it, expect } from "vitest";
import { manifest, xml } from "./export";
import { createCourse } from "../domain/model";
describe("SCORM manifest", () => {
  it("escapes XML in titles", () => {
    const c = createCourse("A & B <teste>");
    expect(manifest(c, "1.2", ["index.html"])).toContain(
      "A &amp; B &lt;teste&gt;",
    );
  });
  it("sets SCORM 1.2 runtime namespace and launch resource", () => {
    const text = manifest(createCourse(), "1.2", ["index.html", "media/a.png"]);
    expect(text).toContain('adlcp:scormtype="sco"');
    expect(text).toContain(
      'xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"',
    );
    expect(text).toContain('<file href="media/a.png"/>');
    expect(text).toContain("<schemaversion>1.2</schemaversion>");
  });
  it("includes initial sequencing and objectives in 2004", () => {
    const text = manifest(createCourse(), "2004", ["index.html"]);
    expect(text).toContain('adlcp:scormType="sco"');
    expect(text).toContain("imsss:primaryObjective");
    expect(text).not.toContain("adlcp:masteryscore");
  });
  it("escapes quoted attributes", () =>
    expect(xml("\"'")).toBe("&quot;&apos;"));
});
