# Metodología y significado de los datos

La evidencia conserva su significado: ausencia, error y datos obsoletos no equivalen a cero. La energía se estima con el modelo simplificado de parámetros versionados; no es una medición eléctrica real y sus parámetros no son un factor regional oficial. La relación de conversión a CO₂e está implementada en #49/#53.

## Vocabulario y unidades

| Concepto | Significado |
| --- | --- |
| Aplicación | Identidad estable; nombre y ubicación pueden cambiar. |
| Observación/recopilación | Métricas persistidas asociadas a aplicación e intervalo. |
| Ciclo | Ejecución de descubrimiento, reconciliación y recopilación; no una medición individual. |
| Energía | Cantidad acumulada en kWh; no equivale a potencia. |
| Intensidad de carbono | Factor regional de la fuente en gCO₂e/kWh. |
| CO₂e | Emisiones equivalentes con unidad y factor identificados. |
| Cobertura | Parte del período solicitada respaldada por evidencia válida, calculada por separado para energía y CO₂e. |
| Stale | Observación anterior válida conservada; no éxito del intento actual. |

El agregador documenta CPU en %, memoria, disco y red en GB. No son kWh: la conversión exige modelo, coeficientes y supuestos documentados.

## Tiempo y procedencia

La fuente no publica timestamp de medición. GreenER registra recepción y deriva `[receivedAt - collection_interval_seconds, receivedAt]`; no demuestra instantes exactos de medición de origen.

Último intento, última observación válida y actualización del registro son distintos. La consulta de un factor tampoco demuestra vigencia oficial. El snapshot conserva valor, identidad interna, contrato y hora de consulta; bibliografía y vigencia no publicadas siguen desconocidas.

## Reglas temporales ambientales

Las consultas usan timestamps ISO con zona explícita normalizados a UTC e intervalo [from,to). Los buckets UTC por hora/día/mes/año cuentan solo la superposición, incluso en los extremos parciales. Los presets 24h/7d/30d/90d son ventanas móviles exactas con una referencia común para KPI y serie. Límite: 10.000 puntos; el exceso se rechaza sin truncar ni cambiar granularidad. La serie prorratea resultados guardados sin recalcular observaciones; en solapamientos elige collectedAt más reciente y luego el ID lexicográficamente menor, sin alternativa si no sustenta la métrica. Sin redondeo adicional; coberturas y snapshots originales se conservan separados.

## Energía y emisiones

La relación dimensional implementada es:

    CO₂e [g] = energía [kWh] × intensidad [gCO₂e/kWh]

Ejemplo didáctico: 2 kWh × 100 gCO₂e/kWh = 200 gCO₂e = 0,2 kgCO₂e. No son factores aprobados ni lecturas del producto. La relación no define cómo convertir CPU/memoria/disco/red en energía.

Sin factor, la energía válida permanece válida, pero CO₂e puede no ser calculable. Cero requiere evidencia válida.

## Historial y escenarios

| Resultado | Regla |
| --- | --- |
| Original | Conserva observaciones, configuración, metodología y factor usados. |
| Vista previa de recálculo | Configuración actual identificada, sin guardar ni sustituir original; permisos, límites y factor pendientes. |
| Simulación regional | Mantiene energía y evalúa otro factor, separada de resultados oficiales. |

Totales, ranking y comparación requieren períodos y coberturas compatibles. Los huecos no se convierten en cero y los porcentajes requieren denominador válido. La semántica temporal aprobada se describe arriba. En persistencia, energía, emisiones en gramos y factor usan ocho decimales; la cobertura, como fracción entre cero y uno, usa cuatro. No se redondean valores intermedios y los snapshots JSON conservan su representación original.
