<template>
  <div class="space-y-5">
    <!-- KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="k in kpis" :key="k.label"
        class="rounded-2xl border p-5 flex flex-col gap-3"
        :style="`background:${k.bg};border-color:${k.border}`">
        <div class="flex items-center justify-between">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center" :style="`background:${k.iconBg}`">
            <span :class="k.iconClass" v-html="k.icon"></span>
          </div>
          <span class="text-xs font-medium px-2 py-0.5 rounded-full" :style="`background:${k.badgeBg};color:${k.badgeColor}`">
            {{ k.badge }}
          </span>
        </div>
        <div>
          <div class="text-2xl font-bold text-white font-mono">{{ loading ? '—' : k.value }}</div>
          <div class="text-xs text-slate-500 mt-0.5">{{ k.label }}</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Factures impayées -->
      <div class="glass-card overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 class="text-sm font-semibold text-white">Factures Impayées</h2>
          <NuxtLink to="/factures" class="text-xs text-sky-400 hover:text-sky-300 transition-colors">Voir tout →</NuxtLink>
        </div>
        <div v-if="loadingF" class="flex justify-center py-10"><div class="spinner"></div></div>
        <div v-else-if="!facturesImpayes.length" class="text-center py-10 text-slate-600 text-sm">Aucune facture impayée 🎉</div>
        <table v-else class="data-table">
          <thead><tr><th>Client</th><th>Période</th><th class="text-right">Montant</th></tr></thead>
          <tbody>
            <tr v-for="f in facturesImpayes" :key="f.id" class="cursor-pointer" @click="$router.push('/factures')">
              <td class="font-medium text-slate-200">{{ f.client?.nom_prenom }}</td>
              <td class="text-xs text-slate-500">{{ mois[f.mois-1] }} {{ f.annee }}</td>
              <td class="text-right font-mono text-red-400 font-semibold">{{ fmt(f.montant_ttc) }} Ar</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Consommations du mois -->
      <div class="glass-card overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 class="text-sm font-semibold text-white">Consommations — {{ moisActuel }}</h2>
          <NuxtLink to="/recap" class="text-xs text-sky-400 hover:text-sky-300 transition-colors">Tableau complet →</NuxtLink>
        </div>
        <div v-if="loadingR" class="flex justify-center py-10"><div class="spinner"></div></div>
        <div v-else-if="!recapMois.length" class="text-center py-10 text-slate-600 text-sm">
          Aucun relevé ce mois.
          <div class="mt-2"><NuxtLink to="/releves/nouveau" class="text-sky-400 text-xs">→ Saisir un relevé</NuxtLink></div>
        </div>
        <table v-else class="data-table">
          <thead><tr><th>Client</th><th class="text-right">m³</th><th class="text-right">TTC</th></tr></thead>
          <tbody>
            <tr v-for="r in recapMois" :key="r.client_id">
              <td class="font-medium text-slate-200">{{ r.nom_prenom }}</td>
              <td class="text-right font-mono text-sky-400">{{ r.consommation }}</td>
              <td class="text-right font-mono text-slate-300">{{ fmt(r.montant_ttc) }} Ar</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Actions rapides -->
    <div class="glass-card p-5">
      <h2 class="text-sm font-semibold text-white mb-4">Actions Rapides</h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NuxtLink to="/releves/nouveau" class="action-card bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20">
          <div class="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center mb-2">
            <svg class="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          </div>
          <span class="text-xs font-medium text-sky-300">Nouveau Relevé</span>
        </NuxtLink>
        <NuxtLink to="/clients/nouveau" class="action-card bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-2">
            <svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
          </div>
          <span class="text-xs font-medium text-emerald-300">Nouveau Client</span>
        </NuxtLink>
        <NuxtLink to="/recap" class="action-card bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20">
          <div class="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center mb-2">
            <svg class="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </div>
          <span class="text-xs font-medium text-violet-300">Récapitulatif</span>
        </NuxtLink>
        <NuxtLink to="/factures" class="action-card bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20">
          <div class="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mb-2">
            <svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </div>
          <span class="text-xs font-medium text-amber-300">Factures</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const loading = ref(true)
const loadingF = ref(true)
const loadingR = ref(true)

const mois = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const now = new Date()
const moisActuel = computed(() => `${mois[now.getMonth()]} ${now.getFullYear()}`)

const stats = ref({ clients: 0, releves: 0, ttc: 0, impaye: 0 })
const facturesImpayes = ref([])
const recapMois = ref([])

function fmt(v) { return v ? Math.round(v).toLocaleString('fr-FR') : '0' }

const kpis = computed(() => [
  { label: 'Clients Actifs', value: stats.value.clients, badge: 'Total', bg: 'rgba(14,165,233,0.05)', border: 'rgba(14,165,233,0.15)', iconBg: 'rgba(14,165,233,0.15)', iconClass: 'w-5 h-5 text-sky-400', badgeBg: 'rgba(14,165,233,0.1)', badgeColor: '#38bdf8', icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>` },
  { label: 'Relevés ce mois', value: stats.value.releves, badge: mois[now.getMonth()], bg: 'rgba(16,185,129,0.05)', border: 'rgba(16,185,129,0.15)', iconBg: 'rgba(16,185,129,0.15)', iconClass: 'w-5 h-5 text-emerald-400', badgeBg: 'rgba(16,185,129,0.1)', badgeColor: '#34d399', icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>` },
  { label: 'Total Facturé (Ar)', value: fmt(stats.value.ttc), badge: `${now.getFullYear()}`, bg: 'rgba(139,92,246,0.05)', border: 'rgba(139,92,246,0.15)', iconBg: 'rgba(139,92,246,0.15)', iconClass: 'w-5 h-5 text-violet-400', badgeBg: 'rgba(139,92,246,0.1)', badgeColor: '#a78bfa', icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>` },
  { label: 'Montant Impayé (Ar)', value: fmt(stats.value.impaye), badge: 'Impayées', bg: 'rgba(239,68,68,0.05)', border: 'rgba(239,68,68,0.15)', iconBg: 'rgba(239,68,68,0.15)', iconClass: 'w-5 h-5 text-red-400', badgeBg: 'rgba(239,68,68,0.1)', badgeColor: '#f87171', icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>` },
])

onMounted(async () => {
  const [{ count: c }, { data: rel }, { data: fac }] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('actif', true),
    supabase.from('releves').select('id').eq('annee', now.getFullYear()).eq('mois', now.getMonth()+1),
    supabase.from('factures').select('montant_ttc,statut').eq('annee', now.getFullYear()),
  ])
  stats.value = {
    clients: c || 0,
    releves: rel?.length || 0,
    ttc: (fac||[]).reduce((s,f) => s+(f.montant_ttc||0),0),
    impaye: (fac||[]).filter(f=>['IMPAYEE','PARTIELLE'].includes(f.statut)).reduce((s,f)=>s+(f.montant_ttc||0),0),
  }
  loading.value = false

  const { data: fi } = await supabase.from('factures').select('*,client:clients(nom_prenom)').in('statut',['IMPAYEE','PARTIELLE']).order('created_at',{ascending:false}).limit(5)
  facturesImpayes.value = fi || []
  loadingF.value = false

  try {
    const { data: rc } = await supabase.from('v_recap_consommations').select('*').eq('annee',now.getFullYear()).eq('mois',now.getMonth()+1)
    recapMois.value = rc || []
  } catch { recapMois.value = [] }
  loadingR.value = false
})
</script>

<style scoped>
.action-card { @apply flex flex-col items-center p-4 rounded-xl border transition-all text-center cursor-pointer; }
</style>
