<template>
  <div class="w-full max-w-md">
    <!-- Card -->
    <div class="glass-card p-8">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-500/30 mb-4">
          <svg class="w-9 h-9 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-white font-display">ACOGEMA</h1>
        <p class="text-slate-500 text-sm mt-1">Système de Gestion de l'Eau</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-5">
        <div>
          <label class="form-label">Adresse Email</label>
          <input
            v-model="form.email"
            type="email"
            class="form-input"
            placeholder="votre@email.com"
            required
          />
        </div>

        <div>
          <label class="form-label">Mot de Passe</label>
          <div class="relative">
            <input
              v-model="form.password"
              :type="showPass ? 'text' : 'password'"
              class="form-input pr-10"
              placeholder="••••••••"
              required
            />
            <button type="button" @click="showPass = !showPass"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <svg v-if="!showPass" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {{ error }}
        </div>

        <button type="submit" :disabled="loading" 
          class="btn-primary w-full justify-center py-3 text-base">
          <div v-if="loading" class="spinner !w-4 !h-4"></div>
          <span v-else>Se Connecter</span>
        </button>
      </form>
    </div>

    <p class="text-center text-xs text-slate-600 mt-6">
      ACOGEMA © {{ new Date().getFullYear() }} — Agence Beforona
    </p>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'auth' })

const authStore = useAuthStore ? useAuthStore() : null
const supabase = useSupabaseClient()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const loading = ref(false)
const error = ref('')
const showPass = ref(false)

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    const { error: err } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    })
    if (err) throw err
    router.push('/')
  } catch (e) {
    error.value = e.message === 'Invalid login credentials' 
      ? 'Email ou mot de passe incorrect.' 
      : e.message
  } finally {
    loading.value = false
  }
}
</script>
