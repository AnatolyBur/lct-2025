from django.contrib import admin
from garpix_page.admin import BasePageAdmin

from ..models.news import NewsListPage, NewsPost


@admin.register(NewsListPage)
class NewsListPageAdmin(BasePageAdmin):
    pass


@admin.register(NewsPost)
class NewsPostAdmin(BasePageAdmin):
    pass
