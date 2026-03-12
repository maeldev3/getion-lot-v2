import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const profile = ref(null)

  async function fetchProfile() {
    if (!user.value) return null
    const { data } = await supabase
      .from('profiles')
      .select('*, agency:agencies(*)')
      .eq('id', user.value.id)
      .single()
    profile.value = data
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await fetchProfile()
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    profile.value = null
    navigateTo('/auth/login')
  }

  const isAdmin = computed(() => profile.value?.role === 'ADMIN')
  const isAgent = computed(() => ['ADMIN', 'AGENT'].includes(profile.value?.role))

  return { user, profile, fetchProfile, signIn, signOut, isAdmin, isAgent }
})
