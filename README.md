# SCORM Studio Moodle Professional

Ferramenta de autoria educacional em React + TypeScript, com editor de blocos, cursos offline em IndexedDB, atividades e exportação ZIP SCORM.

## Executar

Requer Node.js 22 ou superior.

```bash
npm ci
npm run dev
```

Abra o endereço mostrado pelo Vite (normalmente http://127.0.0.1:5173). Não abra o `index.html` de código-fonte por `file://`: ele depende da compilação TypeScript.

```bash
npm test
npm run build
npm run preview
```

## Fluxo de autoria

1. Use o curso de exemplo carregado no primeiro acesso, crie um curso ou aplique um dos seis templates pedagógicos completos.
2. Edite módulos e páginas na esquerda. Arraste páginas para reorganizar; menus oferecem duplicação, exclusão e movimentação entre módulos.
3. Adicione blocos e personalize no painel direito. Há desfazer/refazer, backups JSON e prévia interativa.
4. Configure gabaritos e tentativas, mídias, conquistas e desafios. Corrija as pendências indicadas na exportação.
5. Exporte `curso_scorm.zip` e adicione uma atividade **Pacote SCORM** no Moodle.

## Recursos

- Conteúdo: texto rico, títulos/subtítulos, imagens, vídeo MP4/YouTube/Vimeo, áudio, PDF, links, código, fórmulas MathML, tabelas e citações.
- Quiz com correção automática: escolha única, múltiplas respostas, verdadeiro/falso, associação com arrastar/selecionar, ordenação e completar lacunas.
- Templates: leitura com questões variadas, lição ramificada, curso completo, questão única, interativo essencial e missão lúdica.
- Leitura em voz alta pelo navegador, respeitando o idioma configurado no curso.
- Prompt Mágico: dez modelos pedagógicos prontos para copiar, cada um acompanhado automaticamente por um contrato técnico SCORM 1.2 para Moodle.
- Interação: flashcards, hotspots posicionáveis, timeline, ordenação, associação e cenários com decisões e destinos.
- Mídias: legendas WebVTT, percentual de reprodução, perguntas temporizadas, anotações e marcações de PDF por página. Players externos dependem de disponibilidade, cookies e políticas do provedor; possuem alternativa de abertura externa e confirmação manual.
- Gamificação: XP, níveis, badges e desafios por módulo; visão do aluno e certificado imprimível.
- Resultados: importação de relatório JSON com `name`, `score`, `progress` e `minutes` (todos os campos numéricos em percentual/minutos, não strings).
- IA: texto/artigo/PDF, preparação de prompt e conexão a backend configurável. Consulte [contrato de IA](docs/AI.md).

## SCORM

Use **SCORM 1.2 no Moodle**. A [documentação oficial do Moodle](https://docs.moodle.org/en/SCORM_FAQ) informa que SCORM 2004 não é suportado nativamente de forma completa. A opção 2004 destina-se a LMS compatível e oferece objetivo e sequenciamento iniciais.

O reprodutor descobre a API em `parent`/`opener`, inicializa a sessão, envia nota/status/tempo, registra interações e salva retomada. `LMSFinish`/`Terminate` são chamados na saída. Pacotes têm `imsmanifest.xml`, `index.html`, `pages/`, `activities/`, `media/`, `css/`, `js/` e `data/`.

Os testes usam APIs de LMS simuladas. A compatibilidade no Moodle da instituição ainda precisa ser homologada: importar ZIP, responder uma avaliação, fechar o player, reabrir e verificar nota, status e retomada no relatório do Moodle. Não há certificação formal ADL.

## GitHub Pages

O workflow `.github/workflows/pages.yml` executa testes, build e publicação em cada push na branch `main`. Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions**. O Vite usa caminhos relativos para funcionar em `/gera-scorm/`.

O site é público, mas seus cursos autorais ficam no navegador. Publicar o editor não publica automaticamente os cursos que você cria nele. Exporte backups: limpeza dos dados do navegador remove o armazenamento local. O service worker conserva recursos já acessados para trabalhar offline após a primeira visita.

## Identidade visual

A interface usa a paleta `#D7CEC7`, `#A3A380`, `#464D4A`, `#FFFFFF` e `#BF695E`, com títulos em Syne e textos em Work Sans. O fundo ilustrado vem do repositório de estilos indicado pelo autor. As fontes Google Fonts e o fundo remoto dependem de conexão ou cache do navegador; sem conexão, permanecem as fontes sans-serif do sistema e a cor de fundo. A prévia e os novos pacotes SCORM usam a mesma tipografia e paleta, sem incluir a ilustração da interface como conteúdo do curso.

## Limites e integrações

- O Pages não fornece backend, autenticação multiusuário, banco central de alunos ou armazenamento de segredos. Integrações com Moodle e provedores de IA precisam de backend autorizado.
- O editor não importa projetos proprietários de Storyline, Rise, Genially ou H5P; essas ferramentas são referências conceituais.
- Marcação de PDF é textual, referenciada à página, não edição do arquivo PDF original. OCR não está incluído.
- Exportação de respostas, gabaritos e notas no navegador é adequada ao uso educacional usual; não constitui mecanismo antifraude para exames de alto risco.
- Arquitetura e caminhos de evolução: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
