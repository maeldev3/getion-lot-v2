<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div class="flex items-center gap-3">
      <NuxtLink to="/clients" class="text-slate-500 hover:text-slate-300 transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </NuxtLink>
      <h1 class="text-xl font-bold text-white font-display">
        {{ isEdit ? 'Modifier le Client' : 'Nouveau Client' }}
      </h1>
    </div>

    <form @submit.prevent="handleSubmit" class="glass-card p-6 space-y-5">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">N° Client *</label>
          <input v-model.number="form.numero" type="number" class="form-input" required min="1"/>
        </div>
        <div>
          <label class="form-label">Catégorie</label>
          <select v-model="form.categorie" class="form-select">
            <option value="BP">BP (Branchement Privé)</option>
            <option value="BF">BF (Borne Fontaine)</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="INDUSTRIEL">Industriel</option>
          </select>
        </div>
      </div>

      <div>
        <label class="form-label">Nom & Prénom *</label>
        <input v-model="form.nom_prenom" type="text" class="form-input" required placeholder="ex: BOTOLAHADY Remi"/>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Zone / Secteur</label>
          <select v-model="form.zone_id" class="form-select">
            <option value="">Sélectionner une zone</option>
            <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
          </select>
        </div>
        <div>
          <label class="form-label">Fokontany</label>
          <input v-model="form.fokontany" type="text" class="form-input" placeholder="ex: Fiherenana"/>
        </div>
      </div>

      <div>
        <label class="form-label">Adresse</label>
        <input v-model="form.adresse" type="text" class="form-input" placeholder="Adresse complète"/>
      </div>

      <div class="border-t border-slate-800 pt-4">
        <h3 class="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">Informations Compteur</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Réf. Client</label>
            <input v-model="form.ref_client" type="text" class="form-input font-mono" placeholder="2019/08/21/MDR/3"/>
          </div>
          <div>
            <label class="form-label">Code Client</label>
            <input v-model="form.code_client" type="text" class="form-input font-mono" placeholder="3/MDR/BP"/>
          </div>
        </div>
        <div class="mt-4">
          <label class="form-label">Réf. Compteur</label>
          <input v-model="form.ref_compteur" type="text" class="form-input font-mono" placeholder="012 689 23"/>
        </div>
        <div class="mt-4">
          <label class="form-label">Date de Branchement</label>
          <input v-model="form.date_branchement" type="date" class="form-input"/>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <input v-model="form.actif" type="checkbox" id="actif" class="w-4 h-4 rounded bg-slate-800 border-slate-600"/>
        <label for="actif" class="text-sm text-slate-400">Client Actif</label>
      </div>

      <!-- Error -->
      <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
        {{ error }}
      </div>

      <div class="flex gap-3 pt-2">
        <button type="submit" :disabled="loading" class="btn-primary">
          <div v-if="loading" class="spinner !w-4 !h-4"></div>
          <span>{{ isEdit ? 'Sauvegarder' : 'Créer le Client' }}</span>
        </button>
        <NuxtLink to="/clients" class="btn-secondary">Annuler</NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()

const isEdit = computed(() => route.path.includes('/edit'))
const clientId = computed(() => route.params.id)

const zones = ref([])
const loading = ref(false)
const error = ref('')

const form = reactive({
  numero: '',
  nom_prenom: '',
  categorie: 'BP',
  zone_id: '',
  fokontany: '',
  adresse: '',
  ref_client: '',
  code_client: '',
  ref_compteur: '',
  date_branchement: '',
  actif: true,
})

onMounted(async () => {
  const { data: zData } = await supabase.from('zones').select('*').order('name')
  zones.value = zData || []

  if (isEdit.value && clientId.value) {
    const { data } = await supabase.from('clients').select('*').eq('id', clientId.value).single()
    if (data) Object.assign(form, { ...data, zone_id: data.zone_id || '' })
  }
})

async function handleSubmit() {
  loading.value = true
  error.value = ''
  try {
    const { data: agency, error: agencyErr } = await supabase
      .from('agencies')
      .select('id')
      .limit(1)
      .maybeSingle()

    if (agencyErr) throw agencyErr
    
    // ✅ Stop ici si pas d'agence
    if (!agency?.id) {
      error.value = "Aucune agence configurée. Ajoutez une agence dans Supabase."
      loading.value = false
      return
    }

    const payload = { ...form, agency_id: agency.id }
    if (!payload.zone_id) payload.zone_id = null

    if (isEdit.value) {
      const { error: err } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', clientId.value)
      if (err) throw err
    } else {
      const { error: err } = await supabase
        .from('clients')
        .insert(payload)
      if (err) throw err
    }

    router.push('/clients')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
