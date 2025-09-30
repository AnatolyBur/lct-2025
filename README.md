## Монорепозиторий LCT 2025 (Garpix)

Этот репозиторий содержит три связанных приложения:
- `backend-driven-backend` — Django-бэкенд (API, админка, шаблоны).
- `admin` — панель администратора/визуальный редактор.
- `backend-driven-frontend` — демонстрационный фронтенд на React/Vite для рендеринга страниц по данным бэкенда.

---

### Требования
- macOS/Linux/WSL
- Git
- Node.js 22+ и npm (или Yarn) — для `admin` и `backend-driven-frontend`
- Python 3.11+ и Pipenv — для `backend-driven-backend`
- Docker + Docker Compose — опционально, для быстрого запуска PostgreSQL и зависимостей

Полезные пути:
- `backend-driven-backend/backend/app/settings.py` — настройки Django.
- `backend-driven-backend/docker-compose.yml` — окружение (PostgreSQL и пр.).
