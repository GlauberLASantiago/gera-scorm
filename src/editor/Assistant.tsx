import { useState } from "react";
import { HttpAIProvider, type GeneratedPlan } from "../integrations/ai";
import { newBlock, uid } from "../domain/model";
import { useStudio } from "../state/store";
export function Assistant() {
  const [source, setSource] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [result, setResult] = useState<GeneratedPlan | null>(null);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const s = useStudio();
  const readPDF = async (file: File) => {
    setBusy(true);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      const document = await pdfjs.getDocument({
        data: await file.arrayBuffer(),
      }).promise;
      let text = "";
      for (let i = 1; i <= Math.min(document.numPages, 80); i++) {
        const page = await document.getPage(i);
        const content = await page.getTextContent();
        text +=
          content.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ") + "\n";
      }
      setSource(text);
      setStatus(
        text.trim()
          ? "Texto extraído do PDF. Revise antes de gerar."
          : "Este PDF não possui camada de texto. Será necessário OCR externo.",
      );
      await document.cleanup();
    } catch (e) {
      setStatus("Falha ao ler PDF: " + String(e));
    } finally {
      setBusy(false);
    }
  };
  const generate = async () => {
    setBusy(true);
    setStatus("");
    try {
      const url = new URL(endpoint);
      if (
        url.protocol !== "https:" &&
        url.hostname !== "localhost" &&
        url.hostname !== "127.0.0.1"
      )
        throw Error("Use um endpoint HTTPS.");
      setResult(await new HttpAIProvider(endpoint).generate(source));
      setStatus("Plano recebido. Revise antes de inserir no curso.");
    } catch (e) {
      setStatus(String(e));
    } finally {
      setBusy(false);
    }
  };
  const insert = () => {
    if (!result) return;
    s.update((c) => {
      const p = c.modules
        .flatMap((m) => m.pages)
        .find((p) => p.id === s.pageId);
      if (!p) return;
      p.blocks.push(
        { ...newBlock("text"), title: "Resumo", body: result.summary },
        {
          ...newBlock("text"),
          title: "Objetivos",
          body: result.objectives.join("\n"),
        },
        {
          ...newBlock("flashcards"),
          title: "Glossário",
          items: (result.glossary || []).map((g) => ({
            id: uid(),
            title: g.term,
            detail: g.definition,
          })),
        },
      );
      for (const q of result.quiz) {
        const b = newBlock("quiz");
        b.title = q.question;
        b.items = q.options.map((title) => ({ id: uid(), title, detail: "" }));
        b.correct = [b.items[q.correctIndex]?.id].filter(Boolean);
        p.blocks.push(b);
      }
      for (const activity of result.activities || [])
        p.blocks.push({
          ...newBlock("quiz"),
          questionType: "open",
          title: activity,
        });
    });
    setStatus(
      "Conteúdo inserido na página atual. Revise os gabaritos e a acessibilidade.",
    );
  };
  return (
    <div className="modal-body">
      <p>
        Use texto, artigo ou PDF como referência. O envio ao serviço de IA
        ocorre somente ao clicar em “Gerar com API”.
      </p>
      <label className="upload">
        Importar PDF
        <input
          type="file"
          accept="application/pdf"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readPDF(file);
          }}
        />
      </label>
      <label className="field">
        Material de referência
        <textarea
          rows={7}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Cole seu texto ou artigo…"
        />
      </label>
      <label className="field">
        Endpoint do seu backend de IA
        <input
          type="url"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder="https://seu-backend.example/api/plan"
        />
      </label>
      <p className="hint">
        O GitHub Pages hospeda o editor. Para geração automática, conecte um
        backend que implemente o contrato documentado em docs/AI.md. As chaves
        do provedor ficam no backend.
      </p>
      <div className="action-row">
        <button
          className="primary"
          disabled={busy || !source.trim() || !endpoint}
          onClick={generate}
        >
          {busy ? "Processando…" : "Gerar com API"}
        </button>
        <button
          className="secondary"
          disabled={!source.trim()}
          onClick={() =>
            setPrompt(
              "Crie um planejamento pedagógico em português baseado exclusivamente no material abaixo. Entregue resumo, objetivos mensuráveis, conceitos-chave, glossário, quiz com respostas e atividades práticas. Indique lacunas, não invente referências.\n\n" +
                source,
            )
          }
        >
          Preparar prompt
        </button>
      </div>
      {prompt && (
        <label className="field">
          Prompt para copiar
          <textarea rows={5} readOnly value={prompt} />
          <button
            className="secondary"
            onClick={() =>
              navigator.clipboard
                .writeText(prompt)
                .then(() => setStatus("Prompt copiado."))
                .catch(() =>
                  setStatus("Selecione o texto e copie manualmente."),
                )
            }
          >
            Copiar
          </button>
        </label>
      )}
      {result && (
        <div>
          <h3>Revise o conteúdo gerado</h3>
          <p>{result.summary}</p>
          <ul>
            {result.objectives.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
          <p>
            {result.quiz.length} questões · {(result.activities || []).length}{" "}
            atividades
          </p>
          <button className="primary" onClick={insert}>
            Inserir na página atual
          </button>
        </div>
      )}
      <p role="status">{status}</p>
    </div>
  );
}
