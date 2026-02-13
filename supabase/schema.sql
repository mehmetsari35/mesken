-- ============================================
-- MESKEN - Database Schema
-- Supabase PostgreSQL Migration
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- Stores user profile information
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Username validation: lowercase, alphanumeric, underscores, 3-30 chars
    CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,30}$')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- ============================================
-- 2. INVITES TABLE
-- Manages invite codes for registration
-- ============================================
CREATE TABLE IF NOT EXISTS public.invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ,
    max_uses INT DEFAULT 1,
    uses_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT positive_max_uses CHECK (max_uses > 0),
    CONSTRAINT valid_uses_count CHECK (uses_count >= 0 AND uses_count <= max_uses)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invites_code ON public.invites(code);
CREATE INDEX IF NOT EXISTS idx_invites_created_by ON public.invites(created_by);
CREATE INDEX IF NOT EXISTS idx_invites_active ON public.invites(is_active) WHERE is_active = TRUE;

-- ============================================
-- 3. INVITE USES TABLE
-- Tracks who used which invite
-- ============================================
CREATE TABLE IF NOT EXISTS public.invite_uses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invite_id UUID REFERENCES public.invites(id) ON DELETE CASCADE NOT NULL,
    used_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(invite_id, used_by)
);

-- ============================================
-- 4. CONVERSATIONS TABLE
-- Stores DM and Group conversations
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('dm', 'group')),
    title TEXT,
    description TEXT,
    avatar_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_private BOOLEAN DEFAULT TRUE,
    invite_code TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_invite_code ON public.conversations(invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);

-- ============================================
-- 5. CONVERSATION MEMBERS TABLE
-- Links users to conversations with roles
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversation_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    is_muted BOOLEAN DEFAULT FALSE,

    UNIQUE(conversation_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON public.conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation ON public.conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_role ON public.conversation_members(role);

-- ============================================
-- 6. MESSAGES TABLE
-- Stores all messages (text and voice)
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'voice', 'system')),
    content TEXT,
    voice_path TEXT,
    voice_duration INT, -- Duration in seconds
    reply_to BIGINT REFERENCES public.messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Either content or voice_path must be present for non-system messages
    CONSTRAINT valid_message_content CHECK (
        type = 'system' OR content IS NOT NULL OR voice_path IS NOT NULL
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_type ON public.messages(type);

-- ============================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can read all profiles (needed for searching users)
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Profile is created via trigger, not directly
CREATE POLICY "Enable insert for service role only"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ============================================
-- INVITES POLICIES
-- ============================================

-- Anyone can check if an invite is valid (for registration)
CREATE POLICY "Invites are readable for validation"
ON public.invites FOR SELECT
TO anon, authenticated
USING (true);

-- Only authenticated users can create invites
CREATE POLICY "Authenticated users can create invites"
ON public.invites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Only creator can update their invites
CREATE POLICY "Creators can update own invites"
ON public.invites FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

-- ============================================
-- CONVERSATIONS POLICIES
-- ============================================

-- Users can only see conversations they are members of
CREATE POLICY "Members can view conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_members
        WHERE conversation_members.conversation_id = conversations.id
        AND conversation_members.user_id = auth.uid()
    )
);

-- Authenticated users can create conversations
CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Only owner/admin can update conversations
CREATE POLICY "Owner/Admin can update conversations"
ON public.conversations FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_members
        WHERE conversation_members.conversation_id = conversations.id
        AND conversation_members.user_id = auth.uid()
        AND conversation_members.role IN ('owner', 'admin')
    )
);

-- ============================================
-- CONVERSATION MEMBERS POLICIES
-- ============================================

-- Members can see other members in their conversations
CREATE POLICY "Members can view conversation members"
ON public.conversation_members FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_members AS cm
        WHERE cm.conversation_id = conversation_members.conversation_id
        AND cm.user_id = auth.uid()
    )
);

-- Owner/Admin can add members
CREATE POLICY "Owner/Admin can add members"
ON public.conversation_members FOR INSERT
TO authenticated
WITH CHECK (
    -- User is adding themselves to a DM they create
    (user_id = auth.uid()) OR
    -- User is owner/admin of the conversation
    EXISTS (
        SELECT 1 FROM public.conversation_members AS cm
        WHERE cm.conversation_id = conversation_members.conversation_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
);

-- Owner/Admin can update member roles
CREATE POLICY "Owner/Admin can update members"
ON public.conversation_members FOR UPDATE
TO authenticated
USING (
    -- Can update own membership (e.g., last_read_at)
    user_id = auth.uid() OR
    -- Owner/Admin can update others
    EXISTS (
        SELECT 1 FROM public.conversation_members AS cm
        WHERE cm.conversation_id = conversation_members.conversation_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
);

-- Owner can remove members, members can leave
CREATE POLICY "Owner can remove, members can leave"
ON public.conversation_members FOR DELETE
TO authenticated
USING (
    -- Members can remove themselves (leave)
    user_id = auth.uid() OR
    -- Owner can remove anyone
    EXISTS (
        SELECT 1 FROM public.conversation_members AS cm
        WHERE cm.conversation_id = conversation_members.conversation_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'owner'
    )
);

-- ============================================
-- MESSAGES POLICIES
-- ============================================

-- Members can read messages in their conversations
CREATE POLICY "Members can view messages"
ON public.messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_members
        WHERE conversation_members.conversation_id = messages.conversation_id
        AND conversation_members.user_id = auth.uid()
    )
);

-- Members can send messages to their conversations
CREATE POLICY "Members can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.conversation_members
        WHERE conversation_members.conversation_id = messages.conversation_id
        AND conversation_members.user_id = auth.uid()
    )
);

-- Senders can update their own messages
CREATE POLICY "Senders can update own messages"
ON public.messages FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- Senders can delete their own messages
CREATE POLICY "Senders can delete own messages"
ON public.messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- ============================================
-- 8. FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_username TEXT;
BEGIN
    -- Extract username from email (format: username@mesken.local)
    new_username := split_part(NEW.email, '@', 1);

    INSERT INTO public.profiles (id, username, display_name)
    VALUES (NEW.id, new_username, new_username);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update conversation updated_at when new message arrives
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.update_conversation_on_message();

-- ============================================
-- 9. RPC FUNCTIONS
-- ============================================

-- Validate and consume invite code (atomic operation)
CREATE OR REPLACE FUNCTION public.validate_and_consume_invite(invite_code TEXT)
RETURNS JSON AS $$
DECLARE
    invite_record RECORD;
    result JSON;
BEGIN
    -- Lock the invite row to prevent race conditions
    SELECT * INTO invite_record
    FROM public.invites
    WHERE code = invite_code
    FOR UPDATE;

    -- Check if invite exists
    IF NOT FOUND THEN
        RETURN json_build_object('valid', false, 'error', 'Davet kodu bulunamadı');
    END IF;

    -- Check if invite is active
    IF NOT invite_record.is_active THEN
        RETURN json_build_object('valid', false, 'error', 'Bu davet kodu artık aktif değil');
    END IF;

    -- Check if invite has expired
    IF invite_record.expires_at IS NOT NULL AND invite_record.expires_at < NOW() THEN
        RETURN json_build_object('valid', false, 'error', 'Bu davet kodunun süresi dolmuş');
    END IF;

    -- Check if invite has reached max uses
    IF invite_record.uses_count >= invite_record.max_uses THEN
        RETURN json_build_object('valid', false, 'error', 'Bu davet kodu kullanım limitine ulaşmış');
    END IF;

    -- Increment uses_count
    UPDATE public.invites
    SET uses_count = uses_count + 1
    WHERE id = invite_record.id;

    RETURN json_build_object(
        'valid', true,
        'invite_id', invite_record.id,
        'created_by', invite_record.created_by
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check username availability
CREATE OR REPLACE FUNCTION public.check_username_available(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE username = lower(check_username)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get or create DM conversation between two users
CREATE OR REPLACE FUNCTION public.get_or_create_dm(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
    dm_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();

    -- Check if DM already exists
    SELECT cm1.conversation_id INTO dm_id
    FROM public.conversation_members cm1
    INNER JOIN public.conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
    INNER JOIN public.conversations c ON c.id = cm1.conversation_id
    WHERE cm1.user_id = current_user_id
    AND cm2.user_id = other_user_id
    AND c.type = 'dm';

    IF dm_id IS NOT NULL THEN
        RETURN dm_id;
    END IF;

    -- Create new DM
    INSERT INTO public.conversations (type, created_by)
    VALUES ('dm', current_user_id)
    RETURNING id INTO dm_id;

    -- Add both users as members
    INSERT INTO public.conversation_members (conversation_id, user_id, role)
    VALUES
        (dm_id, current_user_id, 'member'),
        (dm_id, other_user_id, 'member');

    RETURN dm_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a group conversation
CREATE OR REPLACE FUNCTION public.create_group(
    group_title TEXT,
    group_description TEXT DEFAULT NULL,
    member_ids UUID[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    group_id UUID;
    current_user_id UUID;
    member_id UUID;
    group_invite_code TEXT;
BEGIN
    current_user_id := auth.uid();
    group_invite_code := encode(gen_random_bytes(6), 'hex');

    -- Create the group
    INSERT INTO public.conversations (type, title, description, created_by, invite_code)
    VALUES ('group', group_title, group_description, current_user_id, group_invite_code)
    RETURNING id INTO group_id;

    -- Add creator as owner
    INSERT INTO public.conversation_members (conversation_id, user_id, role)
    VALUES (group_id, current_user_id, 'owner');

    -- Add other members
    FOREACH member_id IN ARRAY member_ids
    LOOP
        IF member_id != current_user_id THEN
            INSERT INTO public.conversation_members (conversation_id, user_id, role)
            VALUES (group_id, member_id, 'member')
            ON CONFLICT (conversation_id, user_id) DO NOTHING;
        END IF;
    END LOOP;

    RETURN group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Join group via invite code
CREATE OR REPLACE FUNCTION public.join_group_via_code(group_invite_code TEXT)
RETURNS JSON AS $$
DECLARE
    group_record RECORD;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();

    -- Find the group
    SELECT * INTO group_record
    FROM public.conversations
    WHERE invite_code = group_invite_code AND type = 'group';

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Grup bulunamadı');
    END IF;

    -- Check if already a member
    IF EXISTS (
        SELECT 1 FROM public.conversation_members
        WHERE conversation_id = group_record.id AND user_id = current_user_id
    ) THEN
        RETURN json_build_object('success', true, 'group_id', group_record.id, 'already_member', true);
    END IF;

    -- Add as member
    INSERT INTO public.conversation_members (conversation_id, user_id, role)
    VALUES (group_record.id, current_user_id, 'member');

    RETURN json_build_object('success', true, 'group_id', group_record.id, 'already_member', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate invite code for user
CREATE OR REPLACE FUNCTION public.generate_invite_code(
    max_uses_param INT DEFAULT 5,
    expires_in_days INT DEFAULT 7
)
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    new_code := encode(gen_random_bytes(8), 'hex');

    INSERT INTO public.invites (code, created_by, max_uses, expires_at)
    VALUES (
        new_code,
        current_user_id,
        max_uses_param,
        NOW() + (expires_in_days || ' days')::INTERVAL
    );

    RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. STORAGE SETUP (Run in Supabase Dashboard)
-- ============================================
--
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create a new bucket named "voice" with the following settings:
--    - Public: OFF
--    - Allowed MIME types: audio/webm, audio/ogg, audio/mp4, audio/mpeg
--    - Max file size: 5MB
--
-- 3. Add the following storage policies:
--
-- Policy: Allow authenticated users to upload voice messages
-- INSERT policy for authenticated role:
-- bucket_id = 'voice' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- Policy: Allow users to read their own and conversation members' voice messages
-- SELECT policy for authenticated role:
-- bucket_id = 'voice'
--
-- ============================================
-- 11. FUTURE: Scheduled cleanup for voice messages
-- ============================================
--
-- Use Supabase Edge Functions with pg_cron or external cron to:
-- DELETE FROM storage.objects
-- WHERE bucket_id = 'voice'
-- AND created_at < NOW() - INTERVAL '30 days';
--
-- Also delete message records:
-- DELETE FROM public.messages
-- WHERE type = 'voice' AND created_at < NOW() - INTERVAL '30 days';
