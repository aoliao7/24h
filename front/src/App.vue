<script setup lang="ts">
import { RouterView, useRoute, useRouter } from "vue-router";
import { useCreativeStore } from "./stores/creative";

const route = useRoute();
const router = useRouter();
const store = useCreativeStore();

const navItems = [
  { name: "首页", path: "/" },
  { name: "创意画布", path: "/canvas" },
  { name: "广告投放", path: "/ad-platforms" },
  { name: "创作模板", path: "/templates" },
  { name: "作品画廊", path: "/gallery" },
  { name: "积分管理", path: "/credits" },
  { name: "团队管理", path: "/team" },
];

const isActive = (path: string) => route.path === path;

const navigateTo = (path: string) => {
  router.push(path);
};
</script>

<template>
  <div class="app-layout">
    <!-- Top Navbar -->
    <header class="top-nav">
      <div class="nav-brand">
        <div class="brand-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="url(#logoGradLight)" />
            <path
              d="M9 16L14 21L23 11"
              stroke="white"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <defs>
              <linearGradient id="logoGradLight" x1="0" y1="0" x2="32" y2="32">
                <stop stop-color="#4ecdc4" />
                <stop offset="1" stop-color="#a78bfa" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">Heedo</span>
          <span class="brand-tag">Creative Studio</span>
        </div>
      </div>

      <nav class="nav-menu">
        <button
          v-for="item in navItems"
          :key="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          @click="navigateTo(item.path)"
        >
          {{ item.name }}
        </button>
      </nav>

      <div class="nav-actions">
        <div class="credits-display" :class="{ 'low-balance': store.credits < 100 }">
          <div class="credits-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 5v3l2 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="credits-value">{{ store.credits }}</span>
          <span class="credits-label">积分</span>
          <button class="recharge-link" @click.stop="router.push('/credits')">充值</button>
        </div>
        <div class="user-avatar">
          <span>H</span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-base);
}

.top-nav {
  height: 60px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  padding: 0 32px;
  gap: 48px;
  z-index: 100;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.brand-tag {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

.nav-menu {
  display: flex;
  gap: 4px;
  flex: 1;
}

.nav-item {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.nav-item:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.nav-item.active {
  color: var(--accent-cyan);
  background: rgba(78, 205, 196, 0.08);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.credits-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 8px;
  background: var(--bg-elevated);
  border-radius: 24px;
  color: var(--text-secondary);
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.credits-display:hover {
  border-color: var(--accent-cyan);
  background: rgba(78, 205, 196, 0.05);
}

.credits-display.low-balance {
  background: rgba(248, 113, 113, 0.08);
  border-color: rgba(248, 113, 113, 0.3);
}

.credits-display.low-balance .credits-value {
  color: #dc2626;
}

.credits-icon {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.credits-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 40px;
}

.credits-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-right: 4px;
}

.recharge-link {
  background: none;
  border: none;
  color: var(--accent-cyan);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 10px;
  transition: all 0.2s;
  font-family: inherit;
}

.recharge-link:hover {
  background: rgba(78, 205, 196, 0.1);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.user-avatar:hover {
  box-shadow: 0 4px 16px rgba(78, 205, 196, 0.3);
  transform: scale(1.05);
}

.main-content {
  flex: 1;
  overflow: auto;
  position: relative;
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
