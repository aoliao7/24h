import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Creative {
  id: string
  title: string
  type: 'image' | 'video'
  status: 'completed' | 'generating' | 'draft'
  createdAt: string
  thumbnail?: string
}

// 节点积分配置
export const NODE_CREDITS: Record<string, { base: number; perOutput?: number }> = {
  'product-image': { base: 0 },
  'product-text': { base: 0 },
  'ai-image-gen': { base: 50 },
  'ai-video-gen': { base: 100 },
  'style-filter': { base: 10 },
  'text-add': { base: 5 },
  'smart-crop': { base: 5 },
  'export-image': { base: 0 },
  'export-video': { base: 0 },
}

// 计算工作流所需积分
export const calculateWorkflowCost = (nodes: { nodeDefId: string }[]): number => {
  return nodes.reduce((total, node) => {
    const cost = NODE_CREDITS[node.nodeDefId]
    return total + (cost?.base || 0)
  }, 0)
}

export const useCreativeStore = defineStore('creative', () => {
  const credits = ref(500)
  const transactions = ref<{ id: string; desc: string; amount: number; time: string }[]>([
    { id: '1', desc: 'AI 场景生成', amount: -50, time: '2026-07-08 14:30' },
    { id: '2', desc: '视频生成服务', amount: -100, time: '2026-07-08 11:20' },
    { id: '3', desc: '充值积分', amount: 500, time: '2026-07-05 09:00' },
    { id: '4', desc: '高清图片导出', amount: -30, time: '2026-07-03 16:45' },
  ])

  const creatives = ref<Creative[]>([
    { id: '1', title: '夏日清凉饮料海报', type: 'image', status: 'completed', createdAt: '2024-01-15' },
    { id: '2', title: '产品展示视频', type: 'video', status: 'completed', createdAt: '2024-01-14' },
    { id: '3', title: '品牌宣传图', type: 'image', status: 'completed', createdAt: '2024-01-13' },
    { id: '4', title: '节日促销banner', type: 'image', status: 'completed', createdAt: '2024-01-12' },
    { id: '5', title: '新品发布会视频', type: 'video', status: 'generating', createdAt: '2024-01-11' },
    { id: '6', title: '社交媒体配图', type: 'image', status: 'completed', createdAt: '2024-01-10' },
    { id: '7', title: '电商主图设计', type: 'image', status: 'draft', createdAt: '2024-01-09' },
    { id: '8', title: '用户案例视频', type: 'video', status: 'completed', createdAt: '2024-01-08' },
  ])

  const deductCredits = (amount: number, desc: string) => {
    if (credits.value < amount) {
      return false
    }
    credits.value -= amount
    transactions.value.unshift({
      id: Date.now().toString(),
      desc,
      amount: -amount,
      time: new Date().toLocaleString('zh-CN'),
    })
    return true
  }

  const addCredits = (amount: number) => {
    credits.value += amount
    transactions.value.unshift({
      id: Date.now().toString(),
      desc: '充值积分',
      amount,
      time: new Date().toLocaleString('zh-CN'),
    })
  }

  const addCreative = (creative: Omit<Creative, 'id' | 'createdAt'>) => {
    creatives.value.push({
      ...creative,
      id: Date.now().toString(),
      createdAt: new Date().toLocaleDateString('zh-CN'),
    })
  }

  const deleteCreative = (id: string) => {
    creatives.value = creatives.value.filter(c => c.id !== id)
  }

  return { 
    credits, 
    transactions, 
    creatives, 
    addCreative, 
    deleteCreative, 
    deductCredits, 
    addCredits,
    calculateWorkflowCost,
    NODE_CREDITS,
  }
})
