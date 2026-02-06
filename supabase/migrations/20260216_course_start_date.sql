-- Add course_start_date field to courses table
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS course_start_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_courses_course_start_date ON courses(course_start_date);
