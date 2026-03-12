<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div class="flex items-center gap-3">
      <NuxtLink :to="`/clients/${route.params.id}`" class="text-slate-500 hover:text-slate-300 transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </NuxtLink>
      <h1 class="text-xl font-bold text-white font-display">Modifier le Client</h1>
    </div>

    <form v-if="!loading" @submit.prevent="handleSubmit" class="glass-card p-6 space-y-5">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">N° Client *</label>
          <input v-model.number="form.numero" type="number" class="form-input" required min="1"/>
        </div>
        <div>
          <label class="form-label">Catégorie</label>
          <select v-model="form.categorie" class="form-select">
            <option value="BP">BP</option><option value="BF">BF</option>
            <option value="COMMERCIAL">Commercial</option><option value="INDUSTRIEL">Industriel</option>
          </select>
        </div>
      </div>
      <div>
        <label class="form-label">Nom & Prénom *</label>
        <input v-model="form.nom_prenom" type="text" class="form-input" required/>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Zone / Secteur</label>
          <select v-model="form.zone_id" class="form-select">
            <option value="">Sélectionner...</option>
            <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
          </select>
        </div>
        <div>
          <label class="form-label">Fokontany</label>
          <input v-model="form.fokontany" type="text" class="form-input"/>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Réf. Client</label>
          <input v-model="form.ref_client" type="text" class="form-input font-mono"/>
        </div>
        <div>
          <label class="form-label">Code Client</label>
          <input v-model="form.code_client" type="text" class="form-input font-mono"/>
        </div>
      </div>
      <div>
        <label class="form-label">Réf. Compteur</label>
        <input v-model="form.ref_compteur" type="text" class="form-input font-mono"/>
      </div>
      <div class="flex items-center gap-2">
        <input v-model="form.actif" type="checkbox" id="actif" class="w-4 h-4 rounded bg-slate-800 border-slate-600"/>
        <label for="actif" class="text-sm text-slate-400">Client Actif</label>
      </div>
      <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{{ error }}</div>
      <div class="flex gap-3">
        <button type="submit" :disabled="saving" class="btn-primary">
          <div v-if="saving" class="spinner !w-4 !h-4"></div>
          <span>Sauvegarder</span>
        </button>
        <NuxtLink :to="`/clients/${route.params.id}`" class="btn-secondary">Annuler</NuxtLink>
      </div>
    </form>
    <div v-else class="flex justify-center py-12"><div class="spinner"></div></div>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()

const zones = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const form = reactive({
  numero: '', nom_prenom: '', categorie: 'BP', zone_id: '',
  fokontany: '', adresse: '', ref_client: '', code_client: '',
  ref_compteur: '', actif: true
})

onMounted(async () => {
  const [{ data: client }, { data: zData }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', route.params.id).single(),
    supabase.from('zones').select('*').order('name')
  ])
  if (client) Object.assign(form, { ...client, zone_id: client.zone_id || '' })
  zones.value = zData || []
  loading.value = false
})

async function handleSubmit() {
  saving.value = true
  error.value = ''
  try {
    const payload = { ...form }
    if (!payload.zone_id) payload.zone_id = null
    const { error: err } = await supabase.from('clients').update(payload).eq('id', route.params.id)
    if (err) throw err
    router.push(`/clients/${route.params.id}`)
  } catch(e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>
