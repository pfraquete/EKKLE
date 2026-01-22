-- Create course lesson comments table
CREATE TABLE IF NOT EXISTS public.course_lesson_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES public.course_videos(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.course_lesson_comments(id) ON DELETE CASCADE,
    is_pinned BOOLEAN DEFAULT false,
    is_answered BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.course_lesson_comments ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_comments_video_id ON public.course_lesson_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_course_comments_church_id ON public.course_lesson_comments(church_id);

-- Policies
-- 1. Everyone can read comments from their church
CREATE POLICY "Users can view comments of their church" ON public.course_lesson_comments
    FOR SELECT
    USING (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));

-- 2. Members can create comments
CREATE POLICY "Users can create comments in their church" ON public.course_lesson_comments
    FOR INSERT
    WITH CHECK (
        church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
        AND profile_id = auth.uid()
    );

-- 3. Only the author or a pastor can delete comments
CREATE POLICY "Authors or pastors can delete comments" ON public.course_lesson_comments
    FOR DELETE
    USING (
        profile_id = auth.uid() 
        OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'PASTOR'
    );

-- 4. Only pastors can pin or mark as answered
CREATE POLICY "Only pastors can update flags" ON public.course_lesson_comments
    FOR UPDATE
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'PASTOR')
    WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'PASTOR');
