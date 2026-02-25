-- ============================================================
-- MiniTeacher — Initial Schema
-- Single source of truth for the full database structure.
-- Run this on a fresh Supabase project to recreate everything.
-- No seed data included — structure only.
-- ============================================================


-- ============================================================
-- SECTION 1 — HELPER FUNCTION (must be first: policies use it)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role_id(_user_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$;


-- ============================================================
-- SECTION 2 — REFERENCE TABLES (no foreign key dependencies)
-- ============================================================

-- 2.1 Roles
CREATE TABLE public.roles (
  id   int         PRIMARY KEY,
  name varchar(45) NOT NULL
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles: authenticated can read"
  ON public.roles FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "roles: admins can manage"
  ON public.roles FOR ALL
  TO authenticated USING (public.get_user_role_id(auth.uid()) <= 2);


-- 2.2 Schools
CREATE TABLE public.schools (
  id             serial       PRIMARY KEY,
  name           varchar(255) NOT NULL,
  address        varchar(255),
  tlf            varchar(45),
  "contactEmail" varchar(45),
  web            varchar(255),
  "maxTeachers"  int          DEFAULT 10,
  "maxStudents"  int          DEFAULT 100
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schools: authenticated can read"
  ON public.schools FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "schools: admins can manage"
  ON public.schools FOR ALL
  TO authenticated USING (public.get_user_role_id(auth.uid()) <= 2);


-- 2.3 Grades
CREATE TABLE public.grades (
  id   serial      PRIMARY KEY,
  name varchar(45) NOT NULL
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grades: authenticated can read"
  ON public.grades FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "grades: admins can manage"
  ON public.grades FOR ALL
  TO authenticated USING (public.get_user_role_id(auth.uid()) <= 2);


-- 2.4 Subjects
CREATE TABLE public.subjects (
  id   serial      PRIMARY KEY,
  name varchar(45) NOT NULL
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subjects: authenticated can read"
  ON public.subjects FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "subjects: admins can manage"
  ON public.subjects FOR ALL
  TO authenticated USING (public.get_user_role_id(auth.uid()) <= 2);


-- ============================================================
-- SECTION 3 — USER / AUTH TABLES
-- ============================================================

-- 3.1 Profiles (extends auth.users 1-to-1)
CREATE TABLE public.profiles (
  id         uuid         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      varchar(255) NOT NULL,
  name       varchar(45),
  lastname   varchar(100),
  nick       varchar(45),
  schools_id int          REFERENCES public.schools(id) ON DELETE SET NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: user reads own"
  ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles: admins read all"
  ON public.profiles FOR SELECT
  TO authenticated USING (public.get_user_role_id(auth.uid()) <= 2);

CREATE POLICY "profiles: user updates own"
  ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles: system inserts on signup"
  ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

CREATE INDEX idx_profiles_schools_id ON public.profiles(schools_id);


-- 3.2 User Roles (decoupled from profiles — avoids RLS recursion)
CREATE TABLE public.user_roles (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id int  NOT NULL    REFERENCES public.roles(id) DEFAULT 4,
  UNIQUE (user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles: user reads own"
  ON public.user_roles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "user_roles: admins read all"
  ON public.user_roles FOR SELECT
  TO authenticated USING (public.get_user_role_id(auth.uid()) <= 2);

CREATE POLICY "user_roles: admins update"
  ON public.user_roles FOR UPDATE
  TO authenticated USING (public.get_user_role_id(auth.uid()) <= 2);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);


-- 3.3 Trigger: auto-create profile + user_role row on every new signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nick)
  VALUES (
    NEW.id,
    NEW.email,
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (NEW.id, 4);  -- default role: Independent

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3.4 Teachers (marker table — users with role_id = 2)
CREATE TABLE public.teachers (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers: authenticated can read"
  ON public.teachers FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "teachers: admins can manage"
  ON public.teachers FOR ALL
  TO authenticated USING (public.get_user_role_id(auth.uid()) <= 2);


-- 3.5 Students (marker table — users with role_id = 3)
CREATE TABLE public.students (
  id                             uuid        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  "allowShareContent"            boolean     NOT NULL DEFAULT true,
  "needTeacherPermissionToShare" boolean     NOT NULL DEFAULT false,
  "classroomLetter"              varchar(10) NOT NULL DEFAULT ''
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students: student reads own"
  ON public.students FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "students: admins read all"
  ON public.students FOR SELECT
  TO authenticated USING (public.get_user_role_id(auth.uid()) <= 2);

CREATE POLICY "students: admins manage"
  ON public.students FOR ALL
  TO authenticated USING (public.get_user_role_id(auth.uid()) <= 2);


-- ============================================================
-- SECTION 4 — SCHOOL RELATIONSHIPS
-- ============================================================

-- 4.1 Schools <-> Grades
CREATE TABLE public.schools_have_grades (
  id        serial PRIMARY KEY,
  school_id int    NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  grade_id  int    NOT NULL REFERENCES public.grades(id)  ON DELETE CASCADE
);

ALTER TABLE public.schools_have_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schools_have_grades: authenticated can read"
  ON public.schools_have_grades FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "schools_have_grades: admins manage"
  ON public.schools_have_grades FOR ALL
  TO authenticated USING (public.get_user_role_id(auth.uid()) <= 2);

CREATE INDEX idx_shg_school_id ON public.schools_have_grades(school_id);
CREATE INDEX idx_shg_grade_id  ON public.schools_have_grades(grade_id);


-- 4.2 Schools <-> Subjects
CREATE TABLE public.schools_have_subjects (
  id         serial PRIMARY KEY,
  school_id  int    NOT NULL REFERENCES public.schools(id)  ON DELETE CASCADE,
  subject_id int    NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE
);

ALTER TABLE public.schools_have_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schools_have_subjects: authenticated can read"
  ON public.schools_have_subjects FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "schools_have_subjects: admins manage"
  ON public.schools_have_subjects FOR ALL
  TO authenticated USING (public.get_user_role_id(auth.uid()) <= 2);

CREATE INDEX idx_shs_school_id  ON public.schools_have_subjects(school_id);
CREATE INDEX idx_shs_subject_id ON public.schools_have_subjects(subject_id);


-- 4.3 Student Enrollments
CREATE TABLE public.students_enrollments (
  id                serial     PRIMARY KEY,
  "classroomLetter" varchar(1) NOT NULL,
  user_id           uuid       NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  grade_id          int        NOT NULL REFERENCES public.grades(id)    ON DELETE CASCADE,
  subject_id        int        NOT NULL REFERENCES public.subjects(id)  ON DELETE CASCADE
);

ALTER TABLE public.students_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments: student reads own"
  ON public.students_enrollments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "enrollments: admins read all"
  ON public.students_enrollments FOR SELECT
  TO authenticated USING (public.get_user_role_id(auth.uid()) <= 2);

CREATE POLICY "enrollments: admins manage"
  ON public.students_enrollments FOR ALL
  TO authenticated USING (public.get_user_role_id(auth.uid()) <= 2);

CREATE INDEX idx_enrollments_user_id    ON public.students_enrollments(user_id);
CREATE INDEX idx_enrollments_grade_id   ON public.students_enrollments(grade_id);
CREATE INDEX idx_enrollments_subject_id ON public.students_enrollments(subject_id);


-- ============================================================
-- SECTION 5 — CHATBOTS
-- ============================================================

-- 5.1 Chatbots
-- chatBotType: 1=predefined, 2=user-created
-- accessPermissions: 0=private, 1=school, 2=public
CREATE TABLE public.chatbots (
  id                  serial        PRIMARY KEY,
  "sessionId"         varchar(45)   NOT NULL UNIQUE DEFAULT gen_random_uuid()::varchar,
  "chatBotType"       int           NOT NULL DEFAULT 2,
  name                varchar(255)  NOT NULL,
  language            varchar(255)  NOT NULL DEFAULT 'ES',
  subject             varchar(255)  NOT NULL DEFAULT '',
  grade               varchar(255)  NOT NULL DEFAULT '',
  personality         varchar(255),
  "learningStyle"     varchar(255),
  prompt              varchar(4000) NOT NULL DEFAULT '',
  "accessPermissions" int           NOT NULL DEFAULT 0,
  "createDate"        timestamptz   NOT NULL DEFAULT now(),
  "lastUseDate"       timestamptz   NOT NULL DEFAULT now(),
  "isDeleted"         boolean       NOT NULL DEFAULT false,
  user_id             uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chatbots: owner full access"
  ON public.chatbots FOR ALL
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "chatbots: public ones readable"
  ON public.chatbots FOR SELECT
  TO authenticated USING (
    "accessPermissions" = 2
    AND "isDeleted" = false
  );

CREATE POLICY "chatbots: school ones readable by same school"
  ON public.chatbots FOR SELECT
  TO authenticated USING (
    "accessPermissions" = 1
    AND "isDeleted" = false
    AND EXISTS (
      SELECT 1
      FROM   public.profiles viewer
      JOIN   public.profiles owner ON owner.id = chatbots.user_id
      WHERE  viewer.id = auth.uid()
        AND  viewer.schools_id IS NOT NULL
        AND  viewer.schools_id = owner.schools_id
    )
  );

CREATE INDEX idx_chatbots_user_id    ON public.chatbots(user_id);
CREATE INDEX idx_chatbots_is_deleted ON public.chatbots("isDeleted");
CREATE INDEX idx_chatbots_access     ON public.chatbots("accessPermissions");
CREATE INDEX idx_chatbots_last_use   ON public.chatbots("lastUseDate" DESC);


-- 5.2 Chatbot Sessions (one row per user+bot conversation thread)
CREATE TABLE public.chatbot_sessions (
  id            serial      PRIMARY KEY,
  "createDate"  timestamptz NOT NULL DEFAULT now(),
  "lastUseDate" timestamptz NOT NULL DEFAULT now(),
  redis_id      varchar(50) NOT NULL DEFAULT '',
  users_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  "chatBot_id"  varchar(45) NOT NULL  -- varchar join to chatbots.sessionId
);

ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chatbot_sessions: user manages own"
  ON public.chatbot_sessions FOR ALL
  TO authenticated USING (auth.uid() = users_id);

CREATE INDEX idx_cb_sessions_users_id   ON public.chatbot_sessions(users_id);
CREATE INDEX idx_cb_sessions_chatbot_id ON public.chatbot_sessions("chatBot_id");
CREATE INDEX idx_cb_sessions_last_use   ON public.chatbot_sessions("lastUseDate" DESC);


-- 5.3 Documents (files uploaded and attached to chatbot sessions)
CREATE TABLE public.documents (
  id                  serial        PRIMARY KEY,
  name                varchar(255)  NOT NULL,
  description         varchar(2500) NOT NULL DEFAULT '',
  url                 varchar(255)  NOT NULL DEFAULT '',
  users_id            uuid          NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  chatbot_id          int           NOT NULL REFERENCES public.chatbots(id)  ON DELETE CASCADE,
  "chatbot_sessionId" varchar(45)   NOT NULL
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents: user manages own"
  ON public.documents FOR ALL
  TO authenticated USING (auth.uid() = users_id);

CREATE INDEX idx_documents_users_id   ON public.documents(users_id);
CREATE INDEX idx_documents_chatbot_id ON public.documents(chatbot_id);


-- ============================================================
-- SECTION 6 — CHALLENGES (RETOS)
-- ============================================================

-- 6.1 Challenges
-- accessPermissions: 0=private, 1=school, 2=public
-- isValidated:       0=pending, 1=validated
CREATE TABLE public.challenges (
  id                     serial       PRIMARY KEY,
  name                   varchar(45)  NOT NULL,
  language               varchar(255) NOT NULL DEFAULT 'ES',
  topic                  varchar(1000),
  difficulty             varchar(45)  NOT NULL DEFAULT 'Facil',
  "questionCount"        int          NOT NULL DEFAULT 5,
  "accessPermissions"    int          NOT NULL DEFAULT 0,
  "isValidated"          int          NOT NULL DEFAULT 0,
  subject_id             int          NOT NULL REFERENCES public.subjects(id),
  grade_id               int          NOT NULL REFERENCES public.grades(id),
  user_id                uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  "createDate"           timestamptz  NOT NULL DEFAULT now(),
  "lastModificationDate" timestamptz  NOT NULL DEFAULT now(),
  "lastUseDate"          timestamptz  NOT NULL DEFAULT now(),
  "isDeleted"            boolean      NOT NULL DEFAULT false
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenges: owner full access"
  ON public.challenges FOR ALL
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "challenges: public ones readable"
  ON public.challenges FOR SELECT
  TO authenticated USING (
    "accessPermissions" = 2
    AND "isDeleted" = false
  );

CREATE POLICY "challenges: school ones readable by same school"
  ON public.challenges FOR SELECT
  TO authenticated USING (
    "accessPermissions" = 1
    AND "isDeleted" = false
    AND EXISTS (
      SELECT 1
      FROM   public.profiles viewer
      JOIN   public.profiles owner ON owner.id = challenges.user_id
      WHERE  viewer.id = auth.uid()
        AND  viewer.schools_id IS NOT NULL
        AND  viewer.schools_id = owner.schools_id
    )
  );

CREATE INDEX idx_challenges_user_id    ON public.challenges(user_id);
CREATE INDEX idx_challenges_subject_id ON public.challenges(subject_id);
CREATE INDEX idx_challenges_grade_id   ON public.challenges(grade_id);
CREATE INDEX idx_challenges_is_deleted ON public.challenges("isDeleted");
CREATE INDEX idx_challenges_access     ON public.challenges("accessPermissions");
CREATE INDEX idx_challenges_last_use   ON public.challenges("lastUseDate" DESC);


-- 6.2 Challenge Questions
-- correctAnswer: 1, 2, 3 or 4 (maps to answer1..answer4)
CREATE TABLE public.challenge_questions (
  id                  serial        PRIMARY KEY,
  question            varchar(2000) NOT NULL,
  answer1             varchar(1000) NOT NULL DEFAULT '',
  answer2             varchar(1000) NOT NULL DEFAULT '',
  answer3             varchar(1000) NOT NULL DEFAULT '',
  answer4             varchar(1000) NOT NULL DEFAULT '',
  explanation         varchar(2000),
  "correctAnswer"     int           NOT NULL DEFAULT 1,
  challenge_id        int           NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  "isInvalidQuestion" boolean       NOT NULL DEFAULT false
);

ALTER TABLE public.challenge_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenge_questions: readable if challenge is accessible"
  ON public.challenge_questions FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id
        AND (
          c.user_id = auth.uid()
          OR (c."accessPermissions" = 2 AND c."isDeleted" = false)
          OR (
            c."accessPermissions" = 1
            AND c."isDeleted" = false
            AND EXISTS (
              SELECT 1
              FROM   public.profiles viewer
              JOIN   public.profiles owner ON owner.id = c.user_id
              WHERE  viewer.id = auth.uid()
                AND  viewer.schools_id IS NOT NULL
                AND  viewer.schools_id = owner.schools_id
            )
          )
        )
    )
  );

CREATE POLICY "challenge_questions: owner can manage"
  ON public.challenge_questions FOR ALL
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id AND c.user_id = auth.uid()
    )
  );

CREATE INDEX idx_cq_challenge_id ON public.challenge_questions(challenge_id);


-- 6.3 Challenge Results
-- answersLists: comma-separated selected answers, e.g. "1,3,2,4,1"
CREATE TABLE public.challenge_results (
  id               serial       PRIMARY KEY,
  challenge_id     int          NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id          uuid         NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
  "totalQuestions" int          NOT NULL DEFAULT 0,
  "correctAnswers" int          NOT NULL DEFAULT 0,
  score            decimal(5,2) NOT NULL DEFAULT 0,
  "isCompleted"    boolean               DEFAULT false,
  "answersLists"   varchar(255) NOT NULL DEFAULT '',
  "createDate"     timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.challenge_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenge_results: user manages own"
  ON public.challenge_results FOR ALL
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "challenge_results: challenge owner can read"
  ON public.challenge_results FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id AND c.user_id = auth.uid()
    )
  );

CREATE INDEX idx_cr_user_id      ON public.challenge_results(user_id);
CREATE INDEX idx_cr_challenge_id ON public.challenge_results(challenge_id);
CREATE INDEX idx_cr_create_date  ON public.challenge_results("createDate" DESC);


-- 6.4 Challenge Result Details (per-question breakdown)
CREATE TABLE public.challenge_result_details (
  id                   serial  PRIMARY KEY,
  "challengeResult_id" int     NOT NULL REFERENCES public.challenge_results(id)  ON DELETE CASCADE,
  question_id          int     NOT NULL REFERENCES public.challenge_questions(id) ON DELETE CASCADE,
  "selectedAnswer"     int     NOT NULL,
  "isCorrect"          boolean
);

ALTER TABLE public.challenge_result_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "result_details: user sees own"
  ON public.challenge_result_details FOR ALL
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.challenge_results cr
      WHERE cr.id = "challengeResult_id"
        AND cr.user_id = auth.uid()
    )
  );

CREATE INDEX idx_crd_result_id   ON public.challenge_result_details("challengeResult_id");
CREATE INDEX idx_crd_question_id ON public.challenge_result_details(question_id);


-- ============================================================
-- SECTION 7 — SHARING
-- ============================================================

-- shareContentType values:
--   0 = disabled
--   1 = owner
--   2 = pending approval
--   3 = not approved
--   4 = shared with whole school
--   5 = shared by teacher for specific classroom
CREATE TABLE public.share_content (
  id                     serial      PRIMARY KEY,
  "chatBot_id"           int         REFERENCES public.chatbots(id)   ON DELETE CASCADE,
  challenge_id           int         REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id                uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  "shareContentType"     int         NOT NULL DEFAULT 0,
  "classroomLetter"      varchar(45),
  "createDate"           timestamptz NOT NULL DEFAULT now(),
  "lastModificationDate" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.share_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "share_content: user manages own"
  ON public.share_content FOR ALL
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "share_content: admins read all"
  ON public.share_content FOR SELECT
  TO authenticated USING (public.get_user_role_id(auth.uid()) <= 2);

CREATE INDEX idx_sc_user_id      ON public.share_content(user_id);
CREATE INDEX idx_sc_chatbot_id   ON public.share_content("chatBot_id");
CREATE INDEX idx_sc_challenge_id ON public.share_content(challenge_id);


-- ============================================================
-- SECTION 8 — ANALYTICS & SYSTEM
-- ============================================================

-- 8.1 Trackings (usage analytics)
CREATE TABLE public.trackings (
  id                   serial       PRIMARY KEY,
  "userCreateDate"     timestamptz  NOT NULL DEFAULT now(),
  "databaseCreateDate" timestamptz  NOT NULL DEFAULT now(),
  duration             float8       NOT NULL DEFAULT 0,
  info1                varchar(45)  NOT NULL DEFAULT '',
  info2                varchar(45),
  info3                varchar(45),
  info4                varchar(45),
  info5                varchar(45),
  "deviceId"           varchar(250) NOT NULL DEFAULT '',
  users_id             uuid         REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.trackings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trackings: user manages own"
  ON public.trackings FOR ALL
  TO authenticated USING (auth.uid() = users_id);

CREATE POLICY "trackings: admins read all"
  ON public.trackings FOR SELECT
  TO authenticated USING (public.get_user_role_id(auth.uid()) <= 2);

CREATE INDEX idx_trackings_users_id    ON public.trackings(users_id);
CREATE INDEX idx_trackings_create_date ON public.trackings("databaseCreateDate" DESC);


-- 8.2 Configuration (single-row app-wide settings)
-- allowAppAccess:  1=open  0=maintenance  -1=closed indefinitely
-- expireTokenUseTime: minutes of inactivity before session expires
-- expireTokenTime:    minutes absolute token lifetime
CREATE TABLE public.configuration (
  id                        serial PRIMARY KEY,
  "allowAppAccess"          int    NOT NULL DEFAULT 1,
  "currentDatabaseVersion"  int    NOT NULL DEFAULT 1,
  "lastSupportedAppVersion" int    NOT NULL DEFAULT 1,
  "loginWithDoubleAuthen"   int    NOT NULL DEFAULT 0,
  "expireTokenUseTime"      int    NOT NULL DEFAULT 30,
  "expireTokenTime"         int    NOT NULL DEFAULT 1440,
  "allowUserRememberAccess" int    NOT NULL DEFAULT 0
);

ALTER TABLE public.configuration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "configuration: authenticated can read"
  ON public.configuration FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "configuration: super admins can update"
  ON public.configuration FOR UPDATE
  TO authenticated USING (public.get_user_role_id(auth.uid()) <= 1);


-- 8.3 Curriculum Summaries (Spanish national curriculum reference data)
CREATE TABLE public.curriculum_summaries (
  id          serial       PRIMARY KEY,
  stage       varchar(50),
  subject_id  varchar(100),
  grade_id    int,
  cycle       varchar(50),
  content     text,
  "createdAt" timestamptz  DEFAULT now(),
  "updatedAt" timestamptz  DEFAULT now()
);

ALTER TABLE public.curriculum_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "curriculum_summaries: authenticated can read"
  ON public.curriculum_summaries FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "curriculum_summaries: admins can manage"
  ON public.curriculum_summaries FOR ALL
  TO authenticated USING (public.get_user_role_id(auth.uid()) <= 2);

CREATE INDEX idx_curriculum_grade_id   ON public.curriculum_summaries(grade_id);
CREATE INDEX idx_curriculum_subject_id ON public.curriculum_summaries(subject_id);


-- 8.4 Registers (API audit log — records every external call)
CREATE TABLE public.registers (
  id                serial        PRIMARY KEY,
  ip                varchar(45)   NOT NULL DEFAULT '',
  "sqlQuestionName" varchar(45)   NOT NULL DEFAULT '',
  info1             varchar(1000),
  info2             varchar(1000),
  "createDate"      timestamptz   NOT NULL DEFAULT now(),
  token             varchar(45),
  users_id          uuid          REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.registers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registers: admins can read"
  ON public.registers FOR SELECT
  TO authenticated USING (public.get_user_role_id(auth.uid()) <= 2);

CREATE POLICY "registers: system can insert"
  ON public.registers FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE INDEX idx_registers_users_id    ON public.registers(users_id);
CREATE INDEX idx_registers_create_date ON public.registers("createDate" DESC);


-- ============================================================
-- END OF MIGRATION
-- ============================================================
