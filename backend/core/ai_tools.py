"""Local resume extraction and explainable candidate/job matching helpers."""

import re
import zipfile
from difflib import SequenceMatcher
from xml.etree import ElementTree


SKILL_CATALOG = (
    "python", "java", "javascript", "typescript", "react", "angular", "vue",
    "node.js", "django", "flask", "fastapi", "sql", "mysql", "postgresql",
    "mongodb", "redis", "aws", "azure", "gcp", "docker", "kubernetes",
    "terraform", "git", "linux", "html", "css", "rest api", "graphql",
    "machine learning", "deep learning", "data science", "pandas", "numpy",
    "scikit-learn", "tensorflow", "pytorch", "power bi", "tableau", "excel",
    "project management", "agile", "scrum", "communication", "salesforce",
    "figma", " ui/ux", "c++", "c#", ".net", "php", "ruby", "go", "golang",
    "swift", "kotlin", "security", "networking", "etl", "spark", "hadoop",
    "airflow", "jenkins", "ci/cd", "testing", "selenium", "playwright",
    "accounting", "recruiting", "human resources", "leadership",
)

STOP_WORDS = {
    "and", "the", "for", "with", "from", "this", "that", "will", "have",
    "has", "are", "you", "our", "their", "your", "years", "year", "work",
    "experience", "experience", "responsibilities", "requirements", "skills",
    "ability", "strong", "candidate", "role", "team", "job", "using", "use",
}


def extract_text(upload):
    """Extract text from TXT, DOCX, or text-based PDF files."""
    filename = upload.name.lower()
    if filename.endswith(".txt"):
        return upload.read().decode("utf-8-sig", errors="replace")

    if filename.endswith(".docx"):
        with zipfile.ZipFile(upload) as archive:
            xml_content = archive.read("word/document.xml")
        root = ElementTree.fromstring(xml_content)
        namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
        return "\n".join(
            "".join(node.text or "" for node in paragraph.findall(".//w:t", namespace))
            for paragraph in root.findall(".//w:p", namespace)
        )

    if filename.endswith(".pdf"):
        from pypdf import PdfReader

        reader = PdfReader(upload)
        if reader.is_encrypted:
            raise ValueError("This PDF is password-protected. Upload an unlocked file.")
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    raise ValueError("Unsupported file. Upload a PDF, DOCX, or TXT resume.")


def _extract_skills(text):
    normalized = text.lower()
    found = []
    for skill in SKILL_CATALOG:
        term = skill.strip()
        pattern = rf"(?<![\w+#.]){re.escape(term)}(?![\w+#.])"
        if re.search(pattern, normalized):
            found.append(term)
    return found


def parse_resume_text(text):
    """Return editable candidate fields extracted from resume text."""
    if not text or not text.strip():
        raise ValueError("No readable text was found. Scanned resumes need OCR before parsing.")

    email_match = re.search(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", text)
    phone_match = None
    for match in re.finditer(r"(?<!\w)\+?\d[\d\s().-]{7,}\d(?!\w)", text):
        digits = re.sub(r"\D", "", match.group())
        if 10 <= len(digits) <= 15:
            phone_match = match.group().strip()
            break

    lines = [re.sub(r"\s+", " ", line).strip(" |\t") for line in text.splitlines()]
    ignored = re.compile(r"resume|curriculum vitae|profile|summary|objective|experience|education|skills|contact", re.I)
    name = next((
        line for line in lines[:20]
        if 2 <= len(line) <= 80
        and re.search(r"[A-Za-z]", line)
        and "@" not in line
        and not re.search(r"\d{3}", line)
        and not ignored.search(line)
    ), "")

    experience = re.search(
        r"(\d{1,2})\s*\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:relevant\s+)?experience",
        text,
        re.I,
    ) or re.search(r"(\d{1,2})\s*\+\s*(?:years?|yrs?)", text, re.I)

    return {
        "full_name": name,
        "email": email_match.group(0) if email_match else "",
        "phone": phone_match or "",
        "skills": ", ".join(_extract_skills(text)),
        "experience_years": min(int(experience.group(1)), 60) if experience else 0,
        "resume_url": "",
    }


def _tokens(value):
    return {
        token for token in re.findall(r"[a-z0-9+#.]+", value.lower())
        if len(token) > 1 and token not in STOP_WORDS
    }


def match_candidate_to_jobs(candidate, jobs):
    """Score job relevance from skills, requirement keywords, and experience."""
    candidate_skills = set(_extract_skills(candidate.skills or ""))
    candidate_terms = _tokens(candidate.skills or "")
    results = []

    for job in jobs:
        job_text = " ".join((job.title, job.department, job.description, job.requirements))
        required_skills = set(_extract_skills(job_text))
        matched_skills = sorted(candidate_skills & required_skills)
        missing_skills = sorted(required_skills - candidate_skills)

        job_terms = _tokens(" ".join((job.title, job.department, job.requirements)))
        overlap = len(candidate_terms & job_terms) / max(len(job_terms), 1)
        if required_skills:
            skill_score = len(matched_skills) / len(required_skills)
        else:
            skill_score = overlap

        minimum_experience = re.search(
            r"(?:at least\s+|minimum of\s+)?(\d{1,2})\s*\+?\s*(?:years?|yrs?)",
            job_text,
            re.I,
        )
        if minimum_experience:
            target = int(minimum_experience.group(1))
            experience_score = min(candidate.experience_years / max(target, 1), 1)
        else:
            experience_score = 0.5

        score = round(100 * (0.7 * skill_score + 0.15 * experience_score + 0.15 * overlap))
        results.append({
            "job_id": job.id,
            "title": job.title,
            "department": job.department,
            "location": job.location,
            "score": min(score, 100),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "reason": (
                f"Matched {len(matched_skills)} of {len(required_skills)} identified job skills; "
                f"experience listed: {candidate.experience_years} years."
                if required_skills else "Score uses shared role and requirement keywords; add explicit skills to improve this match."
            ),
        })

    return sorted(results, key=lambda item: item["score"], reverse=True)
