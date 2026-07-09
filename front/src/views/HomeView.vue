<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCreativeStore } from '@/stores/creative'

const router = useRouter()
const store = useCreativeStore()

const recentWorks = computed(() => store.creatives.slice(0, 6))

const stats = computed(() => [
  { label: '总作品数', value: store.creatives.length.toString(), trend: '+2', up: true },
  { label: '本月生成', value: store.creatives.filter(c => c.status === 'completed').length.toString(), trend: '+1', up: true },
  { label: '消耗积分', value: store.transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0).toLocaleString(), trend: '-5%', up: false },
  { label: '团队成员', value: '4', trend: null, up: null },
])

const quickActions = [
  { title: '创意画布', desc: '自由组合AI节点', path: '/canvas', gradient: 'linear-gradient(135deg, #4ecdc4, #44a8a0)' },
  { title: '使用模板', desc: '快速开始创作', path: '/templates', gradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' },
  { title: '作品画廊', desc: '浏览全部作品', path: '/gallery', gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)' },
  { title: '积分管理', desc: '查看消耗明细', path: '/credits', gradient: 'linear-gradient(135deg, #34d399, #059669)' },
]

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = { completed: '已完成', generating: '生成中', draft: '草稿' }
  return map[status] || status
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = { completed: 'success', generating: 'warning', draft: 'info' }
  return map[status] || 'info'
}
</script>

<template>
  <div class="home-view">
    <!-- Stats Grid -->
    <section class="stats-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card card subtle-pulse">
        <div class="stat-label">{{ stat.label }}</div>
        <div class="stat-value">{{ stat.value }}</div>
        <div v-if="stat.trend" class="stat-trend" :class="{ up: stat.up, down: !stat.up }">
          <svg v-if="stat.up" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2L10 6L8 6L8 10L4 10L4 6L2 6L6 2Z" fill="currentColor"/>
          </svg>
          <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 10L2 6L4 6L4 2L8 2L8 6L10 6L6 10Z" fill="currentColor"/>
          </svg>
          {{ stat.trend }}
        </div>
      </div>
    </section>

    <!-- Quick Actions -->
    <section class="section">
      <div class="section-header">
        <h2>快速开始</h2>
      </div>
      <div class="actions-grid">
        <div
          v-for="action in quickActions"
          :key="action.path"
          class="action-card card card-hover"
          @click="router.push(action.path)"
        >
          <div class="action-icon" :style="{ background: action.gradient }">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="action-content">
            <h3>{{ action.title }}</h3>
            <p>{{ action.desc }}</p>
          </div>
          <div class="action-arrow">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 5L13 10L7 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </section>

    <!-- Recent Works -->
    <section class="section">
      <div class="section-header">
        <h2>最近作品</h2>
        <button class="link-btn" @click="router.push('/gallery')">查看全部</button>
      </div>
      <div class="works-grid">
        <div v-for="work in recentWorks" :key="work.id" class="work-card card card-hover">
          <div class="work-preview">
            <img v-if="work.thumbnail" :src="work.thumbnail" :alt="work.title" class="work-thumbnail" />
            <div v-else class="preview-placeholder">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="6" y="6" width="28" height="28" rx="6" stroke="currentColor" stroke-width="1.5"/>
                <circle cx="15" cy="15" r="4" stroke="currentColor" stroke-width="1.5"/>
                <path d="M34 26L26 18L16 28" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <!-- 类型标识 -->
            <div class="type-badge" :class="work.type">
              <svg v-if="work.type === 'video'" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M2 2h5v8H2V2zM7 4l3-2v8l-3-2V4z"/>
              </svg>
              <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <rect x="1" y="1" width="10" height="10" rx="1.5"/>
                <circle cx="4" cy="4" r="1.5"/>
                <path d="M1 8l3-3 2 2 3-4 2 3"/>
              </svg>
            </div>
            <div class="work-overlay">
              <button class="overlay-btn preview">预览</button>
              <button class="overlay-btn edit" @click="router.push('/canvas')">编辑</button>
            </div>
          </div>
          <div class="work-info">
            <div class="work-title">{{ work.title }}</div>
            <div class="work-meta">
              <el-tag size="small" :type="getStatusType(work.status) as any">
                {{ getStatusLabel(work.status) }}
              </el-tag>
              <span class="work-date">{{ work.createdAt }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Activity Chart -->
    <section class="section">
      <div class="section-header">
        <h2>创作趋势</h2>
      </div>
      <div class="chart-container card">
        <div class="chart-bars">
          <div class="chart-bar"><span>Mon</span></div>
          <div class="chart-bar"><span>Tue</span></div>
          <div class="chart-bar"><span>Wed</span></div>
          <div class="chart-bar"><span>Thu</span></div>
          <div class="chart-bar"><span>Fri</span></div>
          <div class="chart-bar"><span>Sat</span></div>
          <div class="chart-bar active"><span>Sun</span></div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  padding: 24px;
  position: relative;
}

.stat-label {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.stat-trend {
  position: absolute;
  top: 24px;
  right: 24px;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-trend.up { color: #059669; }
.stat-trend.down { color: #dc2626; }

.section { margin-bottom: 40px; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.link-btn {
  background: none;
  border: none;
  color: var(--accent-cyan);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.link-btn:hover {
  background: rgba(78, 205, 196, 0.08);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.action-card {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-content { flex: 1; min-width: 0; }

.action-content h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.action-content p {
  font-size: 12px;
  color: var(--text-muted);
}

.action-arrow {
  color: var(--text-muted);
  transition: all 0.2s;
}

.action-card:hover .action-arrow {
  color: var(--accent-cyan);
  transform: translateX(4px);
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.work-card { overflow: hidden; }

.work-preview {
  height: 160px;
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  position: relative;
  overflow: hidden;
}

.work-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.work-card:hover .work-thumbnail {
  transform: scale(1.05);
}

.type-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 2;
}

.type-badge.video {
  background: linear-gradient(135deg, #a78bfa, #8b5cf6);
}

.type-badge.image {
  background: linear-gradient(135deg, #4ecdc4, #44a8a0);
}

.work-overlay {
  position: absolute;
  inset: 0;
  background: rgba(247, 248, 250, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.work-card:hover .work-overlay { opacity: 1; }

.overlay-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.overlay-btn.preview {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
}

.overlay-btn.preview:hover {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.overlay-btn.edit {
  background: var(--accent-cyan);
  border: none;
  color: #fff;
}

.overlay-btn.edit:hover {
  box-shadow: 0 4px 16px rgba(78, 205, 196, 0.3);
}

.work-info { padding: 16px 20px; }

.work-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.work-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.work-date {
  font-size: 12px;
  color: var(--text-muted);
}

.chart-container {
  padding: 24px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 180px;
}

.chart-bar {
  flex: 1;
  background: var(--bg-elevated);
  border-radius: 6px 6px 0 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 8px;
  font-size: 11px;
  color: var(--text-muted);
  height: 60%;
  transition: all 0.3s;
}

.chart-bar:nth-child(2) { height: 80%; }
.chart-bar:nth-child(4) { height: 90%; }
.chart-bar:nth-child(5) { height: 70%; }
.chart-bar:nth-child(6) { height: 55%; }
.chart-bar.active { height: 95%; background: linear-gradient(to top, var(--accent-cyan), rgba(78, 205, 196, 0.3)); }

.chart-bar:hover { background: rgba(78, 205, 196, 0.15); }

@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .actions-grid { grid-template-columns: repeat(2, 1fr); }
  .works-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
  .actions-grid { grid-template-columns: 1fr; }
  .works-grid { grid-template-columns: 1fr; }
}
</style>
