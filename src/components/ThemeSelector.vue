<script setup>
import { useThemeStore } from '../stores/theme'

const themeStore = useThemeStore()

function selectTheme(themeName) {
  themeStore.setTheme(themeName)
}
</script>

<template>
  <div class="theme-selector">
    <h3>🎨 Choose Theme</h3>
    <div class="themes-grid">
      <button
        v-for="(theme, key) in themeStore.themes"
        :key="key"
        @click="selectTheme(key)"
        :class="['theme-option', { active: themeStore.currentTheme === key }]"
        :style="{
          '--theme-primary': theme.primary,
          '--theme-bg': theme.background,
          '--theme-surface': theme.surface
        }"
      >
        <div class="theme-preview">
          <div class="preview-bar" :style="{ background: theme.primary }"></div>
          <div class="preview-content" :style="{ background: theme.surface }">
            <div class="preview-text" :style="{ background: theme.surfaceLight }"></div>
            <div class="preview-text" :style="{ background: theme.surfaceLight }"></div>
          </div>
        </div>
        <span class="theme-name">{{ theme.name }}</span>
        <span v-if="themeStore.currentTheme === key" class="check-mark">✓</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.theme-selector {
  padding: 1.5rem;
  background: var(--color-surface);
  border-radius: 12px;
  margin-top: 1rem;
}

.theme-selector h3 {
  color: var(--color-text);
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.theme-option {
  position: relative;
  background: var(--color-surface-light);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.theme-option:hover {
  transform: translateY(-2px);
  border-color: var(--theme-primary);
}

.theme-option.active {
  border-color: var(--theme-primary);
  background: var(--color-surface);
}

.theme-preview {
  width: 100%;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--theme-bg);
}

.preview-bar {
  height: 20%;
  width: 100%;
}

.preview-content {
  padding: 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  height: 80%;
}

.preview-text {
  height: 30%;
  border-radius: 3px;
}

.theme-name {
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
}

.check-mark {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: var(--color-primary);
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
}

@media (max-width: 768px) {
  .themes-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
