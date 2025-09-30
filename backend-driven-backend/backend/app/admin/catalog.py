from django.contrib import admin
from garpix_page.admin import BasePageAdmin

from ..models import CatalogPage


@admin.register(CatalogPage)
class CatalogPageAdmin(BasePageAdmin):
    pass
