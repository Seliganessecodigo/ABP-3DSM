# Revisão das traduções da aplicação

Base: `develop` em `3656eb0`. Solicitação direta do usuário, sem issue vinculada.

## Escopo

Revisão dos 84 catálogos nos 12 idiomas: português, inglês, espanhol, francês, alemão, italiano, japonês, chinês simplificado, coreano, russo, hindi e indonésio. Foram corrigidos ou adicionados 223 textos, preservando as interpolações.

| Problema encontrado | Correção |
| --- | --- |
| Login, Google e autenticação em duas etapas em inglês nos quatro idiomas mais recentes | Tradução integral dos quatro catálogos de login |
| Filtros do histórico com `????` em cinco idiomas | Rótulos legíveis em japonês, chinês, coreano, russo e hindi |
| Japonês romanizado e inglês nos campos de data | Datas, fuso e validação traduzidos em japonês e chinês |
| `schlie?en` e `Ning?n` | Correção dos caracteres em alemão e espanhol |
| Chave `lastCheck` sem tradução no catálogo | Uso do rótulo compartilhado de última verificação |
| Mensagens abertas permaneciam no idioma anterior | Tradução durante a renderização dos erros e das confirmações de cópia |
| Falha inicial de login falava em verificar código | Mensagem específica de falha de login nos 12 idiomas |

## Evidências visuais

- [Login em coreano](login-ko-KR.png).
- [Filtros do histórico em japonês](history-filters-ja-JP.png).

As capturas usam dados de teste. Nomes de aplicações, identificadores e informações recebidas das fontes permanecem conforme o contrato; não são traduções da interface.

## Verificação

- `npm ci`, `npm run lint` e `npm run build` em `frontend/`.
- Suíte unitária completa: 60 testes aprovados.
- Integridade de todos os namespaces: valores preenchidos, variáveis preservadas e detecção de caracteres corrompidos.
- Auditoria das 742 chamadas de tradução com chaves literais: nenhuma chave ausente após a correção de `lastCheck`.
- Regressão final: 62 testes aprovados (10 de integridade dos idiomas e 52 no Chromium). Cobrem rotas da aplicação, quatro abas de preferências, filtros do catálogo e histórico, login, Google e autenticação em duas etapas; troca de idioma com mensagens já abertas.
- O quality gate do SonarQube Cloud e os demais gates da CI devem ser aprovados antes do merge da PR.

Os testes verificam conteúdo e comportamento da interface com respostas HTTP controladas; não substituem testes de integração com os serviços reais nem uma revisão editorial externa por falantes nativos.
