# Guía de uso

Empiece por el resumen ambiental, identifique una aplicación que requiera atención y abra su detalle. Use el historial para investigar el período y la metodología para entender las estimaciones. Considere siempre la cobertura antes de comparar resultados.

## Encontrar una aplicación {#catalog}

En el catálogo, busque por nombre, identificador o región y filtre por estado. Navegue por las páginas de la tabla y abra una aplicación para consultar sus datos. Si no hay coincidencias, revise los filtros. La dirección conserva la búsqueda y la paginación para compartir o retomar la consulta.

## Consultar el dashboard {#dashboard}

En el dashboard, seleccione 24 horas, 7, 30 o 90 días, una región y un estado. Consulte energía, emisiones, cobertura y aplicaciones por estado. El gráfico muestra las proporciones de emisiones con barras o anillo. La tabla permite buscar, filtrar y ordenar por impacto; sus filtros cambian las filas, mientras los totales conservan el alcance seleccionado.

## Investigar el detalle {#detail}

Abra el detalle para comprobar identidad, ubicación, estado y horas de actualización. Examine métricas y resultados ambientales del mismo período. La metodología registrada muestra el modelo, los parámetros y el factor de carbono utilizados sin modificar el resultado. Si falta la ciudad, el resto de la ubicación sigue siendo útil.

## Explorar el historial {#history}

En el historial, elija aplicación, período y agrupación por hora, día, mes o año. Use filtros y paginación para localizar intervalos y abra su composición para consultar observaciones incluidas y exclusiones. La zona horaria cambia la presentación de fechas; la agrupación permanece en UTC. La superposición del detalle compara la aplicación con el período anterior de igual duración.

## Comparar con una vista previa de recálculo {#preview}

En la vista previa de recálculo, elija aplicación y fechas para comparar el original con una estimación del modelo actual y los factores actuales de las regiones observadas. El último día se incluye completo, en UTC. Se admiten hasta 30 días y 10.000 observaciones. La vista previa no se guarda ni cambia el historial. Las diferencias porcentuales aparecen si coinciden unidad y cobertura y el original es positivo.

## Personalizar el análisis {#preferences}

En Metodología, explore energía, emisiones, cobertura y análisis. Las demostraciones usan datos de ejemplo identificados en pantalla. Inicie sesión para guardar umbrales de presentación y opciones iniciales de período y agrupación. Cada persona cambia solo sus preferencias; los cálculos y la configuración global se conservan. Ante un conflicto al guardar, recargue la preferencia antes de reintentar. Las opciones ya elegidas en la dirección del análisis prevalecen sobre las guardadas.

## Iniciar sesión {#access}

Catálogo, dashboard y consultas ambientales no requieren login. Para guardar preferencias, use correo y contraseña o Google cuando esté habilitado y su cuenta esté vinculada por invitación. Los administradores también confirman un código de seis dígitos del autenticador. Recargar termina la sesión de la interfaz y exige entrar de nuevo. Los permisos administrativos dependen del rol de la cuenta.

## Idioma y apariencia {#appearance}

El selector ofrece 12 idiomas; la elección queda en este navegador. El interruptor de modo oscuro cambia la apariencia y, antes de una elección explícita, sigue al sistema. Si el almacenamiento está bloqueado, puede perder las preferencias al recargar. El idioma cambia el formato de fechas y números sin alterar los instantes observados.

## Interpretar los datos {#data}

Cero significa que existe una observación válida con ese valor. Una laguna indica que faltan datos utilizables, no consumo cero. Tras un fallo de actualización puede conservarse la última lectura válida con su hora original. Compruebe actualización y cobertura antes de decidir. Las pantallas consultan datos 60 segundos después de cada intento; eso no garantiza una medición nueva en cada actualización.

| Estado | Significado |
| --- | --- |
| Disponible | La aplicación devolvió métricas utilizables. |
| No disponible | El intento actual falló; puede existir historial válido. |
| Sin métricas | La aplicación es conocida, pero el intento no tiene métricas utilizables. |
| Eliminada | Su ausencia se confirmó en el catálogo de origen; se conservan identidad e historial. |

La cobertura es la proporción del período con observaciones válidas. Energía y emisiones tienen coberturas separadas: puede haber energía estimada sin factor de carbono para calcular emisiones. Compare períodos, unidades y coberturas compatibles. Una cobertura baja indica análisis parcial, no reducción demostrada del consumo.

## Diagnóstico {#support}

Al informar un problema, indique aplicación, período, filtros, hora con zona y acción. Describa resultado esperado y observado. Las capturas ayudan si no contienen credenciales ni datos privados.

## Lecturas relacionadas {#related}

[Metodología y datos](../product/methodology) · [Referencia de la API](../reference/api)
