# Guía de uso

Empiece por el resumen ambiental, identifique una aplicación que requiera atención y abra su detalle. Use el historial para investigar el período y la metodología para entender las estimaciones. Considere siempre la cobertura antes de comparar resultados.

## Encontrar una aplicación {#catalog}

En el catálogo, busque por nombre, identificador o región y filtre por estado. Navegue por las páginas de la tabla y abra una aplicación para consultar sus datos. Si no hay coincidencias, revise los filtros. La dirección conserva la búsqueda y la paginación para compartir o retomar la consulta.

## Consultar el dashboard {#dashboard}

En el dashboard, seleccione período, región y estado para consultar energía, CO₂e, éxito de las recopilaciones y aplicaciones por estado. El éxito es la proporción de intentos registrados que devolvieron métricas válidas y se guardaron; sin registros, la tasa no está disponible. Se muestra el primer registro del período. La cobertura temporal permanece en los análisis y la tabla, con avisos de datos parciales. Gráficos, búsqueda, filtros y paginación conservan el contexto.

En la serie temporal, alterne entre energía y CO₂e o consulte la tabla de intervalos. La ventana de 24 horas se agrupa por hora; las demás, por día. Los intervalos siguen UTC y usan los mismos filtros que los indicadores. Los huecos permanecen sin valor.

## Investigar el detalle {#detail}

Abra el detalle para comprobar identidad, ubicación, estado y horas de actualización. Examine métricas y resultados ambientales del mismo período. La metodología registrada muestra el modelo, los parámetros y el factor de carbono utilizados sin modificar el resultado. Si falta la ciudad, el resto de la ubicación sigue siendo útil.

El factor equivalente resume los factores regionales aplicados, ponderados por la energía con emisiones calculadas. La explicación usa esa energía, que puede ser menor que el total si faltan factores en parte del período. Consulte la metodología para consultar valores y fuentes por región. La tarjeta del factor mantiene la misma altura que los demás indicadores, sin expansión interna.

## Explorar el historial {#history}

En el historial, elija aplicación, período y agrupación por hora, día, mes o año. Use filtros y paginación para localizar intervalos y abra su composición para consultar observaciones incluidas y exclusiones. La zona horaria cambia la presentación de fechas; la agrupación permanece en UTC. La superposición del detalle compara la aplicación con el período anterior de igual duración.

## Vista previa heredada (fuera del alcance) {#preview}

La vista previa de recálculo permanece en código heredado, fuera del alcance aceptado actual. Su presencia no autoriza cambios de metodología, fuentes o historial. Para comparar regiones con la misma energía, use la simulación regional.

## Personalizar el análisis {#preferences}

En Metodología, explore energía, emisiones, cobertura y valores iniciales del análisis. Las vistas previas consultan datos reales e identifican ausencias o fallos; no cambian el historial ni la fórmula. Inicie sesión para guardar límites personales y opciones iniciales. Las fechas, filtros y agrupaciones explícitas en la dirección prevalecen sobre los valores guardados.

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

## Otros análisis y configuración {#other}

El ranking ordena resultados por energía o CO₂e del período. La comparación reúne aplicaciones y una referencia; la simulación regional mantiene la energía y presenta un escenario separado. En Configuración, usuarios autorizados acceden a monitorización, cuentas y auditoría de cambios. La cuenta personal permite cambiar la contraseña; el login ofrece recuperación mediante token temporal.

## Lecturas relacionadas {#related}

[Metodología y datos](../product/methodology) · [Referencia de la API](../reference/api)
