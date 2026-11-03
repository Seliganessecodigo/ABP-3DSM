# GreenER — produto em movimento

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
