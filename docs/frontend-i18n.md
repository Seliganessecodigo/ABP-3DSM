# Internacionalização do frontend

O frontend usa `i18next` com `react-i18next`. A configuração fica em `frontend/src/i18n.ts`; cada página mantém suas traduções em `frontend/src/pages/<tela>/locales/<locale>.ts`. Esses arquivos são registrados automaticamente no namespace da tela. Textos compartilhados ficam em `frontend/src/i18n/locales/`, no namespace `common`.

Cada página tem um componente e hooks próprios, junto das traduções. `App.tsx` compõe as páginas e o layout; o módulo de aplicações concentra acesso HTTP, validação das respostas e cache. Consulte [a organização do frontend](../frontend/src/README.md) e [o README da área](../frontend/README.md) para criar páginas, chaves, fallback e formatação regional.

Locales suportados: `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP` e `zh-CN`. A escolha permanece no navegador via `localStorage` (`greener:locale`). Não persiste no backend. O fallback para traduções ausentes é inglês (`en-US`).

O seletor usa um padrão genérico acessível enquanto o protótipo da issue #210 não está disponível. A implementação segue os estados descritos na issue #212 e pode ser ajustada após a homologação do protótipo.

Toda nova tela e texto visível deve usar chaves de tradução. Não adicionar texto fixo aos componentes.
