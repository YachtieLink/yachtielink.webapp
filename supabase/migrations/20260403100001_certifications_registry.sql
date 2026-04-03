-- Certifications Registry — canonical maritime cert database with fuzzy matching
-- pg_trgm already enabled in 20260313000001_extensions.sql

CREATE TABLE public.certifications_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  abbreviation TEXT,
  aliases TEXT[] DEFAULT '{}',
  category TEXT NOT NULL CHECK (category IN ('safety', 'medical', 'navigation', 'engineering', 'hospitality', 'deck', 'professional', 'watersports', 'other')),
  issuing_authority TEXT NOT NULL,
  equivalence_note TEXT,
  typical_validity_years INT,
  description TEXT,
  crew_count INT DEFAULT 0,
  source TEXT DEFAULT 'seed' CHECK (source IN ('seed', 'crowdsourced', 'admin')),
  review_status TEXT DEFAULT 'approved' CHECK (review_status IN ('approved', 'pending')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_cert_registry_name_trgm ON public.certifications_registry USING gin (name gin_trgm_ops);
CREATE INDEX idx_cert_registry_abbrev_trgm ON public.certifications_registry USING gin (abbreviation gin_trgm_ops);
CREATE INDEX idx_cert_registry_category ON public.certifications_registry(category);
CREATE INDEX idx_cert_registry_authority ON public.certifications_registry(issuing_authority);

-- RLS: public read (approved only), authenticated insert for crowdsourced
ALTER TABLE public.certifications_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certifications_registry: public read"
  ON public.certifications_registry FOR SELECT USING (review_status = 'approved');

-- Search RPC — fuzzy match against name, abbreviation, and aliases
CREATE OR REPLACE FUNCTION search_certifications(query TEXT, lim INT DEFAULT 5)
RETURNS TABLE (
  id UUID, name TEXT, abbreviation TEXT, category TEXT,
  issuing_authority TEXT, equivalence_note TEXT,
  typical_validity_years INT,
  crew_count INT, similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cr.id, cr.name, cr.abbreviation, cr.category,
    cr.issuing_authority, cr.equivalence_note,
    cr.typical_validity_years,
    cr.crew_count,
    GREATEST(
      similarity(cr.name, query),
      similarity(COALESCE(cr.abbreviation, ''), query),
      COALESCE((SELECT MAX(similarity(alias, query)) FROM unnest(cr.aliases) AS alias), 0)
    ) AS similarity
  FROM public.certifications_registry cr
  WHERE cr.review_status = 'approved'
    AND (
      cr.name % query
      OR COALESCE(cr.abbreviation, '') % query
      OR EXISTS (SELECT 1 FROM unnest(cr.aliases) AS alias WHERE alias % query)
    )
  ORDER BY similarity DESC
  LIMIT lim;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed data: ~60 maritime certifications
-- Each issuing authority gets a separate row (no cross-authority aliases)

-- === SAFETY (STCW) ===
INSERT INTO certifications_registry (name, abbreviation, category, issuing_authority, typical_validity_years) VALUES
('Basic Safety Training', 'BST', 'safety', 'MCA', 5),
('Basic Safety Training', 'BST', 'safety', 'AMSA', 5),
('Basic Safety Training', 'BST', 'safety', 'USCG', 5),
('Personal Survival Techniques', 'PST', 'safety', 'MCA', 5),
('Fire Prevention and Fire Fighting', 'FPFF', 'safety', 'MCA', 5),
('Personal Safety and Social Responsibilities', 'PSSR', 'safety', 'MCA', NULL),
('Elementary First Aid', 'EFA', 'safety', 'MCA', NULL),
('Proficiency in Survival Craft', 'PSC', 'safety', 'MCA', 5),
('Advanced Fire Fighting', 'AFF', 'safety', 'MCA', 5),
('Medical First Aid', 'MFA', 'safety', 'MCA', 5),
('Medical Care', NULL, 'safety', 'MCA', 5),
('Security Awareness Training', 'SAT', 'safety', 'MCA', NULL),
('Crowd Management Training', NULL, 'safety', 'MCA', NULL),
('STCW Refresher Course', NULL, 'safety', 'MCA', 5),
('STCW Refresher Course', NULL, 'safety', 'AMSA', 5);

-- === MEDICAL ===
INSERT INTO certifications_registry (name, abbreviation, category, issuing_authority, typical_validity_years, equivalence_note) VALUES
('ENG1 Medical Certificate', 'ENG1', 'medical', 'MCA', 2, NULL),
('ML5 Medical Certificate', 'ML5', 'medical', 'MCA', 5, NULL),
('Maritime Medical Certificate', NULL, 'medical', 'AMSA', 2, 'Commonly accepted as ENG1 equivalent'),
('USCG Medical Certificate', NULL, 'medical', 'USCG', 2, 'Commonly accepted as ENG1 equivalent'),
('Maritime New Zealand Medical', NULL, 'medical', 'MNZ', 2, 'Commonly accepted as ENG1 equivalent');

-- === NAVIGATION / DECK ===
INSERT INTO certifications_registry (name, abbreviation, category, issuing_authority, typical_validity_years) VALUES
('Yachtmaster Offshore', 'YM Offshore', 'navigation', 'RYA', NULL),
('Yachtmaster Ocean', 'YM Ocean', 'navigation', 'RYA', NULL),
('Yachtmaster Coastal', 'YM Coastal', 'navigation', 'RYA', NULL),
('Day Skipper', NULL, 'navigation', 'RYA', NULL),
('Powerboat Level 2', 'PB2', 'navigation', 'RYA', NULL),
('International Certificate of Competence', 'ICC', 'navigation', 'RYA', NULL);

INSERT INTO certifications_registry (name, abbreviation, category, issuing_authority, typical_validity_years) VALUES
('Master 200gt', NULL, 'deck', 'MCA', 5),
('Master 500gt', NULL, 'deck', 'MCA', 5),
('Master 3000gt', NULL, 'deck', 'MCA', 5),
('Chief Mate Unlimited', NULL, 'deck', 'MCA', 5),
('Officer of the Watch', 'OOW', 'deck', 'MCA', 5),
('HELM Operational', 'HELM-O', 'deck', 'MCA', NULL),
('HELM Management', 'HELM-M', 'deck', 'MCA', NULL),
('Master 200gt', NULL, 'deck', 'AMSA', 5),
('Master 500gt', NULL, 'deck', 'AMSA', 5);

-- === ENGINEERING ===
INSERT INTO certifications_registry (name, abbreviation, category, issuing_authority, typical_validity_years) VALUES
('Approved Engine Course', 'AEC', 'engineering', 'MCA', NULL),
('Y4 Engineer', 'Y4', 'engineering', 'MCA', 5),
('Y3 Engineer', 'Y3', 'engineering', 'MCA', 5),
('Marine Engine Operator Licence', 'MEOL', 'engineering', 'AMSA', 5),
('Engineering Watch Rating', 'EWR', 'engineering', 'MCA', NULL);

-- === HOSPITALITY ===
INSERT INTO certifications_registry (name, abbreviation, category, issuing_authority, typical_validity_years) VALUES
('Level 2 Food Safety', NULL, 'hospitality', 'CIEH', 3),
('Level 3 Food Safety', NULL, 'hospitality', 'CIEH', 3),
('WSET Level 1 Award in Wines', 'WSET 1', 'hospitality', 'WSET', NULL),
('WSET Level 2 Award in Wines', 'WSET 2', 'hospitality', 'WSET', NULL),
('WSET Level 3 Award in Wines', 'WSET 3', 'hospitality', 'WSET', NULL),
('Ship''s Cook Certificate', NULL, 'hospitality', 'MCA', NULL),
('Certificate III in Commercial Cookery', NULL, 'hospitality', 'ASQA', NULL);

-- === PROFESSIONAL ===
INSERT INTO certifications_registry (name, abbreviation, category, issuing_authority, typical_validity_years) VALUES
('PYA Introduction Course', NULL, 'professional', 'PYA', NULL),
('PYA Interior Course', NULL, 'professional', 'PYA', NULL),
('PYA Deck Course', NULL, 'professional', 'PYA', NULL),
('ISM Familiarization', NULL, 'professional', 'MCA', NULL),
('ISPS Ship Security Officer', 'SSO', 'professional', 'MCA', 5);

-- === WATERSPORTS ===
INSERT INTO certifications_registry (name, abbreviation, category, issuing_authority, typical_validity_years) VALUES
('PADI Open Water Diver', 'PADI OW', 'watersports', 'PADI', NULL),
('PADI Advanced Open Water', 'PADI AOW', 'watersports', 'PADI', NULL),
('PADI Rescue Diver', NULL, 'watersports', 'PADI', NULL),
('PADI Divemaster', 'PADI DM', 'watersports', 'PADI', NULL),
('PADI Open Water Instructor', 'PADI OWSI', 'watersports', 'PADI', NULL),
('RYA Personal Watercraft Instructor', 'RYA Jetski', 'watersports', 'RYA', NULL),
('RYA Dinghy Instructor', NULL, 'watersports', 'RYA', NULL),
('RYA Windsurf Instructor', NULL, 'watersports', 'RYA', NULL),
('Kitesurfing Instructor', NULL, 'watersports', 'IKO', NULL),
('Waterski Instructor', NULL, 'watersports', 'BWSW', NULL);
