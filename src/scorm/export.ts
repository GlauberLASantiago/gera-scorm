import JSZip from "jszip";
import DOMPurify from "dompurify";
import type { Course } from "../domain/model";
import { courseRuntime, runtimeCSS } from "./runtime";
import { mathMarkup } from "../domain/math";
import { fontLinks } from "./branding";
export const xml = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
export function manifest(c: Course, version: "1.2" | "2004", files: string[]) {
  const v12 = version === "1.2";
  return `<?xml version="1.0" encoding="UTF-8"?><manifest identifier="course-${c.id}" version="1.0" xmlns="${v12 ? "http://www.imsproject.org/xsd/imscp_rootv1p1p2" : "http://www.imsglobal.org/xsd/imscp_v1p1"}" xmlns:adlcp="http://www.adlnet.org/xsd/${v12 ? "adlcp_rootv1p2" : "adlcp_v1p3"}" ${v12 ? "" : 'xmlns:imsss="http://www.imsglobal.org/xsd/imsss" xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"'}><metadata><schema>ADL SCORM</schema><schemaversion>${v12 ? "1.2" : "2004 4th Edition"}</schemaversion></metadata><organizations default="organization"><organization identifier="organization"><title>${xml(c.title)}</title><item identifier="lesson" identifierref="resource"><title>${xml(c.title)}</title>${v12 ? `<adlcp:masteryscore>${c.passScore}</adlcp:masteryscore>` : `<imsss:sequencing><imsss:controlMode choice="true" flow="true"/><imsss:objectives><imsss:primaryObjective objectiveID="course-mastery" satisfiedByMeasure="true"><imsss:minNormalizedMeasure>${c.passScore / 100}</imsss:minNormalizedMeasure></imsss:primaryObjective></imsss:objectives></imsss:sequencing>`}</item></organization></organizations><resources><resource identifier="resource" type="webcontent" adlcp:${v12 ? "scormtype" : "scormType"}="sco" href="index.html">${files.map((f) => `<file href="${xml(f)}"/>`).join("")}</resource></resources></manifest>`;
}
export function cleanCourse(c: Course) {
  const copy = structuredClone(c);
  copy.modules.forEach((m) =>
    m.pages.forEach((p) =>
      p.blocks.forEach((b) => {
        if (b.type === "formula") b.formulaHtml = mathMarkup(b.body);
        if (b.type === "text")
          b.body = DOMPurify.sanitize(b.body, { USE_PROFILES: { html: true } });
      }),
    ),
  );
  return copy;
}
const json = (v: unknown) =>
  JSON.stringify(v)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
export function previewHTML(c: Course) {
  return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${fontLinks}<style>${runtimeCSS}</style><title>Prévia do curso</title><div id="course"></div><script>(${courseRuntime.toString()})(${json(cleanCourse(c))},'1.2',true)</script></html>`;
}
export async function exportCourse(course: Course, version: "1.2" | "2004") {
  const c = cleanCourse(course);
  const zip = new JSZip();
  const blocks = c.modules.flatMap((m) => m.pages.flatMap((p) => p.blocks));
  for (const b of blocks) {
    if (b.url.startsWith("data:")) {
      const response = await fetch(b.url);
      const blob = await response.blob();
      const ext =
        (
          {
            "image/png": "png",
            "image/jpeg": "jpg",
            "image/webp": "webp",
            "audio/mpeg": "mp3",
            "audio/wav": "wav",
            "video/mp4": "mp4",
            "application/pdf": "pdf",
          } as Record<string, string>
        )[blob.type] || "bin";
      const path = `media/${b.id}.${ext}`;
      zip.file(path, await blob.arrayBuffer());
      b.url = path;
    }
  }
  zip.file("data/course.json", JSON.stringify(c, null, 2));
  zip.file("data/course.js", "window.COURSE=" + json(c) + ";");
  zip.file("css/player.css", runtimeCSS);
  zip.file(
    "js/player.js",
    `(${courseRuntime.toString()})(window.COURSE,${json(version)},false);`,
  );
  zip.file(
    "index.html",
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      fontLinks +
      "<title>" +
      xml(c.title) +
      '</title><link rel="stylesheet" href="css/player.css"></head><body><div id="course"></div><script src="data/course.js"></script><script src="js/player.js"></script></body></html>',
  );
  c.modules.forEach((m) =>
    m.pages.forEach((p) => {
      zip.file("pages/" + p.id + ".json", JSON.stringify(p));
      p.blocks
        .filter((b) =>
          ["quiz", "ordering", "dragdrop", "scenario"].includes(b.type),
        )
        .forEach((b) =>
          zip.file("activities/" + b.id + ".json", JSON.stringify(b)),
        );
    }),
  );
  zip.folder("media");
  zip.folder("activities");
  const files = Object.keys(zip.files).filter((k) => !zip.files[k].dir);
  zip.file("imsmanifest.xml", manifest(c, version, files));
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
