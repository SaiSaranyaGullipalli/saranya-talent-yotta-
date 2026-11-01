from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import Application, Candidate, Interview, Job


DEMO_RECORDS = [
    {
        "candidate": {
            "full_name": "Maya Patel",
            "email": "maya.patel@example.test",
            "phone": "+1 555 010 1001",
            "location": "Austin, TX",
            "skills": "Python, Django, REST API, PostgreSQL",
            "experience_years": 6,
        },
        "job": {
            "title": "Senior Backend Engineer",
            "department": "Engineering",
            "location": "Austin, TX",
            "employment_type": Job.EmploymentType.FULL_TIME,
            "description": "Build and maintain Python services and REST APIs.",
            "requirements": "Python, Django, PostgreSQL; 5+ years experience.",
            "status": Job.Status.OPEN,
        },
        "application_status": Application.Status.INTERVIEW,
        "interview_type": Interview.InterviewType.TECHNICAL,
        "interviewer": "Jordan Lee",
    },
    {
        "candidate": {
            "full_name": "Arjun Mehta",
            "email": "arjun.mehta@example.test",
            "phone": "+1 555 010 1002",
            "location": "Seattle, WA",
            "skills": "React, TypeScript, JavaScript, HTML, CSS",
            "experience_years": 4,
        },
        "job": {
            "title": "Frontend Developer",
            "department": "Product Engineering",
            "location": "Seattle, WA",
            "employment_type": Job.EmploymentType.FULL_TIME,
            "description": "Create accessible web interfaces using React and TypeScript.",
            "requirements": "React, TypeScript, CSS; 3+ years experience.",
            "status": Job.Status.OPEN,
        },
        "application_status": Application.Status.SHORTLISTED,
        "interview_type": Interview.InterviewType.MANAGERIAL,
        "interviewer": "Taylor Morgan",
    },
    {
        "candidate": {
            "full_name": "Sara Kim",
            "email": "sara.kim@example.test",
            "phone": "+1 555 010 1003",
            "location": "Chicago, IL",
            "skills": "SQL, Python, Power BI, Excel, Data Science",
            "experience_years": 3,
        },
        "job": {
            "title": "Data Analyst",
            "department": "Analytics",
            "location": "Chicago, IL",
            "employment_type": Job.EmploymentType.FULL_TIME,
            "description": "Analyze business data and build reporting dashboards.",
            "requirements": "SQL, Python, Power BI; 2+ years experience.",
            "status": Job.Status.OPEN,
        },
        "application_status": Application.Status.INTERVIEW,
        "interview_type": Interview.InterviewType.TECHNICAL,
        "interviewer": "Casey Rivera",
    },
    {
        "candidate": {
            "full_name": "Rohan Desai",
            "email": "rohan.desai@example.test",
            "phone": "+1 555 010 1004",
            "location": "Denver, CO",
            "skills": "Recruiting, Human Resources, Communication, Leadership",
            "experience_years": 7,
        },
        "job": {
            "title": "Technical Recruiter",
            "department": "People Operations",
            "location": "Denver, CO",
            "employment_type": Job.EmploymentType.FULL_TIME,
            "description": "Lead engineering recruitment and hiring coordination.",
            "requirements": "Recruiting, communication, leadership; 4+ years experience.",
            "status": Job.Status.OPEN,
        },
        "application_status": Application.Status.SELECTED,
        "interview_type": Interview.InterviewType.HR,
        "interviewer": "Avery Brooks",
    },
    {
        "candidate": {
            "full_name": "Priya Nair",
            "email": "priya.nair@example.test",
            "phone": "+1 555 010 1005",
            "location": "Boston, MA",
            "skills": "AWS, Docker, Kubernetes, Terraform, Linux",
            "experience_years": 5,
        },
        "job": {
            "title": "Cloud DevOps Engineer",
            "department": "Platform Engineering",
            "location": "Boston, MA",
            "employment_type": Job.EmploymentType.FULL_TIME,
            "description": "Operate cloud infrastructure and delivery pipelines.",
            "requirements": "AWS, Docker, Kubernetes, Terraform; 4+ years experience.",
            "status": Job.Status.OPEN,
        },
        "application_status": Application.Status.INTERVIEW,
        "interview_type": Interview.InterviewType.TECHNICAL,
        "interviewer": "Morgan Chen",
    },
]


class Command(BaseCommand):
    help = "Create five fictional candidates, jobs, applications, and interview examples. Safe to rerun."

    def handle(self, *args, **options):
        created = {"candidates": 0, "jobs": 0, "applications": 0, "interviews": 0}
        start_time = timezone.now().replace(second=0, microsecond=0)

        for index, record in enumerate(DEMO_RECORDS):
            candidate, was_created = Candidate.objects.get_or_create(
                email=record["candidate"]["email"],
                defaults=record["candidate"],
            )
            created["candidates"] += was_created

            job, was_created = Job.objects.get_or_create(
                title=record["job"]["title"],
                department=record["job"]["department"],
                defaults=record["job"],
            )
            created["jobs"] += was_created

            application, was_created = Application.objects.get_or_create(
                candidate=candidate,
                job=job,
                defaults={
                    "status": record["application_status"],
                    "source": "Demo data",
                    "notes": "Example record created by seed_demo_data.",
                },
            )
            created["applications"] += was_created

            if application.status in (Application.Status.REJECTED, Application.Status.WITHDRAWN):
                continue

            _, was_created = Interview.objects.get_or_create(
                application=application,
                interview_type=record["interview_type"],
                interviewer=record["interviewer"],
                defaults={
                    "scheduled_at": start_time + timedelta(days=index + 1),
                    "meeting_link": f"https://meet.example.test/demo-interview-{index + 1}",
                    "status": Interview.Status.SCHEDULED,
                },
            )
            created["interviews"] += was_created

        self.stdout.write(self.style.SUCCESS(
            "Demo seed complete. Created: "
            + ", ".join(f"{count} {name}" for name, count in created.items())
            + ". Existing demo records were kept."
        ))
