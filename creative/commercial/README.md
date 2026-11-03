# GreenER — comercial das pegadas

Para retomar refinamentos em outra conversa, leia [a nota de continuidade](CONTINUIDADE.md), com as decisões aceitas, a referência v1 e o estado do trabalho.

Primeiro corte aprovado a partir do brainstorming: peça de 30 segundos, horizontal, 1920 × 1080, 30 fps, sem locução. Fundo claro, pegadas vetoriais originais, entrada breve da interface real e encerramento com a marca e **“Keep track. Keep it GreenER.”**

## Roteiro

| Tempo | Cena |
| --- | --- |
| 0–4,4 s | Pegadas aparecem uma a uma; apenas sons de passos no início. |
| 4,4–10,6 s | “Toda aplicação deixa uma pegada.” |
| 10,8–15,8 s | “Mesmo quando você não vê.” O enquadramento se afasta. |
| 15,8–23,5 s | “Torne o impacto visível.” Aproximação suave do catálogo. |
| 23,3–26,8 s | Últimos passos em direção à marca. |
| 26,8–30 s | Logo, nome e slogan permanecem para leitura. |

O áudio é uma composição sintética original: passos sincronizados, base instrumental discreta e toque tonal na revelação do logo. Não usa músicas, áudio ou elementos gráficos de filmes ou campanhas existentes.

## Assets e fidelidade

- `assets/green-er-mark.png`: cópia do asset da marca disponível no workspace durante a produção; não redesenhado.
- `assets/catalog.png`: captura do frontend real do workspace em 03/11/2026. Usa quatro aplicações ilustrativas no formato do contrato já utilizado nos testes `frontend/e2e/support/catalog.ts`; não consulta APIs externas. A cartela identifica **“Interface real · Dados ilustrativos”**.
- A captura inicial incorpora a identidade visual em edição no workspace original. Por isso, pode diferir do frontend da branch `develop` usada como base desta entrega. O PNG preserva a aparência utilizada no vídeo.
- Não há números ambientais fabricados nem demonstração de dashboard, ranking ou cálculos ainda não integrados nessa tela.

## Prévia editável

Abra `film.html` no navegador. Os controles permitem reproduzir, pausar e percorrer os 30 segundos. O som fica disponível depois da renderização em `output/soundtrack.wav`. A prévia usa Canvas; a animação não altera a aplicação React.

## Renderizar

Pré-requisitos: Node.js compatível com o projeto, dependências existentes de `frontend/`, Chromium do Playwright e FFmpeg com os encoders `libx264` e `aac`. Os binários de renderização são externos ao repositório; não há dependências npm novas.

Na raiz do repositório:

```powershell
node creative/commercial/render.mjs frontend 'C:/caminho/ffmpeg.exe'
```

Com FFmpeg no PATH, o último argumento pode ser omitido. Quando as dependências estiverem em outro checkout, substitua `frontend` pelo caminho desse checkout. Para preparar um ambiente novo, use `npm ci --prefix frontend` e `npx --prefix frontend playwright install chromium`.

A renderização produz, em `output/` (ignorado pelo Git):

- `greener-commercial-v1.mp4`: H.264, YUV 4:2:0, áudio AAC e fast start.
- `soundtrack.wav`: áudio PCM mono de 48 kHz para a prévia.
- `storyboard.png` e seis quadros PNG para revisão.
- `render-report.json`: duração prevista, quadros enviados, pico do áudio e erros de JavaScript.

O renderizador verifica sequência de passos, limites de áudio, erros de JavaScript, saída do encoder e existência do vídeo. O MP4 também deve ser inspecionado com `ffprobe` e decodificado com FFmpeg antes de compartilhar.

## Atualizar a captura

Inicie o frontend desejado com `npm run dev -- --host 127.0.0.1 --port 4187 --strictPort` dentro de `frontend/`. Em outro terminal, na raiz:

```powershell
node creative/commercial/capture.mjs frontend http://127.0.0.1:4187
```

Isso substitui somente `assets/catalog.png`, com horário fixo e dados ilustrativos. Depois, renderize novamente. Para alterar o texto, o ritmo, as pegadas ou o enquadramento, edite `film.html`; a trilha fica em `render.mjs`.
