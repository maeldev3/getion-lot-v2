// types/index.ts — Types TypeScript ACOGEMA

export type UserRole = 'super_admin' | 'directeur' | 'comptable' | 'agent_terrain'
export type CategorieClient = 'BP' | 'HP'
export type StatutPaiement = 'non_facture' | 'en_attente' | 'paye' | 'retard' | 'annule'
export type StatutReleve = 'saisi' | 'valide' | 'facture' | 'manquant'

export interface Agence {
  id: string
  nom: string
  code: string
  telephone?: string
  email?: string
  adresse?: string
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  agence_id?: string
  telephone?: string
  avatar_url?: string
  is_active: boolean
  last_login?: string
  agence?: Agence
}

export interface Zone {
  id: string
  agence_id: string
  nom: string
  description?: string
}

export interface Client {
  id: string
  agence_id: string
  zone_id?: string
  numero: number
  nom_prenom: string
  ref_client?: string
  code_client?: string
  ref_compteur: string
  adresse?: string
  fokontany?: string
  categorie: CategorieClient
  telephone?: string
  email?: string
  index_initial: number
  date_branchement?: string
  is_active: boolean
  observations?: string
  created_at: string
  zone?: Zone
  dernier_releve?: Releve
}

export interface Tarif {
  id: string
  agence_id: string
  prix_unitaire: number
  seuil_surconsommation: number
  taux_surconsommation: number
  taux_renouvellement: number
  taux_assainissement: number
  taux_branchement_social: number
  taux_taxe_communale: number
  date_effet: string
  is_active: boolean
}

export interface Releve {
  id: string
  client_id: string
  agence_id: string
  annee: number
  mois: number
  ancien_index: number
  nouvel_index: number
  consommation: number
  date_releve: string
  statut: StatutReleve
  observations?: string
  saisi_par?: string
  created_at: string
  client?: Client
  profile_saisie?: Profile
}

export interface Facture {
  id: string
  numero_facture: string
  releve_id: string
  client_id: string
  agence_id: string
  tarif_id: string
  annee: number
  mois: number
  consommation_m3: number
  montant_ht: number
  montant_renouvellement: number
  montant_assainissement: number
  montant_branchement: number
  montant_taxe_communale: number
  montant_surconsommation: number
  total_ttc: number
  statut_paiement: StatutPaiement
  date_emission: string
  date_echeance?: string
  date_paiement?: string
  montant_paye: number
  mode_paiement?: string
  reference_paiement?: string
  pdf_url?: string
  notes?: string
  created_at: string
  client?: Client
  releve?: Releve
}

export interface Paiement {
  id: string
  facture_id: string
  client_id: string
  agence_id: string
  montant: number
  mode_paiement: string
  reference?: string
  date_paiement: string
  recu_numero?: string
  notes?: string
  created_at: string
  facture?: Facture
  client?: Client
}

export interface AuditLog {
  id: string
  user_id?: string
  agence_id?: string
  action: string
  table_name?: string
  record_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  created_at: string
  profile?: Profile
}

// Dashboard stats
export interface DashboardStats {
  total_clients: number
  clients_actifs: number
  consommation_mois: number
  revenus_factures: number
  revenus_recouvres: number
  taux_recouvrement: number
  factures_impayees: number
  montant_impaye: number
}

// Récapitulatif mensuel
export interface RecapitulatifLigne {
  annee: number
  mois: number
  client_id: string
  nom_prenom: string
  ref_client?: string
  ref_compteur: string
  fokontany?: string
  categorie: CategorieClient
  zone: string
  consommation_m3: number
  montant_ht: number
  total_redevances: number
  montant_surconsommation: number
  total_ttc: number
  montant_paye: number
  statut_paiement: StatutPaiement
  numero_facture: string
}

// Filtres
export interface FiltreClients {
  zone_id?: string
  categorie?: CategorieClient
  is_active?: boolean
  search?: string
}

export interface FiltreReleves {
  annee?: number
  mois?: number
  statut?: StatutReleve
  zone_id?: string
  search?: string
}

export interface FiltreFactures {
  annee?: number
  mois?: number
  statut_paiement?: StatutPaiement
  search?: string
}

// Formulaires
export interface FormClient {
  nom_prenom: string
  ref_compteur: string
  adresse?: string
  fokontany?: string
  categorie: CategorieClient
  zone_id?: string
  telephone?: string
  email?: string
  index_initial: number
  date_branchement?: string
  observations?: string
}

export interface FormReleve {
  client_id: string
  annee: number
  mois: number
  ancien_index: number
  nouvel_index: number
  date_releve: string
  observations?: string
}

export interface FormPaiement {
  facture_id: string
  montant: number
  mode_paiement: string
  reference?: string
  date_paiement: string
  notes?: string
}

// Mois noms
export const MOIS_NOMS = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export const MOIS_COLS = [
  'JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
  'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE'
]

// Permissions par rôle
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ['*'],
  directeur: ['clients:read', 'clients:write', 'releves:read', 'releves:write', 'factures:read', 'factures:write', 'paiements:read', 'paiements:write', 'rapports:read', 'users:read'],
  comptable: ['clients:read', 'releves:read', 'factures:read', 'factures:write', 'paiements:read', 'paiements:write', 'rapports:read'],
  agent_terrain: ['clients:read', 'releves:read', 'releves:write'],
}
