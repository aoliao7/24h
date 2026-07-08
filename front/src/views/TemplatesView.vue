<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

const templates = ref([
  { id: 1, name: '产品主图生成', desc: '上传产品图，生成高质量电商主图', steps: ['产品图片', '背景替换', '智能优化'], uses: 1250, gradient: 'linear-gradient(135deg, #4ecdc4, #44a8a0)' },
  { id: 2, name: '场景化营销图', desc: '将产品融入生活场景，提升转化率', steps: ['产品图片', '场景生成', '光影融合'], uses: 890, gradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' },
  { id: 3, name: '短视频制作', desc: '自动生成产品展示短视频', steps: ['产品图片', '视频生成', '配乐添加'], uses: 567, gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)' },
  { id: 4, name: '多图拼接', desc: '将多张图片拼接成海报', steps: ['多图上传', '智能排版', '文字添加'], uses: 432, gradient: 'linear-gradient(135deg, #34d399, #059669)' },
  { id: 5, name: '批量处理', desc: '一次处理多张产品图', steps: ['批量上传', '统一处理', '批量导出'], uses: 321, gradient: 'linear-gradient(135deg, #f472b6, #db2777)' },
  { id: 6, name: '智能抠图', desc: 'AI 精准识别主体一键抠图', steps: ['上传图片', 'AI 识别', '导出透明背景'], uses: 210, gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)' },
])

const useTemplate = (template: { name: string }) => {
  ElMessage.success(`已加载模板: ${template.name}`)
  router.push('/canvas')
}
</script>

<template>
  <div class="templates-view">
    <div class="page-header">
      <h1>创作模板</h1>
      <p>选择适合你的创作模板，快速开始</p>
    </div>

    <div class="templates-grid">
      <div v-for="template in templates" :key="template.id" class="template-card card card-hover">
        <div class="card-preview" :style="{ background: template.gradient }">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M20 8L28 14V26L20 32L12 26V14L20 8Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
            <circle cx="20" cy="20" r="5" stroke="white" stroke-width="2"/>
          </svg>
        </div>
        <div class="card-content">
          <h3>{{ template.name }}</h3>
          <p>{{ template.desc }}</p>
          <div class="card-steps">
            <span v-for="(step, i) in template.steps" :key="i" class="step">
              {{ step }}
              <svg v-if="i < template.steps.length - 1" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2L8 6L4 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </span>
          </div>
          <div class="card-footer">
            <span class="uses-count">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="5" r="3" stroke="currentColor" stroke-width="1.5"/>
                <path d="M2 13C2 10.8 4.2 9 7 9C9.8 9 12 10.8 12 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              {{ template.uses.toLocaleString() }} 次使用
            </span>
            <button class="use-btn" @click="useTemplate(template)">使用</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.templates-view {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.page-header p {
  font-size: 14px;
  color: var(--text-muted);
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.template-card {
  overflow: hidden;
}

.card-preview {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.card-content {
  padding: 20px;
}

.card-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.card-content > p {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 16px;
  line-height: 1.5;
}

.card-steps {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-bottom: 20px;
}

.step {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.step svg {
  color: var(--text-muted);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}

.uses-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.use-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.use-btn:hover {
  box-shadow: 0 4px 16px rgba(78, 205, 196, 0.3);
}

@media (max-width: 1200px) { .templates-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .templates-grid { grid-template-columns: 1fr; } }
</style>
