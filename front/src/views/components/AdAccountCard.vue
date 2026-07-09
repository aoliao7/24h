<template>
  <div class="account-card" :class="{ 'has-error': account.status === 'error' }">
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="account-avatar">
        <el-icon :size="24"><User /></el-icon>
      </div>
      <div class="account-info">
        <h4 class="account-name">{{ account.name }}</h4>
        <span class="account-id">ID: {{ account.accountId }}</span>
      </div>
      <el-dropdown trigger="click" @command="handleCommand">
        <el-button text circle>
          <el-icon><MoreFilled /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="edit">编辑</el-dropdown-item>
            <el-dropdown-item command="sync">立即同步</el-dropdown-item>
            <el-dropdown-item command="settings">同步设置</el-dropdown-item>
            <el-dropdown-item command="disconnect" divided style="color: #FF5252;">
              断开连接
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 同步状态 -->
    <div class="sync-status-bar">
      <div class="status-indicator" :class="account.syncStatus"></div>
      <span class="status-text">{{ getStatusText(account.syncStatus) }}</span>
      <span class="last-sync" v-if="account.lastSyncTime">
        · {{ formatTime(account.lastSyncTime) }}
      </span>
    </div>

    <!-- 数据统计 -->
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-value">{{ formatNumber(account.stats.impressions) }}</span>
        <span class="stat-label">曝光</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ account.stats.ctr.toFixed(1) }}%</span>
        <span class="stat-label">点击率</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">¥{{ formatNumber(account.stats.spend) }}</span>
        <span class="stat-label">消耗</span>
      </div>
      <div class="stat-item">
        <span class="stat-value" :class="getRoasClass(account.stats.roas)">
          {{ account.stats.roas.toFixed(1) }}x
        </span>
        <span class="stat-label">ROAS</span>
      </div>
    </div>

    <!-- 同步范围标签 -->
    <div class="sync-tags" v-if="account.syncScopes?.length">
      <el-tag
        v-for="scope in account.syncScopes"
        :key="scope"
        size="small"
        type="info"
      >
        {{ getScopeLabel(scope) }}
      </el-tag>
    </div>

    <!-- 错误提示 -->
    <div class="error-tip" v-if="account.status === 'error'">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ account.errorMessage || '同步失败，请检查授权' }}</span>
      <el-button size="small" text @click="$emit('sync', account)">重试</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, MoreFilled, WarningFilled } from '@element-plus/icons-vue'

interface AdAccount {
  id: string
  name: string
  accountId: string
  platform: 'meta' | 'tiktok' | 'youtube'
  status: 'active' | 'inactive' | 'error' | 'expired'
  syncStatus: 'synced' | 'syncing' | 'error' | 'never'
  lastSyncTime?: string
  errorMessage?: string
  stats: {
    impressions: number
    clicks: number
    ctr: number
    spend: number
    conversions: number
    roas: number
  }
  syncScopes?: string[]
  tokenExpiry?: string
}

const props = defineProps<{
  account: AdAccount
  platform: 'meta' | 'tiktok' | 'youtube'
}>()

const emit = defineEmits<{
  edit: [account: AdAccount]
  sync: [account: AdAccount]
  disconnect: [account: AdAccount]
}>()

const handleCommand = (command: string) => {
  switch (command) {
    case 'edit':
      emit('edit', props.account)
      break
    case 'sync':
      emit('sync', props.account)
      break
    case 'settings':
      // 打开同步设置
      break
    case 'disconnect':
      emit('disconnect', props.account)
      break
  }
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    synced: '已同步',
    syncing: '同步中',
    error: '同步失败',
    never: '从未同步'
  }
  return map[status] || status
}

const getRoasClass = (roas: number) => {
  if (roas >= 4) return 'roas-excellent'
  if (roas >= 2) return 'roas-good'
  if (roas >= 1) return 'roas-warning'
  return 'roas-danger'
}

const getScopeLabel = (scope: string) => {
  const map: Record<string, string> = {
    campaigns: '广告系列',
    adgroups: '广告组',
    ads: '广告',
    creatives: '素材',
    performance: '效果数据'
  }
  return map[scope] || scope
}

const formatNumber = (num: number) => {
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿'
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  return num.toLocaleString()
}

const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}
</script>

<style scoped>
.account-card {
  background: var(--bg-base);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s;
}

.account-card:hover {
  border-color: var(--accent-cyan);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.08);
}

.account-card.has-error {
  border-color: rgba(255, 82, 82, 0.3);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.account-avatar {
  width: 40px;
  height: 40px;
  background: var(--bg-secondary);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.account-info {
  flex: 1;
  min-width: 0;
}

.account-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.account-id {
  font-size: 12px;
  color: var(--text-muted);
}

.sync-status-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 12px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.synced { background: var(--accent-cyan); }
.status-indicator.syncing { background: #FFCB47; animation: pulse 1.5s infinite; }
.status-indicator.error { background: #FF5252; }
.status-indicator.never { background: var(--text-muted); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.status-text { color: var(--text-secondary); }
.last-sync { color: var(--text-muted); }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.stat-item {
  text-align: center;
  padding: 8px 4px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.stat-value {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.stat-value.roas-excellent { color: #10B981; }
.stat-value.roas-good { color: var(--accent-cyan); }
.stat-value.roas-warning { color: #FFCB47; }
.stat-value.roas-danger { color: #FF5252; }

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
}

.sync-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.error-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px;
  background: rgba(255, 82, 82, 0.05);
  border-radius: 8px;
  font-size: 12px;
  color: #FF5252;
}
</style>
