# MiniTeacher — Resumen de cambios (26 de febrero de 2026)

---

## 1. Puesta en marcha del proyecto en local

Se descargó el proyecto desde GitHub y se configuró para ejecutarse en local:

- Instalación de **Node.js** en Windows
- Instalación de dependencias con `npm install`
- Creación del fichero `.env` con las credenciales de Supabase (URL, anon key)
- El servidor de desarrollo se lanza con `npm run dev` y se accede en **http://localhost:8080**

---

## 2. Rediseño de la pantalla de Login

Se rediseñó completamente la pantalla de inicio de sesión para que coincida con el diseño de referencia proporcionado.

**Cambios principales:**
- Fondo con la imagen `Background1.png` en lugar del color azul anterior
- Se eliminaron los botones de Alumno/Profesor y el enlace de registro
- Se añadió el robot con tablet a la izquierda (escritorio) y asomando por encima de la tarjeta (móvil)
- Logo MiniTeacher debajo de la tarjeta en móvil y junto al robot en escritorio

**Fuentes utilizadas:**
- "¡Hola!" y botón "Entrar" → **MuseoModerno Bold**
- "Ingresa a tu cuenta..." → **Montserrat Alternates Medium Italic**
- Etiquetas "Usuario" / "Contraseña" / "¿Olvidaste tu contraseña?" → **Montserrat Alternates Bold**

---

## 3. Rediseño de la pantalla de Recuperar contraseña

Se actualizó para mantener coherencia visual con el login:

- Mismo fondo (Background1.png) y mismas fuentes
- Botón de cerrar con icono personalizado (IconClose)
- Logo MiniTeacher en la esquina inferior derecha
- Sin robot en esta pantalla

---

## 4. Rediseño del Dashboard

Se rediseñó el panel principal tras iniciar sesión:

**Barra superior (TopBar):**
- A la izquierda: título de la página actual (ej. "Inicio")
- A la derecha: saludo "¡Hola Alberto!" con el logo MiniTeacher

**Barra lateral (Sidebar):**
- Iconos personalizados en lugar de los genéricos (IconHome, IconKnowledge, IconRocket, IconChat, IconChallenges, IconSettings)
- Se eliminó el resaltado azul en el elemento activo; ahora el texto activo se muestra en naranja
- Botón "Panel de administración" con IconTeacher, visible solo para roles de centro escolar y profesor
- Al hacer clic en el avatar del usuario se abre un panel para cerrar sesión

**Panel principal:**
- Tarjeta hero con saludo, descripción y botones de acceso rápido a Retos y Miniteachers
- Robot saludando visible tanto en escritorio como en móvil
- Tarjetas de "Retos" y "Miniteachers" con descripciones actualizadas
- Se eliminó la sección de Asignaturas

**Navegación móvil:**
- Se eliminó la barra de navegación inferior (MobileNav)
- El robot se posiciona superpuesto ligeramente sobre los botones en vista vertical

---

## 5. Iconos personalizados

Se implementó un componente `CustomIcon` que permite usar imágenes PNG como iconos con cambio de color dinámico (técnica CSS mask-image). Los iconos se encuentran en `public/assets/` y se usan en:

- Sidebar (navegación)
- Dashboard (botones y tarjetas)
- Pantalla de recuperar contraseña (botón cerrar)

---

## 6. Base de datos — Centros escolares

Se crearon 2 centros en la tabla `schools`:

| Centro | Email | Alumnos máx. | Profesores máx. |
|---|---|---|---|
| Centro Inneva Pharma | info@innevapharma.es | 500 | 40 |
| Centro Body Planet | info@bodyplanet.es | 20 | 5 |

**Grados asignados:**
- Inneva Pharma → Todos (1º-6º Primaria, 1º-4º ESO, 1º-2º Bachillerato)
- Body Planet → Solo ESO (1º-4º)

**Asignaturas:** Las 33 asignaturas disponibles están vinculadas a ambos centros.

Se eliminaron las tablas `public.Users` y `public.Tokens` que estaban obsoletas y no se usaban en el código.

---

## 7. Usuarios creados

### Usuario existente (alumno)
| Campo | Valor |
|---|---|
| Email | aroman@innevapharma.es |
| Contraseña | Inneva2020 |
| Rol | Alumno (Student) |
| Centro | Inneva Pharma |

### Administradores de centro escolar
| Email | Contraseña | Centro |
|---|---|---|
| info@innevapharma.es | Inneva2020 | Inneva Pharma |
| info@bodyplanet.es | Body2020 | Body Planet |

### Profesores
| Email | Contraseña | Centro |
|---|---|---|
| profesor1@innevapharma.es | Inneva2020 | Inneva Pharma |
| profesor1@bodyplanet.es | Body2020 | Body Planet |

**Nota sobre roles y permisos:**
- Los administradores de centro y profesores pueden ver el botón "Panel de administración" en la barra lateral
- Los alumnos no ven ese botón

---

## 8. Estructura de datos en Supabase

Las tablas principales que usa la aplicación son:

- `auth.users` — Autenticación (email, contraseña, sesiones)
- `profiles` — Datos del usuario (nombre, apellidos, nick, centro)
- `user_roles` — Rol asignado a cada usuario
- `roles` — Catálogo de roles (1=School Admin, 2=Teacher, 3=Student, 4=Independent)
- `schools` — Centros escolares
- `schools_have_grades` — Qué grados tiene cada centro
- `schools_have_subjects` — Qué asignaturas tiene cada centro
- `grades` — Catálogo de grados (Primaria, ESO, Bachillerato)
- `subjects` — Catálogo de asignaturas
- `teachers` — Registro de usuarios que son profesores
- `challenges` / `challenge_questions` — Sistema de retos educativos

---

## 9. Archivos principales modificados

| Archivo | Descripción |
|---|---|
| `src/pages/Login.tsx` | Pantalla de login rediseñada |
| `src/pages/ForgotPassword.tsx` | Pantalla de recuperar contraseña rediseñada |
| `src/pages/Dashboard.tsx` | Dashboard con hero, tarjetas y robot |
| `src/components/AppSidebar.tsx` | Sidebar con iconos custom, admin button y logout |
| `src/components/TopBar.tsx` | Barra superior con título dinámico y saludo |
| `src/components/AppLayout.tsx` | Layout sin MobileNav |
| `src/components/CustomIcon.tsx` | Componente nuevo para iconos PNG con color |
| `src/index.css` | Fuentes y variables CSS del diseño |
| `public/assets/` | Imágenes, iconos y fondo |
| `public/fonts/` | Fuentes Montserrat Alternates |
| `.env` | Configuración de Supabase |
