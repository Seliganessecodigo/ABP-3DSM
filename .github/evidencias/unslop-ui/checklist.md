# Aplicação da unslop-ui

Origem: `felipebasurto/unslop-ui`, instalada globalmente para Codex em `~/.agents/skills/unslop-ui`. As regras de escrita foram carregadas com `scripts/load_unslop.py`, usando o fallback incluído na skill.

Escopo: revisão leve de textos e decoração, U1 a U16, em `frontend/src`. O modo `--surface` não foi ativado. A remoção de wrappers e estilos acompanha somente os elementos excluídos. Requisições, cálculos, validação, persistência, tipos dos gráficos e tokens de espaçamento permanecem fora desta revisão.

- [x] 1. Contar candidatos antes da revisão (`before.json`).
- [x] 2. Ler textos e elementos visuais, distinguindo repetição de contexto necessário.
- [x] 3. Veredito: leve. As telas já tinham controles e estados definidos; os cortes se concentram em texto repetido.
- [x] 4. Editar elementos e remover traduções e CSS exclusivos deles nos doze idiomas.
- [x] 5. Executar o mesmo contador (`after.json`).
- [x] 6. Revisar diff, formulários, nomes acessíveis e capturas em desktop e celular.
- [x] 7. Registrar regras, contagens e exceções no relatório.

Comando de contagem, antes e depois:

```powershell
python "$env:USERPROFILE/.agents/skills/unslop-ui/scripts/count_tells.py" frontend/src
```

A heurística passou de 95 para 89 ocorrências. Esse total inclui datas, metadados, documentação e pontuação legítimos; não representa uma contagem de defeitos da interface. As instâncias visuais identificadas por leitura estão separadas no relatório. `reviewed-candidates.json` registra todos os candidatos restantes.

Referências anteriores: [Dashboard](../espacamentos-ajuda-acoes/dashboard-desktop.png), [metodologia](../espacamentos-ajuda-acoes/metodologia-desktop.png).

Capturas posteriores: [Dashboard desktop](dashboard-spacing-1440.png), [Dashboard celular](dashboard-spacing-390.png), [metodologia desktop](methodology-1440.png), [metodologia celular](methodology-390.png).

Não foram escritas novas frases na interface. Os dois testes que exigiam textos excluídos passaram a conferir os avisos preservados de ausência de dados e de prévia sem persistência.
