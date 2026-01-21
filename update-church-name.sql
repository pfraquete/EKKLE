-- =====================================================
-- Ekkle - Atualização do Nome da Igreja
-- =====================================================
-- Execute este SQL no Supabase SQL Editor para atualizar
-- apenas o nome da igreja de "Videira São José dos Campos" para "Ekkle"
-- =====================================================

-- Atualizar o nome da igreja padrão
UPDATE churches
SET name = 'Ekkle',
    updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verificar a atualização
SELECT id, name, created_at, updated_at
FROM churches
WHERE id = '00000000-0000-0000-0000-000000000001';
