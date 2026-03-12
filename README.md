# 💧 ACOGEMA — Système de Gestion de l'Eau

Application professionnelle de gestion de la distribution d'eau pour l'agence ACOGEMA Beforona, Madagascar.

---

## 🚀 Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | **Nuxt.js 3** (Vue 3 + Composition API) |
| Backend & BDD | **Supabase** (PostgreSQL + Auth + RLS) |
| Styles | **Tailwind CSS** |
| PDF | **jsPDF** |
| Excel | **SheetJS (xlsx)** |
| State | **Pinia** |

---

## 📦 Installation

### 1. Prérequis
- Node.js 18+
- Compte Supabase (gratuit sur supabase.com)

### 2. Cloner et installer
```bash
git clone <repo>
cd acogema-water
npm install
```

### 3. Configurer Supabase

1. Créer un nouveau projet sur [supabase.com](https://supabase.com)
2. Aller dans **SQL Editor** et exécuter le fichier `supabase/schema.sql`
3. Copier vos clés API depuis **Project Settings > API**

### 4. Variables d'environnement

Créer un fichier `.env` :
```
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_KEY=votre-cle-anon-publique
```

### 5. Lancer l'application
```bash
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

---

## 🔐 Création du premier compte Admin

Dans Supabase Dashboard :
1. Aller dans **Authentication > Users**
2. Cliquer **Invite user** et saisir votre email
3. Après inscription, aller dans **Table Editor > profiles**
4. Modifier votre profil et mettre `role = 'ADMIN'`

---

## ✨ Fonctionnalités

### 📊 Tableau de Bord
- Statistiques en temps réel (clients actifs, relevés du mois, total facturé, impayés)
- Factures impayées récentes
- Consommations du mois en cours
- Actions rapides

### 👥 Gestion des Clients
- Liste complète avec recherche et filtres par zone
- Fiche client détaillée avec historique complet
- Création / Modification des clients
- Informations : Nom, Catégorie (BP/BF/Commercial/Industriel), Fokontany, Réf. Compteur, Code Client

### 📏 Relevés de Compteur
- Saisie des relevés avec pré-remplissage automatique de l'ancien index
- Calcul instantané de la consommation et de la facture
- Vue liste et vue tableau annuel (style ETAPE_1)
- Export Excel du tableau annuel
- Téléchargement PDF par relevé

### 🧾 Factures
- Génération automatique à chaque relevé
- Calcul selon tarification ACOGEMA :
  - **Consommation HT** = m³ × 1 400 Ar
  - **Redevances et Taxes (4 × 2%)** = 8% du montant HT
  - **Sur-consommation (20%)** = si > 10 m³
- Gestion des statuts : IMPAYÉE / PAYÉE / PARTIELLE
- Enregistrement des paiements (espèces, virement, mobile money, chèque)
- Export Excel des factures
- Téléchargement PDF de chaque facture (format A5)

### 📋 Tableau Récapitulatif
- Récapitulatif mensuel type ETAPE_3 avec toutes les colonnes
- Totaux automatiques
- Export Excel au format officiel ACOGEMA
- Impression directe

### 💰 Paiements
- Historique de tous les paiements
- Filtres par année et mois
- Statistiques d'encaissement

### ⚙️ Paramètres
- Configuration de l'agence
- Gestion des tarifs (prix unitaire, taux de redevances, seuil sur-consommation)
- Gestion des zones / secteurs

---

## 🗃️ Structure de la Base de Données

```
agencies          → Agences ACOGEMA
zones             → Secteurs géographiques
clients           → Abonnés (ménages)
releves           → Relevés de compteur mensuels
factures          → Factures générées
paiements         → Paiements enregistrés
tariffs           → Grilles tarifaires
profiles          → Profils utilisateurs (liés à Supabase Auth)
```

### Vues SQL créées
- `v_recap_consommations` → Tableau récapitulatif mensuel complet
- `v_releves_annuels` → Tableau croisé des relevés par année

---

## 📁 Structure du Projet

```
acogema-water/
├── supabase/
│   └── schema.sql              # Schéma complet + données initiales
├── assets/css/
│   └── main.css                # Styles globaux
├── composables/
│   ├── useFacturePDF.js        # Génération PDF factures
│   └── useExcelExport.js       # Export Excel
├── stores/
│   ├── auth.js                 # Authentification
│   ├── clients.js              # CRUD clients
│   └── releves.js              # Relevés & factures
├── layouts/
│   ├── default.vue             # Layout avec sidebar
│   └── auth.vue                # Layout connexion
├── pages/
│   ├── index.vue               # Dashboard
│   ├── auth/login.vue
│   ├── clients/
│   ├── releves/
│   ├── factures/
│   ├── recap/
│   ├── paiements/
│   └── parametres/
└── nuxt.config.ts
```

---

## 🔒 Sécurité

- **Row Level Security (RLS)** activé sur toutes les tables Supabase
- Authentification JWT via Supabase Auth
- Rôles : ADMIN, AGENT, LECTEUR
- Redirection automatique vers `/auth/login` si non connecté

---

## 📄 Licence

Propriété d'ACOGEMA — Agence Beforona, Madagascar.
