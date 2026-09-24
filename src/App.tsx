import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Eye,
  Download,
  Undo2,
  Redo2,
  Check,
  LayoutGrid,
  PanelLeft,
  GripVertical,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Search,
  GraduationCap,
  BarChart3,
  Sparkles,
  FolderOpen,
  Upload,
  Settings2,
  Award,
  FileText,
  ChevronDown,
  Monitor,
  Smartphone,
  WandSparkles,
} from "lucide-react";
import { useStudio, duplicate } from "./state/store";
import {
  createCourse,
  fromTemplate,
  labels,
  newBlock,
  templates,
  uid,
  type BlockType,
  type Course,
} from "./domain/model";
import { BlockView } from "./editor/BlockView";
import { Properties } from "./editor/Properties";
import { Gamification } from "./editor/Gamification";
import { Assistant } from "./editor/Assistant";
import { MagicPrompts } from "./editor/MagicPrompts";
import { validateCourse, publishingIssues } from "./domain/validation";
import {
  download,
  exportCourse,
  horizonteLogo,
  previewHTML,
} from "./scorm/export";
type Modal =
  | "library"
  | "preview"
  | "export"
  | "courses"
  | "templates"
  | "analytics"
  | "gamification"
  | "ai"
  | "magic"
  | null;
export default function App() {
  const s = useStudio();
  const [modal, setModal] = useState<Modal>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [mobile, setMobile] = useState(false);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [version, setVersion] = useState<"1.2" | "2004">("1.2");
  const [preview, setPreview] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const [report, setReport] = useState<any[]>([]);
  useEffect(() => {
    s.init();
  }, []);
  const course = s.courses.find((c) => c.id === s.courseId);
  const page = course?.modules
    .flatMap((m) => m.pages)
    .find((p) => p.id === s.pageId);
  const block = page?.blocks.find((b) => b.id === s.blockId);
  const module = course?.modules.find((m) =>
    m.pages.some((p) => p.id === s.pageId),
  );
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "z" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        e.shiftKey ? s.redo() : s.undo();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [s.undo, s.redo]);
  if (!s.ready) return <div className="loading">Preparando seu estúdio…</div>;
  if (!course)
    return (
      <div className="loading">
        {s.saveError}
        <button onClick={() => s.addCourse(createCourse())}>
          Criar curso local
        </button>
      </div>
    );
  const pages = course.modules.flatMap((m) => m.pages);
  const editPage = (fn: (p: NonNullable<typeof page>) => void) =>
    s.update((c) => {
      const p = c.modules
        .flatMap((m) => m.pages)
        .find((x) => x.id === s.pageId);
      if (p) fn(p);
    });
  const openPreview = () => {
    setPreview(previewHTML(course));
    setModal("preview");
  };
  const reorderBlock = (from: number, to: number) =>
    editPage((p) => {
      if (to >= 0 && to < p.blocks.length)
        p.blocks.splice(to, 0, p.blocks.splice(from, 1)[0]);
    });
  const movePage = (pageId: string, targetModule: string, targetId?: string) =>
    s.update((c) => {
      const source = c.modules.find((m) =>
        m.pages.some((p) => p.id === pageId),
      );
      const target = c.modules.find((m) => m.id === targetModule);
      if (!source || !target || pageId === targetId) return;
      const p = source.pages.splice(
        source.pages.findIndex((p) => p.id === pageId),
        1,
      )[0];
      const index = targetId
        ? target.pages.findIndex((p) => p.id === targetId)
        : target.pages.length;
      target.pages.splice(index, 0, p);
    });
  const handleExport = async () => {
    setBusy(true);
    setMessage("");
    try {
      const blob = await exportCourse(course, version);
      download(blob, "curso_scorm.zip");
      setMessage(
        "Pacote gerado. Adicione uma atividade SCORM no Moodle e envie o ZIP.",
      );
    } catch (e) {
      setMessage("Não foi possível gerar o pacote: " + String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className={
        "studio " +
        (inspectOpen ? "inspect-open " : "") +
        (outlineOpen ? "outline-open" : "")
      }
    >
      <a href="#canvas" className="skip-link">
        Ir para o editor
      </a>
      <header className="topbar">
        <button className="brand" onClick={() => setModal("courses")}>
          <span className="brand-icon">
            <BookOpen size={22} />
          </span>
          <span>
            scorm<span className="brand-light">studio</span>
            <small>MOODLE PROFESSIONAL</small>
          </span>
        </button>
        <div className="top-divider" />
        <button className="course-picker" onClick={() => setModal("courses")}>
          <FolderOpen size={15} />
          <span>{course.title}</span>
          <ChevronDown size={14} />
        </button>
        <div className="save-state">
          <span className={s.saveError ? "error-dot" : "status-dot"} />
          {s.saveError ? "Falha ao salvar" : "Salvo neste navegador"}
        </div>
        <div className="top-actions">
          <button
            className="icon-button"
            aria-label="Desfazer"
            disabled={!s.past.length}
            onClick={s.undo}
          >
            <Undo2 size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="Refazer"
            disabled={!s.future.length}
            onClick={s.redo}
          >
            <Redo2 size={17} />
          </button>
          <button className="secondary" onClick={openPreview}>
            <Eye size={16} />
            Visualizar
          </button>
          <button
            className="primary"
            onClick={() => {
              setMessage("");
              setModal("export");
            }}
          >
            <Download size={16} />
            Exportar SCORM
          </button>
          <span className="avatar">EP</span>
        </div>
      </header>
      <nav className="workspace-nav">
        <div className="workspace-launcher">
          <button className="magic-entry" onClick={() => setModal("magic")}>
            <WandSparkles size={14} />
            Prompt Mágico
          </button>
          <div className="workspace-label">
            <span className="live-dot" />
            ESPAÇO DE AUTORIA
          </div>
        </div>
        <button className="active">
          <PanelLeft size={16} />
          Editor do curso
        </button>
        <button onClick={() => setModal("gamification")}>
          <Award size={16} />
          Gamificação
        </button>
        <button onClick={() => setModal("analytics")}>
          <BarChart3 size={16} />
          Resultados
        </button>
        <button onClick={() => setModal("templates")}>
          <LayoutGrid size={16} />
          Templates
        </button>
        <button className="ai-tab" onClick={() => setModal("ai")}>
          <Sparkles size={16} />
          Assistente IA<span>BETA</span>
        </button>
      </nav>
      {s.saveError && (
        <div role="alert" className="error-banner">
          {s.saveError}
        </div>
      )}
      <div className="workspace">
        <aside className="structure">
          <div className="panel-title">
            <b>Estrutura do curso</b>
            <span>{pages.length} páginas</span>
            <button
              className="icon-button"
              aria-label="Adicionar módulo"
              onClick={() =>
                s.update((c) =>
                  c.modules.push({
                    id: uid(),
                    title: "Novo módulo",
                    pages: [],
                  }),
                )
              }
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="course-outline">
            <div className="course-cover">
              <span className="tiny-book">
                <BookOpen size={22} />
              </span>
              <small>CURSO ONLINE</small>
              <h2>{course.title}</h2>
              <div>
                <span className="draft-pill">Rascunho</span>
                <span>{course.modules.length} módulos</span>
              </div>
            </div>
            {course.modules.map((m, mi) => (
              <section
                className="module"
                key={m.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  if (e.target === e.currentTarget) {
                    e.preventDefault();
                    movePage(e.dataTransfer.getData("page"), m.id);
                  }
                }}
              >
                <div className="module-title">
                  <ChevronDown size={14} />
                  <span className="module-number">
                    {String(mi + 1).padStart(2, "0")}
                  </span>
                  <input
                    aria-label="Nome do módulo"
                    value={m.title}
                    onChange={(e) =>
                      s.update((c) => {
                        c.modules[mi].title = e.target.value;
                      })
                    }
                  />
                  <details>
                    <summary aria-label="Opções do módulo">
                      <MoreHorizontal size={16} />
                    </summary>
                    <div className="popover">
                      <button
                        onClick={() =>
                          s.update((c) =>
                            c.modules.splice(mi + 1, 0, duplicate(m)),
                          )
                        }
                      >
                        Duplicar
                      </button>
                      <button
                        onClick={() =>
                          s.update((c) => {
                            if (mi > 0)
                              [c.modules[mi - 1], c.modules[mi]] = [
                                c.modules[mi],
                                c.modules[mi - 1],
                              ];
                          })
                        }
                      >
                        Mover para cima
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Excluir este módulo e suas páginas?"))
                            s.update((c) => {
                              c.modules.splice(mi, 1);
                            });
                        }}
                      >
                        Excluir módulo
                      </button>
                    </div>
                  </details>
                </div>
                {m.pages.map((p, pi) => (
                  <div
                    className={
                      "page-item " + (p.id === s.pageId ? "selected" : "")
                    }
                    key={p.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("page", p.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      movePage(e.dataTransfer.getData("page"), m.id, p.id);
                    }}
                  >
                    <button
                      className="page-select"
                      onClick={() => s.selectPage(p.id)}
                    >
                      <FileText size={15} />
                      <span>{p.title}</span>
                      {p.id === s.pageId && <span className="selected-dot" />}
                    </button>
                    <details>
                      <summary aria-label={"Opções de " + p.title}>
                        <MoreHorizontal size={14} />
                      </summary>
                      <div className="popover">
                        <button
                          onClick={() =>
                            s.update((c) =>
                              c.modules[mi].pages.splice(
                                pi + 1,
                                0,
                                duplicate(p),
                              ),
                            )
                          }
                        >
                          Duplicar
                        </button>
                        <button
                          onClick={() =>
                            s.update((c) => {
                              if (pi > 0)
                                [
                                  c.modules[mi].pages[pi - 1],
                                  c.modules[mi].pages[pi],
                                ] = [
                                  c.modules[mi].pages[pi],
                                  c.modules[mi].pages[pi - 1],
                                ];
                            })
                          }
                        >
                          Mover para cima
                        </button>
                        {course.modules
                          .filter((x) => x.id !== m.id)
                          .map((target) => (
                            <button
                              key={target.id}
                              onClick={() => movePage(p.id, target.id)}
                            >
                              Mover: {target.title}
                            </button>
                          ))}
                        <button
                          onClick={() => {
                            if (confirm("Excluir esta página?"))
                              s.update((c) => {
                                c.modules[mi].pages.splice(pi, 1);
                              });
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </details>
                  </div>
                ))}
                <button className="add-page" onClick={() => s.addPage(m.id)}>
                  <Plus size={14} />
                  Adicionar página
                </button>
              </section>
            ))}
            <button
              className="add-module"
              onClick={() =>
                s.update((c) =>
                  c.modules.push({
                    id: uid(),
                    title: "Novo módulo",
                    pages: [],
                  }),
                )
              }
            >
              <Plus size={15} />
              Adicionar módulo
            </button>
          </div>
          <div className="structure-footer">
            <GraduationCap size={20} />
            <div>
              <strong>Feito para ensinar.</strong>
              <span>Construído para transformar.</span>
            </div>
          </div>
        </aside>
        <main className="editor" id="canvas">
          <div className="responsive-tools">
            <button
              onClick={() => {
                setOutlineOpen(!outlineOpen);
                setInspectOpen(false);
              }}
            >
              <PanelLeft size={15} />
              Estrutura
            </button>
            <button
              onClick={() => {
                setInspectOpen(!inspectOpen);
                setOutlineOpen(false);
              }}
            >
              <Settings2 size={15} />
              {inspectOpen ? "Fechar propriedades" : "Propriedades"}
            </button>
          </div>
          <div className="editor-toolbar">
            <div className="breadcrumbs">
              <BookOpen size={14} />
              <ChevronRight size={13} />
              <span>{module?.title || "Selecione uma página"}</span>
              <ChevronRight size={13} />
              <strong>{page?.title}</strong>
            </div>
            <div>
              <button
                className={"icon-button " + (!mobile ? "chosen" : "")}
                aria-label="Desktop"
                onClick={() => setMobile(false)}
              >
                <Monitor size={16} />
              </button>
              <button
                className={"icon-button " + (mobile ? "chosen" : "")}
                aria-label="Celular"
                onClick={() => setMobile(true)}
              >
                <Smartphone size={16} />
              </button>
            </div>
          </div>
          <div className="canvas-scroll">
            <div className={"page-canvas " + (mobile ? "mobile-canvas" : "")}>
              {page ? (
                <>
                  <div className="page-heading">
                    <div className="eyebrow">
                      MÓDULO{" "}
                      {String(course.modules.indexOf(module!) + 1).padStart(
                        2,
                        "0",
                      )}{" "}
                      <span>/</span> PÁGINA{" "}
                      {String(module!.pages.indexOf(page) + 1).padStart(2, "0")}
                    </div>
                    <input
                      className="page-title-input"
                      aria-label="Título da página"
                      value={page.title}
                      onChange={(e) =>
                        editPage((p) => {
                          p.title = e.target.value;
                        })
                      }
                    />
                    <div className="page-meta">
                      <span>
                        <FileText size={13} />
                        {page.blocks.length} blocos de conteúdo
                      </span>
                      <span>•</span>
                      <select
                        aria-label="Tipo de página"
                        value={page.kind}
                        onChange={(e) =>
                          editPage((p) => {
                            p.kind = e.target.value as typeof p.kind;
                          })
                        }
                      >
                        <option value="page">Página de conteúdo</option>
                        <option value="activity">Atividade</option>
                        <option value="assessment">Avaliação</option>
                      </select>
                    </div>
                  </div>
                  {page.blocks.map((b, i) => (
                    <article
                      tabIndex={0}
                      className={
                        "editor-block " +
                        (b.id === s.blockId ? "block-selected" : "")
                      }
                      key={b.id}
                      onClick={() => s.selectBlock(b.id)}
                      onFocus={() => s.selectBlock(b.id)}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("block", String(i));
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const index = e.dataTransfer.getData("block");
                        if (index !== "") reorderBlock(+index, i);
                      }}
                    >
                      <div className="block-tools">
                        <span>
                          <GripVertical size={14} />
                          {labels[b.type]}
                        </span>
                        <div>
                          <button
                            aria-label="Mover bloco para cima"
                            onClick={(e) => {
                              e.stopPropagation();
                              reorderBlock(i, i - 1);
                            }}
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            aria-label="Mover bloco para baixo"
                            onClick={(e) => {
                              e.stopPropagation();
                              reorderBlock(i, i + 1);
                            }}
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            aria-label="Duplicar bloco"
                            onClick={(e) => {
                              e.stopPropagation();
                              editPage((p) =>
                                p.blocks.splice(i + 1, 0, duplicate(b)),
                              );
                            }}
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            aria-label="Excluir bloco"
                            onClick={(e) => {
                              e.stopPropagation();
                              editPage((p) => {
                                p.blocks.splice(i, 1);
                              });
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <BlockView block={b} />
                    </article>
                  ))}
                  <button
                    className="add-block"
                    onClick={() => {
                      setSearch("");
                      setModal("library");
                    }}
                  >
                    <span>
                      <Plus size={19} />
                    </span>
                    Adicionar bloco
                    <small>Conteúdo, atividades e novas possibilidades</small>
                  </button>
                  <footer className="canvas-footer studio-credits">
                    <img
                      src={horizonteLogo}
                      alt="Grupo de Pesquisa Horizonte"
                    />
                    <div>
                      <p>
                        Desenvolvido pelo{" "}
                        <strong>professor Dr. Glauber Santiago</strong> —
                        DAC/UFSCar
                      </p>
                      <p>
                        Apoio:{" "}
                        <a
                          href="https://grupohorizonte.ufscar.br/"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <strong>Grupo de Pesquisa Horizonte ↗</strong>
                        </a>{" "}
                        •{" "}
                        <a
                          href="https://servidores.ufscar.br/glauber/"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <strong>🌐 Website do Docente ↗</strong>
                        </a>
                      </p>
                    </div>
                  </footer>
                </>
              ) : (
                <div className="empty-state">
                  <BookOpen size={42} />
                  <h2>Uma nova possibilidade de aprender</h2>
                  <p>Adicione um módulo e uma página para começar.</p>
                </div>
              )}
            </div>
          </div>
          <div className="bottom-bar">
            <span>
              <Check size={13} />
              Salvamento automático ativado
            </span>
            <span>
              SCORM 1.2 · Moodle <span className="status-dot" />
            </span>
          </div>
        </main>
        <Properties course={course} block={block} />
      </div>
      <input
        hidden
        ref={importRef}
        type="file"
        accept="application/json"
        onChange={async (e) => {
          try {
            const file = e.target.files?.[0];
            if (!file) return;
            const parsed = validateCourse(JSON.parse(await file.text()));
            parsed.id = uid();
            s.addCourse(parsed);
            setModal(null);
          } catch (e) {
            alert("Falha na importação: " + String(e));
          } finally {
            if (importRef.current) importRef.current.value = "";
          }
        }}
      />
      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <section
            className={
              "modal " +
              (modal === "preview"
                ? "preview-modal"
                : modal === "magic"
                  ? "magic-modal"
                  : "")
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onKeyDown={(e) => {
              if (e.key !== "Tab") return;
              const nodes = Array.from(
                e.currentTarget.querySelectorAll<HTMLElement>(
                  'button:not([disabled]),input:not([hidden]),textarea,select,a[href],iframe,[tabindex="0"]',
                ),
              ).filter((x) => x.offsetParent !== null);
              const first = nodes[0],
                last = nodes.at(-1);
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
              }
            }}
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">SCORM STUDIO</span>
                <h2 id="modal-title">
                  {
                    {
                      library: "Cada bloco, uma possibilidade",
                      preview: "Experiência do aluno",
                      export: "Pronto para compartilhar?",
                      courses: "Seu espaço de cursos",
                      templates: "Um ponto de partida pedagógico",
                      analytics: "Resultados da aprendizagem",
                      gamification: "Reconheça cada conquista",
                      ai: "Assistente de planejamento",
                      magic: "Prompt Mágico",
                    }[modal]
                  }
                </h2>
              </div>
              <button
                className="icon-button"
                aria-label="Fechar"
                autoFocus
                onClick={() => setModal(null)}
              >
                <X size={20} />
              </button>
            </div>
            {modal === "library" && (
              <>
                <label className="search">
                  <Search size={18} />
                  <input
                    placeholder="Encontre um bloco…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <div className="block-library">
                  {Object.entries(labels)
                    .filter(([, name]) =>
                      name.toLowerCase().includes(search.toLowerCase()),
                    )
                    .map(([type, name], i) => (
                      <button
                        key={type}
                        onClick={() => {
                          s.addBlock(newBlock(type as BlockType));
                          setModal(null);
                        }}
                      >
                        <span className={"library-icon color-" + (i % 4)}>
                          {name.slice(0, 1)}
                        </span>
                        <strong>{name}</strong>
                        <small>
                          {[
                            "quiz",
                            "flashcards",
                            "hotspot",
                            "timeline",
                            "dragdrop",
                            "ordering",
                            "scenario",
                          ].includes(type)
                            ? "Atividade interativa"
                            : "Bloco de conteúdo"}
                        </small>
                        <Plus size={15} />
                      </button>
                    ))}
                </div>
              </>
            )}
            {modal === "preview" && (
              <iframe
                className="preview-frame"
                title="Prévia interativa do curso"
                sandbox="allow-scripts allow-same-origin allow-popups allow-modals allow-forms"
                srcDoc={preview}
              />
            )}
            {modal === "export" && (
              <div className="modal-body">
                <div className="export-summary">
                  <span className="export-icon">
                    <Download size={30} />
                  </span>
                  <div>
                    <h3>{course.title}</h3>
                    <p>
                      {course.modules.length} módulos · {pages.length} páginas ·{" "}
                      {pages.reduce((n, p) => n + p.blocks.length, 0)} blocos
                    </p>
                  </div>
                </div>
                <label className="field">
                  Formato do pacote
                  <select
                    value={version}
                    onChange={(e) =>
                      setVersion(e.target.value as typeof version)
                    }
                  >
                    <option value="1.2">
                      SCORM 1.2 — recomendado para Moodle
                    </option>
                    <option value="2004">
                      SCORM 2004 — LMS com suporte à versão
                    </option>
                  </select>
                </label>
                <div className="hint">
                  {version === "1.2"
                    ? "O pacote inclui conteúdo, mídias carregadas e registro de progresso, nota, tempo e respostas."
                    : "SCORM 2004 não tem suporte nativo completo no Moodle. Use somente em LMS compatível."}{" "}
                  Recursos externos precisam de conexão à internet.
                </div>
                <button
                  className="primary wide"
                  disabled={busy || publishingIssues(course).length > 0}
                  onClick={handleExport}
                >
                  <Download size={16} />
                  {busy ? "Preparando pacote…" : "Baixar curso_scorm.zip"}
                </button>
                {publishingIssues(course).length > 0 && (
                  <div className="hint" role="status">
                    <strong>Revise antes de publicar:</strong>
                    <ul>
                      {publishingIssues(course).map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  className="secondary wide"
                  onClick={() =>
                    download(
                      new Blob([JSON.stringify(course, null, 2)], {
                        type: "application/json",
                      }),
                      "curso-backup.json",
                    )
                  }
                >
                  Salvar backup editável JSON
                </button>
                <p role="status">{message}</p>
              </div>
            )}
            {modal === "courses" && (
              <div className="modal-body">
                <div className="action-row">
                  <button
                    className="primary"
                    onClick={() => {
                      s.addCourse(createCourse());
                      setModal(null);
                    }}
                  >
                    <Plus size={16} />
                    Novo curso
                  </button>
                  <button
                    className="secondary"
                    onClick={() => importRef.current?.click()}
                  >
                    <Upload size={16} />
                    Importar backup
                  </button>
                </div>
                {s.courses.map((c) => (
                  <button
                    className="course-list-item"
                    key={c.id}
                    onClick={() => {
                      s.select(c.id);
                      setModal(null);
                    }}
                  >
                    <BookOpen />
                    <div>
                      <strong>{c.title}</strong>
                      <small>
                        {c.modules.length} módulos · Atualizado{" "}
                        {new Date(c.updatedAt).toLocaleDateString("pt-BR")}
                      </small>
                    </div>
                    <ChevronRight size={18} />
                  </button>
                ))}
                <button
                  className="danger"
                  onClick={() => {
                    if (
                      confirm(
                        "Excluir o curso atual deste navegador? Faça um backup antes.",
                      )
                    ) {
                      s.removeCourse();
                      setModal(null);
                    }
                  }}
                >
                  Excluir curso atual
                </button>
                <button
                  className="secondary"
                  onClick={() => {
                    const c = duplicate(course);
                    c.title += " (cópia)";
                    s.addCourse(c);
                    setModal(null);
                  }}
                >
                  Duplicar curso atual
                </button>
              </div>
            )}
            {modal === "templates" && (
              <div className="template-grid">
                {Object.entries(templates).map(([name, template], i) => (
                  <button
                    key={name}
                    onClick={() => {
                      s.addCourse(fromTemplate(name));
                      setModal(null);
                    }}
                  >
                    <div className={"template-art color-" + (i % 4)}>
                      <GraduationCap size={40} />
                      <span>0{i + 1}</span>
                    </div>
                    <h3>{name}</h3>
                    <p>{template.description}</p>
                    <small className="template-journey">
                      {template.journey.join(" → ")}
                    </small>
                    <strong>
                      Usar template <ChevronRight size={14} />
                    </strong>
                  </button>
                ))}
              </div>
            )}
            {modal === "gamification" && <Gamification course={course} />}
            {modal === "analytics" && (
              <div className="modal-body">
                <p>
                  Os registros de alunos ficam no LMS. Importe um relatório JSON
                  da turma para consultar resultados neste dispositivo.
                </p>
                <label className="upload">
                  Importar relatório JSON
                  <input
                    type="file"
                    accept="application/json"
                    onChange={async (e) => {
                      try {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const rows = JSON.parse(await f.text());
                        if (
                          !Array.isArray(rows) ||
                          !rows.every(
                            (x) =>
                              typeof x.name === "string" &&
                              Number.isFinite(x.score) &&
                              Number.isFinite(x.progress) &&
                              Number.isFinite(x.minutes),
                          )
                        )
                          throw Error(
                            "Use uma lista com name, score, progress e minutes",
                          );
                        setReport(rows);
                      } catch (e) {
                        alert(String(e));
                      }
                    }}
                  />
                </label>
                {report.length ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Aluno</th>
                        <th>Progresso</th>
                        <th>Nota</th>
                        <th>Tempo</th>
                        <th>Atenção</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.map((r, i) => (
                        <tr key={i}>
                          <td>{r.name}</td>
                          <td>{r.progress}%</td>
                          <td>{r.score}%</td>
                          <td>{r.minutes} min</td>
                          <td>
                            {r.score < course.passScore
                              ? "Precisa de apoio"
                              : "Em dia"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <BarChart3 size={38} />
                    <h3>Aguardando dados da turma</h3>
                    <p>
                      Nenhum dado de aluno é inventado ou enviado a serviços
                      externos.
                    </p>
                  </div>
                )}
              </div>
            )}
            {modal === "ai" && <Assistant />}
            {modal === "magic" && <MagicPrompts />}
          </section>
        </div>
      )}
    </div>
  );
}
