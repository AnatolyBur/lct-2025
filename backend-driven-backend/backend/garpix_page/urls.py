from django.urls import path, re_path
from django.conf import settings
from garpix_page.views.page_api import PageApiView, PageApiListView
from garpix_page.views.robots import robots_txt
from garpix_page.views.sitemap import sitemap_view
from garpix_page.views.admin_api import (
    pages_list_create, page_detail, pages_metadata, page_layout, page_components_reorder,
    components_list, component_detail, component_metadata, component_types, components_metadata,
    component_instances_list_create, component_instance_detail,
    layouts_list_create, layout_detail, site_base_url,
    page_draft, page_publish, component_draft, component_publish,
)
from garpix_page.views.form_builder_api import (
    form_builder_config, form_submit, form_events, form_event_detail,
    form_submissions, form_event_logs,
)

app_name = 'garpix_page'

urlpatterns = [
    
    # Admin API endpoints
    # Pages
    path(f'{settings.API_URL}/admin/pages/', pages_list_create, name='admin_pages_list_create'),
    path(f'{settings.API_URL}/admin/pages/<int:page_id>/', page_detail, name='admin_page_detail'),
    path(f'{settings.API_URL}/admin/pages/<int:page_id>/draft/', page_draft, name='admin_page_draft'),
    path(f'{settings.API_URL}/admin/pages/<int:page_id>/publish/', page_publish, name='admin_page_publish'),
    path(f'{settings.API_URL}/admin/pages/metadata/', pages_metadata, name='admin_pages_metadata'),
    path(f'{settings.API_URL}/admin/pages/<int:page_id>/metadata/', pages_metadata, name='admin_page_metadata'),
    path(f'{settings.API_URL}/admin/pages/<int:page_id>/layout/', page_layout, name='admin_page_layout'),
    path(f'{settings.API_URL}/admin/pages/<int:page_id>/components/reorder/', page_components_reorder, name='admin_page_components_reorder'),
    
    # Components
    path(f'{settings.API_URL}/admin/components/', components_list, name='admin_components_list'),
    path(f'{settings.API_URL}/admin/components/types/', component_types, name='admin_component_types'),
    path(f'{settings.API_URL}/admin/components/metadata/', components_metadata, name='admin_components_metadata'),
    path(f'{settings.API_URL}/admin/components/<int:component_id>/', component_detail, name='admin_component_detail'),
    path(f'{settings.API_URL}/admin/components/<int:component_id>/metadata/', component_metadata, name='admin_component_metadata'),
    path(f'{settings.API_URL}/admin/components/<int:component_id>/draft/', component_draft, name='admin_component_draft'),
    path(f'{settings.API_URL}/admin/components/<int:component_id>/publish/', component_publish, name='admin_component_publish'),
    
    # Component Instances
    path(f'{settings.API_URL}/admin/component-instances/', component_instances_list_create, name='admin_component_instances_list_create'),
    path(f'{settings.API_URL}/admin/component-instances/<int:component_id>/', component_instance_detail, name='admin_component_instance_detail'),
    
    # Layouts
    path(f'{settings.API_URL}/admin/layouts/', layouts_list_create, name='admin_layouts_list_create'),
    path(f'{settings.API_URL}/admin/layouts/<int:layout_id>/', layout_detail, name='admin_layout_detail'),
    
    # Site info
    path(f'{settings.API_URL}/admin/site/base-url/', site_base_url, name='admin_site_base_url'),
    
    # Form Builder
    path(f'{settings.API_URL}/admin/forms/', form_builder_config, name='admin_forms_list'),
    path(f'{settings.API_URL}/admin/forms/<int:form_id>/config/', form_builder_config, name='admin_form_config'),
    path(f'{settings.API_URL}/forms/<int:form_id>/submit/', form_submit, name='form_submit'),
    path(f'{settings.API_URL}/admin/forms/<int:form_id>/events/', form_events, name='admin_form_events'),
    path(f'{settings.API_URL}/admin/forms/<int:form_id>/events/<int:event_id>/', form_event_detail, name='admin_form_event_detail'),
    path(f'{settings.API_URL}/admin/forms/<int:form_id>/submissions/', form_submissions, name='admin_form_submissions'),
    path(f'{settings.API_URL}/admin/forms/<int:form_id>/events/<int:event_id>/logs/', form_event_logs, name='admin_form_event_logs'),

    re_path(r'{}/page_models_list/$'.format(settings.API_URL), PageApiListView.as_view()),
    re_path(r'{}/page/(?P<slugs>.*)/$'.format(settings.API_URL), PageApiView.as_view()),
    re_path(r'{}/page/(?P<slugs>.*)$'.format(settings.API_URL), PageApiView.as_view()),
    
    path('sitemap.xml', sitemap_view, name='django.contrib.sitemaps.views.sitemap'),
    path('robots.txt', robots_txt),
]
