<script setup lang="ts">
import { ref, computed } from "vue";
import { useCreativeStore } from "../stores/creative";

const store = useCreativeStore();
const searchQuery = ref("");
const filterType = ref("");
const viewMode = ref<"grid" | "list">("grid");

const filteredCreatives = computed(() => {
  return store.creatives.filter((c) => {
    const matchSearch = c.title
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase());
    const matchType = !filterType.value || c.type === filterType.value;
    return matchSearch && matchType;
  });
});

const statusMap: Record<string, { label: string; color: string }> = {
  completed: { label: "已完成", color: "success" },
  generating: { label: "生成中", color: "warning" },
  draft: { label: "草稿", color: "info" },
};

// 扇形广告数据
const bannerAds = [
  {
    id: 1,
    title: "限时特惠",
    subtitle: "AI生成图片8折",
    image: "https://picsum.photos/seed/banner1/400/350",
    color: "#667eea",
  },
  {
    id: 2,
    title: "新品上线",
    subtitle: "视频生成功能",
    image: "https://picsum.photos/seed/banner2/400/350",
    color: "#764ba2",
  },
  {
    id: 3,
    title: "创作者计划",
    subtitle: "投稿赢大奖",
    image: "https://picsum.photos/seed/banner3/400/350",
    color: "#f093fb",
  },
  {
    id: 4,
    title: "教程中心",
    subtitle: "快速上手指南",
    image: "https://picsum.photos/seed/banner4/400/350",
    color: "#4ecdc4",
  },
  {
    id: 5,
    title: "热门推荐",
    subtitle: "本周精选作品",
    image: "https://picsum.photos/seed/banner5/400/350",
    color: "#ff6b6b",
  },
];
</script>

<template>
  <div class="gallery-view">
    <!-- 扇形广告区域 -->
    <section class="banner-section">
      <div class="banner-container">
        <div class="banner-fan">
          <div
            v-for="(banner, index) in bannerAds"
            :key="banner.id"
            class="banner-item"
            :style="{
              '--rotation': `${(index - (bannerAds.length - 1) / 2) * 40}deg`,
              '--delay': `${index * 0.1}s`,
              '--color': banner.color,
            }"
          >
            <img :src="banner.image" :alt="banner.title" class="banner-image" />
            <div class="banner-overlay">
              <h3>{{ banner.title }}</h3>
              <p>{{ banner.subtitle }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="page-header">
      <div class="header-left">
        <h1>作品画廊</h1>
        <span class="count-badge">{{ filteredCreatives.length }} 个作品</span>
      </div>
      <div class="header-right">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle
              cx="7"
              cy="7"
              r="5"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <path
              d="M11 11L14 14"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
          <input v-model="searchQuery" type="text" placeholder="搜索作品..." />
        </div>
        <select v-model="filterType" class="filter-select">
          <option value="">全部类型</option>
          <option value="image">图片</option>
          <option value="video">视频</option>
        </select>
        <div class="view-toggle">
          <button
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect
                x="2"
                y="2"
                width="5"
                height="5"
                rx="1"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <rect
                x="9"
                y="2"
                width="5"
                height="5"
                rx="1"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <rect
                x="2"
                y="9"
                width="5"
                height="5"
                rx="1"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <rect
                x="9"
                y="9"
                width="5"
                height="5"
                rx="1"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </svg>
          </button>
          <button
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 4H14M2 8H14M2 12H14"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Grid View -->
    <div v-if="viewMode === 'grid'" class="gallery-grid">
      <div
        v-for="item in filteredCreatives"
        :key="item.id"
        class="gallery-item card card-hover"
      >
        <div class="item-preview">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect
              x="6"
              y="6"
              width="36"
              height="36"
              rx="6"
              stroke="currentColor"
              stroke-width="2"
            />
            <circle
              cx="17"
              cy="17"
              r="4"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M42 32L34 24L22 36"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          <div class="item-overlay">
            <button class="overlay-btn preview">预览</button>
            <button class="overlay-btn edit">编辑</button>
          </div>
        </div>
        <div class="item-info">
          <h4>{{ item.title }}</h4>
          <div class="item-meta">
            <el-tag size="small" :type="statusMap[item.status].color as any">
              {{ statusMap[item.status].label }}
            </el-tag>
            <span class="item-date">{{ item.createdAt }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="gallery-list">
      <div class="list-header card">
        <span class="col-name">名称</span>
        <span class="col-type">类型</span>
        <span class="col-status">状态</span>
        <span class="col-date">创建时间</span>
        <span class="col-actions">操作</span>
      </div>
      <div
        v-for="item in filteredCreatives"
        :key="item.id"
        class="list-item card"
      >
        <div class="col-name">
          <div class="item-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect
                x="2"
                y="2"
                width="16"
                height="16"
                rx="3"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <circle
                cx="7"
                cy="7"
                r="2"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M18 14L14 10L9 15"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </div>
          {{ item.title }}
        </div>
        <div class="col-type">
          <el-tag
            size="small"
            :type="item.type === 'video' ? 'warning' : 'primary'"
          >
            {{ item.type === "video" ? "视频" : "图片" }}
          </el-tag>
        </div>
        <div class="col-status">
          <el-tag size="small" :type="statusMap[item.status].color as any">
            {{ statusMap[item.status].label }}
          </el-tag>
        </div>
        <div class="col-date text-secondary">{{ item.createdAt }}</div>
        <div class="col-actions">
          <button class="action-btn">预览</button>
          <button class="action-btn">编辑</button>
          <button class="action-btn danger">删除</button>
        </div>
      </div>
    </div>

    <el-empty v-if="filteredCreatives.length === 0" description="暂无作品" />
  </div>
</template>

<style scoped>
.gallery-view {
  padding: 16px 24px 32px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 扇形广告区域 */
.banner-section {
  margin-bottom: 24px;
}

.banner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px 0;
  overflow: visible;
}

.banner-fan {
  position: relative;
  width: 900px;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.banner-item {
  position: absolute;
  width: 200px;
  height: 260px;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: center bottom;
  transform: rotate(var(--rotation)) translateY(20px);
  animation: fan-in 0.6s ease-out backwards;
  animation-delay: var(--delay);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.banner-item:hover {
  transform: rotate(var(--rotation)) translateY(0) scale(1.1);
  z-index: 100;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
}

@keyframes fan-in {
  from {
    opacity: 0;
    transform: rotate(var(--rotation)) translateY(80px) scale(0.3);
  }
  to {
    opacity: 1;
    transform: rotate(var(--rotation)) translateY(20px) scale(1);
  }
}

.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 14px 16px;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0.3) 60%,
    transparent 100%
  );
  color: #fff;
}

.banner-overlay h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.banner-overlay p {
  font-size: 13px;
  opacity: 0.9;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.count-badge {
  font-size: 12px;
  color: var(--text-muted);
  padding: 4px 12px;
  background: var(--bg-elevated);
  border-radius: 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  transition: all 0.2s;
}

.search-box:focus-within {
  border-color: var(--accent-cyan);
}

.search-box input {
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 13px;
  width: 160px;
}

.search-box input::placeholder {
  color: var(--text-muted);
}

.filter-select {
  padding: 8px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

.view-toggle {
  display: flex;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  padding: 4px;
}

.view-toggle button {
  padding: 6px 10px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.view-toggle button.active {
  background: var(--accent-cyan);
  color: #fff;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.gallery-item {
  overflow: hidden;
}

.item-preview {
  height: 180px;
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  position: relative;
}

.item-overlay {
  position: absolute;
  inset: 0;
  background: rgba(247, 248, 250, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.gallery-item:hover .item-overlay {
  opacity: 1;
}

.overlay-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.overlay-btn.preview {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
}

.overlay-btn.preview:hover {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.overlay-btn.edit {
  background: var(--accent-cyan);
  border: none;
  color: #fff;
}

.overlay-btn.edit:hover {
  box-shadow: 0 4px 16px rgba(78, 205, 196, 0.3);
}

.item-info {
  padding: 16px;
}

.item-info h4 {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.item-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-date {
  font-size: 12px;
  color: var(--text-muted);
}

/* List View */
.gallery-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  padding: 12px 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.list-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  padding: 16px 20px;
  align-items: center;
}

.col-name {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--text-primary);
}

.item-icon {
  width: 36px;
  height: 36px;
  background: var(--bg-elevated);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.col-type,
.col-status {
  font-size: 13px;
}
.col-date {
  font-size: 13px;
}

.col-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  padding: 6px 10px;
  background: none;
  border: none;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(78, 205, 196, 0.08);
  color: var(--accent-cyan);
}

.action-btn.danger:hover {
  background: rgba(248, 113, 113, 0.08);
  color: #dc2626;
}

@media (max-width: 1200px) {
  .gallery-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 900px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .banner-fan {
    width: 100%;
    transform: scale(0.8);
  }
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
