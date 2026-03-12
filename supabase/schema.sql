-- ============================================================
-- ACOGEMA - Water Management System
-- Supabase Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- AGENCIES TABLE
-- ============================================================
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FOKONTANY / ZONES TABLE
-- ============================================================
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, code)
);

-- ============================================================
-- CLIENT CATEGORIES
-- ============================================================
CREATE TYPE client_category AS ENUM ('BP', 'BF', 'COMMERCIAL', 'INDUSTRIEL');

-- ============================================================
-- CLIENTS TABLE
-- ============================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  numero INTEGER NOT NULL,
  nom_prenom VARCHAR(255) NOT NULL,
  adresse TEXT,
  fokontany VARCHAR(255),
  categorie client_category DEFAULT 'BP',
  ref_client VARCHAR(100) UNIQUE,
  code_client VARCHAR(100) UNIQUE,
  ref_compteur VARCHAR(100),
  date_branchement DATE,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TARIFFS TABLE
-- ============================================================
CREATE TABLE tariffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  prix_unitaire DECIMAL(10,2) NOT NULL DEFAULT 1400,
  seuil_surconsommation DECIMAL(10,3) DEFAULT 10,
  taux_surconsommation DECIMAL(5,4) DEFAULT 0.20,
  taux_redevance_renouvellement DECIMAL(5,4) DEFAULT 0.02,
  taux_assainissement DECIMAL(5,4) DEFAULT 0.02,
  taux_branchement_social DECIMAL(5,4) DEFAULT 0.02,
  taux_taxe_communale DECIMAL(5,4) DEFAULT 0.02,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tariff
INSERT INTO tariffs (name, prix_unitaire) VALUES ('Tarif Standard Beforona BP', 1400);

-- ============================================================
-- RELEVÉS (METER READINGS) TABLE
-- ============================================================
CREATE TABLE releves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  annee INTEGER NOT NULL,
  mois INTEGER NOT NULL CHECK (mois BETWEEN 1 AND 12),
  ancien_index DECIMAL(12,3),
  nouvel_index DECIMAL(12,3),
  consommation DECIMAL(12,3) GENERATED ALWAYS AS (
    CASE WHEN nouvel_index IS NOT NULL AND ancien_index IS NOT NULL 
    THEN nouvel_index - ancien_index 
    ELSE NULL END
  ) STORED,
  date_releve DATE,
  date_limite_paiement DATE,
  observation TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, annee, mois)
);

-- ============================================================
-- FACTURES (INVOICES) TABLE
-- ============================================================
CREATE TABLE factures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  releve_id UUID REFERENCES releves(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  numero_facture VARCHAR(50) UNIQUE NOT NULL,
  annee INTEGER NOT NULL,
  mois INTEGER NOT NULL,
  tariff_id UUID REFERENCES tariffs(id),
  
  -- Consumption data
  consommation_m3 DECIMAL(12,3) NOT NULL DEFAULT 0,
  prix_unitaire DECIMAL(10,2) NOT NULL DEFAULT 1400,
  
  -- Calculated amounts
  montant_ht DECIMAL(12,2) GENERATED ALWAYS AS (consommation_m3 * prix_unitaire) STORED,
  redevance_renouvellement DECIMAL(12,2),
  redevance_assainissement DECIMAL(12,2),
  redevance_branchement DECIMAL(12,2),
  taxe_communale DECIMAL(12,2),
  surconsommation DECIMAL(12,2) DEFAULT 0,
  montant_ttc DECIMAL(12,2),
  
  -- Payment
  montant_paye DECIMAL(12,2) DEFAULT 0,
  date_paiement TIMESTAMPTZ,
  statut VARCHAR(20) DEFAULT 'IMPAYEE' CHECK (statut IN ('IMPAYEE', 'PAYEE', 'PARTIELLE', 'ANNULEE')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAIEMENTS TABLE
-- ============================================================
CREATE TABLE paiements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id UUID REFERENCES factures(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  montant DECIMAL(12,2) NOT NULL,
  date_paiement TIMESTAMPTZ DEFAULT NOW(),
  mode_paiement VARCHAR(50) DEFAULT 'ESPECES',
  reference_paiement VARCHAR(100),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS TABLE (profiles linked to Supabase Auth)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  nom_prenom VARCHAR(255),
  role VARCHAR(20) DEFAULT 'AGENT' CHECK (role IN ('ADMIN', 'AGENT', 'LECTEUR')),
  agency_id UUID REFERENCES agencies(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VIEWS
-- ============================================================

-- View: Tableau récapitulatif consommations
CREATE OR REPLACE VIEW v_recap_consommations AS
SELECT 
  c.id as client_id,
  c.numero,
  c.nom_prenom,
  c.categorie,
  c.fokontany,
  z.name as zone_name,
  a.name as agency_name,
  r.annee,
  r.mois,
  r.ancien_index,
  r.nouvel_index,
  r.consommation,
  f.numero_facture,
  f.montant_ttc,
  f.montant_paye,
  f.statut,
  f.date_paiement
FROM clients c
LEFT JOIN zones z ON c.zone_id = z.id
LEFT JOIN agencies a ON c.agency_id = a.id
LEFT JOIN releves r ON c.id = r.client_id
LEFT JOIN factures f ON r.id = f.releve_id
ORDER BY r.annee DESC, r.mois DESC, c.numero;

-- View: Tableau annuel des relevés par client
CREATE OR REPLACE VIEW v_releves_annuels AS
SELECT 
  c.id as client_id,
  c.numero,
  c.nom_prenom,
  c.ref_compteur,
  r.annee,
  MAX(CASE WHEN r.mois = 1 THEN r.nouvel_index END) AS janvier,
  MAX(CASE WHEN r.mois = 2 THEN r.nouvel_index END) AS fevrier,
  MAX(CASE WHEN r.mois = 3 THEN r.nouvel_index END) AS mars,
  MAX(CASE WHEN r.mois = 4 THEN r.nouvel_index END) AS avril,
  MAX(CASE WHEN r.mois = 5 THEN r.nouvel_index END) AS mai,
  MAX(CASE WHEN r.mois = 6 THEN r.nouvel_index END) AS juin,
  MAX(CASE WHEN r.mois = 7 THEN r.nouvel_index END) AS juillet,
  MAX(CASE WHEN r.mois = 8 THEN r.nouvel_index END) AS aout,
  MAX(CASE WHEN r.mois = 9 THEN r.nouvel_index END) AS septembre,
  MAX(CASE WHEN r.mois = 10 THEN r.nouvel_index END) AS octobre,
  MAX(CASE WHEN r.mois = 11 THEN r.nouvel_index END) AS novembre,
  MAX(CASE WHEN r.mois = 12 THEN r.nouvel_index END) AS decembre
FROM clients c
LEFT JOIN releves r ON c.id = r.client_id
GROUP BY c.id, c.numero, c.nom_prenom, c.ref_compteur, r.annee
ORDER BY c.numero, r.annee;

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE releves ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariffs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all
CREATE POLICY "Authenticated can read agencies" ON agencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read zones" ON zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read releves" ON releves FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read factures" ON factures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read paiements" ON paiements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read tariffs" ON tariffs FOR SELECT TO authenticated USING (true);

-- Agents and admins can insert/update
CREATE POLICY "Agents can manage clients" ON clients FOR ALL TO authenticated USING (true);
CREATE POLICY "Agents can manage releves" ON releves FOR ALL TO authenticated USING (true);
CREATE POLICY "Agents can manage factures" ON factures FOR ALL TO authenticated USING (true);
CREATE POLICY "Agents can manage paiements" ON paiements FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage agencies" ON agencies FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage zones" ON zones FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage own profile" ON profiles FOR ALL TO authenticated USING (auth.uid() = id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function: Calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_facture(
  p_consommation DECIMAL,
  p_prix_unitaire DECIMAL DEFAULT 1400,
  p_seuil DECIMAL DEFAULT 10,
  p_taux_surconso DECIMAL DEFAULT 0.20,
  p_taux_redevances DECIMAL DEFAULT 0.08
) RETURNS TABLE (
  montant_ht DECIMAL,
  redevances DECIMAL,
  surconsommation DECIMAL,
  montant_ttc DECIMAL
) LANGUAGE plpgsql AS $$
DECLARE
  v_ht DECIMAL;
  v_surco DECIMAL;
  v_redvances DECIMAL;
BEGIN
  v_ht := p_consommation * p_prix_unitaire;
  v_redvances := v_ht * p_taux_redevances;
  
  IF p_consommation > p_seuil THEN
    v_surco := (p_consommation - p_seuil) * p_prix_unitaire * p_taux_surconso;
  ELSE
    v_surco := 0;
  END IF;
  
  RETURN QUERY SELECT 
    v_ht,
    v_redvances,
    v_surco,
    v_ht + v_redvances + v_surco;
END;
$$;

-- Function: Auto-generate facture number
CREATE OR REPLACE FUNCTION generate_facture_number(p_annee INT, p_mois INT, p_client_numero INT)
RETURNS VARCHAR AS $$
BEGIN
  RETURN LPAD(p_client_numero::TEXT, 2, '0') || '/' || p_annee;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_releves_updated_at BEFORE UPDATE ON releves FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_factures_updated_at BEFORE UPDATE ON factures FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO agencies (name, code, phone, email, address) VALUES 
('ACOGEMA Beforona', 'BEFORONA', '038 10 457 38', 'rehasajp@yahoo.com', 'Beforona, Madagascar');

INSERT INTO zones (agency_id, name, code) VALUES 
((SELECT id FROM agencies WHERE code = 'BEFORONA'), 'Secteur Madiorano', 'MDR');

-- Default clients from ETAPE_1
INSERT INTO clients (agency_id, zone_id, numero, nom_prenom, fokontany, categorie, ref_client, code_client, ref_compteur) VALUES 
(
  (SELECT id FROM agencies WHERE code = 'BEFORONA'),
  (SELECT id FROM zones WHERE code = 'MDR'),
  1, 'BOTOLAHADY Remi', 'Fiherenana', 'BP',
  '2019/08/21/MDR/3', '3/MDR/BP', '012 689 23'
),
(
  (SELECT id FROM agencies WHERE code = 'BEFORONA'),
  (SELECT id FROM zones WHERE code = 'MDR'),
  2, 'BOTOVELOSINGOTRA', 'Fiherenana', 'BP',
  '2019/10/17/MDR/4', '4/MDR/BP', '012 720 56'
),
(
  (SELECT id FROM agencies WHERE code = 'BEFORONA'),
  (SELECT id FROM zones WHERE code = 'MDR'),
  3, 'JERIVAVY Rosaline', 'Fiherenana', 'BP',
  NULL, NULL, NULL
),
(
  (SELECT id FROM agencies WHERE code = 'BEFORONA'),
  (SELECT id FROM zones WHERE code = 'MDR'),
  4, 'RAMANANTENASOA Angeline', 'Fiherenana', 'BP',
  NULL, NULL, NULL
);
