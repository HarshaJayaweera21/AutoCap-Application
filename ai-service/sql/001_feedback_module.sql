-- Migration: Feedback Module setup
-- Database: Supabase PostgreSQL

-- 1. Create feedback_categories table
CREATE TABLE IF NOT EXISTS feedback_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default categories
INSERT INTO feedback_categories (name, description) VALUES
    ('Bug Report', 'Report a bug or unexpected behavior'),
    ('Feature Request', 'Request a new feature or enhancement'),
    ('UI/UX Issue', 'Report issues with the user interface or experience'),
    ('Performance', 'Report slow loading times or performance issues'),
    ('Other', 'Other types of feedback')
ON CONFLICT (name) DO NOTHING;

-- 2. Create feedback status enum type
DO $$ BEGIN
    CREATE TYPE feedback_status AS ENUM ('pending', 'in_review', 'acknowledged', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create main feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for anonymous users
    category_id INTEGER REFERENCES feedback_categories(id) ON DELETE RESTRICT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    status feedback_status DEFAULT 'pending'::feedback_status NOT NULL,
    admin_response TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_feedback_modtime ON feedback;
CREATE TRIGGER update_feedback_modtime
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Create feedback_attachments table for screenshots/files
CREATE TABLE IF NOT EXISTS feedback_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create feedback_votes table
CREATE TABLE IF NOT EXISTS feedback_votes (
    feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    vote_type SMALLINT CHECK (vote_type = 1 OR vote_type = -1) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (feedback_id, user_id)
);

-- Add some useful indexes
CREATE INDEX IF NOT EXISTS idx_feedback_category_id ON feedback(category_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_feedback_id ON feedback_votes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_attachments_feedback_id ON feedback_attachments(feedback_id);

-- Apply Row Level Security (RLS) policies if needed
-- ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
-- By default allowing all if RLS is not explicitly required to be super strict here out of the box, 
-- or you can configure policy in Supabase dashboard.
