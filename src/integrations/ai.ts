export interface GeneratedPlan {
  summary: string;
  objectives: string[];
  concepts: string[];
  glossary: { term: string; definition: string }[];
  quiz: { question: string; options: string[]; correctIndex: number }[];
  activities: string[];
}
export interface AIProvider {
  generate(source: string, signal?: AbortSignal): Promise<GeneratedPlan>;
}
// API keys must stay on a backend. A GitHub Pages deployment has no secret storage.
export class HttpAIProvider implements AIProvider {
  constructor(private endpoint: string) {}
  async generate(source: string, signal?: AbortSignal) {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, locale: "pt-BR" }),
      signal,
    });
    if (!response.ok)
      throw Error(`O serviço de IA respondeu ${response.status}`);
    const result = await response.json();
    if (
      typeof result.summary !== "string" ||
      !Array.isArray(result.objectives) ||
      !result.objectives.every((x: unknown) => typeof x === "string") ||
      !Array.isArray(result.quiz) ||
      !result.quiz.every(
        (q: any) =>
          typeof q.question === "string" &&
          Array.isArray(q.options) &&
          q.options.every((x: unknown) => typeof x === "string") &&
          Number.isInteger(q.correctIndex) &&
          q.correctIndex >= 0 &&
          q.correctIndex < q.options.length,
      ) ||
      !Array.isArray(result.glossary) ||
      !result.glossary.every(
        (g: any) =>
          typeof g.term === "string" && typeof g.definition === "string",
      ) ||
      !Array.isArray(result.activities) ||
      !result.activities.every((x: unknown) => typeof x === "string")
    )
      throw Error("Resposta de IA incompatível com o contrato pedagógico.");
    return result as GeneratedPlan;
  }
}
