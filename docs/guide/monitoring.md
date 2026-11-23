# Guia de uso

Comece pelo resumo ambiental, identifique uma aplicação que merece atenção e consulte seu detalhe. Use o histórico para investigar o período e a metodologia para entender como os valores foram estimados. Considere sempre a cobertura antes de comparar resultados.

## Encontrar uma aplicação {#catalog}

No catálogo, pesquise por nome, identificador ou região e filtre pelo estado da aplicação. Navegue pelas páginas da tabela e abra uma aplicação para consultar seus dados. Se a busca não retornar resultados, revise os filtros. O endereço da página conserva a busca e a paginação para compartilhar ou retomar a consulta.

## Consultar o dashboard {#dashboard}

No dashboard, selecione período, região e estado para consultar energia, CO₂e, sucesso das coletas e aplicações por estado. Sucesso das coletas é a proporção das tentativas registradas que retornaram métricas válidas e foram salvas; sem registros, a taxa fica indisponível. O indicador informa o primeiro registro do período. Cobertura temporal continua nas análises e na tabela, com avisos sobre dados parciais. Gráficos, busca, filtros e paginação preservam o contexto selecionado.

Na série temporal, alterne entre energia e CO₂e ou consulte a tabela de intervalos. A janela de 24 horas usa agrupamento por hora; as demais usam agrupamento diário. Os intervalos seguem UTC e usam os mesmos filtros dos indicadores. Lacunas permanecem sem valor.

## Investigar o detalhe {#detail}

Abra o detalhe para conferir identidade, localização, estado e horários de atualização. Examine as métricas e os resultados ambientais no mesmo período. A consulta da metodologia apresenta o modelo, os parâmetros e o fator de carbono registrados no cálculo, sem modificar o resultado. Quando a cidade não estiver disponível, as demais informações de localização continuam úteis.

O fator equivalente resume os fatores regionais aplicados, ponderados pela energia com emissões calculadas. A explicação do cálculo usa essa energia, que pode ser menor que a energia total quando faltam fatores em parte do período. Consulte a metodologia para conferir valores e fontes por região. O card do fator mantém a mesma altura dos demais indicadores, sem expansão interna.

## Explorar o histórico {#history}

No histórico, escolha uma aplicação, um período e o agrupamento por hora, dia, mês ou ano. Use os filtros e a paginação para localizar intervalos e abra a composição de um intervalo para consultar observações incluídas e exclusões. O fuso altera a apresentação das datas; o agrupamento permanece em UTC. No detalhe, a sobreposição permite comparar a aplicação com o período anterior de mesma duração.

## Prévia de cálculo {#preview}

A comparação entre aplicações deve usar período, unidades e coberturas compatíveis. A simulação regional mantém a energia observada, altera o fator de carbono do cenário e apresenta o resultado separado dos indicadores oficiais.

## Personalizar a análise {#preferences}

Em Metodologia, explore energia, emissões, cobertura e padrões das análises. As prévias consultam dados reais e identificam ausência ou falha; não alteram o histórico nem a fórmula. Entre na conta para salvar limites pessoais e opções iniciais. Datas, filtros e agrupamentos explícitos no endereço prevalecem sobre os padrões salvos.

## Entrar na sua conta {#access}

O catálogo, o dashboard e as consultas ambientais podem ser acessados sem login. Para salvar preferências, entre com e-mail e senha ou com Google, quando essa opção estiver habilitada e sua conta estiver vinculada por convite. Administradores também precisam confirmar um código de seis dígitos do aplicativo autenticador. Recarregar a página encerra a sessão da interface e exige novo login. As permissões de administração dependem do papel da conta.

## Idioma e aparência {#appearance}

Use o seletor para escolher entre os 12 idiomas. A escolha fica neste navegador. O interruptor de modo escuro permite alternar a aparência; antes de uma escolha explícita, a interface acompanha o sistema. Se o navegador bloquear o armazenamento, essas preferências podem ser perdidas ao recarregar. Trocar o idioma muda a apresentação das datas e números, preservando os instantes observados.

## Interpretar os dados {#data}

Zero significa que existe uma observação válida com esse valor. Uma lacuna indica que faltam dados utilizáveis; ela não deve ser interpretada como consumo zero. Se uma atualização falhar, o sistema pode manter a última leitura válida com seu horário original. Confira a atualização e a cobertura antes de usar o indicador em uma decisão. As telas consultam novas informações a cada 60 segundos após cada tentativa; isso não garante uma nova medição a cada atualização.

| Estado | Significado |
| --- | --- |
| Disponível | A aplicação respondeu com métricas utilizáveis. |
| Indisponível | A tentativa atual falhou; pode existir histórico válido. |
| Sem métricas | A aplicação é conhecida, mas não há métricas utilizáveis na tentativa. |
| Removida | A ausência foi confirmada no catálogo de origem; a identidade e o histórico permanecem. |

Cobertura é a proporção do período sustentada por observações válidas. Energia e emissões têm coberturas separadas: pode existir energia estimada mesmo quando falta um fator de carbono para calcular emissões. Compare períodos, unidades e coberturas compatíveis. Um percentual de cobertura baixo sinaliza uma análise parcial, não uma redução comprovada de consumo.

## Diagnóstico {#support}

Ao comunicar um problema, informe a aplicação, o período, os filtros, a hora com fuso e a ação realizada. Descreva o resultado esperado e o observado. Capturas de tela ajudam quando não contêm credenciais ou dados privados.

## Outras análises e configurações {#other}

O ranking ordena resultados por energia ou CO₂e no período. A comparação reúne aplicações e uma referência; a simulação regional mantém a energia e apresenta um cenário separado. Em Configurações, usuários autorizados acessam monitoramento, contas e auditoria de alterações. A conta pessoal permite trocar a senha; o login oferece recuperação por token temporário.

## Leitura relacionada {#related}

[Metodologia e dados](../product/methodology) · [Referência da API](../reference/api)
