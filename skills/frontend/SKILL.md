---
name: greener-frontend
description: Implementar ou revisar funcionalidades do frontend GreenER em React, TypeScript e Vite. Use ao trabalhar em frontend/ ou em fluxos de interface consumidos pelo cliente.
---

# Skill de frontend GreenER

## Antes de editar

1. Leia `AGENTS.md`, a issue e os critérios de aceite relevantes.
2. Inspecione a estrutura atual em `frontend/src/` e reutilize convenções existentes.
3. Confirme o contrato da API no backend/OpenAPI ou issue relacionada. Não invente endpoint ou formato de resposta.

## Implementação

- Use React funcional e TypeScript estrito; evite `any` e coerções sem validação.
- Separe páginas, componentes reutilizáveis, hooks e serviços de API segundo a estrutura existente; não coloque regra de domínio em componentes.
- O backend é a fonte de verdade para cálculo de energia, CO₂e, estado operacional e autorização. O frontend formata e apresenta resultados.
- Consuma somente a API HTTP do GreenER; nunca chame diretamente o Agregador de Métricas nem o Serviço de Intensidade de Carbono. Siga os contratos OpenAPI/DTOs publicados pelo backend.
- Trate estados de carregamento, sucesso, vazio, erro e dados desatualizados conforme a tela exigir. Erro/vazio/ausente/não calculável nunca deve virar zero.
- Preserve filtros, período e seleção durante atualizações; evite requests sobrepostos e respostas antigas substituindo dados mais recentes.
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

Execute na pasta `frontend/`, de acordo com o escopo:

```sh
npm ci
npm run lint
npm run build
```

Na PR, descreva telas e estados implementados, contrato/API consumido, evidência visual e verificações realmente executadas. Use título Conventional Commit, por exemplo `feat(frontend): exibir detalhe da aplicação`.
