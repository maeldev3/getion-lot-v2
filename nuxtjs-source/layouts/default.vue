<!-- layouts/default.vue -->
<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <nav class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <div class="logo-area">
        <div class="logo-badge">
          <div class="logo-icon">💧</div>
          <div v-if="!sidebarCollapsed">
            <div class="logo-text">ACOGEMA</div>
            <div class="logo-sub">Water ERP v2.0</div>
          </div>
        </div>
        <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          {{ sidebarCollapsed ? '→' : '←' }}
        </button>
      </div>

      <div class="nav">
        <div v-if="!sidebarCollapsed" class="nav-section">Principal</div>
        <NuxtLink v-for="item in mainNav" :key="item.to"
          :to="item.to" class="nav-item" active-class="active">
          <span class="nav-icon">{{ item.icon }}</span>
          <span v-if="!sidebarCollapsed" class="nav-label">{{ item.label }}</span>
          <span v-if="!sidebarCollapsed && item.badge" class="nav-badge" :class="item.badgeColor">{{ item.badge }}</span>
        </NuxtLink>

        <div v-if="!sidebarCollapsed" class="nav-section">Gestion</div>
        <NuxtLink v-for="item in gestionNav" :key="item.to"
          :to="item.to" class="nav-item" active-class="active">
          <span class="nav-icon">{{ item.icon }}</span>
          <span v-if="!sidebarCollapsed">{{ item.label }}</span>
        </NuxtLink>

        <template v-if="auth.isAdmin || auth.isDirecteur">
          <div v-if="!sidebarCollapsed" class="nav-section">Système</div>
          <NuxtLink v-for="item in systemNav" :key="item.to"
            :to="item.to" class="nav-item" active-class="active">
            <span class="nav-icon">{{ item.icon }}</span>
            <span v-if="!sidebarCollapsed">{{ item.label }}</span>
          </NuxtLink>
        </template>
      </div>

      <div class="sidebar-footer">
        <div v-if="!sidebarCollapsed" class="user-card" @click="showProfileMenu = !showProfileMenu">
          <div class="user-avatar">{{ initials }}</div>
          <div class="user-info">
            <div class="user-name">{{ auth.profile?.full_name }}</div>
            <div class="user-role">{{ auth.profile?.role }} · {{ auth.profile?.agence?.code }}</div>
          </div>
          <div class="menu-arrow">⋮</div>
        </div>

        <div v-if="showProfileMenu && !sidebarCollapsed" class="profile-menu">
          <NuxtLink to="/profil" class="profile-menu-item">👤 Mon Profil</NuxtLink>
          <button class="profile-menu-item danger" @click="auth.signOut()">🚪 Déconnexion</button>
        </div>
      </div>
    </nav>

    <!-- Main -->
    <div class="main-area">
      <!-- Topbar -->
      <header class="topbar">
        <div class="topbar-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
          <div class="breadcrumb">
            <span>{{ auth.profile?.agence?.nom }}</span>
            <span class="sep">›</span>
            <span>{{ pageTitle }}</span>
          </div>
        </div>
        <div class="topbar-right">
          <div class="month-selector">
            <button @click="prevMonth" class="month-btn">‹</button>
            <span class="month-label">{{ currentMonthLabel }}</span>
            <button @click="nextMonth" class="month-btn">›</button>
          </div>
          <button class="topbar-btn" @click="$emit('import')">⬆ Import Excel</button>
          <button class="topbar-btn primary" @click="$emit('newReleve')">📏 Nouveau Relevé</button>
        </div>
      </header>

      <!-- Page content -->
      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits(['import', 'newReleve'])

const auth = useAuthStore()
const route = useRoute()
const sidebarCollapsed = ref(false)
const showProfileMenu = ref(false)

const currentDate = ref(new Date())
const currentMonthLabel = computed(() => {
  return currentDate.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
})
function prevMonth() { currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1) }
function nextMonth() { currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1) }

const initials = computed(() => {
  const name = auth.profile?.full_name ?? ''
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
})

const pageTitles: Record<string, string> = {
  '/': 'Tableau de Bord',
  '/clients': 'Clients & Ménages',
  '/releves': 'Relevés Compteurs',
  '/factures': 'Gestion des Factures',
  '/recapitulatif': 'Récapitulatif Mensuel',
  '/paiements': 'Paiements',
  '/rapports': 'Rapports & Exports',
  '/agences': 'Agences & Zones',
  '/admin/users': 'Utilisateurs & Sécurité',
  '/admin/config': 'Configuration',
  '/admin/audit': "Journal d'Audit",
}
const pageTitle = computed(() => pageTitles[route.path] ?? 'ACOGEMA')

const mainNav = [
  { to: '/', icon: '⬡', label: 'Tableau de Bord' },
  { to: '/clients', icon: '👥', label: 'Clients / Ménages' },
  { to: '/releves', icon: '📊', label: 'Relevés Compteurs' },
  { to: '/factures', icon: '🧾', label: 'Factures', badge: '5', badgeColor: 'red' },
  { to: '/recapitulatif', icon: '📋', label: 'Récapitulatif' },
]
const gestionNav = [
  { to: '/paiements', icon: '💳', label: 'Paiements' },
  { to: '/rapports', icon: '📈', label: 'Rapports & Exports' },
  { to: '/agences', icon: '🏢', label: 'Agences / Zones' },
]
const systemNav = [
  { to: '/admin/users', icon: '🔐', label: 'Utilisateurs' },
  { to: '/admin/config', icon: '⚙️', label: 'Configuration' },
  { to: '/admin/audit', icon: '🕵️', label: "Journal d'Audit" },
]

// Init auth
onMounted(() => auth.fetchProfile())
</script>

<style>
/* Variables globales */
:root {
  --bg: #040d18;
  --surface: #071524;
  --surface2: #0b1f35;
  --border: #1a3a5c;
  --border2: #0e2a45;
  --accent: #00b4d8;
  --accent2: #0077b6;
  --accent3: #48cae4;
  --gold: #f4a261;
  --green: #06d6a0;
  --red: #ef476f;
  --text: #e0f2fe;
  --text2: #90b4ce;
  --text3: #4a7a9b;
  --mono: 'JetBrains Mono', monospace;
  --sans: 'Sora', sans-serif;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { font-family: var(--sans); background: var(--bg); color: var(--text); }
a { text-decoration: none; color: inherit; }
</style>

<style scoped>
.app-layout { display: flex; min-height: 100vh; }

.sidebar {
  width: 260px; min-height: 100vh;
  background: var(--surface); border-right: 1px solid var(--border2);
  display: flex; flex-direction: column;
  position: fixed; top: 0; left: 0; z-index: 100;
  transition: width 0.25s ease;
}
.sidebar-collapsed { width: 64px; }

.logo-area {
  padding: 20px 16px; border-bottom: 1px solid var(--border2);
  display: flex; align-items: center; justify-content: space-between;
}
.logo-badge { display: flex; align-items: center; gap: 10px; }
.logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg, var(--accent), var(--accent2)); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.logo-text { font-size: 16px; font-weight: 800; color: var(--accent3); }
.logo-sub { font-size: 9px; color: var(--text3); font-family: var(--mono); letter-spacing: 1px; text-transform: uppercase; }
.collapse-btn { background: none; border: 1px solid var(--border); color: var(--text3); width: 24px; height: 24px; border-radius: 6px; cursor: pointer; font-size: 12px; flex-shrink: 0; }

.nav { flex: 1; padding: 12px 0; overflow-y: auto; }
.nav-section { padding: 8px 16px 4px; font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: 2px; font-family: var(--mono); }
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 16px; margin: 1px 8px; border-radius: 8px;
  font-size: 13px; font-weight: 500; color: var(--text2);
  cursor: pointer; transition: all 0.15s; position: relative;
}
.nav-item:hover { background: var(--surface2); color: var(--text); }
.nav-item.active {
  background: rgba(0,180,216,0.12); color: var(--accent3);
  border: 1px solid rgba(0,180,216,0.2);
}
.nav-item.active::before {
  content: ''; position: absolute; left: -8px; top: 50%; transform: translateY(-50%);
  width: 3px; height: 18px; background: var(--accent); border-radius: 2px;
}
.nav-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
.nav-label { flex: 1; white-space: nowrap; overflow: hidden; }
.nav-badge { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px; font-family: var(--mono); background: var(--accent); color: #000; }
.nav-badge.red { background: var(--red); color: #fff; }

.sidebar-footer { padding: 12px; border-top: 1px solid var(--border2); position: relative; }
.user-card {
  display: flex; align-items: center; gap: 8px;
  padding: 10px; border-radius: 10px; background: var(--surface2); cursor: pointer;
}
.user-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent2)); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.user-info { flex: 1; min-width: 0; }
.user-name { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role { font-size: 10px; color: var(--text3); font-family: var(--mono); }
.menu-arrow { color: var(--text3); font-size: 14px; }
.profile-menu {
  position: absolute; bottom: 60px; left: 12px; right: 12px;
  background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
  overflow: hidden; z-index: 10;
}
.profile-menu-item {
  display: block; width: 100%; padding: 10px 14px;
  font-size: 13px; color: var(--text2); cursor: pointer; background: none; border: none;
  font-family: var(--sans); text-align: left; transition: background 0.15s;
}
.profile-menu-item:hover { background: var(--surface2); color: var(--text); }
.profile-menu-item.danger:hover { color: var(--red); }

/* Main Area */
.main-area { margin-left: 260px; display: flex; flex-direction: column; min-height: 100vh; transition: margin-left 0.25s ease; flex: 1; }
.sidebar-collapsed + .main-area { margin-left: 64px; }

.topbar {
  height: 60px; display: flex; align-items: center; justify-content: space-between;
  padding: 0 28px; border-bottom: 1px solid var(--border2);
  background: rgba(4,13,24,0.9); backdrop-filter: blur(20px);
  position: sticky; top: 0; z-index: 50;
}
.topbar-left {}
.page-title { font-size: 18px; font-weight: 700; line-height: 1; }
.breadcrumb { font-size: 11px; color: var(--text3); font-family: var(--mono); margin-top: 2px; }
.sep { margin: 0 4px; }
.topbar-right { display: flex; align-items: center; gap: 10px; }
.month-selector { display: flex; align-items: center; gap: 6px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 4px 8px; }
.month-btn { background: none; border: none; color: var(--text2); cursor: pointer; font-size: 14px; padding: 0 4px; }
.month-label { font-size: 12px; color: var(--text); font-family: var(--mono); white-space: nowrap; }
.topbar-btn {
  background: var(--surface2); border: 1px solid var(--border); color: var(--text2);
  padding: 7px 14px; border-radius: 8px; font-family: var(--sans); font-size: 12px;
  cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.15s;
}
.topbar-btn:hover { border-color: var(--accent); color: var(--accent); }
.topbar-btn.primary { background: linear-gradient(135deg, var(--accent), var(--accent2)); border: none; color: #000; font-weight: 600; }
.topbar-btn.primary:hover { opacity: 0.9; }

.page-content { flex: 1; padding: 28px; }
</style>
