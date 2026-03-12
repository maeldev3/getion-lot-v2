-- =============================================
-- ACOGEMA ERP — Schéma Supabase complet
-- Exécuter dans Supabase SQL Editor
-- =============================================

-- ─── EXTENSIONS ─────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUMS ───────────────────────────────────
CREATE TYPE user_role AS ENUM ('super_admin', 'directeur', 'comptable', 'agent_terrain');
CREATE TYPE categorie_client AS ENUM ('BP', 'HP');
CREATE TYPE statut_paiement AS ENUM ('non_facture', 'en_attente', 'paye', 'retard', 'annule');
CREATE TYPE statut_releve AS ENUM ('saisi', 'valide', 'facture', 'manquant');

-- ─── TABLE: agences ──────────────────────────
CREATE TABLE agences (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom         TEXT NOT NULL,
  code        TEXT UNIQUE NOT NULL,
  telephone   TEXT,
  email       TEXT,
  adresse     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO agences (nom, code, telephone, email, adresse)
VALUES ('Agence BEFORONA', 'BFR', '038 10 457 38', 'rehasajp@yahoo.com', 'BEFORONA');

-- ─── TABLE: profiles (extension auth.users) ──
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'agent_terrain',
  agence_id   UUID REFERENCES agences(id),
  telephone   TEXT,
  avatar_url  TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLE: zones ────────────────────────────
CREATE TABLE zones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agence_id   UUID NOT NULL REFERENCES agences(id),
  nom         TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO zones (agence_id, nom, description)
SELECT id, 'Madiorano', 'Secteur Madiorano - Fokontany Fiherenana'
FROM agences WHERE code = 'BFR';

-- ─── TABLE: clients ──────────────────────────
CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agence_id       UUID NOT NULL REFERENCES agences(id),
  zone_id         UUID REFERENCES zones(id),
  numero          SERIAL,
  nom_prenom      TEXT NOT NULL,
  ref_client      TEXT UNIQUE,           -- ex: 2019/08/21/MDR/3
  code_client     TEXT UNIQUE,           -- ex: 3/MDR/BP
  ref_compteur    TEXT NOT NULL UNIQUE,  -- ex: 012 689 23
  adresse         TEXT,
  fokontany       TEXT,
  categorie       categorie_client NOT NULL DEFAULT 'BP',
  telephone       TEXT,
  email           TEXT,
  index_initial   NUMERIC(10,3) DEFAULT 0,
  date_branchement DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  observations    TEXT,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Données initiales
INSERT INTO clients (agence_id, zone_id, nom_prenom, ref_client, code_client, ref_compteur, adresse, fokontany, categorie, index_initial, date_branchement)
SELECT
  a.id, z.id,
  'BOTOLAHADY Remi', '2019/08/21/MDR/3', '3/MDR/BP', '012 689 23',
  'MADIORANO', 'Fiherenana', 'BP', 94.022, '2019-08-21'
FROM agences a, zones z WHERE a.code = 'BFR' AND z.nom = 'Madiorano';

INSERT INTO clients (agence_id, zone_id, nom_prenom, ref_client, code_client, ref_compteur, adresse, fokontany, categorie, index_initial, date_branchement)
SELECT
  a.id, z.id,
  'BOTOVELOSINGOTRA', '2019/10/17/MDR/4', '4/MDR/BP', '012 720 56',
  'MADIORANO', 'Fiherenana', 'BP', 579, '2019-10-17'
FROM agences a, zones z WHERE a.code = 'BFR' AND z.nom = 'Madiorano';

INSERT INTO clients (agence_id, zone_id, nom_prenom, ref_client, code_client, ref_compteur, adresse, fokontany, categorie, index_initial, date_branchement)
SELECT
  a.id, z.id,
  'JERIVAVY Rosaline', '2020/03/01/MDR/7', '7/MDR/BP', '014 112 88',
  'MADIORANO', 'Fiherenana', 'BP', 0, '2020-03-01'
FROM agences a, zones z WHERE a.code = 'BFR' AND z.nom = 'Madiorano';

INSERT INTO clients (agence_id, zone_id, nom_prenom, ref_client, code_client, ref_compteur, adresse, fokontany, categorie, index_initial, date_branchement)
SELECT
  a.id, z.id,
  'RAMANANTENASOA Angeline', '2018/06/15/MDR/1', '1/MDR/BP', '009 445 21',
  'MADIORANO', 'Fiherenana', 'BP', 0, '2018-06-15'
FROM agences a, zones z WHERE a.code = 'BFR' AND z.nom = 'Madiorano';

-- ─── TABLE: tarifs ───────────────────────────
CREATE TABLE tarifs (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agence_id                   UUID NOT NULL REFERENCES agences(id),
  prix_unitaire               NUMERIC(10,2) NOT NULL DEFAULT 1400,    -- Ar/m³
  seuil_surconsommation       NUMERIC(6,3)  NOT NULL DEFAULT 10,      -- m³
  taux_surconsommation        NUMERIC(5,4)  NOT NULL DEFAULT 0.20,    -- 20%
  taux_renouvellement         NUMERIC(5,4)  NOT NULL DEFAULT 0.02,    -- 2%
  taux_assainissement         NUMERIC(5,4)  NOT NULL DEFAULT 0.02,    -- 2%
  taux_branchement_social     NUMERIC(5,4)  NOT NULL DEFAULT 0.02,    -- 2%
  taux_taxe_communale         NUMERIC(5,4)  NOT NULL DEFAULT 0.02,    -- 2%
  date_effet                  DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active                   BOOLEAN DEFAULT TRUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO tarifs (agence_id, prix_unitaire, seuil_surconsommation, taux_surconsommation,
  taux_renouvellement, taux_assainissement, taux_branchement_social, taux_taxe_communale)
SELECT id, 1400, 10, 0.20, 0.02, 0.02, 0.02, 0.02
FROM agences WHERE code = 'BFR';

-- ─── TABLE: releves ──────────────────────────
CREATE TABLE releves (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID NOT NULL REFERENCES clients(id),
  agence_id       UUID NOT NULL REFERENCES agences(id),
  annee           INT NOT NULL,
  mois            INT NOT NULL CHECK (mois BETWEEN 1 AND 12),
  ancien_index    NUMERIC(12,3) NOT NULL,
  nouvel_index    NUMERIC(12,3) NOT NULL,
  consommation    NUMERIC(10,3) GENERATED ALWAYS AS (nouvel_index - ancien_index) STORED,
  date_releve     DATE NOT NULL,
  statut          statut_releve NOT NULL DEFAULT 'saisi',
  observations    TEXT,
  saisi_par       UUID REFERENCES profiles(id),
  valide_par      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, annee, mois)
);

-- ─── TABLE: factures ─────────────────────────
CREATE TABLE factures (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_facture            TEXT UNIQUE NOT NULL,  -- ex: FAC-01/2026
  releve_id                 UUID NOT NULL REFERENCES releves(id),
  client_id                 UUID NOT NULL REFERENCES clients(id),
  agence_id                 UUID NOT NULL REFERENCES agences(id),
  tarif_id                  UUID NOT NULL REFERENCES tarifs(id),
  annee                     INT NOT NULL,
  mois                      INT NOT NULL CHECK (mois BETWEEN 1 AND 12),
  consommation_m3           NUMERIC(10,3) NOT NULL,
  montant_ht                NUMERIC(12,2) NOT NULL,  -- conso * prix_unitaire
  montant_renouvellement    NUMERIC(12,2) NOT NULL,
  montant_assainissement    NUMERIC(12,2) NOT NULL,
  montant_branchement       NUMERIC(12,2) NOT NULL,
  montant_taxe_communale    NUMERIC(12,2) NOT NULL,
  montant_surconsommation   NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_ttc                 NUMERIC(12,2) NOT NULL,
  statut_paiement           statut_paiement NOT NULL DEFAULT 'en_attente',
  date_emission             DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance             DATE,
  date_paiement             DATE,
  montant_paye              NUMERIC(12,2) DEFAULT 0,
  mode_paiement             TEXT,
  reference_paiement        TEXT,
  pdf_url                   TEXT,
  notes                     TEXT,
  cree_par                  UUID REFERENCES profiles(id),
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, annee, mois)
);

-- ─── TABLE: paiements ────────────────────────
CREATE TABLE paiements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id      UUID NOT NULL REFERENCES factures(id),
  client_id       UUID NOT NULL REFERENCES clients(id),
  agence_id       UUID NOT NULL REFERENCES agences(id),
  montant         NUMERIC(12,2) NOT NULL,
  mode_paiement   TEXT NOT NULL DEFAULT 'especes',
  reference       TEXT,
  date_paiement   DATE NOT NULL DEFAULT CURRENT_DATE,
  recu_numero     TEXT,
  notes           TEXT,
  encaisse_par    UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLE: audit_logs ───────────────────────
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id),
  agence_id   UUID REFERENCES agences(id),
  action      TEXT NOT NULL,       -- CREATE, UPDATE, DELETE, LOGIN, EXPORT
  table_name  TEXT,
  record_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FONCTIONS & TRIGGERS ────────────────────

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_releves_updated_at BEFORE UPDATE ON releves FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_factures_updated_at BEFORE UPDATE ON factures FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Génération automatique du numéro de facture
CREATE OR REPLACE FUNCTION generate_numero_facture(p_annee INT, p_agence_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INT;
  v_num   TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM factures
  WHERE annee = p_annee AND agence_id = p_agence_id;
  v_num := LPAD(v_count::TEXT, 2, '0') || '/' || p_annee;
  RETURN v_num;
END;
$$ LANGUAGE plpgsql;

-- Calcul automatique de la facture depuis le relevé
CREATE OR REPLACE FUNCTION calculer_facture(p_releve_id UUID)
RETURNS UUID AS $$
DECLARE
  v_releve   releves%ROWTYPE;
  v_client   clients%ROWTYPE;
  v_tarif    tarifs%ROWTYPE;
  v_ht       NUMERIC;
  v_renouv   NUMERIC;
  v_assain   NUMERIC;
  v_branch   NUMERIC;
  v_taxe     NUMERIC;
  v_surconso NUMERIC;
  v_total    NUMERIC;
  v_num_fac  TEXT;
  v_fac_id   UUID;
BEGIN
  SELECT * INTO v_releve FROM releves WHERE id = p_releve_id;
  SELECT * INTO v_client FROM clients WHERE id = v_releve.client_id;
  SELECT * INTO v_tarif  FROM tarifs  WHERE agence_id = v_client.agence_id AND is_active = TRUE LIMIT 1;

  -- Calculs conformes au modèle ETAPE_2
  v_ht      := v_releve.consommation * v_tarif.prix_unitaire;
  v_renouv  := v_ht * v_tarif.taux_renouvellement;
  v_assain  := v_ht * v_tarif.taux_assainissement;
  v_branch  := v_ht * v_tarif.taux_branchement_social;
  v_taxe    := v_ht * v_tarif.taux_taxe_communale;

  -- Sur-consommation si > seuil
  IF v_releve.consommation > v_tarif.seuil_surconsommation THEN
    v_surconso := (v_releve.consommation - v_tarif.seuil_surconsommation)
                  * v_tarif.prix_unitaire * v_tarif.taux_surconsommation;
  ELSE
    v_surconso := 0;
  END IF;

  v_total := v_ht + v_renouv + v_assain + v_branch + v_taxe + v_surconso;
  v_num_fac := generate_numero_facture(v_releve.annee, v_releve.agence_id);

  INSERT INTO factures (
    numero_facture, releve_id, client_id, agence_id, tarif_id,
    annee, mois, consommation_m3,
    montant_ht, montant_renouvellement, montant_assainissement,
    montant_branchement, montant_taxe_communale, montant_surconsommation,
    total_ttc, date_echeance
  ) VALUES (
    v_num_fac, p_releve_id, v_releve.client_id, v_releve.agence_id, v_tarif.id,
    v_releve.annee, v_releve.mois, v_releve.consommation,
    v_ht, v_renouv, v_assain, v_branch, v_taxe, v_surconso,
    v_total, CURRENT_DATE + INTERVAL '30 days'
  ) RETURNING id INTO v_fac_id;

  -- Marquer le relevé comme facturé
  UPDATE releves SET statut = 'facture' WHERE id = p_releve_id;

  RETURN v_fac_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── ROW LEVEL SECURITY (RLS) ────────────────

ALTER TABLE agences      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarifs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE releves      ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures     ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs   ENABLE ROW LEVEL SECURITY;

-- Fonction helper: agence de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_user_agence_id()
RETURNS UUID AS $$
  SELECT agence_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Fonction helper: rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- POLICIES: profiles
CREATE POLICY "users_see_own_profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "admins_see_all_profiles" ON profiles FOR SELECT USING (get_user_role() IN ('super_admin', 'directeur'));
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "admins_manage_profiles" ON profiles FOR ALL USING (get_user_role() = 'super_admin');

-- POLICIES: agences (super_admin only pour modification)
CREATE POLICY "all_read_own_agence" ON agences FOR SELECT USING (id = get_user_agence_id() OR get_user_role() = 'super_admin');
CREATE POLICY "super_admin_manage_agences" ON agences FOR ALL USING (get_user_role() = 'super_admin');

-- POLICIES: zones (par agence)
CREATE POLICY "read_own_agence_zones" ON zones FOR SELECT USING (agence_id = get_user_agence_id());
CREATE POLICY "admin_manage_zones" ON zones FOR ALL USING (get_user_role() IN ('super_admin', 'directeur'));

-- POLICIES: clients (par agence)
CREATE POLICY "read_own_agence_clients" ON clients FOR SELECT USING (agence_id = get_user_agence_id());
CREATE POLICY "agents_insert_clients" ON clients FOR INSERT WITH CHECK (agence_id = get_user_agence_id() AND get_user_role() IN ('super_admin', 'directeur', 'agent_terrain'));
CREATE POLICY "agents_update_clients" ON clients FOR UPDATE USING (agence_id = get_user_agence_id() AND get_user_role() IN ('super_admin', 'directeur'));
CREATE POLICY "admins_delete_clients" ON clients FOR DELETE USING (get_user_role() IN ('super_admin', 'directeur'));

-- POLICIES: tarifs
CREATE POLICY "read_own_agence_tarifs" ON tarifs FOR SELECT USING (agence_id = get_user_agence_id());
CREATE POLICY "super_admin_manage_tarifs" ON tarifs FOR ALL USING (get_user_role() = 'super_admin');

-- POLICIES: releves (saisie par agents)
CREATE POLICY "read_own_agence_releves" ON releves FOR SELECT USING (agence_id = get_user_agence_id());
CREATE POLICY "agents_insert_releves" ON releves FOR INSERT WITH CHECK (agence_id = get_user_agence_id() AND get_user_role() IN ('super_admin', 'directeur', 'agent_terrain'));
CREATE POLICY "agents_update_releves" ON releves FOR UPDATE USING (agence_id = get_user_agence_id() AND get_user_role() IN ('super_admin', 'directeur', 'agent_terrain'));
CREATE POLICY "admins_delete_releves" ON releves FOR DELETE USING (get_user_role() IN ('super_admin', 'directeur'));

-- POLICIES: factures
CREATE POLICY "read_own_agence_factures" ON factures FOR SELECT USING (agence_id = get_user_agence_id());
CREATE POLICY "comptables_insert_factures" ON factures FOR INSERT WITH CHECK (agence_id = get_user_agence_id() AND get_user_role() IN ('super_admin', 'directeur', 'comptable'));
CREATE POLICY "comptables_update_factures" ON factures FOR UPDATE USING (agence_id = get_user_agence_id() AND get_user_role() IN ('super_admin', 'directeur', 'comptable'));
CREATE POLICY "admins_delete_factures" ON factures FOR DELETE USING (get_user_role() IN ('super_admin'));

-- POLICIES: paiements
CREATE POLICY "read_own_agence_paiements" ON paiements FOR SELECT USING (agence_id = get_user_agence_id());
CREATE POLICY "comptables_insert_paiements" ON paiements FOR INSERT WITH CHECK (agence_id = get_user_agence_id() AND get_user_role() IN ('super_admin', 'directeur', 'comptable'));

-- POLICIES: audit_logs (lecture seule pour admins)
CREATE POLICY "admins_read_audit" ON audit_logs FOR SELECT USING (get_user_role() IN ('super_admin', 'directeur'));
CREATE POLICY "system_insert_audit" ON audit_logs FOR INSERT WITH CHECK (TRUE); -- via service_role uniquement

-- ─── VUE: récapitulatif mensuel (ETAPE_3) ────
CREATE VIEW vue_recapitulatif_mensuel AS
SELECT
  f.annee,
  f.mois,
  c.id AS client_id,
  c.nom_prenom,
  c.ref_client,
  c.ref_compteur,
  c.fokontany,
  c.categorie,
  z.nom AS zone,
  f.consommation_m3,
  f.montant_ht,
  (f.montant_renouvellement + f.montant_assainissement + f.montant_branchement + f.montant_taxe_communale) AS total_redevances,
  f.montant_surconsommation,
  f.total_ttc,
  f.montant_paye,
  f.statut_paiement,
  f.date_emission,
  f.date_echeance,
  f.date_paiement,
  f.numero_facture
FROM factures f
JOIN clients c ON f.client_id = c.id
LEFT JOIN zones z ON c.zone_id = z.id
ORDER BY f.annee DESC, f.mois DESC, c.nom_prenom;

-- ─── INDEX PERFORMANCES ───────────────────────
CREATE INDEX idx_clients_agence ON clients(agence_id);
CREATE INDEX idx_releves_client_mois ON releves(client_id, annee, mois);
CREATE INDEX idx_factures_client_mois ON factures(client_id, annee, mois);
CREATE INDEX idx_factures_statut ON factures(statut_paiement);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_paiements_facture ON paiements(facture_id);

-- ─── TRIGGER: auto-create profile après signup ──
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'agent_terrain')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
