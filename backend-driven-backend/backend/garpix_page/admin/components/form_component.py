from django.contrib import admin
from garpix_page.admin.components.base_component import BaseComponentAdmin
from garpix_page.models.components.form_component import FormComponent


@admin.register(FormComponent)
class FormComponentAdmin(BaseComponentAdmin):
    """
    Админка для FormComponent
    Скрывает поле form_config из формы создания/редактирования
    """
    exclude = ('form_config',)
    
    def save_model(self, request, obj, form, change):
        """
        При создании нового объекта устанавливаем form_config в пустой объект
        """
        if not change:  # Если это создание нового объекта
            obj.form_config = {}
        super().save_model(request, obj, form, change)
