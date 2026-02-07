-- Performance optimization indexes
-- These composite indexes target the most frequent dashboard queries

-- Profiles: church_id + is_active (used in member counts and lists)
CREATE INDEX IF NOT EXISTS idx_profiles_church_active 
ON profiles(church_id, is_active);

-- Profiles: church_id + member_stage + created_at (used in growth data)
CREATE INDEX IF NOT EXISTS idx_profiles_church_stage_created 
ON profiles(church_id, member_stage, created_at);

-- Members: church_id + is_active (used in congregation counts)
CREATE INDEX IF NOT EXISTS idx_members_church_active 
ON members(church_id, is_active);

-- Members: church_id + member_stage + created_at (used in growth data)
CREATE INDEX IF NOT EXISTS idx_members_church_stage_created 
ON members(church_id, member_stage, created_at);

-- Cell reports: church_id + created_at (used in recent reports check)
CREATE INDEX IF NOT EXISTS idx_cell_reports_church_created 
ON cell_reports(church_id, created_at);

-- Attendance: church_id + context_date + status (used in attendance calculation)
CREATE INDEX IF NOT EXISTS idx_attendance_church_date_status 
ON attendance(church_id, context_date, status);

-- Orders: church_id + payment_status (used in order stats)
CREATE INDEX IF NOT EXISTS idx_orders_church_payment 
ON orders(church_id, payment_status);

-- Course enrollments: church_id + status (used in enrollment stats)
CREATE INDEX IF NOT EXISTS idx_enrollments_church_status 
ON course_enrollments(church_id, status);

-- Events: church_id + start_date (used in upcoming events)
CREATE INDEX IF NOT EXISTS idx_events_church_start 
ON events(church_id, start_date);
