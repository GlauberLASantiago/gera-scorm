# Contrato de integração de IA

O editor envia `POST` ao endpoint informado pelo autor, com `Content-Type: application/json`:

```json
{ "source": "Texto extraído ou fornecido pelo autor", "locale": "pt-BR" }
```

Resposta HTTP 200:

```json
{
  "summary": "Resumo do material",
  "objectives": ["Analisar o conceito apresentado"],
  "concepts": ["Aprendizagem ativa"],
  "glossary": [
    { "term": "Protagonismo", "definition": "Participação ativa do aluno" }
  ],
  "quiz": [
    {
      "question": "Qual proposta estimula participação?",
      "options": ["Resolver um problema", "Copiar sem discutir"],
      "correctIndex": 0
    }
  ],
  "activities": ["Proponha uma aplicação do conceito em sua aula."]
}
```

O backend deve autenticar usuários, limitar requisições, validar a saída do provedor, manter as chaves em variáveis de ambiente e permitir CORS para a origem do Pages. Não colocar chaves em variáveis `VITE_*`, pois elas são públicas. O conteúdo só é enviado quando o autor aciona a geração. O modo de preparar prompt não faz nenhuma chamada a provedor de IA.

A extração de PDF é local, limitada às primeiras 80 páginas e exige camada de texto. PDF escaneado precisa de OCR. Resultados da IA são revisados pelo autor antes de serem inseridos na página.
