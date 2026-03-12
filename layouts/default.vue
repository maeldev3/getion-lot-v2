<template>
  <div class="flex h-screen overflow-hidden" style="background:#0b1120">

    <!-- Mobile overlay -->
    <div v-if="mobileOpen" @click="mobileOpen=false"
      class="fixed inset-0 bg-black/60 z-20 lg:hidden"/>

    <!-- SIDEBAR -->
    <aside class="sidebar fixed lg:relative z-30 flex flex-col h-full transition-all duration-300 shrink-0"
      :class="[sidebarOpen ? 'w-64' : 'w-16', mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0']">

      <!-- Logo -->
      <div class="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-600 flex items-center justify-center shrink-0 shadow-lg">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
          </svg>
        </div>
        <div v-show="sidebarOpen">
          <div class="text-sm font-bold text-white">ACOGEMA</div>
          <div class="text-xs text-slate-500">Gestion de l'Eau</div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        <NuxtLink v-for="item in navItems" :key="item.path" :to="item.path"
          @click="mobileOpen=false"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative cursor-pointer"
          :class="isActive(item.path)
            ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'">
          <span class="shrink-0 w-5 h-5 flex items-center justify-center" v-html="item.icon"></span>
          <span v-show="sidebarOpen" class="text-sm font-medium truncate">{{ item.label }}</span>
          <div v-if="!sidebarOpen"
            class="absolute left-14 bg-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700 shadow-xl z-50">
            {{ item.label }}
          </div>
        </NuxtLink>
      </nav>

      <!-- User footer -->
      <div class="p-3 border-t border-white/5">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-sm font-bold text-sky-300 shrink-0">
            {{ userInitial }}
          </div>
          <div v-show="sidebarOpen" class="flex-1 min-w-0">
            <div class="text-xs font-medium text-slate-300 truncate">{{ profile?.nom_prenom || user?.email?.split('@')[0] }}</div>
            <div class="text-xs text-slate-600">{{ profile?.role || 'Agent' }}</div>
          </div>
          <button v-show="sidebarOpen" @click="handleSignOut"
            class="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Déconnexion">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- MAIN -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Topbar -->
      <header class="h-14 flex items-center gap-3 px-4 lg:px-6 border-b border-white/5 bg-slate-900/60 backdrop-blur shrink-0">
        <button @click="sidebarOpen = !sidebarOpen"
          class="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <button @click="mobileOpen = !mobileOpen"
          class="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <div class="flex items-center gap-2 flex-1 min-w-0">
          <span class="text-slate-600 text-sm hidden sm:block">ACOGEMA</span>
          <span class="text-slate-700 hidden sm:block">/</span>
          <span class="text-sm font-semibold text-slate-200 truncate">{{ currentPageTitle }}</span>
        </div>

        <div class="flex items-center gap-2">
          <div class="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-white/5 px-3 py-1.5 rounded-lg">
            {{ currentDate }}
          </div>
          <NuxtLink to="/releves/nouveau"
            class="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            <span class="hidden sm:block">Nouveau Relevé</span>
          </NuxtLink>

          <div class="relative" ref="userMenuRef">
            <button @click="userMenuOpen = !userMenuOpen"
              class="flex items-center gap-1.5 p-1.5 rounded-xl hover:bg-white/5 transition-all">
              <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-xs font-bold text-white">
                {{ userInitial }}
              </div>
              <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div v-if="userMenuOpen"
              class="absolute right-0 top-10 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
              <div class="px-4 py-3 border-b border-slate-800">
                <div class="text-xs font-medium text-white truncate">{{ profile?.nom_prenom || 'Utilisateur' }}</div>
                <div class="text-xs text-slate-500 truncate">{{ user?.email }}</div>
              </div>
              <div class="p-1">
                <NuxtLink to="/parametres" @click="userMenuOpen=false"
                  class="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 rounded-lg transition-colors">
                  <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Paramètres
                </NuxtLink>
                <button @click="handleSignOut"
                  class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-auto p-4 lg:p-6">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const router = useRouter()

const sidebarOpen = ref(true)
const mobileOpen = ref(false)
const userMenuOpen = ref(false)
const userMenuRef = ref(null)
const profile = ref(null)

onMounted(async () => {
  if (user.value) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.value.id).single()
    profile.value = data
  }
  document.addEventListener('click', (e) => {
    if (userMenuRef.value && !userMenuRef.value.contains(e.target)) {
      userMenuOpen.value = false
    }
  })
})

const userInitial = computed(() => {
  const name = profile.value?.nom_prenom || user.value?.email || 'U'
  return name.charAt(0).toUpperCase()
})

async function handleSignOut() {
  userMenuOpen.value = false
  await supabase.auth.signOut()
  router.push('/auth/login')
}

const navItems = [
  { path: '/', label: 'Tableau de Bord', icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z"/></svg>` },
  { path: '/clients', label: 'Clients', icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>` },
  { path: '/releves', label: 'Relevés Compteur', icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>` },
  { path: '/factures', label: 'Factures', icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>` },
  { path: '/recap', label: 'Récapitulatif', icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>` },
  { path: '/paiements', label: 'Paiements', icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>` },
  { path: '/parametres', label: 'Paramètres', icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>` },
]

const pageTitles = {
  '/': 'Tableau de Bord', '/clients': 'Clients', '/clients/nouveau': 'Nouveau Client',
  '/releves': 'Relevés', '/releves/nouveau': 'Nouveau Relevé', '/factures': 'Factures',
  '/recap': 'Récapitulatif', '/paiements': 'Paiements', '/parametres': 'Paramètres',
}

const currentPageTitle = computed(() => {
  if (pageTitles[route.path]) return pageTitles[route.path]
  if (route.path.includes('/edit')) return 'Modifier Client'
  if (route.path.startsWith('/clients/')) return 'Fiche Client'
  return 'ACOGEMA'
})

const currentDate = computed(() => new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }))

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<style scoped>
.sidebar { background: rgba(11,17,32,0.98); border-right: 1px solid rgba(255,255,255,0.05); }
</style>
