<!-- pages/auth/login.vue -->
<template>
  <div class="login-page">
    <div class="login-bg-effects">
      <div class="glow glow-1"></div>
      <div class="glow glow-2"></div>
    </div>

    <div class="login-card">
      <div class="login-logo">
        <div class="logo-icon">💧</div>
        <div class="logo-name">ACOGEMA</div>
        <div class="logo-sub">Water Management ERP</div>
      </div>

      <div v-if="errorMsg" class="error-banner">
        <span>⚠️ {{ errorMsg }}</span>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">Adresse Email</label>
          <input
            v-model="form.email"
            type="email"
            class="form-input"
            placeholder="vous@acogema.mg"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Mot de passe</label>
          <div class="input-wrap">
            <input
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              class="form-input"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
            <button type="button" class="toggle-pwd" @click="showPwd = !showPwd">
              {{ showPwd ? '🙈' : '👁' }}
            </button>
          </div>
        </div>

        <div class="form-row">
          <label class="checkbox-label">
            <input v-model="rememberMe" type="checkbox" /> Se souvenir de moi
          </label>
          <NuxtLink to="/auth/reset-password" class="forgot-link">Mot de passe oublié?</NuxtLink>
        </div>

        <button type="submit" class="btn-login" :disabled="loading">
          <span v-if="loading" class="spinner">⌛</span>
          <span v-else>🔐 Connexion</span>
        </button>
      </form>

      <div class="login-footer">
        <div class="security-badges">
          <span class="badge">🔒 SSL</span>
          <span class="badge">🛡 RLS Supabase</span>
          <span class="badge">📝 Audit Trail</span>
        </div>
        <p class="version">ACOGEMA ERP v2.0 — Agence BEFORONA</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, middleware: [] })

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ email: '', password: '' })
const showPwd = ref(false)
const rememberMe = ref(false)
const loading = ref(false)
const errorMsg = ref('')

// Message si compte désactivé
if (route.query.reason === 'account_disabled') {
  errorMsg.value = 'Compte désactivé. Contactez votre administrateur.'
}

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''
  try {
    await auth.signIn(form.email, form.password)
    await router.push('/')
  } catch (e: unknown) {
    const err = e as Error
    if (err.message.includes('Invalid login credentials')) {
      errorMsg.value = 'Email ou mot de passe incorrect.'
    } else {
      errorMsg.value = err.message
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: var(--bg);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  position: relative;
}
.login-bg-effects { position: fixed; inset: 0; pointer-events: none; }
.glow { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.3; }
.glow-1 { width: 400px; height: 400px; background: var(--accent2); top: -100px; left: -100px; }
.glow-2 { width: 300px; height: 300px; background: var(--accent); bottom: -80px; right: -80px; }
.login-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 24px; padding: 48px 40px; width: 100%; max-width: 420px;
  position: relative; z-index: 1; backdrop-filter: blur(20px);
}
.login-logo { text-align: center; margin-bottom: 32px; }
.logo-icon { font-size: 48px; margin-bottom: 8px; }
.logo-name { font-size: 28px; font-weight: 800; color: var(--accent3); letter-spacing: -1px; }
.logo-sub { font-size: 12px; color: var(--text3); font-family: var(--mono); margin-top: 4px; }
.error-banner {
  background: rgba(239,71,111,0.12); border: 1px solid rgba(239,71,111,0.3);
  color: var(--red); padding: 10px 16px; border-radius: 10px; margin-bottom: 20px; font-size: 13px;
}
.login-form { display: flex; flex-direction: column; gap: 18px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 12px; color: var(--text2); font-family: var(--mono); }
.form-input {
  background: var(--surface2); border: 1px solid var(--border); color: var(--text);
  font-family: var(--sans); font-size: 14px; padding: 12px 16px; border-radius: 10px;
  outline: none; transition: border-color 0.2s; width: 100%;
}
.form-input:focus { border-color: var(--accent); }
.input-wrap { position: relative; }
.input-wrap .form-input { padding-right: 48px; }
.toggle-pwd {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; font-size: 16px;
}
.form-row { display: flex; align-items: center; justify-content: space-between; }
.checkbox-label { font-size: 12px; color: var(--text2); display: flex; align-items: center; gap: 6px; cursor: pointer; }
.forgot-link { font-size: 12px; color: var(--accent); text-decoration: none; }
.forgot-link:hover { text-decoration: underline; }
.btn-login {
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  border: none; color: #000; font-weight: 700; font-size: 14px;
  padding: 14px; border-radius: 12px; cursor: pointer; font-family: var(--sans);
  transition: all 0.2s;
}
.btn-login:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.btn-login:disabled { opacity: 0.5; cursor: not-allowed; }
.login-footer { margin-top: 28px; text-align: center; }
.security-badges { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.badge {
  background: rgba(0,180,216,0.1); border: 1px solid rgba(0,180,216,0.2);
  color: var(--accent3); font-size: 10px; padding: 3px 10px; border-radius: 20px;
  font-family: var(--mono);
}
.version { font-size: 11px; color: var(--text3); }
</style>
