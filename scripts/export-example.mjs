import { mkdir, writeFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { createServer } from "vite";
// Generate a real example artifact with the same exporter used by the UI.
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://example.test",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { exampleCourse } = await server.ssrLoadModule("/src/domain/model.ts");
  const { exportCourse } = await server.ssrLoadModule("/src/scorm/export.ts");
  const course = exampleCourse();
  await mkdir("examples", { recursive: true });
  await writeFile(
    "examples/curso-exemplo.json",
    JSON.stringify(course, null, 2),
  );
  for (const version of ["1.2", "2004"]) {
    const blob = await exportCourse(course, version);
    await writeFile(
      `examples/curso-scorm-${version}.zip`,
      new Uint8Array(await blob.arrayBuffer()),
    );
  }
  console.log("Curso de exemplo e pacotes SCORM gerados em examples/.");
} finally {
  await server.close();
  dom.window.close();
}
