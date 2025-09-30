from django.contrib import admin
from garpix_page.admin import BasePageAdmin

from ..models.post import Post


@admin.register(Post)
class PostAdmin(BasePageAdmin):
    pass
