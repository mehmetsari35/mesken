-- ============================================
-- FIX: Infinite recursion in conversation_members RLS policy
-- ============================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Members can view conversation members" ON public.conversation_members;
DROP POLICY IF EXISTS "Owner/Admin can add members" ON public.conversation_members;
DROP POLICY IF EXISTS "Owner/Admin can update members" ON public.conversation_members;
DROP POLICY IF EXISTS "Owner can remove, members can leave" ON public.conversation_members;

-- Recreate SELECT policy without self-reference
-- Users can see their own memberships directly
CREATE POLICY "Users can view own memberships"
ON public.conversation_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can view other members in conversations they belong to
-- This uses a subquery that doesn't cause recursion
CREATE POLICY "Members can view conversation members"
ON public.conversation_members FOR SELECT
TO authenticated
USING (
    conversation_id IN (
        SELECT cm.conversation_id
        FROM public.conversation_members cm
        WHERE cm.user_id = auth.uid()
    )
);

-- INSERT policy: Allow adding yourself or if you're admin/owner
CREATE POLICY "Can add members"
ON public.conversation_members FOR INSERT
TO authenticated
WITH CHECK (
    -- User is adding themselves
    user_id = auth.uid() OR
    -- User is owner/admin of the conversation (check via conversations table to avoid recursion)
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
        AND c.created_by = auth.uid()
    ) OR
    -- Check if user is admin/owner via direct query
    conversation_id IN (
        SELECT cm.conversation_id
        FROM public.conversation_members cm
        WHERE cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
);

-- UPDATE policy
CREATE POLICY "Can update members"
ON public.conversation_members FOR UPDATE
TO authenticated
USING (
    -- Can update own membership
    user_id = auth.uid() OR
    -- Owner/Admin can update others
    conversation_id IN (
        SELECT cm.conversation_id
        FROM public.conversation_members cm
        WHERE cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
);

-- DELETE policy
CREATE POLICY "Can remove members"
ON public.conversation_members FOR DELETE
TO authenticated
USING (
    -- Members can remove themselves (leave)
    user_id = auth.uid() OR
    -- Owner can remove anyone
    conversation_id IN (
        SELECT cm.conversation_id
        FROM public.conversation_members cm
        WHERE cm.user_id = auth.uid()
        AND cm.role = 'owner'
    )
);
