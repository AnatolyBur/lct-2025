<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import ServerSwitcher from '$lib/components/ServerSwitcher.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<style>
    :global(*) {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
        box-sizing: border-box;
    }

    /* Дизайн-токены и базовые стили (компактная тема) */
    :global(:root) {
        /* spacing */
        --space-1: 4px;
        --space-2: 8px;
        --space-3: 12px;
        --space-4: 16px;
        --space-5: 20px;
        --space-6: 24px;

        /* radius */
        --radius-1: 4px;
        --radius-2: 8px;

        /* colors */
        --color-bg: #f6f7f9;
        --color-surface: #ffffff;
        --color-border: #e5e7eb;
        --color-text: #1f2937;
        --color-muted: #6b7280;
        --color-primary: #2563eb;
        --color-primary-hover: #1d4ed8;
        --color-danger: #dc2626;
        --color-danger-hover: #b91c1c;
        --color-secondary: #6b7280;
        --color-secondary-hover: #4b5563;

        /* shadows */
        --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
        --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    :global(html, body) {
        margin: 0;
        padding: 0;
        background: var(--color-bg);
        color: var(--color-text);
        font-size: 14px; /* компактнее */
        line-height: 1.45;
    }

    :global(h1, h2, h3, h4, h5, h6) {
        margin: 0 0 var(--space-3) 0;
        font-weight: 600;
        color: var(--color-text);
    }

    :global(p) {
        margin: 0 0 var(--space-3) 0;
        color: var(--color-text);
    }

    :global(small) { color: var(--color-muted); }

    /* Формы */
    :global(label) {
        font-size: 12px;
        color: var(--color-muted);
        margin-bottom: 4px;
    }

    :global(input, select, textarea) {
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-1);
        background: var(--color-surface);
        font-size: 14px;
        color: var(--color-text);
    }

    :global(input:focus, select:focus, textarea:focus) {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    /* Кнопки (унификация по всей админке) */
    :global(.btn) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: var(--radius-1);
        border: 1px solid transparent;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        background: var(--color-surface);
        color: var(--color-text);
        border-color: var(--color-border);
    }
    :global(.btn:hover) { box-shadow: var(--shadow-sm); }
    :global(.btn:disabled) { opacity: 0.6; cursor: not-allowed; }
    :global(.btn-sm) { padding: 4px 8px; font-size: 11px; }

    :global(.btn-primary) {
        background: var(--color-primary);
        color: #fff;
        border-color: var(--color-primary);
    }
    :global(.btn-primary:hover) { background: var(--color-primary-hover); border-color: var(--color-primary-hover); }

    :global(.btn-secondary) {
        background: var(--color-secondary);
        color: #fff;
        border-color: var(--color-secondary);
    }
    :global(.btn-secondary:hover) { background: var(--color-secondary-hover); border-color: var(--color-secondary-hover); }

    :global(.btn-danger) {
        background: var(--color-danger);
        color: #fff;
        border-color: var(--color-danger);
    }
    :global(.btn-danger:hover) { background: var(--color-danger-hover); border-color: var(--color-danger-hover); }

    /* Карточки и поверхности */
    :global(.card) {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-2);
        box-shadow: var(--shadow-sm);
        padding: var(--space-4);
    }

    /* Таблицы */
    :global(table) { width: 100%; border-collapse: collapse; }
    :global(th, td) { padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); text-align: left; }
    :global(thead th) { color: var(--color-muted); font-weight: 600; }

	.app-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.header {
        background: var(--color-surface);
        border-bottom: 1px solid var(--color-border);
        padding: 10px 16px; /* чуть компактнее */
        box-shadow: var(--shadow-sm);
	}

	.main-content {
		flex: 1;
        padding: var(--space-4);
	}
</style>

<div class="app-container">
	<header class="header">
		<ServerSwitcher />
	</header>
	<main class="main-content">
		{@render children?.()}
	</main>
</div>
