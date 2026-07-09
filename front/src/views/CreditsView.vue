<script setup lang="ts">
import { computed } from 'vue'
import { useCreativeStore } from '@/stores/creative'

const store = useCreativeStore()

const formatAmount = (amount: number) => amount > 0 ? `+${amount}` : amount.toString()

const packages = [
  { amount: 100, price: 10, bonus: null, recommended: false },
  { amount: 500, price: 45, bonus: 30, recommended: false },
  { amount: 1000, price: 80, bonus: 100, recommended: true },
  { amount: 2000, price: 150, bonus: 300, recommended: false },
]

const handleRecharge = (pkg: typeof packages[0]) => {
  const actualAmount = pkg.amount + (pkg.bonus || 0)
  store.addCredits(actualAmount)
}
</script>

<template>
  <div class="credits-view">
    <div class="page-header">
      <h1>积分管理</h1>
    </div>

    <!-- Stats Cards -->
    <div class="stats-row">
      <div class="balance-card card subtle-pulse">
        <div class="balance-header">
          <span class="balance-label">当前余额</span>
          <div class="balance-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
        <div class="balance-value">{{ store.credits }}</div>
        <div class="balance-unit">积分</div>
        <button class="btn-accent recharge-btn">立即充值</button>
      </div>

      <div class="stat-card card">
        <div class="stat-icon usage">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 17L10 3L17 17H3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-label">本月使用</span>
          <span class="stat-value">1,250</span>
        </div>
        <el-progress :percentage="62" :stroke-width="4" />
      </div>

      <div class="stat-card card">
        <div class="stat-icon free">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L12.5 7.5H18L13.5 11L15.5 17L10 13.5L4.5 17L6.5 11L2 7.5H7.5L10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-label">免费次数</span>
          <span class="stat-value">5</span>
        </div>
        <el-tag size="small" type="success">每天 0 点刷新</el-tag>
      </div>
    </div>

    <!-- Transactions -->
    <div class="section card">
      <div class="section-header">
        <h2>消耗明细</h2>
        <button class="export-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 10V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M4 6V2H12V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M8 9V4M8 4L5 7M8 4L11 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          导出记录
        </button>
      </div>

      <el-table :data="store.transactions" stripe>
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="desc" label="描述" />
        <el-table-column label="积分" width="120" align="center">
          <template #default="{ row }">
            <span class="amount-value" :class="{ positive: row.amount > 0, negative: row.amount < 0 }">
              {{ formatAmount(row.amount) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Packages -->
    <div class="section">
      <h2>充值套餐</h2>
      <div class="packages-grid">
        <div v-for="pkg in packages" :key="pkg.amount" class="package-card card" :class="{ recommended: pkg.recommended }">
          <div v-if="pkg.recommended" class="recommended-badge">推荐</div>
          <div class="pkg-amount">{{ pkg.amount }}</div>
          <div class="pkg-label">积分</div>
          <div class="pkg-price">¥{{ pkg.price }}</div>
          <div class="pkg-bonus" :class="{ 'has-bonus': pkg.bonus }">
            {{ pkg.bonus ? `+${pkg.bonus} 赠送` : '无优惠' }}
          </div>
          <button class="pkg-btn" :class="{ primary: pkg.recommended }" @click="handleRecharge(pkg)">
            立即充值
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.credits-view {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 24px; font-weight: 600; color: var(--text-primary); }

.stats-row {
  display: grid;
  grid-template-columns: 280px 1fr 1fr;
  gap: 20px;
  margin-bottom: 32px;
}

.balance-card {
  padding: 28px;
  text-align: center;
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.balance-label { font-size: 13px; color: var(--text-muted); }

.balance-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.balance-value {
  font-size: 52px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.balance-unit { font-size: 14px; color: var(--text-muted); margin-bottom: 24px; }

.recharge-btn {
  width: 100%;
  padding: 12px;
}

.stat-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.usage { background: rgba(251, 191, 36, 0.08); color: #d97706; }
.stat-icon.free { background: rgba(52, 211, 153, 0.08); color: #059669; }

.stat-content { display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 12px; color: var(--text-muted); }
.stat-value { font-size: 28px; font-weight: 600; color: var(--text-primary); }

.section { margin-bottom: 32px; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 { font-size: 16px; font-weight: 600; color: var(--text-primary); }

.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:hover { border-color: var(--accent-cyan); color: var(--accent-cyan); }

.amount-value { font-weight: 600; font-size: 14px; }
.amount-value.positive { color: #059669; }
.amount-value.negative { color: #dc2626; }

.packages-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.package-card {
  padding: 24px 20px;
  text-align: center;
  position: relative;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 240px;
}

.package-card.recommended {
  border-color: var(--accent-cyan);
  box-shadow: 0 4px 20px rgba(78, 205, 196, 0.12);
}

.recommended-badge {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 12px;
  background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}

.pkg-amount {
  font-size: 42px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1;
  margin-bottom: 4px;
}

.pkg-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.pkg-price {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.pkg-bonus {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 20px;
  min-height: 18px;
}

.pkg-bonus.has-bonus {
  color: #059669;
  font-weight: 500;
}

.pkg-btn {
  width: 100%;
  padding: 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: auto;
}

.pkg-btn.primary {
  background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
  border: none;
  color: #fff;
}

.pkg-btn:hover { transform: translateY(-2px); }
.pkg-btn.primary:hover { box-shadow: 0 4px 16px rgba(78, 205, 196, 0.3); }

@media (max-width: 1200px) {
  .stats-row { grid-template-columns: 1fr 1fr; }
  .balance-card { grid-column: span 2; }
  .packages-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .stats-row { grid-template-columns: 1fr; }
  .balance-card { grid-column: span 1; }
  .packages-grid { grid-template-columns: 1fr; }
}
</style>
