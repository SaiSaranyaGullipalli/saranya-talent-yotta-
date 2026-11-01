import { useState } from "react";
import { CalendarPlus, FilePlus2, Plus } from "lucide-react";

const APPLICATION_STATUSES = [
  "SUBMITTED", "SCREENING", "SHORTLISTED", "INTERVIEW", "SELECTED", "REJECTED", "WITHDRAWN",
];
const INTERVIEW_STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED"];
const OFFER_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "DECLINED", "WITHDRAWN"];
const APPLICATION_NEXT_STATUSES = {
  SUBMITTED: ["SUBMITTED", "SCREENING", "REJECTED", "WITHDRAWN"],
  SCREENING: ["SCREENING", "SHORTLISTED", "REJECTED", "WITHDRAWN"],
  SHORTLISTED: ["SHORTLISTED", "INTERVIEW", "REJECTED", "WITHDRAWN"],
  INTERVIEW: ["INTERVIEW", "SELECTED", "REJECTED", "WITHDRAWN"],
  SELECTED: ["SELECTED"], REJECTED: ["REJECTED"], WITHDRAWN: ["WITHDRAWN"],
};
const OFFER_NEXT_STATUSES = {
  DRAFT: ["DRAFT", "SENT", "WITHDRAWN"],
  SENT: ["SENT", "ACCEPTED", "DECLINED", "WITHDRAWN"],
  ACCEPTED: ["ACCEPTED"], DECLINED: ["DECLINED"], WITHDRAWN: ["WITHDRAWN"],
};

function StatusSelect({ value, options, onChange, label }) {
  return (
    <label className="workflow-status">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
      </select>
    </label>
  );
}

function InterviewReview({ interview, onSave }) {
  const [feedback, setFeedback] = useState(interview.feedback || "");
  const [rating, setRating] = useState(interview.rating || "");
  const [saving, setSaving] = useState(false);

  async function saveReview(event) {
    event.preventDefault();
    setSaving(true);
    await onSave(interview.id, {
      feedback,
      rating: rating === "" ? null : Number(rating),
    });
    setSaving(false);
  }

  return (
    <form className="workflow-controls" onSubmit={saveReview}>
      <label className="rating-field">Rating
        <select value={rating} onChange={(event) => setRating(event.target.value)}>
          <option value="">Choose 1–5</option>
          {[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score} / 5</option>)}
        </select>
      </label>
      <label className="feedback-field">Interview feedback
        <input placeholder="Add interview feedback" value={feedback} onChange={(event) => setFeedback(event.target.value)} />
      </label>
      <button className="secondary-button" type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save feedback and rating"}
      </button>
    </form>
  );
}

export default function WorkflowPage({
  page, candidates, jobs, applications, interviews, offers,
  onCreateApplication, onUpdateApplication,
  onCreateInterview, onUpdateInterview,
  onCreateOffer, onUpdateOffer,
}) {
  const [showForm, setShowForm] = useState(false);
  const [applicationForm, setApplicationForm] = useState({ candidate: "", job: "", source: "", notes: "" });
  const [interviewForm, setInterviewForm] = useState({ application: "", scheduled_at: "", interview_type: "TECHNICAL", interviewer: "", meeting_link: "" });
  const [offerForm, setOfferForm] = useState({ application: "", offered_ctc: "", joining_date: "", notes: "" });

  const submit = async (event, callback, data, reset) => {
    event.preventDefault();
    const succeeded = await callback(data);
    if (succeeded === false) return;
    reset();
    setShowForm(false);
  };

  const pageConfig = {
    Applications: { title: "Application Management", description: "Review every candidate and move applications through your hiring pipeline.", records: applications },
    Interviews: { title: "Interview Management", description: "Schedule interviews and capture outcomes for each application.", records: interviews },
    Offers: { title: "Offer Management", description: "Create offers for selected candidates and track decisions.", records: offers },
  }[page];

  if (!pageConfig) return null;

  const applicationFor = (id) => applications.find((application) => application.id === Number(id));
  const openJobs = jobs.filter((job) => job.status === "OPEN");
  const interviewApplications = applications.filter((application) => application.status === "INTERVIEW");
  const selectedApplications = applications.filter((application) => application.status === "SELECTED");

  return (
    <section className="content-card workflow-page">
      <div className="section-heading">
        <div><h3>{pageConfig.title}</h3><p>{pageConfig.description}</p></div>
        <button className="primary-button" onClick={() => setShowForm((visible) => !visible)}>
          <Plus size={18} /> {page === "Applications" ? "New Application" : page === "Interviews" ? "Schedule Interview" : "Create Offer"}
        </button>
      </div>

      {showForm && page === "Applications" && (
        <form className="data-form" onSubmit={(event) => submit(event, onCreateApplication, {
          ...applicationForm, candidate: Number(applicationForm.candidate), job: Number(applicationForm.job),
        }, () => setApplicationForm({ candidate: "", job: "", source: "", notes: "" }))}>
          <h3>Start an Application</h3>
          <div className="form-grid">
            <select required value={applicationForm.candidate} onChange={(event) => setApplicationForm({ ...applicationForm, candidate: event.target.value })}>
              <option value="">Select candidate</option>
              {candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.full_name} — {candidate.email}</option>)}
            </select>
            <select required value={applicationForm.job} onChange={(event) => setApplicationForm({ ...applicationForm, job: event.target.value })}>
              <option value="">Select open job</option>
              {openJobs.map((job) => <option key={job.id} value={job.id}>{job.title} — {job.department}</option>)}
            </select>
            <input placeholder="Source (e.g. referral, careers site)" value={applicationForm.source} onChange={(event) => setApplicationForm({ ...applicationForm, source: event.target.value })} />
            <textarea placeholder="Recruiter notes" value={applicationForm.notes} onChange={(event) => setApplicationForm({ ...applicationForm, notes: event.target.value })} />
          </div>
          <button className="primary-button" disabled={!candidates.length || !openJobs.length}>Create Application</button>
          {!openJobs.length && <p className="form-hint">Create or open a job before adding an application.</p>}
        </form>
      )}

      {showForm && page === "Interviews" && (
        <form className="data-form" onSubmit={(event) => submit(event, onCreateInterview, {
          ...interviewForm, application: Number(interviewForm.application), scheduled_at: new Date(interviewForm.scheduled_at).toISOString(),
        }, () => setInterviewForm({ application: "", scheduled_at: "", interview_type: "TECHNICAL", interviewer: "", meeting_link: "" }))}>
          <h3>Schedule a Technical, HR, or Managerial Interview</h3>
          <div className="form-grid">
            <select required value={interviewForm.application} onChange={(event) => setInterviewForm({ ...interviewForm, application: event.target.value })}>
              <option value="">Select application</option>
              {interviewApplications.map((application) => <option key={application.id} value={application.id}>{application.candidate_name} — {application.job_title}</option>)}
            </select>
            <input type="datetime-local" required value={interviewForm.scheduled_at} onChange={(event) => setInterviewForm({ ...interviewForm, scheduled_at: event.target.value })} />
            <select required value={interviewForm.interview_type} onChange={(event) => setInterviewForm({ ...interviewForm, interview_type: event.target.value })}>
              <option value="TECHNICAL">Technical</option><option value="HR">HR</option><option value="MANAGERIAL">Managerial</option><option value="OTHER">Other</option>
            </select>
            <input required placeholder="Assigned interviewer" value={interviewForm.interviewer} onChange={(event) => setInterviewForm({ ...interviewForm, interviewer: event.target.value })} />
            <input type="url" placeholder="Meeting link (optional)" value={interviewForm.meeting_link} onChange={(event) => setInterviewForm({ ...interviewForm, meeting_link: event.target.value })} />
          </div>
          <button className="primary-button" disabled={!interviewApplications.length}><CalendarPlus size={16} /> Schedule Interview</button>
          {!interviewApplications.length && <p className="form-hint">Add an application before scheduling an interview.</p>}
        </form>
      )}

      {showForm && page === "Offers" && (
        <form className="data-form" onSubmit={(event) => submit(event, onCreateOffer, {
          ...offerForm, application: Number(offerForm.application), offered_ctc: Number(offerForm.offered_ctc), joining_date: offerForm.joining_date || null,
        }, () => setOfferForm({ application: "", offered_ctc: "", joining_date: "", notes: "" }))}>
          <h3>Create an Offer for a Selected Candidate</h3>
          <div className="form-grid">
            <select required value={offerForm.application} onChange={(event) => setOfferForm({ ...offerForm, application: event.target.value })}>
              <option value="">Select candidate application</option>
              {selectedApplications.filter((application) => !offers.some((offer) => offer.application === application.id)).map((application) => <option key={application.id} value={application.id}>{application.candidate_name} — {application.job_title}</option>)}
            </select>
            <input type="number" min="0.01" step="0.01" required placeholder="Offered CTC (annual amount)" value={offerForm.offered_ctc} onChange={(event) => setOfferForm({ ...offerForm, offered_ctc: event.target.value })} />
            <input type="date" value={offerForm.joining_date} onChange={(event) => setOfferForm({ ...offerForm, joining_date: event.target.value })} />
            <textarea placeholder="Offer notes" value={offerForm.notes} onChange={(event) => setOfferForm({ ...offerForm, notes: event.target.value })} />
          </div>
          <button className="primary-button" disabled={!selectedApplications.some((application) => !offers.some((offer) => offer.application === application.id))}><FilePlus2 size={16} /> Save Offer</button>
        </form>
      )}

      {!pageConfig.records.length ? <div className="empty-state">No {page.toLowerCase()} yet. Use the button above to get started.</div> : (
        <div className="workflow-list">
          {page === "Applications" && applications.map((application) => (
            <article className="workflow-record" key={application.id}>
              <div className="workflow-record-title"><div><strong>{application.candidate_name}</strong><span>{application.candidate_email} · {application.job_title}</span></div><small>Applied {new Date(application.applied_at).toLocaleDateString()}</small></div>
              <div className="workflow-record-meta"><span>Source: {application.source || "Not specified"}</span><span>{application.notes || "No recruiter notes"}</span></div>
              <StatusSelect label="Hiring stage" value={application.status} options={APPLICATION_NEXT_STATUSES[application.status] || APPLICATION_STATUSES} onChange={(status) => onUpdateApplication(application.id, { status })} />
            </article>
          ))}
          {page === "Interviews" && interviews.map((interview) => {
            const application = applicationFor(interview.application);
            return <article className="workflow-record" key={interview.id}>
              <div className="workflow-record-title"><div><strong>{application ? `${application.candidate_name} — ${application.job_title}` : `Application #${interview.application}`}</strong><span>{interview.interview_type} interview with {interview.interviewer}</span></div><small>{new Date(interview.scheduled_at).toLocaleString()}</small></div>
              {interview.meeting_link && <a href={interview.meeting_link} target="_blank" rel="noreferrer">Join meeting</a>}
              <StatusSelect label="Interview status" value={interview.status} options={INTERVIEW_STATUSES} onChange={(status) => onUpdateInterview(interview.id, { status })} />
              <InterviewReview key={interview.id} interview={interview} onSave={onUpdateInterview} />
            </article>;
          })}
          {page === "Offers" && offers.map((offer) => {
            const application = applicationFor(offer.application);
            return <article className="workflow-record" key={offer.id}>
              <div className="workflow-record-title"><div><strong>{application ? `${application.candidate_name} — ${application.job_title}` : `Application #${offer.application}`}</strong><span>Annual compensation: {Number(offer.offered_ctc).toLocaleString()}</span></div><small>{offer.joining_date ? `Joining ${new Date(`${offer.joining_date}T00:00:00`).toLocaleDateString()}` : "Joining date not set"}</small></div>
              <div className="workflow-record-meta"><span>{offer.notes || "No offer notes"}</span></div>
              <StatusSelect label="Offer status" value={offer.status} options={OFFER_NEXT_STATUSES[offer.status] || OFFER_STATUSES} onChange={(status) => onUpdateOffer(offer.id, { status, ...(status === "SENT" ? { sent_at: new Date().toISOString() } : {}) })} />
            </article>;
          })}
        </div>
      )}
    </section>
  );
}
