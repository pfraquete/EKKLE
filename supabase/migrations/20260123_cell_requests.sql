-- =====================================================
-- Cell Requests - Sistema de Aprovação para Inscrição em Células
-- =====================================================
-- Execute this SQL in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/_/sql/new
-- =====================================================

-- Cell requests table
CREATE TABLE IF NOT EXISTS cell_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    cell_id UUID NOT NULL REFERENCES cells(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
    message TEXT,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_cell_requests_church_id ON cell_requests(church_id);
CREATE INDEX IF NOT EXISTS idx_cell_requests_cell_id ON cell_requests(cell_id);
CREATE INDEX IF NOT EXISTS idx_cell_requests_profile_id ON cell_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_cell_requests_status ON cell_requests(status);
CREATE INDEX IF NOT EXISTS idx_cell_requests_created_at ON cell_requests(created_at);

-- Prevent duplicate pending requests for the same cell
CREATE UNIQUE INDEX IF NOT EXISTS idx_cell_requests_unique_pending
    ON cell_requests(profile_id, cell_id)
    WHERE status = 'PENDING';

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE cell_requests ENABLE ROW LEVEL SECURITY;

-- Users can view requests from their church
CREATE POLICY "Users can view cell requests from their church" ON cell_requests
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Users can create their own cell requests
CREATE POLICY "Users can create their own cell requests" ON cell_requests
    FOR INSERT WITH CHECK (
        profile_id = auth.uid()
        AND church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    );

-- Users can update their own pending requests (to cancel)
CREATE POLICY "Users can update their own pending requests" ON cell_requests
    FOR UPDATE USING (
        profile_id = auth.uid()
        AND status = 'PENDING'
    );

-- Cell leaders can approve/reject requests for their cells
CREATE POLICY "Cell leaders can manage requests for their cells" ON cell_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM cells
            WHERE cells.id = cell_requests.cell_id
            AND cells.leader_id = auth.uid()
        )
    );

-- Pastors can manage all cell requests in their church
CREATE POLICY "Pastors can manage all cell requests" ON cell_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND church_id = cell_requests.church_id
            AND role = 'PASTOR'
        )
    );
