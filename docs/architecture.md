# Arquitetura

Esta parte da documentação se destina a desenvolvimento e operação. Apresenta ambiente local, contratos e verificações. Para aprender a usar o produto, consulte o guia de uso.

## Documentação técnica {#components}

React 19/TypeScript/Vite apresenta os dados; NestJS/TypeORM/PostgreSQL 18 integra e persiste. Somente o backend acessa fontes auxiliares. Controllers tratam transporte, services coordenam casos de uso, adapters validam fontes e repositories persistem. Autenticação e papéis usam guards globais; `PublicRoute` explicita exceções públicas. Preferências pertencem ao usuário autenticado; auditoria fica em `backend/src/shared/audit/` e compartilha a transação das mutações bem-sucedidas.

```text
frontend/  React 19 · TypeScript · Vite
backend/   NestJS · TypeScript · TypeORM
PostgreSQL 18
frontend → GreenER API → auxiliary APIs
```

## Entrar na sua conta {#security}

O dashboard e as consultas ambientais são públicos. Em `/login`, use e-mail/senha ou Google quando habilitado. Admin precisa configurar ou confirmar TOTP de seis dígitos antes da sessão, inclusive após Google. Analyst e Visitor não recebem autorização administrativa. O frontend mantém a sessão em memória; recarregar exige novo login. O backend valida JWT, sessão, papel e estado atuais; credencial ausente/inválida resulta em 401, papel insuficiente em 403. Novas rotas são protegidas por padrão.

A API permite a Admin da mesma organização alterar contas entre `ACTIVE`, `BLOCKED` e `DEACTIVATED`, com `expectedStatus` e motivo obrigatório. Bloqueio/desativação revogam todas as sessões; reativação exige novo login. Há proteção da própria conta e do último Admin ativo. Estado esperado divergente retorna 409; estado desejado já alcançado é sucesso idempotente. A auditoria compartilhada grava sucesso na transação da alteração e negações fora da transação revertida, com ator explícito e sem segredos. Gestão completa de papéis e recuperação de senha não estão entregues por essa rota.

## Períodos e histórico {#data}

`from` e `to` exigem RFC 3339 com fuso explícito. O intervalo `[from,to)` é normalizado para UTC. A série aceita `hour`, `day`, `month` e `year`, com até 10.000 pontos; excesso é rejeitado. Resultados persistidos são rateados por sobreposição. Em conflito vence o maior `collectedAt`, seguido do ID lexical crescente, sem fallback para uma observação anterior se a vencedora não sustenta a métrica.

As métricas não incluem horário de medição na origem. O intervalo é derivado do recebimento menos `collection_interval_seconds`. O horário de consulta do fator não comprova vigência; fonte e validade não publicadas permanecem desconhecidas. Energia, fator e emissões persistem oito casas decimais; cobertura, quatro. Não há arredondamento intermediário. Energia e emissões preservam coberturas separadas e snapshots originais.

## Leitura relacionada {#related}

[Referência da API](./reference/api) · [Primeiros passos](./getting-started)

[ADR](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/adr) · [Design](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/design) · [Specs](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/specs)
