
from rest_framework.permissions import BasePermission


class RecruitmentPermission(BasePermission):
    """
    Authenticated recruiters and administrators
    can access recruitment resources.

    Only administrators can delete records.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):

        if request.method == "DELETE":
            return (
                request.user.is_staff
                or request.user.is_superuser
            )

        return True
