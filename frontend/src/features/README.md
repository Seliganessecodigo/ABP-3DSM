# features

Funcionalidades organizadas por domínio do produto, como catálogo, monitoramento, dashboard, análise e configurações. Uma feature é dona das regras e contratos desse domínio, incluindo validação, operações de API, cache e transformações puras.

Páginas mantêm a composição e o estado específicos de uma rota. Uma feature pode expor hooks ou componentes quando encapsulam comportamento reutilizado dentro do próprio domínio; ela não controla rotas nem importa páginas. Evite dependências circulares entre features e mantenha pública somente a interface necessária aos consumidores.

`analysis/periodContext.ts` mantém o token de período escolhido como contexto opaco na URL. Sem `period`, o detalhe apresenta `7d` como seleção visual inicial; um valor desconhecido permanece na URL, não seleciona preset e pede correção acessível. Os presets da interface não calculam intervalos nem definem timezone, bordas ou granularidade. Datas personalizadas, validação de inversão e granularidades dependem de contratos ambientais ainda não disponíveis; `from`/`to` continuam pertencendo aos filtros locais do catálogo até que outro significado seja aprovado.
