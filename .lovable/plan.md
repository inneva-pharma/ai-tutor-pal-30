

# MiniTeacher — AI-Powered Educational Platform

## Overview
MiniTeacher is a full-featured educational platform for Spanish schools where students interact with AI tutors and take AI-generated quizzes, while teachers create and manage content. The app uses Supabase for auth/database and external n8n webhooks for AI features.

---

## Phase 1: Foundation — Database, Auth & Layout

### 1.1 Supabase Database Setup
- Create all 20+ tables (roles, schools, profiles, teachers, students, grades, subjects, chatbots, challenges, etc.) with proper foreign keys and constraints
- Seed reference data: roles (School Admin, Teacher, Student, Independent) and grades (1º Primaria through FP Básica)
- Create database trigger: auto-create a `profiles` row when a new user signs up in Supabase Auth
- Enable Row Level Security on all tables with appropriate policies (users see own data, admins see all, public/school content sharing logic)

### 1.2 Authentication Pages
- **Login page** (`/login`): Centered card with email/password inputs, "Recordarme" checkbox, "Entrar" button with loading spinner, forgot password link, Spanish error toasts
- **Forgot password page** (`/forgot-password`): Email input using Supabase's built-in password recovery, success confirmation message

### 1.3 Auth Context & Route Protection
- React AuthContext storing user profile (including role, school, nick)
- Auth guard redirecting unauthenticated users to `/login`
- Admin route protection (only rol_id ≤ 2)

### 1.4 Main Layout
- **Sidebar** (left, fixed): Navigation with icons — Inicio, Tutor IA, Retos, Explorar, Conocimiento, Admin (conditional), Ajustes
  - Desktop: full 240px sidebar with icons + labels
  - Tablet: collapsed to 64px icons only
  - Mobile: hidden sidebar, bottom navigation bar instead
- **Top bar**: "MiniTeacher" logo, user avatar with initials + nick, logout button
- **Design system**: Primary dark blue (#00204F), accent blue (#7191C2), light background (#EBF0F2), white cards with subtle shadows, Spanish language throughout

---

## Phase 2: AI Tutors (Chatbots)

### 2.1 Chatbot List Page (`/chatbots`)
- Title "Tutores IA" with "Nuevo Tutor" button
- Three tabs: Mis Tutores / De mi centro / Públicos
- Searchable, sortable table with columns: #, Propietario, Nombre, Asignatura, Curso, Creado, Último uso, Acciones
- Pagination (10 per page), empty state illustration
- Actions per row: "Chatear" (accent blue) and "Eliminar" (red, owner only)

### 2.2 Create Chatbot Modal
- Form fields: Nombre, Idioma (ES/EN toggle), Asignatura (from DB), Curso (from DB), Personalidad, Estilo de aprendizaje, Acceso (Privado/Mi centro/Público)
- Inserts into chatbots table, shows success toast

### 2.3 Chat Interface (`/chatbots/:sessionId`)
- Chat message area with styled bubbles (user = dark blue right-aligned, AI = white left-aligned)
- Support for text, images (base64), and audio (base64) in AI responses
- Animated 3-dot loading indicator while waiting for AI
- Bottom input bar: file attach button (PDF, DOCX, images, etc.), expandable text input, send button
- Messages sent via POST to n8n OpenAI webhook
- File uploads via multipart POST to n8n UploadDocument endpoint, saved to documents table

---

## Phase 3: Challenges (Retos)

### 3.1 Teacher Challenge List (`/challenges`)
- Three tabs: Mis Retos / De mi centro / Públicos
- Sortable table with difficulty badges (color-coded), validation status icons
- "Nuevo Reto" button, edit/delete actions

### 3.2 Create/Edit Challenge (Full Panel)
- **Step 1 — Configuration**: Name, language, subject, grade, topic, difficulty (3 clickable cards), question count (5/10/15/20), access level
- "Generar con IA ✨" button → full-screen loading overlay → POST to n8n challenge webhook
- **Step 2 — Review Questions**: Editable question cards with 4 answer inputs, correct answer radio, explanation, delete/invalidate options
- Add question manually, save all to database

### 3.3 Student Challenge View
- List of available challenges with best score shown
- **Challenge taking screen** (full screen, no sidebar): progress bar, large question text, 4 clickable answer cards, next/results navigation
- **Results screen**: Score display with colored percentage circle, question-by-question review with correct/wrong highlighting and explanations
- Results saved to challenge_results and challenge_result_details

---

## Phase 4: Dashboard, Admin & Settings

### 4.1 Dashboard (`/dashboard`)
- Welcome message with user nick and role badge
- Summary cards: Mis Tutores IA (count), Mis Retos (count), Resultados (count)
- Recent activity: last 5 chatbots used, last 5 challenges created

### 4.2 Admin Panel (`/admin`) — Role-restricted
- **Usuarios tab**: User table with search/filter, edit role and school assignment
- **Centros tab**: School management (CRUD) with all school fields
- **Asignaturas tab**: Subject and grade management (add/edit/delete)
- **Configuración tab**: App access toggles, 2FA setting, session memory, version inputs

### 4.3 Settings (`/settings`)
- Edit name, lastname, nick
- Read-only email and role display
- Change password via Supabase Auth
- Language preference (localStorage)
- Logout with confirmation dialog

---

## Global Behaviors
- Skeleton loaders for all data fetches, custom 3-dot animation for AI calls
- Spanish toast notifications for all actions and errors
- Soft deletes for chatbots and challenges (isDeleted flag)
- Session expiry detection with redirect to login
- All n8n webhook URLs stored as environment variables

