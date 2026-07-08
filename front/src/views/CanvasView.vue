<script setup lang="ts">
import { ref } from 'vue'
import { VueFlow, useVueFlow, MarkerType } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { ElMessage } from 'element-plus'

const { onConnect, addEdges } = useVueFlow()

const nodes = ref([
  {
    id: '1',
    type: 'input',
    label: '产品图片',
    position: { x: 100, y: 200 },
    style: { background: 'rgba(78, 205, 196, 0.1)', border: '1px solid rgba(78, 205, 196, 0.3)' },
  },
  {
    id: '2',
    type: 'default',
    label: 'AI 场景生成',
    position: { x: 350, y: 200 },
    style: { background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.3)' },
  },
  {
    id: '3',
    type: 'default',
    label: '风格滤镜',
    position: { x: 600, y: 200 },
    style: { background: 'rgba(78, 205, 196, 0.1)', border: '1px solid rgba(78, 205, 196, 0.3)' },
  },
])

const edges = ref([
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
    style: { stroke: 'rgba(78, 205, 196, 0.6)' },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(78, 205, 196, 0.6)' },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    animated: true,
    style: { stroke: 'rgba(167, 139, 250, 0.6)' },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(167, 139, 250, 0.6)' },
  },
])

const selectedNode = ref<any>(null)

const nodeTypes = [
  { name: '产品图片', color: '#4ecdc4', type: 'input' },
  { name: 'AI 场景生成', color: '#a78bfa', type: 'process' },
  { name: 'AI 人像生成', color: '#a78bfa', type: 'process' },
  { name: '视频生成', color: '#60a5fa', type: 'process' },
  { name: '风格滤镜', color: '#4ecdc4', type: 'process' },
  { name: '智能裁剪', color: '#4ecdc4', type: 'process' },
  { name: '文字添加', color: '#34d399', type: 'process' },
  { name: '导出成品', color: '#34d399', type: 'output' },
]

const nodeGroups = [
  { title: '输入', nodes: nodeTypes.filter(n => n.type === 'input') },
  { title: 'AI 处理', nodes: nodeTypes.filter(n => n.type === 'process') },
  { title: '输出', nodes: nodeTypes.filter(n => n.type === 'output') },
]

onConnect((params) => {
  addEdges([{
    ...params,
    animated: true,
    style: { stroke: 'rgba(78, 205, 196, 0.6)' },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(78, 205, 196, 0.6)' },
  }])
})

const handleNodeClick = (_: any, node: any) => {
  selectedNode.value = node
}

const closePanel = () => {
  selectedNode.value = null
}

const generate = () => {
  ElMessage.success('开始生成，预计需要 30 秒...')
}
</script>

<template>
  <div class="canvas-view">
    <!-- Side Panel -->
    <aside class="side-panel card">
      <div class="panel-header">
        <h3>节点库</h3>
      </div>

      <div class="panel-content">
        <div v-for="group in nodeGroups" :key="group.title" class="node-group">
          <div class="group-title">{{ group.title }}</div>
          <div class="node-list">
            <div
              v-for="node in group.nodes"
              :key="node.name"
              class="node-item"
              draggable="true"
            >
              <div class="node-icon" :style="{ background: `${node.color}15`, borderColor: `${node.color}30` }">
                <span :style="{ color: node.color }">{{ node.name[0] }}</span>
              </div>
              <span class="node-name">{{ node.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <button class="btn-accent full-width" @click="generate">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 2L12 8L4 14V2Z" fill="currentColor"/>
          </svg>
          开始生成
        </button>
      </div>
    </aside>

    <!-- Canvas Area -->
    <div class="canvas-container">
      <div class="canvas-toolbar">
        <div class="toolbar-left">
          <span class="canvas-title">创意画布</span>
          <span class="canvas-status">未保存</span>
        </div>
        <div class="toolbar-right">
          <button class="tool-btn" @click="ElMessage.info('撤销上一步')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M3 8L7 4M3 8L7 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="tool-btn" @click="ElMessage.info('重做')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3M13 8L9 4M13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="tool-btn" @click="ElMessage.info('保存画布')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H10L14 6V13C14 13.5523 13.5523 14 13 14Z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M10 14V9H6V14" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="vue-flow-wrapper">
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :nodes-draggable="true"
          :connect-on-click="true"
          @node-click="handleNodeClick"
          fit-view-on-init
        >
          <Background pattern-color="rgba(78, 205, 196, 0.05)" :gap="24" />
          <Controls />
          <MiniMap
            :node-color="(node: any) => node.type === 'input' ? '#4ecdc4' : '#a78bfa'"
            mask-color="rgba(247, 248, 250, 0.9)"
          />
        </VueFlow>
      </div>
    </div>

    <!-- Properties Panel -->
    <transition name="slide">
      <aside v-if="selectedNode" class="properties-panel card">
        <div class="panel-header">
          <h3>节点属性</h3>
          <button class="close-btn" @click="closePanel">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="panel-content">
          <div class="property-section">
            <label class="property-label">节点名称</label>
            <input
              type="text"
              class="property-input"
              v-model="selectedNode.label"
            />
          </div>

          <div class="property-section">
            <label class="property-label">节点 ID</label>
            <div class="property-value mono">{{ selectedNode.id }}</div>
          </div>

          <div class="divider"></div>

          <div class="property-section">
            <label class="property-label">参数配置</label>
            <div class="slider-container">
              <input type="range" min="0" max="100" value="50" class="slider" />
              <span class="slider-value">50%</span>
            </div>
          </div>

          <div class="property-section">
            <label class="property-label">质量模式</label>
            <select class="property-select">
              <option>快速</option>
              <option selected>标准</option>
              <option>高清</option>
            </select>
          </div>
        </div>

        <div class="panel-footer">
          <button class="btn-outline" @click="closePanel">删除节点</button>
        </div>
      </aside>
    </transition>
  </div>
</template>

<style scoped>
.canvas-view {
  height: calc(100vh - 60px);
  display: flex;
  gap: 20px;
  padding: 20px;
  background: var(--bg-base);
}

.side-panel,
.properties-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.panel-footer {
  padding: 16px;
  border-top: 1px solid var(--border-subtle);
}

.side-panel {
  width: 240px;
}

.node-group {
  margin-bottom: 20px;
}

.group-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: grab;
  transition: all 0.2s;
}

.node-item:hover {
  border-color: var(--border-accent);
  background: rgba(78, 205, 196, 0.04);
}

.node-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.node-name {
  font-size: 13px;
  color: var(--text-secondary);
}

.canvas-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
}

.canvas-toolbar {
  height: 48px;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-subtle);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.canvas-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.canvas-status {
  font-size: 11px;
  color: var(--text-muted);
  padding: 2px 8px;
  background: var(--bg-elevated);
  border-radius: 4px;
}

.toolbar-right {
  display: flex;
  gap: 4px;
}

.tool-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: var(--bg-elevated);
  color: var(--accent-cyan);
}

.vue-flow-wrapper {
  flex: 1;
}

.full-width {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.properties-panel {
  width: 280px;
}

.property-section {
  margin-bottom: 16px;
}

.property-label {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
  font-weight: 500;
}

.property-input {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
}

.property-input:focus {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.1);
}

.property-value {
  font-size: 13px;
  color: var(--text-secondary);
}

.mono {
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.property-select {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

.property-select:focus {
  border-color: var(--accent-cyan);
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider {
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  background: var(--bg-elevated);
  border-radius: 2px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: var(--accent-cyan);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3);
}

.slider-value {
  font-size: 12px;
  color: var(--accent-cyan);
  min-width: 36px;
  text-align: right;
  font-weight: 500;
}

.btn-outline {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: var(--radius-sm);
  color: #dc2626;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover {
  background: rgba(248, 113, 113, 0.06);
  border-color: #dc2626;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
