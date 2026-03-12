<!-- pages/clients.vue -->
<template>
  <div>
    <!-- Filtres -->
    <div class="filters-bar">
      <div class="filter-group">
        <label class="fl">Zone:</label>
        <select v-model="filtres.zone_id" class="fi-select">
          <option value="">Toutes</option>
          <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.nom }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="fl">Catégorie:</label>
        <select v-model="filtres.categorie" class="fi-select">
          <option value="">Tous</option>
          <option value="BP">BP (Basse Pression)</option>
          <option value="HP">HP (Haute Pression)</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="fl">Statut:</label>
        <select v-model="filtreActif" class="fi-select">
          <option value="">Tous</option>
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
        </select>
      </div>
      <div class="filter-search">
        <input v-model="filtres.search" class="fi-input" placeholder="🔍 Rechercher un client..." />
      </div>
      <button class="fi-reset" @click="resetFiltres">✕ Réinitialiser</button>
    </div>

    <div class="section-header">
      <div class="section-title">Liste des Clients ({{ clients.length }})</div>
      <div class="section-actions">
        <button class="btn-sec" @click="exportExcel">📥 Export Excel</button>
        <button class="btn-sec primary" @click="showNewClient = true">+ Nouveau Client</button>
      </div>
    </div>

    <div class="table-wrap" v-if="!loading">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th><th>Nom & Prénom</th><th>Réf Client</th><th>Compteur</th>
            <th>Fokontany</th><th>Catégorie</th><th>Conso (m³)</th><th>Statut</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in clientsFiltres" :key="c.id">
            <td class="td-num">{{ c.numero }}</td>
            <td>
              <div class="td-name">{{ c.nom_prenom }}</div>
              <div class="td-code">Depuis: {{ c.date_branchement }}</div>
            </td>
            <td class="td-code">{{ c.ref_client }}</td>
            <td class="td-code">{{ c.ref_compteur }}</td>
            <td>{{ c.fokontany }}</td>
            <td><span class="categ-badge">{{ c.categorie }}</span></td>
            <td>
              <div class="td-num">{{ c.dernier_releve?.consommation?.toFixed(3) ?? '—' }} m³</div>
              <div class="mini-bar"><div class="mini-fill" :style="{ width: consoBar(c) + '%' }"></div></div>
            </td>
            <td>
              <span class="status-badge" :class="c.dernier_releve?.statut ?? 'non_facture'">
                {{ statutLabel(c.dernier_releve?.statut) }}
              </span>
            </td>
            <td>
              <button class="act-btn" @click="voirFacture(c.id)">🧾</button>
              <button class="act-btn" @click="editClient = c; showEditClient = true">✏️</button>
              <button class="act-btn danger" @click="confirmDelete(c)" v-if="auth.isDirecteur">🗑</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!clientsFiltres.length" class="empty-state">Aucun client trouvé</div>
    </div>
    <div v-else class="loading-state">Chargement...</div>

    <!-- Modal Nouveau Client -->
    <Teleport to="body">
      <div v-if="showNewClient" class="modal-overlay" @click.self="showNewClient = false">
        <div class="modal">
          <button class="modal-close" @click="showNewClient = false">✕</button>
          <h3 class="modal-title">Nouveau Client</h3>
          <p class="modal-sub">Ajouter un ménage au système</p>
          <form @submit.prevent="submitNewClient" class="form-grid">
            <div class="fg full"><label class="fl">Nom et Prénom *</label><input v-model="newForm.nom_prenom" class="fi" required /></div>
            <div class="fg"><label class="fl">N° Compteur *</label><input v-model="newForm.ref_compteur" class="fi" required /></div>
            <div class="fg"><label class="fl">Date de branchement</label><input v-model="newForm.date_branchement" type="date" class="fi" /></div>
            <div class="fg"><label class="fl">Adresse</label><input v-model="newForm.adresse" class="fi" /></div>
            <div class="fg"><label class="fl">Fokontany</label><input v-model="newForm.fokontany" class="fi" /></div>
            <div class="fg"><label class="fl">Catégorie</label>
              <select v-model="newForm.categorie" class="fi">
                <option value="BP">BP (Basse Pression)</option>
                <option value="HP">HP (Haute Pression)</option>
              </select>
            </div>
            <div class="fg"><label class="fl">Zone</label>
              <select v-model="newForm.zone_id" class="fi">
                <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.nom }}</option>
              </select>
            </div>
            <div class="fg"><label class="fl">Index Initial</label><input v-model.number="newForm.index_initial" type="number" step="0.001" class="fi" /></div>
            <div class="fg"><label class="fl">Téléphone</label><input v-model="newForm.telephone" class="fi" /></div>
            <div class="fg"><label class="fl">Email</label><input v-model="newForm.email" type="email" class="fi" /></div>
            <div class="fg full"><label class="fl">Observations</label><textarea v-model="newForm.observations" class="fi" rows="2"></textarea></div>
            <div class="form-actions full">
              <button type="button" class="btn-cancel" @click="showNewClient = false">Annuler</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? '⌛ Enregistrement...' : '💾 Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Client, FormClient } from '~/types'
definePageMeta({ middleware: ['auth'] })

const auth = useAuthStore()
const supabase = useSupabaseClient()
const { clients, loading, fetchClients, createClient, deleteClient } = useClients()

const filtres = reactive({ zone_id: '', categorie: '', search: '' })
const filtreActif = ref('')
const showNewClient = ref(false)
const showEditClient = ref(false)
const editClient = ref<Client | null>(null)
const saving = ref(false)
const zones = ref<{ id: string; nom: string }[]>([])

const defaultForm = (): FormClient => ({
  nom_prenom: '', ref_compteur: '', adresse: '', fokontany: '',
  categorie: 'BP', zone_id: '', telephone: '', email: '',
  index_initial: 0, date_branchement: '', observations: ''
})
const newForm = reactive(defaultForm())

const clientsFiltres = computed(() => clients.value.filter(c => {
  if (filtres.zone_id && c.zone_id !== filtres.zone_id) return false
  if (filtres.categorie && c.categorie !== filtres.categorie) return false
  if (filtreActif.value !== '' && String(c.is_active) !== filtreActif.value) return false
  if (filtres.search && !c.nom_prenom.toLowerCase().includes(filtres.search.toLowerCase())) return false
  return true
}))

function resetFiltres() { filtres.zone_id = ''; filtres.categorie = ''; filtres.search = ''; filtreActif.value = '' }
function consoBar(c: Client) { return Math.min((c.dernier_releve?.consommation ?? 0) / 20 * 100, 100) }
function statutLabel(s?: string) {
  return { facture: 'Facturé', saisi: 'Relevé', valide: 'Validé', manquant: 'Manquant', undefined: 'N/A' }[s ?? 'undefined'] ?? s
}
function voirFacture(clientId: string) { navigateTo(`/factures?client=${clientId}`) }
function confirmDelete(c: Client) {
  if (confirm(`Désactiver le client ${c.nom_prenom}?`)) deleteClient(c.id)
}
async function exportExcel() {
  const { default: XLSX } = await import('xlsx')
  const rows = clientsFiltres.value.map(c => ({
    'N°': c.numero, 'Nom': c.nom_prenom, 'Réf Client': c.ref_client, 'Compteur': c.ref_compteur,
    'Fokontany': c.fokontany, 'Catégorie': c.categorie, 'Zone': c.zone?.nom,
    'Date Branchement': c.date_branchement, 'Téléphone': c.telephone,
  }))
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Clients')
  XLSX.writeFile(wb, `Clients_ACOGEMA_${new Date().toLocaleDateString('fr-FR')}.xlsx`)
}
async function submitNewClient() {
  saving.value = true
  try {
    await createClient(newForm)
    showNewClient.value = false
    Object.assign(newForm, defaultForm())
  } finally { saving.value = false }
}

onMounted(async () => {
  await fetchClients()
  const { data } = await supabase.from('zones').select('id, nom').eq('agence_id', auth.agenceId!)
  zones.value = data ?? []
})
</script>

<style scoped>
.filters-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 18px; }
.filter-group { display: flex; align-items: center; gap: 6px; }
.fl { font-size: 11px; color: var(--text3); font-family: var(--mono); }
.fi-select, .fi-input, .fi { background: var(--surface2); border: 1px solid var(--border); color: var(--text); font-family: var(--sans); font-size: 12px; padding: 7px 12px; border-radius: 8px; outline: none; transition: border-color 0.2s; }
.fi-select:focus, .fi-input:focus, .fi:focus { border-color: var(--accent); }
.fi-input, .filter-search input { min-width: 200px; }
.fi-reset { background: rgba(239,71,111,0.1); border: 1px solid rgba(239,71,111,0.2); color: var(--red); font-size: 11px; padding: 7px 12px; border-radius: 8px; cursor: pointer; font-family: var(--sans); }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.section-title { font-size: 16px; font-weight: 700; }
.section-actions { display: flex; gap: 8px; }
.btn-sec { background: var(--surface2); border: 1px solid var(--border); color: var(--text2); padding: 7px 14px; border-radius: 8px; font-family: var(--sans); font-size: 12px; cursor: pointer; transition: all 0.15s; }
.btn-sec:hover { border-color: var(--accent); color: var(--accent); }
.btn-sec.primary { background: linear-gradient(135deg, var(--accent), var(--accent2)); border: none; color: #000; font-weight: 700; }
.table-wrap { background: var(--surface); border: 1px solid var(--border2); border-radius: 14px; overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; min-width: 900px; }
.data-table thead tr { background: var(--surface2); }
.data-table th { padding: 11px 14px; text-align: left; font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: 1.5px; font-family: var(--mono); white-space: nowrap; }
.data-table td { padding: 13px 14px; border-bottom: 1px solid var(--border2); font-size: 13px; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: var(--surface2); }
.td-num { font-family: var(--mono); font-size: 12px; color: var(--text2); }
.td-name { font-weight: 600; }
.td-code { font-family: var(--mono); font-size: 11px; color: var(--text3); }
.categ-badge { background: rgba(0,180,216,0.12); border: 1px solid rgba(0,180,216,0.2); color: var(--accent3); font-size: 10px; padding: 2px 8px; border-radius: 20px; font-family: var(--mono); }
.mini-bar { height: 3px; background: var(--surface2); border-radius: 2px; margin-top: 3px; overflow: hidden; }
.mini-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent3)); border-radius: 2px; }
.status-badge { font-size: 9px; font-weight: 600; padding: 2px 8px; border-radius: 20px; font-family: var(--mono); }
.status-badge.facture { background: rgba(6,214,160,0.12); color: var(--green); }
.status-badge.saisi, .status-badge.valide { background: rgba(0,180,216,0.12); color: var(--accent3); }
.status-badge.manquant, .status-badge.non_facture { background: rgba(239,71,111,0.12); color: var(--red); }
.act-btn { background: none; border: 1px solid var(--border); color: var(--text2); padding: 4px 8px; border-radius: 6px; font-size: 11px; cursor: pointer; margin-right: 3px; transition: all 0.15s; }
.act-btn:hover { border-color: var(--accent); color: var(--accent); }
.act-btn.danger:hover { border-color: var(--red); color: var(--red); }
.empty-state, .loading-state { text-align: center; padding: 32px; color: var(--text3); }
/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(4,13,24,0.85); backdrop-filter: blur(8px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 32px; width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto; position: relative; }
.modal-close { position: absolute; top: 16px; right: 16px; background: var(--surface2); border: 1px solid var(--border); color: var(--text2); width: 30px; height: 30px; border-radius: 8px; cursor: pointer; font-size: 14px; }
.modal-title { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
.modal-sub { font-size: 12px; color: var(--text3); font-family: var(--mono); margin-bottom: 22px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.fg { display: flex; flex-direction: column; gap: 5px; }
.fg.full { grid-column: 1/-1; }
.fi { background: var(--surface2); border: 1px solid var(--border); color: var(--text); font-family: var(--sans); font-size: 13px; padding: 10px 14px; border-radius: 10px; outline: none; resize: vertical; }
.fi:focus { border-color: var(--accent); }
.form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
.btn-cancel { background: none; border: 1px solid var(--border); color: var(--text2); padding: 9px 18px; border-radius: 10px; font-family: var(--sans); font-size: 13px; cursor: pointer; }
.btn-primary { background: linear-gradient(135deg, var(--accent), var(--accent2)); border: none; color: #000; font-weight: 700; padding: 9px 22px; border-radius: 10px; font-family: var(--sans); font-size: 13px; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
