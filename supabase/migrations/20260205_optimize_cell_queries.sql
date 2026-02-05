-- =====================================================
-- STORED PROCEDURE: get_member_cell_data
-- Consolidates multiple queries into one for performance
-- Returns all cell data for a member in a single call
-- =====================================================

CREATE OR REPLACE FUNCTION get_member_cell_data(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile RECORD;
    v_cell RECORD;
    v_result JSON;
BEGIN
    -- Get user profile with cell_id
    SELECT id, church_id, cell_id, role
    INTO v_profile
    FROM profiles
    WHERE id = p_user_id AND is_active = true;
    
    IF v_profile IS NULL OR v_profile.cell_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get cell with leader info
    SELECT 
        c.id,
        c.name,
        c.address,
        c.neighborhood,
        c.day_of_week,
        c.meeting_time,
        c.status,
        json_build_object(
            'id', l.id,
            'full_name', l.full_name,
            'photo_url', l.photo_url
        ) as leader
    INTO v_cell
    FROM cells c
    LEFT JOIN profiles l ON c.leader_id = l.id
    WHERE c.id = v_profile.cell_id 
      AND c.status = 'ACTIVE'
      AND c.church_id = v_profile.church_id;
    
    IF v_cell IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Build complete result with all data in one query
    SELECT json_build_object(
        'cell', json_build_object(
            'id', v_cell.id,
            'name', v_cell.name,
            'address', v_cell.address,
            'neighborhood', v_cell.neighborhood,
            'dayOfWeek', v_cell.day_of_week,
            'meetingTime', v_cell.meeting_time,
            'leader', v_cell.leader
        ),
        'members', COALESCE((
            SELECT json_agg(json_build_object(
                'id', p.id,
                'fullName', p.full_name,
                'photoUrl', p.photo_url,
                'birthDate', p.birthday
            ) ORDER BY p.full_name)
            FROM profiles p
            WHERE p.cell_id = v_cell.id 
              AND p.is_active = true
              AND p.church_id = v_profile.church_id
        ), '[]'::json),
        'stats', json_build_object(
            'membersCount', (
                SELECT COUNT(*)::int 
                FROM profiles 
                WHERE cell_id = v_cell.id 
                  AND is_active = true
                  AND church_id = v_profile.church_id
            ),
            'avgAttendance', COALESCE((
                SELECT ROUND(
                    (COUNT(*) FILTER (WHERE a.status = 'PRESENT')::numeric / 
                     NULLIF(COUNT(*)::numeric, 0)) * 100
                )::int
                FROM cell_meetings cm
                JOIN attendance a ON a.context_id = cm.id AND a.context_type = 'CELL_MEETING'
                WHERE cm.cell_id = v_cell.id 
                  AND cm.status = 'COMPLETED'
                  AND cm.date >= CURRENT_DATE - INTERVAL '90 days'
            ), 0)
        ),
        'recentMeetings', COALESCE((
            SELECT json_agg(json_build_object(
                'id', cm.id,
                'date', cm.date,
                'presentCount', (
                    SELECT COUNT(*) 
                    FROM attendance 
                    WHERE context_id = cm.id 
                      AND context_type = 'CELL_MEETING'
                      AND status = 'PRESENT'
                )::int,
                'hasReport', EXISTS(SELECT 1 FROM cell_reports WHERE meeting_id = cm.id)
            ) ORDER BY cm.date DESC)
            FROM (
                SELECT id, date
                FROM cell_meetings
                WHERE cell_id = v_cell.id 
                  AND status = 'COMPLETED'
                ORDER BY date DESC
                LIMIT 5
            ) cm
        ), '[]'::json),
        'userRole', v_profile.role
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_member_cell_data(UUID) TO authenticated;

-- =====================================================
-- STORED PROCEDURE: get_cell_photos_optimized
-- Returns cell photos with uploader info
-- =====================================================

CREATE OR REPLACE FUNCTION get_cell_photos_optimized(p_cell_id UUID, p_church_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN COALESCE((
        SELECT json_agg(json_build_object(
            'id', cp.id,
            'photo_url', cp.photo_url,
            'storage_path', cp.storage_path,
            'description', cp.description,
            'photo_date', cp.photo_date,
            'created_at', cp.created_at,
            'uploader', json_build_object(
                'full_name', p.full_name
            ),
            'face_processed', cp.face_processed,
            'face_count', cp.face_count
        ) ORDER BY cp.created_at DESC)
        FROM cell_photos cp
        LEFT JOIN profiles p ON cp.uploaded_by = p.id
        WHERE cp.cell_id = p_cell_id 
          AND cp.church_id = p_church_id
    ), '[]'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION get_cell_photos_optimized(UUID, UUID) TO authenticated;

-- =====================================================
-- STORED PROCEDURE: get_cell_prayer_requests_optimized
-- Returns prayer requests with supporters count
-- =====================================================

CREATE OR REPLACE FUNCTION get_cell_prayer_requests_optimized(
    p_cell_id UUID, 
    p_church_id UUID,
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN COALESCE((
        SELECT json_agg(json_build_object(
            'id', pr.id,
            'cell_id', pr.cell_id,
            'author_id', pr.author_id,
            'church_id', pr.church_id,
            'request', pr.request,
            'is_anonymous', pr.is_anonymous,
            'status', pr.status,
            'testimony', pr.testimony,
            'created_at', pr.created_at,
            'updated_at', pr.updated_at,
            'author', CASE 
                WHEN pr.is_anonymous THEN NULL
                ELSE json_build_object(
                    'id', a.id,
                    'full_name', a.full_name,
                    'photo_url', a.photo_url
                )
            END,
            'supporters_count', (
                SELECT COUNT(*)::int 
                FROM cell_prayer_supporters 
                WHERE prayer_request_id = pr.id
            ),
            'user_is_supporting', EXISTS(
                SELECT 1 
                FROM cell_prayer_supporters 
                WHERE prayer_request_id = pr.id 
                  AND supporter_id = p_user_id
            )
        ) ORDER BY pr.created_at DESC)
        FROM cell_prayer_requests pr
        LEFT JOIN profiles a ON pr.author_id = a.id
        WHERE pr.cell_id = p_cell_id 
          AND pr.church_id = p_church_id
          AND pr.status IN ('active', 'answered')
    ), '[]'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION get_cell_prayer_requests_optimized(UUID, UUID, UUID) TO authenticated;

-- =====================================================
-- INDEX OPTIMIZATIONS
-- Add indexes for common query patterns
-- =====================================================

-- Index for cell members lookup
CREATE INDEX IF NOT EXISTS idx_profiles_cell_active 
ON profiles(cell_id, is_active) 
WHERE is_active = true;

-- Index for cell meetings by cell and status
CREATE INDEX IF NOT EXISTS idx_cell_meetings_cell_status 
ON cell_meetings(cell_id, status, date DESC);

-- Index for attendance by context
CREATE INDEX IF NOT EXISTS idx_attendance_context 
ON attendance(context_id, context_type, status);

-- Index for cell photos
CREATE INDEX IF NOT EXISTS idx_cell_photos_cell_church 
ON cell_photos(cell_id, church_id, created_at DESC);

-- Index for prayer requests
CREATE INDEX IF NOT EXISTS idx_prayer_requests_cell_status 
ON cell_prayer_requests(cell_id, church_id, status);

-- Index for prayer supporters
CREATE INDEX IF NOT EXISTS idx_prayer_supporters_request 
ON cell_prayer_supporters(prayer_request_id, supporter_id);

-- =====================================================
-- COMMENT
-- =====================================================
COMMENT ON FUNCTION get_member_cell_data IS 'Optimized function to get all cell data for a member in a single database call. Reduces ~10 queries to 1.';
