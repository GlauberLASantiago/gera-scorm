import { useMemo, useState } from "react";
import { Check, Copy, Search, Sparkles } from "lucide-react";

export interface MagicPromptDefinition {
  title: string;
  description: string;
  prompt: string;
}

export const SCORM_TECHNICAL_CONTRACT = `
ATUE TAMBÉM COMO DESENVOLVEDOR ESPECIALISTA EM MOODLE E SCORM.

Crie um pacote SCORM 1.2 completo e funcional. Não entregue apenas orientações, exemplos parciais ou um único arquivo HTML.

REQUISITOS TÉCNICOS OBRIGATÓRIOS

1. Gere o arquivo final curso_scorm.zip. O ZIP não pode conter uma pasta externa envolvendo o curso.
2. Coloque imsmanifest.xml diretamente na raiz do ZIP.
3. Use esta estrutura mínima:
/
├── imsmanifest.xml
├── index.html
├── css/style.css
├── js/scorm-api.js
├── js/course.js
├── data/course.json
└── media/
4. Produza um imsmanifest.xml SCORM 1.2 válido, com schema ADL SCORM, schemaversion 1.2, recurso principal adlcp:scormtype="sco", href para index.html e todos os arquivos necessários declarados.
5. Implemente comunicação real com a API SCORM 1.2: procure a API de forma limitada nas janelas parent e opener; execute LMSInitialize(""), LMSGetValue(), LMSSetValue(), LMSCommit("") e LMSFinish(""); confira o retorno textual "true" e finalize somente uma vez.
6. Registre cmi.core.lesson_status, cmi.core.score.raw, cmi.core.score.min, cmi.core.score.max, cmi.core.lesson_location, cmi.core.session_time, cmi.core.exit, cmi.suspend_data e cmi.interactions para atividades avaliativas.
7. Salve página atual, progresso, respostas, tentativas e tempo. Use IDs estáveis e únicos, inclua um identificador do curso no estado salvo, elimine IDs desconhecidos ao restaurar e nunca permita progresso acima de 100% ou mais páginas concluídas que o total existente.
8. Use apenas questões com correção automática: múltipla escolha, múltiplas respostas, verdadeiro/falso, associação, ordenação e completar lacunas. Não crie questões dissertativas nem correção manual.
9. Antes de concluir uma página obrigatória, verifique se as atividades requeridas foram respondidas. Envie passed ou failed somente quando a avaliação estiver concluída; use incomplete durante o percurso.
10. Faça o curso funcionar sem framework, servidor ou compilação, usando HTML, CSS e JavaScript puros. Não dependa de CDN. Use apenas caminhos relativos e arquivos contidos no ZIP.
11. Implemente layout responsivo, HTML semântico, navegação por teclado, foco visível, contraste adequado, textos alternativos e botão de leitura em voz alta com Web Speech API no idioma solicitado, incluindo botão para interromper a leitura.
12. Mostre progresso, páginas concluídas, nota, feedback automático, navegação e retomada do ponto salvo.
13. Antes de entregar, valide o XML, confira os caminhos, abra index.html, teste o runtime com uma API SCORM simulada e confirme que o ZIP pode ser enviado diretamente a uma atividade SCORM do Moodle.

Se esta interface puder criar arquivos, anexe curso_scorm.zip. Se não puder, não afirme que o ZIP foi criado: entregue a árvore, o conteúdo integral de cada arquivo e um script que gere o ZIP.

Ao final, apresente um relatório curto com os arquivos incluídos, páginas, atividades, critérios de conclusão, campos SCORM registrados e testes realizados.`;

export const MAGIC_PROMPTS: MagicPromptDefinition[] = [
  {
    title: "Curso completo",
    description: "Acolhimento, conteúdo, prática interativa e avaliação final.",
    prompt: `Atue como designer instrucional. Crie um curso completo sobre [TEMA], para [PÚBLICO], no idioma [IDIOMA], com duração aproximada de [DURAÇÃO].

Organize a experiência em três módulos:
1. Acolhimento: apresentação, objetivos, quebra-gelo com três flashcards e ativação de conhecimentos prévios.
2. Conteúdo e prática: explicações curtas e corretas, exemplos concretos, linha do tempo ou sequência visual, flashcards, associação e ordenação.
3. Avaliação: cinco questões automáticas variadas, feedback explicativo, nota mínima de [NOTA]% e até [TENTATIVAS] tentativas.

Use linguagem acolhedora e adequada ao público. Inclua conclusão e síntese dos principais aprendizados.`,
  },
  {
    title: "Texto-base com questões",
    description:
      "Converte uma leitura em seis formas de verificação automática.",
    prompt: `Atue como designer instrucional. Transforme o texto abaixo em uma atividade de leitura e compreensão:

[TEXTO-BASE]

Público: [PÚBLICO]
Idioma: [IDIOMA]
Nível de dificuldade: [NÍVEL]

Crie duas páginas. Na primeira, organize título, introdução, texto em seções, conceitos destacados e síntese. Na segunda, inclua uma questão de múltipla escolha, uma de múltiplas respostas, uma de verdadeiro/falso, uma associação, uma ordenação e uma lacuna.

Todas as respostas devem estar fundamentadas no texto. Forneça feedback automático explicando acertos e erros.`,
  },
  {
    title: "Lição com caminhos",
    description: "Situação-problema com escolhas, consequências e desfechos.",
    prompt: `Atue como designer instrucional. Crie uma lição ramificada sobre [TEMA], destinada a [PÚBLICO], no idioma [IDIOMA].

Apresente uma situação-problema realista com duas escolhas iniciais, pelo menos três ramificações, consequências explicadas, possibilidade de explorar novamente, pelo menos dois desfechos, síntese final e uma questão automática sobre o conceito central.

Cada caminho deve ensinar algo relevante. Não trate escolhas inadequadas como simples punições: explique suas consequências pedagógicas, profissionais ou práticas. Registre a conclusão do cenário e a resposta da avaliação.`,
  },
  {
    title: "Questão relâmpago",
    description: "Uma pergunta para diagnóstico ou checagem rápida.",
    prompt: `Atue como designer instrucional. Crie uma experiência de página única contendo somente uma questão automática sobre [TEMA].

Público: [PÚBLICO]
Idioma: [IDIOMA]
Tipo: [MÚLTIPLA ESCOLHA / MÚLTIPLAS RESPOSTAS / VERDADEIRO OU FALSO / LACUNA]

Inclua uma introdução de no máximo duas frases, pergunta clara, alternativas plausíveis, gabarito, feedback explicativo, nova tentativa, nota final de 0 ou 100 e conclusão após o envio. A experiência deve servir para diagnóstico, checagem de compreensão ou encerramento de aula.`,
  },
  {
    title: "Flashcards interativos",
    description: "Coleção acessível de cartões para explorar conceitos.",
    prompt: `Atue como designer instrucional. Crie uma experiência de uma página sobre [TEMA], usando principalmente flashcards.

Público: [PÚBLICO]
Idioma: [IDIOMA]
Quantidade de cartões: [QUANTIDADE]

Na frente de cada cartão, apresente um conceito, pergunta ou provocação. No verso, ofereça explicação, exemplo ou aplicação. Garanta controle por clique e teclado e indicação visual de frente e verso. Organize os cartões em sequência pedagógica, com introdução e síntese.

Conclua a atividade somente depois que todos os cartões forem abertos. Não atribua nota, mas registre conclusão, progresso e tempo.`,
  },
  {
    title: "Missão lúdica",
    description: "Narrativa educacional com pistas, escolhas e desafio final.",
    prompt: `Atue como designer instrucional. Transforme [TEMA] em uma missão educacional lúdica para [PÚBLICO], no idioma [IDIOMA].

Crie apresentação da missão, personagem ou contexto, três pistas em flashcards, uma decisão com caminhos diferentes, desafio de ordenação, questão automática final e mensagem de missão concluída.

A narrativa deve apoiar o conteúdo sem infantilizar o público. Cada pista deve ensinar algo necessário para resolver o desafio. Registre separadamente a resposta avaliativa e a conclusão da missão.`,
  },
  {
    title: "Estudo de caso",
    description:
      "Decisões profissionais fundamentadas em dados e consequências.",
    prompt: `Atue como designer instrucional. Crie um estudo de caso sobre [TEMA OU PROBLEMA PROFISSIONAL].

Público: [PÚBLICO]
Idioma: [IDIOMA]
Contexto profissional: [CONTEXTO]

Apresente o caso, dados e evidências, identificação do problema, três decisões possíveis, consequências, explicação fundamentada da melhor alternativa e três questões automáticas. Use um cenário ramificado e não revele imediatamente a solução. Faça o estudante analisar evidências antes de decidir. Relacione o feedback de cada escolha aos conceitos estudados.`,
  },
  {
    title: "Linha do tempo",
    description: "Eventos, relações históricas e ordenação cronológica.",
    prompt: `Atue como designer instrucional. Crie uma experiência baseada em linha do tempo sobre [TEMA].

Público: [PÚBLICO]
Idioma: [IDIOMA]
Período ou etapas: [PERÍODO]

Inclua introdução, de seis a dez eventos, datas ou etapas, descrições curtas, relações de causa e consequência, atividade de ordenação cronológica, três questões automáticas e síntese sobre mudanças e permanências. Use imagens somente quando forem fornecidas ou legalmente disponíveis. Ofereça também uma lista textual acessível.`,
  },
  {
    title: "Revisão adaptativa",
    description: "O percurso muda conforme o resultado diagnóstico.",
    prompt: `Atue como designer instrucional. Crie uma revisão adaptativa sobre [TEMA], para [PÚBLICO], no idioma [IDIOMA].

Comece com três questões diagnósticas. Para desempenho baixo, apresente explicação básica, exemplos e flashcards. Para desempenho intermediário, ofereça revisão resumida e associação. Para desempenho alto, proponha desafio de aplicação. Todos os caminhos devem terminar na mesma avaliação final.

Permita explorar outros caminhos posteriormente. A nota enviada ao Moodle deve considerar apenas a avaliação final; o diagnóstico registra interações, mas não reduz a nota.`,
  },
  {
    title: "Aula multimídia acessível",
    description:
      "Mídia, transcrição e alternativas acessíveis no mesmo pacote.",
    prompt: `Atue como designer instrucional. Crie uma aula multimídia acessível sobre [TEMA], para [PÚBLICO], no idioma [IDIOMA].

Use somente estes materiais fornecidos:
[LISTA DE TEXTOS, IMAGENS, ÁUDIOS OU VÍDEOS]

Inclua apresentação, objetivos, texto introdutório, mídia principal, transcrição, legendas quando houver vídeo, descrição das imagens, pergunta automática, resumo e avaliação final com três questões variadas.

Não invente URLs ou arquivos ausentes. Quando uma mídia não for fornecida, crie espaço claramente marcado para substituição e mantenha alternativa textual funcional. Exija percentual assistido somente quando houver mídia reproduzível no pacote.`,
  },
];

export const buildMagicPrompt = (prompt: string) =>
  `${prompt.trim()}\n\n${SCORM_TECHNICAL_CONTRACT.trim()}`;

async function copyText(text: string) {
  if (navigator.clipboard?.writeText)
    return navigator.clipboard.writeText(text);
  const field = document.createElement("textarea");
  field.value = text;
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

export function MagicPrompts() {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");
  const filtered = useMemo(
    () =>
      MAGIC_PROMPTS.filter((item) =>
        `${item.title} ${item.description}`
          .toLocaleLowerCase("pt-BR")
          .includes(query.toLocaleLowerCase("pt-BR")),
      ),
    [query],
  );

  const handleCopy = async (item: MagicPromptDefinition) => {
    try {
      await copyText(buildMagicPrompt(item.prompt));
      setCopied(item.title);
      setError("");
      window.setTimeout(() => setCopied(""), 2200);
    } catch {
      setError(
        "Não foi possível copiar. Selecione o texto e copie manualmente.",
      );
    }
  };

  return (
    <div className="magic-prompts">
      <section className="magic-intro">
        <span className="magic-symbol">
          <Sparkles size={24} />
        </span>
        <div>
          <h3>Da ideia ao pacote SCORM</h3>
          <p>
            Escolha uma estrutura, substitua os campos entre colchetes e cole o
            prompt em uma IA capaz de criar arquivos. Cada modelo já inclui o
            contrato técnico SCORM 1.2 para Moodle.
          </p>
        </div>
      </section>
      <label className="search magic-search">
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar entre os 10 modelos…"
        />
      </label>
      <p className="magic-status" role="status" aria-live="polite">
        {error || (copied ? `“${copied}” copiado com o contrato técnico.` : "")}
      </p>
      <div className="magic-grid">
        {filtered.map((item, index) => (
          <article className="magic-card" key={item.title}>
            <div className="magic-card-heading">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
            <details>
              <summary>Conferir o prompt completo</summary>
              <pre>{buildMagicPrompt(item.prompt)}</pre>
            </details>
            <button className="primary" onClick={() => handleCopy(item)}>
              {copied === item.title ? <Check size={15} /> : <Copy size={15} />}
              {copied === item.title ? "Copiado" : "Copiar prompt"}
            </button>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty-state">
          <Search size={32} />
          <h3>Nenhum modelo encontrado</h3>
          <p>Tente outro termo de busca.</p>
        </div>
      )}
    </div>
  );
}
