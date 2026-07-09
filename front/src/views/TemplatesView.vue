<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { calculateWorkflowCost } from '@/stores/creative'

const router = useRouter()

const activeTab = ref<'video' | 'image'>('video')

// 节点定义
const nodeDefinitions = [
  { id: 'product-image', name: '产品图片', color: '#4ecdc4' },
  { id: 'product-text', name: '产品描述', color: '#a78bfa' },
  { id: 'ai-image-gen', name: 'AI图片生成', color: '#a78bfa' },
  { id: 'ai-video-gen', name: 'AI视频生成', color: '#60a5fa' },
  { id: 'style-filter', name: '风格滤镜', color: '#34d399' },
  { id: 'text-add', name: '文字添加', color: '#34d399' },
  { id: 'smart-crop', name: '智能裁剪', color: '#4ecdc4' },
  { id: 'export-image', name: '导出图片', color: '#f59e0b' },
  { id: 'export-video', name: '导出视频', color: '#f59e0b' },
]

const getNodeDef = (defId: string) => nodeDefinitions.find(n => n.id === defId)

// 检查模板是否有产品描述节点
const hasProductText = (template: any) => {
  return template.nodes.some((n: any) => n.nodeDefId === 'product-text')
}

// 计算模板消耗积分
const getTemplateCost = (template: any) => {
  return calculateWorkflowCost(template.nodes)
}

const useTemplate = (template: any) => {
  // 直接使用模板数据（prompt 已经在卡片上编辑好了）
  sessionStorage.setItem('template', JSON.stringify(template))
  router.push('/canvas')
}

// 短视频模板
const videoTemplates = reactive([
  {
    id: 'video-basic',
    name: '基础短视频',
    preview: 'https://picsum.photos/seed/v1/320/200',
    tags: ['简单', '快速'],
    desc: '产品图转动态视频，4秒快速生成',
    prompt: '缓慢推进，柔和灯光，产品特写，专业质感',
    nodes: [
      { id: 'n1', nodeDefId: 'product-image', position: { x: 80, y: 200 } },
      { id: 'n2', nodeDefId: 'product-text', position: { x: 80, y: 340 } },
      { id: 'n3', nodeDefId: 'ai-video-gen', position: { x: 380, y: 270 } },
      { id: 'n4', nodeDefId: 'export-video', position: { x: 680, y: 270 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n3', sourcePort: 'out-image', targetPort: 'in-image', type: 'image' },
    ]
  },
  {
    id: 'video-scene',
    name: '场景化短视频',
    preview: 'https://picsum.photos/seed/v2/320/200',
    tags: ['场景营销', '高转化'],
    desc: '生成场景图后转视频，更有氛围感',
    prompt: '梦幻氛围，梦幻光效，产品漂浮感，科幻未来风格',
    nodes: [
      { id: 'n1', nodeDefId: 'product-image', position: { x: 80, y: 200 } },
      { id: 'n2', nodeDefId: 'product-text', position: { x: 80, y: 340 } },
      { id: 'n3', nodeDefId: 'ai-image-gen', position: { x: 380, y: 200 } },
      { id: 'n4', nodeDefId: 'ai-video-gen', position: { x: 680, y: 200 } },
      { id: 'n5', nodeDefId: 'export-video', position: { x: 980, y: 200 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n3', sourcePort: 'out-image', targetPort: 'in-image', type: 'image' },
      { id: 'e2', source: 'n2', target: 'n3', sourcePort: 'out-text', targetPort: 'in-text', type: 'text' },
      { id: 'e3', source: 'n3', target: 'n4', sourcePort: 'out-image', targetPort: 'in-image', type: 'image' },
      { id: 'e4', source: 'n4', target: 'n5', sourcePort: 'out-video', targetPort: 'in-video', type: 'video' },
    ]
  },
  {
    id: 'video-style',
    name: '风格化短视频',
    preview: 'https://picsum.photos/seed/v3/320/200',
    tags: ['风格', '高级感'],
    desc: '生成图片 + 滤镜处理 + 转视频',
    prompt: '赛博朋克风格，霓虹灯光，未来科技感，震撼视觉效果',
    nodes: [
      { id: 'n1', nodeDefId: 'product-image', position: { x: 80, y: 200 } },
      { id: 'n2', nodeDefId: 'product-text', position: { x: 80, y: 340 } },
      { id: 'n3', nodeDefId: 'ai-image-gen', position: { x: 380, y: 200 } },
      { id: 'n4', nodeDefId: 'style-filter', position: { x: 680, y: 200 } },
      { id: 'n5', nodeDefId: 'ai-video-gen', position: { x: 980, y: 200 } },
      { id: 'n6', nodeDefId: 'export-video', position: { x: 1280, y: 200 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n3', sourcePort: 'out-image', targetPort: 'in-image', type: 'image' },
      { id: 'e2', source: 'n2', target: 'n3', sourcePort: 'out-text', targetPort: 'in-text', type: 'text' },
      { id: 'e3', source: 'n3', target: 'n4', sourcePort: 'out-image', targetPort: 'in-image', type: 'image' },
      { id: 'e4', source: 'n4', target: 'n5', sourcePort: 'out-image', targetPort: 'in-image', type: 'image' },
      { id: 'e5', source: 'n5', target: 'n6', sourcePort: 'out-video', targetPort: 'in-video', type: 'video' },
    ]
  },
])

// 图片模板
const imageTemplates = reactive([
  {
    id: 'image-hero',
    name: '电商主图',
    preview: 'https://picsum.photos/seed/i1/320/200',
    tags: ['电商必备', '高清'],
    desc: '智能生成产品主图，纯白背景专业展示',
    prompt: '纯白背景，专业摄影棚灯光，产品居中展示，高清质感',
    nodes: [
      { id: 'n1', nodeDefId: 'product-image', position: { x: 80, y: 200 } },
      { id: 'n2', nodeDefId: 'product-text', position: { x: 80, y: 340 } },
      { id: 'n3', nodeDefId: 'ai-image-gen', position: { x: 380, y: 200 } },
      { id: 'n4', nodeDefId: 'smart-crop', position: { x: 680, y: 200 } },
      { id: 'n5', nodeDefId: 'export-image', position: { x: 980, y: 200 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n3', sourcePort: 'out-image', targetPort: 'in-image', type: 'image' },
      { id: 'e2', source: 'n2', target: 'n3', sourcePort: 'out-text', targetPort: 'in-text', type: 'text' },
      { id: 'e3', source: 'n3', target: 'n4', sourcePort: 'out-image', targetPort: 'in-image', type: 'image' },
      { id: 'e4', source: 'n4', target: 'n5', sourcePort: 'out-image', targetPort: 'in-image', type: 'image' },
    ]
  },
  {
    id: 'image-scene',
    name: '场景化营销图',
    preview: 'https://picsum.photos/seed/i2/320/200',
    tags: ['场景营销', '高转化'],
    desc: '产品融入生活场景，提升吸引力',
    prompt: '自然生活场景，温暖阳光，产品自然融入环境，营造温馨氛围',
    nodes: [
      { id: 'n1', nodeDefId: 'product-image', position: { x: 80, y: 200 } },
      { id: 'n2', nodeDefId: 'product-text', position: { x: 80, y: 340 } },
      { id: 'n3', nodeDefId: 'ai-image-gen', position: { x: 380, y: 200 } },
      { id: 'n4', nodeDefId: 'style-filter', position: { x: 680, y: 200 } },
      { id: 'n5', nodeDefId: 'export-image', position: { x: 980, y: 200 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n3', sourcePort: 'out-image', targetPort: 'in-image', type: 'image' },
      { id: 'e2', source: 'n2', target: 'n3', sourcePort: 'out-text', targetPort: 'in-text', type: 'text' },
      { id: 'e3', source: 'n3', target: 'n4', sourcePort: 'out-image', targetPort: 'in-image', type: 'image' },
      { id: 'e4', source: 'n4', target: 'n5', sourcePort: 'out-image', targetPort: 'in-image', type: 'image' },
    ]
  },
  {
    id: 'image-poster',
    name: '营销海报',
    preview: 'https://picsum.photos/seed/i3/320/200',
    tags: ['海报', '设计'],
    desc: '构建营销场景 + 添加文字',
    prompt: '创意营销场景，大气磅礴，突出产品质感，杂志大片风格',
    nodes: [
      { id: 'n1', nodeDefId: 'product-image', position: { x: 80, y: 200 } },
      { id: 'n2', nodeDefId: 'product-text', position: { x: 80, y: 340 } },
      { id: 'n3', nodeDefId: 'ai-image-gen', position: { x: 380, y: 200 } },
      { id: 'n4', nodeDefId: 'text-add', position: { x: 680, y: 200 } },
      { id: 'n5', nodeDefId: 'export-image', position: { x: 980, y: 200 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n3', sourcePort: 'out-image', targetPort: 'in-image', type: 'image' },
      { id: 'e2', source: 'n2', target: 'n3', sourcePort: 'out-text', targetPort: 'in-text', type: 'text' },
      { id: 'e3', source: 'n3', target: 'n4', sourcePort: 'out-image', targetPort: 'in-image', type: 'image' },
      { id: 'e4', source: 'n4', target: 'n5', sourcePort: 'out-image', targetPort: 'in-image', type: 'image' },
    ]
  },
])
</script>

<template>
  <div class="templates-view">
    <div class="page-header">
      <h1>创作模板</h1>
      <p>选择模板快速创建专业级内容</p>
    </div>

    <!-- Tab 切换 -->
    <div class="tab-bar">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'video' }"
        @click="activeTab = 'video'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="23 7 16 12 23 17 23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2"/>
        </svg>
        短视频模板
        <span class="tab-count">{{ videoTemplates.length }}</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'image' }"
        @click="activeTab = 'image'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
        图片模板
        <span class="tab-count">{{ imageTemplates.length }}</span>
      </button>
    </div>

    <!-- 短视频模板 -->
    <section v-show="activeTab === 'video'" class="template-section">
      <div class="cards-scroll">
        <div
          v-for="template in videoTemplates"
          :key="template.id"
          class="template-card"
          :class="{ 'has-prompt': hasProductText(template) }"
          @click="useTemplate(template)"
        >
          <div class="card-preview">
            <img :src="template.preview" :alt="template.name" />
            <div class="card-tags">
              <span v-for="tag in template.tags" :key="tag">{{ tag }}</span>
            </div>
          </div>
          <div class="card-content">
            <h3>{{ template.name }}</h3>
            <p>{{ template.desc }}</p>
            <div class="card-meta">
              <div class="cost-badge" v-if="getTemplateCost(template) > 0">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1"/>
                  <path d="M5 3V5.5L6.5 6.5" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
                </svg>
                {{ getTemplateCost(template) }} 积分
              </div>
              <div class="cost-badge free" v-else>
                免费
              </div>
            </div>
            <!-- 产品描述编辑 -->
            <div v-if="hasProductText(template)" class="card-prompt">
              <div class="prompt-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                场景提示词
              </div>
              <textarea
                class="prompt-input"
                :value="template.prompt || ''"
                @input="template.prompt = ($event.target as HTMLTextAreaElement).value"
                @click.stop
                placeholder="输入产品描述..."
                rows="2"
              ></textarea>
            </div>
            <div class="card-flow">
              <span
                v-for="(node, idx) in template.nodes"
                :key="node.id"
                class="flow-item"
              >
                <span class="dot" :style="{ background: getNodeDef(node.nodeDefId)?.color }"></span>
                {{ getNodeDef(node.nodeDefId)?.name }}
                <span v-if="idx < template.nodes.length - 1" class="arrow">→</span>
              </span>
            </div>
          </div>
          <div class="card-action">
            <span>使用模板</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </div>
    </section>

    <!-- 图片模板 -->
    <section v-show="activeTab === 'image'" class="template-section">
      <div class="cards-scroll">
        <div
          v-for="template in imageTemplates"
          :key="template.id"
          class="template-card"
          :class="{ 'has-prompt': hasProductText(template) }"
          @click="useTemplate(template)"
        >
          <div class="card-preview">
            <img :src="template.preview" :alt="template.name" />
            <div class="card-tags">
              <span v-for="tag in template.tags" :key="tag">{{ tag }}</span>
            </div>
          </div>
          <div class="card-content">
            <h3>{{ template.name }}</h3>
            <p>{{ template.desc }}</p>
            <div class="card-meta">
              <div class="cost-badge" v-if="getTemplateCost(template) > 0">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1"/>
                  <path d="M5 3V5.5L6.5 6.5" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
                </svg>
                {{ getTemplateCost(template) }} 积分
              </div>
              <div class="cost-badge free" v-else>
                免费
              </div>
            </div>
            <!-- 产品描述编辑 -->
            <div v-if="hasProductText(template)" class="card-prompt">
              <div class="prompt-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                场景提示词
              </div>
              <textarea
                class="prompt-input"
                :value="template.prompt || ''"
                @input="template.prompt = ($event.target as HTMLTextAreaElement).value"
                @click.stop
                placeholder="输入产品描述..."
                rows="2"
              ></textarea>
            </div>
            <div class="card-flow">
              <span
                v-for="(node, idx) in template.nodes"
                :key="node.id"
                class="flow-item"
              >
                <span class="dot" :style="{ background: getNodeDef(node.nodeDefId)?.color }"></span>
                {{ getNodeDef(node.nodeDefId)?.name }}
                <span v-if="idx < template.nodes.length - 1" class="arrow">→</span>
              </span>
            </div>
          </div>
          <div class="card-action">
            <span>使用模板</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.templates-view {
  padding: 28px 32px 48px;
  max-width: 1600px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(180deg, var(--bg-primary) 0%, rgba(78, 205, 196, 0.03) 100%);
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.page-header p {
  font-size: 14px;
  color: var(--text-muted);
}

/* Tab 切换 */
.tab-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 28px;
  padding: 6px;
  background: var(--bg-elevated);
  border-radius: 14px;
  width: fit-content;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--bg-card);
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.tab-count {
  padding: 2px 8px;
  background: var(--bg-primary);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.tab-btn.active .tab-count {
  background: rgba(78, 205, 196, 0.15);
  color: var(--accent-cyan);
}

/* 卡片区域 */
.template-section {
  min-height: 400px;
}

.cards-scroll {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 16px;
  scroll-snap-type: x mandatory;
}

.cards-scroll::-webkit-scrollbar {
  height: 6px;
}

.cards-scroll::-webkit-scrollbar-track {
  background: var(--bg-elevated);
  border-radius: 3px;
}

.cards-scroll::-webkit-scrollbar-thumb {
  background: var(--border-light);
  border-radius: 3px;
}

.template-card {
  flex-shrink: 0;
  width: 320px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  scroll-snap-align: start;
}

.template-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
  border-color: var(--accent-cyan);
}

.card-preview {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.card-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.template-card:hover .card-preview img {
  transform: scale(1.08);
}

.card-tags {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 6px;
}

.card-tags span {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-primary);
}

.card-content {
  padding: 18px;
}

.card-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.card-content p {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 14px;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.cost-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(78, 205, 196, 0.1);
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-cyan);
}

.cost-badge.free {
  background: rgba(52, 211, 153, 0.1);
  border-color: rgba(52, 211, 153, 0.2);
  color: #059669;
}

/* 产品描述编辑 */
.card-prompt {
  margin-bottom: 14px;
  padding: 10px;
  background: rgba(167, 139, 250, 0.06);
  border: 1px solid rgba(167, 139, 250, 0.15);
  border-radius: 8px;
}

.prompt-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #a78bfa;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.prompt-input {
  width: 100%;
  padding: 8px 10px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 12px;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  resize: none;
  outline: none;
  line-height: 1.5;
  transition: border-color 0.2s;
}

.prompt-input:focus {
  border-color: #a78bfa;
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.1);
}

.prompt-input::placeholder {
  color: var(--text-muted);
}

.template-card.has-prompt {
  border-color: rgba(167, 139, 250, 0.2);
}

.template-card.has-prompt:hover {
  border-color: rgba(167, 139, 250, 0.4);
}

.card-flow {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.flow-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-secondary);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.arrow {
  color: var(--text-muted);
  margin: 0 2px;
}

.card-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  font-size: 13px;
  font-weight: 500;
  color: var(--accent-cyan);
  transition: all 0.2s;
}

.template-card:hover .card-action {
  background: rgba(78, 205, 196, 0.08);
}

@media (max-width: 768px) {
  .templates-view {
    padding: 16px;
  }
  .tab-bar {
    width: 100%;
  }
  .tab-btn {
    flex: 1;
    justify-content: center;
    padding: 10px 12px;
    font-size: 13px;
  }
  .cards-scroll {
    gap: 14px;
  }
  .template-card {
    width: 280px;
  }
}
</style>
