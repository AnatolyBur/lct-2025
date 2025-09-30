from garpix_page.utils.get_exclude_fields import get_exclude_fields
from rest_framework.fields import ReadOnlyField
from rest_framework.serializers import ModelSerializer


def get_serializer(model):
    if model.get_serializer(model) is not None:
        return model.get_serializer(model)

    # Определяем базовые поля для исключения в зависимости от типа модели
    from garpix_page.models import BaseComponent, BasePage

    # Получаем список всех полей модели
    model_fields = {field.name for field in model._meta.fields}

    extra_fields = {}
    if issubclass(model, BasePage):
        # Для страниц исключаем поля, связанные с деревом (sites и parent больше не исключаем)
        potential_exclude_fields = ('lft', 'rght', 'tree_id', 'level', 'polymorphic_ctype')
        # Ленивый импорт LayoutSerializer для избежания циклического импорта
        from app.serializers import LayoutSerializer
        extra_fields['layout'] = LayoutSerializer(read_only=True)
    elif issubclass(model, BaseComponent):
        # Для компонентов исключаем полиморфные поля и ptr (если существует)
        potential_exclude_fields = ('polymorphic_ctype', 'ptr')
    else:
        # Для других моделей исключаем только полиморфные поля
        potential_exclude_fields = ('polymorphic_ctype',)

    # Исключаем только те поля, которые действительно существуют в модели
    base_exclude_fields = tuple(field for field in potential_exclude_fields if field in model_fields)

    return type(f'{model.__name__}Serializer', (ModelSerializer, ), {
        'seo_title': ReadOnlyField(source='get_seo_title'),
        'seo_keywords': ReadOnlyField(source='get_seo_keywords'),
        'seo_description': ReadOnlyField(source='get_seo_description'),
        'seo_author': ReadOnlyField(source='get_seo_author'),
        'seo_og_type': ReadOnlyField(source='get_seo_og_type'),
        **extra_fields,
        'Meta': type('Meta', (object,), {
            'model': model,
            'exclude': base_exclude_fields + tuple(get_exclude_fields(model))
            # 'fields': '__all__'
        })
    })


def get_components_serializer(model):
    if model.get_serializer(model) is not None:
        return model.get_serializer(model)

    return type(f'{model.__name__}Serializer', (ModelSerializer, ), {
        'Meta': type('Meta', (object,), {
            'model': model,
            'exclude': ('polymorphic_ctype', 'pages') + tuple(get_exclude_fields(model))
        })
    })
