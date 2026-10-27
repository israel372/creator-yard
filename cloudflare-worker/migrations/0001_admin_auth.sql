PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
    full_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'staff'
        CHECK (account_type IN ('master_admin', 'staff')),
    is_active INTEGER NOT NULL DEFAULT 1
        CHECK (is_active IN (0, 1)),
    created_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permission_catalog (
    permission_key TEXT PRIMARY KEY,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS staff_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name TEXT NOT NULL COLLATE NOCASE UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL REFERENCES staff_roles(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL
        REFERENCES permission_catalog(permission_key) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_key)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES staff_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS user_permissions (
    user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL
        REFERENCES permission_catalog(permission_key) ON DELETE CASCADE,
    allowed INTEGER NOT NULL CHECK (allowed IN (0, 1)),
    PRIMARY KEY (user_id, permission_key)
);

CREATE TABLE IF NOT EXISTS admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details_json TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user
    ON admin_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry
    ON admin_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
    ON audit_logs(actor_user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created
    ON audit_logs(created_at);

INSERT OR IGNORE INTO permission_catalog (permission_key, description) VALUES
('content.view', 'View website content'),
('content.edit', 'Create and edit website content'),
('portfolio.manage', 'Manage portfolio projects and client brands'),
('services.manage', 'Manage agency services'),
('contact.manage', 'Manage public contact and social links'),
('staff.view', 'View staff accounts'),
('staff.manage', 'Create, update, deactivate, and delete staff accounts'),
('permissions.manage', 'Assign and revoke staff permissions and roles'),
('audit.view', 'View administrative audit logs');

INSERT OR IGNORE INTO staff_roles (role_name, description) VALUES
('Content Editor', 'Can view and edit website content'),
('Portfolio Manager', 'Can manage portfolio projects and client brands'),
('Viewer', 'Can view website content without editing');

INSERT OR IGNORE INTO role_permissions (role_id, permission_key)
SELECT r.id, p.permission_key
FROM staff_roles r
JOIN permission_catalog p
WHERE r.role_name = 'Content Editor'
  AND p.permission_key IN ('content.view', 'content.edit');

INSERT OR IGNORE INTO role_permissions (role_id, permission_key)
SELECT r.id, p.permission_key
FROM staff_roles r
JOIN permission_catalog p
WHERE r.role_name = 'Portfolio Manager'
  AND p.permission_key IN ('content.view', 'portfolio.manage');

INSERT OR IGNORE INTO role_permissions (role_id, permission_key)
SELECT r.id, p.permission_key
FROM staff_roles r
JOIN permission_catalog p
WHERE r.role_name = 'Viewer'
  AND p.permission_key = 'content.view';
