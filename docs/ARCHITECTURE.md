# Arquitetura

O aplicativo é uma SPA estática. A autoria roda no navegador; pacotes exportados não dependem do editor, de CDN ou de servidor de aplicação. URLs externas de mídia continuam exigindo internet.

```
src/
  domain/        modelo versionado, templates, avaliação e validação
  state/         Zustand, seleção, histórico de desfazer e gravação serializada
  storage/       repositório IndexedDB (substituível por adaptador HTTP)
  editor/        renderização, propriedades, texto rico, multimídia e IA
  integrations/  contrato e cliente HTTP do serviço de IA
  scorm/         manifesto, ZIP e reprodutor portátil
public/          service worker do editor
.github/         build, testes e deploy Pages
```

O agregado `Course` possui `schemaVersion: 1`, módulos, páginas e blocos tipados. Identificadores independem da posição de exibição. Duplicações remapeiam gabaritos e referências. Importações são validadas antes da persistência. O armazenamento IndexedDB tem stores `courses` e `progress`; o player portátil usa SCORM suspend_data e cópia de retomada local, separada da prévia.

O runtime é uma função autocontida serializada pelo exportador. Isso mantém a prévia e o ZIP com a mesma lógica, sem carregar React dentro do Moodle. Testes com API simulada verificam a comunicação. O manifesto publica um SCO único com navegação interna. SCORM 2004 inclui objetivo de domínio e sequenciamento inicial, não um motor completo de sequencing multi-SCO.

O histórico completo de tentativas segue para `cmi.interactions`. Quando o JSON supera o limite garantido de suspend_data, a retomada usa índices compactos e contagens por atividade. Notas livres extensas e marcações ficam na cópia local nesse caso. O limite do formato é detectado; o conteúdo não é silenciosamente truncado.

Mídias carregadas são armazenadas como data URLs no agregado e materializadas em `media/` no ZIP. O limite da interface é 25 MB por arquivo; para cursos grandes, a evolução recomendada é um asset store com blobs e armazenamento externo. Dados locais não sincronizam automaticamente entre computadores.

O dashboard de turma importa registros reais em JSON. Uma aplicação estática não lê a base do Moodle diretamente; uma integração institucional precisa de backend autorizado. A IA também usa um endpoint de backend, sem chaves no frontend.

Extensões: para acrescentar um bloco, estender `BlockType`, a fábrica `newBlock`, o painel de propriedades, a prévia e o runtime; adicionar teste de exportação. Para backend, implementar a interface de métodos do repository, com autenticação e política de conflito explícitas.
