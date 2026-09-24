export type BlockType =
  | "text"
  | "heading"
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "link"
  | "code"
  | "formula"
  | "table"
  | "quote"
  | "quiz"
  | "flashcards"
  | "hotspot"
  | "timeline"
  | "dragdrop"
  | "ordering"
  | "scenario";
export type QuestionType =
  "single" | "multiple" | "boolean" | "matching" | "ordering" | "fill";
export interface Item {
  id: string;
  title: string;
  detail: string;
  target?: string;
  x?: number;
  y?: number;
  image?: string;
  date?: string;
  choices?: { label: string; target: string }[];
}
export interface Block {
  id: string;
  type: BlockType;
  title: string;
  body: string;
  url: string;
  alt: string;
  items: Item[];
  questionType: QuestionType;
  correct: string[];
  attempts: number;
  passScore: number;
  weight: number;
  feedback: string;
  timeLimit: number;
  required: boolean;
  watchedPercent: number;
  captions?: string;
  formulaHtml?: string;
  cues?: { id: string; seconds: number; question: string; answer: string }[];
}
export interface Page {
  id: string;
  title: string;
  kind: "page" | "activity" | "assessment";
  blocks: Block[];
}
export interface Module {
  id: string;
  title: string;
  pages: Page[];
}
export interface Badge {
  id: string;
  name: string;
  description: string;
  image: string;
  threshold: number;
}
export interface Course {
  id: string;
  schemaVersion: 1;
  title: string;
  description: string;
  author: string;
  updatedAt: string;
  modules: Module[];
  passScore: number;
  accent: string;
  badges: Badge[];
  certificate: boolean;
  gamification?: {
    readingXP: number;
    activityXP: number;
    quizXP: number;
    challengeXP: number;
    levels: { name: string; xp: number }[];
    challenges: { id: string; name: string; moduleId: string }[];
  };
}
export interface Attempt {
  blockId: string;
  answer: string[];
  score: number | null;
  time: number;
  date: string;
}
export interface Progress {
  completed: string[];
  attempts: Attempt[];
  seconds: number;
  location: string;
  watched: Record<string, number>;
}
export const emptyProgress = (): Progress => ({
  completed: [],
  attempts: [],
  seconds: 0,
  location: "",
  watched: {},
});
export const uid = () => crypto.randomUUID();
export const labels: Record<BlockType, string> = {
  text: "Texto rico",
  heading: "Título",
  image: "Imagem",
  video: "Vídeo",
  audio: "Áudio",
  pdf: "PDF",
  link: "Link",
  code: "Código",
  formula: "Fórmula",
  table: "Tabela",
  quote: "Citação",
  quiz: "Quiz",
  flashcards: "Flashcards",
  hotspot: "Hotspot",
  timeline: "Linha do tempo",
  dragdrop: "Arrastar e soltar",
  ordering: "Ordenação",
  scenario: "Cenário ramificado",
};
export const newBlock = (type: BlockType): Block => ({
  id: uid(),
  type,
  title: labels[type],
  body: type === "text" ? "Escreva aqui o conteúdo da aprendizagem." : "",
  url: "",
  alt: "",
  items: [
    { id: uid(), title: "Conceito A", detail: "Explicação A" },
    { id: uid(), title: "Conceito B", detail: "Explicação B" },
  ],
  questionType: "single",
  correct: [],
  attempts: 3,
  passScore: 70,
  weight: 1,
  feedback: "Revise o conteúdo e observe os conceitos apresentados.",
  timeLimit: 0,
  required: true,
  watchedPercent: 80,
});
export const newPage = (title = "Nova página"): Page => ({
  id: uid(),
  title,
  kind: "page",
  blocks: [],
});
export function createCourse(title = "Meu novo curso"): Course {
  return {
    id: uid(),
    schemaVersion: 1,
    title,
    description: "Uma nova jornada de aprendizagem começa aqui.",
    author: "Equipe pedagógica",
    updatedAt: new Date().toISOString(),
    modules: [
      { id: uid(), title: "Primeiros passos", pages: [newPage("Boas-vindas")] },
    ],
    passScore: 70,
    accent: "#216a55",
    certificate: true,
    badges: [
      {
        id: uid(),
        name: "Explorador",
        description: "Conclua sua primeira página",
        image: "",
        threshold: 1,
      },
    ],
  };
}
export const templates: Record<string, string[]> = {
  "Aula EAD": [
    "Objetivos",
    "Contextualização",
    "Conteúdo",
    "Exemplo",
    "Atividade",
    "Avaliação",
  ],
  "Artigo científico": [
    "Problema",
    "Referencial",
    "Método",
    "Resultados",
    "Discussão",
    "Quiz",
  ],
  "Formação docente": [
    "Problema real",
    "Fundamentação",
    "Experimentação",
    "Aplicação",
  ],
  "Laboratório criativo IA": [
    "Explorar",
    "Criar",
    "Testar",
    "Refletir",
    "Compartilhar",
  ],
};
export function fromTemplate(name: string) {
  const c = createCourse(name);
  c.modules[0].title = name;
  c.modules[0].pages = templates[name].map((title) => ({
    ...newPage(title),
    blocks: [
      {
        ...newBlock("text"),
        title,
        body: `Desenvolva ${title.toLowerCase()} nesta seção.`,
      },
    ],
  }));
  return c;
}
export function exampleCourse() {
  const c = createCourse("Aprendizagem que transforma");
  c.description =
    "Estratégias ativas para criar experiências educacionais significativas.";
  c.modules = [
    {
      id: uid(),
      title: "Fundamentos da aprendizagem",
      pages: [
        {
          ...newPage("Uma nova forma de aprender"),
          blocks: [
            {
              ...newBlock("heading"),
              title: "O conhecimento ganha vida quando fazemos parte dele.",
              body: "Bem-vindo à sua jornada de aprendizagem ativa.",
            },
            {
              ...newBlock("text"),
              title: "Aprender é construir conexões",
              body: "<p>Uma experiência significativa começa com uma boa pergunta. Nesta jornada, você vai explorar como transformar informação em <strong>conhecimento aplicado</strong>.</p><p>Observe, experimente e reflita. Cada atividade é um convite para participar.</p>",
            },
            {
              ...newBlock("quote"),
              title: "Paulo Freire",
              body: "Ensinar não é transferir conhecimento, mas criar as possibilidades para a sua própria produção ou a sua construção.",
            },
          ],
        },
        {
          ...newPage("Explore os conceitos"),
          kind: "activity",
          blocks: [
            {
              ...newBlock("flashcards"),
              title: "Conheça os princípios",
              items: [
                {
                  id: uid(),
                  title: "Protagonismo",
                  detail:
                    "O aluno participa ativamente da construção do conhecimento.",
                },
                {
                  id: uid(),
                  title: "Reflexão",
                  detail:
                    "A experiência se transforma em aprendizagem pela reflexão.",
                },
              ],
            },
          ],
        },
        { ...newPage("Coloque em prática"), kind: "assessment", blocks: [] },
      ],
    },
    {
      id: uid(),
      title: "Da teoria à prática",
      pages: [
        {
          ...newPage("Seu próximo desafio"),
          blocks: [
            {
              ...newBlock("text"),
              title: "Uma pequena mudança, um grande impacto",
              body: "Escolha uma aula que você já ministra. Como seus alunos poderiam participar mais ativamente? Registre uma mudança concreta.",
            },
            {
              ...newBlock("quiz"),
              title: "Qual ação representa um plano de aplicação concreto?",
              items: [
                {
                  id: "example-action-specific",
                  title: "Definir uma mudança observável e quando aplicá-la",
                  detail: "",
                },
                {
                  id: "example-action-vague",
                  title: "Apenas afirmar que a aula será melhor",
                  detail: "",
                },
              ],
              correct: ["example-action-specific"],
            },
          ],
        },
      ],
    },
  ];
  const q = newBlock("quiz");
  q.title = "Qual proposta favorece a aprendizagem ativa?";
  q.items = [
    {
      id: uid(),
      title: "Resolver um problema em grupo e discutir as soluções",
      detail: "",
    },
    { id: uid(), title: "Copiar definições sem discuti-las", detail: "" },
    { id: uid(), title: "Ouvir uma exposição sem participar", detail: "" },
  ];
  q.correct = [q.items[0].id];
  c.modules[0].pages[2].blocks = [q];
  return c;
}
