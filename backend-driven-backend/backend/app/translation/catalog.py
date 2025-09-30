from modeltranslation.translator import TranslationOptions, register
from ..models import CatalogPage


@register(CatalogPage)
class CatalogPageTranslationOptions(TranslationOptions):
    fields = ()


