<template>
  <el-dialog
    :model-value="visible"
    :title="`绑定 ${platformName} 广告账户`"
    width="560px"
    :close-on-click-modal="currentStep > 1"
    :close-on-press-escape="currentStep > 1"
    @closed="handleClosed"
    @update:model-value="$emit('update:visible', $event)"
  >
    <!-- 步骤指示器 -->
    <div class="step-indicator">
      <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
        <div class="step-number">{{ currentStep > 1 ? '✓' : '1' }}</div>
        <span class="step-label">授权账户</span>
      </div>
      <div class="step-line" :class="{ active: currentStep > 1 }"></div>
      <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
        <div class="step-number">{{ currentStep > 2 ? '✓' : '2' }}</div>
        <span class="step-label">选择账户</span>
      </div>
      <div class="step-line" :class="{ active: currentStep > 2 }"></div>
      <div class="step" :class="{ active: currentStep >= 3 }">
        <div class="step-number">3</div>
        <span class="step-label">配置同步</span>
      </div>
    </div>

    <!-- Step 1: OAuth 授权 -->
    <div class="step-content" v-show="currentStep === 1">
      <div class="oauth-container">
        <div class="platform-badge" :class="platform">
          <el-icon :size="20"><component :is="platformIcon" /></el-icon>
          <span>{{ platformName }}</span>
        </div>

        <h3 class="oauth-title">授权访问您的广告账户</h3>
        <p class="oauth-desc">
          点击下方按钮，跳转到 {{ platformName }} 完成授权。
          授权后，我们将可以读取您的广告账户和投放数据。
        </p>

        <div class="permission-list">
          <h4>我们将获取以下权限：</h4>
          <ul>
            <li>
              <el-icon><Check /></el-icon>
              <span>读取广告账户信息</span>
            </li>
            <li>
              <el-icon><Check /></el-icon>
              <span>读取广告系列、广告组数据</span>
            </li>
            <li>
              <el-icon><Check /></el-icon>
              <span>读取投放效果数据（曝光、点击、消耗等）</span>
            </li>
            <li>
              <el-icon><Check /></el-icon>
              <span>读取广告素材信息</span>
            </li>
          </ul>
        </div>

        <div class="security-note">
          <el-icon><Lock /></el-icon>
          <span>我们不会存储您的登录凭证，数据传输使用 HTTPS 加密</span>
        </div>

        <el-button type="primary" size="large" class="oauth-btn" @click="handleOAuth">
          <span>使用 {{ platformName }} 授权</span>
          <el-icon><ArrowRight /></el-icon>
        </el-button>

        <!-- OAuth 模拟（实际项目中替换为真实跳转） -->
        <div class="oauth-mock" v-if="isMockMode">
          <el-alert type="info" :closable="false">
            开发模式：点击后将模拟 OAuth 授权流程
          </el-alert>
        </div>
      </div>
    </div>

    <!-- Step 2: 选择广告账户 -->
    <div class="step-content" v-show="currentStep === 2">
      <div class="account-select">
        <h3 class="step-title">选择要绑定的广告账户</h3>
        <p class="step-desc">请选择您要管理的广告账户，一个平台可以绑定多个账户</p>

        <div class="account-list">
          <div
            v-for="account in availableAccounts"
            :key="account.id"
            class="account-option"
            :class="{ selected: selectedAccountIds.includes(account.id) }"
            @click="toggleAccount(account)"
          >
            <el-checkbox
              :model-value="selectedAccountIds.includes(account.id)"
              @click.stop
              @change="toggleAccount(account)"
            />
            <div class="account-info">
              <span class="account-name">{{ account.name }}</span>
              <span class="account-id">ID: {{ account.id }}</span>
            </div>
            <div class="account-currency">{{ account.currency }}</div>
          </div>
        </div>

        <div class="selected-count" v-if="selectedAccountIds.length > 0">
          已选择 {{ selectedAccountIds.length }} 个账户
        </div>

        <div class="step-actions">
          <el-button @click="currentStep = 1">上一步</el-button>
          <el-button type="primary" :disabled="selectedAccountIds.length === 0" @click="currentStep = 3">
            下一步
          </el-button>
        </div>
      </div>
    </div>

    <!-- Step 3: 配置同步范围 -->
    <div class="step-content" v-show="currentStep === 3">
      <div class="sync-config">
        <h3 class="step-title">配置数据同步范围</h3>
        <p class="step-desc">选择要同步哪些类型的数据，建议保持全选以获得完整分析能力</p>

        <div class="scope-options">
          <div
            v-for="scope in syncScopeOptions"
            :key="scope.key"
            class="scope-option"
            :class="{ selected: selectedScopes.includes(scope.key) }"
            @click="toggleScope(scope.key)"
          >
            <el-icon :size="24"><component :is="scope.icon" /></el-icon>
            <div class="scope-info">
              <span class="scope-name">{{ scope.name }}</span>
              <span class="scope-desc">{{ scope.desc }}</span>
            </div>
            <el-icon class="check-icon" v-if="selectedScopes.includes(scope.key)"><Check /></el-icon>
          </div>
        </div>

        <div class="sync-settings">
          <h4>同步频率</h4>
          <el-radio-group v-model="syncFrequency" size="default">
            <el-radio-button value="realtime">实时</el-radio-button>
            <el-radio-button value="hourly">每小时</el-radio-button>
            <el-radio-button value="daily">每天</el-radio-button>
          </el-radio-group>
        </div>

        <div class="sync-settings">
          <h4>数据回溯范围</h4>
          <el-select v-model="dataLookback" size="default" style="width: 100%;">
            <el-option value="7" label="最近 7 天" />
            <el-option value="14" label="最近 14 天" />
            <el-option value="30" label="最近 30 天" />
            <el-option value="90" label="最近 90 天" />
            <el-option value="all" label="全部历史数据" />
          </el-select>
        </div>

        <div class="step-actions">
          <el-button @click="currentStep = 2">上一步</el-button>
          <el-button type="primary" @click="handleSubmit">
            完成绑定
          </el-button>
        </div>
      </div>
    </div>

    <!-- Loading 状态 -->
    <div class="loading-overlay" v-if="loading">
      <el-icon class="loading-spinner" :size="32"><Loading /></el-icon>
      <span>{{ loadingText }}</span>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Check, Lock, ArrowRight, Loading,
  Folder, Document, Picture, TrendCharts, User
} from '@element-plus/icons-vue'

interface AvailableAccount {
  id: string
  name: string
  currency: string
  timezone: string
}

const props = defineProps<{
  visible: boolean
  platform: 'meta' | 'tiktok' | 'youtube'
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: [accounts: { id: string; scopes: string[]; syncFrequency: string; dataLookback: string }[]]
}>()

// 状态
const currentStep = ref(1)
const loading = ref(false)
const loadingText = ref('')
const isMockMode = ref(true) // 开发模式标志
const selectedAccountIds = ref<string[]>([])
const selectedScopes = ref<string[]>(['campaigns', 'adgroups', 'ads', 'creatives', 'performance'])
const syncFrequency = ref('hourly')
const dataLookback = ref('30')

// Mock 数据
const availableAccounts = ref<AvailableAccount[]>([])

// 计算属性
const platformName = computed(() => {
  const map: Record<string, string> = { meta: 'Meta', tiktok: 'TikTok', youtube: 'Google' }
  return map[props.platform] || props.platform
})

const platformIcon = computed(() => User)

// 同步范围选项
const syncScopeOptions = [
  { key: 'campaigns', name: '广告系列', desc: '广告系列层级数据', icon: 'Folder' },
  { key: 'adgroups', name: '广告组', desc: '广告组层级数据', icon: 'Document' },
  { key: 'ads', name: '广告', desc: '单条广告数据', icon: 'Picture' },
  { key: 'creatives', name: '素材', desc: '广告素材信息', icon: 'Picture' },
  { key: 'performance', name: '效果数据', desc: '曝光、点击、消耗、转化', icon: 'TrendCharts' }
]

// 监听器
watch(() => props.visible, (val) => {
  if (val) {
    // 打开弹窗时重置
    currentStep.value = 1
    selectedAccountIds.value = []
    loading.value = false
    // 模拟加载可用账户
    loadAvailableAccounts()
  }
})

// 方法
const loadAvailableAccounts = async () => {
  // 模拟 API 调用
  await new Promise(resolve => setTimeout(resolve, 500))
  availableAccounts.value = [
    { id: 'act_123456', name: '品牌广告账户', currency: 'CNY', timezone: 'Asia/Shanghai' },
    { id: 'act_789012', name: '效果广告账户', currency: 'CNY', timezone: 'Asia/Shanghai' },
    { id: 'act_345678', name: '测试广告账户', currency: 'USD', timezone: 'America/Los_Angeles' }
  ]
}

const handleOAuth = async () => {
  if (isMockMode.value) {
    // 模拟 OAuth 授权
    loading.value = true
    loadingText.value = '正在连接服务器...'
    await new Promise(resolve => setTimeout(resolve, 1000))
    loadingText.value = '验证授权信息...'
    await new Promise(resolve => setTimeout(resolve, 800))
    loading.value = false
    currentStep.value = 2
  } else {
    // 真实 OAuth 跳转
    const oauthUrls = {
      meta: 'https://www.facebook.com/v18.0/dialog/oauth?client_id=YOUR_APP_ID&redirect_uri=YOUR_CALLBACK_URL&scope=ads_management,ads_read',
      tiktok: 'https://business-api.tiktok.com/portal/auth?app_id=YOUR_APP_ID&redirect_uri=YOUR_CALLBACK_URL',
      youtube: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_CALLBACK_URL&scope=https://www.googleapis.com/auth/adwords'
    }
    window.location.href = oauthUrls[props.platform]
  }
}

const toggleAccount = (account: AvailableAccount) => {
  const index = selectedAccountIds.value.indexOf(account.id)
  if (index === -1) {
    selectedAccountIds.value.push(account.id)
  } else {
    selectedAccountIds.value.splice(index, 1)
  }
}

const toggleScope = (scope: string) => {
  const index = selectedScopes.value.indexOf(scope)
  if (index === -1) {
    selectedScopes.value.push(scope)
  } else {
    selectedScopes.value.splice(index, 1)
  }
}

const handleSubmit = async () => {
  loading.value = true
  loadingText.value = '正在绑定账户并初始化同步...'
  
  try {
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const result = selectedAccountIds.value.map(id => ({
      id,
      scopes: [...selectedScopes.value],
      syncFrequency: syncFrequency.value,
      dataLookback: dataLookback.value
    }))
    
    emit('success', result)
    emit('update:visible', false)
  } catch (error) {
    console.error('绑定失败:', error)
  } finally {
    loading.value = false
  }
}

const handleClosed = () => {
  currentStep.value = 1
  selectedAccountIds.value = []
  selectedScopes.value = ['campaigns', 'adgroups', 'ads', 'creatives', 'performance']
  syncFrequency.value = 'hourly'
  dataLookback.value = '30'
}
</script>

<style scoped>
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  margin-bottom: 24px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-secondary);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.step.active .step-number {
  background: var(--accent-cyan);
  color: #fff;
}

.step.completed .step-number {
  background: #10B981;
  color: #fff;
}

.step-label {
  font-size: 12px;
  color: var(--text-muted);
}

.step.active .step-label {
  color: var(--accent-cyan);
}

.step-line {
  width: 80px;
  height: 2px;
  background: var(--bg-secondary);
  margin: 0 16px 20px;
  transition: background 0.3s;
}

.step-line.active {
  background: var(--accent-cyan);
}

/* Step 1: OAuth */
.oauth-container {
  text-align: center;
  padding: 0 20px;
}

.platform-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 24px;
}

.platform-badge.meta { background: rgba(66, 103, 178, 0.1); color: #4267B2; }
.platform-badge.tiktok { background: rgba(255, 0, 80, 0.1); color: #FF0050; }
.platform-badge.youtube { background: rgba(255, 0, 0, 0.1); color: #FF0000; }

.oauth-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.oauth-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 24px;
}

.permission-list {
  text-align: left;
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.permission-list h4 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.permission-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.permission-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.permission-list li .el-icon {
  color: var(--accent-cyan);
}

.security-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.oauth-btn {
  width: 100%;
  height: 48px;
  font-size: 15px;
}

.oauth-mock {
  margin-top: 16px;
}

/* Step 2: 选择账户 */
.step-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
  text-align: left;
}

.step-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 20px;
  text-align: left;
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.account-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.account-option:hover {
  background: var(--bg-elevated);
  border-color: var(--border-light);
}

.account-option.selected {
  background: rgba(78, 205, 196, 0.08);
  border-color: var(--accent-cyan);
}

.account-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.account-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.account-id {
  font-size: 12px;
  color: var(--text-muted);
}

.account-currency {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-base);
  padding: 4px 8px;
  border-radius: 4px;
}

.selected-count {
  text-align: center;
  font-size: 13px;
  color: var(--accent-cyan);
  margin-bottom: 16px;
}

/* Step 3: 配置同步 */
.sync-settings {
  margin-bottom: 20px;
}

.sync-settings h4 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.scope-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.scope-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.scope-option:hover {
  border-color: var(--border-light);
}

.scope-option.selected {
  background: rgba(78, 205, 196, 0.08);
  border-color: var(--accent-cyan);
}

.scope-option .el-icon {
  color: var(--text-secondary);
}

.scope-option.selected .el-icon {
  color: var(--accent-cyan);
}

.scope-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.scope-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.scope-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.check-icon {
  color: var(--accent-cyan);
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-light);
}

/* Loading */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-size: 14px;
  color: var(--text-secondary);
  border-radius: 8px;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
