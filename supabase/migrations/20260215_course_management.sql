-- Add course management fields for modules, pricing, and enrollment start date
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS modules_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS price_cents INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS enrollment_start_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_courses_enrollment_start_date ON courses(enrollment_start_date);
