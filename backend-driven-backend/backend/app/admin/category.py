from django.contrib import admin
from garpix_page.admin import BasePageAdmin

from ..models.category import Category


@admin.register(Category)
class CategoryAdmin(BasePageAdmin):
    pass
