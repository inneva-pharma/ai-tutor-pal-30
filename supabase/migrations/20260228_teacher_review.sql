-- 1. Nueva columna isReviewed en challenge_results
ALTER TABLE public.challenge_results
  ADD COLUMN "isReviewed" boolean NOT NULL DEFAULT false;

-- 2. Profesor puede actualizar isReviewed en resultados de sus retos
CREATE POLICY "challenge_results: challenge owner can update review"
  ON public.challenge_results FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.challenges c
            WHERE c.id = challenge_results.challenge_id AND c.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.challenges c
            WHERE c.id = challenge_results.challenge_id AND c.user_id = auth.uid())
  );

-- 3. Profesor puede leer detalles de resultados de sus retos
CREATE POLICY "result_details: challenge owner can read"
  ON public.challenge_result_details FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.challenge_results cr
            JOIN public.challenges c ON c.id = cr.challenge_id
            WHERE cr.id = challenge_result_details."challengeResult_id"
              AND c.user_id = auth.uid())
  );

-- 4. Cualquier usuario autenticado puede leer perfiles de profesores que comparten retos
--    Usa solo share_content.user_id para evitar recursion con policies de challenges→profiles
CREATE POLICY "profiles: read challenge owner profiles"
  ON public.profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.share_content sc
            WHERE sc.user_id = profiles.id
              AND sc."shareContentType" IN (4, 5))
  );
