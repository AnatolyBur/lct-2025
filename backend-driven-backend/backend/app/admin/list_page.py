from django.contrib import admin
from garpix_page.admin import BasePageAdmin

from ..models.list_page import ListPage


@admin.register(ListPage)
class ListPageAdmin(BasePageAdmin):
    def has_module_permission(self, request):
        return True
