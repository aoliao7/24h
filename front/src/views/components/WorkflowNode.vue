<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'

interface OutputData {
  type: string
  label: string
}

const props = defineProps<{
  id: string
  label: string
  data: {
    status: string
    nodeDefId: string
    outputData: OutputData | null
  }
  selected?: boolean
}>()

const DATA_TYPE_COLORS: Record<string, string> = {
  image: '#4ecdc4',
  text:  '#a78bfa',
  video: '#60a5fa',
  none:  '#9ca3af',
}

const DATA_TYPE_LABELS: Record<string, string> = {
  image: '图片',
  text:  '文本',
  video: '视频',
  none:  '无',
}

const outputColor = computed(() => {
  return DATA_TYPE_COLORS[props.data.outputData?.type || 'none']
})
</script>

<template>
  <div
    class="wf-node"
    :class="{
      'wf-node--running': data.status === 'running',
      'wf-node--done': data.status === 'done',
      'wf-node--selected': selected,
    }"
    :style="{
      '--node-accent': outputColor,
    }"
  >
    <!-- 输入端口 -->
    <Handle
      id="in-image"
      type="target"
      :position="Position.Left"
      :style="{ background: DATA_TYPE_COLORS['image'], width: '12px', height: '12px', top: '30%', left: '-6px', opacity: 0, transition: 'opacity 0.15s' }"
    />
    <Handle
      id="in-text"
      type="target"
      :position="Position.Left"
      :style="{ background: DATA_TYPE_COLORS['text'], width: '12px', height: '12px', top: '50%', left: '-6px', opacity: 0, transition: 'opacity 0.15s' }"
    />
    <Handle
      id="in-video"
      type="target"
      :position="Position.Left"
      :style="{ background: DATA_TYPE_COLORS['video'], width: '12px', height: '12px', top: '70%', left: '-6px', opacity: 0, transition: 'opacity 0.15s' }"
    />

    <!-- 节点主体 -->
    <div class="wf-node__body">
      <div class="wf-node__status">
        <span v-if="data.status === 'running'" class="spin-icon">⟳</span>
        <span v-else-if="data.status === 'done'" class="done-icon">✓</span>
        <span v-else class="idle-icon">○</span>
      </div>

      <div class="wf-node__title">{{ label }}</div>

      <div class="wf-node__output" v-if="data.outputData">
        <span
          class="type-tag"
          :style="{
            color: DATA_TYPE_COLORS[data.outputData.type],
            background: DATA_TYPE_COLORS[data.outputData.type] + '18',
            border: `1px solid ${DATA_TYPE_COLORS[data.outputData.type]}30`,
          }"
        >
          {{ DATA_TYPE_LABELS[data.outputData.type] }}
        </span>
      </div>
      <div class="wf-node__hint" v-else>
        <span class="hint-text">等待输入</span>
      </div>
    </div>

    <!-- 输出端口 -->
    <Handle
      id="out-image"
      type="source"
      :position="Position.Right"
      :style="{ background: DATA_TYPE_COLORS['image'], width: '12px', height: '12px', top: '30%', right: '-6px', opacity: 0, transition: 'opacity 0.15s' }"
    />
    <Handle
      id="out-text"
      type="source"
      :position="Position.Right"
      :style="{ background: DATA_TYPE_COLORS['text'], width: '12px', height: '12px', top: '50%', right: '-6px', opacity: 0, transition: 'opacity 0.15s' }"
    />
    <Handle
      id="out-video"
      type="source"
      :position="Position.Right"
      :style="{ background: DATA_TYPE_COLORS['video'], width: '12px', height: '12px', top: '70%', right: '-6px', opacity: 0, transition: 'opacity 0.15s' }"
    />
  </div>
</template>

<style scoped>
.wf-node {
  min-width: 160px;
  background: #fff;
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: border-color 0.2s, box-shadow 0.2s;
  position: relative;
}

.wf-node:hover {
  border-color: var(--node-accent, rgba(78, 205, 196, 0.4));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.wf-node:hover :deep(.vue-flow__handle) {
  opacity: 1 !important;
}

.wf-node--running {
  border-color: var(--node-accent, #4ecdc4);
  box-shadow: 0 0 0 2px rgba(78, 205, 196, 0.15), 0 4px 20px rgba(78, 205, 196, 0.2);
  animation: node-glow 1.5s ease-in-out infinite;
}

@keyframes node-glow {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.wf-node--done {
  border-color: rgba(52, 211, 153, 0.4);
}

.wf-node--selected {
  border-color: #4ecdc4 !important;
  box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.2), 0 4px 16px rgba(0,0,0,0.1) !important;
}

.wf-node__body {
  padding: 12px 20px 12px 18px;
  text-align: center;
}

.wf-node__status {
  font-size: 16px;
  margin-bottom: 4px;
  height: 20px;
}

.spin-icon {
  display: inline-block;
  animation: spin 1s linear infinite;
  color: #4ecdc4;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.done-icon {
  color: #059669;
  font-weight: 700;
}

.idle-icon {
  color: #9ca3af;
}

.wf-node__title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1f36;
  margin-bottom: 6px;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  letter-spacing: 0.01em;
}

.wf-node__output {
  display: flex;
  justify-content: center;
}

.type-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 4px;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.wf-node__hint {
  height: 20px;
}

.hint-text {
  font-size: 11px;
  color: #9ca3af;
}
</style>
