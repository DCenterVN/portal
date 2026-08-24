CREATE TABLE IF NOT EXISTS api_audit_logs (
    id uuid PRIMARY KEY,
    actor_id text NOT NULL,
    actor_login text NOT NULL,
    environment text NOT NULL,
    operation_id text NOT NULL,
    service text NOT NULL,
    method text NOT NULL,
    path_template text NOT NULL,
    request_id uuid NOT NULL,
    idempotency_key text,
    reason text NOT NULL DEFAULT '',
    outcome text NOT NULL,
    http_status integer NOT NULL,
    duration_ms integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (environment IN ('dev', 'staging', 'production')),
    CHECK (outcome IN ('ALLOW', 'DENY', 'ERROR'))
);

CREATE INDEX IF NOT EXISTS idx_api_audit_logs_created_at
    ON api_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_audit_logs_actor
    ON api_audit_logs (actor_login, created_at DESC);
