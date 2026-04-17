from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    # Auth
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Apps
    path('api/', include('core.urls')),
    path('api/', include('operations.urls')),
    path('api/', include('finance.urls')),
    path('api/', include('accounting.urls')),
    path('api/', include('reporting.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # In production, serve media via whitenoise (for small-scale / testing)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
