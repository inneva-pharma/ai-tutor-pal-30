-- Allow any authenticated user to read challenges that have been
-- shared by a teacher via share_content (types 4 = public school, 5 = private group).
-- The app-level query in Challenges.tsx already filters by the student's
-- specific enrollments (grade + classroomLetter), so this policy just
-- ensures the row is not blocked by RLS.
CREATE POLICY "challenges: shared via share_content"
  ON public.challenges FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.share_content sc
      WHERE sc.challenge_id = challenges.id
        AND sc."shareContentType" IN (4, 5)
    )
  );

-- Same logic for challenge_questions: if the parent challenge is shared
-- via share_content, students can read its questions.
CREATE POLICY "challenge_questions: shared via share_content"
  ON public.challenge_questions FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.share_content sc
      WHERE sc.challenge_id = challenge_questions.challenge_id
        AND sc."shareContentType" IN (4, 5)
    )
  );
