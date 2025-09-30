from django.contrib import admin
from garpix_page.admin import BasePageAdmin

from ..models import HomePage, Page


@admin.register(Page)
class PageAdmin(BasePageAdmin):
    pass


@admin.register(HomePage)
class HomePageAdmin(BasePageAdmin):
    pass
