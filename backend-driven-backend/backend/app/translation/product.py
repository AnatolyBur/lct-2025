from modeltranslation.translator import TranslationOptions, register
from ..models import ProductPage


@register(ProductPage)
class ProductPageTranslationOptions(TranslationOptions):
    fields = ('short_description', 'description',)


