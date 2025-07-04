# CodeMaster Pro

 Flutter app skeleton with five tabs:

- **Escanear**: Usa `mobile_scanner` para leer códigos 1D y 2D (QR, EAN, PDF‑417…).
  Si la cámara no es compatible se activa automáticamente un visor alternativo
  basado en ZXing (`qr_code_scanner`).
- Al detectar URLs se consultan las listas de Google Safe Browsing y se avisa si
  son peligrosas. Puedes activar "Confirmar antes de abrir enlaces" para pedir
  aprobación incluso cuando sean seguras. La vista previa muestra la URL
  completa, su dominio y un indicador de seguridad antes de abrirla.
  Si la consulta a Safe Browsing falla se intenta con APIVoid y luego con
  isMalicious. Como alternativa adicional se descargan periódicamente las
  listas de Emerging Threats para comprobar dominios maliciosos. Si todas las
  opciones están agotadas se muestra un mensaje indicando que no fue posible
  comprobar la seguridad.
  Además se consulta una pequeña lista local de URLs maliciosas cuando no
  hay red para ofrecer una comprobación básica sin conexión.
  - También identifica contenido Wi-Fi, contactos, teléfonos, eventos y
  geolocalización para ofrecer acciones contextuales en un diálogo. Las
  coordenadas pueden verse en un mapa interactivo y los eventos ICS se
  analizan con `icalendar_parser` para mostrar el título, ubicación y fecha
  antes de añadirlos al calendario.
**Generar**: Permite crear códigos en múltiples formatos (URL, teléfono, SMS,
  email, Wi-Fi, vCard o geolocalización). Un panel con plantillas guía la
  introducción de datos y muestra una vista previa textual antes de generar el
  código. Incluye opciones de estilo, logo, tamaño y corrección de errores.
  Los datos se validan para evitar campos vacíos. Se pueden exportar como PNG,
  PDF o SVG y compartirlos directamente.
 - **Galería**: Muestra una cuadrícula de miniaturas usando `photo_manager`
   para que puedas previsualizar rápidamente tus fotos. Al tocar una imagen se
   abre en el editor donde puedes rotar, recortar y ajustar brillo o contraste
   antes de procesarla. Tras editar, `OcrService` preprocesa la imagen y utiliza
   ML Kit o Tesseract. Mientras se procesa se muestra una animación Lottie de
   carga junto al texto "Escaneando texto…".
   El texto detectado puede traducirse offline con
   `google_mlkit_language_id` y `google_mlkit_translation`. Si el idioma no
   está disponible o se alcanzan los límites locales, la app recurre a la API
   gratuita de LibreTranslate como respaldo para evitar costes adicionales.
- **Historial**: Se divide en "Escaneados" y "Generados" para mantener orden.
  Incluye una barra de búsqueda y filtros por tipo mediante chips que permiten
  combinar categorías (URL, contacto, evento, etc.). Cada entrada guarda fecha
  y contador en `Hive`, puede copiarse, abrirse o compartirse por WhatsApp o
  Telegram, eliminarse con confirmación y exportarse a CSV.
- **Configuración**: Permite borrar el historial, exportar datos, gestionar permisos y elegir el tema. Ahora también controla si se muestra el splash inicial y su duración.
La navegación inferior utiliza iconos outline personalizados para Generar, Galería e Historial, con badges significativos (∞ para modo batch y conteo real para el historial).

La app utiliza la fuente **Roboto** gracias a `google_fonts` y todos los íconos siguen un estilo outline minimalista. Se adapta automáticamente al tema con una paleta clara (fondo #F8F8F8, acento azul #0055AA) y otra oscura (fondo #121212, acento azul claro #66B2FF).
 Muestra un botón de escaneo animado con efecto pulsante y una línea de exploración sobre la cámara.
 Aparece un CTA "Mantén pulsado para lote" junto al botón principal durante unos segundos.
 Al abrir el escáner se muestra brevemente el texto "Toca para escanear" como guía inicial.
 Se puede tocar cualquier parte de la vista de la cámara para reanudar el escaneo y, tras leer un código, los controles de flash y cámara se ocultan con una animación.
Un borde verde resalta brevemente el código capturado y puede activarse modo batch desde la pantalla de ajustes para continuar escaneando sin pausar la cámara. El overlay oscurece la cámara con mayor opacidad al detectar un código.
El logo animado de **CodeMaster Pro** se usa en la pantalla de inicio, el escáner y el generador. En la galería, ajustes e historial se muestra una versión estática para no distraer.
Gestiona permisos de cámara y galería con `permission_handler` solicitándolos solo cuando el usuario inicia un escaneo. Si se deniega de forma permanente se muestra un diálogo único con acceso a los ajustes.
La pantalla de configuración muestra el estado de cada permiso con iconos en color y permite elegir entre tema claro, oscuro o seguir el sistema. Incluye un mensaje de privacidad, exportar el historial en CSV, reintentar los permisos y ajustar el splash.
Incluye un splash screen nativo configurado con `flutter_native_splash` que utiliza logotipos específicos para modo claro y oscuro.
El historial incluye "pull to refresh", un contador total de códigos y contenedores `shimmer` cuando está vacío. Las transiciones entre pestañas combinan deslizamiento y fundido para una sensación más suave.
Ahora permite filtrar por tipo de contenido, mostrar solo URLs inseguras, limitar por rangos de tiempo y ordenar los resultados. El campo de búsqueda ofrece sugerencias basadas en los códigos más frecuentes.
Cada entrada del historial ahora muestra la fecha del primer y último escaneo y destaca los códigos más usados con una estrella. Al refrescar la lista se revalida la seguridad de las URLs usando Safe Browsing y se marca si alguna se volvió peligrosa.
Si no hay conexión aparece un aviso y se usa el resultado guardado en caché durante siete días. Al recuperar la conexión se revalidan automáticamente si está activado en ajustes.
Durante la pantalla de inicio la cámara se precarga en segundo plano para reducir el tiempo de apertura del escáner.
La pantalla de splash sincroniza la aparición del logo y la barra mediante `FadeTransition` con `Curves.easeInOutCubic` para una animación más suave.
En el escáner se puede hacer *pinch to zoom* y un nuevo botón permite alternar el modo continuo/one‑shot.
Al iniciar por primera vez se muestra un onboarding de cuatro pantallas que resume el escaneo, el OCR, el generador y la verificación de seguridad. Una vez completado no vuelve a aparecer.
El generador permite exportar a PNG o PDF y compartir la imagen mediante un panel que ofrece el menú estándar de `share_plus` y opciones directas para WhatsApp o Telegram con `social_sharing_plus`. Tras guardar se muestra una animación Lottie con un check de éxito.
El proyecto incluye un `manifest.json` y `favicon.png` para su posible despliegue como PWA en la web.
El generador valida el contraste entre colores y avisa si la relación de contraste es inferior a 4.5:1 para mantener la legibilidad del QR.
En la galería, las imágenes se recortan y se normalizan (deskew, escala de grises, umbralización) antes del OCR para mejorar la precisión. Puede activarse
un modo oscuro forzado que invierte los colores de la imagen antes de procesarla para aumentar el contraste en tickets o facturas térmicas.
El historial muestra una barra de progreso con la frecuencia relativa de cada código y ahora una sección de estadísticas enriquecidas. Utiliza `fl_chart` para generar gráficos interactivos de los escaneos diarios de la última semana, las últimas cuatro semanas en barras y un gráfico circular con los porcentajes por modo. Puedes exportar estas gráficas como imagen.
Los filtros de historial se gestionan desde un panel BottomSheet accesible desde el icono de filtro en la barra superior.
El análisis del contenido se realiza de forma modular mediante `ContentParser`,
lo que facilita ampliar la detección a nuevos formatos.
Se puede alternar entre escanear QR o códigos de barras; el overlay adapta su forma para indicar el área de enfoque. Cada escaneo actualiza estas métricas de forma local y muestra avisos al alcanzar hitos como 200 lecturas mensuales.
Un tutorial contextual destaca el boton de modo lote la primera vez que se abre la pantalla de escaneo y aparece una vista previa flotante con el contenido detectado antes de confirmarlo.
Este código es una base simplificada para las funciones descritas en la especificación.
\nEsta versión incluye internacionalización con soporte para 184 idiomas gracias a archivos .arb en la carpeta l10n y \`AppLocalizations\`.
La configuración ahora incluye un acceso a Preguntas frecuentes y a una pantalla "Acerca de" con la política de privacidad, opciones de feedback y licencias.
El historial indica con un icono rojo si hay elementos pendientes de sincronizar porque se capturaron sin conexión.
Puedes activar "Forzar modo oscuro" en OCR desde Ajustes para invertir los colores de las imágenes antes del reconocimiento.

Para soporte o preguntas, escribe a scanlyqr@gmail.com.

## Configuración de la API
Para que la verificación de enlaces funcione debes crear un archivo `.env` en la
raíz del proyecto basado en `.env.example` y definir la clave
`SAFE_BROWSING_API_KEY` obtenida en Google Cloud.
Si quieres cifrar el historial y otras cajas de Hive puedes definir `HIVE_KEY`
con una clave AES de 32 bytes en Base64. La app la usará para abrir las cajas
cifradas.

El OCR ofrece ahora un selector de idioma destino y muestra un aviso inicial con instrucciones la primera vez que se usa.
La app captura errores globales y muestra un widget rojo cuando algo falla.
Se adapta a orientación horizontal en pantallas grandes para mostrar la vista de generación en dos columnas.

## Analítica opcional
Si `ENABLE_ANALYTICS` está en `true` se inicializa Firebase y se registran eventos
como códigos escaneados y QR generados para consultarlos en Firebase Analytics
sin coste adicional.

## Design system
The app uses a central set of color and spacing tokens defined in `lib/design_system.dart`. Text styles follow a Roboto hierarchy from `displaySmall` (36) down to `bodySmall` (12) so headers, buttons and captions remain consistent.
Custom SVG icons live under `assets/icons` and are loaded with `flutter_svg`. They
animate with `AnimatedScale` when tabs change to provide tactile feedback.

## Tamaño de la app
Para controlar el peso final se recomienda ejecutar `flutter build apk --analyze-size`
o el equivalente en iOS y revisar los recursos incluidos. Este proyecto mantiene
sólo los idiomas más usados para reducir espacio y permite deshabilitar
animaciones opcionales o lotties si se requiere añadiendo la flag correspondiente
en `pubspec.yaml`.

Antes de compilar para Android ejecuta `scripts/patch_flutter_tesseract_gradle.sh`
para corregir un problema con el plugin `flutter_tesseract_ocr` que requiere un
`namespace` en su `build.gradle`.

Antes de compilar para Android ejecuta `scripts/patch_photo_manager_gradle.sh` para solucionar un error de compatibilidad con `photo_manager`.
Antes de compilar para Android ejecuta `scripts/patch_qr_code_scanner_gradle.sh` para añadir el namespace faltante en `qr_code_scanner`.
Antes de compilar para Android ejecuta `scripts/patch_whatsapp_share_gradle.sh` para añadir el namespace en `whatsapp_share`.
Antes de compilar para Android ejecuta `scripts/patch_app_ndk.sh` para fijar la versión del NDK a `27.0.12077973`. El script reemplaza cualquier valor previo en tu `build.gradle`.
Antes de compilar para Android ejecuta `scripts/patch_kotlin_jvm.sh` para unificar el `jvmTarget` y las opciones de Java en 17 incluso si los plugins ya definen otro valor.
En Windows define la variable de entorno `PUB_CACHE` apuntando a tu carpeta `Pub\\Cache` antes de ejecutar el script para que pueda localizar los plugins instalados.
Todos estos scripts están escritos en **bash**, por lo que en Windows deben ejecutarse
desde Git Bash o WSL usando `bash scripts/nombre_del_script.sh` en lugar de `sh`.
## Archivos binarios
Algunos iconos PNG y animaciones Lottie no se incluyen en este repositorio por limitaciones de Codex. Debes copiarlos manualmente antes de compilar manteniendo la misma estructura de carpetas:

- assets/app_icon.png
- assets/logo.png
- assets/logo_dark.png
- assets/logo_light.png
- assets/animations/loading.json
- assets/animations/success.json
- web/favicon.png
- test/assets/test.png
