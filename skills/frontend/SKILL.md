---
name: greener-frontend
description: Implementar ou revisar funcionalidades do frontend GreenER em React, TypeScript e Vite. Use ao trabalhar em frontend/ ou em fluxos de interface consumidos pelo cliente.
---

# Skill de frontend GreenER

## Antes de editar

1. Leia `AGENTS.md`, a issue e os critérios de aceite relevantes.
2. Leia `frontend/src/README.md` e inspecione a tela/feature mais próxima; reutilize a estrutura e os componentes existentes.
3. Confirme o contrato da API no backend/OpenAPI ou issue relacionada. Não invente endpoint ou formato de resposta.

## Limites de responsabilidade

- `App.tsx` apenas compõe providers, layout e página escolhida pela rota. Roteamento fica em `app/`; não coloque telas, buscas, estado de página ou CSS nele.
- `pages/<tela>/` é dona do componente de rota, hooks e estado específicos da tela, consulta/parâmetros de URL, CSS Module e traduções dessa tela. Mantenha apresentação e fluxo da tela próximos.
- `features/<domínio>/` é dona dos tipos de transporte, validação de respostas, operações HTTP, cache e regras puras reutilizadas pelo domínio. Hooks de página chamam essa camada; componentes não interpretam payload HTTP.
- `components/` contém interface reutilizada por mais de uma tela ou infraestrutura visual compartilhada. Um componente usado por uma página permanece junto dela até existir uma segunda necessidade real.
- `styles/shared.css` contém somente regras realmente compartilhadas; estilos de página ficam em `<Tela>Page.module.css`, e os de componente compartilhado ficam junto ao componente. CSS global é limitado a reset, base, foco e variáveis visuais.
- Para criar tela, siga o roteiro e os contratos de namespace de `frontend/src/README.md`; mantenha catálogo de traduções por tela e todos os idiomas suportados completos, com inglês como fallback.
- Use React funcional e TypeScript estrito; evite `any` e coerções sem validação.
- Componentes apresentam dados e emitem ações; hooks coordenam estado e efeitos da tela; funções puras fazem transformações sem React. Mova regra para um módulo compartilhado somente quando houver propriedade de domínio ou reutilização real.

## Dados e comportamento

- O backend é a fonte de verdade para cálculo de energia, CO₂e, estado operacional e autorização. O frontend formata e apresenta resultados.
- Consuma somente a API HTTP do GreenER; nunca chame diretamente o Agregador de Métricas nem o Serviço de Intensidade de Carbono. Siga os contratos OpenAPI/DTOs publicados pelo backend.
- Trate estados de carregamento, sucesso, vazio, erro e dados desatualizados conforme a tela exigir. Erro/vazio/ausente/não calculável nunca deve virar zero.
- Preserve filtros, período e seleção durante atualizações. Cancele requisições ao desmontar/trocar contexto e impeça respostas antigas de sobrescreverem dados atuais; evite requests duplicados ou sobrepostos sem necessidade.
- Mantenha estado na menor área que o usa. Use URL para estado navegável/compartilhável e estado local para interação transitória; não introduza store global para estado de uma página.
- Não adicione memoização, cache ou biblioteca para antecipar performance. Reuse o mecanismo existente e otimize quando houver custo ou repetição observável.
- Todo texto visível ao usuário vem das traduções da tela/componente correspondente. Use `Intl` com a localidade atual para datas e números, sem concatenar textos que dependam da ordem gramatical.
- Para valores ambientais, mostre unidades, período e contexto necessários. Diferencie energia de emissões, estimativa de simulação e resultado não calculável quando o contrato trouxer esses dados.
- Use elementos semânticos, rótulos acessíveis, foco visível, navegação por teclado e texto/ícone junto de cor para indicar estados.
- A interface deve ser responsiva para navegadores e dispositivos móveis. Dashboard público não deve exigir login; não trate guards/menus do frontend como controle de autorização.
- Apresente país/região/cidade e, quando houver coordenadas válidas, a localização geográfica; ausência de latitude/longitude não pode ocultar as demais informações. Mapa é capacidade opcional, salvo priorização explícita em issue.
- Serviços ativos, indisponíveis, sem métricas e removidos têm representações textuais claras. Estados de erro/alerta também não dependem só de cor.
- Respeite dados do mesmo período em totais, ranking e comparação. Quando a comparação tiver cobertura parcial ou versões metodológicas distintas, mostre o aviso fornecido pelo backend.
- Dê suporte às evidências de IHC: protótipos dos fluxos prioritários, tarefas avaliadas, achados e melhorias pós-avaliação devem estar registrados nas issues/artefatos acordados pelo time.
- Nunca inclua segredos no código cliente. Variáveis Vite expostas ao bundle são públicas.
- Prefira CSS/componentes sem adicionar biblioteca ou design system não aprovado.

## Verificação e entrega

Adicione/ajuste testes para comportamento novo ou alterado, cobrindo estados de sucesso e falhas relevantes. Execute na pasta `frontend/`, conforme o escopo:

```sh
npm ci
npm run lint
npm run build
```

Na PR, descreva telas e estados implementados, contrato/API consumido, evidência visual e verificações realmente executadas. Use título Conventional Commit, por exemplo `feat(frontend): exibir detalhe da aplicação`.
