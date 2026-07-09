<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()

const workflowId = computed(() => route.params.id as string)

// 模拟工作流数据
const workflow = ref({
  id: workflowId.value,
  name: '产品图片生成工作流',
  createdAt: '2026-07-09',
  ownerId: 'user-1',
  consumerCredits: 50,
  collaborators: [
    { userId: 'user-2', name: '张三', email: 'zhangsan@example.com', role: 'consumer', credits: 20, invitedAt: '2026-07-08' },
    { userId: 'user-3', name: '李四', email: 'lisi@example.com', role: 'viewer', credits: 0, invitedAt: '2026-07-07' },
  ],
})

const workflows = computed(() => [
  { id: 'wf-1', name: '产品图片生成工作流' },
  { id: 'wf-2', name: '文案生成工作流' },
  { id: 'wf-3', name: '视频剪辑工作流' },
])

const selectedWorkflowId = ref(workflowId.value)

const switchWorkflow = (id: string) => {
  selectedWorkflowId.value = id
  router.push(`/workflows/${id}/permissions`)
}

const currentUserId = () => 'user-1'

const currentUserRole = computed(() => {
  if (workflow.value.ownerId === currentUserId()) return 'owner'
  const collab = workflow.value.collaborators.find(c => c.userId === currentUserId())
  return collab?.role || 'viewer'
})

const roleLabels: Record<string, string> = {
  owner: '拥有者',
  consumer: '可消耗点数',
  viewer: '仅查看素材',
}

const members = computed(() => {
  return [
    {
      userId: workflow.value.ownerId,
      name: '我',
      email: 'owner@example.com',
      role: 'owner',
      invitedAt: workflow.value.createdAt,
    },
    ...workflow.value.collaborators,
  ]
})

const canEditRole = (member: { userId: string; role: string }) => {
  if (currentUserRole.value !== 'owner') return false
  if (member.role === 'owner') return false
  return true
}

const canRemoveMember = (member: { userId: string; role: string }) => {
  if (currentUserRole.value !== 'owner') return false
  if (member.role === 'owner') return false
  return true
}

const isOwner = computed(() => currentUserRole.value === 'owner')

const editingCredits = ref(false)
const creditInput = ref(String(workflow.value.consumerCredits))

const startEditCredits = () => {
  creditInput.value = String(workflow.value.consumerCredits)
  editingCredits.value = true
}

const saveCredits = () => {
  const next = Number(creditInput.value)
  if (!Number.isInteger(next) || next < 0) {
    ElMessage.warning('请输入有效的非负整数')
    return
  }
  workflow.value.consumerCredits = next
  editingCredits.value = false
  ElMessage.success('可消耗点数已更新')
}

const cancelEditCredits = () => {
  creditInput.value = String(workflow.value.consumerCredits)
  editingCredits.value = false
}

const updateMemberRole = async (userId: string, role: 'consumer' | 'viewer') => {
  const member = workflow.value.collaborators.find(c => c.userId === userId)
  if (!member) return
  member.role = role
  if (role === 'viewer') {
    member.credits = 0
  } else if (role === 'consumer' && !Number.isInteger(member.credits)) {
    member.credits = 0
  }
  ElMessage.success('权限已更新')
}

const removeMember = async (userId: string) => {
  await ElMessageBox.confirm('确定要移除该成员吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  workflow.value.collaborators = workflow.value.collaborators.filter(c => c.userId !== userId)
  ElMessage.success('已移除')
}

const inviteEmail = ref('')
const inviteRole = ref<'consumer' | 'viewer'>('consumer')

const editingMemberId = ref<string | null>(null)
const memberCreditInput = ref('0')

const startEditMemberCredits = (member: { userId: string; credits: number }) => {
  memberCreditInput.value = String(member.credits)
  editingMemberId.value = member.userId
}

const saveMemberCredits = async (userId: string) => {
  const next = Number(memberCreditInput.value)
  if (!Number.isInteger(next) || next < 0) {
    ElMessage.warning('请输入有效的非负整数')
    return
  }
  const member = workflow.value.collaborators.find(c => c.userId === userId)
  if (!member) return
  member.credits = next
  editingMemberId.value = null
  ElMessage.success('成员点数已更新')
}

const cancelEditMemberCredits = () => {
  editingMemberId.value = null
}

const inviteMember = async () => {
  const email = inviteEmail.value.trim()
  if (!email) {
    ElMessage.warning('请输入邮箱')
    return
  }
  if (workflow.value.collaborators.some(c => c.email === email)) {
    ElMessage.warning('该成员已在列表中')
    return
  }
  const role = inviteRole.value
  let credits = 0
  if (role === 'consumer') {
    const input = await ElMessageBox.prompt('请输入该成员的可消耗点数', '设置点数', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^[0-9]\d*$/,
      inputErrorMessage: '请输入非负整数',
      inputValue: '10',
    }).catch(() => null)
    if (!input) return
    credits = Number(input.value)
  }
  workflow.value.collaborators.push({
    userId: 'user-' + Math.random().toString(36).slice(2, 8),
    name: email.split('@')[0],
    email,
    role,
    credits,
    invitedAt: new Date().toLocaleDateString('zh-CN'),
  })
  ElMessage.success('邀请成功')
  inviteEmail.value = ''
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="workflow-permissions-view">
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 10H5M5 10L10 5M5 10L10 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div>
          <h1>权限管理</h1>
          <div class="workflow-select">
            <el-select v-model="selectedWorkflowId" @update:model-value="switchWorkflow($event as string)" size="large">
              <el-option
                v-for="item in workflows"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </div>
        </div>
      </div>
      <div class="header-right">
        <span class="role-badge" :class="currentUserRole">{{ roleLabels[currentUserRole] }}</span>
      </div>
    </div>

    <div class="permissions-content card">
      <div class="section">
        <div class="section-header">
          <h2>成员与权限</h2>
          <p class="section-desc">管理工作流协作者的角色和访问权限</p>
        </div>

        <div class="permission-types">
          <div class="permission-type-card">
            <div class="permission-icon owner">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L12.5 7H18L13.5 10.5L15.5 17L10 13.5L4.5 17L6.5 10.5L2 7H7.5L10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="permission-info">
              <h3>拥有者</h3>
              <p>拥有工作流的所有权限，包括管理成员、修改工作流、删除工作流</p>
            </div>
          </div>
          <div class="permission-type-card">
            <div class="permission-icon consumer">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
                <path d="M10 6V10L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="permission-info">
              <h3>可消耗点数</h3>
              <p>可以运行工作流并消耗素材积分，编辑节点内容，下载生成结果</p>
            </div>
          </div>
          <div class="permission-type-card">
            <div class="permission-icon viewer">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 10C2 10 4 5 10 5C16 5 18 10 18 10C18 10 16 15 10 15C4 15 2 10 2 10Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </div>
            <div class="permission-info">
              <h3>仅查看素材</h3>
              <p>只能查看工作流和素材，无法运行工作流或消耗积分</p>
            </div>
          </div>
        </div>

        <div class="credits-section" v-if="isOwner">
          <div class="credits-header">
            <div>
              <h3>工作流可消耗点数</h3>
              <p class="section-desc">拥有者可设置该工作流允许消耗的额度</p>
            </div>
            <div class="credits-controls">
              <template v-if="editingCredits">
                <input v-model="creditInput" class="credits-input" />
                <button class="credits-btn" @click="saveCredits">保存</button>
                <button class="credits-btn ghost" @click="cancelEditCredits">取消</button>
              </template>
              <template v-else>
                <span class="credits-value">{{ workflow.consumerCredits }}</span>
                <button class="credits-btn" @click="startEditCredits">修改</button>
              </template>
            </div>
          </div>
        </div>

        <div class="members-section">
          <h3>成员列表</h3>
          <div class="members-list">
            <div v-for="member in members" :key="member.userId" class="member-item">
              <div class="member-info">
                <div class="member-avatar">{{ member.name[0] }}</div>
                <div class="member-details">
                  <span class="member-name">{{ member.name }}</span>
                  <span class="member-email">{{ member.email }}</span>
                </div>
              </div>
              <div class="member-actions">
                <span class="role-tag" :class="member.role">{{ roleLabels[member.role] }}</span>
                <el-select
                  v-if="canEditRole(member)"
                  :model-value="member.role"
                  @update:model-value="updateMemberRole(member.userId, $event)"
                  size="small"
                  style="width: 140px"
                >
                  <el-option label="可消耗点数" value="consumer" />
                  <el-option label="仅查看素材" value="viewer" />
                </el-select>
                <div v-if="member.role === 'consumer' && isOwner" class="member-credits">
                  <template v-if="editingMemberId === member.userId">
                    <input v-model="memberCreditInput" class="member-credits-input" />
                    <button class="credits-edit-btn" @click="saveMemberCredits(member.userId)">保存</button>
                    <button class="credits-edit-btn ghost" @click="cancelEditMemberCredits">取消</button>
                  </template>
                  <template v-else>
                    <button class="credits-edit-btn" @click="startEditMemberCredits(member)">点数：{{ member.credits }}</button>
                  </template>
                </div>
                <button
                  v-if="canRemoveMember(member)"
                  class="remove-btn"
                  @click="removeMember(member.userId)"
                >
                  移除
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="invite-section" v-if="currentUserRole === 'owner'">
          <h3>邀请成员</h3>
          <div class="invite-form">
            <input
              v-model="inviteEmail"
              class="invite-input"
              placeholder="输入邮箱地址"
              @keyup.enter="inviteMember"
            />
            <el-select v-model="inviteRole" size="small" style="width: 160px">
              <el-option label="可消耗点数" value="consumer" />
              <el-option label="仅查看素材" value="viewer" />
            </el-select>
            <button class="invite-btn btn-accent" @click="inviteMember">邀请</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workflow-permissions-view {
  padding: 32px;
  max-width: 900px;
  margin: 0 auto;
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-light);
  border-radius: 10px;
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.back-btn:hover {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
  background: rgba(78, 205, 196, 0.08);
}

.header-left h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.workflow-name {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
  display: block;
}

.workflow-select {
  margin-top: 6px;
  font-size: 16px;
}

.workflow-select :deep(.el-select) {
  width: 100%;
}

.workflow-select :deep(.el-select__wrapper) {
  min-height: 42px;
}

.header-right {
  display: flex;
  align-items: center;
}

.role-badge {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(78, 205, 196, 0.1);
  color: #0d9488;
  border: 1px solid rgba(78, 205, 196, 0.25);
}

.role-badge.viewer {
  background: rgba(107, 114, 128, 0.08);
  color: #4b5563;
  border-color: rgba(107, 114, 128, 0.25);
}

.permissions-content {
  padding: 24px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.section-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin: 6px 0 0;
}

.permission-types {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.permission-type-card {
  padding: 20px;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  background: var(--bg-elevated);
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.permission-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.permission-icon.owner {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.permission-icon.consumer {
  background: rgba(78, 205, 196, 0.1);
  color: #0d9488;
}

.permission-icon.viewer {
  background: rgba(107, 114, 128, 0.08);
  color: #4b5563;
}

.permission-info h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px;
}

.permission-info p {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.55;
  margin: 0;
}

.credits-section {
  padding: 16px;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  background: var(--bg-elevated);
}

.credits-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.credits-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.credits-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.credits-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 32px;
  text-align: center;
}

.credits-input {
  width: 100px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-light);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.credits-input:focus {
  border-color: #4ecdc4;
  box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.12);
}

.credits-btn {
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #4ecdc4, #a78bfa);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.credits-btn:hover {
  transform: translateY(1px);
  box-shadow: 0 6px 14px rgba(78, 205, 196, 0.25);
}

.credits-btn.ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-light);
}

.credits-btn.ghost:hover {
  background: var(--bg-elevated);
}

.member-credits {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.member-credits-input {
  width: 90px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-light);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
}

.member-credits-input:focus {
  border-color: #4ecdc4;
  box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.12);
}

.credits-edit-btn {
  padding: 6px 10px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #4ecdc4, #a78bfa);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.credits-edit-btn:hover {
  transform: translateY(1px);
  box-shadow: 0 6px 14px rgba(78, 205, 196, 0.25);
}

.credits-edit-btn.ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-light);
}

.credits-edit-btn.ghost:hover {
  background: var(--bg-elevated);
}

.members-section h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border-light);
  border-radius: 10px;
  background: var(--bg-elevated);
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #4ecdc4, #a78bfa);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.member-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.member-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.member-email {
  font-size: 12px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-tag {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(78, 205, 196, 0.1);
  color: #0d9488;
  border: 1px solid rgba(78, 205, 196, 0.25);
  white-space: nowrap;
}

.role-tag.viewer {
  background: rgba(107, 114, 128, 0.08);
  color: #4b5563;
  border-color: rgba(107, 114, 128, 0.25);
}

.remove-btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: #dc2626;
  font-size: 12px;
  cursor: pointer;
}

.remove-btn:hover {
  background: rgba(248, 113, 113, 0.1);
  border-color: rgba(248, 113, 113, 0.35);
}

.invite-section {
  padding-top: 20px;
  border-top: 1px solid var(--border-subtle);
}

.invite-section h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.invite-form {
  display: flex;
  gap: 10px;
  align-items: center;
}

.invite-input {
  flex: 1;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-light);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.invite-input:focus {
  border-color: #4ecdc4;
  box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.12);
}

.invite-btn {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #4ecdc4, #a78bfa);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.invite-btn:hover {
  transform: translateY(1px);
  box-shadow: 0 8px 18px rgba(78, 205, 196, 0.25);
}

@media (max-width: 860px) {
  .permission-types { grid-template-columns: 1fr; }
  .member-item { flex-direction: column; align-items: flex-start; }
  .member-actions { width: 100%; justify-content: space-between; }
  .invite-form { flex-direction: column; align-items: stretch; }
}
</style>
