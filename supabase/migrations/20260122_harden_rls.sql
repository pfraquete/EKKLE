-- ISS-001: Harden RLS for 'orders'
-- Ensure users can only create orders for their own church and with their own customer_id
DROP POLICY IF EXISTS "Users can create their own orders" ON "public"."orders";

CREATE POLICY "Users can create their own orders" ON "public"."orders"
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = customer_id AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.church_id = orders.church_id
  )
);

-- ISS-003: Harden RLS for 'course_video_progress'
-- Ensure users can only modify progress for enrollments that belong to them and match their church
DROP POLICY IF EXISTS "Users can update their own video progress" ON "public"."course_video_progress";

CREATE POLICY "Users can update their own video progress" ON "public"."course_video_progress"
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM course_enrollments
    JOIN profiles ON profiles.id = auth.uid()
    WHERE course_enrollments.id = course_video_progress.enrollment_id
    AND course_enrollments.profile_id = auth.uid()
    AND course_enrollments.church_id = profiles.church_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM course_enrollments
    JOIN profiles ON profiles.id = auth.uid()
    WHERE course_enrollments.id = course_video_progress.enrollment_id
    AND course_enrollments.profile_id = auth.uid()
    AND course_enrollments.church_id = profiles.church_id
  )
);
