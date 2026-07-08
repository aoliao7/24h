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

export const useCreativeStore = defineStore('creative', () => {
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

  return { creatives, addCreative, deleteCreative }
})
