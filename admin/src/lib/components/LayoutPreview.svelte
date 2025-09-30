<!-- Предварительный просмотр раскладки -->
<script lang="ts">
  import type { Layout, LayoutZone, LayoutComponent } from '$lib/types/page';

  export let layout: Layout | null = null;

  // Вычисление стилей для зоны
  function getZoneStyles(zone: LayoutZone): string {
    const styles: string[] = [];
    
    switch (zone.type) {
      case 'column':
        styles.push(`width: ${zone.width || 100}%`);
        styles.push('display: flex');
        styles.push('flex-direction: column');
        break;
      case 'row':
        styles.push(`height: ${zone.height || 100}px`);
        styles.push('display: flex');
        styles.push('flex-direction: row');
        break;
      case 'flex':
        styles.push(`flex: ${zone.flex || 1}`);
        styles.push('display: flex');
        break;
      case 'grid':
        styles.push(`grid-template: ${zone.grid_template || '1fr'}`);
        styles.push('display: grid');
        break;
    }
    
    return styles.join('; ');
  }

  // Получение класса контейнера в зависимости от типа зон
  function getContainerClass(): string {
    if (!layout || !layout.zones || layout.zones.length === 0) return 'preview-container empty';
    
    const hasColumns = layout.zones.some(zone => zone.type === 'column');
    const hasRows = layout.zones.some(zone => zone.type === 'row');
    const hasGrid = layout.zones.some(zone => zone.type === 'grid');
    
    if (hasGrid) return 'preview-container grid-container';
    if (hasRows) return 'preview-container row-container';
    if (hasColumns) return 'preview-container column-container';
    
    return 'preview-container flex-container';
  }

  // Рендеринг компонента
  function renderComponent(component: LayoutComponent): string {
    const comp = component.component;
    const config = component.config || {};
    
    switch (comp.type) {
      case 'content':
        return `
          <div class="preview-component content-component">
            <div class="component-header">
              <span class="component-icon">📝</span>
              <span class="component-name">${comp.name}</span>
            </div>
            <div class="component-content">
              <p>Текстовый контент</p>
            </div>
          </div>
        `;
      case 'media':
        return `
          <div class="preview-component media-component">
            <div class="component-header">
              <span class="component-icon">🖼️</span>
              <span class="component-name">${comp.name}</span>
            </div>
            <div class="component-content">
              <div class="media-placeholder">Изображения</div>
            </div>
          </div>
        `;
      case 'form':
        return `
          <div class="preview-component form-component">
            <div class="component-header">
              <span class="component-icon">📋</span>
              <span class="component-name">${comp.name}</span>
            </div>
            <div class="component-content">
              <div class="form-placeholder">Форма</div>
            </div>
          </div>
        `;
      case 'layout':
        return `
          <div class="preview-component layout-component">
            <div class="component-header">
              <span class="component-icon">📐</span>
              <span class="component-name">${comp.name}</span>
            </div>
            <div class="component-content">
              <div class="layout-placeholder">Раскладка</div>
            </div>
          </div>
        `;
      default:
        return `
          <div class="preview-component generic-component">
            <div class="component-header">
              <span class="component-icon">⚙️</span>
              <span class="component-name">${comp.name}</span>
            </div>
            <div class="component-content">
              <div class="generic-placeholder">${comp.type}</div>
            </div>
          </div>
        `;
    }
  }
</script>

<div class="layout-preview">
  <div class="preview-header">
    <h3>Предварительный просмотр</h3>
    <span class="preview-info">
      {layout?.zones?.length || 0} зон
    </span>
  </div>

  <div class="preview-content">
    {#if !layout}
      <div class="empty-layout">
        <div class="empty-icon">📐</div>
        <p>Раскладка не загружена</p>
        <span>Выберите раскладку для предварительного просмотра</span>
      </div>
    {:else if !layout.zones || layout.zones.length === 0}
      <div class="empty-layout">
        <div class="empty-icon">📐</div>
        <p>Раскладка пуста</p>
        <span>Добавьте зоны для создания раскладки</span>
      </div>
    {:else}
      <div class={getContainerClass()}>
        {#each layout.zones as zone (zone.id)}
          <div 
            class="preview-zone"
            style={getZoneStyles(zone)}
            data-zone-type={zone.type}
          >
            <div class="zone-label">
              <span class="zone-name">{zone.name}</span>
              <span class="zone-type">{zone.type}</span>
            </div>
            
            {#if zone.components.length > 0}
              <div class="zone-components">
                {#each zone.components as component (component.id)}
                  {@html renderComponent(component)}
                {/each}
              </div>
            {:else}
              <div class="zone-placeholder">
                <span>Пустая зона</span>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .layout-preview {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
    overflow: hidden;
  }

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  .preview-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  .preview-info {
    font-size: 0.875rem;
    color: #6b7280;
    background: #e5e7eb;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }

  .preview-content {
    padding: 1rem;
    min-height: 200px;
  }

  .empty-layout {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    color: #6b7280;
    text-align: center;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .empty-layout p {
    font-size: 1.125rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .empty-layout span {
    font-size: 0.875rem;
  }

  .preview-container {
    display: flex;
    gap: 0.5rem;
    min-height: 150px;
  }

  .preview-container.empty {
    display: block;
  }

  .preview-container.column-container {
    flex-direction: row;
  }

  .preview-container.row-container {
    flex-direction: column;
  }

  .preview-container.flex-container {
    flex-direction: row;
  }

  .preview-container.grid-container {
    display: grid;
    gap: 0.5rem;
  }

  .preview-zone {
    border: 2px dashed #d1d5db;
    border-radius: 0.375rem;
    background: #f9fafb;
    position: relative;
    min-height: 100px;
    display: flex;
    flex-direction: column;
  }

  .preview-zone[data-zone-type="column"] {
    flex-direction: column;
  }

  .preview-zone[data-zone-type="row"] {
    flex-direction: row;
    align-items: center;
  }

  .preview-zone[data-zone-type="flex"] {
    flex-direction: column;
  }

  .preview-zone[data-zone-type="grid"] {
    display: grid;
  }

  .zone-label {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .zone-name {
    font-weight: 600;
    color: #1e40af;
  }

  .zone-type {
    color: #6b7280;
    text-transform: uppercase;
    font-size: 0.625rem;
  }

  .zone-components {
    flex: 1;
    padding: 2rem 0.5rem 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .zone-placeholder {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    font-size: 0.875rem;
    padding: 2rem 0.5rem 0.5rem;
  }

  .preview-component {
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    padding: 0.5rem;
    font-size: 0.75rem;
    color: #374151;
    transition: all 0.2s ease;
  }

  .preview-component:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
  }

  .component-header {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-bottom: 0.25rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .component-icon {
    font-size: 0.875rem;
  }

  .component-name {
    font-weight: 500;
    color: #1e40af;
  }

  .component-content {
    color: #6b7280;
  }

  .component-content p {
    margin: 0;
    font-size: 0.75rem;
  }

  .media-placeholder,
  .form-placeholder,
  .layout-placeholder,
  .generic-placeholder {
    background: #f3f4f6;
    border: 1px dashed #d1d5db;
    border-radius: 0.25rem;
    padding: 0.5rem;
    text-align: center;
    font-size: 0.75rem;
    color: #9ca3af;
  }

  /* Специфичные стили для типов компонентов */
  .content-component {
    border-left: 3px solid #10b981;
  }

  .media-component {
    border-left: 3px solid #f59e0b;
  }

  .form-component {
    border-left: 3px solid #8b5cf6;
  }

  .layout-component {
    border-left: 3px solid #06b6d4;
  }

  .generic-component {
    border-left: 3px solid #6b7280;
  }

  /* Адаптивность для мобильных устройств */
  @media (max-width: 768px) {
    .preview-container.column-container {
      flex-direction: column;
    }
    
    .preview-container.row-container {
      flex-direction: column;
    }
    
    .preview-zone[data-zone-type="row"] {
      flex-direction: column;
    }
  }
</style>
