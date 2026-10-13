# Internacionalização do frontend

O frontend usa `i18next` com `react-i18next`; os recursos de idioma e a configuração ficam em `frontend/src/i18n.ts`. Consulte `frontend/README.md` para o fluxo de criação de chaves, fallback e formatação regional.

Locales suportados: `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP` e `zh-CN`. A escolha permanece no navegador via `localStorage` (`greener:locale`). Não persiste no backend. O fallback para traduções ausentes é inglês (`en-US`).

O seletor usa um padrão genérico acessível enquanto o protótipo da issue #210 não está disponível. A implementação segue os estados descritos na issue #212 e pode ser ajustada após a homologação do protótipo.

Toda nova tela e texto visível deve usar chaves de tradução. Não adicionar texto fixo aos componentes.
