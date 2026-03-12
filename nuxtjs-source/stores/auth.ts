// stores/auth.ts
import { defineStore } from 'pinia'
import type { Profile, UserRole } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const profile = ref<Profile | null>(null)
  const loading = ref(false)

  async function fetchProfile() {
    if (!user.value) return
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, agence:agences(*)')
        .eq('id', user.value.id)
        .single()
      if (!error && data) profile.value = data as Profile
    } finally {
      loading.value = false
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await fetchProfile()
    // Log audit
    await logAudit('LOGIN', 'auth', undefined)
  }

  async function signOut() {
    await logAudit('LOGOUT', 'auth', undefined)
    await supabase.auth.signOut()
    profile.value = null
    navigateTo('/auth/login')
  }

  async function logAudit(action: string, table?: string, recordId?: string) {
    if (!user.value) return
    await supabase.from('audit_logs').insert({
      user_id: user.value.id,
      agence_id: profile.value?.agence_id,
      action,
      table_name: table,
      record_id: recordId,
    })
  }

  function hasPermission(perm: string): boolean {
    if (!profile.value) return false
    const role = profile.value.role as UserRole
    const { ROLE_PERMISSIONS } = useRuntimeConfig().public as unknown as { ROLE_PERMISSIONS: Record<string, string[]> }
    // super_admin a tous les droits
    if (role === 'super_admin') return true
    const perms = {
      super_admin: ['*'],
      directeur: ['clients:read', 'clients:write', 'releves:read', 'releves:write', 'factures:read', 'factures:write', 'paiements:read', 'paiements:write', 'rapports:read', 'users:read'],
      comptable: ['clients:read', 'releves:read', 'factures:read', 'factures:write', 'paiements:read', 'paiements:write', 'rapports:read'],
      agent_terrain: ['clients:read', 'releves:read', 'releves:write'],
    }
    return (perms[role] ?? []).includes(perm)
  }

  const isAdmin = computed(() => profile.value?.role === 'super_admin')
  const isDirecteur = computed(() => ['super_admin', 'directeur'].includes(profile.value?.role ?? ''))
  const agenceId = computed(() => profile.value?.agence_id)

  return {
    user, profile, loading,
    fetchProfile, signIn, signOut, logAudit, hasPermission,
    isAdmin, isDirecteur, agenceId
  }
})
