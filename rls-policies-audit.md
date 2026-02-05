# Políticas RLS que referenciam profile_id

Encontradas as seguintes tabelas com políticas que usam `profile_id`:

1. **live_lesson_messages** - "Users can send messages" - `with_check: (auth.uid() = profile_id)`
2. **course_live_chat** - "Members can send chat messages" - `with_check: (profile_id = auth.uid())`
3. **member_tithes** - "Members can view their own tithes" - `qual: (profile_id = auth.uid())`
4. **course_enrollments** - "Users can view their own enrollments" - `qual: (profile_id = auth.uid())`
5. **course_enrollments** - "Users can update their own" - `qual: (profile_id = auth.uid())`
6. **course_video_progress** - "Users can view their own video progress" - usa profile_id
7. **cell_requests** - "Users can view own requests" - usa profile_id

A tabela `course_payments` NÃO aparece na lista, o que significa que ela não existe mais ou não tem políticas.

O erro pode estar vindo de uma query que está sendo executada em outra tabela.
