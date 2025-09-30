from django.contrib import admin
from garpix_page.admin import BasePageAdmin

from ..models.search_page import SearchPage


@admin.register(SearchPage)
class SearchPageAdmin(BasePageAdmin):
    pass
