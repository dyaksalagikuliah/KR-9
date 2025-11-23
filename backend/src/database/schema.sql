-- Proof of Crime Database Schema
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(100),
    profile_image_url TEXT,
    bio TEXT,
    role VARCHAR(20) DEFAULT 'hunter', -- 'hunter', 'company', 'validator', 'admin'
    kyc_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    kyc_document_hash VARCHAR(66),
    is_active BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- BOUNTIES TABLE (Off-chain extended data)
-- ============================================
CREATE TABLE IF NOT EXISTS bounties (
    id SERIAL PRIMARY KEY,
    bounty_id INTEGER NOT NULL UNIQUE, -- On-chain bounty ID
    company_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_contract_address VARCHAR(42),
    target_contract_source_code TEXT,
    documentation_url TEXT,
    tags TEXT[],
    category VARCHAR(50), -- 'smart-contract', 'dapp', 'protocol'
    visibility VARCHAR(20) DEFAULT 'public', -- 'public', 'private'
    ipfs_hash VARCHAR(66),

    -- On-chain synced data
    total_reward NUMERIC(78, 0), -- BigInt as string
    remaining_reward NUMERIC(78, 0),
    lock_amount NUMERIC(78, 0),
    status INTEGER DEFAULT 0, -- 0=Active, 1=Dinilai, 2=Valid, 3=Invalid, 4=Completed, 5=Cancelled
    deadline TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    payment_token VARCHAR(42),

    -- Blockchain tracking
    block_number BIGINT,
    tx_hash VARCHAR(66),

    -- Stats
    view_count INTEGER DEFAULT 0,
    submission_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bounties_company ON bounties(company_id);
CREATE INDEX idx_bounties_status ON bounties(status);
CREATE INDEX idx_bounties_category ON bounties(category);
CREATE INDEX idx_bounties_deadline ON bounties(deadline);
CREATE INDEX idx_bounties_is_active ON bounties(is_active);

-- ============================================
-- SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER UNIQUE, -- On-chain submission ID (NULL until submitted)
    bounty_id INTEGER REFERENCES bounties(id) ON DELETE CASCADE,
    hunter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Submission details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    vulnerability_type VARCHAR(100), -- 'reentrancy', 'overflow', 'access-control', etc.
    severity INTEGER DEFAULT 0, -- 0=None, 1=Low, 2=Medium, 3=High
    proof_of_concept TEXT,
    reproduction_steps TEXT,
    suggested_fix TEXT,

    -- Files
    files_ipfs_hash VARCHAR(66),

    -- Status
    status INTEGER DEFAULT 0, -- Same as bounty status
    is_public BOOLEAN DEFAULT FALSE,
    is_paid BOOLEAN DEFAULT FALSE,
    reward_amount NUMERIC(78, 0),

    -- Blockchain tracking
    block_number BIGINT,
    tx_hash VARCHAR(66),
    submitted_at TIMESTAMP,
    paid_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_submissions_bounty ON submissions(bounty_id);
CREATE INDEX idx_submissions_hunter ON submissions(hunter_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_severity ON submissions(severity);

-- ============================================
-- SUBMISSION FILES
-- ============================================
CREATE TABLE IF NOT EXISTS submission_files (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50), -- 'image', 'video', 'code', 'pdf', 'other'
    file_size BIGINT,
    mime_type VARCHAR(100),
    ipfs_hash VARCHAR(66) NOT NULL,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_submission_files_submission ON submission_files(submission_id);

-- ============================================
-- COMMENTS & DISCUSSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comments_submission ON comments(submission_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);

-- ============================================
-- VALIDATOR VOTES (Off-chain tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS validator_votes (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
    validator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    severity_vote INTEGER, -- 0=None, 1=Low, 2=Medium, 3=High
    is_valid BOOLEAN,
    comments TEXT,
    on_chain_tx_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(submission_id, validator_id)
);

CREATE INDEX idx_validator_votes_submission ON validator_votes(submission_id);
CREATE INDEX idx_validator_votes_validator ON validator_votes(validator_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'bounty_created', 'submission_received', 'reward_paid', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT,
    link VARCHAR(255),
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- ============================================
-- ANALYTICS EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);

-- ============================================
-- CRIMINAL RECORDS (Roadmap)
-- ============================================
CREATE TABLE IF NOT EXISTS criminal_records (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    crime_type VARCHAR(100) NOT NULL,
    description TEXT,
    evidence_ipfs_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'reported', -- 'reported', 'investigating', 'confirmed', 'dismissed'
    severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    amount_stolen NUMERIC(78, 0),
    reported_by INTEGER REFERENCES users(id),
    verified_by INTEGER REFERENCES users(id),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_criminal_records_wallet ON criminal_records(wallet_address);
CREATE INDEX idx_criminal_records_status ON criminal_records(status);
CREATE INDEX idx_criminal_records_severity ON criminal_records(severity);

-- ============================================
-- IPFS FILES TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS ipfs_files (
    id SERIAL PRIMARY KEY,
    ipfs_hash VARCHAR(66) UNIQUE NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    uploader_id INTEGER REFERENCES users(id),
    is_pinned BOOLEAN DEFAULT TRUE,
    pin_service VARCHAR(50), -- 'pinata', 'web3storage', 'infura'
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ipfs_hash ON ipfs_files(ipfs_hash);

-- ============================================
-- INDEXER STATE
-- ============================================
CREATE TABLE IF NOT EXISTS indexer_state (
    id SERIAL PRIMARY KEY,
    contract_address VARCHAR(42) NOT NULL,
    network VARCHAR(50) NOT NULL,
    last_block BIGINT NOT NULL,
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(contract_address, network)
);

-- ============================================
-- PLATFORM STATISTICS
-- ============================================
CREATE TABLE IF NOT EXISTS platform_stats (
    id INTEGER PRIMARY KEY DEFAULT 1,
    total_bounties INTEGER DEFAULT 0,
    total_submissions INTEGER DEFAULT 0,
    total_valid_submissions INTEGER DEFAULT 0,
    total_rewards_paid NUMERIC(78, 0) DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    total_hunters INTEGER DEFAULT 0,
    total_companies INTEGER DEFAULT 0,
    total_validators INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW(),
    CHECK (id = 1)
);

INSERT INTO platform_stats (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- HUNTER STATISTICS
-- ============================================
CREATE TABLE IF NOT EXISTS hunter_stats (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    total_earned NUMERIC(78, 0) DEFAULT 0,
    successful_submissions INTEGER DEFAULT 0,
    total_submissions INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    last_submission_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hunter_stats_wallet ON hunter_stats(wallet_address);
CREATE INDEX idx_hunter_stats_earned ON hunter_stats(total_earned DESC);

-- ============================================
-- SESSIONS (if using express-session with PostgreSQL)
-- ============================================
CREATE TABLE IF NOT EXISTS session (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (sid)
);

CREATE INDEX idx_session_expire ON session(expire);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bounties_updated_at BEFORE UPDATE ON bounties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Active bounties with company info
CREATE OR REPLACE VIEW active_bounties_view AS
SELECT
    b.*,
    u.wallet_address as company_wallet,
    u.username as company_name,
    u.profile_image_url as company_avatar
FROM bounties b
JOIN users u ON b.company_id = u.id
WHERE b.is_active = TRUE AND b.deadline > NOW();

-- Hunter leaderboard
CREATE OR REPLACE VIEW hunter_leaderboard_view AS
SELECT
    u.id,
    u.wallet_address,
    u.username,
    u.profile_image_url,
    hs.total_earned,
    hs.successful_submissions,
    hs.total_submissions,
    CASE
        WHEN hs.total_submissions > 0
        THEN ROUND((hs.successful_submissions::NUMERIC / hs.total_submissions::NUMERIC) * 100, 2)
        ELSE 0
    END as success_rate,
    hs.reputation_score
FROM users u
JOIN hunter_stats hs ON u.wallet_address = hs.wallet_address
WHERE u.role = 'hunter' AND u.is_active = TRUE
ORDER BY hs.total_earned DESC;

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default admin user (update wallet address in .env)
-- INSERT INTO users (wallet_address, role, is_active)
-- VALUES ('0x0000000000000000000000000000000000000000', 'admin', TRUE)
-- ON CONFLICT (wallet_address) DO NOTHING;
