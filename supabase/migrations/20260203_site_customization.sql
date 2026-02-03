-- =====================================================
-- Migration: Site Customization System
-- Date: 2026-02-03
-- Description: Expande website_settings para suportar
-- personalização completa de cores, textos, seções e células
-- =====================================================

-- Comentário explicativo sobre a estrutura do website_settings JSONB:
-- {
--   "homepage": { ... configurações da homepage ... },
--   "theme": {
--     "primaryColor": "#D4AF37",
--     "secondaryColor": "#1A1A1A",
--     "accentColor": "#F2D675",
--     "backgroundColor": "#0B0B0B",
--     "textColor": "#FFFFFF",
--     "fontFamily": "Inter",
--     "borderRadius": "lg"
--   },
--   "header": {
--     "logoPosition": "left",
--     "menuStyle": "default",
--     "showSocialLinks": true,
--     "transparent": true
--   },
--   "footer": {
--     "enabled": true,
--     "showAddress": true,
--     "showSocialLinks": true,
--     "showCopyright": true,
--     "customText": ""
--   },
--   "sections": {
--     "cells": {
--       "enabled": true,
--       "order": 2,
--       "title": "Conheça nossas Células",
--       "subtitle": "Encontre uma célula perto de você",
--       "showAddress": true,
--       "showLeader": true,
--       "showSchedule": true,
--       "layout": "grid"
--     },
--     "events": { ... },
--     "courses": { ... },
--     "about": { ... },
--     "contact": { ... },
--     "testimonials": { ... }
--   },
--   "seo": {
--     "metaTitle": "",
--     "metaDescription": "",
--     "ogImage": ""
--   },
--   "customCss": ""
-- }

-- Não precisamos alterar a estrutura da tabela, pois website_settings já é JSONB
-- Apenas documentamos a estrutura esperada acima

-- Garantir que a coluna website_settings existe e tem valor padrão
DO $$
BEGIN
    -- Verificar se a coluna existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'churches' AND column_name = 'website_settings'
    ) THEN
        ALTER TABLE churches ADD COLUMN website_settings JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Criar índice GIN para buscas eficientes no JSONB
CREATE INDEX IF NOT EXISTS idx_churches_website_settings ON churches USING GIN (website_settings);

-- Adicionar coluna para tema customizado (para referência rápida)
ALTER TABLE churches ADD COLUMN IF NOT EXISTS site_theme TEXT DEFAULT 'default';

-- Comentário na coluna para documentação
COMMENT ON COLUMN churches.website_settings IS 'Configurações completas do site público da igreja em formato JSONB. Inclui tema, cores, seções, SEO e customizações.';
COMMENT ON COLUMN churches.site_theme IS 'Tema visual do site: default, modern, classic, minimal';
