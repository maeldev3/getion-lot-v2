<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center gap-3">
      <select v-model.number="filterAnnee" class="form-select w-auto" @change="fetchData">
        <option v-for="a in annees" :key="a" :value="a">{{ a }}</option>
      </select>
      <select v-model.number="filterMois" class="form-select w-auto" @change="fetchData">
        <option value="">Tous les mois</option>
        <option v-for="(m, i) in moisNoms" :key="i+1" :value="i+1">{{ m }}</option>
      </select>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-3">
      <div class="glass-card p-4 text-center">
        <div class="text-xl font-bold text-white font-mono">{{ paiements.length }}</div>
        <div class="text-xs text-slate-500 mt-1">Paiements enregistrés</div>
      </div>
      <div class="glass-card p-4 text-center">
        <div class="text-xl font-bold text-emerald-400 font-mono">{{ fmt(totalPaye) }}</div>
        <div class="text-xs text-slate-500 mt-1">Total Encaissé (Ar)</div>
      </div>
      <div class="glass-card p-4 text-center">
        <div class="text-xl font-bold text-sky-400 font-mono">
          {{ paiements.filter(p => p.mode_paiement === 'ESPECES').length }}
        </div>
        <div class="text-xs text-slate-500 mt-1">En Espèces</div>
      </div>
    </div>

    <div class="glass-card overflow-hidden">
      <div v-if="loading" class="flex justify-center py-12"><div class="spinner"></div></div>
      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Facture</th>
              <th>Mode</th>
              <th class="text-right">Montant</th>
              <th>Référence</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in paiements" :key="p.id">
              <td class="text-xs font-mono text-slate-400">
                {{ new Date(p.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) }}
              </td>
              <td class="font-medium">{{ p.client?.nom_prenom || '—' }}</td>
              <td class="font-mono text-xs text-sky-400">{{ p.facture?.numero_facture || '—' }}</td>
              <td>
                <span class="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                  {{ p.mode_paiement }}
                </span>
              </td>
              <td class="text-right font-mono font-semibold text-emerald-400">{{ fmt(p.montant) }} Ar</td>
              <td class="text-xs text-slate-500">{{ p.reference_paiement || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()

const now = new Date()
const annees = Array.from({length: 5}, (_, i) => now.getFullYear() - 2 + i)
const moisNoms = ['Janvier','Février','Mars','Avril','Mai','Juin',
                  'Juillet','Août','Septembre','Octobre','Novembre','Décembre']

const filterAnnee = ref(now.getFullYear())
const filterMois = ref('')
const loading = ref(true)
const paiements = ref([])

const totalPaye = computed(() => paiements.value.reduce((s,p) => s + (p.montant || 0), 0))

function fmt(val) {
  if (!val) return '0'
  return Math.round(val).toLocaleString('fr-FR')
}

async function fetchData() {
  loading.value = true
  let query = supabase.from('paiements')
    .select(`*, client:clients(nom_prenom), facture:factures(numero_facture, annee, mois)`)
    .order('created_at', { ascending: false })

  const yearStart = `${filterAnnee.value}-01-01`
  const yearEnd = `${filterAnnee.value}-12-31`
  query = query.gte('created_at', yearStart).lte('created_at', yearEnd)

  const { data } = await query
  let result = data || []
  if (filterMois.value) {
    result = result.filter(p => p.facture?.mois === filterMois.value)
  }
  paiements.value = result
  loading.value = false
}

onMounted(fetchData)
</script>
