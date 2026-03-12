<template>
  <div class="max-w-4xl mx-auto space-y-5" v-if="client">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink to="/clients" class="text-slate-500 hover:text-slate-300 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </NuxtLink>
        <div>
          <h1 class="text-xl font-bold text-white font-display">{{ client.nom_prenom }}</h1>
          <p class="text-xs text-slate-500">{{ client.ref_client }} — {{ client.zone?.name }}</p>
        </div>
      </div>
      <div class="flex gap-2">
        <NuxtLink :to="`/releves/nouveau?client_id=${client.id}`" class="btn-primary py-2 text-xs">
          + Relevé
        </NuxtLink>
        <NuxtLink :to="`/clients/${client.id}/edit`" class="btn-secondary py-2 text-xs">
          Modifier
        </NuxtLink>
      </div>
    </div>

    <!-- Info Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="glass-card p-4">
        <div class="text-xs text-slate-500 mb-1">Catégorie</div>
        <div class="font-mono font-bold text-sky-400">{{ client.categorie }}</div>
      </div>
      <div class="glass-card p-4">
        <div class="text-xs text-slate-500 mb-1">Fokontany</div>
        <div class="font-medium text-slate-200">{{ client.fokontany || '—' }}</div>
      </div>
      <div class="glass-card p-4">
        <div class="text-xs text-slate-500 mb-1">Réf. Compteur</div>
        <div class="font-mono text-slate-300">{{ client.ref_compteur || '—' }}</div>
      </div>
      <div class="glass-card p-4">
        <div class="text-xs text-slate-500 mb-1">Code Client</div>
        <div class="font-mono text-slate-300">{{ client.code_client || '—' }}</div>
      </div>
    </div>

    <!-- History -->
    <div class="glass-card overflow-hidden">
      <div class="p-4 border-b border-slate-800">
        <h2 class="text-sm font-semibold text-slate-200 font-display">Historique des Relevés & Factures</h2>
      </div>
      <div v-if="loadingHistory" class="flex justify-center py-8"><div class="spinner"></div></div>
      <div v-else-if="history.length === 0" class="text-center py-8 text-slate-600 text-sm">
        Aucun historique disponible
      </div>
      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Période</th>
              <th>Ancien Index</th>
              <th>Nouvel Index</th>
              <th class="text-right">Conso (m³)</th>
              <th class="text-right">Total TTC</th>
              <th class="text-right">Payé</th>
              <th>Statut</th>
              <th>PDF</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in history" :key="r.id">
              <td class="font-mono text-xs">{{ moisNoms[r.mois-1] }} {{ r.annee }}</td>
              <td class="font-mono text-sm">{{ r.ancien_index }}</td>
              <td class="font-mono text-sm">{{ r.nouvel_index }}</td>
              <td class="text-right font-mono font-semibold text-sky-400">{{ r.consommation }}</td>
              <td class="text-right font-mono">{{ fmt(r.facture?.[0]?.montant_ttc) }}</td>
              <td class="text-right font-mono text-emerald-400">{{ fmt(r.facture?.[0]?.montant_paye) }}</td>
              <td>
                <span v-if="r.facture?.[0]" class="text-xs px-2 py-0.5 rounded-full"
                  :class="{
                    'badge-payee': r.facture[0].statut === 'PAYEE',
                    'badge-impayee': r.facture[0].statut === 'IMPAYEE',
                    'badge-partielle': r.facture[0].statut === 'PARTIELLE',
                  }">
                  {{ r.facture[0].statut }}
                </span>
              </td>
              <td>
                <button v-if="r.facture?.[0]" @click="dl(r)" 
                  class="text-slate-500 hover:text-sky-400 p-1 transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div v-else class="flex justify-center py-16"><div class="spinner"></div></div>
</template>

<script setup>
const route = useRoute()
const supabase = useSupabaseClient()
const { downloadFacture } = useFacturePDF()

const moisNoms = ['Janvier','Février','Mars','Avril','Mai','Juin',
                  'Juillet','Août','Septembre','Octobre','Novembre','Décembre']

const client = ref(null)
const history = ref([])
const loadingHistory = ref(true)

function fmt(val) {
  if (!val && val !== 0) return '—'
  return Math.round(val).toLocaleString('fr-FR')
}

async function dl(releve) {
  const f = releve.facture?.[0]
  if (f) await downloadFacture({ ...f, releve }, client.value)
}

onMounted(async () => {
  const { data } = await supabase.from('clients')
    .select('*, zone:zones(*), agency:agencies(*)')
    .eq('id', route.params.id).single()
  client.value = data

  const { data: hist } = await supabase.from('releves')
    .select('*, facture:factures(*)')
    .eq('client_id', route.params.id)
    .order('annee', { ascending: false })
    .order('mois', { ascending: false })
  history.value = hist || []
  loadingHistory.value = false
})
</script>
