# Verificação de entrega

- Compilação de produção TypeScript/Vite.
- Testes automatizados de gabaritos, respostas abertas, templates, namespaces e objetivos SCORM.
- APIs SCORM 1.2 e 2004 simuladas: inicialização, conclusão, nota, interações, retomada e commit.
- ZIP real aberto e inspecionado por JSZip: recursos do manifesto existem, XML é bem formado e runtime é JavaScript válido.
- Sanitização de HTML e proteção contra fechamento de script na prévia.
- Matemática exportada em MathML sem dependência de CDN.
- Revisão visual do editor e envio de quiz na prévia do build de produção.

## Homologação institucional pendente

Teste o pacote em uma instância de Moodle de homologação, na versão efetivamente usada pela instituição. Verifique: criação de atividade, primeira entrada, nota, interações, saída, retomada e conclusão. Essa validação exige acesso ao Moodle e não foi simulada como concluída.

Vídeos externos variam conforme CSP do LMS, cookies e permissão de incorporação do provedor. Legendas devem ser fornecidas pelo autor. Há navegação por teclado e alternativas aos gestos de arrastar, mas uma auditoria formal WCAG com leitores de tela não foi realizada.
