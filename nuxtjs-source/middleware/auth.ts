// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Routes publiques
  const publicRoutes = ['/auth/login', '/auth/confirm', '/auth/reset-password']
  if (publicRoutes.includes(to.path)) return

  // Vérifier session
  if (!user.value) {
    return navigateTo('/auth/login')
  }

  // Vérifier profil actif
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, is_active, role, agence_id')
    .eq('id', user.value.id)
    .single()

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut()
    return navigateTo('/auth/login?reason=account_disabled')
  }

  // Mettre à jour last_login
  await supabase
    .from('profiles')
    .update({ last_login: new Date().toISOString() })
    .eq('id', user.value.id)
})
