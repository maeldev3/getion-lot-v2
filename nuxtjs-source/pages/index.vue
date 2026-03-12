<!-- pages/index.vue — Tableau de Bord -->
<template>
  <div>
    <!-- Bannière bienvenue -->
    <div class="welcome-banner">
      <div class="welcome-icon">💧</div>
      <div class="welcome-content">
        <h2 class="welcome-title">Bienvenue, {{ auth.profile?.full_name }}</h2>
        <p class="welcome-sub">{{ auth.profile?.agence?.nom }} — {{ currentMonthLabel }} — Données en temps réel</p>
      </div>
      <NuxtLink to="/releves" class="welcome-btn">+ Saisir Relevés du Mois</NuxtLink>
    </div>

    <!-- Alerte impayés -->
    <div v-if="stats && stats.factures_impayees > 0" class="alert-card">
      <span class="alert-icon">⚠️</span>
      <div>
        <div class="alert-text">{{ stats.factures_impayees }} factures en retard — {{ formatMoney(stats.montant_impaye) }} Ar impayé</div>
        <div class="alert-sub">Cliquez pour voir les factures impayées</div>
      </div>
      <NuxtLink to="/factures?statut=retard" class="alert-link">Voir les factures →</NuxtLink>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Clients Actifs</div>
        <div class="kpi-value accent">{{ stats?.total_clients ?? '—' }}</div>
        <div class="kpi-sub">{{ auth.profile?.agence?.nom }}</div>
        <div class="kpi-icon">👥</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">Consommation du Mois</div>
        <div class="kpi-value green">{{ stats?.consommation_mois?.toFixed(1) ?? '—' }} m³</div>
        <div class="kpi-sub">{{ currentMonthLabel }}</div>
        <div class="kpi-icon">📊</div>
      </div>
      <div class="kpi-card gold">
        <div class="kpi-label">Revenus Facturés</div>
        <div class="kpi-value gold">{{ formatMoney(stats?.revenus_factures) }} Ar</div>
        <div class="kpi-sub">{{ stats?.factures_impayees ?? 0 }} impayés</div>
        <div class="kpi-icon">💰</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Taux de Recouvrement</div>
        <div class="kpi-value" :style="{ color: recouvColor }">{{ stats?.taux_recouvrement ?? 0 }}%</div>
        <div class="kpi-sub">Objectif: 90%</div>
        <div class="kpi-progress">
          <div class="kpi-progress-fill" :style="{ width: (stats?.taux_recouvrement ?? 0) + '%', background: recouvColor }"></div>
        </div>
        <div class="kpi-icon">🎯</div>
      </div>
    </div>

    <!-- Graphiques -->
    <div class="charts-row">
      <!-- Bar chart consommation -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Consommation Mensuelle {{ currentYear }}</div>
            <div class="card-sub">en m³ par mois</div>
          </div>
          <button class="card-btn" @click="exportChart">📥 Export</button>
        </div>
        <div class="card-body">
          <div class="chart-bars">
            <div v-for="(d, i) in chartData" :key="i" class="bar-wrap">
              <div
                class="bar"
                :class="{ inactive: d.consommation === 0, current: i + 1 === currentMonth }"
                :style="{ height: barHeight(d.consommation) + '%' }"
                :title="`${MOIS_NOMS[i + 1]}: ${d.consommation.toFixed(2)} m³`"
              ></div>
              <div class="bar-label">{{ MOIS_NOMS[i + 1]?.slice(0, 3).toUpperCase() }}</div>
            </div>
          </div>
          <div class="chart-stats">
            <div class="chart-stat">Total: <strong>{{ totalConso.toFixed(1) }} m³</strong></div>
            <div class="chart-stat">Moy/client: <strong>{{ moyParClient.toFixed(1) }} m³</strong></div>
            <div class="chart-stat">Tarif: <strong>1 400 Ar/m³</strong></div>
          </div>
        </div>
      </div>

      <!-- Donut paiements -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Statut Paiements</div>
            <div class="card-sub">{{ currentMonthLabel }}</div>
          </div>
        </div>
        <div class="card-body donut-body">
          <div class="donut-chart">
            <svg viewBox="0 0 100 100" class="donut-svg">
              <circle cx="50" cy="50" r="38" fill="none" stroke="var(--surface2)" stroke-width="14"/>
              <circle cx="50" cy="50" r="38" fill="none" stroke="var(--green)" stroke-width="14"
                :stroke-dasharray="`${payeArc} ${circumference}`" stroke-dashoffset="-25" stroke-linecap="round" transform="rotate(-90 50 50)"/>
            </svg>
            <div class="donut-center">
              <div class="donut-pct" :style="{ color: recouvColor }">{{ stats?.taux_recouvrement ?? 0 }}%</div>
              <div class="donut-lbl">payé</div>
            </div>
          </div>
          <div class="legend">
            <div class="legend-item"><div class="ld" style="background:var(--green)"></div>Payé <span>{{ stats ? Math.round((stats.revenus_recouvres / stats.revenus_factures) * stats.total_clients) || 0 : 0 }} clients</span></div>
            <div class="legend-item"><div class="ld" style="background:var(--gold)"></div>En attente <span>{{ stats?.factures_impayees ?? 0 }} clients</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top clients par consommation -->
    <div class="card" style="margin-top:20px;">
      <div class="card-header">
        <div class="card-title">Top Consommateurs — {{ currentMonthLabel }}</div>
        <NuxtLink to="/recapitulatif" class="card-link">Voir tout →</NuxtLink>
      </div>
      <div class="card-body" v-if="topClients.length">
        <div v-for="(c, i) in topClients" :key="c.client_id" class="top-client-row">
          <div class="tc-rank">#{{ i + 1 }}</div>
          <div class="tc-name">{{ c.nom_prenom }}</div>
          <div class="tc-bar-wrap">
            <div class="tc-bar" :style="{ width: (c.consommation_m3 / maxConso * 100) + '%' }"></div>
          </div>
          <div class="tc-val">{{ c.consommation_m3?.toFixed(3) }} m³</div>
          <div class="tc-amount">{{ formatMoney(c.total_ttc) }} Ar</div>
          <span class="status-badge" :class="c.statut_paiement">{{ statutLabel(c.statut_paiement) }}</span>
        </div>
      </div>
      <div v-else class="empty-state">Aucune donnée pour ce mois — saisir les relevés</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MOIS_NOMS } from '~/types'

definePageMeta({ middleware: ['auth'] })

const auth = useAuthStore()
const { stats, chartData, fetchStats } = useDashboard()
const { fetchRecap } = useRecapitulatif()

const currentDate = ref(new Date())
const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth() + 1)
const currentMonthLabel = computed(() =>
  currentDate.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
)

const topClients = ref<unknown[]>([])

const maxConso = computed(() => Math.max(...(topClients.value as Record<string, unknown>[]).map((c) => (c.consommation_m3 as number) ?? 0), 1))
const totalConso = computed(() => chartData.value.reduce((s, d) => s + ((d as Record<string, unknown>).consommation as number), 0))
const moyParClient = computed(() => stats.value && (stats.value as Record<string, unknown>).total_clients ? totalConso.value / ((stats.value as Record<string, unknown>).total_clients as number) : 0)
const barHeight = (val: number) => {
  const max = Math.max(...chartData.value.map(d => (d as Record<string, unknown>).consommation as number), 1)
  return Math.max((val / max) * 100, 3)
}
const circumference = 2 * Math.PI * 38
const payeArc = computed(() => ((stats.value as Record<string, unknown>)?.taux_recouvrement as number ?? 0) / 100 * circumference)
const recouvColor = computed(() => {
  const t = ((stats.value as Record<string, unknown>)?.taux_recouvrement as number) ?? 0
  if (t >= 90) return 'var(--green)'
  if (t >= 70) return 'var(--gold)'
  return 'var(--red)'
})

function formatMoney(val?: number) {
  if (!val) return '0'
  return Math.round(val).toLocaleString('fr-FR')
}
function statutLabel(s: string) {
  return { paye: 'Payé', en_attente: 'En attente', retard: 'En retard', non_facture: 'Non facturé' }[s] ?? s
}
function exportChart() { /* todo: export image */ }

onMounted(async () => {
  await fetchStats(currentYear.value, currentMonth.value)
  const recap = await fetchRecap(currentYear.value, currentMonth.value)
  topClients.value = [...(recap as unknown[])].sort((a, b) =>
    ((b as Record<string, unknown>).consommation_m3 as number) - ((a as Record<string, unknown>).consommation_m3 as number)
  ).slice(0, 5)
})
</script>

<style scoped>
.welcome-banner {
  background: linear-gradient(135deg, rgba(0,180,216,0.12), rgba(0,119,182,0.06));
  border: 1px solid rgba(0,180,216,0.2); border-radius: 16px;
  padding: 22px 28px; margin-bottom: 24px;
  display: flex; align-items: center; gap: 18px;
}
.welcome-icon { font-size: 36px; }
.welcome-title { font-size: 18px; font-weight: 800; }
.welcome-sub { font-size: 12px; color: var(--text2); margin-top: 2px; }
.welcome-btn {
  margin-left: auto; background: linear-gradient(135deg, var(--accent), var(--accent2));
  color: #000; font-weight: 700; padding: 10px 18px; border-radius: 10px; font-size: 13px;
  white-space: nowrap;
}
.alert-card {
  display: flex; align-items: center; gap: 14px;
  background: rgba(239,71,111,0.08); border: 1px solid rgba(239,71,111,0.2);
  border-radius: 12px; padding: 14px 20px; margin-bottom: 24px;
}
.alert-icon { font-size: 20px; }
.alert-text { font-size: 13px; font-weight: 600; color: var(--red); }
.alert-sub { font-size: 11px; color: var(--text3); margin-top: 2px; }
.alert-link { margin-left: auto; font-size: 12px; color: var(--accent); }

.kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 18px; margin-bottom: 24px; }
.kpi-card {
  background: var(--surface); border: 1px solid var(--border2); border-radius: 14px;
  padding: 22px; position: relative; overflow: hidden; transition: transform 0.2s;
}
.kpi-card::after { content:''; position:absolute; top:0; left:0; right:0; height:2px; background: linear-gradient(90deg, var(--accent), transparent); }
.kpi-card.green::after { background: linear-gradient(90deg, var(--green), transparent); }
.kpi-card.gold::after { background: linear-gradient(90deg, var(--gold), transparent); }
.kpi-card:hover { transform: translateY(-2px); }
.kpi-label { font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: 1.5px; font-family: var(--mono); margin-bottom: 10px; }
.kpi-value { font-size: 30px; font-weight: 800; letter-spacing: -1px; }
.kpi-value.accent { color: var(--accent3); }
.kpi-value.green { color: var(--green); }
.kpi-value.gold { color: var(--gold); }
.kpi-sub { font-size: 11px; color: var(--text3); margin-top: 5px; font-family: var(--mono); }
.kpi-icon { position: absolute; top:18px; right:18px; font-size: 26px; opacity: 0.12; }
.kpi-progress { height: 3px; background: var(--surface2); border-radius: 2px; margin-top: 10px; overflow: hidden; }
.kpi-progress-fill { height: 100%; border-radius: 2px; transition: width 1s ease; }

.charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 18px; }
.card { background: var(--surface); border: 1px solid var(--border2); border-radius: 14px; overflow: hidden; }
.card-header { padding: 18px 22px 0; display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 14px; font-weight: 600; }
.card-sub { font-size: 11px; color: var(--text3); font-family: var(--mono); }
.card-link { font-size: 12px; color: var(--accent); }
.card-btn { background: var(--surface2); border: 1px solid var(--border); color: var(--text2); padding: 5px 12px; border-radius: 7px; font-size: 11px; cursor: pointer; font-family: var(--sans); }
.card-body { padding: 18px 22px 22px; }
.chart-bars { display: flex; align-items: flex-end; gap: 6px; height: 130px; }
.bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; height: 100%; justify-content: flex-end; }
.bar { width: 100%; border-radius: 3px 3px 0 0; background: linear-gradient(180deg, var(--accent3), var(--accent2)); transition: all 0.3s; cursor: pointer; }
.bar:hover { filter: brightness(1.2); }
.bar.inactive { background: linear-gradient(180deg, #1a3a5c, #0e2a45); }
.bar.current { background: linear-gradient(180deg, var(--gold), #c77c3a); }
.bar-label { font-size: 8px; color: var(--text3); font-family: var(--mono); }
.chart-stats { display: flex; gap: 18px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border2); }
.chart-stat { font-size: 11px; color: var(--text3); }
.chart-stat strong { color: var(--text); font-family: var(--mono); }

.donut-body { display: flex; flex-direction: column; align-items: center; }
.donut-chart { position: relative; width: 100px; height: 100px; margin-bottom: 16px; }
.donut-svg { width: 100%; height: 100%; }
.donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.donut-pct { font-size: 20px; font-weight: 800; }
.donut-lbl { font-size: 9px; color: var(--text3); font-family: var(--mono); }
.legend { width: 100%; display: flex; flex-direction: column; gap: 8px; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text2); }
.ld { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.legend-item span { margin-left: auto; font-family: var(--mono); }

.top-client-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border2); }
.top-client-row:last-child { border-bottom: none; }
.tc-rank { font-size: 11px; color: var(--text3); font-family: var(--mono); width: 24px; }
.tc-name { font-size: 13px; font-weight: 600; width: 200px; }
.tc-bar-wrap { flex: 1; height: 4px; background: var(--surface2); border-radius: 2px; overflow: hidden; }
.tc-bar { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent3)); border-radius: 2px; }
.tc-val { font-size: 12px; color: var(--accent3); font-family: var(--mono); width: 80px; text-align: right; }
.tc-amount { font-size: 12px; color: var(--gold); font-family: var(--mono); width: 90px; text-align: right; }
.status-badge { font-size: 9px; font-weight: 600; padding: 2px 8px; border-radius: 20px; font-family: var(--mono); }
.status-badge.paye { background: rgba(6,214,160,0.12); color: var(--green); }
.status-badge.en_attente { background: rgba(244,162,97,0.12); color: var(--gold); }
.status-badge.retard { background: rgba(239,71,111,0.12); color: var(--red); }
.empty-state { text-align: center; padding: 32px; color: var(--text3); font-size: 13px; }

@media (max-width: 1100px) {
  .kpi-grid { grid-template-columns: repeat(2,1fr); }
  .charts-row { grid-template-columns: 1fr; }
}
</style>
