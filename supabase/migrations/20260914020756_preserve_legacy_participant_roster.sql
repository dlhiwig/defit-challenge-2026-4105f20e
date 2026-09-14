-- Preserve the existing private roster (2,340 source records).
-- CREATE IF NOT EXISTS so a later db push cannot clobber the live table.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.participant_imports (
  source_sha256 text PRIMARY KEY CHECK (source_sha256 ~ '^[0-9a-f]{64}$'),
  source_filename text NOT NULL,
  expected_rows integer NOT NULL CHECK (expected_rows > 0),
  imported_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);

CREATE TABLE IF NOT EXISTS private.legacy_participants (
  source_sha256 text NOT NULL REFERENCES private.participant_imports(source_sha256),
  source_id text NOT NULL,
  source_row integer NOT NULL,
  full_name text NOT NULL,
  email_original text NOT NULL,
  email_normalized text NOT NULL,
  email_flag text,
  source_record jsonb NOT NULL,
  auth_user_id uuid UNIQUE REFERENCES auth.users(id),
  PRIMARY KEY (source_sha256, source_id),
  UNIQUE (source_sha256, source_row)
);

ALTER TABLE private.participant_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.legacy_participants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.participant_imports, private.legacy_participants FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT ALL ON private.participant_imports, private.legacy_participants TO service_role;

COMMENT ON TABLE private.legacy_participants IS
  'Preserved roster source records. No public access, automatic invitations, or inferred workout totals.';
