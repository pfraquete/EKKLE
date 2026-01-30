-- Prayer Partners System
-- Weekly automatic matching of prayer partners within a church

-- =============================================================================
-- PRAYER PARTNER PREFERENCES
-- =============================================================================

CREATE TABLE IF NOT EXISTS prayer_partner_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

  -- Opt-in status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Preferences (for future matching improvements)
  preferred_gender TEXT, -- 'same', 'any', or null
  preferred_age_group TEXT, -- 'similar', 'any', or null

  -- Stats
  total_partnerships INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(profile_id, church_id)
);

-- =============================================================================
-- PRAYER PARTNERSHIPS (Weekly matches)
-- =============================================================================

CREATE TABLE IF NOT EXISTS prayer_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

  -- The two partners
  partner_a_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_b_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Week info
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'SKIPPED')),

  -- Stats
  requests_shared INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique partnership per week
  UNIQUE(church_id, partner_a_id, week_start),
  UNIQUE(church_id, partner_b_id, week_start),

  -- Ensure partners are different
  CHECK (partner_a_id != partner_b_id)
);

-- =============================================================================
-- PRAYER REQUESTS (Shared between partners)
-- =============================================================================

CREATE TABLE IF NOT EXISTS partner_prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id UUID NOT NULL REFERENCES prayer_partnerships(id) ON DELETE CASCADE,

  -- Who sent the request
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Request content
  content TEXT NOT NULL,
  is_urgent BOOLEAN NOT NULL DEFAULT false,

  -- Status
  is_prayed BOOLEAN NOT NULL DEFAULT false,
  prayed_at TIMESTAMPTZ,
  prayed_by UUID REFERENCES profiles(id),

  -- Response/feedback
  response_note TEXT,
  is_answered BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMPTZ,
  testimony TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_prayer_partner_prefs_profile ON prayer_partner_preferences(profile_id);
CREATE INDEX IF NOT EXISTS idx_prayer_partner_prefs_church ON prayer_partner_preferences(church_id);
CREATE INDEX IF NOT EXISTS idx_prayer_partner_prefs_active ON prayer_partner_preferences(church_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_prayer_partnerships_partners ON prayer_partnerships(partner_a_id, partner_b_id);
CREATE INDEX IF NOT EXISTS idx_prayer_partnerships_week ON prayer_partnerships(church_id, week_start);
CREATE INDEX IF NOT EXISTS idx_prayer_partnerships_status ON prayer_partnerships(status, week_start);

CREATE INDEX IF NOT EXISTS idx_partner_requests_partnership ON partner_prayer_requests(partnership_id);
CREATE INDEX IF NOT EXISTS idx_partner_requests_sender ON partner_prayer_requests(sender_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update partnership request count
CREATE OR REPLACE FUNCTION update_partnership_request_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE prayer_partnerships
    SET requests_shared = requests_shared + 1
    WHERE id = NEW.partnership_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE prayer_partnerships
    SET requests_shared = requests_shared - 1
    WHERE id = OLD.partnership_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_partnership_requests ON partner_prayer_requests;
CREATE TRIGGER trigger_update_partnership_requests
AFTER INSERT OR DELETE ON partner_prayer_requests
FOR EACH ROW
EXECUTE FUNCTION update_partnership_request_count();

-- Update total partnerships count
CREATE OR REPLACE FUNCTION update_total_partnerships()
RETURNS TRIGGER AS $$
BEGIN
  -- Update partner A
  UPDATE prayer_partner_preferences
  SET total_partnerships = total_partnerships + 1,
      updated_at = NOW()
  WHERE profile_id = NEW.partner_a_id AND church_id = NEW.church_id;

  -- Update partner B
  UPDATE prayer_partner_preferences
  SET total_partnerships = total_partnerships + 1,
      updated_at = NOW()
  WHERE profile_id = NEW.partner_b_id AND church_id = NEW.church_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_total_partnerships ON prayer_partnerships;
CREATE TRIGGER trigger_update_total_partnerships
AFTER INSERT ON prayer_partnerships
FOR EACH ROW
EXECUTE FUNCTION update_total_partnerships();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE prayer_partner_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_prayer_requests ENABLE ROW LEVEL SECURITY;

-- Preferences: users can manage their own
CREATE POLICY "Users can view own preferences"
  ON prayer_partner_preferences FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own preferences"
  ON prayer_partner_preferences FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own preferences"
  ON prayer_partner_preferences FOR UPDATE
  USING (auth.uid() = profile_id);

-- Partnerships: users can view partnerships they are part of
CREATE POLICY "Users can view own partnerships"
  ON prayer_partnerships FOR SELECT
  USING (auth.uid() = partner_a_id OR auth.uid() = partner_b_id);

-- Prayer requests: users can view/manage requests in their partnerships
CREATE POLICY "Users can view partnership requests"
  ON partner_prayer_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM prayer_partnerships pp
      WHERE pp.id = partnership_id
      AND (pp.partner_a_id = auth.uid() OR pp.partner_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert requests in own partnerships"
  ON partner_prayer_requests FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM prayer_partnerships pp
      WHERE pp.id = partnership_id
      AND (pp.partner_a_id = auth.uid() OR pp.partner_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can update requests they received"
  ON partner_prayer_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM prayer_partnerships pp
      WHERE pp.id = partnership_id
      AND (pp.partner_a_id = auth.uid() OR pp.partner_b_id = auth.uid())
    )
  );

-- =============================================================================
-- FUNCTION: Get or create weekly match
-- =============================================================================

CREATE OR REPLACE FUNCTION get_or_create_weekly_partner(
  p_profile_id UUID,
  p_church_id UUID
)
RETURNS TABLE (
  partnership_id UUID,
  partner_id UUID,
  partner_name TEXT,
  partner_photo TEXT,
  week_start DATE,
  week_end DATE,
  is_new BOOLEAN
) AS $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
  v_existing_partnership UUID;
  v_partner_id UUID;
  v_new_partnership UUID;
  v_available_partner UUID;
BEGIN
  -- Calculate current week (Monday to Sunday)
  v_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  v_week_end := v_week_start + INTERVAL '6 days';

  -- Check if user has preferences and is active
  IF NOT EXISTS (
    SELECT 1 FROM prayer_partner_preferences
    WHERE profile_id = p_profile_id AND church_id = p_church_id AND is_active = true
  ) THEN
    -- Auto-create preferences if not exists
    INSERT INTO prayer_partner_preferences (profile_id, church_id, is_active)
    VALUES (p_profile_id, p_church_id, true)
    ON CONFLICT (profile_id, church_id) DO UPDATE SET is_active = true, updated_at = NOW();
  END IF;

  -- Check for existing partnership this week
  SELECT pp.id,
         CASE WHEN pp.partner_a_id = p_profile_id THEN pp.partner_b_id ELSE pp.partner_a_id END
  INTO v_existing_partnership, v_partner_id
  FROM prayer_partnerships pp
  WHERE pp.church_id = p_church_id
    AND pp.week_start = v_week_start
    AND (pp.partner_a_id = p_profile_id OR pp.partner_b_id = p_profile_id)
    AND pp.status = 'ACTIVE';

  IF v_existing_partnership IS NOT NULL THEN
    -- Return existing partnership
    RETURN QUERY
    SELECT
      v_existing_partnership,
      v_partner_id,
      p.full_name,
      p.photo_url,
      v_week_start,
      v_week_end,
      false
    FROM profiles p
    WHERE p.id = v_partner_id;
    RETURN;
  END IF;

  -- Find an available partner (active, same church, not yet matched this week)
  SELECT pref.profile_id INTO v_available_partner
  FROM prayer_partner_preferences pref
  WHERE pref.church_id = p_church_id
    AND pref.is_active = true
    AND pref.profile_id != p_profile_id
    AND NOT EXISTS (
      SELECT 1 FROM prayer_partnerships pp
      WHERE pp.church_id = p_church_id
        AND pp.week_start = v_week_start
        AND (pp.partner_a_id = pref.profile_id OR pp.partner_b_id = pref.profile_id)
        AND pp.status = 'ACTIVE'
    )
  ORDER BY pref.total_partnerships ASC, RANDOM()
  LIMIT 1;

  IF v_available_partner IS NULL THEN
    -- No available partner, return empty
    RETURN;
  END IF;

  -- Create new partnership
  INSERT INTO prayer_partnerships (
    church_id, partner_a_id, partner_b_id, week_start, week_end, status
  )
  VALUES (
    p_church_id, p_profile_id, v_available_partner, v_week_start, v_week_end, 'ACTIVE'
  )
  RETURNING id INTO v_new_partnership;

  -- Return new partnership
  RETURN QUERY
  SELECT
    v_new_partnership,
    v_available_partner,
    p.full_name,
    p.photo_url,
    v_week_start,
    v_week_end,
    true
  FROM profiles p
  WHERE p.id = v_available_partner;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_or_create_weekly_partner(UUID, UUID) TO authenticated;
