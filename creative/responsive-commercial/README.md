# GreenER — produto em movimento

## Versão atual: v4 — o conteúdo conduz o movimento

O usuário considerou os tipos de transição da v3 adequados, mas apontou que eram aleatórios em relação ao conteúdo. A v4 segue um percurso único da aplicação **`app-pagamentos` / `svc-0142`**, com ações que motivam cada passagem. Mantém as versões anteriores para comparação. A execução criativa da v4 aguarda avaliação do usuário.

| Tempo | Ação e movimento |
| --- | --- |
| 0–2,8 s | Busca real: vazio → `pa` → `paga` → `pagamentos`. Aproximação e destaque do resultado. |
| 2,8–5,5 s | A linha selecionada sai da tabela, percorre uma diagonal e assume o cartão do layout móvel. |
| 5,5–6,4 s | Leitura do cartão e toque no link real **Ver detalhes**. |
| 6,4–8,8 s | O próprio cartão se expande até a tela de detalhe. Nome e estado acompanham o movimento. |
| 8,8–10 s | Detalhe da mesma aplicação e início de rolagem. |
| 10–12,8 s | A rolagem conduz o movimento ascendente e a abertura do mesmo detalhe no computador. |
| 12,8–17,2 s | Leitura no desktop e afastamento para revelar os dois dispositivos com a mesma aplicação. |
| 17,2–20 s | Marca e assinatura. |

`capture-story.mjs` percorre o frontend real: digita a busca e clica no resultado para abrir `/services/svc-0142`. Gera sete capturas claras novas e `assets/story-geometry.js`, com as coordenadas DOM reais da linha/cartão, nome, estado, busca e ação. Nenhuma troca de tema participa da v4. Dados de exemplo seguem o contrato e as mesmas fixtures já documentadas nesta pasta; não há dados ambientais fabricados.

`story-v4.html` usa essas posições para manter o mesmo nome e estado como elementos contínuos. Durante a transformação, as demais informações recuam e o nome/estado ganham destaque antes de ocupar suas posições no novo layout. A tipografia intermediária usa o texto, a fonte e a cor medidos na interface. Essas transformações pertencem ao comercial; não representam animações implementadas no site.

```powershell
node creative/responsive-commercial/verify-story.mjs frontend
node creative/responsive-commercial/render-v4.mjs frontend 'C:/caminho/ffmpeg.exe'
```

Saídas isoladas em `output/story-v4/`: `greener-story-v4.mp4` (20 s, 1080p, 30 fps), áudio, quadros, storyboard e relatório. A prévia editável é `story-v4.html`; `--storyboard` gera apenas os quadros. A evidência versionada é `assets/storyboard-v4.png`. A trilha sintética original acompanha os quatro momentos de passagem, sem locução.

Para atualizar as capturas, inicie o frontend desejado na porta 4189 e execute `node creative/responsive-commercial/capture-story.mjs frontend http://127.0.0.1:4189`. Os assets `story-*` são exclusivos desta versão.

O teste confere a identidade nas sete capturas, a ordem busca/clique/rolagem, o nome dentro do quadro em todos os 601 instantes amostrados, a continuidade do nome nos sete encaixes, controles da prévia e ausência de erros JavaScript. Ele não avalia subjetivamente a direção criativa. Os arquivos do frontend/backend permanecem intactos.

## V3 — referência técnica anterior

A direção de movimento da v2 foi aceita pelo usuário como referência, com pedido explícito de uma versão corrigida. **`motion-v3.html` / `render-v3.mjs`** entregam o novo corte de **14 segundos**, com quatro passagens em direções diferentes, aproximações, giros e pausas curtas para reconhecer o produto. V1 e v2 permanecem intactas.

O teste `verify-motion.mjs` reproduziu na v2 duas capturas expostas no mesmo recorte nas quatro passagens e o título inicial fora do quadro. Na v3, uma única superfície apresenta uma captura por vez, com proporção preservada. A captura muda quando a superfície está de perfil; posição, escala e rolagem da imagem permanecem contínuas. Títulos ficam na composição frontal, e as telas de fundo que disputavam atenção foram removidas. A ampliação/rotação pode cruzar os limites do quadro durante movimentos intencionais; nos enquadramentos de leitura o dispositivo fica inteiramente visível.

```powershell
node creative/responsive-commercial/verify-motion.mjs frontend
node creative/responsive-commercial/render-v3.mjs frontend 'C:/caminho/ffmpeg.exe'
```

O teste também pode receber `motion-study.html` como terceiro argumento para reproduzir as falhas conhecidas da v2. Na v3, verifica troca de captura de perfil, continuidade nos limites das cenas, uma textura por quadro, enquadramentos de leitura e ausência de erros de JavaScript. Essa verificação não substitui a avaliação visual do movimento.

Saídas da v3: `output/study-v3/greener-motion-v3.mp4`, áudio, storyboard, quadros e relatório. A prévia editável é `motion-v3.html`; `--storyboard` no renderizador gera apenas os quadros de revisão. O storyboard versionado fica em `assets/storyboard-v3.png`. O áudio segue a trilha sintética original, com os efeitos reposicionados para as quatro passagens. Sem locução.

Ritmo: abertura até 1,2 s; diagonal lateral até 3,2 s; pausa; giro vertical de 4,1 a 6,1 s; pausa; giro diagonal de 7 a 9 s; pausa; chegada à marca de 9,9 a 11,9 s; assinatura até 14 s. O conceito mantém capturas reais com dados ilustrativos e a indisponibilidade ambiental da implementação atual. As animações pertencem ao comercial.

## Feedback e estudo v2

O usuário rejeitou a linguagem do primeiro corte: o cubo lateral ficou literal e repetitivo. A referência desejada é um comercial conceitual de moda/perfume: aproximação do sujeito, um movimento que puxa a cena seguinte e novas poses/perspectivas conectadas, com passagens em várias direções. Citou também a troca de dimensões de “Multiverso da Loucura” como analogia de energia e continuidade. O corte v1 permanece disponível para comparação; sua direção de movimento não está aprovada.

`motion-study.html` e `render-study.mjs` produzem um **estudo de 12 segundos**. A câmera percorre um mundo contínuo com interfaces reais, aproximação, deslocamento diagonal, subida, inclinação e meia-volta. Passagens em primeiro plano transportam a interface entre os enquadramentos com revelações por lados diferentes. O estudo reutiliza os assets capturados; não altera a aplicação. O usuário gostou da direção e solicitou a correção dos defeitos visuais na v3.

```powershell
node creative/responsive-commercial/render-study.mjs frontend 'C:/caminho/ffmpeg.exe'
```

Saídas independentes em `output/study-v2/`: `greener-motion-study-v2.mp4`, `soundtrack.wav`, storyboard, quadros e relatório. Para revisar apenas os quadros antes de exportar, acrescente `--storyboard`. A prévia `motion-study.html` usa o áudio dessa subpasta. O storyboard de referência v2 está em `assets/storyboard-study-v2.png`. Os arquivos do corte v1 permanecem intactos.

Corte de exploração de **26 segundos, 1920 × 1080, 30 fps**, para o usuário avaliar se a linguagem de movimento corresponde à referência que descreveu. Esta versão é um conceito separado do comercial das pegadas, preservado na branch `feat/comercial-greener` / PR #333.

## Intenção

O usuário descreveu um comercial dinâmico, semelhante a um editorial de moda: uma cena passa lateralmente para a seguinte com continuidade, como faces conectadas de um cubo. Quer alternâncias frequentes entre computador e celular, com linguagem visual limpa associada a apresentações de produto da Apple. A referência central é a **passagem entre cenas**, além de mostrar responsividade.

Implementação: seis rotações de 90° em CSS 3D, com duas faces visíveis nos pontos médios, pequeno afastamento e inclinação da câmera. Cada face contém uma composição Canvas de um dispositivo com a captura real da aplicação. As imagens têm aproximações e rolagens suaves. A trilha eletrônica sintética original tem 108 BPM e sopros sincronizados com as viradas. Sem locução ou áudio de campanhas existentes.

## Sequência

| Cena | Entrada | Composição |
| --- | --- | --- |
| 1 | 0 s | Catálogo no computador: “Encontre. Acompanhe.” |
| 2 | 4,4 s | Catálogo no celular: “A mesma visão. Na sua mão.” |
| 3 | 8,1 s | Detalhe no computador: “Cada detalhe importa.” |
| 4 | 11,8 s | Detalhe no celular: “Continue. De onde estiver.” |
| 5 | 15,5 s | Catálogo desktop escuro: “Clareza, em qualquer modo.” |
| 6 | 19,2 s | Catálogo móvel escuro: “O formato muda. O foco continua.” |
| 7 | 22,4 s | Dois dispositivos, logo e “A visão completa. Em qualquer tela.” |

Cada transição começa 1,1 segundo antes da entrada da cena seguinte. A assinatura final permanece **“Keep track. Keep it GreenER.”**

## Fidelidade e origem

- As capturas foram feitas no frontend do workspace original em 03/11/2026, incluindo a identidade visual que estava em edição. O código da aplicação permaneceu intacto.
- Desktop: viewport 1440 × 900, DPR 1. Celular: 390 × 844, DPR 2. As capturas são de página inteira para permitir rolagem na composição.
- Tabela e cartões móveis, tema claro/escuro e tela de detalhe são interfaces reais. A alternância de dispositivos é edição do comercial; não representa sincronização automática entre aparelhos.
- Quatro aplicações ilustrativas usam o contrato existente. Evidências operacionais reutilizam os valores/exemplos de `frontend/e2e/application-detail.spec.ts`; memória ausente continua ausente e zero permanece distinto de ausência.
- O detalhe mantém a indisponibilidade ambiental real da camada atual; não há resultados ambientais fabricados. A cartela **“Interface real · Dados ilustrativos”** aparece nas cenas do produto.
- As molduras dos dispositivos são desenhos vetoriais genéricos. O logo é cópia do asset fornecido no workspace.

## Arquivos e execução

Abra `film.html` no navegador para a prévia com reprodução, pausa e busca temporal. O áudio usa `output/soundtrack.wav`, criado pelo renderizador. No modo `?render`, a composição ocupa 1920 × 1080 sem controles.

Pré-requisitos: Node.js do projeto, dependências existentes do frontend, Chromium Playwright e FFmpeg com `libx264`/`aac`. Não há dependências npm novas. A partir da raiz deste checkout:

```powershell
node creative/responsive-commercial/render.mjs frontend 'C:/caminho/ffmpeg.exe'
```

O argumento `frontend` pode apontar para outro checkout com as dependências instaladas. O último argumento é opcional se FFmpeg estiver no PATH. O renderer usa o navegador para compor a perspectiva e FFmpeg para produzir `output/greener-responsive-v1.mp4`, H.264 YUV420p/BT.709, áudio AAC de 48 kHz e fast start. Também gera WAV, nove quadros PNG, storyboard e relatório JSON. `output/` fica fora do Git; os fontes e o storyboard de referência ficam versionados.

Para recapturar o frontend, inicie Vite na porta 4188 e execute:

```powershell
node creative/responsive-commercial/capture.mjs frontend http://127.0.0.1:4188
```

A captura confere ausência de alertas de erro e overflow horizontal móvel. O renderizador verifica seis transições, rotação de 45° nos pontos médios, ordem temporal, pico do áudio, execução JavaScript e conclusão do encoder. Confira os metadados com FFprobe e decodifique o MP4 inteiro com FFmpeg antes de compartilhar. A suíte/build da aplicação não é requisito desta composição, que fica fora de frontend/backend.

## Continuidade

Este é um teste visual solicitado pelo usuário; a direção ainda depende do feedback sobre o vídeo. Antes de refinar, veja o MP4 e `assets/storyboard.png`. Preserve a v1 e escolha um novo nome de saída para a próxima versão, porque o renderizador atual sobrescreve `output/greener-responsive-v1.mp4`. Ajustes de ritmo, enquadramento, títulos e câmera ficam em `film.html`; trilha e exportação ficam em `render.mjs`.
