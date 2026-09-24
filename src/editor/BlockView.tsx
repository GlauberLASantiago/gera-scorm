import DOMPurify from "dompurify";
import { mathMarkup } from "../domain/math";
import {
  Image,
  Video,
  Music,
  FileText,
  Link,
  Code,
  MousePointer2,
  Layers,
  GitBranch,
  ArrowDownUp,
  HelpCircle,
} from "lucide-react";
import type { Block } from "../domain/model";
export function BlockView({ block: b }: { block: Block }) {
  switch (b.type) {
    case "heading":
      return (
        <div className="heading-block">
          <span className="eyebrow">UM CONVITE À DESCOBERTA</span>
          <h2>{b.title}</h2>
          <p>{b.body}</p>
          <div className="abstract-mark">
            <span />
            <span />
            <span />
          </div>
        </div>
      );
    case "text":
      return (
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(b.body) }}
        />
      );
    case "quote":
      return (
        <blockquote>
          <span>“</span>
          <p>{b.body}</p>
          <cite>{b.title}</cite>
        </blockquote>
      );
    case "image":
      return b.url ? (
        <figure>
          <img src={b.url} alt={b.alt} />
          <figcaption>{b.alt}</figcaption>
        </figure>
      ) : (
        <Placeholder
          icon={<Image />}
          title="Sua imagem, uma nova perspectiva"
        />
      );
    case "video":
      return (
        <Placeholder
          icon={<Video />}
          title={b.url || "Adicione um vídeo à experiência"}
        />
      );
    case "audio":
      return b.url ? (
        <audio controls src={b.url} />
      ) : (
        <Placeholder icon={<Music />} title="Adicione uma experiência sonora" />
      );
    case "pdf":
      return <Placeholder icon={<FileText />} title={b.title} />;
    case "link":
      return (
        <Placeholder
          icon={<Link />}
          title={b.url || "Adicione um recurso externo"}
        />
      );
    case "code":
      return (
        <pre>
          <Code size={16} />
          <code>{b.body || "// Seu código aqui"}</code>
        </pre>
      );
    case "formula":
      return (
        <div
          className="formula"
          dangerouslySetInnerHTML={{ __html: mathMarkup(b.body) }}
        />
      );
    case "table":
      return (
        <table>
          <tbody>
            {(b.body || "Conceito | Descrição\nExemplo | Detalhes")
              .split("\n")
              .map((row, i) => (
                <tr key={i}>
                  {row
                    .split("|")
                    .map((cell, j) =>
                      i ? <td key={j}>{cell}</td> : <th key={j}>{cell}</th>,
                    )}
                </tr>
              ))}
          </tbody>
        </table>
      );
    case "flashcards":
      return (
        <div>
          <div className="activity-label">
            <Layers size={16} /> FLASHCARDS
          </div>
          <h3>{b.title}</h3>
          <div className="flashcards">
            {b.items.map((i) => (
              <div key={i.id}>
                {i.title}
                <span>↻ Vire para descobrir</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "quiz":
      return (
        <div>
          <div className="activity-label">
            <HelpCircle size={16} /> VERIFIQUE SEU CONHECIMENTO
          </div>
          <h3>{b.title}</h3>
          {b.questionType === "open" ? (
            <textarea disabled placeholder="Espaço para reflexão do aluno" />
          ) : (
            b.items.map((i) => (
              <div className="quiz-option" key={i.id}>
                <span
                  className={b.correct.includes(i.id) ? "correct-dot" : ""}
                />
                {i.title}
              </div>
            ))
          )}
          <small>
            {b.attempts} tentativas · Nota mínima {b.passScore}%
          </small>
        </div>
      );
    case "timeline":
      return (
        <div className="timeline-view">
          <h3>{b.title}</h3>
          {b.items.map((i) => (
            <section key={i.id}>
              <b>{i.title}</b>
              <p>{i.detail}</p>
            </section>
          ))}
        </div>
      );
    default:
      return (
        <div>
          <div className="activity-label">
            {b.type === "scenario" ? (
              <GitBranch size={16} />
            ) : b.type === "hotspot" ? (
              <MousePointer2 size={16} />
            ) : (
              <ArrowDownUp size={16} />
            )}{" "}
            ATIVIDADE INTERATIVA
          </div>
          <h3>{b.title}</h3>
          {b.items.map((i) => (
            <div className="quiz-option" key={i.id}>
              {i.title}
              <span className="item-detail">{i.detail}</span>
            </div>
          ))}
        </div>
      );
  }
}
function Placeholder({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="media-placeholder">
      {icon}
      <p>{title}</p>
      <small>Configure o conteúdo no painel de propriedades</small>
    </div>
  );
}
