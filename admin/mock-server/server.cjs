// Mock сервер для GarpixCMS API
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');

// CORS заголовки
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// Загрузка JSON данных
function loadData(filename) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Ошибка загрузки ${filename}:`, error.message);
    return null;
  }
}

// Сохранение JSON данных
function saveData(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Ошибка сохранения ${filename}:`, error.message);
    return false;
  }
}

// Генерация нового ID
function generateId(data) {
  const maxId = Math.max(...data.map(item => item.id || 0), 0);
  return maxId + 1;
}

// Получение метаданных для конкретной страницы
function getMetadataForPage(page) {
  // Базовые поля для всех страниц
  const baseFields = [
    {
      "name": "title",
      "type": "CharField",
      "max_length": 255,
      "required": true,
      "help_text": "Заголовок страницы"
    },
    {
      "name": "slug",
      "type": "SlugField",
      "max_length": 255,
      "required": true,
      "help_text": "URL-адрес страницы (генерируется автоматически из заголовка)"
    },
    {
      "name": "content",
      "type": "TextField",
      "required": false,
      "help_text": "Основное содержимое страницы"
    },
    {
      "name": "is_published",
      "type": "BooleanField",
      "required": false,
      "default_value": false,
      "help_text": "Опубликовать страницу"
    },
    {
      "name": "meta_title",
      "type": "CharField",
      "max_length": 255,
      "required": false,
      "help_text": "SEO заголовок (если не указан, используется обычный заголовок)"
    },
    {
      "name": "meta_description",
      "type": "TextField",
      "required": false,
      "help_text": "SEO описание страницы"
    },
    {
      "name": "meta_keywords",
      "type": "CharField",
      "max_length": 500,
      "required": false,
      "help_text": "SEO ключевые слова (через запятую)"
    }
  ];

  // Определяем тип страницы и дополнительные поля
  let additionalFields = [];
  let modelName = "BasePage";

  // Если у страницы есть layout_id, это страница с раскладкой
  if (page.layout_id) {
    modelName = "LayoutPage";
    additionalFields = [
      {
        "name": "layout_id",
        "type": "CharField",
        "max_length": 100,
        "required": true,
        "help_text": "ID раскладки страницы"
      }
    ];
  }
  // Если у страницы есть контактные поля
  else if (page.phone || page.email || page.address) {
    modelName = "ContactPage";
    additionalFields = [
      {
        "name": "phone",
        "type": "CharField",
        "max_length": 20,
        "required": false,
        "help_text": "Номер телефона"
      },
      {
        "name": "email",
        "type": "EmailField",
        "max_length": 254,
        "required": false,
        "help_text": "Email адрес"
      },
      {
        "name": "address",
        "type": "CharField",
        "max_length": 500,
        "required": false,
        "help_text": "Адрес"
      },
      {
        "name": "map_link",
        "type": "URLField",
        "max_length": 500,
        "required": false,
        "help_text": "Ссылка на карту"
      }
    ];
  }
  // Если это обычная страница с шаблоном
  else if (page.template || page.title) {
    modelName = "TemplatePage";
    additionalFields = [
      {
        "name": "template",
        "type": "CharField",
        "max_length": 100,
        "required": false,
        "choices": [
          {"value": "default", "label": "Стандартный шаблон"},
          {"value": "landing", "label": "Лендинг"},
          {"value": "blog", "label": "Блог"},
          {"value": "portfolio", "label": "Портфолио"}
        ],
        "default_value": "default",
        "help_text": "Шаблон для отображения страницы"
      },
      {
        "name": "sort_order",
        "type": "CharField",
        "max_length": 10,
        "required": false,
        "default_value": "0",
        "help_text": "Порядок сортировки страницы"
      }
    ];
  }

  return {
    metadata: {
      model_name: modelName,
      app_label: "garpix_page",
      page_id: page.id,
      fields: [...baseFields, ...additionalFields]
    }
  };
}

// Обработка запросов
function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;
  const pathname = parsedUrl.pathname;

  // Установка CORS заголовков
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Обработка preflight запросов
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`${method} ${pathname}`);

  // Маршруты API
  console.log('[Router] Проверяем путь:', pathname);
  console.log('[Router] Соответствует metadata?', pathname === '/api/admin/pages/metadata/' || pathname === '/api/admin/pages/metadata' || pathname.match(/^\/api\/admin\/pages\/metadata\/\d+\/?$/));
  
  if (pathname === '/api/admin/pages/metadata/' || pathname === '/api/admin/pages/metadata' || pathname.match(/^\/api\/admin\/pages\/metadata\/\d+\/?$/)) {
    console.log('[Router] Направляем к handleMetadataRequest');
    handleMetadataRequest(req, res, pathname);
  } else if (pathname.match(/^\/api\/admin\/pages\/\d+\/layout\/?$/)) {
    console.log('[Router] Направляем к handlePageLayoutRequest');
    handlePageLayoutRequest(req, res, pathname, method);
  } else if (pathname.startsWith('/api/admin/pages/')) {
    console.log('[Router] Направляем к handlePagesRequest');
    handlePagesRequest(req, res, pathname, method);
  } else if (pathname.startsWith('/api/admin/components/')) {
    console.log('[Router] Направляем к handleComponentsRequest');
    handleComponentsRequest(req, res, pathname, method);
  } else if (pathname.startsWith('/api/admin/component-instances/')) {
    console.log('[Router] Направляем к handleComponentInstancesRequest');
    handleComponentInstancesRequest(req, res, pathname, method);
  } else if (pathname.startsWith('/api/admin/layouts/')) {
    console.log('[Router] Направляем к handleLayoutsRequest');
    handleLayoutsRequest(req, res, pathname, method);
  } else {
    console.log('[Router] 404 - маршрут не найден');
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
}

// Обработка запросов метаданных
function handleMetadataRequest(req, res, pathname) {
  // Извлечение ID страницы из пути
  const pathParts = pathname.split('/').filter(part => part !== '');
  const pageId = pathParts[pathParts.length - 1];
  
  console.log(`[Metadata] Запрос метаданных для страницы ID: ${pageId}`);
  
  // Загружаем данные страниц для получения информации о типе страницы
  const pages = loadData('pages.json');
  if (!pages) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
    return;
  }
  
  // Если ID не указан, возвращаем базовые метаданные
  if (!pageId || pageId === 'metadata') {
    const metadata = loadData('metadata.json');
    if (metadata) {
      res.writeHead(200);
      res.end(JSON.stringify(metadata));
    } else {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
    return;
  }
  
  // Находим страницу по ID
  const page = pages.pages.find(p => p.id === parseInt(pageId));
  if (!page) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Page not found' }));
    return;
  }
  
  // Определяем тип метаданных на основе свойств страницы
  const metadata = getMetadataForPage(page);
  
  res.writeHead(200);
  res.end(JSON.stringify(metadata));
}

// Обработка запросов страниц
function handlePagesRequest(req, res, pathname, method) {
  const pages = loadData('pages.json');
  if (!pages) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
    return;
  }

  // Извлечение ID из пути
  const pathParts = pathname.split('/').filter(part => part !== '');
  const id = pathParts[pathParts.length - 1];

  switch (method) {
    case 'GET':
      if (id && id !== 'pages') {
        // Получение конкретной страницы
        const page = pages.pages.find(p => p.id === parseInt(id));
        if (page) {
          res.writeHead(200);
          res.end(JSON.stringify(page));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Page not found' }));
        }
      } else {
        // Получение списка страниц
        res.writeHead(200);
        res.end(JSON.stringify(pages.pages));
      }
      break;

    case 'POST':
      // Создание новой страницы
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const newPage = JSON.parse(body);
          newPage.id = generateId(pages.pages);
          newPage.created_at = new Date().toISOString();
          newPage.updated_at = new Date().toISOString();
          
          pages.pages.push(newPage);
          saveData('pages.json', pages);
          
          res.writeHead(201);
          res.end(JSON.stringify(newPage));
        } catch (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      break;

    case 'PUT':
      // Обновление страницы
      if (!id || id === 'pages') {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Page ID required' }));
        return;
      }

      let updateBody = '';
      req.on('data', chunk => {
        updateBody += chunk.toString();
      });
      req.on('end', () => {
        try {
          const updatedPage = JSON.parse(updateBody);
          const pageIndex = pages.pages.findIndex(p => p.id === parseInt(id));
          
          if (pageIndex === -1) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Page not found' }));
            return;
          }

          updatedPage.id = parseInt(id);
          updatedPage.updated_at = new Date().toISOString();
          pages.pages[pageIndex] = { ...pages.pages[pageIndex], ...updatedPage };
          
          saveData('pages.json', pages);
          
          res.writeHead(200);
          res.end(JSON.stringify(pages.pages[pageIndex]));
        } catch (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      break;

    case 'DELETE':
      // Удаление страницы
      if (!id || id === 'pages') {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Page ID required' }));
        return;
      }

      const deleteIndex = pages.pages.findIndex(p => p.id === parseInt(id));
      if (deleteIndex === -1) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Page not found' }));
        return;
      }

      pages.pages.splice(deleteIndex, 1);
      saveData('pages.json', pages);
      
      res.writeHead(204);
      res.end();
      break;

    default:
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
}

// Обработка запросов раскладок страниц
function handlePageLayoutRequest(req, res, pathname, method) {
  console.log(`[PageLayout] Обработка запроса: ${method} ${pathname}`);
  
  const pageLayouts = loadData('page-layouts.json');
  if (!pageLayouts) {
    console.log('[PageLayout] Ошибка загрузки данных page-layouts.json');
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
    return;
  }

  // Извлечение ID страницы из пути
  const pathParts = pathname.split('/').filter(part => part !== '');
  const pageId = parseInt(pathParts[4]); // /api/admin/pages/{id}/layout/
  
  console.log(`[PageLayout] pageId:`, pageId);

  switch (method) {
    case 'GET':
      // Получение раскладки страницы
      const pageLayout = pageLayouts.page_layouts.find(pl => pl.page_id === pageId);
      if (pageLayout) {
        res.writeHead(200);
        res.end(JSON.stringify(pageLayout));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Page layout not found' }));
      }
      break;

    case 'POST':
    case 'PUT':
      // Установка/обновление раскладки для страницы
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const layoutData = JSON.parse(body);
          
          // Находим существующую раскладку страницы
          const existingIndex = pageLayouts.page_layouts.findIndex(pl => pl.page_id === pageId);
          
          if (existingIndex !== -1) {
            // Обновляем существующую раскладку
            pageLayouts.page_layouts[existingIndex] = {
              ...pageLayouts.page_layouts[existingIndex],
              ...layoutData,
              page_id: pageId,
              updated_at: new Date().toISOString()
            };
          } else {
            // Создаем новую раскладку страницы
            const newPageLayout = {
              page_id: pageId,
              layout_id: layoutData.layout_id,
              layout: layoutData.layout,
              custom_zones: layoutData.custom_zones || [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            pageLayouts.page_layouts.push(newPageLayout);
          }
          
          saveData('page-layouts.json', pageLayouts);
          
          const updatedLayout = pageLayouts.page_layouts.find(pl => pl.page_id === pageId);
          res.writeHead(200);
          res.end(JSON.stringify(updatedLayout));
        } catch (error) {
          console.error('[PageLayout] Ошибка обработки данных:', error);
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      break;

    case 'DELETE':
      // Удаление раскладки страницы
      const deleteIndex = pageLayouts.page_layouts.findIndex(pl => pl.page_id === pageId);
      if (deleteIndex !== -1) {
        pageLayouts.page_layouts.splice(deleteIndex, 1);
        saveData('page-layouts.json', pageLayouts);
        
        res.writeHead(204);
        res.end();
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Page layout not found' }));
      }
      break;

    default:
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
}

// Обработка запросов компонентов
function handleComponentsRequest(req, res, pathname, method) {
  const components = loadData('components.json');
  if (!components) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
    return;
  }

  // Извлечение ID из пути
  const pathParts = pathname.split('/').filter(part => part !== '');
  const id = pathParts[pathParts.length - 1];
  const isMetadataRequest = pathname.includes('/metadata/');

  switch (method) {
    case 'GET':
      if (isMetadataRequest) {
        // Обработка запроса метаданных компонента
        const componentId = pathParts[pathParts.length - 2]; // ID компонента перед 'metadata'
        const component = components.components.find(c => c.id === componentId);
        if (component) {
          // Создаем метаданные компонента
          const metadata = {
            component_id: component.id,
            component_name: component.name,
            component_type: component.type,
            config: component.config,
            fields: component.fields || []
          };
          res.writeHead(200);
          res.end(JSON.stringify(metadata));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Component not found' }));
        }
      } else if (id && id !== 'components') {
        // Получение конкретного компонента
        const component = components.components.find(c => c.id === id);
        if (component) {
          res.writeHead(200);
          res.end(JSON.stringify(component));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Component not found' }));
        }
      } else {
        // Получение списка компонентов
        res.writeHead(200);
        res.end(JSON.stringify(components.components));
      }
      break;

    default:
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
}

// Обработка запросов экземпляров компонентов
function handleComponentInstancesRequest(req, res, pathname, method) {
  console.log(`[ComponentInstances] Обработка запроса: ${method} ${pathname}`);
  
  const componentInstances = loadData('component-instances.json');
  if (!componentInstances) {
    console.log('[ComponentInstances] Ошибка загрузки данных component-instances.json');
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
    return;
  }

  // Извлечение ID из пути
  const pathParts = pathname.split('/').filter(part => part !== '');
  const id = pathParts[pathParts.length - 1];

  switch (method) {
    case 'GET':
      if (id && id !== 'component-instances') {
        // Получение конкретного экземпляра компонента
        const instance = componentInstances.component_instances.find(ci => ci.id === id);
        if (instance) {
          res.writeHead(200);
          res.end(JSON.stringify(instance));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Component instance not found' }));
        }
      } else {
        // Получение списка экземпляров компонентов
        res.writeHead(200);
        res.end(JSON.stringify(componentInstances.component_instances));
      }
      break;

    case 'POST':
      // Создание нового экземпляра компонента
      handleCreateComponentInstance(req, res, componentInstances);
      break;

    case 'PUT':
      // Обновление экземпляра компонента
      handleUpdateComponentInstance(req, res, id, componentInstances);
      break;

    case 'DELETE':
      // Удаление экземпляра компонента
      handleDeleteComponentInstance(req, res, id, componentInstances);
      break;

    default:
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
}

// Создание нового экземпляра компонента
function handleCreateComponentInstance(req, res, componentInstances) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const { component_id, data: componentData } = data;
      
      // Загружаем компоненты для получения полной информации
      const components = loadData('components.json');
      if (!components) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
        return;
      }
      
      const component = components.components.find(c => c.id === component_id);
      if (!component) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Component not found' }));
        return;
      }
      
      const newInstance = {
        id: `comp-${Date.now()}`,
        component_id,
        component,
        data: componentData || {},
        position: {
          x: 0,
          y: 0,
          width: 100,
          height: 100
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      componentInstances.component_instances.push(newInstance);
      
      if (saveData('component-instances.json', componentInstances)) {
        res.writeHead(201);
        res.end(JSON.stringify(newInstance));
      } else {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to save component instance' }));
      }
    } catch (error) {
      console.error('[ComponentInstances] Ошибка создания:', error);
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
  });
}

// Обновление экземпляра компонента
function handleUpdateComponentInstance(req, res, id, componentInstances) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const instanceIndex = componentInstances.component_instances.findIndex(ci => ci.id === id);
      
      if (instanceIndex === -1) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Component instance not found' }));
        return;
      }
      
      const instance = componentInstances.component_instances[instanceIndex];
      instance.data = { ...instance.data, ...data.data };
      instance.updated_at = new Date().toISOString();
      
      if (saveData('component-instances.json', componentInstances)) {
        res.writeHead(200);
        res.end(JSON.stringify(instance));
      } else {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to update component instance' }));
      }
    } catch (error) {
      console.error('[ComponentInstances] Ошибка обновления:', error);
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
  });
}

// Удаление экземпляра компонента
function handleDeleteComponentInstance(req, res, id, componentInstances) {
  const instanceIndex = componentInstances.component_instances.findIndex(ci => ci.id === id);
  
  if (instanceIndex === -1) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Component instance not found' }));
    return;
  }
  
  // Удаляем экземпляр
  componentInstances.component_instances.splice(instanceIndex, 1);
  
  if (saveData('component-instances.json', componentInstances)) {
    res.writeHead(204);
    res.end();
  } else {
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Failed to delete component instance' }));
  }
}


// Обработка запросов раскладок
function handleLayoutsRequest(req, res, pathname, method) {
  console.log(`[Layouts] Обработка запроса: ${method} ${pathname}`);
  
  const layouts = loadData('layouts.json');
  if (!layouts) {
    console.log('[Layouts] Ошибка загрузки данных layouts.json');
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
    return;
  }

  // Извлечение ID из пути
  const pathParts = pathname.split('/').filter(part => part !== '');
  const id = pathParts[pathParts.length - 1];
  console.log(`[Layouts] pathParts:`, pathParts, `id:`, id);

  switch (method) {
    case 'GET':
      if (id && id !== 'layouts') {
        // Получение конкретной раскладки
        const layout = layouts.layouts.find(l => l.id === id);
        if (layout) {
          res.writeHead(200);
          res.end(JSON.stringify(layout));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Layout not found' }));
        }
      } else {
        // Получение списка раскладок
        res.writeHead(200);
        res.end(JSON.stringify(layouts.layouts));
      }
      break;

    case 'POST':
      // Создание новой раскладки
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const newLayout = JSON.parse(body);
          newLayout.id = `layout-${Date.now()}`;
          newLayout.created_at = new Date().toISOString();
          newLayout.updated_at = new Date().toISOString();
          
          layouts.layouts.push(newLayout);
          saveData('layouts.json', layouts);
          
          res.writeHead(201);
          res.end(JSON.stringify(newLayout));
        } catch (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      break;

    case 'PUT':
      // Обновление раскладки
      if (!id || id === 'layouts') {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Layout ID required' }));
        return;
      }

      let updateBody = '';
      req.on('data', chunk => {
        updateBody += chunk.toString();
      });
      req.on('end', () => {
        try {
          const updatedLayout = JSON.parse(updateBody);
          const layoutIndex = layouts.layouts.findIndex(l => l.id === id);
          
          if (layoutIndex === -1) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Layout not found' }));
            return;
          }

          updatedLayout.id = id;
          updatedLayout.updated_at = new Date().toISOString();
          layouts.layouts[layoutIndex] = { ...layouts.layouts[layoutIndex], ...updatedLayout };
          
          saveData('layouts.json', layouts);
          
          res.writeHead(200);
          res.end(JSON.stringify(layouts.layouts[layoutIndex]));
        } catch (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      break;

    case 'DELETE':
      // Удаление раскладки
      if (!id || id === 'layouts') {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Layout ID required' }));
        return;
      }

      const deleteIndex = layouts.layouts.findIndex(l => l.id === id);
      if (deleteIndex === -1) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Layout not found' }));
        return;
      }

      layouts.layouts.splice(deleteIndex, 1);
      saveData('layouts.json', layouts);
      
      res.writeHead(204);
      res.end();
      break;

    default:
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
}

// Создание сервера
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`🚀 Mock сервер запущен на http://localhost:${PORT}`);
  console.log(`📁 Данные загружаются из: ${DATA_DIR}`);
  console.log('\nДоступные эндпоинты:');
  console.log('  GET    /api/admin/pages/metadata/     - Базовые метаданные модели страницы');
  console.log('  GET    /api/admin/pages/metadata/:id  - Метаданные для конкретной страницы');
  console.log('  GET    /api/admin/pages/              - Список страниц');
  console.log('  GET    /api/admin/pages/:id           - Конкретная страница');
  console.log('  POST   /api/admin/pages/               - Создание страницы');
  console.log('  PUT    /api/admin/pages/:id           - Обновление страницы');
  console.log('  DELETE /api/admin/pages/:id           - Удаление страницы');
  console.log('  GET    /api/admin/pages/:id/layout/   - Раскладка страницы');
  console.log('  POST   /api/admin/pages/:id/layout/   - Установка раскладки для страницы');
  console.log('  PUT    /api/admin/pages/:id/layout/    - Обновление раскладки страницы');
  console.log('  DELETE /api/admin/pages/:id/layout/   - Удаление раскладки страницы');
  console.log('  GET    /api/admin/components/          - Список компонентов');
  console.log('  GET    /api/admin/components/:id       - Конкретный компонент');
  console.log('  GET    /api/admin/components/:id/metadata/ - Метаданные компонента');
  console.log('  GET    /api/admin/component-instances/ - Список экземпляров компонентов');
  console.log('  GET    /api/admin/component-instances/:id - Конкретный экземпляр компонента');
  console.log('  POST   /api/admin/component-instances/ - Создание экземпляра компонента');
  console.log('  PUT    /api/admin/component-instances/:id - Обновление экземпляра компонента');
  console.log('  DELETE /api/admin/component-instances/:id - Удаление экземпляра компонента');
  console.log('  GET    /api/admin/layouts/             - Список раскладок');
  console.log('  GET    /api/admin/layouts/:id          - Конкретная раскладка');
  console.log('  POST   /api/admin/layouts/             - Создание раскладки');
  console.log('  PUT    /api/admin/layouts/:id          - Обновление раскладки');
  console.log('  DELETE /api/admin/layouts/:id         - Удаление раскладки');
});

// Обработка ошибок
server.on('error', (error) => {
  console.error('Ошибка сервера:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Остановка mock сервера...');
  server.close(() => {
    console.log('✅ Сервер остановлен');
    process.exit(0);
  });
});
