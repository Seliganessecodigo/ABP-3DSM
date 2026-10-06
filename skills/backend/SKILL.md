---
name: greener-backend
description: Implementar ou revisar API, domínio, integrações, persistência ou segurança do backend GreenER em NestJS, TypeScript, PostgreSQL e TypeORM. Use ao trabalhar em backend/ ou serviços de servidor.
---

# Skill de backend GreenER

## Antes de editar

1. Leia `AGENTS.md`, a issue e os critérios de aceite relevantes.
2. Inspecione módulos, entidades, migrations, scripts e testes existentes em `backend/`.
3. Confirme contratos documentados das APIs auxiliares. Se documentação/schema/credenciais de sandbox não existem, registre bloqueio/dependência em vez de presumir o contrato.

## Arquitetura e implementação

- Use módulos NestJS por domínio e injeção de dependências. Controllers tratam HTTP/DTOs; services coordenam casos de uso; regras puras ficam fora do transporte e ORM.
- Separe acesso a dados em repositories injetáveis. Controllers não acessam TypeORM/DataSource diretamente e services de domínio não dependem de HTTP. Repositories não devem absorver regras de negócio.
- Separe acesso a serviços auxiliares em adapters/providers injetáveis, distintos dos repositories: providers cuidam de HTTP externo; repositories cuidam da persistência PostgreSQL.
- Apenas backend chama APIs auxiliares. Isole cada integração em adapter/provider com timeout, validação do payload, limites de concorrência e tratamento explícito de erros.
- Integre com o Agregador de Métricas (`/services` e `/metrics/{id_servico}`) e Serviço de Intensidade de Carbono conforme o contrato oficial atual. Normalize schemas externos para tipos/modelos internos; não espalhe payload de terceiros pela API pública do GreenER.
- Valide DTOs e parâmetros na borda da API. Respostas e erros devem ser estáveis e não revelar stack trace, segredo ou dado sensível.
- Use PostgreSQL/TypeORM conforme padrões existentes. Toda mudança estrutural persistente requer migration versionada; não habilite sincronização automática do schema em produção.
- Não apague ou sobrescreva histórico para representar mudança de estado/configuração. Mantenha versões e eventos conforme os requisitos da issue e do modelo atual.
- Diferencie zero legítimo de ausente, inválido, stale ou não calculável. Não substitua falha por zero nem remova aplicações por timeout/erro de origem.
- Ciclos de coleta devem impedir sobreposição e limitar concorrência conforme decisão/documentação aprovada. Falha em uma aplicação não deve cancelar o processamento independente das demais.
- Proteja rotas no backend; esconder botão ou rota no frontend não constitui autorização. Nunca registre senha, token, conexão ou payload sensível.
- Não invente fatores de carbono, coeficientes, unidades, limites ou política de retry; peça aprovação via issue quando faltarem.
- Para operações de domínio que usem múltiplos repositories, delimite transação na camada de aplicação/service. Não mantenha chamada HTTP externa dentro de transação longa de banco.
- Exponha API HTTP estruturada e documentada (OpenAPI), usando DTOs validados; classifique endpoints como públicos ou protegidos. JWT e papéis são validados no servidor.
- Modele as áreas do desafio conforme necessidade da issue: auth/users, applications, monitoring, metrics/states, calculations, dashboard/analysis, settings e audit. Preserve limites claros sem criar módulos vazios sem uso.
- Agendamento coleta serviços minuto a minuto conforme documento técnico, com ciclos sem sobreposição e chamadas de métricas paralelas sob limite configurado. Não confundir polling do browser com scheduler do backend.
- Mudanças persistentes usam migrations TypeORM versionadas. O schema precisa suportar usuários, aplicações/eventos, coletas, fatores regionais, configurações e ciclos/auditoria quando essas funcionalidades entrarem no escopo.
- Para cálculo: potência = CPU + memória + disco + rede; kWh = W × horas / 1000; CO₂e(g) = kWh × intensidade regional. Use os coeficientes oficiais fornecidos para o desafio, versionados; não crie valores substitutos.
- Registre operações manuais e automáticas relevantes com ator, ação, entidade, antes/depois, motivo, resultado e timestamp; use ator de sistema explícito e nunca grave segredos nos logs.
- Segurança inclui senha protegida, criação inicial do Admin, papéis Admin/Analyst/Visitor e retenção da autoria na auditoria após remoção lógica de usuário.
- A tela/endpoint de saúde deve distinguir falhas internas de indisponibilidade das APIs auxiliares e mostrar estado/duração/atraso do ciclo, contagens, status/última falha das fontes, pausa e dados stale.

## Testes e verificação

Adicione/ajuste testes pertinentes ao comportamento alterado. Cubra regras de domínio, casos inválidos e falhas sem depender de serviços reais.

Execute na pasta `backend/`, conforme o escopo:

```sh
npm ci
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build
```

Para persistência, migrations ou integração HTTP, use PostgreSQL isolado e registre como os testes podem ser reproduzidos. Não afirme sucesso sem executar ou observar o resultado no CI.

Priorize testes unitários para domínio (cálculos, estados, cobertura, conversões e validação), integração para fontes/persistência/falhas/timeouts/fatores, autorização para JWT/papéis/rotas/usuário removido e ao menos um fluxo ponta a ponta descoberta → coleta → classificação → cálculo → persistência → dashboard quando esse fluxo estiver implementado.

## Entrega

Na PR, descreva endpoints/contratos, migrations, regras de domínio, tratamento de falhas, verificações realmente executadas e limitações/dependências. Use título Conventional Commit, por exemplo `feat(backend): calcular energia por intervalo`.
