<script lang="ts">
  import { apiClient, switchToMockServer, switchToRealServer, type ServerType } from '$lib/api/client';
  import { onMount } from 'svelte';

  let currentServer: ServerType = 'MOCK';

  onMount(() => {
    currentServer = apiClient.getCurrentServer();
  });

  const handleServerChange = (serverType: ServerType) => {
    if (serverType === 'MOCK') {
      switchToMockServer();
    } else {
      switchToRealServer();
    }
    currentServer = serverType;
  };

  const serverLabels = {
    MOCK: 'Мок-сервер (localhost:3001)',
    REAL: 'Реальный сервер (localhost:8000)'
  };
</script>

<div class="server-switcher">
  <label for="server-select" class="server-label">
    API Сервер:
  </label>
  <select 
    id="server-select" 
    bind:value={currentServer} 
    on:change={() => handleServerChange(currentServer)}
    class="server-select"
  >
    <option value="MOCK">{serverLabels.MOCK}</option>
    <option value="REAL">{serverLabels.REAL}</option>
  </select>
  
  <div class="server-status">
    <span class="status-indicator {currentServer.toLowerCase()}"></span>
    <span class="status-text">
      {currentServer === 'MOCK' ? 'Используется мок-сервер' : 'Используется реальный сервер'}
    </span>
  </div>
</div>

<style>
  .server-switcher {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background: #f5f5f5;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
    font-size: 14px;
  }

  .server-label {
    font-weight: 500;
    color: #333;
    white-space: nowrap;
  }

  .server-select {
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
    font-size: 14px;
    min-width: 200px;
  }

  .server-select:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .server-status {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
  }

  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }

  .status-indicator.mock {
    background-color: #ffc107;
  }

  .status-indicator.real {
    background-color: #28a745;
  }

  .status-text {
    font-size: 12px;
    color: #666;
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    .server-switcher {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }

    .server-status {
      margin-left: 0;
      justify-content: center;
    }

    .server-select {
      min-width: auto;
    }
  }
</style>
