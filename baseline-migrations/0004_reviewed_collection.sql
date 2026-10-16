-- Reviewed broad collection and verification. QA only until explicit production approval.
CREATE TABLE tb_baseline_broad_work (
 participant_id TEXT NOT NULL REFERENCES tb_baseline_responses(participant_id),
 area_code TEXT NOT NULL, label TEXT NOT NULL,
 percentage REAL CHECK(percentage BETWEEN 0 AND 100),
 detail_json TEXT NOT NULL CHECK(json_valid(detail_json)),
 PRIMARY KEY(participant_id,area_code)
);
CREATE TABLE tb_baseline_verifications (
 challenge_id TEXT PRIMARY KEY, invite_id TEXT NOT NULL REFERENCES tb_baseline_invites(invite_id),
 code_hash TEXT NOT NULL, expires_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
 consumed_at TEXT, created_at TEXT NOT NULL
);
CREATE INDEX tb_baseline_verifications_invite ON tb_baseline_verifications(invite_id,expires_at);
CREATE TABLE tb_baseline_qa_mail_tests (
 kind TEXT PRIMARY KEY CHECK(kind IN ('invite','code')), email TEXT NOT NULL CHECK(email='greg@vanesch.uk'),
 status TEXT NOT NULL CHECK(status IN ('reserved','sent','failed')), provider_id TEXT, updated_at TEXT NOT NULL
);
CREATE TABLE tb_baseline_answer_copies (
 participant_id TEXT PRIMARY KEY REFERENCES tb_baseline_responses(participant_id),
 version TEXT NOT NULL, recipient_email TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('preview','pending','delivering','sent','failed')),
 attempts INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
);
CREATE TABLE tb_baseline_collection_context (
 participant_id TEXT PRIMARY KEY REFERENCES tb_baseline_responses(participant_id),
 manager_json TEXT NOT NULL CHECK(json_valid(manager_json)), created_at TEXT NOT NULL
);
