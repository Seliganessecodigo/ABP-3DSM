# Responsividade das telas

Relato: o detalhe ambiental ficava compacto à esquerda em monitores grandes; catálogo e metodologia ficavam excessivamente centralizados. O dashboard também tinha limite próprio de largura.

## Reprodução e correção

O teste em Chromium mediu conteúdo de 1440 px para um workspace de 2368 px em QHD. A largura global limitada, combinada com margens diferentes por tela, explicava a distribuição inconsistente. O dashboard tinha um limite adicional de 1600 px. No celular, o cabeçalho do cálculo transbordava o card porque seu link não podia quebrar a linha.

As páginas passam a acompanhar a largura do workspace. O detalhe mantém as colunas e usa a altura disponível para o gráfico em desktops altos. Linhas, pontos e tooltip mantêm tamanho legível quando o SVG muda de proporção. Em tablets, o catálogo preserva a largura mínima das colunas e permite rolagem dentro da tabela.

## Verificação reproduzível

Em `frontend/`:

```sh
npm ci
npm run lint
npm run build
npm test
```

`e2e/responsive.spec.ts` verifica catálogo, dashboard, detalhe e metodologia com dados controlados em 320×740, 390×844, 768×1024, 1366×768, 1920×1080 e 2560×1440. As verificações incluem largura disponível, ausência de transbordamento nos cards visíveis, nomes longos em celular, detalhe sem rolagem vertical no desktop e tooltip acessível por mouse e teclado nos monitores maiores.

As capturas usam fixtures exclusivamente de teste. Valores e datas não representam monitoramento real. Conteúdo extenso, filtros expandidos e tabelas maiores podem exigir rolagem; nenhum dado é ocultado para forçar o encaixe em uma tela. Validação local em Chromium; outros navegadores não foram executados.

## Capturas

- [Catálogo em QHD](catalogo-qhd.png)
- [Dashboard em QHD](dashboard-qhd.png)
- [Detalhe em QHD](detalhe-qhd.png)
- [Metodologia em QHD](metodologia-qhd.png)
- [Dashboard em celular](dashboard-celular.png)
- [Detalhe em celular](detalhe-celular.png)

O resultado da suíte completa e o quality gate do SonarQube Cloud ficam registrados na PR para `develop`.
