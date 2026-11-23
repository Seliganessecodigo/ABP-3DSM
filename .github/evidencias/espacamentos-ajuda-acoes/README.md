# Espaçamentos, ajuda e ações por aplicação

- Espaçamentos: escala compartilhada de 4/8/12/16/24/32 px aplicada a títulos, controles, cards e seções. O SVG dos ícones respeita sua área, com 12 px antes do texto; não há caixas decorativas.
- Cobertura do período: calendário com confirmação. Composição de CO₂e: gráfico de setores.
- Ações do catálogo, em tabela e cards móveis: comparação e simulação regional pré-selecionam a aplicação. Os filtros do catálogo não passam para a análise; o período compatível com cada destino é preservado. Os símbolos são os mesmos da sidebar.
- Ranking: botão visível e desabilitado por decisão do usuário, até a implementação da página.
- Ajuda: dois cliques rápidos em Próximo perto do fim ultrapassavam o array de passos, deixando o modal aberto sem conteúdo nem controles. A navegação agora fica limitada aos passos existentes. O teste de regressão reproduziu o modal vazio antes da correção e passou depois; também são percorridos todos os passos das telas com ajuda.

Reprodução: `npx playwright test e2e/page-help.spec.ts -g "rapid advancement"`. Antes: falha por ausência de título no modal. Depois: conteúdo e botão de fechar disponíveis, modal fechado e foco devolvido ao acionador.

Capturas de Dashboard, catálogo e metodologia em 1440/390 px, com fixtures locais. São exemplos de apresentação; indisponibilidade das consultas ambientais ou autenticadas permanece explícita.
