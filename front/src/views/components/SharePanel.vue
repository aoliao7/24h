<template>
  <div class="share-panel">
    <div class="share-panel__header">
      <h3>共享设置</h3>
      <button class="share-panel__close" @click="$emit('close')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div class="share-panel__body">
      <div class="share-section">
        <div class="share-section__title">工作流链接</div>
        <div class="share-link-box" v-if="shareTokenRoute">
          <span class="share-link">{{ shareTokenRoute }}</span>
          <button class="share-copy-btn" @click="copyShareLink">复制</button>
        </div>
        <button class="share-generate-btn" @click="$emit('generate')" v-if="!shareTokenRoute">
          生成共享链接
        </button>
        <button class="share-generate-btn" @click="$emit('generate')" v-else>
          重新生成
        </button>
      </div>

      <div class="share-section">
        <div class="share-section__row">
          <div>
            <div class="share-section__title">公开访问</div>
            <div class="share-section__desc">允许任何人通过链接查看此工作流</div>
          </div>
          <el-switch
            :model-value="isPublic"
            @update:model-value="$emit('toggle-public')"
            active-text="开"
            inactive-text="关"
          />
        </div>
      </div>

      <div class="share-section">
        <div class="share-section__header-row">
          <div class="share-section__title">协作者 ({{ collaborators.length }})</div>
        </div>

        <div class="collaborator-list" v-if="collaborators.length">
          <div v-for="collab in collaborators" :key="collab.userId" class="collaborator-item">
            <div class="collaborator-info">
              <div class="collaborator-avatar">{{ collab.name[0] }}</div>
              <div class="collaborator-meta">
                <span class="collaborator-name">{{ collab.name }}</span>
                <span class="collaborator-email">{{ collab.email }}</span>
              </div>
            </div>
            <div class="collaborator-actions">
              <el-select
                :model-value="collab.role"
                @update:model-value="$emit('update-role', collab.userId, $event)"
                size="small"
                style="width: 140px"
              >
                <el-option label="可消耗点数" value="consumer" />
                <el-option label="仅查看素材" value="viewer" />
              </el-select>
              <button class="collaborator-remove" @click="$emit('remove', collab.userId)">移除</button>
            </div>
          </div>
        </div>
        <div class="collaborator-empty" v-else>
          <span>暂无协作者</span>
        </div>

        <div class="invite-form">
          <input
            v-model="email"
            class="invite-input"
            placeholder="输入邮箱邀请成员"
            @keyup.enter="$emit('invite', email, role)"
          />
          <el-select v-model="role" size="small" style="width: 140px">
            <el-option label="可消耗点数" value="consumer" />
            <el-option label="仅查看素材" value="viewer" />
          </el-select>
          <button class="invite-btn" @click="$emit('invite', email, role)">邀请</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  collaborators: { userId: string; name: string; email: string; role: string; invitedAt: string }[]
  isPublic: boolean
  shareTokenRoute?: string
}>()

const email = ref('')
const role = ref<'consumer' | 'viewer'>('consumer')

const copyShareLink = async () => {
  if (!props.shareTokenRoute) return
  try {
    await navigator.clipboard.writeText(props.shareTokenRoute)
    ElMessage.success('链接已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

defineEmits<{
  close: []
  generate: []
  'toggle-public': []
  invite: [email: string, role: 'consumer' | 'viewer']
  'update-role': [userId: string, role: 'consumer' | 'viewer']
  remove: [userId: string]
}>()
</script>

<style scoped>
.share-panel {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.share-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border-light, #e5e7eb);
}

.share-panel__header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.share-panel__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-muted, #6b7280);
  border-radius: 8px;
  cursor: pointer;
}

.share-panel__close:hover {
  background: rgba(15, 23, 42, 0.06);
  color: var(--text-primary, #111827);
}

.share-panel__body {
  padding: 18px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.share-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.share-section__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.share-section__desc {
  font-size: 12px;
  color: var(--text-muted, #6b7280);
}

.share-section__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.share-section__header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.share-link-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border-light, #e5e7eb);
  border-radius: 10px;
  background: var(--bg-elevated, #f9fafb);
}

.share-link {
  flex: 1;
  font-size: 13px;
  color: var(--text-secondary, #374151);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.share-copy-btn,
.share-generate-btn,
.invite-btn {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-light, #e5e7eb);
  background: var(--bg-elevated, #f9fafb);
  color: var(--text-secondary, #374151);
  font-size: 13px;
  cursor: pointer;
}

.share-generate-btn:hover,
.invite-btn:hover {
  background: rgba(78, 205, 196, 0.1);
  border-color: rgba(78, 205, 196, 0.35);
  color: #0d9488;
}

.collaborator-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.collaborator-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border-light, #e5e7eb);
  border-radius: 10px;
  background: var(--bg-elevated, #f9fafb);
}

.collaborator-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.collaborator-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #4ecdc4, #a78bfa);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}

.collaborator-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.collaborator-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary, #111827);
}

.collaborator-email {
  font-size: 12px;
  color: var(--text-muted, #6b7280);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collaborator-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collaborator-remove {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: #dc2626;
  font-size: 12px;
  cursor: pointer;
}

.collaborator-remove:hover {
  background: rgba(248, 113, 113, 0.1);
  border-color: rgba(248, 113, 113, 0.35);
}

.collaborator-empty {
  padding: 12px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted, #6b7280);
  border: 1px dashed var(--border-light, #e5e7eb);
  border-radius: 10px;
}

.invite-form {
  display: flex;
  gap: 10px;
}

.invite-input {
  flex: 1;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-light, #e5e7eb);
  background: var(--bg-elevated, #f9fafb);
  color: var(--text-primary, #111827);
  font-size: 13px;
  outline: none;
}

.invite-input:focus {
  border-color: #4ecdc4;
  box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.12);
}
</style>
