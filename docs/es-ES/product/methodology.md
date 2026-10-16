# Metodología y significado de los datos

Ausencia, error y datos obsoletos no equivalen a cero. Las reglas ambientales son requisitos del producto; el modelo completo de energía y sus coeficientes necesitan aprobación.

## Vocabulario y unidades

| Concepto | Significado |
| --- | --- |
| Aplicación | Identidad estable; nombre y ubicación pueden cambiar. |
| Observación/recopilación | Métricas persistidas asociadas a aplicación e intervalo. |
| Ciclo | Ejecución de descubrimiento, reconciliación y recopilación; no una medición individual. |
| Energía | Cantidad acumulada en kWh; no equivale a potencia. |
| Intensidad de carbono | Factor regional de la fuente en gCO₂e/kWh. |
| CO₂e | Emisiones equivalentes con unidad y factor identificados. |
| Cobertura | Parte del período respaldada por evidencia válida; política pendiente. |
| Stale | Observación anterior válida conservada; no éxito del intento actual. |

El agregador documenta CPU en %, memoria, disco y red en GB. No son kWh: la conversión exige modelo, coeficientes y supuestos documentados.

## Tiempo y procedencia

La fuente no publica timestamp de medición. GreenER registra recepción y deriva `[receivedAt - collection_interval_seconds, receivedAt]`; no demuestra instantes exactos de medición de origen.

Último intento, última observación válida y actualización del registro son distintos. La consulta de un factor tampoco demuestra vigencia oficial. El snapshot conserva valor, identidad interna, contrato y hora de consulta; bibliografía y vigencia no publicadas siguen desconocidas.

## Energía y emisiones

Relación dimensional planificada:

    CO₂e [g] = energía [kWh] × intensidad [gCO₂e/kWh]

Ejemplo didáctico: 2 kWh × 100 gCO₂e/kWh = 200 gCO₂e = 0,2 kgCO₂e. No son factores aprobados ni lecturas del producto. La relación no define cómo convertir CPU/memoria/disco/red en energía.

Sin factor, la energía válida permanece válida, pero CO₂e puede no ser calculable. Cero requiere evidencia válida.

## Historial y escenarios

| Resultado | Regla |
| --- | --- |
| Original | Conserva observaciones, configuración, metodología y factor usados. |
| Vista previa de recálculo | Configuración actual identificada, sin guardar ni sustituir original; permisos, límites y factor pendientes. |
| Simulación regional | Mantiene energía y evalúa otro factor, separada de resultados oficiales. |

Totales, ranking y comparación requieren períodos/coberturas compatibles. No rellenar lagunas con ceros ni inventar porcentajes sin denominador válido. Redondeo, bordes y granularidad son [decisiones pendientes](./decisions).
