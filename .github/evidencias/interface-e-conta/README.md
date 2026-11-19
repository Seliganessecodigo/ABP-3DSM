# Padronização visual e fluxos de conta

Referências: revisão solicitada pelo usuário; ranking #74 e recuperação com token #160. Capturas em Chromium, pt-BR, com respostas controladas de teste. Os valores ambientais das imagens não são dados de produção.

## Antes e depois

| Área | Antes | Entrega |
| --- | --- | --- |
| Ajuda | Interrogação em botão com moldura | Ícone circular sem moldura; foco, diálogo nativo e conclusão preservados |
| Ranking | Cabeçalho, ordenação e ações próprios; sem ajuda | Breadcrumb, PageHelp, SortButton e ícones compartilhados; lista móvel sem cards aninhados |
| Formulários | Vários campos vazios sem indicação | Placeholders em campos compatíveis; datas mantêm o formato nativo e seletores suas opções |
| Detalhe | Botão de metodologia como item solto na grade | Link contextual no card de condição operacional |
| Comparação | Dois indicadores com ícones | Dez ícones distintos; só energia e emissões mantêm o destaque de medidas principais |
| Autenticação | Card excessivamente grande, marca decorativa e OAuth sem símbolo | Formulários compactos com espaçamentos comuns, símbolo Google e apresentação compartilhada |
| Senha | Sem ação em Minha conta; recuperação com texto de preparação | Troca autenticada e recuperação conectadas ao backend |
| Auditoria | Logins e renovações ocupavam a tabela | Exclusão de eventos rotineiros na consulta, antes de contagem e paginação; histórico preservado |
| Fonte de carbono | Nome de serviço técnico | Fatores regionais de carbono, que identifica o dado usado no cálculo |

## Evidências visuais

- [Login desktop](login-1440.png), [celular](login-390.png) e [celular escuro](login-390-escuro.png).
- [Recuperação](recuperacao-1440.png) e [Minha conta](minha-conta.png).
- [Ranking desktop](ranking-1440.png) e [celular](ranking-390.png).
- [Detalhe desktop](detail-operational-desktop.png) e [celular](detail-operational-mobile.png).
- [Comparação desktop](comparison-desktop.png) e [celular](comparison-mobile.png).

A revisão das capturas confirmou ausência de overflow horizontal no login e ranking a 390 e 1.440 px. Os testes do detalhe verificaram alinhamento e dimensões dos resumos e leitura a 996, 1.366 e 390 px.

## Unslop UI

Veredito: refinamento leve da apresentação existente. U1: removida a sobrancelha do ranking. U3/U4: mantidas apenas instruções que explicam período, cobertura, credenciais ou consequência de uma ação. U11: ícones aprovados pelo usuário preservados, sem caixas decorativas. U7: placeholders mantidos por solicitação explícita, com rótulos visíveis. Retiradas a marca de fundo do login e as bordas internas redundantes do ranking.

O contador heurístico final encontrou 91 candidatos: 2 títulos de grupos/confirmacão (U1), 4 ocorrências técnicas de preenchimento de datas (U2), 69 cadeias de metadados (U6) e 16 travessões de documentação/gramática russa. Não são 91 defeitos visuais. Não há tiles de ícones, badges decorativos ou status dots detectados. Metadados ambientais continuam visíveis quando necessários à interpretação.

## Verificações locais

- Frontend: npm ci, lint e build executados. O lint mantém três avisos preexistentes nos efeitos do ranking; build mantém aviso de tamanho do bundle.
- Navegador: cinco cenários focados passaram (recuperação, token expirado, troca de senha e ranking). Quatro cenários adicionais passaram para detalhe, comparação e conclusão da ajuda em metodologia e recálculo.
- Rodada ampla: 85 de 89 passaram. Duas expectativas TOTP fixam a porta 4173 e falharam na porta local alternativa 4190; dois casos de ajuda passaram na repetição isolada. A rodada reportou ausência de arquivo de trace durante execuções concorrentes. A CI usa a porta padrão.
- Backend: npm ci, lint, typecheck, test:cov e build executados; 475 testes passaram e 214 dependentes de PostgreSQL foram ignorados localmente. O Docker local retornou erro 500; a validação de banco fica com a CI isolada.
- Repetição focada: 18 testes de troca de senha, validação HTTP e consulta de auditoria passaram. LCOV cobriu 11/11 linhas executáveis adicionadas ao service de senha e 5/5 ao controller na coleta local.
- Foram acrescentados testes com PostgreSQL para revogação, alvo autenticado, rollback quando a auditoria falha e exclusão de logins antes da paginação. O quality gate da PR deve validar o código novo com o banco disponível.
