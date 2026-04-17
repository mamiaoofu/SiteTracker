from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Allow access only to admin users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsForeman(permissions.BasePermission):
    """Allow access only to foreman users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'foreman'


class IsAccountant(permissions.BasePermission):
    """Allow access only to accountant users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'accountant'


class IsAdminOrForeman(permissions.BasePermission):
    """Allow access to admin or foreman."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'foreman')


class IsAdminOrAccountant(permissions.BasePermission):
    """Allow access to admin or accountant."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'accountant')


class IsAdminOrReadOnly(permissions.BasePermission):
    """Allow full access to admin, read-only for others."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role == 'admin'
