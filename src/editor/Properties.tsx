import { useRef } from "react";
import { Settings2, Upload, Plus, Trash2 } from "lucide-react";
import { labels, uid, type Block, type Course } from "../domain/model";
import { useStudio } from "../state/store";
import { RichText } from "./RichText";
import { MediaProperties } from "./MediaProperties";

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
        />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}
export function Properties({
  course,
  block: b,
}: {
  course: Course;
  block?: Block;
}) {
  const update = useStudio((s) => s.update);
  const upload = useRef<HTMLInputElement>(null);
  const change = (patch: Partial<Block>) =>
    update((c) => {
      const target = c.modules
        .flatMap((m) => m.pages.flatMap((p) => p.blocks))
        .find((x) => x.id === b?.id);
      if (target) Object.assign(target, patch);
    });
  const itemChange = (id: string, patch: Partial<Block["items"][number]>) => {
    if (b)
      change({
        items: b.items.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      });
  };
  return (
    <aside className="properties">
      <div className="panel-title">
        <Settings2 size={17} />
        <b>Propriedades</b>
      </div>
      {!b ? (
        <>
          <div className="property-intro">
            <span className="eyebrow">CONFIGURAÇÕES GERAIS</span>
            <h3>Sobre o curso</h3>
            <p>Selecione um bloco para personalizar seu conteúdo.</p>
          </div>
          <Field
            label="Nome do curso"
            value={course.title}
            onChange={(v) =>
              update((c) => {
                c.title = v;
              })
            }
          />
          <Field
            label="Descrição"
            value={course.description}
            onChange={(v) =>
              update((c) => {
                c.description = v;
              })
            }
            multiline
          />
          <Field
            label="Autoria"
            value={course.author}
            onChange={(v) =>
              update((c) => {
                c.author = v;
              })
            }
          />
          <label className="field">
            Nota de aprovação
            <input
              type="number"
              min="0"
              max="100"
              value={course.passScore}
              onChange={(e) =>
                update((c) => {
                  c.passScore = Math.min(100, Math.max(0, +e.target.value));
                })
              }
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={course.certificate}
              onChange={(e) =>
                update((c) => {
                  c.certificate = e.target.checked;
                })
              }
            />
            Certificado de conclusão
          </label>
          <div className="hint">
            Seu trabalho é salvo automaticamente neste navegador. Faça backups
            para transferir o curso entre dispositivos.
          </div>
        </>
      ) : (
        <>
          <div className="property-intro">
            <span className="eyebrow">{labels[b.type]}</span>
            <h3>Personalize a experiência</h3>
          </div>
          <Field
            label="Título"
            value={b.title}
            onChange={(v) => change({ title: v })}
          />
          {b.type === "text" && (
            <RichText value={b.body} onChange={(body) => change({ body })} />
          )}
          {["heading", "quote", "code", "formula", "table", "link"].includes(
            b.type,
          ) && (
            <Field
              label={
                b.type === "table"
                  ? "Linhas e colunas separadas por |"
                  : "Conteúdo"
              }
              value={b.body}
              onChange={(v) => change({ body: v })}
              multiline
            />
          )}
          {["image", "video", "audio", "pdf", "link", "hotspot"].includes(
            b.type,
          ) && (
            <>
              <Field
                label="URL do recurso"
                value={
                  b.url.startsWith("data:") ? "Arquivo incorporado" : b.url
                }
                onChange={(v) => change({ url: v })}
              />
              {b.type !== "link" && (
                <>
                  <input
                    ref={upload}
                    hidden
                    type="file"
                    accept={
                      b.type === "image" || b.type === "hotspot"
                        ? "image/*"
                        : b.type === "video"
                          ? "video/mp4"
                          : b.type === "audio"
                            ? "audio/*"
                            : "application/pdf"
                    }
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 25 * 1024 * 1024) {
                        alert("Use arquivos de até 25 MB.");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () =>
                        change({ url: String(reader.result) });
                      reader.readAsDataURL(file);
                    }}
                  />
                  <button
                    className="upload"
                    onClick={() => upload.current?.click()}
                  >
                    <Upload size={16} />
                    Carregar arquivo
                  </button>
                </>
              )}
              <Field
                label="Texto alternativo / descrição"
                value={b.alt}
                onChange={(v) => change({ alt: v })}
              />
            </>
          )}
          {["video", "audio"].includes(b.type) && (
            <label className="field">
              Percentual mínimo assistido
              <input
                type="number"
                min="0"
                max="100"
                value={b.watchedPercent}
                onChange={(e) =>
                  change({
                    watchedPercent: Math.max(0, Math.min(100, +e.target.value)),
                  })
                }
              />
            </label>
          )}
          {b.type === "quiz" && (
            <label className="field">
              Tipo de questão
              <select
                value={b.questionType}
                onChange={(e) =>
                  change({
                    questionType: e.target.value as Block["questionType"],
                    correct: [],
                  })
                }
              >
                {Object.entries({
                  single: "Múltipla escolha",
                  multiple: "Múltiplas respostas",
                  boolean: "Verdadeiro / falso",
                  matching: "Associação",
                  ordering: "Ordenação",
                  fill: "Completar lacunas",
                  open: "Resposta aberta",
                }).map(([v, t]) => (
                  <option value={v} key={v}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          )}
          {[
            "quiz",
            "flashcards",
            "hotspot",
            "timeline",
            "dragdrop",
            "ordering",
            "scenario",
          ].includes(b.type) &&
            !(
              b.type === "quiz" &&
              ["open", "fill", "boolean"].includes(b.questionType)
            ) && (
              <div className="items-editor">
                <label className="field">
                  <span>Itens / alternativas</span>
                </label>
                {b.items.map((item, i) => (
                  <div className="item-editor" key={item.id}>
                    <div className="item-header">
                      <b>Item {i + 1}</b>
                      <button
                        aria-label="Excluir item"
                        onClick={() =>
                          change({
                            items: b.items.filter((x) => x.id !== item.id),
                            correct: b.correct.filter((x) => x !== item.id),
                          })
                        }
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <Field
                      label="Texto"
                      value={item.title}
                      onChange={(v) => itemChange(item.id, { title: v })}
                    />
                    <Field
                      label="Explicação / par / consequência"
                      value={item.detail}
                      onChange={(v) => itemChange(item.id, { detail: v })}
                    />
                    {b.type === "timeline" && (
                      <>
                        <Field
                          label="Data"
                          value={item.date || ""}
                          onChange={(date) => itemChange(item.id, { date })}
                        />
                        <Field
                          label="Imagem (URL)"
                          value={item.image || ""}
                          onChange={(image) => itemChange(item.id, { image })}
                        />
                      </>
                    )}
                    {b.type === "scenario" && (
                      <div>
                        <small>Escolhas ramificadas</small>
                        {(item.choices || []).map((choice, ci) => (
                          <div className="choice-editor" key={ci}>
                            <input
                              aria-label="Texto da escolha"
                              value={choice.label}
                              onChange={(e) =>
                                itemChange(item.id, {
                                  choices: item.choices!.map((x, j) =>
                                    j === ci
                                      ? { ...x, label: e.target.value }
                                      : x,
                                  ),
                                })
                              }
                            />
                            <select
                              aria-label="Destino da escolha"
                              value={choice.target}
                              onChange={(e) =>
                                itemChange(item.id, {
                                  choices: item.choices!.map((x, j) =>
                                    j === ci
                                      ? { ...x, target: e.target.value }
                                      : x,
                                  ),
                                })
                              }
                            >
                              <option value="">Fim do cenário</option>
                              {b.items
                                .filter((x) => x.id !== item.id)
                                .map((x) => (
                                  <option key={x.id} value={x.id}>
                                    {x.title}
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={() =>
                                itemChange(item.id, {
                                  choices: item.choices!.filter(
                                    (_, j) => j !== ci,
                                  ),
                                })
                              }
                              aria-label="Remover escolha"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                        <button
                          className="upload"
                          onClick={() =>
                            itemChange(item.id, {
                              choices: [
                                ...(item.choices || []),
                                { label: "Nova escolha", target: "" },
                              ],
                            })
                          }
                        >
                          + Escolha
                        </button>
                      </div>
                    )}
                    {b.type === "quiz" &&
                      ["single", "multiple"].includes(b.questionType) && (
                        <label className="check">
                          <input
                            type="checkbox"
                            checked={b.correct.includes(item.id)}
                            onChange={(e) =>
                              change({
                                correct:
                                  b.questionType === "single"
                                    ? e.target.checked
                                      ? [item.id]
                                      : []
                                    : e.target.checked
                                      ? [...b.correct, item.id]
                                      : b.correct.filter((x) => x !== item.id),
                              })
                            }
                          />
                          Resposta correta
                        </label>
                      )}
                    {b.type === "hotspot" && (
                      <div className="two-fields">
                        {(["x", "y"] as const).map((axis) => (
                          <label key={axis}>
                            {axis.toUpperCase()} (%)
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item[axis] ?? 50}
                              onChange={(e) =>
                                itemChange(item.id, {
                                  [axis]: Math.max(
                                    0,
                                    Math.min(100, +e.target.value),
                                  ),
                                })
                              }
                            />
                          </label>
                        ))}
                      </div>
                    )}
                    {b.type === "scenario" && (
                      <label className="field">
                        Próxima situação
                        <select
                          value={item.target || ""}
                          onChange={(e) =>
                            itemChange(item.id, { target: e.target.value })
                          }
                        >
                          <option value="">Final / livre escolha</option>
                          {b.items
                            .filter((x) => x.id !== item.id)
                            .map((x) => (
                              <option key={x.id} value={x.id}>
                                {x.title}
                              </option>
                            ))}
                        </select>
                      </label>
                    )}
                  </div>
                ))}
                <button
                  className="upload"
                  onClick={() =>
                    change({
                      items: [
                        ...b.items,
                        { id: uid(), title: "Novo item", detail: "" },
                      ],
                    })
                  }
                >
                  <Plus size={15} />
                  Adicionar item
                </button>
              </div>
            )}
          {["video", "audio", "pdf", "hotspot"].includes(b.type) && (
            <MediaProperties block={b} onChange={change} />
          )}
          {b.type === "quiz" && b.questionType === "boolean" && (
            <label className="field">
              Resposta correta
              <select
                value={b.correct[0] || ""}
                onChange={(e) => change({ correct: [e.target.value] })}
              >
                <option value="">Selecione</option>
                <option value="true">Verdadeiro</option>
                <option value="false">Falso</option>
              </select>
            </label>
          )}
          {b.type === "quiz" && b.questionType === "fill" && (
            <Field
              label="Resposta esperada"
              value={b.correct[0] || ""}
              onChange={(v) => change({ correct: [v] })}
            />
          )}
          {["quiz", "ordering", "dragdrop"].includes(b.type) && (
            <>
              <div className="two-fields">
                {(
                  ["attempts", "passScore", "weight", "timeLimit"] as const
                ).map((k) => (
                  <label key={k}>
                    {
                      {
                        attempts: "Tentativas",
                        passScore: "Nota mínima",
                        weight: "Peso",
                        timeLimit: "Tempo (s)",
                      }[k]
                    }
                    <input
                      type="number"
                      min={k === "attempts" || k === "weight" ? 1 : 0}
                      value={b[k]}
                      onChange={(e) =>
                        change({
                          [k]: Math.max(
                            k === "attempts" || k === "weight" ? 1 : 0,
                            +e.target.value,
                          ),
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              <Field
                label="Feedback"
                value={b.feedback}
                onChange={(v) => change({ feedback: v })}
                multiline
              />
            </>
          )}
          <label className="check">
            <input
              type="checkbox"
              checked={b.required}
              onChange={(e) => change({ required: e.target.checked })}
            />
            Conclusão obrigatória
          </label>
        </>
      )}
    </aside>
  );
}
