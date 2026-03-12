<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <select v-model.number="filterAnnee" class="form-select w-auto" @change="fetchData">
        <option v-for="a in annees" :key="a" :value="a">{{ a }}</option>
      </select>
      <select v-model.number="filterMois" class="form-select w-auto" @change="fetchData">
        <option value="">Tous les mois</option>
        <option v-for="(m,i) in moisNoms" :key="i+1" :value="i+1">{{ m }}</option>
      </select>
      <div class="flex gap-1 bg-slate-800 rounded-lg p-1">
        <button @click="view='list'" class="px-3 py-1 text-xs rounded-md transition-all" :class="view==='list'?'bg-sky-500 text-white':'text-slate-400 hover:text-white'">Liste</button>
        <button @click="switchAnnual" class="px-3 py-1 text-xs rounded-md transition-all" :class="view==='annual'?'bg-sky-500 text-white':'text-slate-400 hover:text-white'">Tableau Annuel</button>
      </div>
      <div class="flex-1"></div>
      <button @click="exportExcel" class="btn-secondary">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        Export Excel
      </button>
      <NuxtLink to="/releves/nouveau" class="btn-primary">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        Nouveau Relevé
      </NuxtLink>
    </div>

    <!-- LIST VIEW -->
    <div v-if="view==='list'" class="glass-card overflow-hidden">
      <div v-if="loading" class="flex justify-center py-12"><div class="spinner"></div></div>
      <div v-else-if="!releves.length" class="text-center py-12 text-slate-600 text-sm">
        Aucun relevé pour cette période.
        <div class="mt-2"><NuxtLink to="/releves/nouveau" class="text-sky-400 text-xs">→ Saisir un relevé</NuxtLink></div>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead><tr><th>Client</th><th>Période</th><th>Ancien Index</th><th>Nouvel Index</th><th class="text-right">Conso (m³)</th><th>Date Relevé</th><th>Facture</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="r in releves" :key="r.id">
              <td>
                <div class="font-medium text-slate-200">{{ r.client?.nom_prenom }}</div>
                <div class="text-xs text-slate-600">{{ r.client?.ref_compteur }}</div>
              </td>
              <td class="font-mono text-xs text-slate-400">{{ moisNoms[r.mois-1] }} {{ r.annee }}</td>
              <td class="font-mono text-sm">{{ r.ancien_index }}</td>
              <td class="font-mono text-sm">{{ r.nouvel_index }}</td>
              <td class="text-right font-mono font-semibold text-sky-400">{{ r.consommation }} m³</td>
              <td class="text-xs text-slate-500">{{ r.date_releve ? new Date(r.date_releve).toLocaleDateString('fr-FR') : '—' }}</td>
              <td>
                <span v-if="r.facture?.[0]" class="text-xs px-2 py-0.5 rounded-full" :class="statutClass(r.facture[0].statut)">{{ r.facture[0].statut }}</span>
                <span v-else class="text-slate-600 text-xs">—</span>
              </td>
              <td>
                <button v-if="r.facture?.[0]" @click="dlPDF(r)" class="icon-btn text-slate-500 hover:text-sky-400 hover:bg-sky-500/10" title="Télécharger PDF">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ANNUAL VIEW -->
    <div v-if="view==='annual'" class="glass-card overflow-hidden">
      <div v-if="loadingA" class="flex justify-center py-12"><div class="spinner"></div></div>
      <div v-else-if="!annualData.length" class="text-center py-12 text-slate-600 text-sm">Aucune donnée pour {{ filterAnnee }}</div>
      <div v-else class="overflow-x-auto">
        <div class="px-5 py-3 border-b border-slate-800">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">RELEVÉ {{ filterAnnee }} — MAROVOALAVO</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th class="w-10">N°</th>
              <th>Noms</th>
              <th v-for="m in moisNoms" :key="m" class="text-center text-xs">{{ m.slice(0,3) }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in annualData" :key="r.client_id">
              <td class="font-mono text-xs text-slate-500">{{ r.numero }}</td>
              <td class="font-medium text-slate-200">{{ r.nom_prenom }}</td>
              <td v-for="k in moisKeys" :key="k" class="text-center font-mono text-xs" :class="r[k]?'text-sky-400':'text-slate-700'">{{ r[k] || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const { downloadFacture } = useFacturePDF()
const { exportRelevesAnnuels } = useExcelExport()

const moisNoms = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const moisKeys = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre']
const now = new Date()
const annees = Array.from({length:5},(_,i)=>now.getFullYear()-2+i)

const filterAnnee = ref(now.getFullYear())
const filterMois = ref('')
const view = ref('list')
const loading = ref(true)
const loadingA = ref(false)
const releves = ref([])
const annualData = ref([])

function statutClass(s) {
  return { PAYEE:'badge-payee', IMPAYEE:'badge-impayee', PARTIELLE:'badge-partielle' }[s] || 'badge-annulee'
}

async function fetchData() {
  loading.value=true
  let q = supabase.from('releves').select('*,client:clients(id,numero,nom_prenom,ref_compteur),facture:factures(id,statut,numero_facture,montant_ttc,montant_ht,redevance_renouvellement,redevance_assainissement,redevance_branchement,taxe_communale,surconsommation,consommation_m3,montant_paye)').eq('annee',filterAnnee.value).order('mois',{ascending:false}).order('created_at',{ascending:false})
  if (filterMois.value) q=q.eq('mois',filterMois.value)
  const { data }=await q
  releves.value=data||[]; loading.value=false
}

async function fetchAnnual() {
  loadingA.value=true
  try {
    const { data }=await supabase.from('v_releves_annuels').select('*').eq('annee',filterAnnee.value).order('numero')
    annualData.value=data||[]
  } catch { annualData.value=[] }
  loadingA.value=false
}

async function switchAnnual() { view.value='annual'; await fetchAnnual() }

async function dlPDF(releve) {
  const f=releve.facture?.[0]
  if (f) await downloadFacture({...f,releve},releve.client)
}

async function exportExcel() {
  if (view.value==='annual') {
    if (!annualData.value.length) await fetchAnnual()
    await exportRelevesAnnuels(annualData.value, filterAnnee.value)
  } else {
    await fetchAnnual()
    await exportRelevesAnnuels(annualData.value, filterAnnee.value)
  }
}

onMounted(fetchData)
</script>
<style scoped>
.icon-btn { @apply p-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center; }
</style>
