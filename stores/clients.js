import { defineStore } from 'pinia'

export const useClientsStore = defineStore('clients', () => {
  const supabase = useSupabaseClient()
  
  const clients = ref([])
  const loading = ref(false)
  const error = ref(null)
  const totalCount = ref(0)

  async function fetchClients(options = {}) {
    loading.value = true
    error.value = null
    try {
      let query = supabase
        .from('clients')
        .select(`
          *,
          zone:zones(id, name, code),
          agency:agencies(id, name, code)
        `, { count: 'exact' })
        .order('numero')

      if (options.agencyId) query = query.eq('agency_id', options.agencyId)
      if (options.zoneId) query = query.eq('zone_id', options.zoneId)
      if (options.search) {
        query = query.or(`nom_prenom.ilike.%${options.search}%,ref_client.ilike.%${options.search}%,code_client.ilike.%${options.search}%`)
      }
      if (options.actif !== undefined) query = query.eq('actif', options.actif)
      if (options.limit) query = query.limit(options.limit)
      if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 20) - 1)

      const { data, error: err, count } = await query
      if (err) throw err
      clients.value = data || []
      totalCount.value = count || 0
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function getClient(id) {
    const { data, error: err } = await supabase
      .from('clients')
      .select(`
        *,
        zone:zones(id, name, code),
        agency:agencies(id, name, code, phone, email)
      `)
      .eq('id', id)
      .single()
    if (err) throw err
    return data
  }

  async function createClient(clientData) {
    const { data, error: err } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single()
    if (err) throw err
    await fetchClients()
    return data
  }

  async function updateClient(id, clientData) {
    const { data, error: err } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    const idx = clients.value.findIndex(c => c.id === id)
    if (idx !== -1) clients.value[idx] = { ...clients.value[idx], ...data }
    return data
  }

  async function deleteClient(id) {
    const { error: err } = await supabase.from('clients').delete().eq('id', id)
    if (err) throw err
    clients.value = clients.value.filter(c => c.id !== id)
  }

  return { clients, loading, error, totalCount, fetchClients, getClient, createClient, updateClient, deleteClient }
})
