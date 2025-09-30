from rest_framework import serializers
from app.models.components import (
    CategoryTilesComponent,
    CategoryTileItem,
    RecommendationsComponent,
    RecommendationItem,
    BusinessBlockComponent,
    BusinessBlockItem,
    ServicesAndFeaturesComponent,
    ServiceItem,
    FavoritesTeaserComponent,
    FavoriteTeaserItem,
    FooterLinksComponent,
    FooterLinkGroup,
    FooterLinkItem,
)


class CategoryTileItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryTileItem
        fields = ('title', 'url', 'icon', 'order')


class CategoryTilesComponentSerializer(serializers.ModelSerializer):
    items = CategoryTileItemSerializer(many=True, read_only=True)
    component_model = serializers.SerializerMethodField()

    class Meta:
        model = CategoryTilesComponent
        fields = ('id', 'title', 'columns', 'items', 'component_model')

    def get_component_model(self, obj):
        return obj.__class__.__name__


class RecommendationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecommendationItem
        fields = (
            'title',
            'url',
            'image',
            'price_value',
            'price_currency',
            'address',
            'is_favorite',
            'order',
        )


class RecommendationsComponentSerializer(serializers.ModelSerializer):
    items = RecommendationItemSerializer(many=True, read_only=True)
    component_model = serializers.SerializerMethodField()

    class Meta:
        model = RecommendationsComponent
        fields = (
            'id',
            'title',
            'subtitle',
            'columns',
            'limit',
            'items',
            'component_model',
        )

    def get_component_model(self, obj):
        return obj.__class__.__name__


class BusinessBlockItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessBlockItem
        fields = (
            'title',
            'description',
            'url',
            'icon',
            'order',
            'is_external',
        )


class BusinessBlockComponentSerializer(serializers.ModelSerializer):
    items = BusinessBlockItemSerializer(many=True, read_only=True)
    component_model = serializers.SerializerMethodField()

    class Meta:
        model = BusinessBlockComponent
        fields = (
            'id',
            'title',
            'show_on_mobile',
            'max_items',
            'items',
            'component_model',
        )

    def get_component_model(self, obj):
        return obj.__class__.__name__


class ServiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceItem
        fields = (
            'title',
            'description',
            'url',
            'icon',
            'order',
            'is_external',
        )


class ServicesAndFeaturesComponentSerializer(serializers.ModelSerializer):
    items = ServiceItemSerializer(many=True, read_only=True)
    component_model = serializers.SerializerMethodField()

    class Meta:
        model = ServicesAndFeaturesComponent
        fields = (
            'id',
            'title',
            'columns',
            'max_items',
            'compact',
            'items',
            'component_model',
        )

    def get_component_model(self, obj):
        return obj.__class__.__name__


class FavoriteTeaserItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FavoriteTeaserItem
        fields = (
            'title',
            'url',
            'image',
            'price_value',
            'price_currency',
            'address',
            'order',
        )


class FavoritesTeaserComponentSerializer(serializers.ModelSerializer):
    items = FavoriteTeaserItemSerializer(many=True, read_only=True)
    component_model = serializers.SerializerMethodField()

    class Meta:
        model = FavoritesTeaserComponent
        fields = (
            'id',
            'mode',
            'title',
            'subtitle',
            'teaser_text',
            'teaser_url',
            'columns',
            'limit',
            'items',
            'component_model',
        )

    def get_component_model(self, obj):
        return obj.__class__.__name__


class FooterLinkItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FooterLinkItem
        fields = ('title', 'url', 'is_external', 'order')


class FooterLinkGroupSerializer(serializers.ModelSerializer):
    links = FooterLinkItemSerializer(many=True, read_only=True)

    class Meta:
        model = FooterLinkGroup
        fields = ('title', 'order', 'links')


class FooterLinksComponentSerializer(serializers.ModelSerializer):
    groups = FooterLinkGroupSerializer(many=True, read_only=True)
    component_model = serializers.SerializerMethodField()

    class Meta:
        model = FooterLinksComponent
        fields = (
            'id',
            'copyright_text',
            'show_socials',
            'groups',
            'component_model',
        )

    def get_component_model(self, obj):
        return obj.__class__.__name__
