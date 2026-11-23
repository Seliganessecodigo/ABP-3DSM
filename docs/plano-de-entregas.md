# Plano de entregas e evidências

As entregas do GreenER combinam amplitude funcional, engenharia de software e rastreabilidade ambiental. Este documento apresenta as capacidades implementadas, as evidências dos 27 critérios da rubrica e as contribuições dos cinco integrantes nas três sprints, com links diretos para código, testes e documentação.

`2026-11-22` · `America/Sao_Paulo` · `240a2c26ecd2eb1b0adc184f4efe01799bab8a50`

## Produto integrado e engenharia {#engineering}

React 19 e TypeScript sustentam a interface; NestJS organiza a API em módulos e camadas, com injeção de dependências; TypeORM e PostgreSQL preservam os dados com migrations versionadas. Integrações validadas, auditoria transacional e snapshots de cálculo dão suporte à consistência dos indicadores.

Na base documentada, a CI aprovou 542 testes de frontend, 705 de backend e três fluxos integrados, além de lint, tipagem, builds, migrations e gate SonarQube Cloud. O site oferece 12 idiomas com verificação automática de equivalência de conteúdo, contratos e links.

[CI](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45084453486)

## Critérios e verificação {#criteria}

| Código | Pontos | Entrega | Verificação | Evidência apresentada |
| --- | ---: | --- | --- | --- |
| GA01 | 5 | Backlog | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Backlog estruturado |
| GA02 | 5 | Planejamento e capacidade | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Iterações e responsáveis no Project |
| GA03 | 5 | Critérios de aceite | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Critérios nas issues |
| GA04 | 4 | Acompanhamento | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | PRs e commits vinculados |
| GA05 | 3 | Incrementos | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| GA06 | 4 | Review e adaptação | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Revisões técnicas registradas |
| GA07 | 3 | Definição de pronto | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | DoD documentada |
| GA08 | 3 | Documentação e execução | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Documentação versionada |
| GA09 | 8 | Participação | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| DW01 | 3 | Tecnologias | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| DW02 | 5 | Integrações | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| DW03 | 4 | API e backend | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| DW04 | 4 | Persistência ORM | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| DW05 | 3 | Frontend | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| DW06 | 3 | Autenticação | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| DW07 | 3 | Containers | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| TP01 | 4 | Responsabilidades | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| TP02 | 4 | Injeção de dependências | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| TP03 | 4 | Tipos e legibilidade | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| TP04 | 4 | Testes unitários | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| TP05 | 4 | Validação e falhas | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| IHC01 | 3 | Usuários e tarefas | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| IHC02 | 3 | Fluxos e protótipos | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Protótipos e fluxos documentados |
| IHC03 | 3 | Indicadores e estados | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| IHC04 | 2 | Responsividade e feedback | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| IHC05 | 2 | Avaliação com usuários | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Protocolo de avaliação |
| IHC06 | 2 | Melhorias e reteste | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Feedback de interface registrado |

## Sprints e referências {#sprints}

| Sprint | Período | Capacidades integradas |
| --- | --- | --- |
| [Sprint 1](./sprints/sprint-1) | 2026-10-05 / 2026-10-18 | Fundação, catálogo e coleta |
| [Sprint 2](./sprints/sprint-2) | 2026-10-19 / 2026-11-01 | Indicadores, interface e autenticação |
| [Sprint 3](./sprints/sprint-3) | 2026-11-02 / 2026-11-15 | Histórico, análises e evolução operacional |

## Definition of Done {#done}

Critérios de aceite, integridade dos dados, testes, CI, documentação, acessibilidade e revisão compõem a Definition of Done. Cada entrega associa sua versão às evidências de verificação.

[Definition of Done](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/definition-of-done.md)

## Participação e fontes {#sources}

Os cinco integrantes têm contribuições incorporadas nas três sprints. As tabelas vinculam autoria Git a commits verificáveis e apresentam as tasks e os responsáveis registrados no Project, permitindo acompanhar a participação na construção do produto.

[GitHub Project](https://github.com/orgs/Seliganessecodigo/projects/2) · [Tasks](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/tasks.md) · [Git](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/historico.json)

## Evidências de qualidade {#quality-evidence}

Código, testes automatizados, contratos e documentação formam uma trilha de verificação das entregas. A matriz detalhada, o protocolo de usabilidade e os registros técnicos permitem examinar os fluxos, os critérios de qualidade e as evidências de cada dimensão do projeto.

[#489](https://github.com/Seliganessecodigo/ABP-3DSM/issues/489) · [IHC05 / IHC06](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/usabilidade.md) · [Review](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/revisao-2026-11-22.md)
