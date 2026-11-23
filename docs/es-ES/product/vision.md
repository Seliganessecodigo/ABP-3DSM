# Visión y alcance

GreenER reúne monitoreo continuo, estimaciones de energía y CO₂e y análisis ambiental en una plataforma integrada. El catálogo dinámico, dashboard, historial, ranking, comparación y simulación regional conectan la visión general con la investigación de cada aplicación, con indicadores trazables hasta sus datos y metodología de origen.

## Para quién {#readers}

| Público | Necesidad |
| --- | --- |
| Gestión de infraestructura | Identificar aplicaciones y seguir los cambios del entorno. |
| Análisis ambiental y operativo | Investigar consumo, emisiones y calidad de los datos de un período. |
| Desarrollo y evaluación | Comprobar el comportamiento del producto y reproducir sus resultados. |

## Funciones disponibles {#features}

| Función | Referencia |
| --- | --- |
| Catálogo y búsqueda | [Encontrar una aplicación](../guide/monitoring#catalog) |
| Monitorización automática | [Interpretar los datos](../guide/monitoring#data) |
| Dashboard ambiental | [Consultar el dashboard](../guide/monitoring#dashboard) |
| Detalle de aplicación | [Investigar el detalle](../guide/monitoring#detail) |
| Historial y composición | [Explorar el historial](../guide/monitoring#history) |
| Preferencias personales | [Personalizar el análisis](../guide/monitoring#preferences) |
| Login y segundo factor | [Iniciar sesión](../guide/monitoring#access) |
| Ranking ambiental | [Ranking ambiental](../guide/monitoring#other) |
| Comparación de aplicaciones | [Comparación de aplicaciones](../guide/monitoring#other) |
| Simulación regional | [Simulación regional](../guide/monitoring#other) |
| Cuentas y recuperación de contraseña | [Cuentas y recuperación de contraseña](../guide/monitoring#other) |

## Recorrido de análisis {#journey}

Empiece por el resumen ambiental, identifique una aplicación que requiera atención y abra su detalle. Use el historial para investigar el período y la metodología para entender las estimaciones. Considere siempre la cobertura antes de comparar resultados.

## Límites de uso {#limits}

La energía se estima con un modelo simplificado de CPU, memoria, disco y red durante el intervalo observado. La potencia se convierte en energía según la duración. Las emisiones multiplican energía por intensidad de carbono regional. Los coeficientes pertenecen al modelo académico, no son mediciones eléctricas ni factores regionales oficiales. Los resultados conservan su metodología y factor originales.

La cobertura es la proporción del período con observaciones válidas. Energía y emisiones tienen coberturas separadas: puede haber energía estimada sin factor de carbono para calcular emisiones. Compare períodos, unidades y coberturas compatibles. Una cobertura baja indica análisis parcial, no reducción demostrada del consumo.

## Capacidades integradas {#planned}

La plataforma ofrece comparación de aplicaciones, ranking ambiental, simulación regional, gestión de usuarios y roles, recuperación de contraseña y controles de monitoreo. La autenticación JWT, Google SSO y el segundo factor TOTP protegen los flujos administrativos, mientras las consultas ambientales son públicas.

## Lecturas relacionadas {#related}

[Guía de uso](../guide/monitoring) · [Metodología y datos](../product/methodology) · [Backlog del producto](../roadmap)
