# Demonstração Postman da task #86

A coleção `collections/task-86-simulacao-regional/` percorre a simulação regional somente leitura:

1. Lista aplicações e escolhe uma com observação calculável.
2. Lê a última coleta e usa seu intervalo como período da consulta.
3. Lista regiões e seleciona uma diferente da região da aplicação.
4. Lê a análise oficial, envia `POST /applications/{id}/analysis/regional-simulation` e lê a análise oficial novamente.
5. Verifica o formato, as unidades, as diferenças matemática e percentual e se a consulta oficial não foi alterada.

## Executar

Com o backend e PostgreSQL locais disponíveis na porta padrão `3000`:

```powershell
postman collection lint postman/collections/task-86-simulacao-regional
postman collection run postman/collections/task-86-simulacao-regional --no-report-events
```

Para outra URL, passe `--env-var 'base_url=http://localhost:PORTA'`. A coleção requer pelo menos uma aplicação calculável com uma coleta e um catálogo com uma região diferente da aplicação. As variáveis `applicationId`, `from`, `to` e `destinationRegionCode` são selecionadas durante a execução; a requisição `Simular em outra região` mostra o JSON retornado no console Postman.

## Abrir no Postman Desktop

1. No Postman, escolha **Import** e importe `exports/task-86-simulacao-regional.postman_collection.json` e `environments/task-86-local.postman_environment.json`.
2. Selecione o environment **Task 86 - API local**. Ele aponta para `http://localhost:3000`, a porta padrão da API local do projeto.
3. Clique em **Run collection** na coleção **Task 86 - Simulação regional de energia constante**.
4. Abra o resultado de **05 - Simular em outra região** para ver o JSON. O Postman também exibe os testes de resposta. Se preferir, envie cada requisição individualmente na ordem 01 a 06.

O runner e o envio individual compartilham as variáveis da coleção. As requisições 01 a 03 preenchem aplicação, período e destino automaticamente. O fluxo requer a API local ativa, ao menos uma aplicação calculável com coleta persistida e um catálogo de regiões disponível.
