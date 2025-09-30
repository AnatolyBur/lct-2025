<!-- Главная страница GarpixCMS Admin -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { pageActions } from '$lib/stores/pageStore';
</script>

<svelte:head>
  <title>GarpixCMS Admin - Панель управления</title>
  <meta name="description" content="Панель управления GarpixCMS" />
</svelte:head>

<div class="dashboard-container">
  <header class="dashboard-header">
    <div class="header-content">
      <h1 class="dashboard-title">
        <span class="dashboard-icon">📝</span>
        GarpixCMS Admin
      </h1>
      <p class="dashboard-subtitle">Панель управления контентом</p>
    </div>
  </header>

  <main class="dashboard-main">
    <div class="dashboard-content">
      <div class="welcome-section">
        <h2 class="welcome-title">Добро пожаловать в GarpixCMS Admin!</h2>
        <p class="welcome-description">
          Это панель управления для системы управления контентом GarpixCMS. 
          Здесь вы можете создавать и редактировать страницы, управлять контентом и настраивать ваш сайт.
        </p>
      </div>

      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">📄</div>
          <h3 class="feature-title">Управление страницами</h3>
          <p class="feature-description">
            Создавайте, редактируйте и управляйте страницами вашего сайта. 
            Динамические формы адаптируются под структуру ваших моделей.
          </p>
          <a href="/pages" class="feature-link">
            Перейти к страницам →
          </a>
        </div>

        <div class="feature-card">
          <div class="feature-icon">📐</div>
          <h3 class="feature-title">Управление раскладками</h3>
          <p class="feature-description">
            Создавайте и настраивайте раскладки для размещения компонентов на страницах. 
            Гибкие системы колонок, строк и сеток.
          </p>
          <a href="/layouts" class="feature-link">
            Управление раскладками →
          </a>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🔧</div>
          <h3 class="feature-title">Система компонентов</h3>
          <p class="feature-description">
            Расширяйте функциональность страниц с помощью переиспользуемых компонентов. 
            Создавайте блоки контента, формы и интерактивные элементы с поддержкой вложенности.
          </p>
          <a href="/components" class="feature-link">
            Управление компонентами →
          </a>
        </div>

        <div class="feature-card">
          <div class="feature-icon">⚙️</div>
          <h3 class="feature-title">Настройки</h3>
          <p class="feature-description">
            Настройте параметры сайта, управляйте пользователями и настраивайте 
            интеграции с внешними сервисами.
          </p>
          <span class="feature-link disabled">
            Скоро доступно →
          </span>
        </div>
      </div>

      <div class="quick-actions">
        <h3 class="quick-actions-title">Быстрые действия</h3>
        <div class="quick-actions-buttons">
          <a href="/pages/new" class="btn btn-primary">
            <span class="btn-icon">➕</span>
            Создать страницу
          </a>
          <a href="/components/new" class="btn btn-primary">
            <span class="btn-icon">🔧</span>
            Создать компонент
          </a>
          <a href="/pages" class="btn btn-secondary">
            <span class="btn-icon">📄</span>
            Все страницы
          </a>
          <a href="/components" class="btn btn-secondary">
            <span class="btn-icon">🔧</span>
            Все компоненты
          </a>
          <a href="/forms" class="btn btn-secondary">
            <span class="btn-icon">📝</span>
            Редактирование форм
          </a>
        </div>
      </div>
    </div>
  </main>

  <footer class="dashboard-footer">
    <p>GarpixCMS Admin UI - Панель управления контентом</p>
  </footer>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #f9fafb;
    color: #111827;
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  }

  .dashboard-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .dashboard-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 3rem 0;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    text-align: center;
  }

  .dashboard-title {
    font-size: 3rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .dashboard-icon {
    font-size: 3.5rem;
  }

  .dashboard-subtitle {
    font-size: 1.25rem;
    margin: 0;
    opacity: 0.9;
  }

  .dashboard-main {
    flex: 1;
    padding: 4rem 0;
  }

  .dashboard-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .welcome-section {
    text-align: center;
    margin-bottom: 4rem;
  }

  .welcome-title {
    font-size: 2.25rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 1rem 0;
  }

  .welcome-description {
    font-size: 1.125rem;
    color: #6b7280;
    line-height: 1.6;
    max-width: 800px;
    margin: 0 auto;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
    margin-bottom: 4rem;
  }

  .feature-card {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  }

  .feature-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
  }

  .feature-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .feature-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 1rem 0;
  }

  .feature-description {
    color: #6b7280;
    line-height: 1.6;
    margin: 0 0 1.5rem 0;
  }

  .feature-link {
    color: #3b82f6;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.15s ease-in-out;
  }

  .feature-link:hover {
    color: #2563eb;
  }

  .feature-link.disabled {
    color: #9ca3af;
    cursor: not-allowed;
  }

  .quick-actions {
    text-align: center;
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .quick-actions-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 1.5rem 0;
  }

  .quick-actions-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn {
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    border: none;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background-color: #2563eb;
    transform: translateY(-2px);
  }

  .btn-secondary {
    background-color: #6b7280;
    color: white;
  }

  .btn-secondary:hover {
    background-color: #4b5563;
    transform: translateY(-2px);
  }

  .btn-icon {
    font-size: 1.25rem;
  }

  .dashboard-footer {
    background: white;
    border-top: 1px solid #e5e7eb;
    padding: 2rem;
    text-align: center;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .dashboard-footer p {
    margin: 0;
  }

  @media (max-width: 768px) {
    .dashboard-title {
      font-size: 2rem;
    }

    .dashboard-icon {
      font-size: 2.5rem;
    }

    .features-grid {
      grid-template-columns: 1fr;
    }

    .quick-actions-buttons {
      flex-direction: column;
      align-items: center;
    }

    .btn {
      width: 100%;
      max-width: 300px;
    }
  }
</style>
