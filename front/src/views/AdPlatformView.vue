<template>
  <div class="ad-platform-page">
    <!-- 页面标题区 -->
    <header class="page-header">
      <div class="header-left">
        <h1 class="page-title">广告投放平台</h1>
        <p class="page-subtitle">连接 Meta、TikTok、YouTube 广告账户，统一管理投放数据</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleAddAccount">
          <el-icon><Plus /></el-icon>
          添加账户
        </el-button>
        <el-button @click="refreshAllAccounts">
          <el-icon><Refresh /></el-icon>
          刷新全部
        </el-button>
      </div>
    </header>

    <!-- 同步概览卡片 -->
    <div class="sync-overview">
      <div class="overview-card">
        <div class="overview-icon meta">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
        </div>
        <div class="overview-info">
          <span class="overview-label">Meta</span>
          <span class="overview-count">{{ metaAccounts.length }} 个账户</span>
        </div>
        <div class="overview-status" :class="metaSyncStatus">
          {{ getSyncStatusText(metaSyncStatus) }}
        </div>
      </div>

      <div class="overview-card">
        <div class="overview-icon tiktok">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
          </svg>
        </div>
        <div class="overview-info">
          <span class="overview-label">TikTok</span>
          <span class="overview-count">{{ tiktokAccounts.length }} 个账户</span>
        </div>
        <div class="overview-status" :class="tiktokSyncStatus">
          {{ getSyncStatusText(tiktokSyncStatus) }}
        </div>
      </div>

      <div class="overview-card">
        <div class="overview-icon youtube">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
        <div class="overview-info">
          <span class="overview-label">YouTube</span>
          <span class="overview-count">{{ youtubeAccounts.length }} 个账户</span>
        </div>
        <div class="overview-status" :class="youtubeSyncStatus">
          {{ getSyncStatusText(youtubeSyncStatus) }}
        </div>
      </div>
    </div>

    <!-- 平台账户列表 -->
    <div class="platform-list">
      <!-- Meta 账户 -->
      <div class="platform-section">
        <div class="platform-header">
          <div class="platform-info">
            <div class="platform-icon meta">
              <svg viewBox="0 0 24 24" width="32" height="32">
                <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
            </div>
            <div>
              <h2 class="platform-name">Meta Ads</h2>
              <p class="platform-desc">Facebook & Instagram 广告</p>
            </div>
          </div>
          <el-button text @click="handleAddPlatform('meta')">
            <el-icon><Plus /></el-icon>
            添加账户
          </el-button>
        </div>

        <div class="account-grid" v-if="metaAccounts.length > 0">
          <AdAccountCard
            v-for="account in metaAccounts"
            :key="account.id"
            :account="account"
            platform="meta"
            @edit="handleEditAccount"
            @sync="handleSyncAccount"
            @disconnect="handleDisconnectAccount"
          />
        </div>

        <div class="empty-state" v-else>
          <el-empty description="尚未绑定 Meta 广告账户" />
        </div>
      </div>

      <!-- TikTok 账户 -->
      <div class="platform-section">
        <div class="platform-header">
          <div class="platform-info">
            <div class="platform-icon tiktok">
              <svg viewBox="0 0 24 24" width="32" height="32">
                <path fill="currentColor" d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
            </div>
            <div>
              <h2 class="platform-name">TikTok Ads</h2>
              <p class="platform-desc">TikTok 广告投放平台</p>
            </div>
          </div>
          <el-button text @click="handleAddPlatform('tiktok')">
            <el-icon><Plus /></el-icon>
            添加账户
          </el-button>
        </div>

        <div class="account-grid" v-if="tiktokAccounts.length > 0">
          <AdAccountCard
            v-for="account in tiktokAccounts"
            :key="account.id"
            :account="account"
            platform="tiktok"
            @edit="handleEditAccount"
            @sync="handleSyncAccount"
            @disconnect="handleDisconnectAccount"
          />
        </div>

        <div class="empty-state" v-else>
          <el-empty description="尚未绑定 TikTok 广告账户" />
        </div>
      </div>

      <!-- YouTube 账户 -->
      <div class="platform-section">
        <div class="platform-header">
          <div class="platform-info">
            <div class="platform-icon youtube">
              <svg viewBox="0 0 24 24" width="32" height="32">
                <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <div>
              <h2 class="platform-name">Google Ads</h2>
              <p class="platform-desc">YouTube & Google 广告</p>
            </div>
          </div>
          <el-button text @click="handleAddPlatform('youtube')">
            <el-icon><Plus /></el-icon>
            添加账户
          </el-button>
        </div>

        <div class="account-grid" v-if="youtubeAccounts.length > 0">
          <AdAccountCard
            v-for="account in youtubeAccounts"
            :key="account.id"
            :account="account"
            platform="youtube"
            @edit="handleEditAccount"
            @sync="handleSyncAccount"
            @disconnect="handleDisconnectAccount"
          />
        </div>

        <div class="empty-state" v-else>
          <el-empty description="尚未绑定 Google 广告账户" />
        </div>
      </div>
    </div>

    <!-- 同步历史 -->
    <div class="sync-history-section">
      <h3 class="section-title">同步记录</h3>
      <el-table :data="syncHistory" stripe>
        <el-table-column prop="platform" label="平台" width="120">
          <template #default="{ row }">
            <el-tag :type="getPlatformTagType(row.platform)" size="small">
              {{ getPlatformName(row.platform) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="accountName" label="账户" />
        <el-table-column prop="syncType" label="同步类型" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="recordCount" label="同步数据" width="120">
          <template #default="{ row }">
            {{ row.recordCount }} 条
          </template>
        </el-table-column>
        <el-table-column prop="syncedAt" label="同步时间" width="180" />
      </el-table>
    </div>

    <!-- 绑定流程弹窗 -->
    <AddAccountDialog
      v-model:visible="dialogVisible"
      :platform="selectedPlatform"
      @success="handleAccountAdded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import AdAccountCard from './components/AdAccountCard.vue'
import AddAccountDialog from './components/AddAccountDialog.vue'
import { useAdPlatformStore, type AdAccount, type Platform } from '@/stores/adPlatform'

const adPlatformStore = useAdPlatformStore()

// 响应式数据
const dialogVisible = ref(false)
const selectedPlatform = ref<Platform>('meta')

// 计算属性
const metaAccounts = computed(() => adPlatformStore.getAccountsByPlatform('meta'))
const tiktokAccounts = computed(() => adPlatformStore.getAccountsByPlatform('tiktok'))
const youtubeAccounts = computed(() => adPlatformStore.getAccountsByPlatform('youtube'))
const syncHistory = computed(() => adPlatformStore.syncHistory)
const metaSyncStatus = computed(() => adPlatformStore.getSyncStatus('meta'))
const tiktokSyncStatus = computed(() => adPlatformStore.getSyncStatus('tiktok'))
const youtubeSyncStatus = computed(() => adPlatformStore.getSyncStatus('youtube'))

// 方法
const handleAddAccount = () => {
  dialogVisible.value = true
}

const handleAddPlatform = (platform: Platform) => {
  selectedPlatform.value = platform
  dialogVisible.value = true
}

const handleEditAccount = (account: AdAccount) => {
  // 编辑账户配置
  console.log('编辑账户:', account)
}

const handleSyncAccount = async (account: AdAccount) => {
  try {
    await adPlatformStore.syncAccount(account.id)
    ElMessage.success(`已开始同步「${account.name}」，请稍候...`)
  } catch (error) {
    ElMessage.error('同步失败，请重试')
  }
}

const handleDisconnectAccount = async (account: AdAccount) => {
  try {
    await ElMessageBox.confirm(
      `确定要断开与「${account.name}」的连接吗？断开后将无法同步该账户的数据。`,
      '断开账户连接',
      { confirmButtonText: '确定断开', cancelButtonText: '取消', type: 'warning' }
    )
    await adPlatformStore.disconnectAccount(account.id)
    ElMessage.success('账户已断开连接')
  } catch {
    // 用户取消
  }
}

const refreshAllAccounts = async () => {
  try {
    await adPlatformStore.syncAllAccounts()
    ElMessage.success('已刷新全部账户数据')
  } catch {
    ElMessage.error('刷新失败，请重试')
  }
}

const handleAccountAdded = async (result: { id: string; scopes: string[]; syncFrequency: string; dataLookback: string }[]) => {
  try {
    await adPlatformStore.addAccounts({
      platform: selectedPlatform.value,
      accountIds: result.map(r => r.id),
      scopes: result[0]?.scopes || [],
      syncFrequency: result[0]?.syncFrequency || 'hourly',
      dataLookback: result[0]?.dataLookback || '30'
    })
    ElMessage.success('账户绑定成功')
    adPlatformStore.fetchAccounts()
  } catch {
    ElMessage.error('绑定失败，请重试')
  }
}

const getSyncStatusText = (status: string) => {
  const map: Record<string, string> = {
    synced: '已同步',
    syncing: '同步中',
    error: '同步失败',
    never: '从未同步'
  }
  return map[status] || status
}

const getPlatformName = (platform: string) => {
  const map: Record<string, string> = {
    meta: 'Meta',
    tiktok: 'TikTok',
    youtube: 'Google'
  }
  return map[platform] || platform
}

const getPlatformTagType = (platform: string) => {
  const map: Record<string, string> = {
    meta: '',
    tiktok: 'success',
    youtube: 'danger'
  }
  return map[platform] || 'info'
}

onMounted(() => {
  adPlatformStore.fetchAccounts()
})
</script>

<style scoped>
.ad-platform-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
  min-height: 100vh;
  background: var(--bg-base);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

/* 同步概览 */
.sync-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-light);
  border-radius: 12px;
}

.overview-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.overview-icon.meta {
  background: rgba(66, 103, 178, 0.1);
  color: #4267B2;
}

.overview-icon.tiktok {
  background: rgba(255, 0, 80, 0.1);
  color: #FF0050;
}

.overview-icon.youtube {
  background: rgba(255, 0, 0, 0.1);
  color: #FF0000;
}

.overview-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.overview-label {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.overview-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.overview-status {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
}

.overview-status.synced {
  background: rgba(78, 205, 196, 0.1);
  color: var(--accent-cyan);
}

.overview-status.syncing {
  background: rgba(255, 203, 71, 0.1);
  color: #FFCB47;
}

.overview-status.error {
  background: rgba(255, 82, 82, 0.1);
  color: #FF5252;
}

.overview-status.never {
  background: var(--bg-secondary);
  color: var(--text-muted);
}

/* 平台列表 */
.platform-list {
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-bottom: 32px;
}

.platform-section {
  background: var(--bg-elevated);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 24px;
}

.platform-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.platform-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.platform-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.platform-icon.meta { background: rgba(66, 103, 178, 0.1); color: #4267B2; }
.platform-icon.tiktok { background: rgba(255, 0, 80, 0.1); color: #FF0050; }
.platform-icon.youtube { background: rgba(255, 0, 0, 0.1); color: #FF0000; }

.platform-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.platform-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.account-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

/* 同步历史 */
.sync-history-section {
  background: var(--bg-elevated);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px;
}

.empty-state {
  padding: 40px 0;
}
</style>
