-- QA only until explicit production migration approval.
CREATE TABLE tb_baseline_roster_details (
 participant_id TEXT PRIMARY KEY REFERENCES tb_baseline_participants(participant_id),
 metadata_json TEXT NOT NULL CHECK(json_valid(metadata_json)), updated_at TEXT NOT NULL
);
CREATE TABLE tb_baseline_dashboard_shares (
 share_id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL REFERENCES tb_baseline_campaigns(campaign_id),
 label TEXT NOT NULL, scope_json TEXT NOT NULL CHECK(json_valid(scope_json)), token_hash TEXT NOT NULL UNIQUE,
 expires_at TEXT NOT NULL, revoked_at TEXT, created_at TEXT NOT NULL
);
CREATE INDEX tb_baseline_dashboard_shares_campaign ON tb_baseline_dashboard_shares(campaign_id);
