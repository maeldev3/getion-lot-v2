<template>
  <div class="space-y-5">
    <!-- Filters & Actions -->
    <div class="flex flex-wrap items-center gap-3">
      <select v-model.number="filterAnnee" class="form-select w-auto" @change="fetchData">
        <option v-for="a in annees" :key="a" :value="a">{{ a }}</option>
      </select>
      <select v-model.number="filterMois" class="form-select w-auto" @change="fetchData">
        <option v-for="(m, i) in moisNoms" :key="i+1" :value="i+1">{{ m }}</option>
      </select>
      <div class="flex-1"></div>
      <button @click="exportExcel" class="btn-secondary">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        Export Excel
      </button>
      <button @click="printPage" class="btn-secondary">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
        </svg>
        Imprimer
      </button>
    </div>

    <!-- Title block -->
    <div class="glass-card p-5">
      <h2 class="text-base font-bold text-white font-display">
        Tableau Récapitulatif — Consommation du mois de 
        <span class="text-sky-400">{{ moisNoms[filterMois-1] }} {{ filterAnnee }}</span>
      </h2>
      <p class="text-xs text-slate-500 mt-1">Evaluation de prix de consommation et Taxe à Beforona BP</p>
    </div>

    <!-- Summary -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="glass-card p-4 text-center">
        <div class="text-xl font-bold text-sky-400 font-mono">{{ totaux.conso?.toFixed(3) }}</div>
        <div class="text-xs text-slate-500 mt-1">Conso Totale (m³)</div>
      </div>
      <div class="glass-card p-4 text-center">
        <div class="text-xl font-bold text-white font-mono">{{ fmt(totaux.ht) }}</div>
        <div class="text-xs text-slate-500 mt-1">Total HT (Ar)</div>
      </div>
      <div class="glass-card p-4 text-center">
        <div class="text-xl font-bold text-violet-400 font-mono">{{ fmt(totaux.ttc) }}</div>
        <div class="text-xs text-slate-500 mt-1">Total TTC (Ar)</div>
      </div>
      <div class="glass-card p-4 text-center">
        <div class="text-xl font-bold text-emerald-400 font-mono">{{ fmt(totaux.paye) }}</div>
        <div class="text-xs text-slate-500 mt-1">Total Payé (Ar)</div>
      </div>
    </div>

    <!-- Main Table -->
    <div class="glass-card overflow-hidden" id="recap-table">
      <div v-if="loading" class="flex justify-center py-12"><div class="spinner"></div></div>
      <div v-else-if="data.length === 0" class="text-center py-12 text-slate-600 text-sm">
        Aucune donnée pour cette période.
        <div class="mt-2">
          <NuxtLink to="/releves/nouveau" class="text-sky-400 hover:text-sky-300">
            → Saisir des relevés
          </NuxtLink>
        </div>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Nom et Prénom</th>
              <th class="text-right">Conso (m³)</th>
              <th class="text-right">Montant HT</th>
              <th class="text-right">Redev. & Taxes (8%)</th>
              <th class="text-right">Sur-conso</th>
              <th class="text-right">Total TTC</th>
              <th class="text-right">Payé</th>
              <th>Statut</th>
              <th>Observations</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in data" :key="row.client_id || i">
              <td class="font-mono text-slate-500 text-xs">{{ row.numero }}</td>
              <td class="font-medium">{{ row.nom_prenom }}</td>
              <td class="text-right font-mono text-sky-400">{{ row.consommation }}</td>
              <td class="text-right font-mono">{{ fmt(row.montant_ht) }}</td>
              <td class="text-right font-mono text-slate-400">
                {{ fmt((row.redevance_renouvellement||0) + (row.redevance_assainissement||0) + (row.redevance_branchement||0) + (row.taxe_communale||0)) }}
              </td>
              <td class="text-right font-mono text-amber-400">{{ fmt(row.surconsommation) }}</td>
              <td class="text-right font-mono font-semibold">{{ fmt(row.montant_ttc) }}</td>
              <td class="text-right font-mono text-emerald-400">{{ fmt(row.montant_paye) }}</td>
              <td>
                <span v-if="row.statut" class="text-xs px-2 py-0.5 rounded-full"
                  :class="{
                    'badge-payee': row.statut === 'PAYEE',
                    'badge-impayee': row.statut === 'IMPAYEE',
                    'badge-partielle': row.statut === 'PARTIELLE',
                  }">
                  {{ row.statut }}
                </span>
                <span v-else class="text-slate-600 text-xs">—</span>
              </td>
              <td class="text-xs text-slate-500">{{ row.observation || '' }}</td>
            </tr>
          </tbody>
          <!-- Totals row -->
          <tfoot>
            <tr class="border-t-2 border-sky-500/30 bg-sky-500/5">
              <td colspan="2" class="px-4 py-3 font-bold text-slate-300 text-sm">TOTAL</td>
              <td class="px-4 py-3 text-right font-mono font-bold text-sky-400">{{ totaux.conso?.toFixed(3) }}</td>
              <td class="px-4 py-3 text-right font-mono font-bold">{{ fmt(totaux.ht) }}</td>
              <td class="px-4 py-3 text-right font-mono font-bold text-slate-400">{{ fmt(totaux.redv) }}</td>
              <td class="px-4 py-3 text-right font-mono font-bold text-amber-400">{{ fmt(totaux.surco) }}</td>
              <td class="px-4 py-3 text-right font-mono font-bold text-violet-400">{{ fmt(totaux.ttc) }}</td>
              <td class="px-4 py-3 text-right font-mono font-bold text-emerald-400">{{ fmt(totaux.paye) }}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const { exportRecapConsommations } = useExcelExport()

const now = new Date()
const annees = Array.from({length: 5}, (_, i) => now.getFullYear() - 2 + i)
const moisNoms = ['Janvier','Février','Mars','Avril','Mai','Juin',
                  'Juillet','Août','Septembre','Octobre','Novembre','Décembre']

const filterAnnee = ref(now.getFullYear())
const filterMois = ref(now.getMonth() + 1)
const loading = ref(true)
const data = ref([])

function fmt(val) {
  if (!val && val !== 0) return '0'
  return Math.round(val).toLocaleString('fr-FR')
}

const totaux = computed(() => ({
  conso: data.value.reduce((s,r) => s + (r.consommation || 0), 0),
  ht: data.value.reduce((s,r) => s + (r.montant_ht || 0), 0),
  redv: data.value.reduce((s,r) => s + (r.redevance_renouvellement||0) + (r.redevance_assainissement||0) + (r.redevance_branchement||0) + (r.taxe_communale||0), 0),
  surco: data.value.reduce((s,r) => s + (r.surconsommation || 0), 0),
  ttc: data.value.reduce((s,r) => s + (r.montant_ttc || 0), 0),
  paye: data.value.reduce((s,r) => s + (r.montant_paye || 0), 0),
}))

async function fetchData() {
  loading.value = true
  try {
    const { data: rows } = await supabase.from('v_recap_consommations')
      .select('*')
      .eq('annee', filterAnnee.value)
      .eq('mois', filterMois.value)
      .order('numero')
    data.value = rows || []
  } catch(e) {
    // Fallback if view not created
    const { data: factures } = await supabase.from('factures')
      .select(`*, client:clients(numero, nom_prenom, fokontany, zone:zones(name))`)
      .eq('annee', filterAnnee.value)
      .eq('mois', filterMois.value)
      .order('client_id')
    data.value = (factures || []).map(f => ({
      ...f,
      numero: f.client?.numero,
      nom_prenom: f.client?.nom_prenom,
      fokontany: f.client?.fokontany,
      zone_name: f.client?.zone?.name,
      consommation: f.consommation_m3,
    }))
  }
  loading.value = false
}

async function exportExcel() {
  await exportRecapConsommations(data.value, filterMois.value, filterAnnee.value)
}

function printPage() {
  window.print()
}

onMounted(fetchData)
</script>
