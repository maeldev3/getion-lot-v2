<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3">
      <select v-model.number="filterAnnee" class="form-select w-auto" @change="fetchData">
        <option v-for="a in annees" :key="a" :value="a">{{ a }}</option>
      </select>
      <select v-model.number="filterMois" class="form-select w-auto" @change="fetchData">
        <option value="">Tous les mois</option>
        <option v-for="(m,i) in moisNoms" :key="i+1" :value="i+1">{{ m }}</option>
      </select>
      <select v-model="filterStatut" class="form-select w-auto" @change="fetchData">
        <option value="">Tous statuts</option>
        <option value="IMPAYEE">Impayée</option>
        <option value="PAYEE">Payée</option>
        <option value="PARTIELLE">Partielle</option>
        <option value="ANNULEE">Annulée</option>
      </select>
      <div class="flex-1"></div>
      <button @click="exportExcel" class="btn-secondary">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        Export Excel
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-3">
      <div class="glass-card p-4 text-center">
        <div class="text-xl font-bold text-white font-mono">{{ fmt(totalTTC) }}</div>
        <div class="text-xs text-slate-500 mt-1">Total TTC (Ar)</div>
      </div>
      <div class="glass-card p-4 text-center">
        <div class="text-xl font-bold text-emerald-400 font-mono">{{ fmt(totalPaye) }}</div>
        <div class="text-xs text-slate-500 mt-1">Total Payé (Ar)</div>
      </div>
      <div class="glass-card p-4 text-center">
        <div class="text-xl font-bold text-red-400 font-mono">{{ fmt(totalImpaye) }}</div>
        <div class="text-xs text-slate-500 mt-1">Reste à Percevoir (Ar)</div>
      </div>
    </div>

    <!-- Table -->
    <div class="glass-card overflow-hidden">
      <div v-if="loading" class="flex justify-center py-12"><div class="spinner"></div></div>
      <div v-else-if="!factures.length" class="text-center py-12 text-slate-600 text-sm">Aucune facture pour cette période.</div>
      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead><tr><th>N° Facture</th><th>Client</th><th>Période</th><th class="text-right">Conso (m³)</th><th class="text-right">Total TTC</th><th class="text-right">Payé</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="f in factures" :key="f.id">
              <td class="font-mono text-xs text-sky-400">{{ f.numero_facture }}</td>
              <td>
                <div class="font-medium text-slate-200">{{ f.client?.nom_prenom }}</div>
                <div class="text-xs text-slate-600">{{ f.client?.zone?.name }}</div>
              </td>
              <td class="text-xs text-slate-400">{{ moisNoms[f.mois-1] }} {{ f.annee }}</td>
              <td class="text-right font-mono">{{ f.consommation_m3 }}</td>
              <td class="text-right font-mono font-semibold">{{ fmt(f.montant_ttc) }} Ar</td>
              <td class="text-right font-mono text-emerald-400">{{ fmt(f.montant_paye) }} Ar</td>
              <td><span class="text-xs px-2 py-0.5 rounded-full" :class="statutClass(f.statut)">{{ f.statut }}</span></td>
              <td>
                <div class="flex items-center gap-1">
                  <button v-if="!['PAYEE','ANNULEE'].includes(f.statut)" @click="ouvrirPaiement(f)"
                    class="icon-btn text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10" title="Enregistrer paiement">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                  </button>
                  <button @click="dlPDF(f)" class="icon-btn text-slate-500 hover:text-sky-400 hover:bg-sky-500/10" title="Télécharger PDF">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </button>
                  <button v-if="f.statut!=='ANNULEE'" @click="annulerFacture(f)"
                    class="icon-btn text-slate-500 hover:text-red-400 hover:bg-red-500/10" title="Annuler facture">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- PAIEMENT MODAL -->
    <div v-if="paiementModal" class="modal-overlay" @click.self="paiementModal=null">
      <div class="modal-content p-6 max-w-md">
        <h2 class="text-lg font-bold text-white mb-4">Enregistrer un Paiement</h2>
        <div class="bg-slate-800 rounded-xl p-4 mb-4 text-sm space-y-1.5">
          <div class="flex justify-between"><span class="text-slate-400">Client</span><span class="font-medium text-slate-200">{{ paiementModal.client?.nom_prenom }}</span></div>
          <div class="flex justify-between"><span class="text-slate-400">Facture</span><span class="font-mono text-sky-400">{{ paiementModal.numero_facture }}</span></div>
          <div class="flex justify-between"><span class="text-slate-400">Total TTC</span><span class="font-mono font-semibold">{{ fmt(paiementModal.montant_ttc) }} Ar</span></div>
          <div class="flex justify-between"><span class="text-slate-400">Déjà payé</span><span class="font-mono text-emerald-400">{{ fmt(paiementModal.montant_paye) }} Ar</span></div>
          <div class="flex justify-between border-t border-slate-700 pt-1.5"><span class="text-slate-300 font-medium">Reste à payer</span><span class="font-mono font-bold text-red-400">{{ fmt(resteAPayer) }} Ar</span></div>
        </div>
        <div class="space-y-3">
          <div>
            <label class="form-label">Montant à Payer (Ar) *</label>
            <input v-model.number="pForm.montant" type="number" class="form-input font-mono" :placeholder="`${resteAPayer} Ar`" :max="resteAPayer" required min="1"/>
          </div>
          <div>
            <label class="form-label">Mode de Paiement</label>
            <select v-model="pForm.mode" class="form-select">
              <option value="ESPECES">Espèces</option>
              <option value="VIREMENT">Virement bancaire</option>
              <option value="CHEQUE">Chèque</option>
              <option value="MOBILE">Mobile Money</option>
            </select>
          </div>
          <div>
            <label class="form-label">Référence / N° Reçu</label>
            <input v-model="pForm.reference" type="text" class="form-input" placeholder="Numéro de reçu, référence..."/>
          </div>
        </div>
        <div v-if="pError" class="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{{ pError }}</div>
        <div class="flex gap-3 mt-5">
          <button @click="confirmerPaiement" :disabled="loadingP" class="btn-success flex-1 justify-center">
            <div v-if="loadingP" class="spinner !w-4 !h-4"></div>
            <span>Confirmer le Paiement</span>
          </button>
          <button @click="paiementModal=null" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const { downloadFacture } = useFacturePDF()
const { exportFactures } = useExcelExport()

const moisNoms = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const now = new Date()
const annees = Array.from({length:5},(_,i)=>now.getFullYear()-2+i)

const filterAnnee = ref(now.getFullYear())
const filterMois = ref('')
const filterStatut = ref(useRoute().query.statut||'')
const loading = ref(true)
const factures = ref([])
const paiementModal = ref(null)
const pForm = reactive({ montant:'', mode:'ESPECES', reference:'' })
const pError = ref('')
const loadingP = ref(false)

const totalTTC = computed(()=>factures.value.reduce((s,f)=>s+(f.montant_ttc||0),0))
const totalPaye = computed(()=>factures.value.reduce((s,f)=>s+(f.montant_paye||0),0))
const totalImpaye = computed(()=>totalTTC.value-totalPaye.value)
const resteAPayer = computed(()=>paiementModal.value?(paiementModal.value.montant_ttc||0)-(paiementModal.value.montant_paye||0):0)

function fmt(v){return v?Math.round(v).toLocaleString('fr-FR'):'0'}
function statutClass(s){ return {PAYEE:'badge-payee',IMPAYEE:'badge-impayee',PARTIELLE:'badge-partielle',ANNULEE:'badge-annulee'}[s]||'badge-annulee' }

async function fetchData() {
  loading.value=true
  let q=supabase.from('factures').select('*,client:clients(id,numero,nom_prenom,zone:zones(name))').eq('annee',filterAnnee.value).order('mois',{ascending:false})
  if (filterMois.value) q=q.eq('mois',filterMois.value)
  if (filterStatut.value) q=q.eq('statut',filterStatut.value)
  const { data }=await q; factures.value=data||[]; loading.value=false
}

function ouvrirPaiement(f) {
  paiementModal.value=f; pForm.montant=resteAPayer.value; pForm.mode='ESPECES'; pForm.reference=''; pError.value=''
}

async function confirmerPaiement() {
  if (!pForm.montant||pForm.montant<=0) return
  loadingP.value=true; pError.value=''
  try {
    const f=paiementModal.value
    const newPaye=(f.montant_paye||0)+Number(pForm.montant)
    const statut=newPaye>=f.montant_ttc?'PAYEE':'PARTIELLE'
    const { error: fErr }=await supabase.from('factures').update({ montant_paye:newPaye, statut, date_paiement:new Date().toISOString() }).eq('id',f.id)
    if (fErr) throw fErr
    const { error: pErr }=await supabase.from('paiements').insert({ facture_id:f.id, client_id:f.client_id, montant:pForm.montant, mode_paiement:pForm.mode, reference_paiement:pForm.reference||null })
    if (pErr) throw pErr
    paiementModal.value=null; fetchData()
  } catch(e){ pError.value=e.message } finally { loadingP.value=false }
}

async function dlPDF(f) {
  const { data: client }=await supabase.from('clients').select('*').eq('id',f.client_id).single()
  await downloadFacture(f, client)
}

async function annulerFacture(f) {
  if (!confirm(`Annuler la facture ${f.numero_facture} ?`)) return
  await supabase.from('factures').update({ statut:'ANNULEE' }).eq('id',f.id)
  fetchData()
}

async function exportExcel() { await exportFactures(factures.value, filterMois.value||now.getMonth()+1, filterAnnee.value) }

onMounted(fetchData)
</script>
<style scoped>
.icon-btn { @apply p-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center; }
</style>
