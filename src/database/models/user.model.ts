// -- Ensure the uuid-ossp extension is available if you want to use uuid_generate_v4()
// CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

// -- Create the users table
// CREATE TABLE IF NOT EXISTS users (
//     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//     email VARCHAR(255) UNIQUE NOT NULL, -- Will be stored as lowercase
//     password_hash VARCHAR(255) NOT NULL,
//     full_name VARCHAR(255),
//     roles TEXT[] NOT NULL DEFAULT ARRAY['PATIENT']::TEXT[], -- Array of roles
//     is_active BOOLEAN DEFAULT TRUE,
//     is_email_verified BOOLEAN DEFAULT FALSE,
//     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
// );

// -- Add a case-insensitive unique index on email for robust duplicate checking
// CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower_unique ON users (LOWER(email));

// -- Optionally, if you had an old case-sensitive index and want to remove it:
// -- DROP INDEX IF EXISTS idx_users_email;

// -- You can also add other indexes as needed, for example:
// -- CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN (roles); -- If you query by roles often