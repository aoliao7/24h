import { defineStore } from 'pinia'

export interface Creative {
  id: string
  title: string
  type: 'image' | 'video'
  thumbnail: string
  createdAt: string
  status: 'draft' | 'generating' | 'completed'
}

export interface FlowNode {
  id: string
  type: string
  label: string
  position: { x: number; y: number }
}

export const useCreativeStore = defineStore('creative', {
  state: () => ({
    creatives: [
      { id: '1', title: '夏季新品主图', type: 'image', thumbnail: '', createdAt: '2026-07-01', status: 'completed' as const },
      { id: '2', title: '促销活动视频', type: 'video', thumbnail: '', createdAt: '2026-07-03', status: 'completed' as const },
      { id: '3', title: '场景化营销图', type: 'image', thumbnail: '', createdAt: '2026-07-05', status: 'generating' as const },
    ] as Creative[],
    nodes: [] as FlowNode[],
    credits: 500,
  }),
  actions: {
    addCreative(creative: Creative) {
      this.creatives.push(creative)
    },
    deductCredits(amount: number) {
      this.credits -= amount
    },
  },
})
