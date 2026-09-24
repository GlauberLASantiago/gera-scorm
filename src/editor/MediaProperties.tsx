import { Plus, Trash2 } from "lucide-react";
import { uid, type Block } from "../domain/model";
export function MediaProperties({
  block: b,
  onChange,
}: {
  block: Block;
  onChange: (p: Partial<Block>) => void;
}) {
  const cues = b.cues || [];
  return (
    <div className="media-properties">
      <label className="field">
        Legendas WebVTT (para áudio/vídeo)
        <textarea
          rows={4}
          value={b.captions || ""}
          placeholder={"WEBVTT\n\n00:00.000 --> 00:05.000\nTexto da legenda"}
          onChange={(e) => onChange({ captions: e.target.value })}
        />
      </label>
      <h4>Perguntas associadas</h4>
      <p>
        Em áudio/vídeo, a pergunta aparece no instante configurado. Em PDF e
        hotspot, aparece junto ao conteúdo.
      </p>
      {cues.map((cue, i) => (
        <div className="item-editor" key={cue.id}>
          <label className="field">
            Instante (segundos)
            <input
              type="number"
              min="0"
              value={cue.seconds}
              onChange={(e) =>
                onChange({
                  cues: cues.map((c, j) =>
                    j === i
                      ? { ...c, seconds: Math.max(0, +e.target.value) }
                      : c,
                  ),
                })
              }
            />
          </label>
          <label className="field">
            Pergunta
            <input
              value={cue.question}
              onChange={(e) =>
                onChange({
                  cues: cues.map((c, j) =>
                    j === i ? { ...c, question: e.target.value } : c,
                  ),
                })
              }
            />
          </label>
          <label className="field">
            Resposta esperada
            <input
              value={cue.answer}
              onChange={(e) =>
                onChange({
                  cues: cues.map((c, j) =>
                    j === i ? { ...c, answer: e.target.value } : c,
                  ),
                })
              }
            />
          </label>
          <button
            className="icon-button"
            aria-label="Excluir pergunta"
            onClick={() => onChange({ cues: cues.filter((_, j) => j !== i) })}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        className="upload"
        onClick={() =>
          onChange({
            cues: [
              ...cues,
              {
                id: uid(),
                seconds: 10,
                question: "O que você observou?",
                answer: "",
              },
            ],
          })
        }
      >
        <Plus size={14} />
        Adicionar pergunta
      </button>
    </div>
  );
}
