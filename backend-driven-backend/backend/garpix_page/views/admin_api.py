"""
API views для админ-панели GarpixCMS
Реализует эндпоинты для управления страницами, компонентами и раскладками
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.conf import settings
import json
from datetime import datetime

from ..models import BasePage, BaseComponent
from ..models.components.base_component import PageComponent
from ..serializers.serializer import get_serializer


def safe_isoformat(date_value):
    """
    Безопасное форматирование даты в ISO формат.
    Обрабатывает как объекты datetime, так и строки.
    """
    if date_value is None:
        return None

    if isinstance(date_value, str):
        return date_value

    if hasattr(date_value, 'isoformat'):
        return date_value.isoformat()

    return str(date_value)


def add_model_fields_to_data(data_dict, model_instance, exclude_fields=None):
    """
    Добавляет поля модели в словарь данных, исключая несериализуемые поля, включая переводы
    """
    from modeltranslation.translator import translator

    if exclude_fields is None:
        exclude_fields = set()

    # Исключаем поля, которые не могут быть сериализованы в JSON
    non_serializable_fields = {
        'id', 'polymorphic_ctype', 'lft', 'rght', 'tree_id', 'level',
        'sites', 'parent', 'seo_image', 'ptr', 'basecomponent_ptr', 'basepage_ptr'  # Django объекты и файлы
    }
    non_serializable_fields.update(exclude_fields)

    # Получаем информацию о переводах
    translation_options = translator.get_options_for_model(model_instance.__class__)
    translated_fields = []
    if translation_options:
        translated_fields = translation_options.get_field_names()

    for field in model_instance._meta.fields:
        if field.name not in data_dict and field.name not in non_serializable_fields:
            field_value = getattr(model_instance, field.name, None)
            # Проверяем, что значение можно сериализовать
            if field_value is not None:
                # Исключаем объекты Django
                if hasattr(field_value, '_meta'):  # Django модель
                    continue
                # Исключаем QuerySet'ы
                if hasattr(field_value, 'all'):
                    continue
                # Исключаем файлы
                if hasattr(field_value, 'url'):
                    continue

            data_dict[field.name] = field_value

            # Добавляем переводы для переводимых полей
            if field.name in translated_fields:
                from ..utils.get_languages import get_languages
                languages = get_languages()
                for lang in languages:
                    lang_field_name = f"{field.name}_{lang.replace('-', '_')}"
                    if hasattr(model_instance, lang_field_name):
                        lang_value = getattr(model_instance, lang_field_name, None)
                        if lang_value is not None:
                            # Проверяем, что перевод можно сериализовать
                            if hasattr(lang_value, '_meta'):  # Django модель
                                continue
                            if hasattr(lang_value, 'all'):
                                continue
                            if hasattr(lang_value, 'url'):
                                continue

                        data_dict[lang_field_name] = lang_value


def get_model_fields_metadata(model):
    """
    Получает метаданные полей модели для API
    """
    from ..utils.get_languages import get_languages
    from modeltranslation.translator import translator

    fields = []
    translated_fields = []
    languages = get_languages()

    # Исключаем служебные поля Django и технические поля
    # - id: первичный ключ
    # - polymorphic_ctype: поле для полиморфных моделей
    # - lft, rght, tree_id, level: поля для MPTT (Modified Preorder Tree Traversal)
    # - sites: связь с сайтами (управляется системой)
    # - parent: родительская страница (управляется системой)
    # - basepage_ptr: указатель на базовую страницу (техническое поле)
    # - ptr: указатель для полиморфных компонентов (техническое поле)
    # - url: полный URL страницы (формируется автоматически)
    # - created_at, updated_at: исключены из формы редактирования, отображаются только в информационной секции

    # Получаем список всех полей модели для проверки существования
    model_fields = {field.name for field in model._meta.fields}

    # Базовые поля для исключения
    potential_exclude_fields = {
        'id', 'polymorphic_ctype', 'lft', 'rght', 'tree_id', 'level',
        'sites', 'basepage_ptr', 'ptr', 'basecomponent_ptr', 'url',
        'created_at', 'updated_at', 'draft_data', 'form_config'  # Исключаем поля дат, черновиков и JSON конфигурацию из формы редактирования
    }

    # Исключаем только те поля, которые действительно существуют в модели
    exclude_fields = {field for field in potential_exclude_fields if field in model_fields}

    # Получаем информацию о переводах для модели
    translation_options = translator.get_options_for_model(model)
    if translation_options:
        translated_fields = translation_options.get_field_names()

    # Создаем список полей переводов для исключения
    translated_field_variants = set()
    if translated_fields:
        for base_field in translated_fields:
            for lang in languages:
                translated_field_variants.add(f"{base_field}_{lang.replace('-', '_')}")

    for field in model._meta.fields:
        if field.name in exclude_fields:
            continue

        # Исключаем поля переводов (например, title_en, title_de)
        if field.name in translated_field_variants:
            continue

        field_info = {
            "name": field.name,
            "type": field.__class__.__name__,
            "required": not field.null and not field.blank,
            "help_text": str(getattr(field, 'help_text', '') or field.verbose_name),
            "verbose_name": str(field.verbose_name),
            "is_translated": field.name in translated_fields
        }

        # Добавляем специфичные атрибуты для разных типов полей
        if hasattr(field, 'max_length') and field.max_length:
            field_info["max_length"] = field.max_length

        if hasattr(field, 'default') and field.default is not None:
            # Проверяем, что default не является callable (функцией)
            if callable(field.default):
                field_info["default_value"] = None  # Не сериализуем функции
            else:
                field_info["default_value"] = field.default

        if hasattr(field, 'choices') and field.choices:
            field_info["choices"] = [{"value": choice[0], "label": choice[1]} for choice in field.choices]

        # Добавляем информацию о том, является ли поле уникальным
        if hasattr(field, 'unique') and field.unique:
            field_info["unique"] = True

        # Добавляем информацию о том, может ли поле быть пустым
        if hasattr(field, 'blank'):
            field_info["blank"] = field.blank

        fields.append(field_info)

    return fields


def get_translation_info(model):
    """
    Получает информацию о переводах для модели
    """
    from ..utils.get_languages import get_languages
    from modeltranslation.translator import translator

    languages = get_languages()
    translation_options = translator.get_options_for_model(model)

    if not translation_options:
        return {
            "has_translations": False,
            "languages": [],
            "translated_fields": []
        }

    translated_fields = translation_options.get_field_names()

    return {
        "has_translations": len(translated_fields) > 0,
        "languages": [{"code": lang, "name": dict(settings.LANGUAGES).get(lang, lang)} for lang in languages],
        "translated_fields": translated_fields
    }


@api_view(['GET'])
# @permission_classes([IsAuthenticated])  # TODO: Включить авторизацию после тестирования
def component_types(request):
    """
    GET /api/components/types/ - Получить список доступных типов компонентов (зарегистрированных моделей)
    """
    from ..utils.get_garpix_page_models import get_garpix_page_component_models

    component_models = get_garpix_page_component_models()

    types = []
    for model in component_models:
        fields = get_model_fields_metadata(model)
        types.append({
            'model_name': model.__name__,
            'app_label': model._meta.app_label,
            'verbose_name': str(model._meta.verbose_name),
            'fields': fields
        })

    return Response({'component_types': types})


@api_view(['GET'])
# @permission_classes([IsAuthenticated])  # TODO: Включить авторизацию после тестирования
def components_metadata(request):
    """
    GET /api/components/metadata/ - Получить список метаданных доступных типов компонентов
    """
    from ..utils.get_garpix_page_models import get_garpix_page_component_models

    component_models = get_garpix_page_component_models()
    print(component_models)

    results = []
    for model in component_models:
        fields = get_model_fields_metadata(model)
        results.append({
            'model_name': model.__name__,
            'app_label': model._meta.app_label,
            'verbose_name': str(model._meta.verbose_name),
            'fields': fields
        })

    return Response({'components_metadata': results})


@api_view(['GET', 'POST'])
# @permission_classes([IsAuthenticated])  # TODO: Включить авторизацию после тестирования
def pages_list_create(request):
    """
    GET /api/pages/ - Получить список страниц
    POST /api/pages/ - Создать новую страницу
    """
    if request.method == 'GET':
        pages = BasePage.objects.all().order_by('-created_at')

        # Поиск по названию
        search_query = request.GET.get('q')
        if search_query:
            pages = pages.filter(title__icontains=search_query)

        # Исключение страницы по id (чтобы нельзя было выбрать себя как parent)
        exclude_id = request.GET.get('exclude')
        if exclude_id:
            try:
                pages = pages.exclude(id=int(exclude_id))
            except ValueError:
                pass

        # Обрабатываем каждую страницу с учетом её полиморфного типа
        pages_data = []
        for page in pages:
            # Получаем реальный тип страницы
            real_page = page.get_real_instance()
            serializer_class = get_serializer(real_page.__class__)
            serializer = serializer_class(real_page, context={'request': request})

            page_data = serializer.data.copy()

            # Добавляем специфичные поля для разных типов страниц
            page_data.update({
                'page_type': real_page.__class__.__name__,  # Тип страницы
                'is_published': page_data.get('is_active', False),
                'meta_title': page_data.get('seo_title', ''),
                'meta_description': page_data.get('seo_description', ''),
                'meta_keywords': page_data.get('seo_keywords', ''),
                'template': getattr(real_page, 'template', 'default'),
            })

            # Добавляем все специфичные поля модели динамически
            add_model_fields_to_data(page_data, real_page)

            pages_data.append(page_data)

        return Response(pages_data)

    elif request.method == 'POST':
        try:
            data = request.data.copy()
            data['created_at'] = safe_isoformat(timezone.now())
            data['updated_at'] = safe_isoformat(timezone.now())

            # Определяем тип страницы для создания
            page_type = data.get('page_type', 'Page')  # По умолчанию создаем Page

            # Маппинг полей из API в поля модели
            if 'is_published' in data:
                data['is_active'] = data.pop('is_published')
            if 'meta_title' in data:
                data['seo_title'] = data.pop('meta_title')
            if 'meta_description' in data:
                data['seo_description'] = data.pop('meta_description')
            if 'meta_keywords' in data:
                data['seo_keywords'] = data.pop('meta_keywords')

            # Получаем модель для создания страницы
            from ..utils.get_garpix_page_models import get_garpix_page_models
            page_models = get_garpix_page_models()

            # Находим нужную модель по типу
            target_model = BasePage
            for model in page_models:
                if model.__name__ == page_type:
                    target_model = model
                    break

            # Используем сериализатор для конкретного типа страницы
            serializer_class = get_serializer(target_model)
            serializer = serializer_class(data=data, context={'request': request})

            if serializer.is_valid():
                page = serializer.save()

                # Если поле sites не передано, добавляем первый сайт
                if 'sites' not in data or not data.get('sites'):
                    from django.contrib.sites.models import Site
                    first_site = Site.objects.first()
                    if first_site:
                        page.sites.add(first_site)

                # Получаем реальный экземпляр для ответа
                real_page = page.get_real_instance()
                response_serializer_class = get_serializer(real_page.__class__)
                response_serializer = response_serializer_class(real_page, context={'request': request})

                response_data = response_serializer.data
                response_data.update({
                    'page_type': real_page.__class__.__name__,
                    'is_published': response_data.get('is_active', False),
                    'meta_title': response_data.get('seo_title', ''),
                    'meta_description': response_data.get('seo_description', ''),
                    'meta_keywords': response_data.get('seo_keywords', ''),
                    'template': getattr(real_page, 'template', 'default'),
                })

                # Добавляем все специфичные поля модели динамически
                add_model_fields_to_data(response_data, real_page)

                return Response(response_data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
# @permission_classes([IsAuthenticated])  # TODO: Включить авторизацию после тестирования
def page_detail(request, page_id):
    """
    GET /api/pages/{id}/ - Получить конкретную страницу
    PUT /api/pages/{id}/ - Обновить страницу (полная замена)
    PATCH /api/pages/{id}/ - Частично обновить страницу
    DELETE /api/pages/{id}/ - Удалить страницу
    """
    try:
        page = get_object_or_404(BasePage, id=page_id)
        # Получаем реальный тип страницы
        real_page = page.get_real_instance()
    except BasePage.DoesNotExist:
        return Response({'error': 'Page not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        # Используем сериализатор для реального типа страницы
        serializer_class = get_serializer(real_page.__class__)
        serializer = serializer_class(real_page, context={'request': request})

        page_data = serializer.data.copy()

        # Добавляем информацию о типе страницы и стандартные поля
        page_data.update({
            'page_type': real_page.__class__.__name__,
            'is_published': page_data.get('is_active', False),
            'meta_title': page_data.get('seo_title', ''),
            'meta_description': page_data.get('seo_description', ''),
            'meta_keywords': page_data.get('seo_keywords', ''),
            'template': getattr(real_page, 'template', 'default'),
        })

        # Добавляем все специфичные поля модели динамически
        add_model_fields_to_data(page_data, real_page)

        return Response(page_data)

    elif request.method in ['PUT', 'PATCH']:
        try:
            data = request.data.copy()
            data['updated_at'] = safe_isoformat(timezone.now())

            # Маппинг полей из API в поля модели
            if 'is_published' in data:
                data['is_active'] = data.pop('is_published')
            if 'meta_title' in data:
                data['seo_title'] = data.pop('meta_title')
            if 'meta_description' in data:
                data['seo_description'] = data.pop('meta_description')
            if 'meta_keywords' in data:
                data['seo_keywords'] = data.pop('meta_keywords')

            # Используем сериализатор для реального типа страницы
            serializer_class = get_serializer(real_page.__class__)

            # Для PATCH используем partial=True для частичного обновления
            partial = request.method == 'PATCH'
            serializer = serializer_class(real_page, data=data, partial=partial, context={'request': request})

            if serializer.is_valid():
                updated_page = serializer.save()

                # Дополнительно применяем поля, которые сериализатор мог проигнорировать (SEO, переводы и пр.)
                try:
                    from modeltranslation.translator import translator as _translator
                    from ..utils.get_languages import get_languages as _get_languages
                    model_fields = {f.name for f in updated_page._meta.get_fields()}
                    # Собираем переводные варианты полей
                    translated_variants = set()
                    try:
                        tr_opts = _translator.get_options_for_model(updated_page.__class__)
                        base_translated = tr_opts.get_field_names() if tr_opts else []
                        for base in base_translated:
                            for lang in _get_languages():
                                translated_variants.add(f"{base}_{lang.replace('-', '_')}")
                    except Exception:
                        pass

                    # Поля, которые можно обновлять напрямую
                    updatable = set(model_fields) | translated_variants | {
                        'seo_title', 'seo_description', 'seo_keywords', 'seo_author', 'seo_og_type'
                    }

                    # Обработка parent и sites отдельно
                    if 'parent' in data:
                        try:
                            parent_id = data.get('parent')
                            if parent_id is None:
                                setattr(updated_page, 'parent', None)
                            else:
                                from django.contrib.contenttypes.models import ContentType
                                # parent — FK на BasePage
                                parent_obj = BasePage.objects.get(id=parent_id)
                                setattr(updated_page, 'parent', parent_obj)
                        except Exception:
                            pass

                    # Применяем простые поля
                    for field_name, field_value in data.items():
                        if field_name in {'id', 'pk', 'created_at', 'updated_at', 'layout', 'draft_data'}:
                            continue
                        if field_name in {'sites', 'parent'}:
                            continue  # обработаны отдельно
                        if field_name in updatable and hasattr(updated_page, field_name):
                            try:
                                setattr(updated_page, field_name, field_value)
                            except Exception:
                                pass

                    # Обновляем сайты, если переданы
                    if 'sites' in data:
                        try:
                            from django.contrib.sites.models import Site
                            site_ids = data.get('sites') or []
                            if isinstance(site_ids, list):
                                updated_page.sites.set(Site.objects.filter(id__in=site_ids))
                        except Exception:
                            pass

                    updated_page.save()
                except Exception:
                    # Не падаем, если ручное применение не удалось
                    pass

                # Если поле sites не передано, добавляем первый сайт
                if 'sites' not in data or not data.get('sites'):
                    from django.contrib.sites.models import Site
                    first_site = Site.objects.first()
                    if first_site and not updated_page.sites.exists():
                        updated_page.sites.add(first_site)

                # Получаем обновленный реальный экземпляр для ответа
                updated_real_page = updated_page.get_real_instance()
                response_serializer_class = get_serializer(updated_real_page.__class__)
                response_serializer = response_serializer_class(updated_real_page, context={'request': request})

                response_data = response_serializer.data
                response_data.update({
                    'page_type': updated_real_page.__class__.__name__,
                    'is_published': response_data.get('is_active', False),
                    'meta_title': response_data.get('seo_title', ''),
                    'meta_description': response_data.get('seo_description', ''),
                    'meta_keywords': response_data.get('seo_keywords', ''),
                    'template': getattr(updated_real_page, 'template', 'default'),
                })

                # Добавляем все специфичные поля модели динамически
                add_model_fields_to_data(response_data, updated_real_page)

                return Response(response_data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        try:
            page.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST', 'GET'])
def page_draft(request, page_id):
    """
    GET /api/pages/{id}/draft/ — получить черновик страницы (если есть)
    POST /api/pages/{id}/draft/ — создать или обновить черновик страницы в JSON
    """
    page = get_object_or_404(BasePage, id=page_id)
    real_page = page.get_real_instance()

    if request.method == 'GET':
        if not real_page.draft_data:
            return Response({'detail': 'Draft not found'}, status=status.HTTP_404_NOT_FOUND)

        # Возвращаем данные черновика, подменяя оригинальные данные
        serializer_class = get_serializer(real_page.__class__)
        data = serializer_class(real_page, context={'request': request}).data

        # Подменяем данные страницы данными из черновика
        if 'page_data' in real_page.draft_data:
            data.update(real_page.draft_data['page_data'])

        # Подменяем компоненты данными из черновика
        if 'components' in real_page.draft_data:
            data['components'] = real_page.draft_data['components']

        data.update({'is_draft': True, 'has_draft': True})
        return Response(data)

    # POST - создание или обновление черновика
    if request.method == 'POST':
        # Получаем данные страницы и компонентов из запроса
        page_data = request.data.get('page_data', {})
        components_data = request.data.get('components', [])

        # Сохраняем черновик в JSON поле
        draft_data = {
            'page_data': page_data,
            'components': components_data,
            'created_at': timezone.now().isoformat(),
            'updated_at': timezone.now().isoformat()
        }

        real_page.draft_data = draft_data
        real_page.save()

        # Возвращаем данные с подменой черновика
        serializer_class = get_serializer(real_page.__class__)
        data = serializer_class(real_page, context={'request': request}).data

        # Подменяем данные страницы
        if page_data:
            data.update(page_data)

        # Подменяем компоненты
        if components_data:
            data['components'] = components_data

        data.update({'is_draft': True, 'has_draft': True})
        return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
def page_publish(request, page_id):
    """
    POST /api/pages/{id}/publish/ — опубликовать черновик для страницы {id}
    Применяет данные из draft_data к оригинальной странице
    """
    from ..utils.get_garpix_page_models import get_garpix_page_component_models

    page = get_object_or_404(BasePage, id=page_id)
    real_page = page.get_real_instance()

    if not real_page.draft_data:
        return Response({'detail': 'Draft not found'}, status=status.HTTP_404_NOT_FOUND)

    with transaction.atomic():
        # Применяем данные страницы из черновика
        if 'page_data' in real_page.draft_data:
            page_data = real_page.draft_data['page_data']
            exclude_fields = {'id', 'pk', 'created_at', 'updated_at', 'draft_data'}

            for field_name, value in page_data.items():
                if field_name in exclude_fields:
                    continue
                if hasattr(real_page, field_name):
                    try:
                        setattr(real_page, field_name, value)
                    except Exception:
                        pass

        # Применяем компоненты из черновика
        if 'components' in real_page.draft_data:
            components_data = real_page.draft_data['components']

            # Удаляем все существующие компоненты страницы
            PageComponent.objects.filter(page=real_page).delete()

            # Создаем новые компоненты из черновика
            for component_data in components_data:
                try:
                    # Получаем или создаем компонент
                    component_id = component_data.get('id')
                    if component_id:
                        # Обновляем существующий компонент
                        component = BaseComponent.objects.get(id=component_id)
                        exclude_comp_fields = {'id', 'pk', 'created_at', 'updated_at'}

                        for field_name, value in component_data.items():
                            if field_name in exclude_comp_fields:
                                continue
                            if hasattr(component, field_name):
                                try:
                                    setattr(component, field_name, value)
                                except Exception:
                                    pass
                        component.save()
                    else:
                        # Создаем новый компонент
                        component_type = component_data.get('component_type', 'BaseComponent')
                        component_class = BaseComponent

                        # Ищем конкретный класс компонента
                        for model_class in get_garpix_page_component_models():
                            if model_class.__name__ == component_type:
                                component_class = model_class
                                break

                        # Создаем компонент
                        component = component_class()
                        exclude_comp_fields = {'id', 'pk', 'created_at', 'updated_at', 'component_type'}

                        for field_name, value in component_data.items():
                            if field_name in exclude_comp_fields:
                                continue
                            if hasattr(component, field_name):
                                try:
                                    setattr(component, field_name, value)
                                except Exception:
                                    pass
                        component.save()

                    # Создаем связь PageComponent
                    view_order = component_data.get('view_order', 1)
                    PageComponent.objects.create(
                        page=real_page,
                        component=component,
                        view_order=view_order
                    )

                except Exception as e:
                    # Логируем ошибку, но продолжаем обработку
                    print(f"Error processing component: {e}")
                    continue

        # Очищаем черновик после публикации
        real_page.draft_data = None
        real_page.save()

        serializer_class = get_serializer(real_page.__class__)
        data = serializer_class(real_page, context={'request': request}).data
        data.update({'is_published': True, 'has_draft': False})
        return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
# @permission_classes([IsAuthenticated])  # TODO: Включить авторизацию после тестирования
def pages_metadata(request, page_id=None):
    """
    GET /api/pages/metadata/ - Получить базовые метаданные модели страницы
    GET /api/pages/metadata/{id}/ - Получить метаданные для конкретной страницы
    """
    if page_id:
        try:
            page = get_object_or_404(BasePage, id=page_id)
            # Получаем реальный тип страницы
            real_page = page.get_real_instance()
        except BasePage.DoesNotExist:
            return Response({'error': 'Page not found'}, status=status.HTTP_404_NOT_FOUND)

        # Получаем поля модели динамически
        fields = get_model_fields_metadata(real_page.__class__)

        # Получаем информацию о переводах
        translation_info = get_translation_info(real_page.__class__)

        metadata = {
            "metadata": {
                "model_name": real_page.__class__.__name__,
                "app_label": real_page._meta.app_label,
                "page_id": page.id,
                "page_type": real_page.__class__.__name__,
                "fields": fields,
                "translation": translation_info
            }
        }

        return Response(metadata)

    else:
        # Получаем список всех доступных типов страниц
        from ..utils.get_garpix_page_models import get_garpix_page_models
        page_models = get_garpix_page_models()

        # Создаем метаданные для каждого типа страницы
        page_types = []
        for model in page_models:
            fields = get_model_fields_metadata(model)
            translation_info = get_translation_info(model)
            page_types.append({
                "model_name": model.__name__,
                "app_label": model._meta.app_label,
                "verbose_name": model._meta.verbose_name,
                "fields": fields,
                "translation": translation_info
            })

        metadata = {
            "metadata": {
                "available_page_types": page_types,
                "default_model": "Page"
            }
        }

        return Response(metadata)


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
# @permission_classes([IsAuthenticated])  # TODO: Включить авторизацию после тестирования
def page_layout(request, page_id):
    """
    GET /api/pages/{id}/layout/ - Получить раскладку страницы
    POST /api/pages/{id}/layout/ - Установить раскладку для страницы
    PUT /api/pages/{id}/layout/ - Обновить раскладку страницы
    DELETE /api/pages/{id}/layout/ - Удалить раскладку страницы
    """
    try:
        page = get_object_or_404(BasePage, id=page_id)
    except BasePage.DoesNotExist:
        return Response({'error': 'Page not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        # Получаем компоненты страницы как раскладку
        components = page.pagecomponent_set.select_related('component').all().order_by('view_order')
        layout_data = {
            'page_id': page_id,
            'layout_id': f'layout-{page_id}',
            'layout': {
                'components': []
            },
            'custom_zones': [],
            'created_at': safe_isoformat(page.created_at),
            'updated_at': safe_isoformat(page.updated_at)
        }

        for component in components:
            # Пропускаем осиротевшие связи или удалённые компоненты
            if component.component is None or getattr(component.component, 'is_deleted', False):
                continue
            # Получаем реальный тип компонента
            real_component = component.component.get_real_instance()
            layout_data['layout']['components'].append({
                'id': component.component.id,
                'type': real_component.__class__.__name__,
                'title': component.component.title,
                'view_order': component.view_order,
                'data': component.component.get_api_context_data(request)
            })

        return Response(layout_data)

    elif request.method in ['POST', 'PUT']:
        try:
            layout_data = request.data

            # Обновляем компоненты страницы
            if 'layout' in layout_data and 'components' in layout_data['layout']:
                with transaction.atomic():
                    # Удаляем существующие компоненты
                    page.pagecomponent_set.all().delete()

                    # Добавляем новые компоненты
                    for idx, comp_data in enumerate(layout_data['layout']['components']):
                        if 'id' in comp_data:
                            try:
                                component = BaseComponent.objects.get(id=comp_data['id'])
                                PageComponent.objects.create(
                                    page=page,
                                    component=component,
                                    view_order=comp_data.get('view_order', idx + 1)
                                )
                            except BaseComponent.DoesNotExist:
                                continue

            # Обновляем время изменения страницы
            page.updated_at = timezone.now()
            page.save()

            # Возвращаем обновленную раскладку
            return page_layout(request, page_id)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        try:
            # Удаляем все компоненты страницы
            page.pagecomponent_set.all().delete()
            page.updated_at = timezone.now()
            page.save()

            return Response(status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
# @permission_classes([IsAuthenticated])  # TODO: Включить авторизацию после тестирования
def components_list(request):
    """
    GET /api/components/ - Получить список компонентов
    POST /api/components/ - Создать новый компонент
    """
    if request.method == 'GET':
        components = BaseComponent.objects.filter(is_deleted=False).order_by('-created_at')

        # Обрабатываем каждый компонент с учетом его полиморфного типа
        components_data = []
        for component in components:
            # Получаем реальный тип компонента
            real_component = component.get_real_instance()
            serializer_class = get_serializer(real_component.__class__)
            serializer = serializer_class(real_component, context={'request': request})

            comp_data = serializer.data.copy()

            # Добавляем информацию о типе компонента
            comp_data.update({
                'name': comp_data.get('title', ''),
                'type': real_component.__class__.__name__.lower().replace('component', ''),
                'component_type': real_component.__class__.__name__,
                'template': getattr(real_component, 'template', 'default'),
                'config': {
                    'editable': True,
                    'template': getattr(real_component, 'template', 'default'),
                    'is_active': comp_data.get('is_active', True)
                },
                'fields': get_model_fields_metadata(real_component.__class__)
            })

            components_data.append(comp_data)

        return Response(components_data)

    elif request.method == 'POST':
        try:
            data = request.data.copy()
            data['created_at'] = safe_isoformat(timezone.now())
            data['updated_at'] = safe_isoformat(timezone.now())

            # Определяем тип компонента для создания
            component_type = data.get('component_type', 'TextComponent')  # По умолчанию создаем TextComponent

            # Получаем модель для создания компонента
            from ..utils.get_garpix_page_models import get_garpix_page_models
            component_models = get_garpix_page_models()

            # Находим нужную модель по типу
            target_model = BaseComponent
            for model in component_models:
                if model.__name__ == component_type:
                    target_model = model
                    break

            # Используем сериализатор для конкретного типа компонента
            serializer_class = get_serializer(target_model)
            serializer = serializer_class(data=data, context={'request': request})

            if serializer.is_valid():
                component = serializer.save()

                # Если передан page_id, связываем компонент со страницей через PageComponent
                page_id = data.get('page_id')
                if page_id:
                    try:
                        page = get_object_or_404(BasePage, id=page_id)
                        view_order = data.get('view_order', 1)
                        PageComponent.objects.create(
                            page=page,
                            component=component,
                            view_order=view_order
                        )
                    except BasePage.DoesNotExist:
                        return Response({'error': 'Page not found'}, status=status.HTTP_404_NOT_FOUND)

                # Получаем реальный тип компонента
                real_component = component.get_real_instance()

                # Формируем ответ в том же формате, что и для GET запроса
                comp_data = serializer.data.copy()
                comp_data.update({
                    'name': comp_data.get('title', ''),
                    'type': real_component.__class__.__name__.lower().replace('component', ''),
                    'component_type': real_component.__class__.__name__,
                    'template': getattr(real_component, 'template', 'default'),
                    'config': {
                        'editable': True,
                        'template': getattr(real_component, 'template', 'default'),
                        'is_active': comp_data.get('is_active', True)
                    },
                    'fields': get_model_fields_metadata(real_component.__class__)
                })

                return Response(comp_data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
# @permission_classes([IsAuthenticated])  # TODO: Включить авторизацию после тестирования
def component_detail(request, component_id):
    """
    GET /api/components/{id}/ - Получить конкретный компонент
    """
    try:
        component = get_object_or_404(BaseComponent, id=component_id, is_deleted=False)
        # Получаем реальный тип компонента
        real_component = component.get_real_instance()
    except BaseComponent.DoesNotExist:
        return Response({'error': 'Component not found'}, status=status.HTTP_404_NOT_FOUND)

    # Используем сериализатор для реального типа компонента
    serializer_class = get_serializer(real_component.__class__)
    serializer = serializer_class(real_component, context={'request': request})

    comp_data = serializer.data.copy()

    # Добавляем информацию о типе компонента
    comp_data.update({
        'component_type': real_component.__class__.__name__,
        'template': getattr(real_component, 'template', 'default'),
        'fields': get_model_fields_metadata(real_component.__class__)
    })

    return Response(comp_data)


@api_view(['GET'])
# @permission_classes([IsAuthenticated])  # TODO: Включить авторизацию после тестирования
def component_metadata(request, component_id):
    """
    GET /api/components/{id}/metadata/ - Получить метаданные компонента
    """
    try:
        component = get_object_or_404(BaseComponent, id=component_id, is_deleted=False)
        # Получаем реальный тип компонента
        real_component = component.get_real_instance()
    except BaseComponent.DoesNotExist:
        return Response({'error': 'Component not found'}, status=status.HTTP_404_NOT_FOUND)

    # Получаем поля модели динамически
    fields = get_model_fields_metadata(real_component.__class__)

    metadata = {
        'component_id': component.id,
        'component_name': component.title,
        'component_type': real_component.__class__.__name__,
        'app_label': real_component._meta.app_label,
        'config': {
            'template': getattr(real_component, 'template', 'default'),
            'html_id': component.html_id,
            'is_active': component.is_active
        },
        'fields': fields
    }

    return Response(metadata)


@api_view(['GET', 'POST'])
# @permission_classes([IsAuthenticated])  # TODO: Включить авторизацию после тестирования
def component_instances_list_create(request):
    """
    GET /api/component-instances/ - Получить список экземпляров компонентов
    GET /api/component-instances/?page={page_id} - Получить экземпляры компонентов конкретной страницы
    POST /api/component-instances/ - Создать новый экземпляр компонента
    """
    if request.method == 'GET':
        # Проверяем, передан ли параметр page
        page_id = request.GET.get('page')

        if page_id:
            # Если передан page_id, получаем экземпляры компонентов конкретной страницы
            try:
                page = get_object_or_404(BasePage, id=page_id)
                # Получаем компоненты страницы через связующую таблицу PageComponent
                page_components = PageComponent.objects.filter(page=page).select_related('component').order_by('view_order')

                instances = []
                for pc in page_components:
                    if pc.component is None or getattr(pc.component, 'is_deleted', False):
                        continue

                    instance = {
                        'id': pc.component.id,
                        'component_id': pc.component.id,
                        'component': {
                            'id': pc.component.id,
                            'title': pc.component.title,
                            'type': real_component.__class__.__name__,
                            'config': {
                                'template': pc.component.template,
                                'html_id': pc.component.html_id,
                                'is_active': pc.component.is_active
                            }
                        },
                        'data': pc.component.get_api_context_data(request),
                        'page_id': pc.page.id,
                        'view_order': pc.view_order,
                        'created_at': safe_isoformat(pc.component.created_at),
                        'updated_at': safe_isoformat(pc.component.updated_at)
                    }
                    instances.append(instance)

                return Response(instances)

            except BasePage.DoesNotExist:
                return Response({'error': 'Page not found'}, status=status.HTTP_404_NOT_FOUND)

        else:
            # Если page_id не передан, возвращаем все экземпляры компонентов (оригинальное поведение)
            # Получаем все связи страниц с компонентами как экземпляры
            page_components = PageComponent.objects.select_related('component', 'page').order_by('-component__created_at')

            instances = []
            for pc in page_components:
                if pc.component is None or getattr(pc.component, 'is_deleted', False):
                    continue

                instance = {
                    'id': pc.component.id,
                    'component_id': pc.component.id,
                    'component': {
                        'id': pc.component.id,
                        'title': pc.component.title,
                        'type': real_component.__class__.__name__,
                        'config': {
                            'template': pc.component.template,
                            'html_id': pc.component.html_id,
                            'is_active': pc.component.is_active
                        }
                    },
                    'data': pc.component.get_api_context_data(request),
                    'page_id': pc.page.id,
                    'view_order': pc.view_order,
                    'created_at': safe_isoformat(pc.component.created_at),
                    'updated_at': safe_isoformat(pc.component.updated_at)
                }
                instances.append(instance)

            return Response(instances)

    elif request.method == 'POST':
        try:
            data = request.data
            component_id = data.get('component_id')
            copy_flag = data.get('copy', True)

            if not component_id:
                return Response({'error': 'component_id is required'}, status=status.HTTP_400_BAD_REQUEST)

            # Получаем реальный (дочерний) класс компонента
            component = get_object_or_404(BaseComponent, id=component_id, is_deleted=False)
            real_component = component.get_real_instance()
            if real_component is None:
                return Response({'error': 'Component has no real instance'}, status=status.HTTP_400_BAD_REQUEST)

            # Определяем, какой объект использовать: клон или исходный
            target_component = None
            if copy_flag in [True, 'true', 'True', '1', 1]:
                # Клонируем объект с сохранением дочернего типа
                existing_count = real_component.__class__.objects.filter(title__icontains=real_component.title).count()
                new_title = f"{real_component.title} ({existing_count})" if existing_count > 0 else real_component.title
                target_component = real_component.clone_object(title=new_title)
                # Убираем привязки страниц у клона (если скопировались)
                try:
                    target_component.pages.set([])
                except Exception:
                    pass
            else:
                # Используем исходный компонент без копирования
                target_component = real_component

            # Если указана страница, связываем компонент со страницей
            page_id = data.get('page_id')
            if page_id:
                page = get_object_or_404(BasePage, id=page_id)
                view_order = data.get('view_order', 1)
                # Создаем связь страницы с компонентом
                PageComponent.objects.get_or_create(
                    page=page,
                    component=target_component,
                    defaults={'view_order': view_order}
                )

            instance = {
                'id': target_component.id,
                'component_id': target_component.id,
                'component': {
                    'id': target_component.id,
                    'title': target_component.title,
                    'type': real_component.__class__.__name__,
                    'config': {
                        'template': getattr(target_component, 'template', None),
                        'html_id': getattr(target_component, 'html_id', ''),
                        'is_active': getattr(target_component, 'is_active', True)
                    }
                },
                'data': target_component.get_api_context_data(request),
                'position': {
                    'x': 0,
                    'y': 0,
                    'width': 100,
                    'height': 100
                },
                'created_at': safe_isoformat(target_component.created_at),
                'updated_at': safe_isoformat(target_component.updated_at)
            }

            return Response(instance, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
# @permission_classes([IsAuthenticated])  # TODO: Включить авторизацию после тестирования
def component_instance_detail(request, component_id):
    """
    GET /api/component-instances/{id}/ - Получить конкретный экземпляр компонента
    PATCH /api/component-instances/{id}/ - Обновить экземпляр компонента
    DELETE /api/component-instances/{id}/ - Удалить экземпляр компонента
    """

    try:
        component = get_object_or_404(BaseComponent, id=component_id, is_deleted=False)
    except BaseComponent.DoesNotExist:
        return Response({'error': 'Component instance not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        # Получаем реальный тип компонента
        real_component = component.get_real_instance()
        
        instance = {
            'id': component.id,
            'component_id': component.id,
            'component': {
                'id': component.id,
                'title': component.title,
                'type': real_component.__class__.__name__,
                'config': {
                    'template': component.template,
                    'html_id': component.html_id,
                    'is_active': component.is_active
                }
            },
            'data': component.get_api_context_data(request),
            'created_at': safe_isoformat(component.created_at),
            'updated_at': safe_isoformat(component.updated_at)
        }

        return Response(instance)

    elif request.method == 'PATCH':
        try:
            data = request.data

            # Динамическое обновление полей компонента
            if 'data' in data:
                component_data = data['data']

                # Получаем все поля модели компонента
                model_fields = [field.name for field in component._meta.fields]

                # Обновляем только те поля, которые есть в модели и переданы в запросе
                for field_name, field_value in component_data.items():
                    if field_name in model_fields and hasattr(component, field_name):
                        setattr(component, field_name, field_value)

                component.save()

            instance = {
                'id': component.id,
                'component_id': component.id,
                'component': {
                    'id': component.id,
                    'title': component.title,
                    'type': real_component.__class__.__name__,
                    'config': {
                        'template': component.template,
                        'html_id': component.html_id,
                        'is_active': component.is_active
                    }
                },
                'data': component.get_api_context_data(request),
                'created_at': safe_isoformat(component.created_at),
                'updated_at': safe_isoformat(component.updated_at)
            }

            return Response(instance)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        try:
            # Мягкое удаление компонента
            component.is_deleted = True
            component.save()

            return Response(status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
# @permission_classes([IsAuthenticated])  # TODO: Включить авторизацию после тестирования
def layouts_list_create(request):
    """
    GET /api/layouts/ - Получить список раскладок
    POST /api/layouts/ - Создать новую раскладку
    """
    if request.method == 'GET':
        # Возвращаем раскладки из БД. Описание и конфигурация зон определяется по коду (field code)
        from app.models.layout import Layout as DbLayout

        def layout_meta_by_code(code: str, name: str):
            code_map = {
                'single-column': {
                    'name': name or 'Одноколоночная раскладка',
                    'description': 'Простая раскладка: одна колонка для основного контента',
                    'zones': [
                        {
                            'id': 'main-content',
                            'name': 'main',
                            'title': 'Основной контент',
                            'type': 'column',
                            'width': 100,
                            'height': None,
                            'grid_template': None,
                            'components': []
                        }
                    ]
                },
                'two-column': {
                    'name': name or 'Двухколоночная раскладка',
                    'description': 'Основная колонка + сайдбар',
                    'zones': [
                        {
                            'id': 'main-content',
                            'name': 'main',
                            'title': 'Основной контент',
                            'type': 'column',
                            'width': 70,
                            'height': None,
                            'grid_template': None,
                            'components': []
                        },
                        {
                            'id': 'sidebar',
                            'name': 'sidebar',
                            'title': 'Боковая панель',
                            'type': 'column',
                            'width': 30,
                            'height': None,
                            'grid_template': None,
                            'components': []
                        }
                    ]
                },
                'three-column': {
                    'name': name or 'Трёхколоночная раскладка',
                    'description': 'Три равные колонки',
                    'zones': [
                        {'id': 'col-1', 'name': 'col1', 'title': 'Колонка 1', 'type': 'column', 'width': 33, 'height': None, 'grid_template': None, 'components': []},
                        {'id': 'col-2', 'name': 'col2', 'title': 'Колонка 2', 'type': 'column', 'width': 34, 'height': None, 'grid_template': None, 'components': []},
                        {'id': 'col-3', 'name': 'col3', 'title': 'Колонка 3', 'type': 'column', 'width': 33, 'height': None, 'grid_template': None, 'components': []},
                    ]
                },
                'grid-2x2': {
                    'name': name or 'Сетка 2×2',
                    'description': 'Сетка 2 на 2 секции',
                    'zones': [
                        {'id': 'cell-1', 'name': 'cell1', 'title': 'Ячейка 1', 'type': 'grid', 'width': None, 'height': None, 'grid_template': '1 / 1 / 2 / 2', 'components': []},
                        {'id': 'cell-2', 'name': 'cell2', 'title': 'Ячейка 2', 'type': 'grid', 'width': None, 'height': None, 'grid_template': '1 / 2 / 2 / 3', 'components': []},
                        {'id': 'cell-3', 'name': 'cell3', 'title': 'Ячейка 3', 'type': 'grid', 'width': None, 'height': None, 'grid_template': '2 / 1 / 3 / 2', 'components': []},
                        {'id': 'cell-4', 'name': 'cell4', 'title': 'Ячейка 4', 'type': 'grid', 'width': None, 'height': None, 'grid_template': '2 / 2 / 3 / 3', 'components': []},
                    ]
                },
            }

            default_layout = {
                'name': name or f'Раскладка {code}',
                'description': f'Раскладка по коду: {code}',
                'zones': [
                    {
                        'id': 'main-content',
                        'name': 'main',
                        'title': 'Основной контент',
                        'type': 'column',
                        'width': 100,
                        'height': None,
                        'grid_template': None,
                        'components': []
                    }
                ]
            }
            return code_map.get(code, default_layout)

        db_layouts = DbLayout.objects.all().order_by('name')
        response_list = []
        for item in db_layouts:
            meta = layout_meta_by_code(item.code, item.name)
            response_list.append({
                'id': item.code,
                'name': meta['name'],
                'description': meta['description'],
                'zones': meta['zones'],
                'created_at': None,
                'updated_at': None
            })

        return Response(response_list)

    elif request.method == 'POST':
        try:
            data = request.data

            # Создаем новую страницу как раскладку
            page = BasePage.objects.create(
                title=data.get('name', 'New Layout'),
                slug=f"layout-{timezone.now().timestamp()}"
            )

            layout = {
                'id': f'layout-{page.id}',
                'name': page.title,
                'description': data.get('description', ''),
                'zones': data.get('zones', []),
                'created_at': safe_isoformat(page.created_at),
                'updated_at': safe_isoformat(page.updated_at)
            }

            return Response(layout, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
# @permission_classes([IsAuthenticated])  # TODO: Включить авторизацию после тестирования
def layout_detail(request, layout_id):
    """
    GET /api/layouts/{id}/ - Получить конкретную раскладку
    PUT /api/layouts/{id}/ - Обновить раскладку
    DELETE /api/layouts/{id}/ - Удалить раскладку
    """
    # Извлекаем ID страницы из layout_id
    if layout_id.startswith('layout-'):
        page_id = layout_id.replace('layout-', '')
    else:
        page_id = layout_id

    try:
        page = get_object_or_404(BasePage, id=page_id)
    except BasePage.DoesNotExist:
        return Response({'error': 'Layout not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        components = page.pagecomponent_set.select_related('component').all().order_by('view_order')

        layout = {
            'id': f'layout-{page.id}',
            'name': page.title,
            'description': f'Layout for page: {page.title}',
            'zones': [
                {
                    'name': 'main',
                    'title': 'Main Content',
                    'components': []
                }
            ],
            'created_at': safe_isoformat(page.created_at),
            'updated_at': safe_isoformat(page.updated_at)
        }

        for comp in components:
            if comp.component is None or getattr(comp.component, 'is_deleted', False):
                continue
            # Получаем реальный тип компонента
            real_component = comp.component.get_real_instance()
            layout['zones'][0]['components'].append({
                'id': comp.component.id,
                'type': real_component.__class__.__name__,
                'title': comp.component.title,
                'view_order': comp.view_order
            })

        return Response(layout)

    elif request.method == 'PUT':
        try:
            data = request.data

            # Обновляем страницу
            page.title = data.get('name', page.title)
            page.save()

            layout = {
                'id': f'layout-{page.id}',
                'name': page.title,
                'description': data.get('description', f'Layout for page: {page.title}'),
                'zones': data.get('zones', []),
                'created_at': safe_isoformat(page.created_at),
                'updated_at': safe_isoformat(page.updated_at)
            }

            return Response(layout)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        try:
            page.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
# @permission_classes([IsAuthenticated])  # TODO: Включить авторизацию после тестирования
def page_components_reorder(request, page_id):
    """
    PATCH /api/pages/{id}/components/reorder/ - Частично обновить порядок компонентов страницы
    """
    try:
        page = get_object_or_404(BasePage, id=page_id)
    except BasePage.DoesNotExist:
        return Response({'error': 'Page not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        data = request.data

        # Проверяем наличие данных о порядке компонентов
        if 'components' not in data:
            return Response({'error': 'Components order data is required'}, status=status.HTTP_400_BAD_REQUEST)

        components_order = data['components']

        if not isinstance(components_order, list):
            return Response({'error': 'Components order must be a list'}, status=status.HTTP_400_BAD_REQUEST)

        # Обновляем порядок компонентов в транзакции
        with transaction.atomic():
            for index, component_data in enumerate(components_order):
                component_id = component_data.get('id')
                if not component_id:
                    continue

                try:
                    # Находим PageComponent для обновления
                    page_component = PageComponent.objects.get(
                        page=page,
                        component_id=component_id
                    )
                    # Обновляем view_order
                    page_component.view_order = index + 1
                    page_component.save()
                except PageComponent.DoesNotExist:
                    # Если компонент не найден, пропускаем его
                    continue

            # Обновляем время изменения страницы
            page.updated_at = timezone.now()
            page.save()

        # Возвращаем обновленный список компонентов
        updated_components = page.pagecomponent_set.all().order_by('view_order')
        components_data = []

        for component in updated_components:
            # Получаем реальный тип компонента
            real_component = component.component.get_real_instance()
            components_data.append({
                'id': component.component.id,
                'type': real_component.__class__.__name__,
                'title': component.component.title,
                'view_order': component.view_order,
            })

        return Response({
            'success': True,
            'message': 'Components order updated successfully',
            'components': components_data
        })

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def site_base_url(request):
    """
    GET /api/site/base-url/ - Получить базовый URL сайта
    """
    from django.contrib.sites.models import Site
    from django.conf import settings

    try:
        # Получаем текущий сайт
        current_site = Site.objects.get_current()
        base_url = f"https://{current_site.domain}"

        # Если в настройках указан порт, добавляем его
        if hasattr(settings, 'PORT') and settings.PORT:
            base_url = f"http://{current_site.domain}:{settings.PORT}"

        return Response({
            'base_url': base_url,
            'domain': current_site.domain
        })

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST', 'GET'])
def component_draft(request, component_id):
    """
    GET /api/components/{id}/draft/ — получить черновик компонента (если есть)
    POST /api/components/{id}/draft/ — создать или обновить черновик компонента в JSON
    """
    component = get_object_or_404(BaseComponent, id=component_id)
    real_component = component.get_real_instance()

    if request.method == 'GET':
        if not real_component.draft_data:
            return Response({'detail': 'Draft not found'}, status=status.HTTP_404_NOT_FOUND)

        # Возвращаем данные черновика, подменяя оригинальные данные
        serializer_class = get_serializer(real_component.__class__)
        data = serializer_class(real_component, context={'request': request}).data

        # Подменяем данные компонента данными из черновика
        if 'component_data' in real_component.draft_data:
            data.update(real_component.draft_data['component_data'])

        data.update({'is_draft': True, 'has_draft': True})
        return Response(data)

    # POST - создание или обновление черновика
    if request.method == 'POST':
        # Получаем данные компонента из запроса
        component_data = request.data.get('component_data', {})

        # Сохраняем черновик в JSON поле
        draft_data = {
            'component_data': component_data,
            'created_at': timezone.now().isoformat(),
            'updated_at': timezone.now().isoformat()
        }

        real_component.draft_data = draft_data
        real_component.save()

        # Возвращаем данные с подменой черновика
        serializer_class = get_serializer(real_component.__class__)
        data = serializer_class(real_component, context={'request': request}).data

        # Подменяем данные компонента
        if component_data:
            data.update(component_data)

        data.update({'is_draft': True, 'has_draft': True})
        return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
def component_publish(request, component_id):
    """
    POST /api/components/{id}/publish/ — опубликовать черновик для компонента {id}
    Применяет данные из draft_data к оригинальному компоненту
    """
    component = get_object_or_404(BaseComponent, id=component_id)
    real_component = component.get_real_instance()

    if not real_component.draft_data:
        return Response({'detail': 'Draft not found'}, status=status.HTTP_404_NOT_FOUND)

    with transaction.atomic():
        # Применяем данные компонента из черновика
        if 'component_data' in real_component.draft_data:
            component_data = real_component.draft_data['component_data']
            exclude_fields = {'id', 'pk', 'created_at', 'updated_at', 'draft_data'}

            for field_name, value in component_data.items():
                if field_name in exclude_fields:
                    continue
                if hasattr(real_component, field_name):
                    try:
                        setattr(real_component, field_name, value)
                    except Exception:
                        pass

        # Очищаем черновик после публикации
        real_component.draft_data = None
        real_component.save()

        serializer_class = get_serializer(real_component.__class__)
        data = serializer_class(real_component, context={'request': request}).data
        data.update({'is_published': True, 'has_draft': False})
        return Response(data, status=status.HTTP_200_OK)
