<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Agency Settings -->
    <div class="glass-card p-6">
      <h2 class="text-base font-semibold text-white font-display mb-5">Informations de l'Agence</h2>
      <form @submit.prevent="saveAgency" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Nom de l'Agence</label>
            <input v-model="agency.name" type="text" class="form-input"/>
          </div>
          <div>
            <label class="form-label">Code</label>
            <input v-model="agency.code" type="text" class="form-input font-mono"/>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Téléphone</label>
            <input v-model="agency.phone" type="text" class="form-input"/>
          </div>
          <div>
            <label class="form-label">Email</label>
            <input v-model="agency.email" type="email" class="form-input"/>
          </div>
        </div>
        <div>
          <label class="form-label">Adresse</label>
          <input v-model="agency.address" type="text" class="form-input"/>
        </div>
        <button type="submit" :disabled="loadingAgency" class="btn-primary">
          <div v-if="loadingAgency" class="spinner !w-4 !h-4"></div>
          <span>Sauvegarder</span>
        </button>
        <span v-if="agencySuccess" class="text-emerald-400 text-sm ml-3">✓ Sauvegardé</span>
      </form>
    </div>

    <!-- Tariff Settings -->
    <div class="glass-card p-6">
      <h2 class="text-base font-semibold text-white font-display mb-5">Tarification</h2>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Prix Unitaire (Ar/m³)</label>
            <input v-model.number="tariff.prix_unitaire" type="number" class="form-input font-mono"/>
          </div>
          <div>
            <label class="form-label">Seuil Sur-consommation (m³)</label>
            <input v-model.number="tariff.seuil_surconsommation" type="number" step="0.001" class="form-input font-mono"/>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Taux Sur-consommation (%)</label>
            <input v-model.number="tariff.taux_surco_pct" type="number" step="0.1" class="form-input font-mono"/>
          </div>
          <div>
            <label class="form-label">Taux Redevances (%)</label>
            <input v-model.number="tariff.taux_redv_pct" type="number" step="0.1" class="form-input font-mono"/>
          </div>
        </div>
        <div class="bg-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-1">
          <p>• Redevance Renouvellement : {{ tariff.taux_redv_pct }}%</p>
          <p>• Redevance Assainissement : {{ tariff.taux_redv_pct }}%</p>
          <p>• Redevance Branchement Social : {{ tariff.taux_redv_pct }}%</p>
          <p>• Taxe et Surtaxe Communales : {{ tariff.taux_redv_pct }}%</p>
          <p>• Total Taxes : {{ tariff.taux_redv_pct * 4 }}%</p>
          <p>• Sur-consommation (au-delà de {{ tariff.seuil_surconsommation }} m³) : {{ tariff.taux_surco_pct }}%</p>
        </div>
        <button @click="saveTariff" :disabled="loadingTariff" class="btn-primary">
          <div v-if="loadingTariff" class="spinner !w-4 !h-4"></div>
          <span>Sauvegarder Tarifs</span>
        </button>
        <span v-if="tariffSuccess" class="text-emerald-400 text-sm ml-3">✓ Sauvegardé</span>
      </div>
    </div>

    <!-- Zones -->
    <div class="glass-card p-6">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-base font-semibold text-white font-display">Zones / Secteurs</h2>
        <button @click="addZone" class="btn-primary py-1.5 px-3 text-xs">+ Ajouter</button>
      </div>
      <div class="space-y-2">
        <div v-for="zone in zones" :key="zone.id" class="flex items-center gap-3 p-3 bg-slate-800 rounded-xl">
          <div class="flex-1">
            <div class="text-sm font-medium text-slate-200">{{ zone.name }}</div>
            <div class="text-xs font-mono text-slate-500">{{ zone.code }}</div>
          </div>
          <button @click="deleteZone(zone.id)" class="text-slate-600 hover:text-red-400 transition-colors p-1">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- New Zone Modal -->
    <div v-if="showZoneModal" class="modal-overlay" @click.self="showZoneModal = false">
      <div class="modal-content p-6 max-w-sm">
        <h3 class="text-base font-bold text-white mb-4">Nouvelle Zone</h3>
        <div class="space-y-3">
          <div>
            <label class="form-label">Nom</label>
            <input v-model="newZone.name" type="text" class="form-input" placeholder="Secteur Madiorano"/>
          </div>
          <div>
            <label class="form-label">Code</label>
            <input v-model="newZone.code" type="text" class="form-input font-mono" placeholder="MDR"/>
          </div>
        </div>
        <div class="flex gap-3 mt-4">
          <button @click="saveZone" class="btn-primary flex-1 justify-center">Créer</button>
          <button @click="showZoneModal = false" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()

const agency = reactive({ name: '', code: '', phone: '', email: '', address: '' })
const tariff = reactive({ prix_unitaire: 1400, seuil_surconsommation: 10, taux_surco_pct: 20, taux_redv_pct: 2 })
const zones = ref([])
const loadingAgency = ref(false)
const loadingTariff = ref(false)
const agencySuccess = ref(false)
const tariffSuccess = ref(false)
const showZoneModal = ref(false)
const newZone = reactive({ name: '', code: '' })

onMounted(async () => {
  const { data: ag } = await supabase.from('agencies').select('*').limit(1).single()
  if (ag) Object.assign(agency, ag)

  const { data: ta } = await supabase.from('tariffs').select('*').eq('actif', true).limit(1).single()
  if (ta) {
    tariff.prix_unitaire = ta.prix_unitaire
    tariff.seuil_surconsommation = ta.seuil_surconsommation
    tariff.taux_surco_pct = ta.taux_surconsommation * 100
    tariff.taux_redv_pct = ta.taux_redevance_renouvellement * 100
  }

  const { data: zs } = await supabase.from('zones').select('*').order('name')
  zones.value = zs || []
})

async function saveAgency() {
  loadingAgency.value = true
  await supabase.from('agencies').update(agency).eq('id', agency.id)
  loadingAgency.value = false
  agencySuccess.value = true
  setTimeout(() => agencySuccess.value = false, 3000)
}

async function saveTariff() {
  loadingTariff.value = true
  await supabase.from('tariffs').update({
    prix_unitaire: tariff.prix_unitaire,
    seuil_surconsommation: tariff.seuil_surconsommation,
    taux_surconsommation: tariff.taux_surco_pct / 100,
    taux_redevance_renouvellement: tariff.taux_redv_pct / 100,
    taux_assainissement: tariff.taux_redv_pct / 100,
    taux_branchement_social: tariff.taux_redv_pct / 100,
    taux_taxe_communale: tariff.taux_redv_pct / 100,
  }).eq('actif', true)
  loadingTariff.value = false
  tariffSuccess.value = true
  setTimeout(() => tariffSuccess.value = false, 3000)
}

function addZone() {
  newZone.name = ''; newZone.code = ''
  showZoneModal.value = true
}

async function saveZone() {
  const { data: ag } = await supabase.from('agencies').select('id').limit(1).single()
  await supabase.from('zones').insert({ name: newZone.name, code: newZone.code.toUpperCase(), agency_id: ag.id })
  const { data: zs } = await supabase.from('zones').select('*').order('name')
  zones.value = zs || []
  showZoneModal.value = false
}

async function deleteZone(id) {
  if (!confirm('Supprimer cette zone ?')) return
  await supabase.from('zones').delete().eq('id', id)
  zones.value = zones.value.filter(z => z.id !== id)
}
</script>
