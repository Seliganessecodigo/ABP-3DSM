# Retomar o comercial GreenER

## Estado em 03/11/2026

O usuário assistiu ao primeiro corte e disse: “Isso ficou excelente, vejo poucas coisas que daria pra refinar”. Quer experimentar outras coisas antes de voltar ao vídeo. O trabalho atual está entregue; os refinamentos ficam para uma solicitação futura. Ainda não foram indicados ajustes específicos. A avaliação positiva mantém a v1 como referência, sem significar aprovação definitiva de cada detalhe.

## Direção criativa aceita

- Comercial simples e impactante, com a linguagem de apresentação de produto associada pelo usuário a Apple/Steve Jobs: espaço vazio, poucas palavras, movimentos discretos e revelação da marca.
- Pegadas surgem em sequência, como a referência de movimento do Mapa do Maroto de Harry Potter. As formas e os sons foram criados para o comercial; os assets do filme não foram usados.
- As pegadas representam a pegada ambiental das aplicações e chegam à marca GreenER.
- Slogan escolhido para esta versão: **“Keep track. Keep it GreenER.”** O usuário sugeriu inicialmente “Keep the track, keep it Greener”; a redação adotada ajusta o inglês e destaca a marca.
- Primeiro corte sem locução, com passos sincronizados, trilha instrumental sintética discreta e toque tonal na revelação. A locução foi uma possibilidade futura, não uma mudança solicitada.
- Formato entregue: horizontal, 30 segundos, 1920 × 1080, 30 fps. O [README](README.md) contém o roteiro e os comandos; não há necessidade de reconstruir o conceito.

## Onde está a versão de referência

- Branch: `feat/comercial-greener`, criada de `develop`.
- Commit da produção da v1: `5d79f34b3b8903c510977037a754c2667e7bdcc5`.
- [PR #333](https://github.com/Seliganessecodigo/ABP-3DSM/pull/333), aberta como rascunho para `develop`. Consulte seu estado atual antes de continuar; a CI estava pendente na entrega.
- Worktree original: `C:/Users/ealvgia/study/ABP-3DSM/.worktrees/comercial-greener`.
- Arquivo entregue: `creative/commercial/output/greener-commercial-v1.mp4` dentro dessa worktree.
- Fontes versionadas: `film.html`, `render.mjs`, `capture.mjs` e `assets/`. O PNG do catálogo preserva a interface usada, incluindo a identidade visual em edição no workspace original.
- `output/` é ignorado pelo Git. O MP4/WAV são locais; o GitHub preserva os arquivos-fonte e o storyboard, não o vídeo renderizado. Em outra máquina, renderize novamente usando o README; a reprodução byte a byte depende também das versões do navegador, fontes e encoder.

## Verificações realizadas na v1

FFprobe confirmou 30,000 segundos, 900 quadros, H.264 `yuv420p`, faixa de cor `tv` e áudio AAC mono de 48 kHz. A decodificação completa com FFmpeg terminou sem erros. O Chromium carregou os assets e passou em reprodução, pausa e busca temporal, sem erros de JavaScript. O pico linear do áudio sintetizado foi 0,538, sem clipping. Não houve revisão auditiva humana registrada. Build e suíte da aplicação não foram executados porque frontend/backend não foram alterados.

## Ao retomar

1. Leia esta nota e o README; veja o MP4 da v1 ou o storyboard antes de propor alterações.
2. Parta dos refinamentos que o usuário indicar. Até aqui, nenhum ajuste específico está acordado.
3. Preserve o MP4 entregue antes de renderizar: o script atual escreve em `output/greener-commercial-v1.mp4`. Para uma nova versão, altere o destino para v2 e preserve a referência v1.
4. Mantenha a identificação dos dados ilustrativos. A captura usa o catálogo real com dados de exemplo; não demonstra funcionalidades ambientais ainda não integradas naquela tela.
5. Consulte o estado da branch/PR e preserve outras mudanças do workspace. O desenvolvimento da aplicação continuava separado desta produção.

## Mensagem para uma conversa nova

> Quero retomar o comercial das pegadas do GreenER. Leia `creative/commercial/CONTINUIDADE.md` na branch `feat/comercial-greener` (PR #333), veja a versão de referência e mantenha a direção criativa registrada. Os ajustes que quero agora são: …
