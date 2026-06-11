-- ============================================================
-- Інформаційна система автоматизації документообігу та
-- координації проєктів студентських організацій
-- Схема бази даних (PostgreSQL)
-- ============================================================

DROP TABLE IF EXISTS organization_invites CASCADE;
DROP TABLE IF EXISTS user_deletion_requests CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS document_templates CASCADE;
DROP TABLE IF EXISTS document_approvals CASCADE;
DROP TABLE IF EXISTS document_history CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS task_priority CASCADE;
DROP TYPE IF EXISTS document_status CASCADE;
DROP TYPE IF EXISTS approval_decision CASCADE;
DROP TYPE IF EXISTS deletion_request_status CASCADE;

-- ----------------------- Типи (enum) -----------------------
CREATE TYPE user_role        AS ENUM ('admin', 'head', 'member');
CREATE TYPE project_status    AS ENUM ('planned', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE task_status       AS ENUM ('todo', 'in_progress', 'review', 'done');
CREATE TYPE task_priority     AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE document_status   AS ENUM ('draft', 'on_review', 'approved', 'rejected');
CREATE TYPE approval_decision AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE deletion_request_status AS ENUM ('pending', 'approved', 'rejected');

-- ----------------------- Організації -----------------------
CREATE TABLE organizations (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------- Користувачі -----------------------
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'member',
    organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
    -- Засоби комунікації (заповнюються опціонально в особистому профілі)
    telegram        VARCHAR(100),
    discord         VARCHAR(100),
    phone           VARCHAR(30),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------- Проєкти ---------------------------
CREATE TABLE projects (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    status          project_status NOT NULL DEFAULT 'planned',
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    owner_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
    start_date      DATE,
    end_date        DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------- Членство в проєктах -------------------
-- багато-до-багатьох: користувачі <-> проєкти
CREATE TABLE memberships (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role_label VARCHAR(60) DEFAULT 'учасник',
    UNIQUE (user_id, project_id)
);

-- ----------------------- Задачі ----------------------------
CREATE TABLE tasks (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    status      task_status NOT NULL DEFAULT 'todo',
    priority    task_priority NOT NULL DEFAULT 'medium',
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    due_date    DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------- Документи -------------------------
CREATE TABLE documents (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    doc_type    VARCHAR(80) NOT NULL DEFAULT 'загальний',
    content     TEXT,
    status      document_status NOT NULL DEFAULT 'draft',
    project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    author_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------- Маршрут узгодження документів -----------------
-- послідовність погоджувачів для документа
CREATE TABLE document_approvals (
    id             SERIAL PRIMARY KEY,
    document_id    INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    approver_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delegated_from INTEGER REFERENCES users(id) ON DELETE SET NULL, -- хто делегував крок
    step_order     INTEGER NOT NULL DEFAULT 1,
    decision       approval_decision NOT NULL DEFAULT 'pending',
    comment        TEXT,
    decided_at     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------- Шаблони документів --------------------------
CREATE TABLE document_templates (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    doc_type    VARCHAR(80) NOT NULL DEFAULT 'загальний',
    content     TEXT,
    created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------- Прикріплені файли ---------------------------
CREATE TABLE attachments (
    id            SERIAL PRIMARY KEY,
    document_id   INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    filename      VARCHAR(255) NOT NULL,   -- ім'я на диску
    original_name VARCHAR(255) NOT NULL,   -- оригінальна назва
    mime_type     VARCHAR(120),
    size_bytes    INTEGER,
    uploaded_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------- Сповіщення (in-app) -------------------------
CREATE TABLE notifications (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(60) NOT NULL DEFAULT 'info',
    message     TEXT NOT NULL,
    link        VARCHAR(255),
    is_read     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------- Журнал активності ---------------------------
CREATE TABLE activity_log (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(40) NOT NULL,   -- document | project | task | organization
    entity_id   INTEGER,
    action      VARCHAR(80) NOT NULL,
    summary     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------- Історія змін документів --------------------
CREATE TABLE document_history (
    id          SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(120) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------- Коментарі -------------------------
CREATE TABLE comments (
    id          SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    task_id     INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    author_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------- Запити на видалення користувачів -----------------
-- керівник створює запит, адміністратор підтверджує або відхиляє
CREATE TABLE user_deletion_requests (
    id              SERIAL PRIMARY KEY,
    target_user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason          TEXT,
    status          deletion_request_status NOT NULL DEFAULT 'pending',
    reviewed_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------- Запрошення до організацій (одноразові) -------------
-- хед організації або адміністратор створює тимчасове посилання;
-- після першого використання запрошення стає недійсним
CREATE TABLE organization_invites (
    id              SERIAL PRIMARY KEY,
    token           VARCHAR(64) NOT NULL UNIQUE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role            user_role NOT NULL DEFAULT 'member',
    created_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    used_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------- Індекси ---------------------------
CREATE INDEX idx_users_org        ON users(organization_id);
CREATE INDEX idx_projects_org     ON projects(organization_id);
CREATE INDEX idx_tasks_project    ON tasks(project_id);
CREATE INDEX idx_tasks_assignee   ON tasks(assignee_id);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_approvals_doc    ON document_approvals(document_id);
CREATE INDEX idx_approvals_user   ON document_approvals(approver_id);
CREATE INDEX idx_attachments_doc  ON attachments(document_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX idx_deletion_req_status ON user_deletion_requests(status);
CREATE INDEX idx_org_invites_token  ON organization_invites(token);
