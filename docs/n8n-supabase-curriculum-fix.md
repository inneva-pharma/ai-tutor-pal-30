# Fix: SelectSubjectContent devuelve vacio en n8n

## Fecha: 26/02/2026

## Problema

El nodo `SelectSubjectContent` del workflow **My workflow_Retos** en n8n siempre devolvia un objeto vacio `{}`, por lo que la IA (RetoCreatorAI) no recibia el contenido curricular y generaba preguntas genericas sin contexto educativo real.

## Causa raiz

**Row Level Security (RLS) habilitado en la tabla `curriculum_summaries` de Supabase sin politicas de acceso.**

Cuando se crea una tabla en Supabase (via Table Editor o con RLS habilitado), la API REST (PostgREST) bloquea TODAS las lecturas aunque los grants de la tabla sean correctos. Esto causa que:

- Las queries desde el **SQL Editor** funcionan (usa el rol `postgres` que ignora RLS)
- Las queries desde la **API REST / n8n** devuelven vacio (pasan por PostgREST que respeta RLS)

## Solucion aplicada

```sql
ALTER TABLE curriculum_summaries DISABLE ROW LEVEL SECURITY;
```

## Otros cambios realizados en la sesion

### 1. Operacion del nodo SelectSubjectContent

Se cambio de `Get` (single row) a `Get Many` (getAll) con `limit: 1` y `matchType: allFilters`. Esto es mas fiable para queries con multiples condiciones de filtrado.

**Filtros configurados:**
- `stage` = `{{ $json.etapa }}` (eq)
- `cycle` = `{{ $json.ciclo }}` (eq)
- `subject_id` = `{{ $json.subject_id }}` (eq)

### 2. Expansion de curriculum_summaries con grade_id

La columna `grade_id` estaba en NULL para todas las filas. Se expandieron las filas para que cada una tenga el `grade_id` correspondiente segun el ciclo:

| Stage | Cycle | grade_ids |
|-------|-------|-----------|
| Primaria | Primer ciclo | 1 (1o Prim), 2 (2o Prim) |
| Primaria | Segundo ciclo | 3 (3o Prim), 4 (4o Prim) |
| Primaria | Tercer ciclo | 5 (5o Prim), 6 (6o Prim) |
| ESO | Cursos de primero a tercero | 7 (1o ESO), 8 (2o ESO), 9 (3o ESO) |
| ESO | Cuarto curso | 10 (4o ESO) |
| Bachillerato | 1o | 11 (1o Bach) |
| Bachillerato | 2o | 12 (2o Bach) |

Esto paso de ~61 filas (sin grade_id) a ~103 filas (con grade_id, duplicando filas donde un ciclo abarca varios cursos).

### 3. Fix del typo "Cuarto curso*"

Se corrigio `"Cuarto curso*"` a `"Cuarto curso"` en la fila de ESO subject_id=2.

---

## Como evitar este problema en el futuro

### Al crear tablas nuevas en Supabase:

1. **Si la tabla NO necesita restricciones por usuario** (datos publicos/compartidos como curriculum):
   ```sql
   -- Despues de crear la tabla, deshabilitar RLS
   ALTER TABLE nombre_tabla DISABLE ROW LEVEL SECURITY;
   ```

2. **Si la tabla SI necesita RLS** (datos privados por usuario como challenges):
   ```sql
   -- Habilitar RLS
   ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;

   -- Crear politica de lectura (ejemplo: cualquiera puede leer)
   CREATE POLICY "Allow public read" ON nombre_tabla
     FOR SELECT USING (true);

   -- O solo usuarios autenticados:
   CREATE POLICY "Allow authenticated read" ON nombre_tabla
     FOR SELECT TO authenticated USING (true);
   ```

### Diagnostico rapido si un nodo Supabase devuelve vacio:

```sql
-- 1. Verificar si RLS esta activo
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'nombre_tabla';

-- 2. Si relrowsecurity = true, verificar politicas
SELECT * FROM pg_policies
WHERE tablename = 'nombre_tabla';

-- 3. Si no hay politicas, o deshabilitar RLS o crear politica
ALTER TABLE nombre_tabla DISABLE ROW LEVEL SECURITY;
-- o
CREATE POLICY "policy_name" ON nombre_tabla FOR SELECT USING (true);

-- 4. Si se creo la tabla recientemente, recargar cache de PostgREST
NOTIFY pgrst, 'reload schema';
```

### Checklist para tablas nuevas accesibles via n8n:

- [ ] Tabla creada en schema `public`
- [ ] RLS deshabilitado O politicas de acceso creadas
- [ ] Grants correctos para `service_role` (normalmente automatico)
- [ ] Ejecutar `NOTIFY pgrst, 'reload schema'` si la tabla es nueva

---

## Arquitectura del flujo de generacion de retos

```
Frontend (CreateChallengeDialog)
  |
  | POST /webhook/unity/reto/generar
  | Payload: { name, topic, etapa, grade, subject, subject_id, language, questionCount, difficulty }
  |
  v
n8n: WebhookReto --> Switch (generar/guardar)
  |
  v (generar)
NormalizarEntrada --> retoId --> MapCiclo
  |                                |
  |                    Calcula: etapa, ciclo, officialSubject, subject_id
  |                                |
  |                                v
  |                    SelectSubjectContent (Supabase: curriculum_summaries)
  |                                |
  |                    Devuelve: content (saberes basicos del curriculo)
  |                                |
  |                                v
  |                    RetoCreatorAI (OpenAI GPT-4.1-mini)
  |                                |
  |                    Usa el content curricular en el prompt para generar preguntas
  |                                |
  v                                v
Merge --> DataExit --> GenerateNewChallenge (responde al frontend)
```

## Tablas clave en Supabase

| Tabla | Proposito | RLS |
|-------|-----------|-----|
| `curriculum_summaries` | Contenido curricular por etapa/ciclo/asignatura | OFF |
| `challenges` | Retos creados por usuarios | Segun necesidad |
| `challenge_questions` | Preguntas de cada reto | Segun necesidad |
| `subjects` | Catalogo de asignaturas | OFF |
| `grades` | Catalogo de cursos/niveles | OFF |
