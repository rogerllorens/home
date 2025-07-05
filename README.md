# Scanly

Skeleton React Native app demonstrating barcode scanning, QR generation and OCR features.
The project uses TypeScript throughout. A `storageService` wrapper centralizes AsyncStorage access and keys.
Product lookups and OCR results are cached for faster repeated scans.
Most components now use TypeScript.
This revision adds a splash screen, onboarding flow with simple animations and a scanning overlay tuned to 40% of the screen for better context. The QR generator now shows template previews with the applied logo. AR overlays label detected codes and the "Abrir" button opens links or shows the raw content.

## Features
- Safe browsing checks using Google Safe Browsing API with local fallback.
  Requires an environment variable `SAFE_BROWSING_KEY`.
  Optional Sentry error reporting uses `SENTRY_DSN`.
- Barcode and QR scanning using device camera.
- Scanning overlay with animated highlight, flash toggle, camera switch and batch mode.
- Splash screen with logo animation and optional onboarding slides.
- Splash screen now displays a short tagline beneath the animation.
- & Optional cloud OCR with language auto-detection is available when GOOGLE_VISION_KEY is set.
- OCR screen lets you pick an image visually, shows a skeleton placeholder and progress indicator when extracting text, plus copy/share actions with "copied" feedback.
- OCR screen can translate extracted text via LibreTranslate.
- OCR screen shows OCR progress percentage, allows editing text, and saving results as notes with translations stored in history.
- OCR progress now displays clear phases (carga, preprocesamiento, reconocimiento, postprocesamiento) so progress bars do not appear stuck.
- Haptic feedback enhances key actions like onboarding steps and successful QR generation.
- Text respects system font scaling and honors the Reduce Motion preference to simplify animations when enabled.
- The onboarding tutorial uses react-native-copilot to spotlight controls.
- Basic filters let you crop documents and adjust contrast before running OCR,
  improving accuracy.
- Product lookup via UPCitemdb with barcode.monster fallback. If `GOOGLE_PRODUCTS_KEY` or `AMAZON_KEY` are set the app fetches images and prices from premium APIs.
- Optional geocoding using Google Maps APIs.
- Automation hooks via Zapier/IFTTT webhooks with CSV export fallback.
- Settings provides a "Tips & Shortcuts" tab.
- Less-frequently used screens like Analytics can be tucked under a "More" tab if desired.
- Light, dark, low-light and high contrast themes with accessibility support.
- QR code generator with live preview and customizable color. Dynamic QR codes can set a password and expiration date for premium usage.
- History screen with favorite filtering, folders and per-item comments.
- History screen auto-tagging content types and offering multi-selection with batch actions and filters for tag and type.
- History and Gallery lists use alternating backgrounds and show friendly empty-state messages when no data is available.
- Gallery picker to scan codes from images.
- Gallery images support crop and annotation before OCR with placeholders for a canvas UI.
- Advanced image editing tools let you crop, rotate, adjust brightness/contrast and sharpen pictures prior to scanning or OCR.
- Analytics screen includes automatic insight cards showing weekly changes, best hour and top day.
- Damaged or partially obscured codes can be decoded with ZXing; future releases aim to use an AI inpainting fallback.
- Background batch scanning processes frames while the UI stays hidden for rapid inventory work.
- OCR auto-detects language using `franc` and reruns recognition for higher accuracy.
- Dynamic QR endpoints record scans and return statistics. Short links can expire or require a password.
- Batch OCR processes multiple images and exports a combined PDF.
- Voice commands are customizable; actions can be spoken back using text to speech.
- Scan screen draws AR labels for detected objects in addition to codes.
- An optional interactive tutorial uses react-native-copilot to guide new users.
- Settings tab with Privacy Policy, FAQ and Terms & Conditions in top tabs.
 - Settings include theme customization options and a "Tips & Shortcuts" tab listing gestures and voice commands.
 - Power saving mode disables heavy animations and blur effects.
- Internationalization with English and Spanish translations via `react-i18next`.
- Settings let you reset tutorial tips and store your profile name.
- Analytics screen with charts for scans over time and by type, plus period and tag filters.
- Animated buttons with haptic feedback for key controls.
- Layout animations enhance selection mode transitions in History.
- Onboarding flow now includes a progress bar indicator.
- Onboarding slides feature icons alongside animations for clarity.
- Glassmorphism overlays and soft shadows for a neumorphic look.
- Liquid Glass effects with dynamic blur on cards and controls.
- Neumorphic buttons with gentle shadows reinforce tactility.
- AR overlay labels for detected codes with multi-scan support.
- Floating "Abrir" button appears on detected codes with colored toast feedback.
- Swipe gestures enabled for changing tabs and camera, with vertical swipe to open the gallery.
- Offline banner appears when network is lost so users know some services are disabled.
- Skeleton loaders display while camera or QR previews initialize to keep the UI responsive.
- Destructive actions like deleting history items ask for confirmation.

## Security features
 - Sensitive values like profile names and API tokens are stored using `react-native-encrypted-storage` so they stay encrypted in the device keychain. Tokens can be rotated with helpers in `tokenService` and are never committed.
- The app detects jailbroken or rooted devices via `jail-monkey` and can warn about insecure environments.
- Network requests to Safe Browsing and product lookup APIs enforce TLS via `react-native-ssl-pinning`.
- Voice commands let you say "Escanear" o frases como "escanea desde galería". El micrófono pulsa al escuchar y muestra confirmación visual.
- La frase reconocida se muestra en pantalla antes de ejecutar el comando para que el usuario pueda corregirlo.
- Power saving mode can disable animations and blur.
- Commands also understand phrases like "generar QR de https://sitio.com" or "traducir a inglés". Results can be leído aloud using text-to-speech.
- The voice button displays an animated ring when actively listening.
- Métricas de éxito y error se guardan para mejorar el reconocimiento de voz.
- Spoken feedback reads scan results aloud when voice mode is enabled.
- History lists show skeleton loaders while data loads.
- OCR translation allows choosing the target language.
- Settings include About and Profile tabs showing app version and letting you store your name.
- Images load with `react-native-fast-image` for better performance.
- Works offline by caching scans and performing OCR on-device.
- Optional cloud OCR mode sends images to Google Vision when `OCR_CLOUD_KEY` is provided. Cached results are encrypted.
- Cloud sync via Firebase keeps history across devices when signed in.
- Integrations tab lets you add Zapier/IFTTT webhooks for events like scan or QR generation.
- Batch counters animate with kinetic text when scans are detected.
- Swipe with three fingers left undoes the last scan.
- Recent scans appear above the camera for quick reuse.
- A toast shows how many codes were scanned after exiting batch mode.
- QR templates with optional logo and dynamic QR generation with usage counts displayed on the generator.
- History screen suggests a filter based on your most frequent tags.
- Generate screen permite copiar el enlace generado y activar guardado automático.
- Gallery muestra un skeleton loader al cargar imágenes y permite filtros rápidos con vista previa ampliada. Inicia con un tutorial guiado y esconde filtros avanzados bajo un panel colapsable.
- Consistent button component with primary, secondary and icon variants.
- Improved contrast in dark and low-light themes following WCAG recommendations.
- Supports Aztec, DataMatrix and PDF417 codes with a settings option to choose
  which formats to detect.
- OCR now accepts a language parameter for multi-language text recognition.
- OCR processing runs in a background thread so la interfaz no se congela.
- Product lookups include simple price links to Amazon and eBay.
- Firebase-based cloud sync keeps your history backed up and available on other devices.
- Integrations tab configures Zapier or IFTTT webhooks for scans and generated QRs.
- Gallery and History entries can be exported as PDF and uploaded to cloud drives
  when configured.
- Analytics include barras por hora y tarjetas de percentil para comparar tu actividad.

## Color scheme

Scanly uses a complementary blue and orange palette inspired by design guidance:

- **Primary blue `#0055AA`** conveys trust and is used for most navigation and
  titles.
- **Action orange `#FF8800`** highlights CTAs and active elements.
- Neutral grays like `#F5F5F5` and `#212121` balance backgrounds.
- The app follows a _60‑30‑10_ ratio: about 60 % blue, 30 % neutrals and 10 %
  orange accents.
- Dark and low‑light themes soften these tones (`#6699FF` and `#FF9A33`) for
  comfortable reading.

## Design system

To keep the interface consistent Scanly provides basic design tokens:

- **Fonts**: the `System` font with small/medium/large sizes.
- **Spacing**: standard gaps of 8, 16 and 24 px used across components.
- **Theme object**: exported from `src/utils/theme.js` to share colors, fonts and spacing.

Components such as `AppButton` read these tokens to enforce uniform typography and paddings.

- Performance metrics (voice success rate, scan latency) stored for UX research.

## Folder Structure
```
/src
  /screens        # screen components
  /components     # smaller UI pieces
  /services       # API wrappers
  /hooks          # custom hooks
  /store          # Zustand stores
  /utils          # shared helpers and theme
  /assets         # images and animations
/navigation       # navigators
```

Each file is a minimal placeholder to help start development.
- Zustand stores are split by domain for history and metrics.

## Tendencias clave en UX 2025
La interfaz aplica varias prácticas actuales:

- **Minimalismo con propósito**: pantallas limpias con un único objetivo por vista.
- **Micro‑interacciones**: animaciones suaves y vibración sutil al usar controles.
- **IA funcional** para sugerencias y clasificación de contenido.
- **Accesibilidad** con soporte de alto contraste y lectores de pantalla.
- **Modo oscuro adaptativo** para reducir la fatiga visual.
- **Iconos minimalistas**: vectoriales con color de marca para estados activos.

## Mejoras por pantalla
- **Splash**: animación breve con logo y botón "Skip".
- **Onboarding**: cuatro slides con progreso y tips. Encuesta final y registro de variante A/B.
- **Scan**: overlay dinámico, botones de 44 px con feedback háptico y batch con estadísticas en vivo.
- **Generate**: vista previa realista de plantillas, logo recortable, enlace copiable y contador de escaneos con botón para compartir.
 - **Gallery**: grid tipo *bento* con skeleton loader y tutorial contextual la primera vez. Filtros avanzados se ocultan en un panel colapsable.
 - **History**: tarjetas con acciones rápidas, onboarding de filtros con copilot y secciones colapsables para opciones avanzadas. Vista en mapa.
 - **OCR**: selector de imagen con skeleton, porcentaje de progreso, edición y guardado de notas con traducción automática.

## Prompt for Codex
```
/\*
 * Project: Scanly
 * Framework: React Native (JS/TS)
 * Bottom tabs: Scan, Generate, Gallery, History, OCR
 *
 * Implement ScanScreen:
 * - usa react-native-camera o vision-camera
 * - overlay guía
 * - botones: flash, switch camera, batch toggle, galería
 * - onCodeDetected: llama api Safe Browsing; si URL segura, muestra snackbar con opciones
 *   + si código de producto UPC: llamar productLookup (UPCitemdb, fallback barcode.monster)
 *   + mostrar precio si hay
 * - modo batch: acumula escaneos, contador UI y vibración por cada scan
 * - guardar cada scan en storage (tipo, contenido, fecha, contador, favorito)
 *
 * Incluye módulos service:
 * - safeBrowsing.js: función verifyUrl(url): boolean
 * - productLookup.js: lookupUPC(upc): retorna datos producto
 *   usa UPCitemdb gratuito, y si marca EXCEED_LIMIT o error, cambia a barcode.monster
 * - storage.js: guarda/recupera historial con counters y favoritos
 *
 * Usa librería snackbars y tema (colores: primary #0055AA, action #FF8800)
 */
```
\n### TypeScript Improvements\nThe storage and product lookup modules now use TypeScript definitions for stronger type checking.

## Caching and error reporting
OCR and product lookups use a singleflight cache to avoid duplicate network requests. Errors are sent to Sentry when configured.

 History and gallery filters persist between sessions. Batch mode progress is stored so scans resume if the app closes.
 History and Gallery lists use **FlashList** with estimated item sizes for better performance on long histories.

## Performance considerations
- **Hermes enabled**: the sample `android/app/build.gradle` and `ios/Podfile` turn on the Hermes engine for faster startup and reduced memory usage.
- **Optimized lists**: lists now use Shopify's `FlashList` with `estimatedItemSize` and tuned batch parameters. The optional `react-native-performance-lists-profiler` plugin helps measure frames and blank areas during scrolling.
- **Native animations**: Animated API calls use `useNativeDriver: true` when possible so transforms run on the UI thread.
- **Profiling**: Use Hermes profiling with Flipper and the built-in performance monitor to detect jank and memory leaks.
- **Console cleanup**: Production builds strip `console.log` via `babel-plugin-transform-remove-console` so the JS thread stays lightweight.
- **Memoization**: Components are wrapped with `React.memo` and callbacks use `useCallback` to avoid unnecessary re-renders.
- **Image optimization**: `react-native-fast-image` loads assets as WebP when possible and caches them locally.

## Accessibility considerations
- All interactive elements include `accessibilityLabel` and a proper `accessibilityRole` so screen readers describe them.
- Touch targets respect the 44 px guideline via padding or `hitSlop`.
- High-contrast and dark themes pass the WCAG 4.5:1 ratio; automatic checks can run in CI using tools like `axe`.
- A high-contrast mode toggled from Settings or the OS improves legibility for users with vision impairments.
- VoiceOver and TalkBack labels let the entire UI be navigated by screen readers.
- Swipe gestures open the gallery or generator quickly and a three-finger swipe left undoes the last scan.
- Sensitive scans can be moved to a secure vault protected by biometrics; scans older than a configurable number of days auto-delete.
- Multiple scans may be exported as a PDF or ZIP and shared directly to Slack, Trello, Notion or Google Drive.
- Navigation focus moves logically when modals open and is testable with VoiceOver and TalkBack on real devices.
- Keyboard users can reach buttons thanks to focusable props and explicit dismissal gestures have button alternatives.

## Testing
Integration tests with **React Native Testing Library** simulate scanning and viewing history with mocked services. Run `npm test` to execute the Jest suite (requires installing dev dependencies).
Snapshot tests verify that components like ScanScreen, HistoryScreen and the onboarding slides render consistently. Lottie animations are mocked so snapshots remain stable.
`jest-axe` tests help ensure screens meet WCAG rules.
Detox end-to-end tests now verify onboarding navigation and the main scan flow.

### Continuous integration
Example GitHub Actions workflows compile both Android and iOS, run Jest and Detox integration tests and upload builds to beta channels on each push.
Our simplified workflow in `.github/workflows/ci.yml` runs `npm ci` and `npm test` on every push or pull request. Tests mock network services so external APIs are not called. Consider adding Detox E2E steps later.
Fastlane scripts can automatically deliver builds to TestFlight and Play Console beta tracks when credentials are provided as GitHub Secrets.

\nSee [API reference](docs/api.md) for service inputs and outputs.
\nAdditional end-to-end tests cover QR generation, OCR and gallery flows. CI is configured for BrowserStack when BROWSERSTACK_USERNAME is set.
\nThe OCR screen shows a banner when offline to clarify that cloud features are disabled.
\nSee [CONTRIBUTING.md](CONTRIBUTING.md) for PR guidelines.

### Environment setup
Create a `.env` file based on `.env.example` and set your API keys. The app reads them via `react-native-config` so keys are not hard-coded in the bundle.

Production builds enable R8 minification with custom `proguard-rules.pro`.
