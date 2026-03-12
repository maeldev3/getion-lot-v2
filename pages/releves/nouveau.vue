<template>
  <div class="max-w-4xl mx-auto space-y-5">
    <div class="flex items-center gap-3">
      <NuxtLink to="/releves" class="icon-btn text-slate-500 hover:text-slate-300">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </NuxtLink>
      <h1 class="text-xl font-bold text-white">Nouveau Relevé de Compteur</h1>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <!-- FORM -->
      <form @submit.prevent="handleSubmit" class="lg:col-span-3 glass-card p-6 space-y-4">
        <div>
          <label class="form-label">Client *</label>
          <select v-model="form.client_id" class="form-select" required @change="onClientChange">
            <option value="">— Sélectionner un client —</option>
            <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.numero }}. {{ c.nom_prenom }} ({{ c.ref_compteur || 'sans compteur' }})</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Année *</label>
            <select v-model.number="form.annee" class="form-select" required>
              <option v-for="a in annees" :key="a" :value="a">{{ a }}</option>
            </select>
          </div>
          <div>
            <label class="form-label">Mois *</label>
            <select v-model.number="form.mois" class="form-select" required>
              <option v-for="(m,i) in moisNoms" :key="i+1" :value="i+1">{{ m }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Ancien Index (m³) *</label>
            <input v-model.number="form.ancien_index" type="number" step="0.001" class="form-input font-mono" required placeholder="0.000" min="0" @input="calculer"/>
          </div>
          <div>
            <label class="form-label">Nouvel Index (m³) *</label>
            <input v-model.number="form.nouvel_index" type="number" step="0.001" class="form-input font-mono" required placeholder="0.000" min="0" @input="calculer"/>
          </div>
        </div>

        <!-- Conso live -->
        <div v-if="conso !== null" class="flex items-center justify-between p-3 rounded-xl border" :class="conso>=0?'bg-sky-500/10 border-sky-500/20':'bg-red-500/10 border-red-500/20'">
          <span class="text-sm text-slate-400">Consommation calculée</span>
          <span class="font-mono font-bold text-lg" :class="conso>=0?'text-sky-400':'text-red-400'">{{ conso?.toFixed(3) }} m³</span>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Date de Relevé</label>
            <input v-model="form.date_releve" type="date" class="form-input"/>
          </div>
          <div>
            <label class="form-label">Date Limite Paiement</label>
            <input v-model="form.date_limite" type="date" class="form-input"/>
          </div>
        </div>

        <div>
          <label class="form-label">Observation</label>
          <input v-model="form.observation" type="text" class="form-input" placeholder="Remarques..."/>
        </div>

        <div v-if="error" class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{{ error }}</div>

        <button type="submit" :disabled="loading || conso===null || conso<0" class="btn-primary w-full justify-center py-3">
          <div v-if="loading" class="spinner !w-4 !h-4"></div>
          <span v-else>Enregistrer & Générer Facture</span>
        </button>
      </form>

      <!-- APERCU -->
      <div class="lg:col-span-2 space-y-4">
        <div class="glass-card p-5">
          <h3 class="text-sm font-semibold text-slate-300 mb-4">Aperçu de la Facture</h3>
          <div v-if="!calcul" class="text-center py-8 text-slate-600 text-xs">Entrez les index pour voir le calcul</div>
          <div v-else class="space-y-2 text-sm">
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-500">Consommation</span>
              <span class="font-mono text-slate-300">{{ conso?.toFixed(3) }} m³</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-500">Montant HT (×1 400)</span>
              <span class="font-mono">{{ fmt(calcul.ht) }} Ar</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-500">Redev. Renouvellement (2%)</span>
              <span class="font-mono">{{ fmt(calcul.r) }} Ar</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-500">Redev. Assainissement (2%)</span>
              <span class="font-mono">{{ fmt(calcul.r) }} Ar</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-500">Redev. Branchement (2%)</span>
              <span class="font-mono">{{ fmt(calcul.r) }} Ar</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-500">Taxe Communale (2%)</span>
              <span class="font-mono">{{ fmt(calcul.r) }} Ar</span>
            </div>
            <div v-if="calcul.surco>0" class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-amber-500">Sur-consommation (20%)</span>
              <span class="font-mono text-amber-400">{{ fmt(calcul.surco) }} Ar</span>
            </div>
            <div class="flex justify-between py-2 bg-sky-500/10 rounded-lg px-2 mt-1">
              <span class="font-semibold text-sky-300">TOTAL TTC</span>
              <span class="font-mono font-bold text-sky-400 text-base">{{ fmt(calcul.ttc) }} Ar</span>
            </div>
          </div>
        </div>
        <div v-if="selectedClient" class="glass-card p-4 text-xs space-y-1.5">
          <div class="text-slate-400 font-semibold mb-1">Informations Client</div>
          <div class="text-slate-200 font-medium">{{ selectedClient.nom_prenom }}</div>
          <div class="text-slate-500">Fokontany : {{ selectedClient.fokontany || '—' }}</div>
          <div class="text-slate-500">Compteur : {{ selectedClient.ref_compteur || '—' }}</div>
          <div class="text-slate-500">Code : {{ selectedClient.code_client || '—' }}</div>
          <div class="text-slate-500">Catégorie : {{ selectedClient.categorie }}</div>
        </div>
      </div>
    </div>

    <!-- SUCCESS MODAL -->
    <div v-if="showSuccess" class="modal-overlay" @click.self="fermerSuccess">
      <div class="modal-content p-8 text-center max-w-md">
        <div class="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h2 class="text-xl font-bold text-white mb-2">Relevé Enregistré !</h2>
        <p class="text-slate-400 text-sm mb-1">Facture <span class="text-sky-400 font-mono">{{ savedFacture?.numero_facture }}</span> générée.</p>
        <p class="text-lg font-bold text-sky-400 mb-6">{{ fmt(savedFacture?.montant_ttc) }} Ar</p>
        <div class="flex flex-wrap gap-2 justify-center">
          <button @click="telechargerPDF" class="btn-primary">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Télécharger PDF
          </button>
          <button @click="continuer" class="btn-secondary">Nouveau Relevé</button>
          <NuxtLink to="/factures" class="btn-secondary">Voir Factures</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const supabase = useSupabaseClient()
const { downloadFacture } = useFacturePDF()

const clients = ref([])
const loading = ref(false)
const error = ref('')
const showSuccess = ref(false)
const savedFacture = ref(null)
const savedClient = ref(null)
const calcul = ref(null)

const moisNoms = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const now = new Date()
const annees = Array.from({length:5},(_,i)=>now.getFullYear()-2+i)

const form = reactive({
  client_id: route.query.client_id || '',
  annee: now.getFullYear(),
  mois: now.getMonth()+1,
  ancien_index: '',
  nouvel_index: '',
  date_releve: now.toISOString().split('T')[0],
  date_limite: '',
  observation: '',
})

const conso = computed(() => {
  if (form.ancien_index==='' || form.nouvel_index==='') return null
  return Number(form.nouvel_index) - Number(form.ancien_index)
})

const selectedClient = computed(() => clients.value.find(c=>c.id===form.client_id))

function fmt(v) { return v!=null ? Math.round(v).toLocaleString('fr-FR') : '0' }

function calculer() {
  if (conso.value!==null && conso.value>=0) {
    const pu=1400, c=conso.value
    const ht=c*pu, r=ht*0.02, surco=c>10?(c-10)*pu*0.20:0
    calcul.value = { ht:Math.round(ht), r:Math.round(r), surco:Math.round(surco), ttc:Math.round(ht+r*4+surco) }
  } else calcul.value=null
}

async function onClientChange() {
  if (!form.client_id) return
  const { data } = await supabase.from('releves').select('nouvel_index').eq('client_id',form.client_id).order('annee',{ascending:false}).order('mois',{ascending:false}).limit(1).maybeSingle()
  if (data?.nouvel_index) { form.ancien_index=data.nouvel_index; calculer() }
}

async function handleSubmit() {
  if (!form.client_id||conso.value===null||conso.value<0) return
  loading.value=true; error.value=''
  try {
    const { data: releve, error: rErr } = await supabase.from('releves')
      .upsert({ client_id:form.client_id, annee:form.annee, mois:form.mois, ancien_index:form.ancien_index, nouvel_index:form.nouvel_index, date_releve:form.date_releve||null, date_limite_paiement:form.date_limite||null, observation:form.observation||null }, { onConflict:'client_id,annee,mois' })
      .select().single()
    if (rErr) throw rErr

    const num=`${String(selectedClient.value.numero).padStart(2,'0')}/${form.annee}`
    const cal=calcul.value
    const { data: facture, error: fErr } = await supabase.from('factures')
      .upsert({ releve_id:releve.id, client_id:form.client_id, numero_facture:num, annee:form.annee, mois:form.mois, consommation_m3:conso.value, prix_unitaire:1400, redevance_renouvellement:cal.r, redevance_assainissement:cal.r, redevance_branchement:cal.r, taxe_communale:cal.r, surconsommation:cal.surco, montant_ttc:cal.ttc, statut:'IMPAYEE' }, { onConflict:'releve_id' })
      .select().single()
    if (fErr) throw fErr

    savedFacture.value={...facture,releve}; savedClient.value=selectedClient.value; showSuccess.value=true
  } catch(e) { error.value=e.message } finally { loading.value=false }
}

async function telechargerPDF() {
  if (savedFacture.value&&savedClient.value) await downloadFacture(savedFacture.value,savedClient.value)
}

function continuer() {
  showSuccess.value=false; form.client_id=''; form.ancien_index=''; form.nouvel_index=''; form.observation=''; calcul.value=null
}
function fermerSuccess() { showSuccess.value=false }

onMounted(async () => {
  const { data } = await supabase.from('clients').select('id,numero,nom_prenom,ref_compteur,fokontany,categorie,ref_client,code_client').eq('actif',true).order('numero')
  clients.value=data||[]
  if (form.client_id) onClientChange()
})
</script>
<style scoped>
.icon-btn { @apply p-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center; }
</style>
