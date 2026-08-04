# Plan maestro de Fotografías con ImageKit

Este documento es la referencia funcional y técnica para implementar, por fases, la futura sección de fotografías de la aplicación **Nuestros viajes**.

La fase actual solo documenta el plan. No implementa la sección Fotos, no crea rutas, componentes, hooks, servicios, lectura EXIF, compresión, galerías ni conexión real con ImageKit.

## 1. Objetivo general

La aplicación **Nuestros viajes** permitirá:

- Seleccionar fotografías directamente desde la galería del móvil.
- Seleccionar varias fotografías en un mismo lote.
- Revisarlas antes de subirlas.
- Leer automáticamente los metadatos disponibles.
- Añadir metadatos manuales opcionales.
- Comprimir y convertir las imágenes localmente.
- Subir las copias optimizadas a ImageKit.
- Guardar los metadatos en Firestore.
- Mostrar posteriormente las fotografías en galerías.
- Buscar, filtrar, editar, marcar favoritas y eliminar fotografías.

Los originales permanecerán en el dispositivo o en Google Fotos. ImageKit almacenará únicamente copias optimizadas para la web.

## 2. Restricción absoluta de coste

La solución debe mantener obligatoriamente un coste de **0 €**.

Infraestructura aprobada:

- ImageKit Forever Free.
- Cloudflare Workers Free.
- Firebase Authentication y Firestore dentro de sus cuotas gratuitas.
- Sin Firebase Functions.
- Sin Firebase Storage.
- Sin APIs de mapas o geocodificación de pago.
- Sin servicios externos de búsqueda de pago.
- Sin funciones de IA de ImageKit.
- Sin procesamiento de vídeo.
- Sin introducir tarjetas bancarias.

La aplicación debe priorizar límites duros, avisos y bloqueos antes que cualquier posibilidad de gasto. Cualquier fase que pueda aumentar consumo debe incluir controles previos, mensajes claros y validación manual.

## 3. Infraestructura existente

### ImageKit

ImageKit ID:

```text
nuestrosviajes
```

URL endpoint:

```text
https://ik.imagekit.io/nuestrosviajes
```

Carpeta raíz:

```text
/nuestros-viajes
```

Existe una pareja de claves restringidas con:

- Media management: Read and write.
- Account management: None.

La clave privada está guardada únicamente como secreto de Cloudflare y nunca debe incluirse en React, GitHub, documentación, logs ni variables `VITE_`.

### Cloudflare Worker

Worker:

```text
https://nuestros-viajes-imagekit-auth.rob-dor-80.workers.dev
```

Autorización:

```text
https://nuestros-viajes-imagekit-auth.rob-dor-80.workers.dev/auth
```

Comprobación:

```text
https://nuestros-viajes-imagekit-auth.rob-dor-80.workers.dev/health
```

El Worker:

- Recibe un ID token de Firebase.
- Valida el usuario y su UID.
- Genera credenciales temporales de ImageKit.
- Devuelve únicamente `token`, `expire`, `signature` y `publicKey`.
- Nunca devuelve la clave privada.

Variables existentes en Cloudflare:

- `IMAGEKIT_PRIVATE_KEY`
- `IMAGEKIT_PUBLIC_KEY`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_WEB_API_KEY`
- `ALLOWED_ORIGINS`
- `ALLOWED_FIREBASE_UIDS`

Comprobaciones pendientes:

- `/auth` debe probarse desde la aplicación con un token Firebase válido.
- Antes de probar la web desplegada debe revisarse `ALLOWED_ORIGINS`, porque el proyecto se publica mediante GitHub Pages y el origen definitivo puede no coincidir todavía con `https://viajes.robertodorado.es`.

## 4. Arquitectura aprobada

La funcionalidad se implementará como una feature independiente:

```text
src/features/photos/
```

Debe seguir los patrones existentes del proyecto:

- `model`
- `services`
- `hooks`
- `utils`
- `components`
- `pages`

Estructura orientativa futura:

```text
src/features/photos/
  model/
  services/
  hooks/
  utils/
  components/
  pages/
```

Esta estructura no debe crearse en la fase 0. Solo queda documentada para fases posteriores.

## 5. Estructura de Firestore aprobada

La estructura principal será:

```text
trips/{tripId}/photos/{photoId}
```

Motivos:

- Las fotografías pertenecen al viaje.
- Rober y Fati pueden trabajar sobre el mismo contenido.
- Encaja con las subcolecciones existentes del viaje.
- Simplifica la galería del viaje.
- Permite una futura galería global mediante `collectionGroup('photos')`.

No se usará como estructura principal:

```text
users/{uid}/photos/{photoId}
```

Antes de guardar fotografías personales reales deben existir reglas de Firestore versionadas y revisadas.

Actualmente el repositorio no contiene reglas de Firestore versionadas. Este punto es requisito obligatorio de una fase posterior.

## 6. Estructura de ImageKit aprobada

La ruta será estable y no dependerá de campos editables:

```text
/nuestros-viajes/{tripId}/{photoId}.webp
```

No se organizarán físicamente los archivos por:

- Título.
- Lugar.
- Día del viaje.
- Fecha de captura.

Toda la organización funcional se realizará mediante los metadatos de Firestore. Esto evita tener que mover archivos cuando se modifiquen fechas, días, títulos o lugares.

## 7. Privacidad inicial aprobada

Primera versión:

- Archivos públicos no listados.
- Rutas con identificadores aleatorios difíciles de adivinar.
- Firestore protegido mediante autenticación y reglas.
- La galería solo será accesible desde la aplicación autenticada.

Esta privacidad no es absoluta:

- Quien conozca la URL directa de ImageKit podría abrir la imagen.
- Los archivos privados y las URLs firmadas se estudiarán posteriormente.
- No deben activarse restricciones globales que rompan la visualización durante el desarrollo.

Durante las primeras pruebas deben utilizarse fotografías no sensibles.

## 8. Flujo general previsto

Recorrido previsto:

```text
Selección desde la galería
→ vista previa local
→ lectura EXIF
→ cálculo de metadatos automáticos
→ revisión y edición manual
→ compresión y conversión a WebP
→ obtención del ID token de Firebase
→ llamada al Worker /auth
→ credenciales temporales de ImageKit
→ subida directa desde el navegador
→ creación del documento en Firestore
→ aparición en la galería
```

## 9. Asistente de subida

La interfaz futura estará dividida en tres pasos:

1. Seleccionar.
2. Revisar y completar.
3. Subir.

Debe diseñarse primero para móvil y funcionar también en tablet y escritorio.

Primera versión:

- Selección múltiple desde la galería.
- No incluir inicialmente un flujo específico de “Hacer una foto”.
- Máximo inicial de 20 fotografías por lote.
- El límite debe estar centralizado y ser configurable.

## 10. Metadatos automáticos

La aplicación intentará obtener:

- Fecha real de captura.
- Hora real de captura.
- GPS.
- Orientación.
- Dimensiones.
- Nombre original.
- Tipo MIME.
- Tamaño original.
- Formato.
- Fecha de modificación como último recurso.

Prioridad propuesta para la fecha:

1. EXIF `DateTimeOriginal`.
2. EXIF `CreateDate`.
3. Otro campo EXIF fiable.
4. `File.lastModified` como último recurso.
5. Sin fecha automática cuando no exista información fiable.

Debe guardarse el origen del dato:

- EXIF.
- Archivo.
- Manual.
- Desconocido.

Con la fecha se calculará el día del viaje.

Si la fecha está fuera del rango:

- No se rechazará la fotografía.
- Se mostrará un aviso.
- El usuario podrá corregirla o mantenerla.

Si existen coordenadas y lugares del viaje con coordenadas, se podrá sugerir localmente el lugar más cercano, sin utilizar APIs externas de pago.

La sugerencia nunca se aplicará silenciosamente.

## 11. Metadatos manuales

Campos futuros propuestos:

- Título.
- Descripción.
- Lugar relacionado.
- Nombre libre del lugar.
- Ciudad.
- País.
- Fecha y hora.
- Día del viaje.
- Personas.
- Etiquetas.
- Favorita.
- Destacada.
- Texto alternativo.
- Pie de foto.

Todos los campos manuales serán opcionales.

Los campos sin valor deben omitirse del documento.

No guardar:

- Cadenas vacías.
- Arrays vacíos.
- `null`.
- `undefined`.

Para booleanos opcionales:

- Guardar `favorite: true` únicamente cuando corresponda.
- Guardar `featured: true` únicamente cuando corresponda.
- La ausencia del campo equivale a `false`.

## 12. Edición por lotes

Debe existir una sección futura “Aplicar a todas” para:

- Lugar.
- Personas.
- Etiquetas.
- Ciudad.
- País.
- Día del viaje cuando proceda.

Cada fotografía podrá sobrescribir individualmente los valores comunes.

La arquitectura debe diferenciar:

- Valor automático.
- Valor aplicado al lote.
- Valor individual.
- Campo eliminado expresamente.

## 13. Procesamiento local

Los originales no se subirán.

Parámetros iniciales orientativos:

- Formato final: WebP.
- Lado largo aproximado: entre 2200 y 2400 píxeles.
- Calidad inicial aproximada: 0,82.
- Peso deseado: entre 300 KB y 700 KB.
- Máximo inicial orientativo: 900 KB.

El máximo debe estar centralizado y ser configurable.

No debe destruirse la calidad visual para cumplir de forma ciega el objetivo de tamaño. Las fotografías complejas podrán necesitar tratamiento especial o mostrar un aviso.

Procesamiento futuro:

- Leer EXIF antes de canvas.
- Corregir orientación.
- Redimensionar.
- Convertir a WebP.
- Ajustar calidad.
- Liberar object URLs.
- Procesar con concurrencia baja.

Concurrencia orientativa:

- Procesamiento de imagen: 1 en móvil.
- Subidas simultáneas: máximo 2.

## 14. HEIC y HEIF

Primera versión:

- Intentar procesarlos cuando el navegador lo permita.
- No prometer compatibilidad total.
- Detectar fallos.
- Mostrar un mensaje claro.
- No bloquear el resto del lote.

## 15. Librerías previstas

No se instalarán en fase 0.

Librerías a evaluar en fases posteriores:

- `exifr`
- `@imagekit/javascript`

Uso previsto:

- `exifr` para leer únicamente los metadatos necesarios.
- `@imagekit/javascript` para subir con progreso, cancelación y credenciales temporales.

## 16. Duplicados

Primera versión:

Usar una huella rápida basada en una combinación como:

- Nombre original.
- Tamaño.
- `lastModified`.
- Anchura.
- Altura.

Posteriormente podrá añadirse SHA-256 del original o de la copia optimizada.

Ante una coincidencia:

- Mostrar advertencia.
- Permitir no subir.
- Permitir subir de todas formas.

## 17. Consistencia entre ImageKit y Firestore

No existen transacciones distribuidas.

Estrategia prevista:

1. Generar `photoId` local.
2. Procesar la imagen.
3. Subir primero a ImageKit.
4. Crear después el documento en Firestore.

Si ImageKit funciona y Firestore falla:

- Mantener el estado local.
- Conservar `imageKitFileId` y ruta.
- Permitir reintentar guardar los metadatos.
- Permitir eliminar el archivo huérfano en una fase posterior.

El borrado robusto necesitará un endpoint seguro futuro del Worker, por ejemplo:

```text
POST /delete
```

No se implementará todavía.

## 18. Búsqueda futura

Para el volumen familiar previsto:

- Buscar localmente sobre los metadatos cargados.
- No usar Algolia ni servicios externos.
- Normalizar mayúsculas, minúsculas y tildes.
- Preparar tokens de búsqueda limitados.
- Usar `collectionGroup('photos')` para la futura galería global cuando sea necesario.

Campos de búsqueda:

- Título.
- Descripción.
- Viaje.
- Lugar.
- Ciudad.
- País.
- Día.
- Fecha.
- Personas.
- Etiquetas.
- Favoritas.
- Destacadas.

## 19. Galería futura

Preparar la arquitectura para:

- Galería por viaje.
- Agrupación por días.
- Miniaturas responsive.
- Lazy loading.
- Lightbox.
- Navegación anterior y siguiente.
- Zoom.
- Favoritas.
- Destacadas.
- Edición.
- Borrado.
- Galería global.
- Búsquedas y filtros.

ImageKit generará tamaños mediante transformaciones de URL.

No se almacenarán físicamente varias copias de cada tamaño.

## 20. Fases posteriores aprobadas

### Fase 1

Sección Fotos vacía, ruta, tarjeta y estado inicial.

### Fase 2

Modelo TypeScript, servicio Firestore, listener y protección frente al borrado del viaje.

### Fase 3

Selección múltiple y previsualización local.

### Fase 4

Lectura EXIF y metadatos automáticos.

### Fase 5

Formulario de revisión y edición por lotes.

### Fase 6

Compresión y conversión a WebP.

### Fase 7

Autorización y subida real de una sola fotografía.

### Fase 8

Cola de múltiples fotografías.

### Fase 9

Galería responsive.

### Fase 10

Búsquedas y filtros.

### Fase 11

Borrado robusto y endpoint seguro del Worker.

### Fase 12

Auditoría de seguridad, costes, reglas, accesibilidad y pruebas móviles.

Cada fase debe terminar con:

- Build.
- Lint.
- Pruebas correspondientes.
- Revisión visual cuando proceda.
- Informe de archivos modificados.
- Sin avanzar automáticamente a la fase siguiente.

## 21. Modelo orientativo futuro

El modelo final se concretará en una fase posterior, pero debe contemplar estas áreas:

- Identidad: `id`, `tripId`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.
- Archivo original: nombre, tipo MIME, tamaño, fecha de modificación y dimensiones detectadas.
- Captura: fecha, hora, origen de la fecha, GPS, orientación y dimensiones.
- Edición manual: título, descripción, lugar, ciudad, país, personas, etiquetas, favorita, destacada, texto alternativo y pie de foto.
- ImageKit: `fileId`, `url`, `filePath`, `thumbnailUrl` derivada o transformación, formato final, tamaño final y dimensiones finales.
- Estado: pendiente, procesando, subiendo, guardado, error o eliminación pendiente.

Los campos opcionales deben omitirse cuando no tengan valor útil.

## 22. Seguridad, reglas y pruebas

Antes de subir fotografías reales deben resolverse estos puntos:

- Versionar reglas de Firestore en el repositorio.
- Revisar permisos de lectura y escritura para `trips/{tripId}/photos/{photoId}`.
- Confirmar que solo usuarios autorizados pueden crear, editar y eliminar metadatos.
- Probar `/auth` del Worker con sesión real de Firebase.
- Revisar `ALLOWED_ORIGINS`.
- Confirmar que no hay claves privadas en el frontend, en GitHub, en logs ni en variables `VITE_`.
- Definir una estrategia segura para eliminación de archivos en ImageKit.
- Probar primero con fotografías no sensibles.

## 23. Límites iniciales recomendados

Valores iniciales centralizables:

- `MAX_PHOTOS_PER_BATCH`: 20.
- `MAX_UPLOADS_IN_PARALLEL`: 2.
- `MOBILE_IMAGE_PROCESSING_CONCURRENCY`: 1.
- `TARGET_LONG_EDGE_PX`: 2200-2400.
- `INITIAL_WEBP_QUALITY`: 0.82.
- `TARGET_FILE_SIZE_KB`: 300-700.
- `MAX_FILE_SIZE_KB`: 900.

Estos límites deben poder ajustarse sin repartir números mágicos por componentes.

## 24. Criterios de aceptación de la primera implementación real

La primera fase con subida real no estará completa hasta que:

- El usuario pueda seleccionar una imagen.
- Se muestre vista previa local.
- Se obtengan credenciales temporales mediante el Worker.
- Se suba una copia optimizada a ImageKit.
- Se cree el documento de metadatos en Firestore.
- La imagen aparezca en la galería del viaje.
- No se suba el original.
- No se exponga ninguna clave privada.
- Build, lint y comprobaciones manuales sean correctas.

## 25. Decisiones que no deben reabrirse sin motivo

Salvo que aparezca una limitación real durante la implementación:

- La colección principal será `trips/{tripId}/photos/{photoId}`.
- La ruta física de ImageKit será `/nuestros-viajes/{tripId}/{photoId}.webp`.
- La primera versión usará archivos públicos no listados.
- La primera versión no usará Firebase Storage ni Firebase Functions.
- La primera versión no usará APIs de pago.
- La primera versión no procesará vídeo.
- La primera versión no prometerá compatibilidad total con HEIC/HEIF.
