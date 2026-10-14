# Issue tracker: GitHub

Issues e especificações deste repositório vivem no GitHub Issues. Use o cliente `gh` para as operações.

## Convenções

- Criar issue: `gh issue create --title "..." --body "..."`.
- Ler issue: `gh issue view <número> --json number,title,body,labels,comments`.
- Listar issues: `gh issue list --state open --json number,title,body,labels,comments`.
- Comentar em issue: `gh issue comment <número> --body "..."`.
- Aplicar ou remover labels: `gh issue edit <número> --add-label "..."` ou `--remove-label "..."`.
- Fechar issue: `gh issue close <número> --comment "..."`.

O repositório é inferido do remote Git configurado. Pull requests não são superfície de solicitação para triagem.

## Publicação

Quando uma skill pedir publicação no rastreador, crie uma GitHub Issue.

Quando uma skill pedir o ticket relevante, leia a issue conforme a convenção acima.
