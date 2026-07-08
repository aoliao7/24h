<script setup lang="ts">
import { ref, computed, markRaw, type Component } from 'vue'
import { VueFlow, useVueFlow, MarkerType } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { ElMessage } from 'element-plus'
import WorkflowNode from './components/WorkflowNode.vue'

// ============================================================
// 数据类型系统
// ============================================================
type DataType = 'image' | 'text' | 'video' | 'none'

const DATA_TYPE_COLORS: Record<DataType, string> = {
  image: '#4ecdc4',
  text:  '#a78bfa',
  video: '#60a5fa',
  none:  '#9ca3af',
}

const DATA_TYPE_LABELS: Record<DataType, string> = {
  image: '图片',
  text:  '文本',
  video: '视频',
  none:  '无',
}

// ============================================================
// 节点类型定义
// ============================================================
interface Port {
  id: string
  label: string
  type: DataType
  position: 'left' | 'right'
}

interface NodeDef {
  id: string
  name: string
  desc: string
  category: 'input' | 'ai' | 'process' | 'output'
  inputs: Port[]
  outputs: Port[]
  color: string
}

const nodeDefinitions: NodeDef[] = [
  {
    id: 'product-image',
    name: '产品图片',
    desc: '上传产品图片作为工作流起点',
    category: 'input',
    color: '#4ecdc4',
    inputs: [],
    outputs: [{ id: 'out-image', label: '图片', type: 'image', position: 'right' }],
  },
  {
    id: 'product-text',
    name: '产品描述',
    desc: '输入产品描述文字',
    category: 'input',
    color: '#a78bfa',
    inputs: [],
    outputs: [{ id: 'out-text', label: '文本', type: 'text', position: 'right' }],
  },
  {
    id: 'ai-image-gen',
    name: 'AI 图片生成',
    desc: '根据描述生成高质量图片',
    category: 'ai',
    color: '#a78bfa',
    inputs: [
      { id: 'in-image', label: '参考图', type: 'image', position: 'left' },
      { id: 'in-text',  label: '描述',   type: 'text',  position: 'left' },
    ],
    outputs: [{ id: 'out-image', label: '图片', type: 'image', position: 'right' }],
  },
  {
    id: 'ai-video-gen',
    name: 'AI 视频生成',
    desc: '将静态图片转为动态视频',
    category: 'ai',
    color: '#60a5fa',
    inputs: [{ id: 'in-image', label: '图片', type: 'image', position: 'left' }],
    outputs: [{ id: 'out-video', label: '视频', type: 'video', position: 'right' }],
  },
  {
    id: 'style-filter',
    name: '风格滤镜',
    desc: '应用预设风格滤镜组合',
    category: 'process',
    color: '#34d399',
    inputs: [{ id: 'in-image', label: '图片', type: 'image', position: 'left' }],
    outputs: [{ id: 'out-image', label: '图片', type: 'image', position: 'right' }],
  },
  {
    id: 'text-add',
    name: '文字添加',
    desc: '在图片指定位置添加文字',
    category: 'process',
    color: '#34d399',
    inputs: [
      { id: 'in-image', label: '图片', type: 'image', position: 'left' },
      { id: 'in-text',  label: '文本', type: 'text',  position: 'left' },
    ],
    outputs: [{ id: 'out-image', label: '图片', type: 'image', position: 'right' }],
  },
  {
    id: 'smart-crop',
    name: '智能裁剪',
    desc: '智能识别主体并裁剪',
    category: 'process',
    color: '#4ecdc4',
    inputs: [{ id: 'in-image', label: '图片', type: 'image', position: 'left' }],
    outputs: [{ id: 'out-image', label: '图片', type: 'image', position: 'right' }],
  },
  {
    id: 'export-image',
    name: '导出图片',
    desc: '导出最终图片成品',
    category: 'output',
    color: '#f59e0b',
    inputs: [{ id: 'in-image', label: '图片', type: 'image', position: 'left' }],
    outputs: [],
  },
  {
    id: 'export-video',
    name: '导出视频',
    desc: '导出最终视频成品',
    category: 'output',
    color: '#f59e0b',
    inputs: [{ id: 'in-video', label: '视频', type: 'video', position: 'left' }],
    outputs: [],
  },
]

const nodeGroupMap: Record<string, NodeDef[]> = {
  '输入': nodeDefinitions.filter(n => n.category === 'input'),
  'AI':  nodeDefinitions.filter(n => n.category === 'ai'),
  '处理': nodeDefinitions.filter(n => n.category === 'process'),
  '输出': nodeDefinitions.filter(n => n.category === 'output'),
}

const nodeTypes: Record<string, Component> = {
  custom: markRaw(WorkflowNode) as Component,
}

// ============================================================
// 节点实例
// ============================================================
let nodeCounter = 0
const makeNodeId = () => `node-${++nodeCounter}-${Date.now()}`

interface NodeData {
  status: 'idle' | 'running' | 'done'
  outputData: { type: DataType; label: string } | null
  imageUrl?: string
  textContent?: string
  filterPreset?: string
  textContentNode?: string
  textPosition?: string
  cropAspect?: string
  aiImageModel?: string
  aiImageSize?: string
  aiVideoDuration?: string
  aiVideoMotion?: string
}

interface VueFlowNode {
  id: string
  type: string
  label: string
  nodeDefId: string
  data: NodeData
  position: { x: number; y: number }
}

interface VueFlowEdge {
  id: string
  source: string
  target: string
  sourceHandle: string
  targetHandle: string
  animated?: boolean
  style?: any
  markerEnd?: any
  data?: any
}

// ============================================================
// 草稿管理
// ============================================================
interface Draft {
  id: string
  name: string
  nodes: VueFlowNode[]
  edges: VueFlowEdge[]
  createdAt: string
  updatedAt: string
}

const drafts = ref<Draft[]>([
  {
    id: 'default',
    name: '默认工作流',
    nodes: [
      {
        id: 'n1',
        type: 'custom',
        label: '产品图片',
        nodeDefId: 'product-image',
        position: { x: 60, y: 200 },
        data: { status: 'idle', outputData: null },
      },
    ],
    edges: [],
    createdAt: new Date().toLocaleDateString('zh-CN'),
    updatedAt: new Date().toLocaleDateString('zh-CN'),
  },
])

const currentDraftId = ref<string>('default')

const currentDraft = computed(() =>
  drafts.value.find(d => d.id === currentDraftId.value) || drafts.value[0]
)

const nodes = ref<VueFlowNode[]>([...currentDraft.value.nodes])
const edges = ref<VueFlowEdge[]>([...currentDraft.value.edges])

const switchDraft = (draftId: string) => {
  const draft = drafts.value.find(d => d.id === draftId)
  if (!draft) return
  currentDraftId.value = draftId
  nodes.value = draft.nodes.map(n => ({ ...n, data: { ...n.data } }))
  edges.value = [...draft.edges]
  ElMessage.success(`已切换到：${draft.name}`)
}

const saveDraft = () => {
  const draft = drafts.value.find(d => d.id === currentDraftId.value)
  if (!draft) return
  draft.nodes = nodes.value.map(n => ({ ...n, data: { ...n.data } }))
  draft.edges = [...edges.value]
  draft.updatedAt = new Date().toLocaleDateString('zh-CN')
  ElMessage.success('草稿已保存')
}

const createDraft = () => {
  const id = `draft-${Date.now()}`
  const draft: Draft = {
    id,
    name: `工作流 ${drafts.value.length + 1}`,
    nodes: [],
    edges: [],
    createdAt: new Date().toLocaleDateString('zh-CN'),
    updatedAt: new Date().toLocaleDateString('zh-CN'),
  }
  drafts.value.push(draft)
  currentDraftId.value = id
  nodes.value = []
  edges.value = []
  ElMessage.success('已创建新草稿')
}

const deleteDraft = (draftId: string) => {
  if (drafts.value.length <= 1) {
    ElMessage.warning('至少保留一个草稿')
    return
  }
  drafts.value = drafts.value.filter(d => d.id !== draftId)
  if (currentDraftId.value === draftId) {
    currentDraftId.value = drafts.value[0].id
    nodes.value = [...drafts.value[0].nodes]
    edges.value = [...drafts.value[0].edges]
  }
  ElMessage.info('草稿已删除')
}

// ============================================================
// 工作流执行模拟
// ============================================================
type RunStatus = 'idle' | 'running' | 'done'

const runStatus = ref<RunStatus>('idle')
const runProgress = ref(0)
const runningNodeId = ref<string | null>(null)

const getNodeOutputType = (nodeDefId: string): DataType => {
  const def = nodeDefinitions.find(d => d.id === nodeDefId)
  if (!def || def.outputs.length === 0) return 'none'
  return def.outputs[0].type
}

const runWorkflow = async () => {
  if (runStatus.value === 'running') return
  const startNodes = nodes.value.filter(n => {
    const def = nodeDefinitions.find(d => d.id === n.nodeDefId)
    return def?.category === 'input'
  })
  if (startNodes.length === 0) {
    ElMessage.warning('请先添加输入节点')
    return
  }
  runStatus.value = 'running'
  runProgress.value = 0
  ElMessage.info('开始执行工作流...')

  const adj: Record<string, string[]> = {}
  const inDeg: Record<string, number> = {}
  nodes.value.forEach(n => { adj[n.id] = []; inDeg[n.id] = 0 })
  edges.value.forEach(e => {
    if (!adj[e.source]) adj[e.source] = []
    adj[e.source].push(e.target)
    inDeg[e.target] = (inDeg[e.target] || 0) + 1
  })

  let queue = nodes.value.filter(n => inDeg[n.id] === 0).map(n => n.id)
  const sorted: string[] = []
  const visited = new Set<string>()

  while (queue.length) {
    const cur = queue.shift()!
    if (!visited.has(cur)) { sorted.push(cur); visited.add(cur) }
    for (const nxt of adj[cur] || []) {
      inDeg[nxt]--
      if (inDeg[nxt] === 0) queue.push(nxt)
    }
  }
  nodes.value.forEach(n => { if (!visited.has(n.id)) sorted.push(n.id) })

  const total = sorted.length
  for (let i = 0; i < sorted.length; i++) {
    const nodeId = sorted[i]
    runningNodeId.value = nodeId
    nodes.value = nodes.value.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, status: 'running' } } : n
    )
    const node = nodes.value.find(n => n.id === nodeId)!
    const def = nodeDefinitions.find(d => d.id === node.nodeDefId)!
    const outputType = getNodeOutputType(node.nodeDefId)
    await new Promise(resolve => setTimeout(resolve, 700 + Math.random() * 500))
    nodes.value = nodes.value.map(n =>
      n.id === nodeId
        ? { ...n, data: { ...n.data, status: 'done', outputData: { type: outputType, label: def.name } } }
        : n
    )
    runProgress.value = Math.round(((i + 1) / total) * 100)
  }
  runningNodeId.value = null
  runStatus.value = 'done'
  saveDraft()
  ElMessage.success('工作流执行完成！')
}

const resetWorkflow = () => {
  runStatus.value = 'idle'
  runProgress.value = 0
  runningNodeId.value = null
  nodes.value = nodes.value.map(n => ({
    ...n,
    data: { ...n.data, status: 'idle', outputData: null },
  }))
}

// ============================================================
// 连接验证：isValidConnection（阻止非法连接）+ onConnect（添加后提示）
// ============================================================
const { onConnect, isValidConnection } = useVueFlow()

// 关键：用 isValidConnection 阻止非法连接
isValidConnection((params: any) => {
  const sourceNode = nodes.value.find(n => n.id === params.source)
  const targetNode = nodes.value.find(n => n.id === params.target)
  if (!sourceNode || !targetNode) return false

  const sourceDef = nodeDefinitions.find(d => d.id === sourceNode.nodeDefId)
  const targetDef = nodeDefinitions.find(d => d.id === targetNode.nodeDefId)
  if (!sourceDef || !targetDef) return false

  const sourcePort = sourceDef.outputs.find(p => p.id === params.sourceHandleId)
  const targetPort = targetDef.inputs.find(p => p.id === params.targetHandleId)

  if (!sourcePort || !targetPort) return false
  if (sourcePort.type !== targetPort.type) {
    ElMessage.error({
      message: `类型不匹配：${DATA_TYPE_LABELS[sourcePort.type]} 无法连接到 ${DATA_TYPE_LABELS[targetPort.type]}（${targetDef.name} 需要 ${DATA_TYPE_LABELS[targetPort.type]} 输入）`,
      duration: 3500,
    })
    return false
  }
  return true
})

onConnect((params: any) => {
  const sourceNode = nodes.value.find(n => n.id === params.source)
  const targetNode = nodes.value.find(n => n.id === params.target)
  if (!sourceNode || !targetNode) return
  const sourceDef = nodeDefinitions.find(d => d.id === sourceNode.nodeDefId)
  const targetDef = nodeDefinitions.find(d => d.id === targetNode.nodeDefId)
  if (!sourceDef || !targetDef) return
  const sourcePort = sourceDef.outputs.find(p => p.id === params.sourceHandle)
  const targetPort = targetDef.inputs.find(p => p.id === params.targetHandle)
  if (!sourcePort || !targetPort) return
  const color = DATA_TYPE_COLORS[sourcePort.type]
  edges.value = [...edges.value, {
    id: `e-${params.source}-${params.target}-${Date.now()}`,
    source: params.source,
    target: params.target,
    sourceHandle: params.sourceHandle,
    targetHandle: params.targetHandle,
    animated: true,
    style: { stroke: color, strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color },
    data: { dataType: sourcePort.type },
  }]
  ElMessage.success(`已连接：${sourceDef.name} → ${targetDef.name}`)
})

// ============================================================
// 从节点库拖放到画布
// ============================================================
const onDragStart = (event: DragEvent, defId: string) => {
  if (!event.dataTransfer) return
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('node-def-id', defId)
}

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
}

const getDefaultNodeData = (defId: string): NodeData => {
  const base: NodeData = { status: 'idle', outputData: null }
  if (defId === 'product-image') base.imageUrl = ''
  if (defId === 'product-text') base.textContent = ''
  if (defId === 'style-filter') base.filterPreset = '自然'
  if (defId === 'text-add') { base.textContentNode = ''; base.textPosition = 'center' }
  if (defId === 'smart-crop') base.cropAspect = '1:1'
  if (defId === 'ai-image-gen') { base.aiImageModel = '标准'; base.aiImageSize = '1024×1024' }
  if (defId === 'ai-video-gen') { base.aiVideoDuration = '4秒'; base.aiVideoMotion = '自动' }
  return base
}

const onDrop = (event: DragEvent) => {
  event.preventDefault()
  if (!event.dataTransfer) return
  const defId = event.dataTransfer.getData('node-def-id')
  if (!defId) return
  const def = nodeDefinitions.find(d => d.id === defId)
  if (!def) return
  const wrapper = (event.target as HTMLElement).closest('.vue-flow-wrapper')
  if (!wrapper) return
  const vueFlowEl = wrapper.querySelector('.vue-flow') as HTMLElement
  if (!vueFlowEl) return
  const rect = vueFlowEl.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  nodes.value = [...nodes.value, {
    id: makeNodeId(),
    type: 'custom',
    label: def.name,
    nodeDefId: def.id,
    position: { x, y },
    data: getDefaultNodeData(def.id),
  }]
  ElMessage.success(`已添加：${def.name}`)
}

// ============================================================
// 节点 / 边点击
// ============================================================
const selectedNode = ref<VueFlowNode | null>(null)

const handleNodeClick = (event: any) => {
  const fullNode = nodes.value.find(n => n.id === event.node.id)
  if (fullNode) selectedNode.value = fullNode
}

const closePanel = () => { selectedNode.value = null }

const deleteNode = () => {
  if (!selectedNode.value) return
  const id = selectedNode.value.id
  nodes.value = nodes.value.filter(n => n.id !== id)
  edges.value = edges.value.filter(e => e.source !== id && e.target !== id)
  selectedNode.value = null
  ElMessage.info('节点已删除')
}

const onEdgeClick = (event: any) => {
  edges.value = edges.value.filter(e => e.id !== event.edge.id)
  ElMessage.info('连接已删除')
}

// ============================================================
// 属性面板
// ============================================================
const selectedNodeDef = computed(() => {
  if (!selectedNode.value) return null
  return nodeDefinitions.find(d => d.id === selectedNode.value!.nodeDefId) || null
})

const updateNodeData = (key: keyof NodeData, value: any) => {
  if (!selectedNode.value) return
  const updated = { ...selectedNode.value, data: { ...selectedNode.value.data, [key]: value } }
  nodes.value = nodes.value.map(n => n.id === updated.id ? updated : n)
  selectedNode.value = updated
}

// ============================================================
// 图片上传
// ============================================================
const imageInputRef = ref<HTMLInputElement | null>(null)
const triggerImageUpload = () => imageInputRef.value?.click()

const onImageSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !selectedNode.value) return
  const url = URL.createObjectURL(file)
  updateNodeData('imageUrl', url)
  updateNodeData('outputData', { type: 'image', label: '已上传图片' })
  updateNodeData('status', 'done')
  ElMessage.success('图片上传成功')
}
</script>
<template>
  <div class="canvas-view">
    <!-- ===================== 左侧节点库 ===================== -->
    <aside class="side-panel card">
      <div class="panel-header">
        <h3>节点库</h3>
        <span class="node-count">{{ nodeDefinitions.length }} 个节点</span>
      </div>

      <div class="panel-content">
        <div v-for="(defs, groupTitle) in nodeGroupMap" :key="groupTitle" class="node-group">
          <div class="group-title">{{ groupTitle }}</div>
          <div class="node-list">
            <div
              v-for="def in defs"
              :key="def.id"
              class="node-item"
              draggable="true"
              @dragstart="onDragStart($event, def.id)"
            >
              <div class="node-icon" :style="{ background: `${def.color}15`, borderColor: `${def.color}40` }">
                <span :style="{ color: def.color }">{{ def.name[0] }}</span>
              </div>
              <div class="node-info">
                <span class="node-name">{{ def.name }}</span>
                <span class="node-desc">{{ def.desc }}</span>
              </div>
              <div class="type-badges">
                <span
                  v-if="def.inputs.length"
                  class="type-badge"
                  :style="{ background: `${DATA_TYPE_COLORS[def.inputs[0].type]}15`, color: DATA_TYPE_COLORS[def.inputs[0].type] }"
                >{{ DATA_TYPE_LABELS[def.inputs[0].type] }}</span>
                <span
                  v-if="def.outputs.length"
                  class="type-badge"
                  :style="{ background: `${DATA_TYPE_COLORS[def.outputs[0].type]}15`, color: DATA_TYPE_COLORS[def.outputs[0].type] }"
                >{{ DATA_TYPE_LABELS[def.outputs[0].type] }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <div class="run-info" v-if="runStatus === 'running'">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: runProgress + '%' }"></div>
          </div>
          <span class="progress-text">执行中 {{ runProgress }}%</span>
        </div>
        <div class="run-actions">
          <button class="btn-outline" @click="resetWorkflow" v-if="runStatus === 'done'">重置</button>
          <button
            class="btn-accent full-width"
            :class="{ running: runStatus === 'running' }"
            @click="runWorkflow"
            :disabled="runStatus === 'running'"
          >
            <svg v-if="runStatus !== 'running'" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 2L11 7L3 12V2Z" fill="currentColor"/>
            </svg>
            <span class="spinner" v-else></span>
            {{ runStatus === 'running' ? '执行中...' : runStatus === 'done' ? '重新执行' : '开始生成' }}
          </button>
        </div>
      </div>
    </aside>

    <!-- ===================== 画布区域 ===================== -->
    <div class="canvas-container">
      <div class="canvas-toolbar">
        <div class="toolbar-left">
          <span class="canvas-title">创意工作流</span>
          <span class="canvas-status" :class="runStatus">
            <span class="status-dot"></span>
            {{ runStatus === 'idle' ? '未保存' : runStatus === 'running' ? `执行中 ${runProgress}%` : '已完成' }}
          </span>
        </div>
        <div class="toolbar-center">
          <div class="type-legend">
            <span class="legend-item" v-for="(color, type) in DATA_TYPE_COLORS" :key="type">
              <span class="legend-dot" :style="{ background: color }"></span>
              {{ DATA_TYPE_LABELS[type as DataType] }}
            </span>
          </div>
        </div>
        <div class="toolbar-right">
          <button class="tool-btn" @click="ElMessage.info('撤销')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M3 8L7 4M3 8L7 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="tool-btn" @click="ElMessage.info('重做')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3M13 8L9 4M13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="vue-flow-wrapper" @dragover="onDragOver" @drop="onDrop">
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :nodes-draggable="true"
          :connect-on-click="false"
          :node-types="nodeTypes"
          @node-click="handleNodeClick"
          @edge-click="onEdgeClick"
          fit-view-on-init
          :default-edge-options="{ animated: true, style: { strokeWidth: 2 } }"
        >
          <Background pattern-color="rgba(78, 205, 196, 0.04)" :gap="24" />
          <Controls />
          <MiniMap
            :node-color="(node: any) => {
              const def = nodeDefinitions.find(d => d.id === node.nodeDefId)
              return def?.color || '#4ecdc4'
            }"
            mask-color="rgba(247, 248, 250, 0.9)"
          />
        </VueFlow>
      </div>

      <!-- 底部草稿管理条 -->
      <div class="draft-bar">
        <div class="draft-bar__left">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
            <path d="M4 6H10M4 8.5H8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          <span class="draft-bar__label">草稿</span>
        </div>

        <div class="draft-list">
          <button
            v-for="draft in drafts"
            :key="draft.id"
            class="draft-chip"
            :class="{ active: currentDraftId === draft.id }"
            @click="switchDraft(draft.id)"
          >
            <span class="draft-chip__name">{{ draft.name }}</span>
            <span
              v-if="drafts.length > 1"
              class="draft-chip__del"
              @click.stop="deleteDraft(draft.id)"
            >×</span>
          </button>
        </div>

        <div class="draft-bar__right">
          <button class="draft-action-btn" @click="createDraft" title="新建草稿">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2V12M2 7H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="draft-action-btn primary" @click="saveDraft" title="保存草稿">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M11 12H3C2.44772 12 2 11.5523 2 11V3C2 2.44772 2.44772 2 3 2H8L12 6V11C12 11.5523 11.5523 12 11 12Z" stroke="currentColor" stroke-width="1.2"/>
              <path d="M4 12V8H10V12" stroke="currentColor" stroke-width="1.2"/>
            </svg>
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- ===================== 右侧属性面板 ===================== -->
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

        <div class="panel-content" v-if="selectedNodeDef">
          <!-- 节点基本信息 -->
          <div class="property-section">
            <div class="node-header-info">
              <div class="node-icon-lg" :style="{ background: `${selectedNodeDef.color}15`, borderColor: `${selectedNodeDef.color}30` }">
                <span :style="{ color: selectedNodeDef.color }">{{ selectedNodeDef.name[0] }}</span>
              </div>
              <div>
                <div class="node-title-lg">{{ selectedNodeDef.name }}</div>
                <div class="node-desc-lg">{{ selectedNodeDef.desc }}</div>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <!-- 产品图片：上传 -->
          <template v-if="selectedNodeDef.id === 'product-image'">
            <div class="property-section">
              <label class="property-label">上传图片</label>
              <input ref="imageInputRef" type="file" accept="image/*" style="display:none" @change="onImageSelected" />
              <div class="image-upload-area" @click="triggerImageUpload">
                <img v-if="selectedNode.data.imageUrl" :src="selectedNode.data.imageUrl" class="image-preview" />
                <div v-else class="upload-placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M17 8L12 3L7 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 3V15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  <span>点击上传图片</span>
                </div>
              </div>
            </div>
          </template>

          <!-- 产品描述：文字输入 -->
          <template v-else-if="selectedNodeDef.id === 'product-text'">
            <div class="property-section">
              <label class="property-label">产品描述</label>
              <textarea
                class="property-textarea"
                :value="selectedNode.data.textContent"
                @input="updateNodeData('textContent', ($event.target as HTMLTextAreaElement).value)"
                placeholder="请输入产品描述，如：简约风格的白色手表，适合商务场合..."
                rows="4"
              ></textarea>
            </div>
          </template>

          <!-- 风格滤镜：选择组合 -->
          <template v-else-if="selectedNodeDef.id === 'style-filter'">
            <div class="property-section">
              <label class="property-label">滤镜组合</label>
              <div class="filter-grid">
                <button
                  v-for="preset in ['自然', '复古', '胶片', '黑白', '暖调', '冷调', 'HDR', '赛博朋克']"
                  :key="preset"
                  class="filter-btn"
                  :class="{ active: selectedNode.data.filterPreset === preset }"
                  @click="updateNodeData('filterPreset', preset)"
                >{{ preset }}</button>
              </div>
            </div>
          </template>

          <!-- 文字添加：内容 + 位置 -->
          <template v-else-if="selectedNodeDef.id === 'text-add'">
            <div class="property-section">
              <label class="property-label">文字内容</label>
              <textarea
                class="property-textarea"
                :value="selectedNode.data.textContentNode"
                @input="updateNodeData('textContentNode', ($event.target as HTMLTextAreaElement).value)"
                placeholder="请输入要添加的文字..."
                rows="2"
              ></textarea>
            </div>
            <div class="property-section">
              <label class="property-label">添加位置</label>
              <div class="position-grid">
                <button
                  v-for="pos in ['左上', '上', '右上', '左', '居中', '右', '左下', '下', '右下']"
                  :key="pos"
                  class="pos-btn"
                  :class="{ active: selectedNode.data.textPosition === pos }"
                  @click="updateNodeData('textPosition', pos)"
                >{{ pos }}</button>
              </div>
            </div>
          </template>

          <!-- 智能裁剪：比例 -->
          <template v-else-if="selectedNodeDef.id === 'smart-crop'">
            <div class="property-section">
              <label class="property-label">裁剪比例</label>
              <div class="aspect-grid">
                <button
                  v-for="ratio in ['1:1', '4:3', '16:9', '9:16', '3:4', '自由']"
                  :key="ratio"
                  class="aspect-btn"
                  :class="{ active: selectedNode.data.cropAspect === ratio }"
                  @click="updateNodeData('cropAspect', ratio)"
                >{{ ratio }}</button>
              </div>
            </div>
          </template>

          <!-- AI 图片生成：模型 + 尺寸 -->
          <template v-else-if="selectedNodeDef.id === 'ai-image-gen'">
            <div class="property-section">
              <label class="property-label">生成模型</label>
              <select
                class="property-select"
                :value="selectedNode.data.aiImageModel"
                @change="updateNodeData('aiImageModel', ($event.target as HTMLSelectElement).value)"
              >
                <option>快速</option>
                <option>标准</option>
                <option>高清</option>
              </select>
            </div>
            <div class="property-section">
              <label class="property-label">输出尺寸</label>
              <select
                class="property-select"
                :value="selectedNode.data.aiImageSize"
                @change="updateNodeData('aiImageSize', ($event.target as HTMLSelectElement).value)"
              >
                <option>512×512</option>
                <option selected>1024×1024</option>
                <option>1024×1792</option>
                <option>1792×1024</option>
              </select>
            </div>
          </template>

          <!-- AI 视频生成：时长 + 运动 -->
          <template v-else-if="selectedNodeDef.id === 'ai-video-gen'">
            <div class="property-section">
              <label class="property-label">视频时长</label>
              <div class="duration-grid">
                <button
                  v-for="dur in ['2秒', '4秒', '6秒', '10秒']"
                  :key="dur"
                  class="duration-btn"
                  :class="{ active: selectedNode.data.aiVideoDuration === dur }"
                  @click="updateNodeData('aiVideoDuration', dur)"
                >{{ dur }}</button>
              </div>
            </div>
            <div class="property-section">
              <label class="property-label">运动模式</label>
              <div class="motion-grid">
                <button
                  v-for="motion in ['自动', '平滑', '运镜', '静态']"
                  :key="motion"
                  class="motion-btn"
                  :class="{ active: selectedNode.data.aiVideoMotion === motion }"
                  @click="updateNodeData('aiVideoMotion', motion)"
                >{{ motion }}</button>
              </div>
            </div>
          </template>

          <!-- 导出节点 -->
          <template v-else-if="selectedNodeDef.category === 'output'">
            <div class="property-section">
              <div class="export-hint">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 14V2M10 14L6 10M10 14L14 10" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 18H18" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span>点击「开始生成」后自动导出成品</span>
              </div>
            </div>
          </template>

          <!-- 通用信息 -->
          <template v-if="selectedNodeDef.category !== 'output'">
            <div class="divider"></div>
            <div class="property-section">
              <label class="property-label">运行状态</label>
              <div class="status-badge" :class="selectedNode.data.status">
                <span v-if="selectedNode.data.status === 'running'">执行中</span>
                <span v-else-if="selectedNode.data.status === 'done'">已完成</span>
                <span v-else>等待中</span>
              </div>
            </div>
          </template>

          <div class="divider"></div>

          <!-- 端口信息 -->
          <div class="property-section">
            <label class="property-label">输入端口</label>
            <div class="ports-list">
              <div v-for="port in selectedNodeDef.inputs" :key="port.id" class="port-row">
                <span class="port-name">{{ port.label }}</span>
                <span class="type-tag" :style="{ color: DATA_TYPE_COLORS[port.type], background: `${DATA_TYPE_COLORS[port.type]}15` }">
                  {{ DATA_TYPE_LABELS[port.type] }}
                </span>
              </div>
              <div v-if="!selectedNodeDef.inputs.length" class="empty-ports">无（起始节点）</div>
            </div>
          </div>

          <div class="property-section">
            <label class="property-label">输出端口</label>
            <div class="ports-list">
              <div v-for="port in selectedNodeDef.outputs" :key="port.id" class="port-row">
                <span class="port-name">{{ port.label }}</span>
                <span class="type-tag" :style="{ color: DATA_TYPE_COLORS[port.type], background: `${DATA_TYPE_COLORS[port.type]}15` }">
                  {{ DATA_TYPE_LABELS[port.type] }}
                </span>
              </div>
              <div v-if="!selectedNodeDef.outputs.length" class="empty-ports">无（终点节点）</div>
            </div>
          </div>

          <div class="type-hint">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/>
              <path d="M7 6v3M7 4.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>仅相同类型的端口可连接</span>
          </div>
        </div>

        <div class="panel-footer">
          <button class="btn-outline danger" @click="deleteNode">删除节点</button>
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

/* ===== 侧边栏 ===== */
.side-panel,
.properties-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 16px 20px;
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

.node-count {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-elevated);
  padding: 2px 8px;
  border-radius: 10px;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.panel-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.side-panel {
  width: 260px;
}

/* ===== 节点库 ===== */
.node-group {
  margin-bottom: 16px;
}

.group-title {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
  padding-left: 4px;
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: grab;
  transition: all 0.15s;
}

.node-item:hover {
  border-color: var(--border-accent);
  background: rgba(78, 205, 196, 0.04);
  transform: translateX(2px);
}

.node-item:active {
  cursor: grabbing;
}

.node-icon {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-name {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.node-desc {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.type-badges {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-end;
}

.type-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;
  white-space: nowrap;
}

/* ===== 画布容器 ===== */
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
  flex-shrink: 0;
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
  padding: 2px 10px;
  background: var(--bg-elevated);
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.canvas-status.done {
  color: #059669;
  background: rgba(52, 211, 153, 0.08);
}

.canvas-status.running {
  color: var(--accent-cyan);
  background: rgba(78, 205, 196, 0.08);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.canvas-status.running .status-dot {
  animation: pulse-dot 1s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.toolbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.type-legend {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
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
  transition: all 0.15s;
}

.tool-btn:hover {
  background: var(--bg-elevated);
  color: var(--accent-cyan);
}

.vue-flow-wrapper {
  flex: 1;
  position: relative;
}

/* ===== 草稿管理条 ===== */
.draft-bar {
  height: 44px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-card);
  flex-shrink: 0;
}

.draft-bar__left {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.draft-bar__label {
  font-size: 12px;
  color: var(--text-muted);
}

.draft-list {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  flex: 1;
  align-items: center;
}

.draft-list::-webkit-scrollbar {
  height: 0;
}

.draft-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--border-light);
  border-radius: 20px;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.draft-chip:hover {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.draft-chip.active {
  background: rgba(78, 205, 196, 0.08);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
  font-weight: 600;
}

.draft-chip__del {
  font-size: 14px;
  line-height: 1;
  color: var(--text-muted);
  margin-left: 2px;
  transition: color 0.15s;
}

.draft-chip__del:hover {
  color: #dc2626;
}

.draft-bar__right {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.draft-action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.draft-action-btn:hover {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.draft-action-btn.primary {
  background: rgba(78, 205, 196, 0.08);
  border-color: rgba(78, 205, 196, 0.3);
  color: var(--accent-cyan);
}

.draft-action-btn.primary:hover {
  background: rgba(78, 205, 196, 0.15);
}

/* ===== 进度条 ===== */
.run-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-bar {
  height: 4px;
  background: var(--bg-elevated);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-cyan), var(--accent-purple));
  border-radius: 2px;
  transition: width 0.4s ease;
}

.progress-text {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}

.run-actions {
  display: flex;
  gap: 8px;
}

.full-width {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-accent {
  padding: 9px 16px;
}

.btn-accent.running {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== 右侧属性面板 ===== */
.properties-panel {
  width: 280px;
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

.property-section {
  margin-bottom: 14px;
}

.property-label {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.node-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.node-icon-lg {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.node-title-lg {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 3px;
}

.node-desc-lg {
  font-size: 12px;
  color: var(--text-muted);
}

/* 图片上传 */
.image-upload-area {
  border: 1.5px dashed var(--border-light);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-upload-area:hover {
  border-color: var(--accent-cyan);
  background: rgba(78, 205, 196, 0.03);
}

.image-preview {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 12px;
  padding: 20px;
}

/* 文本域 */
.property-textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
  line-height: 1.6;
}

.property-textarea:focus {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.1);
}

/* 滤镜网格 */
.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.filter-btn,
.pos-btn,
.aspect-btn,
.duration-btn,
.motion-btn {
  padding: 7px 6px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.filter-btn:hover,
.pos-btn:hover,
.aspect-btn:hover,
.duration-btn:hover,
.motion-btn:hover {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.filter-btn.active,
.pos-btn.active,
.aspect-btn.active,
.duration-btn.active,
.motion-btn.active {
  background: rgba(78, 205, 196, 0.1);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
  font-weight: 600;
}

.position-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.pos-btn {
  padding: 6px;
  font-size: 11px;
}

.aspect-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.duration-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.motion-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

/* 下拉框 */
.property-select {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.property-select:focus {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.1);
}

/* 导出提示 */
.export-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-secondary);
}

/* 状态徽章 */
.status-badge {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 10px;
}

.status-badge.idle {
  background: rgba(156, 163, 175, 0.1);
  color: var(--text-muted);
}

.status-badge.running {
  background: rgba(78, 205, 196, 0.1);
  color: var(--accent-cyan);
}

.status-badge.done {
  background: rgba(52, 211, 153, 0.1);
  color: #059669;
}

/* 端口列表 */
.ports-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.port-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: var(--bg-elevated);
  border-radius: 6px;
}

.port-name {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.type-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.empty-ports {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
  padding: 4px 0;
}

.type-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted);
  padding: 8px 10px;
  background: rgba(78, 205, 196, 0.04);
  border-radius: 6px;
  border: 1px solid rgba(78, 205, 196, 0.1);
}

.divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 12px 0;
}

.btn-outline {
  padding: 9px;
  background: transparent;
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: var(--radius-sm);
  color: #dc2626;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.btn-outline:hover {
  background: rgba(248, 113, 113, 0.06);
  border-color: #dc2626;
}

.btn-outline.danger {
  width: 100%;
}

/* ===== 过渡动画 ===== */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* ===== Vue Flow 覆盖 ===== */
:deep(.vue-flow__node) {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  box-shadow: none !important;
}

:deep(.vue-flow__edge-path) {
  stroke-width: 2;
}
</style>
