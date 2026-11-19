| Regra e medição | Antes | Depois | Mantidos |
|---|---:|---:|---:|
| U1 estilos de rótulos superiores, contador | 7 | 2 | 2 |
| U1 rótulos superiores renderizados, leitura | 17 | 0 | 0 |
| U2 formatação numérica, contador | 4 | 4 | 4 |
| U2 numeração decorativa de seções, leitura | 3 | 0 | 0 |
| U3 subtítulos repetidos, leitura | 3 | 0 | 0 |
| U4 legendas óbvias, leitura | 2 | 0 | 0 |
| U5 notas de implementação, leitura | 2 | 0 | 0 |
| U6 sequências de metadados, contador | 68 | 67 | 67 |
| U7 rótulo repetido das preferências, leitura | 1 | 0 | 0 |
| U9 selo fixo sem estado, leitura | 1 | 0 | 0 |
| U14 quantidades repetidas no cabeçalho, leitura | 3 | 0 | 0 |
| unslop 13 travessões, contador | 16 | 16 | 16 |

**Mantidos de propósito**

- Ícones aprovados pelo usuário, incluindo os das ações e da sidebar. A preferência explícita do projeto prevalece sobre a remoção genérica de ícones da regra U11.
- Grupos de navegação e rótulos do resumo de alterações na confirmação: indicam destinos e a preferência que será alterada. Não são títulos repetidos de página.
- Os quatro resultados U2 são preenchimento de datas em `seriesQuery.ts`, não numeração decorativa. Não foi alterada lógica para reduzir a contagem.
- Os resultados U6 restantes são identidade/localização, unidade, período, estado ou proveniência ligados a dados. A heurística também agrupa separadores de strings distintas próximas no código.
- Seis travessões estão na documentação técnica, fora da UI. Os outros dez são pontuação gramatical das definições em russo. Não foram feitas reescritas de tradução apenas para zerar a heurística.
- Períodos, atualização, unidades, estados operacionais, motivos de indisponibilidade e avisos de que ausência não é zero. Esses textos mudam a interpretação dos resultados.
- Labels visíveis dos formulários, nomes acessíveis, progresso real dos tutoriais, avisos de alterações pendentes e instruções de autenticação.
- A legenda da composição e as indicações dos gráficos identificam séries e lacunas reais. Os gráficos já usam eixos discretos; não houve troca de tipo, série ou cor.
