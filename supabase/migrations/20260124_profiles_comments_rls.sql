-- ISS-004 & ISS-005: Harden RLS for Profiles and Comments

-- 1. Profiles Table Hardening
DROP POLICY IF EXISTS "profiles_all_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_service" ON public.profiles;
DROP POLICY IF EXISTS "Pastors and leaders can manage profiles" ON public.profiles;

-- Allow users to see their own profile or others in the SAME church
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid() OR 
  church_id = (SELECT p.church_id FROM public.profiles p WHERE p.id = auth.uid())
);

-- Management policy for leaders: ONLY managing their own church
CREATE POLICY "Pastors and leaders can manage profiles" ON public.profiles
FOR ALL TO authenticated
USING (
  (get_auth_role() = ANY (ARRAY['PASTOR'::public.user_role, 'LEADER'::public.user_role])) AND 
  (church_id = (SELECT p.church_id FROM public.profiles p WHERE p.id = auth.uid()))
)
WITH CHECK (
  (get_auth_role() = ANY (ARRAY['PASTOR'::public.user_role, 'LEADER'::public.user_role])) AND 
  (church_id = (SELECT p.church_id FROM public.profiles p WHERE p.id = auth.uid()))
);

-- 2. Course Lesson Comments Hardening
DROP POLICY IF EXISTS "Authors or pastors can delete comments" ON public.course_lesson_comments;
CREATE POLICY "Authors or pastors can delete comments" ON public.course_lesson_comments
FOR DELETE TO authenticated
USING (
  (profile_id = auth.uid()) OR 
  (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'PASTOR'::public.user_role
      AND profiles.church_id = course_lesson_comments.church_id
    )
  )
);

DROP POLICY IF EXISTS "Only pastors can update flags" ON public.course_lesson_comments;
DROP POLICY IF EXISTS "Only pastors can manage comments" ON public.course_lesson_comments;
CREATE POLICY "Only pastors can manage comments" ON public.course_lesson_comments
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'PASTOR'::public.user_role
    AND profiles.church_id = course_lesson_comments.church_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'PASTOR'::public.user_role
    AND profiles.church_id = course_lesson_comments.church_id
  )
);
