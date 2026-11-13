# Internacionalização do frontend

O frontend usa `i18next` com `react-i18next`. A configuração fica em `frontend/src/i18n.ts`; cada página mantém suas traduções em `frontend/src/pages/<tela>/locales/<locale>.json`. O módulo `i18n.ts` da tela importa e verifica os doze idiomas em TypeScript e é registrado automaticamente no namespace da tela. Textos compartilhados ficam em `frontend/src/i18n/locales/`, no namespace `common`.

Cada página tem um componente e hooks próprios, junto das traduções. `App.tsx` compõe as páginas e o layout; o módulo de aplicações concentra acesso HTTP, validação das respostas e cache. Consulte [a organização do frontend](../frontend/src/README.md) e [o README da área](../frontend/README.md) para criar páginas, chaves, fallback e formatação regional.

Locales suportados: `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP`, `zh-CN`, `ko-KR`, `ru-RU`, `hi-IN` e `id-ID`. A escolha permanece no navegador via `localStorage` (`greener:locale`). Não persiste no backend. O fallback para traduções ausentes é inglês (`en-US`).

O conjunto canônico de locales está em `frontend/src/i18n/types.ts`. O site VitePress usa os mesmos doze idiomas; ao adicionar ou remover um, alinhe configuração, seletor, navegação e páginas equivalentes em `docs/`.

Toda nova tela e texto visível deve usar chaves de tradução. Não adicionar texto fixo aos componentes.
