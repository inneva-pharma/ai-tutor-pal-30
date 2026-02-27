-- Allow students to read share_content entries for teacher-shared challenges
-- shareContentType 4 = public (whole school), 5 = private (specific classroom)
CREATE POLICY "share_content: students can read teacher shares"
  ON public.share_content FOR SELECT
  TO authenticated USING (
    "shareContentType" IN (4, 5)
  );
