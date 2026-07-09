import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ============ 类型定义 ============

export type Platform = 'meta' | 'tiktok' | 'youtube'
export type SyncStatus = 'synced' | 'syncing' | 'error' | 'never'
export type AccountStatus = 'active' | 'inactive' | 'error' | 'expired'

export interface AdAccount {
  id: string
  name: string
  accountId: string
  platform: Platform
  status: AccountStatus
  syncStatus: SyncStatus
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
  syncScopes: string[]
  syncFrequency: string
  dataLookback: string
  tokenExpiry?: string
}

export interface SyncRecord {
  id: string
  platform: Platform
  accountId: string
  accountName: string
  syncType: string
  status: 'success' | 'failed'
  recordCount: number
  syncedAt: string
  errorMessage?: string
}

// ============ Store 定义 ============

export const useAdPlatformStore = defineStore('adPlatform', () => {
  // ============ State ============
  const accounts = ref<AdAccount[]>([])
  const syncHistory = ref<SyncRecord[]>([])
  const isLoading = ref(false)

  // ============ Getters ============
  const getAccountsByPlatform = computed(() => (platform: Platform) => {
    return accounts.value.filter(a => a.platform === platform)
  })

  const getSyncStatus = computed(() => (platform: Platform) => {
    const platformAccounts = accounts.value.filter(a => a.platform === platform)
    if (platformAccounts.length === 0) return 'never'
    if (platformAccounts.some(a => a.syncStatus === 'syncing')) return 'syncing'
    if (platformAccounts.some(a => a.syncStatus === 'error')) return 'error'
    return 'synced'
  })

  const totalAccounts = computed(() => accounts.value.length)
  const activeAccounts = computed(() => accounts.value.filter(a => a.status === 'active'))

  // ============ Actions ============

  /**
   * 获取所有已绑定的账户
   */
  async function fetchAccounts() {
    isLoading.value = true
    try {
      // TODO: 替换为真实 API 调用
      // const res = await api.get('/ad-platforms/accounts')
      // accounts.value = res.data

      // Mock 数据
      await new Promise(resolve => setTimeout(resolve, 500))
      accounts.value = [
        {
          id: 'acc_001',
          name: 'Heedo 品牌广告',
          accountId: 'act_246801357',
          platform: 'meta',
          status: 'active',
          syncStatus: 'synced',
          lastSyncTime: new Date(Date.now() - 3600000).toISOString(),
          stats: { impressions: 1234567, clicks: 39506, ctr: 3.2, spend: 12500, conversions: 624, roas: 4.8 },
          syncScopes: ['campaigns', 'adgroups', 'ads', 'creatives', 'performance'],
          syncFrequency: 'hourly',
          dataLookback: '30'
        },
        {
          id: 'acc_002',
          name: 'Heedo 效果投放',
          accountId: 'act_135792468',
          platform: 'meta',
          status: 'active',
          syncStatus: 'error',
          lastSyncTime: new Date(Date.now() - 86400000).toISOString(),
          errorMessage: 'Token 已过期，请重新授权',
          stats: { impressions: 856234, clicks: 23974, ctr: 2.8, spend: 8900, conversions: 312, roas: 2.3 },
          syncScopes: ['campaigns', 'adgroups', 'performance'],
          syncFrequency: 'daily',
          dataLookback: '14'
        },
        {
          id: 'acc_003',
          name: 'TikTok 电商账户',
          accountId: '687291304567',
          platform: 'tiktok',
          status: 'active',
          syncStatus: 'synced',
          lastSyncTime: new Date(Date.now() - 1800000).toISOString(),
          stats: { impressions: 2345678, clicks: 58642, ctr: 2.5, spend: 15600, conversions: 891, roas: 3.2 },
          syncScopes: ['campaigns', 'adgroups', 'ads', 'creatives', 'performance'],
          syncFrequency: 'realtime',
          dataLookback: '30'
        },
        {
          id: 'acc_004',
          name: 'Google Ads 主账户',
          accountId: 'abc-123-456',
          platform: 'youtube',
          status: 'active',
          syncStatus: 'syncing',
          lastSyncTime: new Date(Date.now() - 300000).toISOString(),
          stats: { impressions: 567890, clicks: 11358, ctr: 2.0, spend: 7800, conversions: 234, roas: 2.8 },
          syncScopes: ['campaigns', 'adgroups', 'ads', 'performance'],
          syncFrequency: 'hourly',
          dataLookback: '90'
        }
      ]

      // Mock 同步历史
      syncHistory.value = [
        { id: 'sync_001', platform: 'meta', accountId: 'acc_001', accountName: 'Heedo 品牌广告', syncType: '定时同步', status: 'success', recordCount: 1234, syncedAt: '2026-07-09 14:30' },
        { id: 'sync_002', platform: 'tiktok', accountId: 'acc_003', accountName: 'TikTok 电商账户', syncType: '实时同步', status: 'success', recordCount: 567, syncedAt: '2026-07-09 14:15' },
        { id: 'sync_003', platform: 'youtube', accountId: 'acc_004', accountName: 'Google Ads 主账户', syncType: '手动同步', status: 'success', recordCount: 89, syncedAt: '2026-07-09 13:45' },
        { id: 'sync_004', platform: 'meta', accountId: 'acc_002', accountName: 'Heedo 效果投放', syncType: '定时同步', status: 'failed', recordCount: 0, syncedAt: '2026-07-09 12:00', errorMessage: 'Token 已过期' }
      ]
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 添加账户绑定
   */
  async function addAccounts(config: {
    platform: Platform
    accountIds: string[]
    scopes: string[]
    syncFrequency: string
    dataLookback: string
  }) {
    // TODO: 替换为真实 API 调用
    // await api.post('/ad-platforms/accounts', config)

    // Mock: 模拟添加成功
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 添加到本地状态（实际应从接口返回）
    config.accountIds.forEach((accountId, index) => {
      accounts.value.push({
        id: `acc_new_${Date.now()}_${index}`,
        name: `新账户 ${accountId}`,
        accountId,
        platform: config.platform,
        status: 'active',
        syncStatus: 'never',
        stats: { impressions: 0, clicks: 0, ctr: 0, spend: 0, conversions: 0, roas: 0 },
        syncScopes: config.scopes,
        syncFrequency: config.syncFrequency,
        dataLookback: config.dataLookback
      })
    })

    await fetchAccounts()
  }

  /**
   * 同步单个账户
   */
  async function syncAccount(accountId: string) {
    const account = accounts.value.find(a => a.id === accountId)
    if (!account) throw new Error('账户不存在')
    
    account.syncStatus = 'syncing'
    
    try {
      // TODO: 替换为真实 API 调用
      // await api.post(`/ad-platforms/accounts/${accountId}/sync`)

      // Mock: 模拟同步延迟
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      account.syncStatus = 'synced'
      account.lastSyncTime = new Date().toISOString()
      account.errorMessage = undefined
      
      // Mock: 更新统计数据
      account.stats = {
        impressions: Math.floor(Math.random() * 1000000) + 500000,
        clicks: Math.floor(Math.random() * 30000) + 10000,
        ctr: Math.random() * 4 + 1,
        spend: Math.floor(Math.random() * 10000) + 5000,
        conversions: Math.floor(Math.random() * 500) + 100,
        roas: Math.random() * 5 + 1
      }
    } catch (error) {
      account.syncStatus = 'error'
      account.errorMessage = '同步失败，请检查网络连接'
      throw error
    }
  }

  /**
   * 同步全部账户
   */
  async function syncAllAccounts() {
    const promises = accounts.value
      .filter(a => a.status === 'active')
      .map(a => syncAccount(a.id))
    
    await Promise.allSettled(promises)
    await fetchAccounts()
  }

  /**
   * 断开账户连接
   */
  async function disconnectAccount(accountId: string) {
    // TODO: 替换为真实 API 调用
    // await api.delete(`/ad-platforms/accounts/${accountId}`)

    // Mock: 模拟删除
    await new Promise(resolve => setTimeout(resolve, 500))
    accounts.value = accounts.value.filter(a => a.id !== accountId)
  }

  /**
   * 刷新 Token
   */
  async function refreshToken(accountId: string) {
    // TODO: 调用平台的 OAuth refresh_token 接口
    const account = accounts.value.find(a => a.id === accountId)
    if (account) {
      account.status = 'active'
      account.syncStatus = 'synced'
      await syncAccount(accountId)
    }
  }

  return {
    // State
    accounts,
    syncHistory,
    isLoading,
    // Getters
    getAccountsByPlatform,
    getSyncStatus,
    totalAccounts,
    activeAccounts,
    // Actions
    fetchAccounts,
    addAccounts,
    syncAccount,
    syncAllAccounts,
    disconnectAccount,
    refreshToken
  }
})
