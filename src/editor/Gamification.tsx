import { Award, Plus, Trash2 } from "lucide-react";
import { uid, type Course } from "../domain/model";
import { useStudio } from "../state/store";
export const defaultGame = {
  readingXP: 50,
  activityXP: 75,
  quizXP: 100,
  challengeXP: 200,
  levels: [
    { name: "Explorador", xp: 0 },
    { name: "Criador", xp: 300 },
    { name: "Especialista", xp: 800 },
  ],
  challenges: [] as { id: string; name: string; moduleId: string }[],
};
export function Gamification({ course }: { course: Course }) {
  const update = useStudio((s) => s.update);
  const game = course.gamification || defaultGame;
  const edit = (fn: (g: typeof defaultGame) => void) =>
    update((c) => {
      c.gamification = structuredClone(c.gamification || defaultGame);
      fn(c.gamification);
    });
  return (
    <div className="modal-body">
      <p>
        Configure pontos, níveis, conquistas e desafios para reconhecer o
        progresso.
      </p>
      <div className="game-grid">
        {(["readingXP", "activityXP", "quizXP", "challengeXP"] as const).map(
          (k) => (
            <label className="field" key={k}>
              {
                {
                  readingXP: "Leitura",
                  activityXP: "Atividade",
                  quizXP: "Quiz aprovado",
                  challengeXP: "Desafio",
                }[k]
              }{" "}
              (XP)
              <input
                type="number"
                min="0"
                value={game[k]}
                onChange={(e) =>
                  edit((g) => {
                    g[k] = Math.max(0, +e.target.value);
                  })
                }
              />
            </label>
          ),
        )}
      </div>
      <h3 className="section-heading">Níveis</h3>
      {game.levels.map((level, i) => (
        <div className="badge-editor" key={i}>
          <input
            aria-label="Nome do nível"
            value={level.name}
            onChange={(e) =>
              edit((g) => {
                g.levels[i].name = e.target.value;
              })
            }
          />
          <label>
            XP mínimo
            <input
              type="number"
              min="0"
              value={level.xp}
              onChange={(e) =>
                edit((g) => {
                  g.levels[i].xp = Math.max(0, +e.target.value);
                })
              }
            />
          </label>
        </div>
      ))}
      <h3 className="section-heading">Badges</h3>
      {course.badges.map((badge, i) => (
        <div className="badge-editor" key={badge.id}>
          <Award />
          <div className="badge-fields">
            <label className="field">
              Nome
              <input
                value={badge.name}
                onChange={(e) =>
                  update((c) => {
                    c.badges[i].name = e.target.value;
                  })
                }
              />
            </label>
            <label className="field">
              Descrição
              <input
                value={badge.description}
                onChange={(e) =>
                  update((c) => {
                    c.badges[i].description = e.target.value;
                  })
                }
              />
            </label>
            <label className="field">
              Imagem (URL)
              <input
                value={badge.image}
                onChange={(e) =>
                  update((c) => {
                    c.badges[i].image = e.target.value;
                  })
                }
              />
            </label>
          </div>
          <label>
            Páginas concluídas
            <input
              type="number"
              min="1"
              value={badge.threshold}
              onChange={(e) =>
                update((c) => {
                  c.badges[i].threshold = Math.max(1, +e.target.value);
                })
              }
            />
          </label>
          <button
            className="icon-button"
            aria-label="Excluir badge"
            onClick={() =>
              update((c) => {
                c.badges.splice(i, 1);
              })
            }
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        className="secondary"
        onClick={() =>
          update((c) =>
            c.badges.push({
              id: uid(),
              name: "Nova conquista",
              description: "Continue aprendendo",
              threshold: 1,
              image: "",
            }),
          )
        }
      >
        <Plus size={16} />
        Adicionar badge
      </button>
      <h3 className="section-heading">Desafios de módulo</h3>
      {game.challenges.map((challenge, i) => (
        <div className="badge-editor" key={challenge.id}>
          <input
            aria-label="Nome do desafio"
            value={challenge.name}
            onChange={(e) =>
              edit((g) => {
                g.challenges[i].name = e.target.value;
              })
            }
          />
          <select
            aria-label="Módulo do desafio"
            value={challenge.moduleId}
            onChange={(e) =>
              edit((g) => {
                g.challenges[i].moduleId = e.target.value;
              })
            }
          >
            {course.modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
          <button
            className="icon-button"
            aria-label="Excluir desafio"
            onClick={() =>
              edit((g) => {
                g.challenges.splice(i, 1);
              })
            }
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        className="secondary"
        onClick={() =>
          edit((g) =>
            g.challenges.push({
              id: uid(),
              name: "Conclua todas as páginas do módulo",
              moduleId: course.modules[0]?.id || "",
            }),
          )
        }
      >
        <Plus size={16} />
        Adicionar desafio
      </button>
    </div>
  );
}
