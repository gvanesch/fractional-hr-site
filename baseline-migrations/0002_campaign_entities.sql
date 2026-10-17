-- QA-only until separately approved for production. Existing campaigns/answers remain intact.
ALTER TABLE tb_baseline_campaigns ADD COLUMN entities_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(entities_json));
