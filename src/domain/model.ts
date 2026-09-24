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
  language: string;
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
    language: "pt-BR",
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
export interface TemplateDefinition {
  description: string;
  journey: string[];
}
export const templates: Record<string, TemplateDefinition> = {
  "Leitura guiada + questões": {
    description:
      "Texto-base curto seguido por seis formatos de verificação automática.",
    journey: ["Ler", "Relacionar", "Aplicar", "Verificar"],
  },
  "Lição com percursos": {
    description:
      "Uma situação-problema em que cada escolha abre uma explicação diferente.",
    journey: ["Decidir", "Explorar caminhos", "Revisar", "Concluir"],
  },
  "Curso completo": {
    description:
      "Modelo com quebra-gelo, conteúdo, práticas interativas e avaliação final.",
    journey: ["Acolher", "Explicar", "Experimentar", "Avaliar"],
  },
  "Questão relâmpago": {
    description:
      "Uma única pergunta objetiva para diagnóstico, enquete ou checagem rápida.",
    journey: ["Perguntar", "Responder", "Receber resultado"],
  },
  "Interativo essencial": {
    description:
      "Uma página simples composta apenas por uma coleção de flashcards.",
    journey: ["Explorar", "Virar cartões", "Memorizar"],
  },
  "Missão lúdica": {
    description:
      "Uma página em formato de missão com narrativa, pistas e desafio de ordenação.",
    journey: ["Receber missão", "Investigar", "Escolher", "Resolver"],
  },
};

const richText = (title: string, body: string) => ({
  ...newBlock("text"),
  title,
  body,
});
const heading = (title: string, body: string) => ({
  ...newBlock("heading"),
  title,
  body,
});
const quiz = (
  title: string,
  questionType: QuestionType,
  answers: string[],
  correct: number[] | string[],
  feedback: string,
) => {
  const block = newBlock("quiz");
  block.title = title;
  block.questionType = questionType;
  block.items = answers.map((answer) => ({
    id: uid(),
    title: answer,
    detail: "",
  }));
  block.correct = correct.map((value) =>
    typeof value === "number" ? block.items[value]?.id || "" : value,
  );
  block.feedback = feedback;
  return block;
};
const page = (title: string, blocks: Block[], kind: Page["kind"] = "page") => ({
  ...newPage(title),
  kind,
  blocks,
});

function readingTemplate() {
  const c = createCourse("Leitura guiada: avaliação formativa");
  c.description =
    "Exemplo de texto-base acompanhado por questões automáticas variadas.";
  const matching = newBlock("quiz");
  matching.title = "Associe cada prática à sua finalidade";
  matching.questionType = "matching";
  matching.items = [
    {
      id: uid(),
      title: "Pergunta diagnóstica",
      detail: "Identificar conhecimentos prévios",
    },
    {
      id: uid(),
      title: "Feedback imediato",
      detail: "Orientar o próximo passo",
    },
    {
      id: uid(),
      title: "Nova tentativa",
      detail: "Permitir revisão e aprendizagem",
    },
  ];
  const ordering = newBlock("quiz");
  ordering.title = "Ordene um ciclo de avaliação formativa";
  ordering.questionType = "ordering";
  ordering.items = [
    { id: uid(), title: "Definir o objetivo", detail: "" },
    { id: uid(), title: "Coletar evidências", detail: "" },
    { id: uid(), title: "Interpretar as respostas", detail: "" },
    { id: uid(), title: "Ajustar a aprendizagem", detail: "" },
  ];
  c.modules = [
    {
      id: uid(),
      title: "Texto e compreensão",
      pages: [
        page("Texto-base", [
          heading(
            "Avaliar também é ajudar a aprender",
            "Leia o texto e use as questões para testar diferentes formas de compreensão.",
          ),
          richText(
            "Avaliação formativa",
            "<p>A avaliação formativa acontece <strong>durante</strong> a aprendizagem. Seu propósito não é apenas atribuir uma nota, mas produzir evidências que ajudem professor e estudante a decidir o próximo passo.</p><p>Uma boa atividade torna o objetivo visível, coleta respostas relevantes e oferece retorno em tempo adequado. Quando o estudante pode revisar uma ideia e tentar novamente, o erro deixa de ser apenas um resultado e se torna parte do percurso.</p><p>Por isso, perguntas curtas, associações e tarefas de ordenação podem cumprir funções diferentes: recuperar conhecimentos prévios, revelar relações entre conceitos ou verificar a compreensão de um processo.</p>",
          ),
          {
            ...newBlock("quote"),
            title: "Ideia-chave",
            body: "A evidência só se torna formativa quando orienta uma ação posterior.",
          },
        ]),
        page(
          "Questões variadas",
          [
            quiz(
              "Qual é o principal propósito da avaliação formativa?",
              "single",
              [
                "Orientar os próximos passos da aprendizagem",
                "Classificar definitivamente os estudantes",
                "Substituir todo o planejamento docente",
              ],
              [0],
              "A avaliação formativa usa evidências para orientar ações enquanto ainda há tempo para aprender.",
            ),
            quiz(
              "Quais práticas favorecem uma avaliação formativa?",
              "multiple",
              [
                "Explicitar o objetivo de aprendizagem",
                "Mostrar somente a nota final",
                "Permitir revisão e nova tentativa",
                "Ocultar os critérios da atividade",
              ],
              [0, 2],
              "Objetivos claros e oportunidades de revisão tornam o retorno utilizável.",
            ),
            quiz(
              "O erro pode funcionar como evidência para ajustar a aprendizagem.",
              "boolean",
              [],
              ["true"],
              "Correto: analisar o erro ajuda a escolher intervenções mais adequadas.",
            ),
            quiz(
              "Complete: o retorno que orienta o próximo passo é chamado de...",
              "fill",
              [],
              ["feedback"],
              "A resposta esperada é feedback.",
            ),
            matching,
            ordering,
          ],
          "assessment",
        ),
      ],
    },
  ];
  return c;
}

function branchingTemplate() {
  const c = createCourse("Lição com percursos: participação em sala");
  c.description =
    "Uma lição ramificada para explorar decisões pedagógicas e suas consequências.";
  const scenario = newBlock("scenario");
  scenario.title = "Escolha seu percurso";
  const start = uid();
  const diagnose = uid();
  const challenge = uid();
  const scaffold = uid();
  const deepen = uid();
  scenario.items = [
    {
      id: start,
      title: "A turma participa pouco",
      detail:
        "Durante uma discussão, poucas pessoas respondem. O que você quer investigar primeiro?",
      choices: [
        { label: "Verificar conhecimentos prévios", target: diagnose },
        { label: "Propor um desafio imediatamente", target: challenge },
      ],
    },
    {
      id: diagnose,
      title: "Você faz uma pergunta diagnóstica",
      detail:
        "As respostas mostram que parte da turma ainda confunde os conceitos centrais.",
      choices: [
        { label: "Oferecer pistas e um exemplo", target: scaffold },
        { label: "Aumentar a complexidade", target: deepen },
      ],
    },
    {
      id: challenge,
      title: "O desafio gera respostas desiguais",
      detail:
        "Alguns avançam, mas muitos ficam em silêncio por não saberem como começar.",
      choices: [
        { label: "Criar apoio em etapas", target: scaffold },
        { label: "Manter o desafio sem apoio", target: deepen },
      ],
    },
    {
      id: scaffold,
      title: "Percurso com apoio",
      detail:
        "Com um exemplo, tempo de conversa em duplas e pistas graduais, mais estudantes conseguem participar.",
    },
    {
      id: deepen,
      title: "Percurso de aprofundamento",
      detail:
        "A complexidade pode desafiar quem já domina a base, mas precisa ser combinada com apoios para não excluir os demais.",
    },
  ];
  const cards = newBlock("flashcards");
  cards.title = "Recursos para personalizar percursos";
  cards.items = [
    {
      id: uid(),
      title: "Diagnóstico",
      detail: "Descobrir de onde o estudante parte.",
    },
    {
      id: uid(),
      title: "Andaime",
      detail: "Oferecer apoio temporário para avançar.",
    },
    {
      id: uid(),
      title: "Aprofundamento",
      detail: "Ampliar o desafio de quem está pronto.",
    },
  ];
  c.modules = [
    {
      id: uid(),
      title: "Decisões pedagógicas",
      pages: [
        page(
          "Situação-problema",
          [
            heading(
              "Uma mesma turma, diferentes caminhos",
              "Tome decisões e observe como cada escolha altera a experiência.",
            ),
            scenario,
          ],
          "activity",
        ),
        page(
          "Síntese do percurso",
          [
            cards,
            quiz(
              "Qual decisão amplia a participação sem reduzir o desafio?",
              "single",
              [
                "Combinar diagnóstico, apoios graduais e aprofundamento",
                "Apresentar a mesma tarefa sem observar as respostas",
                "Eliminar qualquer situação desafiadora",
              ],
              [0],
              "Personalizar não significa simplificar: significa oferecer caminhos de acesso e avanço.",
            ),
          ],
          "assessment",
        ),
      ],
    },
  ];
  return c;
}

function completeTemplate() {
  const c = createCourse("Curso completo: aprendizagem ativa");
  c.description =
    "Exemplo completo com acolhimento, exposição dialogada, interações e avaliação.";
  const icebreaker = newBlock("flashcards");
  icebreaker.title = "Quebra-gelo: escolha uma provocação";
  icebreaker.items = [
    {
      id: uid(),
      title: "Curiosidade",
      detail: "O que você gostaria de descobrir hoje?",
    },
    {
      id: uid(),
      title: "Experiência",
      detail: "Quando você aprendeu algo fazendo?",
    },
    {
      id: uid(),
      title: "Desafio",
      detail: "O que costuma dificultar sua participação?",
    },
  ];
  const timeline = newBlock("timeline");
  timeline.title = "Ciclo de uma experiência ativa";
  timeline.items = [
    {
      id: uid(),
      title: "Mobilizar",
      detail: "Apresentar uma pergunta significativa.",
      date: "1",
    },
    {
      id: uid(),
      title: "Investigar",
      detail: "Buscar evidências e testar ideias.",
      date: "2",
    },
    {
      id: uid(),
      title: "Compartilhar",
      detail: "Comparar estratégias e argumentos.",
      date: "3",
    },
    {
      id: uid(),
      title: "Sistematizar",
      detail: "Nomear conceitos e consolidar relações.",
      date: "4",
    },
  ];
  const practice = newBlock("dragdrop");
  practice.title = "Relacione momento e intenção";
  practice.items = [
    {
      id: uid(),
      title: "Mobilizar",
      detail: "Despertar uma necessidade de aprender",
    },
    {
      id: uid(),
      title: "Investigar",
      detail: "Produzir e analisar evidências",
    },
    {
      id: uid(),
      title: "Sistematizar",
      detail: "Organizar o conhecimento construído",
    },
  ];
  c.modules = [
    {
      id: uid(),
      title: "Acolhimento",
      pages: [
        page(
          "Boas-vindas",
          [
            heading(
              "Aprender é participar",
              "Comece reconhecendo experiências, expectativas e perguntas do grupo.",
            ),
            icebreaker,
          ],
          "activity",
        ),
      ],
    },
    {
      id: uid(),
      title: "Conteúdo e experimentação",
      pages: [
        page("Conceitos essenciais", [
          richText(
            "O que torna a aprendizagem ativa?",
            "<p>Aprendizagem ativa não é apenas movimentar a turma. Ela acontece quando o estudante precisa <strong>tomar decisões cognitivas</strong>: comparar, explicar, criar, testar e revisar.</p><p>O professor desenha condições para essa participação, acompanha evidências e ajuda a transformar experiências em conceitos.</p>",
          ),
          timeline,
        ]),
        page("Prática guiada", [practice], "activity"),
      ],
    },
    {
      id: uid(),
      title: "Avaliação",
      pages: [
        page(
          "Desafio final",
          [
            quiz(
              "Qual atividade exige uma decisão cognitiva do estudante?",
              "single",
              [
                "Comparar duas soluções e justificar a escolha",
                "Copiar silenciosamente uma definição",
                "Assistir sem registrar ou responder",
              ],
              [0],
              "Comparar e justificar exige mobilizar critérios e produzir uma decisão.",
            ),
            quiz(
              "Selecione ações coerentes com a aprendizagem ativa",
              "multiple",
              [
                "Testar uma hipótese",
                "Explicar uma estratégia",
                "Repetir sem compreender",
                "Revisar uma solução após feedback",
              ],
              [0, 1, 3],
              "Testar, explicar e revisar tornam o pensamento do estudante observável.",
            ),
            quiz(
              "A participação ativa dispensa a sistematização de conceitos.",
              "boolean",
              [],
              ["false"],
              "Falso: a sistematização ajuda a transformar a experiência em conhecimento transferível.",
            ),
          ],
          "assessment",
        ),
      ],
    },
  ];
  return c;
}

function quickQuestionTemplate() {
  const c = createCourse("Questão relâmpago");
  c.description = "Uma checagem objetiva pronta para ser adaptada.";
  c.certificate = false;
  c.modules = [
    {
      id: uid(),
      title: "Checagem rápida",
      pages: [
        page(
          "Uma pergunta",
          [
            quiz(
              "Qual alternativa demonstra aprendizagem com compreensão?",
              "single",
              [
                "Explicar o conceito com um exemplo novo",
                "Repetir a frase sem relacioná-la a uma situação",
                "Memorizar apenas a posição da resposta",
              ],
              [0],
              "Criar um exemplo novo indica que o conceito pode ser mobilizado em outro contexto.",
            ),
          ],
          "assessment",
        ),
      ],
    },
  ];
  return c;
}

function interactiveTemplate() {
  const c = createCourse("Interativo essencial: galeria de conceitos");
  c.description = "Uma coleção simples de cartões interativos em página única.";
  c.certificate = false;
  const cards = newBlock("flashcards");
  cards.title = "Vire os cartões e descubra";
  cards.items = [
    {
      id: uid(),
      title: "Objetivo",
      detail: "O que o estudante deverá conseguir fazer.",
    },
    {
      id: uid(),
      title: "Evidência",
      detail: "O que permitirá observar a aprendizagem.",
    },
    {
      id: uid(),
      title: "Feedback",
      detail: "Informação que orienta o próximo passo.",
    },
    {
      id: uid(),
      title: "Transferência",
      detail: "Uso do conhecimento em uma situação diferente.",
    },
  ];
  c.modules = [
    {
      id: uid(),
      title: "Galeria",
      pages: [page("Conceitos em cartões", [cards], "activity")],
    },
  ];
  return c;
}

function playfulTemplate() {
  const c = createCourse("Missão lúdica: resgate do conhecimento");
  c.description =
    "Uma página narrativa com pistas, escolhas e um desafio final.";
  c.certificate = false;
  const clues = newBlock("flashcards");
  clues.title = "Mochila de pistas";
  clues.items = [
    {
      id: uid(),
      title: "Pista 1 · Objetivo",
      detail: "Descubra primeiro onde precisa chegar.",
    },
    {
      id: uid(),
      title: "Pista 2 · Evidência",
      detail: "Procure sinais observáveis de aprendizagem.",
    },
    {
      id: uid(),
      title: "Pista 3 · Ação",
      detail: "Use o resultado para decidir o próximo passo.",
    },
  ];
  const scenario = newBlock("scenario");
  scenario.title = "A porta dos critérios";
  const entry = uid(),
    evidence = uid(),
    guess = uid(),
    success = uid();
  scenario.items = [
    {
      id: entry,
      title: "Uma porta bloqueia o caminho",
      detail:
        "A inscrição diz: ‘Só passa quem sabe reconhecer aprendizagem’. O que você procura?",
      choices: [
        { label: "Uma evidência observável", target: evidence },
        { label: "Um palpite sem critério", target: guess },
      ],
    },
    {
      id: evidence,
      title: "Você encontra uma produção do estudante",
      detail:
        "Ela mostra explicação, exemplo e justificativa. A fechadura começa a brilhar.",
      choices: [{ label: "Usar a evidência", target: success }],
    },
    {
      id: guess,
      title: "O palpite não abre a porta",
      detail: "Sem um critério, não é possível justificar a decisão.",
      choices: [{ label: "Voltar e buscar evidências", target: evidence }],
    },
    {
      id: success,
      title: "Missão cumprida",
      detail:
        "A porta se abre: evidências ligadas a objetivos tornam a aprendizagem visível.",
    },
  ];
  const order = newBlock("ordering");
  order.title = "Ative o mecanismo final na ordem correta";
  order.items = [
    { id: uid(), title: "Definir o objetivo", detail: "" },
    { id: uid(), title: "Observar a evidência", detail: "" },
    { id: uid(), title: "Comparar com o critério", detail: "" },
    { id: uid(), title: "Escolher o próximo passo", detail: "" },
  ];
  c.modules = [
    {
      id: uid(),
      title: "A missão",
      pages: [
        page(
          "Resgate do conhecimento",
          [
            heading(
              "Sua missão começa agora",
              "Recupere as pistas, atravesse a porta e reorganize o mecanismo do conhecimento.",
            ),
            clues,
            scenario,
            order,
          ],
          "activity",
        ),
      ],
    },
  ];
  return c;
}

export function fromTemplate(name: string) {
  const builders: Record<string, () => Course> = {
    "Leitura guiada + questões": readingTemplate,
    "Lição com percursos": branchingTemplate,
    "Curso completo": completeTemplate,
    "Questão relâmpago": quickQuestionTemplate,
    "Interativo essencial": interactiveTemplate,
    "Missão lúdica": playfulTemplate,
  };
  return (builders[name] || readingTemplate)();
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
