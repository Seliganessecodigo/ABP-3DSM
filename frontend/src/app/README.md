# app

Configuração central do aplicativo frontend: composição da aplicação, providers globais, rotas e inicialização dos recursos compartilhados pela interface.

Temas globais: `useTheme.ts` coordena a preferência local; o bootstrap bloqueante
em `public/theme-init.js` a aplica antes da primeira pintura. A aparência efetiva
é aplicada no elemento raiz e segue mudanças do sistema quando selecionado.
