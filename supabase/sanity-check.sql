-- ============================================
-- SANITY CHECK: Test if DM creation works
-- Run this in Supabase SQL Editor
-- ============================================

-- First, let's see what users exist
SELECT id, username FROM profiles LIMIT 5;

-- Check if get_or_create_dm function exists
SELECT
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_or_create_dm'
AND n.nspname = 'public';

-- Check existing conversations
SELECT
    c.id,
    c.type,
    c.created_at,
    array_agg(cm.user_id) as member_ids
FROM conversations c
LEFT JOIN conversation_members cm ON c.id = cm.conversation_id
GROUP BY c.id, c.type, c.created_at
LIMIT 10;

-- Check RLS policies on conversations
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('conversations', 'conversation_members', 'messages');

-- Test: Manually call get_or_create_dm as a specific user
-- Replace USER_ID_1 and USER_ID_2 with actual user IDs from the first query
-- SET LOCAL request.jwt.claim.sub = 'USER_ID_1';
-- SELECT get_or_create_dm('USER_ID_2'::uuid);
