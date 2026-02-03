-- ============================================
-- Migration: Add SUPER_ADMIN and DISCIPULADOR to user_role enum
-- ============================================
-- IMPORTANT: This must be executed FIRST, as a separate transaction.
-- After this commits, run 20260203_02_super_admin_panel.sql
-- ============================================

-- Add SUPER_ADMIN to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

-- Add DISCIPULADOR to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'DISCIPULADOR';
