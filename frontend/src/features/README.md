# features

Funcionalidades organizadas por domínio do produto, como catálogo, monitoramento, dashboard, análise e configurações. Uma feature é dona das regras e contratos desse domínio, incluindo validação, operações de API, cache e transformações puras.

Páginas mantêm a composição e o estado específicos de uma rota. Uma feature pode expor hooks ou componentes quando encapsulam comportamento reutilizado dentro do próprio domínio; ela não controla rotas nem importa páginas. Evite dependências circulares entre features e mantenha pública somente a interface necessária aos consumidores.
