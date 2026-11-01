
import zipfile
from django.db import connection
from django.db.utils import OperationalError
from django.http import JsonResponse
from django.shortcuts import get_object_or_404

from rest_framework import status, viewsets
from rest_framework.decorators import (
    api_view,
    parser_classes,
    permission_classes,
)
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Candidate,
    Job,
    Application,
    Interview,
    Offer
)

from .serializers import (
    CandidateSerializer,
    JobSerializer,
    ApplicationSerializer,
    InterviewSerializer,
    OfferSerializer
)
from .auth_serializers import UserSerializer
from .permissions import RecruitmentPermission
from .ai_tools import extract_text, match_candidate_to_jobs, parse_resume_text


# Health Check API
@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()

        return JsonResponse({
            "project": "TalentFlow",
            "backend": "Running",
            "database": "Connected",
            "status": "Healthy"
        })

    except OperationalError:
        return JsonResponse({
            "project": "TalentFlow",
            "backend": "Running",
            "database": "Disconnected",
            "status": "Unhealthy"
        }, status=503)


# Candidate APIs
class CandidateViewSet(viewsets.ModelViewSet):

    queryset = Candidate.objects.all().order_by("-created_at")
    serializer_class = CandidateSerializer
    permission_classes = [RecruitmentPermission]


# Job APIs
class JobViewSet(viewsets.ModelViewSet):

    queryset = Job.objects.all().order_by("-created_at")
    serializer_class = JobSerializer
    permission_classes = [RecruitmentPermission]


# Application APIs
class ApplicationViewSet(viewsets.ModelViewSet):

    queryset = Application.objects.select_related(
        "candidate", "job"
    ).all().order_by("-applied_at")

    serializer_class = ApplicationSerializer
    permission_classes = [RecruitmentPermission]


# Interview APIs
class InterviewViewSet(viewsets.ModelViewSet):

    queryset = Interview.objects.select_related(
        "application"
    ).all().order_by("scheduled_at")

    serializer_class = InterviewSerializer
    permission_classes = [RecruitmentPermission]


# Offer APIs
class OfferViewSet(viewsets.ModelViewSet):

    queryset = Offer.objects.select_related(
        "application"
    ).all().order_by("-created_at")

    serializer_class = OfferSerializer
    permission_classes = [RecruitmentPermission]
    
# Resume parsing API. Uploaded files are parsed in memory and not retained.
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def parse_resume(request):
    resume = request.FILES.get("resume")
    if not resume:
        return Response({"detail": "Choose a resume file to parse."}, status=status.HTTP_400_BAD_REQUEST)
    if resume.size > 5 * 1024 * 1024:
        return Response({"detail": "Resume files must be 5 MB or smaller."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        extracted_text = extract_text(resume)
        parsed_fields = parse_resume_text(extracted_text)
    except (ValueError, KeyError, zipfile.BadZipFile) as error:
        return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response({"detail": "We could not read this file. Try a text-based PDF, DOCX, or TXT resume."}, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        "candidate": parsed_fields,
        "extracted_characters": len(extracted_text),
        "notice": "Review the extracted fields before saving the candidate. The uploaded resume is not stored.",
    })


# Explainable matching for open roles; uses skills and job requirements only.
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def candidate_job_matches(request):
    candidate_id = request.data.get("candidate_id")
    if not candidate_id:
        return Response({"detail": "candidate_id is required."}, status=status.HTTP_400_BAD_REQUEST)

    candidate = get_object_or_404(Candidate, pk=candidate_id)
    jobs = Job.objects.filter(status=Job.Status.OPEN).order_by("title")
    matches = match_candidate_to_jobs(candidate, jobs)
    return Response({
        "candidate_id": candidate.id,
        "candidate_name": candidate.full_name,
        "matches": matches,
        "method": "Explainable keyword, skill overlap, and experience score; use as decision support, not an automated hiring decision.",
    })


# Current logged-in user API

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):

    serializer = UserSerializer(request.user)

    return Response(serializer.data)


# Logout API

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_user(request):

    refresh_token = request.data.get("refresh")

    if not refresh_token:
        return Response(
            {"error": "Refresh token is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()

        return Response(
            {"message": "Successfully logged out"},
            status=status.HTTP_200_OK
        )

    except TokenError:
        return Response(
            {"error": "Invalid or expired refresh token"},
            status=status.HTTP_400_BAD_REQUEST
        )

