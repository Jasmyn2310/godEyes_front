# INFORME TÉCNICO DE INGENIERÍA DE SOFTWARE
## Plataforma GodEyes: Arquitectura Móvil, Telemetría en Tiempo Real y Control de Acceso Basado en Roles (RBAC)

---

**Asignatura:** Taller de Ingeniería de Software / Desarrollo Móvil Avanzado  
**Proyecto:** GodEyes - Sistema Integral de Geolocalización y Telemetría Comercial  
**Fecha:** Septiembre de 2026  
**Versión:** 1.0.0 (Release Candidate)  

---

### ÍNDICE GENERAL

1. [Resumen Ejecutivo (Abstract)](#1-resumen-ejecutivo-abstract)
2. [Introducción y Planteamiento del Problema](#2-introducción-y-planteamiento-del-problema)
3. [Objetivos del Proyecto](#3-objetivos-del-proyecto)
   - 3.1 Objetivo General
   - 3.2 Objetivos Específicos
4. [Arquitectura Tecnológica del Sistema](#4-arquitectura-tecnológica-del-sistema)
   - 4.1 Pila Tecnológica (Tech Stack)
   - 4.2 Topología de Red y Conectividad Móvil
5. [Ingeniería de Solución y Patrones Implementados](#5-ingeniería-de-solución-y-patrones-implementados)
   - 5.1 Arquitectura Basada en Roles (RBAC)
   - 5.2 Módulo de Baliza y Telemetría Operativa (Rol: Vendedor)
   - 5.3 Módulo de Exploración y Radar Comercial (Rol: Cliente)
   - 5.4 Navegación Asistida y Centrado Dinámico en Mapa
6. [Seguridad Móvil y Privacidad de Datos (OWASP Mobile MASVS)](#6-seguridad-móvil-y-privacidad-de-datos)
7. [Depuración y Resolución de Desafíos Técnicos](#7-depuración-y-resolución-de-desafíos-técnicos)
   - 7.1 Pérdida de Foco y Colapso del Teclado en Android (Elevation Bug)
   - 7.2 Resolución de Red y Tráfico Claro (Cleartext Traffic)
8. [Resultados Obtenidos y Validación](#8-resultados-obtenidos-y-validación)
9. [Conclusiones](#9-conclusiones)
10. [Referencias Bibliográficas](#10-referencias-bibliográficas)

---

### 1. Resumen Ejecutivo (Abstract)

El presente informe documenta el diseño, reestructuración arquitectónica e implementación técnica de la plataforma móvil **GodEyes**. Inicialmente concebida bajo un modelo monolítico experimental, la plataforma presentaba deficiencias de acoplamiento funcional, fallas de persistencia y mezcla de experiencias de usuario entre compradores y vendedores ambulantes. 

A través de un enfoque centrado en la separación de responsabilidades (*Separation of Concerns*) y el control de acceso basado en roles (*RBAC*), se logró desacoplar la interfaz en dos subsistemas principales: una **Baliza de Telemetría GPS Operativa** para los vendedores y un **Radar de Exploración Comercial** con valoración por estrellas y cálculo geodésico para clientes. Asimismo, se implementaron medidas de seguridad móvil contra suplantación de identidad (*ID Spoofing*), aislamiento de *WebViews* y estabilización del renderizado nativo en dispositivos Android.

---

### 2. Introducción y Planteamiento del Problema

El comercio ambulante y los puestos de comida móvil representan un sector dinámico que requiere herramientas tecnológicas de geolocalización en tiempo real para optimizar la captación de clientes. Sin embargo, el desarrollo de aplicaciones móviles de telemetría bidireccional enfrenta desafíos significativos en cuanto a rendimiento, consumo energético y experiencia de usuario.

En la fase previa del prototipo GodEyes, se identificaron las siguientes problemáticas críticas:
* **Mezcla de Contextos de Usuario:** Tanto clientes como vendedores compartían la misma interfaz con un mapa global de pines, forzando a los vendedores a observar a sus propios competidores en lugar de gestionar su transmisión satelital.
* **Vulnerabilidades en la Telemetría:** El emisor de ubicación transmitía identificadores generados pseudoaleatoriamente (`vendor-xxx`), lo que violaba los principios de autenticación e integridad de datos.
* **Fallas de Conectividad y Red:** Incompatibilidad de peticiones HTTP en dispositivos físicos debido a direcciones de loopback emuladas (`10.0.2.2`) y políticas de tráfico seguro en sistemas operativos Android modernos.
* **Anomalías de Renderizado en la UI:** Rebotes en la interfaz y cierre involuntario del teclado virtual al enfocar campos de texto provocados por la manipulación dinámica de capas de hardware (`elevation`).

---

### 3. Objetivos del Proyecto

#### 3.1 Objetivo General
Desarrollar una arquitectura móvil robusta, segura y desacoplada para la plataforma **GodEyes**, proporcionando experiencias personalizadas según el rol del usuario mediante telemetría satelital en tiempo real y catálogo comercial geolocalizado.

#### 3.2 Objetivos Específicos
1. Diseñar e implementar un sistema de **Navegación Dinámica por Roles (RBAC)** en React Native / Expo Router.
2. Construir un **Panel de Baliza Operativa para Vendedores** que permita activar o pausar la transmisión de coordenadas GPS bajo demanda y verificar el estado de enlace en tiempo real.
3. Crear un **Módulo de Exploración para Clientes** con cálculo geodésico de distancias (Fórmula del Semiverseno / Haversine), sistema de reputación por estrellas y enfoque automatizado en mapa.
4. Aplicar estándares de **Seguridad Móvil (OWASP Mobile MASVS)** para la protección de identidades, sanitización de datos de entrada y endurecimiento de vistas Web.

---

### 4. Arquitectura Tecnológica del Sistema

#### 4.1 Pila Tecnológica (Tech Stack)

```
┌─────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA GODEYES                     │
├──────────────────────────────┬──────────────────────────────┤
│ FRONTEND MÓVIL               │ BACKEND DISTRIBUIDO          │
│ • React Native 0.86 / Expo 57│ • NestJS 11.0 (Modular)      │
│ • TypeScript (Strict Mode)   │ • Drizzle ORM (Type-Safe)    │
│ • Zustand (Global State)     │ • PostgreSQL 16 (Supabase)   │
│ • Shopify FlashList          │ • WebSockets (Socket.IO)     │
│ • Leaflet / OpenStreetMap    │ • Passport / JWT Security    │
│ • Expo Image / Lucide Icons  │ • Bcrypt Password Hashing    │
└──────────────────────────────┴──────────────────────────────┘
```

#### 4.2 Topología de Red y Conectividad Móvil

Para garantizar que los dispositivos físicos (smartphones con APK instalada) interactúen eficientemente con el servidor local sin requerir configuraciones rígidas de IP fija:

1. **Servidor Backend Multi-Interfaz:** Enlace del demonio NestJS a la interfaz universal `0.0.0.0:3000`.
2. **Capa de Configuración Centralizada:** Creación del módulo `api.config.ts`, encargado de leer variables de entorno (`EXPO_PUBLIC_API_URL`) con resolución heurística de la IP del host de desarrollo a través de `Constants.expoConfig.hostUri`.
3. **Tráfico de Red Abierto:** Inclusión de `usesCleartextTraffic: true` en el archivo de configuración `app.json`, habilitando el consumo de microservicios locales en redes Wi-Fi bajo Android 9.0 o superior.

---

### 5. Ingeniería de Solución y Patrones Implementados

#### 5.1 Arquitectura Basada en Roles (RBAC)

La navegación principal (`app-tabs.tsx`) y la vista inicial (`index.tsx`) adoptan una evaluación en tiempo de ejecución basada en el estado de autenticación gestionado por Zustand:

```typescript
// Enrutamiento Condicional de Pistas
if (user?.role === 'vendor') {
  return <VendorOperationView />;
}
return <ClientMapView />;
```

* **Vendedor:** Únicamente accede a `Mi Baliza` (transmisor GPS), `Planes` (gestión de suscripción de negocio) y `Perfil`. La pestaña de búsqueda y compra de la competencia se oculta (`href: null`).
* **Cliente:** Accede a `Radar` (mapa de puestos), `Mejores Puestos` (catálogo y filtros) y `Perfil`. La pestaña de suscripciones para vender se inhabilita.

#### 5.2 Módulo de Baliza y Telemetría Operativa (Rol: Vendedor)

Diseñado con enfoque *Touch-First* y ergonomía en zona de pulgar (*Thumb Zone*):
* **Interruptor de Transmisión Satelital:** Botón táctil ergonómico (altura de 54px) que activa o apaga la baliza.
* **Matriz de Telemetría:**
  * Coordenadas geográficas lat/long con precisión flotante.
  * Precisión del GPS en metros (`± X.X m`).
  * Detección de cinemática (estado estático vs. desplazamiento en km/h).
  * Marca de tiempo (*timestamp*) del último paquete emitido vía Socket.IO.
* **Vinculación Criptográfica:** El paquete de ubicación vincula exclusivamente el `user.id` extraído del token JWT verificado.

#### 5.3 Módulo de Exploración y Radar Comercial (Rol: Cliente)

* **Algoritmo de Distancia Geodésica (Haversine):** Calcula en milisegundos la separación física entre la posición del cliente y cada vendedor activo:

$$\Delta\sigma = 2 \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$

* **Sistema de Calificación y Reputación:** Se agregaron badges visuales con estrellas doradas (⭐) y conteo de opiniones para brindar criterio de decisión al comprador.
* **Filtros Dinámicos:** Clasificación horizontal por tipo de producto (*Desayunos, Bebidas, Snacks, Almuerzo, Postres*).

#### 5.4 Navegación Asistida y Centrado Dinámico en Mapa

Cada tarjeta de la lista incorpora el botón interactivo **"Ubicar en Mapa"**:
1. El cliente selecciona un puesto de interés.
2. El sistema almacena la entidad en `selectedVendor` y realiza una transición a la pestaña del mapa.
3. El componente `OSMMap` inyecta un evento seguro al motor de renderizado de Leaflet (`FOCUS_VENDOR`).
4. La cámara del mapa se desplaza suavemente, aplica un nivel de acercamiento cercano (Zoom 17) y despliega automáticamente el marcador emergente (*popup*) del puesto seleccionado.

#### 5.5 Ecosistema de Gestión Comercial para Vendedores
Para dotar al vendedor ambulante de autonomía operativa y herramientas de gestión empresarial:
1. **Doble Esquema de Ubicación (Fija vs. Telemetría en Vivo):**
   * **Ubicación Fija Registrada:** Se almacena en la tabla `users` (`fixed_latitude`, `fixed_longitude`, `fixed_address`). Representa la coordenada física habitual del puesto. Si el vendedor no tiene su baliza satelital encendida, el sistema sitúa automáticamente su puesto sobre el mapa en este punto.
   * **Baliza en Tiempo Real:** Emisión GPS continua vía WebSockets, permitiendo a clientes visualizar el desplazamiento en vivo del vendedor (marcador verde con pulso de radar).
2. **Catálogo de Productos y Categorías Dinámicas:**
   * Cada vendedor administra sus propias categorías comerciales (`categories`).
   * Creación de productos con precio unitario, disponibilidad e **incorporación de fotografías locales** seleccionadas directamente desde la galería del dispositivo móvil mediante `expo-image-picker`.
   * Almacenamiento local mediante un microservicio de subidas en NestJS (`POST /uploads/image`) gestionado por Multer y servido de forma estática bajo control de acceso.
3. **Módulo de Promociones y Ofertas Especiales:**
   * Registro de promociones con porcentaje de descuento, precio promocional especial y vigencia temporal (`promotions`).
4. **Terminal de Registro de Ventas y Resumen Financiero:**
   * Interfaz de venta rápida (POS móvil) que calcula subtotales en tiempo real.
   * Panel de analítica que computa automáticamente: volumen total vendido hoy, conteo de transacciones del día, ticket promedio, y acumulados de semana y mes (`sales/summary`).

#### 5.6 Experiencia de Descubrimiento y Catálogo para el Cliente
Al presionar sobre el marcador de cualquier puesto en el mapa o en la lista de puestos cercanos:
1. Se despliega un modal ergonómico en la zona del pulgar (`VendorDetailModal`).
2. El cliente accede a 3 secciones especializadas:
   * **Productos:** Clasificados por las categorías creadas por el vendedor, con fotos, descripciones y precios oficiales.
   * **Promociones Activas:** Banners visuales con ofertas vigentes.
   * **Ubicación:** Dirección fija registrada, contacto directo telefónico o por WhatsApp, y botón para centrar en el mapa.

---

### 6. Seguridad Móvil y Privacidad de Datos

Siguiendo las pautas de **OWASP Mobile Application Security (MASVS)** y el skill `mobile-security-coder`:

| Vulnerabilidad Mitigada | Medida Técnica Implementada |
| :--- | :--- |
| **Suplantación de Vendedor (Spoofing)** | Eliminación de identificadores arbitrarios; verificación obligatoria del `user.id` desde el almacén de sesión seguro. |
| **Inyección y Datos Fuera de Rango** | Función `isValidCoordinate` que valida que la latitud y longitud sean finitas y cumplan $[-90, 90]$ y $[-180, 180]$. |
| **Fuga de Ubicación (Privacy Leaks)** | Política *Opt-in*: La posición sólo se transmite cuando el vendedor presiona "Transmitir mi Puesto". Al cerrar o pausar, se destruyen los observadores satelitales. |
| **Ataques de Sistema de Archivos en WebView** | Inyección de directivas `allowFileAccess={false}` y `allowUniversalAccessFromFileURLs={false}` en el contenedor de OpenStreetMap. |
| **Uso de Tipos Inseguros** | Erradicación total del tipo `any` en TypeScript, reemplazándolo por interfaces estrictas y `StyleProp<ViewStyle>`. |

---

### 7. Depuración y Resolución de Desafíos Técnicos

#### 7.1 Pérdida de Foco y Colapso del Teclado en Android (Elevation Bug)
* **Síntoma:** Al pulsar sobre el campo de texto en el inicio de sesión, el teclado virtual de Android se desplegaba y se cerraba de forma instantánea.
* **Causa Raíz:** El contenedor del input poseía una clase de foco dinámico con la propiedad `elevation: 2`. En el motor gráfico de Android, alterar la elevación durante el evento `onFocus` provoca que el sistema operativo invalide la jerarquía de vistas de hardware (`ViewGroup`), ejecutando un `clearFocus()` involuntario en el `EditText` nativo.
* **Solución:** Se retiró la elevación dinámica, restringiendo el estado activo a transiciones de color de borde (`borderColor: '#0284C7'`). Asimismo, se deshabilitó `KeyboardAvoidingView` en Android mediante `enabled={Platform.OS === 'ios'}` para permitir que el redimensionamiento nativo gestione el espacio del teclado.

#### 7.2 Resolución de Red y Tráfico Claro (Cleartext Traffic)
* **Síntoma:** Error de red al intentar autenticarse desde la APK compilada en un dispositivo físico.
* **Causa Raíz:** Android 9.0 (API 28) bloquea por política de seguridad el tráfico HTTP en texto claro si no se especifica explícitamente en el manifiesto de la aplicación.
* **Solución:** Se incluyó `"usesCleartextTraffic": true` en `app.json`, y se sustituyeron las referencias hardcodeadas de `10.0.2.2` por la configuración unificada en `api.config.ts`.

---

### 8. Resultados Obtenidos y Validación

1. **Chequeo de Tipos Estricto:** Ejecución de `npx tsc --noEmit` completada exitosamente con **0 errores**.
2. **Pruebas de Conectividad:** Peticiones HTTP verificadas mediante pruebas `curl` obteniendo códigos de estado `200 OK` en los endpoints de autenticación, vendedores y planes.
3. **Persistencia Sincronizada:** Esquema de base de datos en PostgreSQL sincronizado mediante Drizzle Kit (`db:push`), validando la existencia de columnas de negocio (`name`, `photo_url`, `vendor_type`, `price_range`).
4. **Ergonomía de Usuario:** Interfaces verificadas con objetivos táctiles superiores a los 48dp mínimos estipulados por las guías de diseño móvil.

---

### 9. Conclusiones

La reingeniería aplicada sobre la plataforma **GodEyes** transformó un prototipo acoplado en un sistema móvil modular, escalable y preparado para producción:
1. La segregación por roles (RBAC) demostró ser fundamental para la usabilidad, dotando al vendedor de un instrumento de control y telemetría, y al cliente de una herramienta ágil de exploración y valoración.
2. El respeto por las restricciones de la plataforma móvil (ergonomía táctil, gestión eficiente de sensores GPS y seguridad en WebViews) previene fallas de rendimiento y salvaguarda la privacidad del usuario.
3. El uso de patrones de arquitectura desacoplada y tipado fuerte garantiza la mantenibilidad y extensibilidad del proyecto en futuras iteraciones académicas y comerciales.

---

### 10. Referencias Bibliográficas

* Android Open Source Project (2025). *Network Security Configuration & Cleartext Traffic*. Google Developers.
* Open Web Application Security Project (OWASP) (2024). *Mobile Application Security Verification Standard (MASVS)*. OWASP Foundation.
* React Native Community (2025). *Interaction, Performance, and Safe Layout Guidelines*. React Native Documentation.
* Shopify Engineering (2024). *FlashList: Fast & Efficient List Virtualization for React Native*.
