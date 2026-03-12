<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 min-w-[200px] max-w-sm">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input v-model="search" type="text" placeholder="Rechercher..." class="form-input pl-10" @input="onSearch"/>
      </div>
      <select v-model="filterZone" class="form-select w-auto" @change="fetchData">
        <option value="">Toutes les zones</option>
        <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
      </select>
      <select v-model="filterActif" class="form-select w-auto" @change="fetchData">
        <option value="">Tous</option>
        <option value="true">Actifs</option>
        <option value="false">Inactifs</option>
      </select>
      <div class="flex-1"></div>
      <NuxtLink to="/clients/nouveau" class="btn-primary">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        Nouveau Client
      </NuxtLink>
    </div>

    <!-- Table -->
    <div class="glass-card overflow-hidden">
      <div v-if="loading" class="flex justify-center py-14"><div class="spinner"></div></div>
      <div v-else-if="!clients.length" class="text-center py-14 text-slate-600">
        <svg class="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        <p class="text-sm">Aucun client trouvé</p>
        <NuxtLink to="/clients/nouveau" class="text-sky-400 text-xs mt-2 inline-block">+ Ajouter un client</NuxtLink>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>N°</th><th>Nom & Prénom</th><th>Catégorie</th>
              <th>Zone</th><th>Fokontany</th><th>Réf. Compteur</th><th>Statut</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in clients" :key="c.id">
              <td class="font-mono text-xs text-slate-500">{{ c.numero }}</td>
              <td>
                <div class="font-medium text-slate-200">{{ c.nom_prenom }}</div>
                <div class="text-xs text-slate-600">{{ c.ref_client }}</div>
              </td>
              <td><span class="text-xs px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">{{ c.categorie }}</span></td>
              <td class="text-slate-400 text-sm">{{ c.zone?.name || '—' }}</td>
              <td class="text-slate-400 text-sm">{{ c.fokontany || '—' }}</td>
              <td class="font-mono text-xs text-slate-500">{{ c.ref_compteur || '—' }}</td>
              <td>
                <span class="text-xs px-2 py-0.5 rounded-full" :class="c.actif ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-500'">
                  {{ c.actif ? 'Actif' : 'Inactif' }}
                </span>
              </td>
              <td>
                <div class="flex items-center gap-1">
                  <NuxtLink :to="`/clients/${c.id}`" class="icon-btn text-slate-500 hover:text-sky-400 hover:bg-sky-500/10" title="Voir fiche">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </NuxtLink>
                  <NuxtLink :to="`/clients/${c.id}/edit`" class="icon-btn text-slate-500 hover:text-amber-400 hover:bg-amber-500/10" title="Modifier">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </NuxtLink>
                  <NuxtLink :to="`/releves/nouveau?client_id=${c.id}`" class="icon-btn text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10" title="Nouveau relevé">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                  </NuxtLink>
                  <button @click="confirmerSuppression(c)" class="icon-btn text-slate-500 hover:text-red-400 hover:bg-red-500/10" title="Supprimer">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div v-if="clients.length" class="px-5 py-3 border-t border-slate-800 flex items-center justify-between">
        <span class="text-xs text-slate-500">{{ totalCount }} clients au total</span>
        <div class="flex gap-2">
          <button @click="prevPage" :disabled="page===0" class="btn-secondary py-1 px-3 text-xs disabled:opacity-40">← Précédent</button>
          <button @click="nextPage" :disabled="(page+1)*pageSize>=totalCount" class="btn-secondary py-1 px-3 text-xs disabled:opacity-40">Suivant →</button>
        </div>
      </div>
    </div>

    <!-- Delete confirm modal -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget=null">
      <div class="modal-content p-6 max-w-sm text-center">
        <div class="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h3 class="text-base font-semibold text-white mb-2">Supprimer ce client ?</h3>
        <p class="text-slate-400 text-sm mb-5">{{ deleteTarget.nom_prenom }} sera désactivé.</p>
        <div class="flex gap-3 justify-center">
          <button @click="supprimerClient" class="btn-danger">Supprimer</button>
          <button @click="deleteTarget=null" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const clients = ref([])
const zones = ref([])
const loading = ref(true)
const search = ref('')
const filterZone = ref('')
const filterActif = ref('true')
const page = ref(0)
const pageSize = 20
const totalCount = ref(0)
const deleteTarget = ref(null)

let timer = null
function onSearch() { clearTimeout(timer); timer = setTimeout(() => { page.value=0; fetchData() }, 300) }

async function fetchData() {
  loading.value = true
  try {
    let q = supabase.from('clients').select('*,zone:zones(id,name)', { count: 'exact' }).order('numero').range(page.value*pageSize, (page.value+1)*pageSize-1)
    if (search.value) q = q.or(`nom_prenom.ilike.%${search.value}%,ref_client.ilike.%${search.value}%,ref_compteur.ilike.%${search.value}%`)
    if (filterZone.value) q = q.eq('zone_id', filterZone.value)
    if (filterActif.value !== '') q = q.eq('actif', filterActif.value === 'true')
    const { data, count } = await q
    clients.value = data || []
    totalCount.value = count || 0
  } finally { loading.value = false }
}

function confirmerSuppression(c) { deleteTarget.value = c }
async function supprimerClient() {
  await supabase.from('clients').update({ actif: false }).eq('id', deleteTarget.value.id)
  deleteTarget.value = null
  fetchData()
}
function nextPage() { page.value++; fetchData() }
function prevPage() { if (page.value>0) { page.value--; fetchData() } }

onMounted(async () => {
  fetchData()
  const { data: z } = await supabase.from('zones').select('*').order('name')
  zones.value = z || []
})
</script>

<style scoped>
.icon-btn { @apply p-1.5 rounded-lg transition-colors cursor-pointer; }
</style>
