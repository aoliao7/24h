<script setup lang="ts">
import { ref } from 'vue'

const members = ref([
  { id: 1, name: '张明', email: 'zhangming@company.com', role: 'admin', status: 'online' },
  { id: 2, name: '李华', email: 'lihua@company.com', role: 'editor', status: 'online' },
  { id: 3, name: '王芳', email: 'wangfang@company.com', role: 'viewer', status: 'offline' },
  { id: 4, name: '赵伟', email: 'zhaowei@company.com', role: 'editor', status: 'online' },
])

const roleLabels: Record<string, string> = { admin: '管理员', editor: '编辑者', viewer: '查看者' }
const roleColors: Record<string, string> = { admin: 'danger', editor: 'primary', viewer: 'info' }

const roles = [
  { name: '管理员', desc: '管理团队成员、积分充值、删除作品', color: '#dc2626' },
  { name: '编辑者', desc: '创建和编辑作品、使用模板、导出内容', color: '#4ecdc4' },
  { name: '查看者', desc: '仅可浏览和下载团队作品', color: '#6b7280' },
]
</script>

<template>
  <div class="team-view">
    <div class="page-header">
      <div class="header-left">
        <h1>团队管理</h1>
        <span class="member-count">4 位成员 · 3 人在线</span>
      </div>
      <button class="invite-btn btn-accent">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        邀请成员
      </button>
    </div>

    <!-- Members Table -->
    <div class="members-section card">
      <el-table :data="members">
        <el-table-column label="成员" min-width="280">
          <template #default="{ row }">
            <div class="member-cell">
              <div class="member-avatar">
                {{ row.name[0] }}
                <span class="status-indicator" :class="row.status"></span>
              </div>
              <div class="member-info">
                <span class="member-name">{{ row.name }}</span>
                <span class="member-email">{{ row.email }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="150" align="center">
          <template #default="{ row }">
            <el-tag :type="roleColors[row.role] as any" size="small">
              {{ roleLabels[row.role] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <span class="status-text" :class="row.status">
              {{ row.status === 'online' ? '在线' : '离线' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default>
            <button class="table-action-btn">编辑</button>
            <button class="table-action-btn danger">移除</button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Role Permissions -->
    <div class="permissions-section">
      <h2>权限说明</h2>
      <div class="permissions-grid">
        <div v-for="role in roles" :key="role.name" class="permission-card card">
          <div class="permission-icon" :style="{ background: `${role.color}12`, color: role.color }">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/>
              <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <h3>{{ role.name }}</h3>
          <p>{{ role.desc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.team-view {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left { display: flex; align-items: center; gap: 16px; }
.header-left h1 { font-size: 24px; font-weight: 600; color: var(--text-primary); }

.member-count {
  font-size: 13px;
  color: var(--text-muted);
  padding: 6px 14px;
  background: var(--bg-elevated);
  border-radius: 20px;
}

.invite-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
}

.members-section { margin-bottom: 32px; }

.member-cell { display: flex; align-items: center; gap: 12px; }

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  position: relative;
}

.status-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--bg-card);
}

.status-indicator.online { background: #059669; }
.status-indicator.offline { background: var(--text-muted); }

.member-info { display: flex; flex-direction: column; gap: 2px; }
.member-name { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.member-email { font-size: 12px; color: var(--text-muted); }

.status-text { font-size: 13px; }
.status-text.online { color: #059669; }
.status-text.offline { color: var(--text-muted); }

.table-action-btn {
  background: none;
  border: none;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.table-action-btn:hover {
  background: rgba(78, 205, 196, 0.08);
  color: var(--accent-cyan);
}

.table-action-btn.danger:hover {
  background: rgba(248, 113, 113, 0.08);
  color: #dc2626;
}

.permissions-section h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.permission-card {
  padding: 28px;
  text-align: center;
}

.permission-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.permission-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.permission-card p {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
}

@media (max-width: 900px) {
  .permissions-grid { grid-template-columns: 1fr; }
}
</style>
