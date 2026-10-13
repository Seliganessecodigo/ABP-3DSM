# Protótipo temporário: seletor de idioma

**Issue:** #210 · **Status:** solução genérica para revisão, não substitui o Figma.

## Wireframe

```text
┌────────────────────────────────────────────────────────────────┐
│ GreenER · Monitoring                 Language [English (US) ▾]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Conteúdo da tela atual, exibido no idioma selecionado         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

O seletor fica no cabeçalho compartilhado pelo catálogo e pelo detalhe. Usa um controle nativo de seleção, com nome acessível e foco visível. A opção escolhida permanece visível no controle; trocar o idioma atualiza os textos sem recarregar a página.

## Opções

| Código | Nome mostrado no seletor |
| --- | --- |
| `pt-BR` | Português (Brasil) |
| `en-US` | English (US) |
| `es-ES` | Español |
| `fr-FR` | Français |
| `de-DE` | Deutsch |
| `it-IT` | Italiano |
| `ja-JP` | 日本語 |
| `zh-CN` | 简体中文 |

## Comportamento temporário

- Na primeira visita, usar um locale compatível com o navegador; se nenhum for suportado, iniciar em português brasileiro.
- Guardar a escolha no navegador em `greener:locale` e restaurá-la em visitas seguintes.
- Usar inglês (`en-US`) como fallback quando uma chave não existir no idioma ativo.
- Traduzir catálogo e detalhe no mesmo momento da troca, incluindo menu, filtros, estados, carregamento, vazio, erro e datas/números.
- Os recursos de idioma são locais e carregados junto com a aplicação; não há estado de carregamento de tradução nem chamada de rede para trocar idioma. Uma falha de chave usa o fallback inglês.
- O mesmo seletor atende visitantes e usuários autenticados; a preferência não é sincronizada com uma conta.

## Acessibilidade e adaptação

- O rótulo visível e o nome acessível do seletor são traduzidos.
- Teclado e leitor de tela usam o comportamento nativo do controle; o foco tem indicador visível.
- No celular, o controle permanece no cabeçalho, com o rótulo visual oculto apenas quando o nome acessível continua disponível.
- Textos longos podem aumentar a largura do controle; o layout deve permitir quebra ou rolagem sem esconder ações da tela.

## Revisão pendente

Este documento registra a alternativa temporária solicitada para continuar a implementação. O protótipo visual executável está na PR #216. A equipe ainda precisa substituir ou validar este wireframe no Figma e registrar a aprovação de UX/PO antes de encerrar #210.
