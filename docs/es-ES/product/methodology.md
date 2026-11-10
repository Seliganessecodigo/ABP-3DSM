# Metodología y datos

La energía se estima con un modelo simplificado de CPU, memoria, disco y red durante el intervalo observado. La potencia se convierte en energía según la duración. Las emisiones multiplican energía por intensidad de carbono regional. Los coeficientes pertenecen al modelo académico, no son mediciones eléctricas ni factores regionales oficiales. Los resultados conservan su metodología y factor originales.

## Interpretar los datos {#vocabulary}

| Concepto | Significado |
| --- | --- |
| Aplicación | Servicio con identidad estable en el catálogo. |
| Observación | Conjunto de métricas asociado a un intervalo. |
| Energía | Cantidad estimada del período, en kWh. |
| Intensidad de carbono | Factor regional, en gCO₂e/kWh. |
| Emisiones | Cantidad equivalente de CO₂ con unidad indicada. |
| Cobertura | Parte del período sustentada por evidencia válida. |

## Modelo de estimación {#model}

| Parámetro | Valor |
| --- | --- |
| CPU (100%) | 100 W |
| Memoria | 0.375 W/GB |
| Disco | 0.01 W/GB |
| Red | 0.02 W/GB |

```text
P [W] = P_CPU + P_RAM + P_disk + P_network
E [kWh] = P [W] × Δt [h] / 1000
CO₂e [g] = E [kWh] × I [gCO₂e/kWh]
```

## Entender la cobertura {#coverage}

La cobertura es la proporción del período con observaciones válidas. Energía y emisiones tienen coberturas separadas: puede haber energía estimada sin factor de carbono para calcular emisiones. Compare períodos, unidades y coberturas compatibles. Una cobertura baja indica análisis parcial, no reducción demostrada del consumo.

Cero significa que existe una observación válida con ese valor. Una laguna indica que faltan datos utilizables, no consumo cero. Tras un fallo de actualización puede conservarse la última lectura válida con su hora original. Compruebe actualización y cobertura antes de decidir. Las pantallas consultan datos 60 segundos después de cada intento; eso no garantiza una medición nueva en cada actualización.

## Períodos e historial {#history}

| Regla | Significado |
| --- | --- |
| Historial preservado | Cambiar preferencias o generar una vista previa no reemplaza originales. |
| Ausencia explícita | Fallos, métricas ausentes y datos antiguos se distinguen de cero. |
| Consulta pública | Leer indicadores no requiere login; guardar preferencias y administrar cuentas requiere autorización. |

En la vista previa de recálculo, elija aplicación y fechas para comparar el original con una estimación del modelo actual y los factores actuales de las regiones observadas. El último día se incluye completo, en UTC. Se admiten hasta 30 días y 10.000 observaciones. La vista previa no se guarda ni cambia el historial. Las diferencias porcentuales aparecen si coinciden unidad y cobertura y el original es positivo.

## Lecturas relacionadas {#related}

[Guía de uso](../guide/monitoring) · [Referencia de la API](../reference/api)

## Preferencias aplicadas a datos reales {#personal-preferences}

En `/methodology`, configura límites de energía y emisiones por aplicación, la referencia de cobertura y los valores iniciales del análisis. Elige las últimas 24 horas, 7, 30 o 90 días, el mes actual en UTC o un intervalo personalizado con inicio incluido y fin excluido. La vista previa consulta datos reales sin guardar y utiliza el mismo panel de avisos que las aplicaciones y el Dashboard. Guardar exige iniciar sesión y afecta solo a tu cuenta; no modifica cálculos, historial ni estados operativos. Los avisos usan el período de cada límite independientemente de los filtros. Los valores iniciales solo completan opciones ausentes en la URL del Dashboard y del detalle. Los datos parciales inferiores al límite no demuestran su cumplimiento; la ausencia nunca equivale a cero.
