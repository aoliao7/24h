<script setup lang="ts">
import { ref, computed } from "vue";
import { useCreativeStore, type Creative } from "@/stores/creative";

const store = useCreativeStore();
const searchQuery = ref("");

// 示例广告数据 - 使用网络图片
const bannerAds = [
  {
    id: 1,
    title: "限时特惠",
    subtitle: "AI生成图片8折",
    image: "https://picsum.photos/seed/banner1/400/300",
    color: "#667eea",
  },
  {
    id: 2,
    title: "新品上线",
    subtitle: "视频生成功能",
    image: "https://picsum.photos/seed/banner2/400/300",
    color: "#764ba2",
  },
  {
    id: 3,
    title: "创作者计划",
    subtitle: "投稿赢大奖",
    image: "https://picsum.photos/seed/banner3/400/300",
    color: "#f093fb",
  },
  {
    id: 4,
    title: "教程中心",
    subtitle: "快速上手指南",
    image: "https://picsum.photos/seed/banner4/400/300",
    color: "#4ecdc4",
  },
];

const filteredCreatives = computed(() => {
  if (!searchQuery.value) return store.creatives;
  return store.creatives.filter((c: Creative) =>
    c.title.toLowerCase().includes(searchQuery.value.toLowerCase()),
  );
});

// 生成瀑布流布局
const masonryItems = computed(() => {
  return filteredCreatives.value.map((item: Creative, index: number) => {
    const seed = parseInt(item.id) || index;
    const offsetX = ((seed * 37) % 20) - 10;
    const offsetY = ((seed * 53) % 80) - 40;
    const scale = 0.95 + ((seed * 23) % 15) / 100;
    const rotation = ((seed * 17) % 6) - 3;

    return { ...item, index, offsetX, offsetY, scale, rotation };
  });
});

const getImage = (id: string, index: number) => {
  const seed = parseInt(id) || index + 10;
  return `https://picsum.photos/seed/${seed}/600/400`;
};
</script>

<template>
  <div class="gallery-view">
    <!-- 上部分：扇形广告展示 -->
    <section class="banner-section">
      <div class="banner-container">
        <div class="banner-fan">
          <div
            v-for="(banner, index) in bannerAds"
            :key="banner.id"
            class="banner-item"
            :style="{
              '--rotation': `${(index - (bannerAds.length - 1) / 2) * 35}deg`,
              '--delay': `${index * 0.12}s`,
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

    <!-- 搜索区域 -->
    <section class="search-section">
      <div class="search-wrapper">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          class="search-icon"
        >
          <circle
            cx="9"
            cy="9"
            r="6"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            d="M14 14L18 18"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索你喜欢的作品..."
          class="search-input"
        />
        <span v-if="searchQuery" class="result-count"
          >{{ filteredCreatives.length }} 个结果</span
        >
      </div>
    </section>

    <!-- 下部分：不规则瀑布流 -->
    <section class="masonry-section">
      <div class="masonry-grid">
        <div
          v-for="(item, index) in masonryItems"
          :key="item.id"
          class="masonry-item"
          :style="{
            '--offset-x': `${item.offsetX}px`,
            '--offset-y': `${item.offsetY}px`,
            '--scale': item.scale,
            '--rotation': `${item.rotation}deg`,
            '--stagger': `${index * 0.08}s`,
          }"
        >
          <div class="masonry-card card card-hover">
            <div class="card-image">
              <img
                :src="getImage(item.id, index)"
                :alt="item.title"
                loading="lazy"
              />
              <div class="card-overlay">
                <button class="overlay-btn" title="预览">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 4C6 4 2.5 8 2.5 12C2.5 16 6 20 10 20C14 20 17.5 16 17.5 12C17.5 8 14 4 10 4Z"
                      stroke="currentColor"
                      stroke-width="1.5"
                    />
                    <circle
                      cx="10"
                      cy="11"
                      r="3"
                      stroke="currentColor"
                      stroke-width="1.5"
                    />
                  </svg>
                </button>
                <button class="overlay-btn" title="收藏">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 17L4.5 12C2.5 10 2.5 7 4.5 5C6.5 3 9.5 3 10 5C10.5 3 13.5 3 15.5 5C17.5 7 17.5 10 15.5 12L10 17Z"
                      stroke="currentColor"
                      stroke-width="1.5"
                    />
                  </svg>
                </button>
              </div>
              <div class="card-type" v-if="item.type === 'video'">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <path d="M3 2L10 6L3 10V2Z" />
                </svg>
              </div>
            </div>
            <div class="card-info">
              <h4>{{ item.title }}</h4>
              <div class="card-meta">
                <span class="date">{{ item.createdAt }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-if="masonryItems.length === 0" description="暂无相关作品" />
    </section>
  </div>
</template>

<style scoped>
.gallery-view {
  min-height: calc(100vh - 60px);
  padding: 16px 24px 32px;
  max-width: 1600px;
  margin: 0 auto;
}

/* 扇形广告区域 */
.banner-section {
  margin-bottom: 0;
}

.banner-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 48px 0 20px;
  overflow: visible;
}

.banner-fan {
  position: relative;
  width: 1000px;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.banner-item {
  position: absolute;
  width: 260px;
  height: 340px;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: center bottom;
  transform: rotate(var(--rotation)) translateY(30px);
  animation: fan-in 0.8s ease-out backwards;
  animation-delay: var(--delay);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.banner-item:hover {
  transform: rotate(var(--rotation)) translateY(0) scale(1.1) !important;
  z-index: 100;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
}

@keyframes fan-in {
  from {
    opacity: 0;
    transform: rotate(var(--rotation)) translateY(100px) scale(0.3);
  }
  to {
    opacity: 1;
    transform: rotate(var(--rotation)) translateY(30px) scale(1);
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
  padding: 24px 16px 20px;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.85) 0%,
    rgba(0, 0, 0, 0.4) 60%,
    transparent 100%
  );
  color: #fff;
}

.banner-overlay h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 6px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.banner-overlay p {
  font-size: 14px;
  opacity: 0.9;
}

/* 搜索区域 */
.search-section {
  margin-top: 48px;
  margin-bottom: 48px;
  position: relative;
  z-index: 10;
}

.search-wrapper {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border: 2px solid var(--border-light);
  border-radius: 50px;
  padding: 14px 24px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.search-wrapper:focus-within {
  border-color: var(--accent-cyan);
  box-shadow: 0 4px 24px rgba(78, 205, 196, 0.2);
}

.search-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  padding: 0 16px;
  font-size: 16px;
  color: var(--text-primary);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.result-count {
  font-size: 13px;
  color: var(--accent-cyan);
  background: rgba(78, 205, 196, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  white-space: nowrap;
}

/* 瀑布流区域 */
.masonry-section {
  padding-bottom: 40px;
}

.masonry-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  align-items: center;
  padding: 20px 0;
}

.masonry-item {
  animation: fade-in 0.6s ease-out backwards;
  animation-delay: var(--stagger);
  transform: translate(var(--offset-x), var(--offset-y)) scale(var(--scale));
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translate(var(--offset-x), calc(var(--offset-y) + 50px))
      scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(var(--offset-x), var(--offset-y)) scale(var(--scale));
  }
}

.masonry-card {
  overflow: hidden;
  border-radius: 16px;
}

.card-image {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.masonry-card:hover .card-image img {
  transform: scale(1.08);
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 50%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 12px;
  padding-bottom: 20px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.masonry-card:hover .card-overlay {
  opacity: 1;
}

.overlay-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--bg-card);
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  backdrop-filter: blur(8px);
}

.overlay-btn:hover {
  background: var(--accent-cyan);
  color: #fff;
  transform: scale(1.1);
}

.card-type {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  backdrop-filter: blur(4px);
}

.card-info {
  padding: 16px 4px;
}

.card-info h4 {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.card-meta {
  display: flex;
  align-items: center;
}

.date {
  font-size: 12px;
  color: var(--text-muted);
}

/* 响应式 */
@media (max-width: 1200px) {
  .masonry-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .masonry-item {
    transform: translate(0, 0) scale(1);
  }
}

@media (max-width: 900px) {
  .banner-fan {
    width: 800px;
    height: 300px;
  }
  .banner-item {
    width: 200px;
    height: 260px;
  }
  .masonry-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .gallery-view {
    padding: 12px 16px;
  }

  .banner-fan {
    width: 100%;
    transform: scale(0.8);
  }

  .masonry-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .masonry-item {
    transform: translate(0, 0) scale(1);
  }

  .search-wrapper {
    padding: 12px 16px;
  }
}
</style>
