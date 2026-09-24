import { labels, type Course } from "./model";
export function validateCourse(input: unknown): Course {
  const c = structuredClone(input) as Course;
  if (
    !c ||
    c.schemaVersion !== 1 ||
    typeof c.title !== "string" ||
    !Array.isArray(c.modules) ||
    !Array.isArray(c.badges)
  )
    throw Error("Arquivo de curso inválido.");
  const seen = new Set<string>();
  const id = (v: unknown) => {
    if (
      typeof v !== "string" ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(v) ||
      seen.has(v)
    )
      throw Error("Identificadores inválidos ou duplicados.");
    seen.add(v);
  };
  id(c.id);
  if (!Number.isFinite(c.passScore) || c.passScore < 0 || c.passScore > 100)
    throw Error("Nota de aprovação inválida.");
  for (const m of c.modules) {
    id(m.id);
    if (typeof m.title !== "string" || !Array.isArray(m.pages))
      throw Error("Módulo inválido.");
    for (const p of m.pages) {
      id(p.id);
      if (typeof p.title !== "string" || !Array.isArray(p.blocks))
        throw Error("Página inválida.");
      for (const b of p.blocks) {
        // Cursos criados antes da remoção de respostas dissertativas são
        // migrados para lacunas e exigem que o autor defina um gabarito.
        if (b.type === "quiz" && (b.questionType as string) === "open") {
          b.questionType = "fill";
          b.correct = [];
        }
        id(b.id);
        if (
          !Object.hasOwn(labels, b.type) ||
          ![
            "single",
            "multiple",
            "boolean",
            "matching",
            "ordering",
            "fill",
          ].includes(b.questionType) ||
          !Array.isArray(b.items) ||
          !Array.isArray(b.correct) ||
          !["title", "body", "url", "alt", "feedback"].every(
            (k) => typeof (b as any)[k] === "string",
          )
        )
          throw Error("Bloco inválido.");
        if (
          !Number.isFinite(b.attempts) ||
          b.attempts < 1 ||
          !Number.isFinite(b.weight) ||
          b.weight <= 0 ||
          !Number.isFinite(b.passScore) ||
          b.passScore < 0 ||
          b.passScore > 100
        )
          throw Error("Configuração de avaliação inválida.");
        for (const item of b.items) {
          id(item.id);
          if (typeof item.title !== "string" || typeof item.detail !== "string")
            throw Error("Item inválido.");
        }
        if (b.correct.some((x) => typeof x !== "string"))
          throw Error("Gabarito inválido.");
      }
    }
  }
  return structuredClone(c);
}
export function publishingIssues(c: Course): string[] {
  const issues: string[] = [];
  if (!c.modules.some((m) => m.pages.length))
    issues.push("Adicione pelo menos uma página.");
  c.modules.forEach((m) =>
    m.pages.forEach((p) =>
      p.blocks.forEach((b) => {
        if (
          ["image", "hotspot", "video", "audio", "pdf", "link"].includes(
            b.type,
          ) &&
          !b.url
        )
          issues.push(`${p.title}: ${b.title} está sem arquivo ou URL.`);
        if (["image", "hotspot"].includes(b.type) && !b.alt)
          issues.push(`${p.title}: descreva a imagem em texto alternativo.`);
        if (
          b.type === "quiz" &&
          ["single", "multiple", "boolean", "fill"].includes(b.questionType) &&
          !b.correct.length
        )
          issues.push(`${p.title}: defina a resposta correta de ${b.title}.`);
      }),
    ),
  );
  return issues;
}
