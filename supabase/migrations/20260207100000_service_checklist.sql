-- Service Checklist Templates (configured once by pastor per church)
CREATE TABLE service_checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    section TEXT NOT NULL CHECK (section IN ('ANTES', 'DURANTE', 'FINAL')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Service Checklist Items (per-service instance of each template item)
CREATE TABLE service_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES service_checklist_templates(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_by UUID REFERENCES profiles(id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(service_id, template_id)
);

-- Indexes
CREATE INDEX idx_checklist_templates_church ON service_checklist_templates(church_id);
CREATE INDEX idx_checklist_items_service ON service_checklist_items(service_id);
CREATE INDEX idx_checklist_items_template ON service_checklist_items(template_id);

-- RLS
ALTER TABLE service_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_checklist_items ENABLE ROW LEVEL SECURITY;

-- Templates: members of the same church can read
CREATE POLICY "Church members can view checklist templates"
    ON service_checklist_templates FOR SELECT
    USING (
        church_id IN (
            SELECT p.church_id FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Templates: only PASTOR can insert/update/delete
CREATE POLICY "Pastors can manage checklist templates"
    ON service_checklist_templates FOR ALL
    USING (
        church_id IN (
            SELECT p.church_id FROM profiles p WHERE p.id = auth.uid() AND p.role = 'PASTOR'
        )
    )
    WITH CHECK (
        church_id IN (
            SELECT p.church_id FROM profiles p WHERE p.id = auth.uid() AND p.role = 'PASTOR'
        )
    );

-- Items: church members can view items for their church's services
CREATE POLICY "Church members can view checklist items"
    ON service_checklist_items FOR SELECT
    USING (
        service_id IN (
            SELECT s.id FROM services s
            JOIN profiles p ON p.church_id = s.church_id
            WHERE p.id = auth.uid()
        )
    );

-- Items: PASTOR and LEADER can manage checklist items
CREATE POLICY "Leaders can manage checklist items"
    ON service_checklist_items FOR ALL
    USING (
        service_id IN (
            SELECT s.id FROM services s
            JOIN profiles p ON p.church_id = s.church_id
            WHERE p.id = auth.uid() AND p.role IN ('PASTOR', 'LEADER')
        )
    )
    WITH CHECK (
        service_id IN (
            SELECT s.id FROM services s
            JOIN profiles p ON p.church_id = s.church_id
            WHERE p.id = auth.uid() AND p.role IN ('PASTOR', 'LEADER')
        )
    );
