from django.contrib import admin
from garpix_page.admin import BasePageAdmin

from ..models import Preview


@admin.register(Preview)
class PreviewAdmin(BasePageAdmin):
    pass
