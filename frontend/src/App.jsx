
import { useEffect, useState } from "react";

import {
  Users,
  BriefcaseBusiness,
  FileText,
  CalendarDays,
  Plus,
  Search,
  Trash2,
  RefreshCw,
  CheckCircle2
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatCard from "./components/Statcard";
import WorkflowPage from "./components/WorkflowPage.jsx";

import { api } from "./services/api";

import "./App.css";
import Login from "./components/Login";
import { clearTokens } from "./services/api";


function App() {

  const [authenticated, setAuthenticated] = useState(
    () => Boolean(sessionStorage.getItem("accessToken"))
  );
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [offers, setOffers] = useState([]);

  const [loading, setLoading] = useState(
    () => Boolean(sessionStorage.getItem("accessToken"))
  );
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [candidateForm, setCandidateForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    skills: "",
    experience_years: 0,
    resume_url: ""
  });

  const [jobForm, setJobForm] = useState({
    title: "",
    department: "",
    location: "",
    employment_type: "FULL_TIME",
    description: "",
    requirements: "",
    salary_min: "",
    salary_max: "",
    status: "OPEN"
  });


  async function loadData({ showLoading = true } = {}) {

    if (showLoading) setLoading(true);
    setError("");

    try {
      const results = await Promise.all([
        api.getCandidates(),
        api.getJobs(),
        api.getApplications(),
        api.getInterviews(),
        api.getOffers()
      ]);

      setCandidates(results[0]);
      setJobs(results[1]);
      setApplications(results[2]);
      setInterviews(results[3]);
      setOffers(results[4]);

    } catch (err) {
      setError(err.message);
      if (!sessionStorage.getItem("accessToken")) {
        setAuthenticated(false);
        setCurrentUser(null);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }


  useEffect(() => {
    if (!authenticated) {
      return undefined;
    }

    let cancelled = false;

    async function loadInitialData() {
      try {
        const [user, candidatesResult, jobsResult, applicationsResult, interviewsResult, offersResult] = await Promise.all([
          api.getCurrentUser(),
          api.getCandidates(),
          api.getJobs(),
          api.getApplications(),
          api.getInterviews(),
          api.getOffers()
        ]);

        if (cancelled) return;

        setCurrentUser(user);
        setCandidates(candidatesResult);
        setJobs(jobsResult);
        setApplications(applicationsResult);
        setInterviews(interviewsResult);
        setOffers(offersResult);
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          if (!sessionStorage.getItem("accessToken")) {
            setAuthenticated(false);
            setCurrentUser(null);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInitialData();
    return () => {
      cancelled = true;
    };
  }, [authenticated]);


  async function handleLogin(username, password) {
    setError("");
    try {
      await api.login(username, password);
      setLoading(true);
      setAuthenticated(true);
    } catch (err) {
      setError(err.message);
    }
  }


  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      // Local logout must still complete if the server token has expired.
    } finally {
      clearTokens();
      setAuthenticated(false);
      setCurrentUser(null);
      setCandidates([]);
      setJobs([]);
      setApplications([]);
      setInterviews([]);
      setOffers([]);
      setError("");
    }
  }


  async function runWorkflowAction(action) {
    setError("");
    try {
      await action();
      await loadData({ showLoading: false });
      return true;
    } catch (err) {
      setError(err.message);
      if (!sessionStorage.getItem("accessToken")) {
        setAuthenticated(false);
        setCurrentUser(null);
      }
      return false;
    }
  }


  const workflowActions = {
    onCreateApplication: (data) => runWorkflowAction(() => api.createApplication(data)),
    onUpdateApplication: (id, data) => runWorkflowAction(() => api.updateApplication(id, data)),
    onCreateInterview: (data) => runWorkflowAction(() => api.createInterview(data)),
    onUpdateInterview: (id, data) => runWorkflowAction(() => api.updateInterview(id, data)),
    onCreateOffer: (data) => runWorkflowAction(() => api.createOffer(data)),
    onUpdateOffer: (id, data) => runWorkflowAction(() => api.updateOffer(id, data)),
  };


  async function handleCandidateSubmit(e) {

    e.preventDefault();
    setError("");

    try {
      await api.createCandidate(candidateForm);

      setCandidateForm({
        full_name: "",
        email: "",
        phone: "",
        location: "",
        skills: "",
        experience_years: 0,
        resume_url: ""
      });

      setShowForm(false);
      await loadData();

    } catch (err) {
      setError(err.message);
    }
  }


  async function handleJobSubmit(e) {

    e.preventDefault();
    setError("");

    try {
      await api.createJob({
        ...jobForm,
        salary_min: jobForm.salary_min || null,
        salary_max: jobForm.salary_max || null
      });

      setJobForm({
        title: "",
        department: "",
        location: "",
        employment_type: "FULL_TIME",
        description: "",
        requirements: "",
        salary_min: "",
        salary_max: "",
        status: "OPEN"
      });

      setShowForm(false);
      await loadData();

    } catch (err) {
      setError(err.message);
    }
  }


  async function deleteCandidate(id) {

    if (!window.confirm("Delete this candidate?")) return;

    try {
      await api.deleteCandidate(id);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }


  async function deleteJob(id) {

    if (!window.confirm("Delete this job?")) return;

    try {
      await api.deleteJob(id);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }


  const filteredCandidates = candidates.filter((candidate) =>
    `${candidate.full_name} ${candidate.email} ${candidate.skills}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredJobs = jobs.filter((job) =>
    `${job.title} ${job.department} ${job.location}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );


  function renderDashboard() {

    return (
      <>
        <div className="welcome-section">
          <div>
            <h1>Welcome to TalentFlow 👋</h1>
            <p>
              Here's what's happening with your recruitment today.
            </p>
          </div>

          <button className="primary-button" onClick={() => {
            setActivePage("Candidates");
            setShowForm(true);
          }}>
            <Plus size={18} />
            Add Candidate
          </button>
        </div>

        <div className="stats-grid">

          <StatCard
            title="Total Candidates"
            value={candidates.length}
            icon={Users}
            color="#E8EFFF"
            description="Registered candidates"
          />

          <StatCard
            title="Active Jobs"
            value={jobs.filter(j => j.status === "OPEN").length}
            icon={BriefcaseBusiness}
            color="#E4F8ED"
            description="Currently open positions"
          />

          <StatCard
            title="Applications"
            value={applications.length}
            icon={FileText}
            color="#FFF1DF"
            description="Total applications"
          />

          <StatCard
            title="Interviews"
            value={interviews.filter(i => i.status === "SCHEDULED").length}
            icon={CalendarDays}
            color="#F2EAFE"
            description="Scheduled interviews"
          />

        </div>

        <div className="content-card">
          <div className="section-heading">
            <div>
              <h3>Recent Candidates</h3>
              <p>Latest candidates registered in TalentFlow</p>
            </div>

            <button
              className="text-button"
              onClick={() => setActivePage("Candidates")}
            >
              View all
            </button>
          </div>

          {renderCandidateTable(candidates.slice(0, 5))}
        </div>

        <div className="content-card">
          <div className="section-heading">
            <div>
              <h3>Recent Job Openings</h3>
              <p>Latest recruitment opportunities</p>
            </div>

            <button
              className="text-button"
              onClick={() => setActivePage("Jobs")}
            >
              View all
            </button>
          </div>

          {renderJobTable(jobs.slice(0, 5))}
        </div>
      </>
    );
  }


  function renderCandidateTable(data) {

    if (!data.length) {
      return <div className="empty-state">No candidates found. Add your first candidate!</div>;
    }

    return (
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Email</th>
              <th>Location</th>
              <th>Experience</th>
              <th>Skills</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {data.map(candidate => (
              <tr key={candidate.id}>
                <td>
                  <strong>{candidate.full_name}</strong>
                </td>
                <td>{candidate.email}</td>
                <td>{candidate.location || "—"}</td>
                <td>{candidate.experience_years} years</td>
                <td>{candidate.skills || "—"}</td>
                <td>
                  <button
                    className="delete-button"
                    onClick={() => deleteCandidate(candidate.id)}
                    aria-label="Delete candidate"
                  >
                    <Trash2 size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }


  function renderJobTable(data) {

    if (!data.length) {
      return <div className="empty-state">No jobs available. Add a job opening!</div>;
    }

    return (
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Department</th>
              <th>Location</th>
              <th>Employment</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {data.map(job => (
              <tr key={job.id}>
                <td><strong>{job.title}</strong></td>
                <td>{job.department}</td>
                <td>{job.location || "—"}</td>
                <td>{job.employment_type.replace("_", " ")}</td>
                <td>
                  <span className={`status ${job.status.toLowerCase()}`}>
                    {job.status}
                  </span>
                </td>
                <td>
                  <button
                    className="delete-button"
                    onClick={() => deleteJob(job.id)}
                    aria-label="Delete job"
                  >
                    <Trash2 size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }


  function renderPage() {

    if (activePage === "Dashboard") {
      return renderDashboard();
    }


    if (activePage === "Candidates") {

      return (
        <div className="content-card">
          <div className="section-heading">
            <div>
              <h3>Candidate Management</h3>
              <p>Manage all registered candidates</p>
            </div>

            <button
              className="primary-button"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus size={18} />
              Add Candidate
            </button>
          </div>

          {showForm && (
            <form className="data-form" onSubmit={handleCandidateSubmit}>
              <h3>Add New Candidate</h3>

              <div className="form-grid">
                <input
                  placeholder="Full Name"
                  required
                  value={candidateForm.full_name}
                  onChange={e => setCandidateForm({
                    ...candidateForm,
                    full_name: e.target.value
                  })}
                />

                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  value={candidateForm.email}
                  onChange={e => setCandidateForm({
                    ...candidateForm,
                    email: e.target.value
                  })}
                />

                <input
                  placeholder="Phone Number"
                  value={candidateForm.phone}
                  onChange={e => setCandidateForm({
                    ...candidateForm,
                    phone: e.target.value
                  })}
                />

                <input
                  placeholder="Location"
                  value={candidateForm.location}
                  onChange={e => setCandidateForm({
                    ...candidateForm,
                    location: e.target.value
                  })}
                />

                <input
                  placeholder="Skills (e.g. Java, React, SQL)"
                  value={candidateForm.skills}
                  onChange={e => setCandidateForm({
                    ...candidateForm,
                    skills: e.target.value
                  })}
                />

                <input
                  type="number"
                  min="0"
                  max="60"
                  placeholder="Experience (years)"
                  value={candidateForm.experience_years}
                  onChange={e => setCandidateForm({
                    ...candidateForm,
                    experience_years: Number(e.target.value)
                  })}
                />

                <input
                  type="url"
                  placeholder="Resume URL (optional)"
                  value={candidateForm.resume_url}
                  onChange={e => setCandidateForm({
                    ...candidateForm,
                    resume_url: e.target.value
                  })}
                />
              </div>

              <button className="primary-button" type="submit">
                Save Candidate
              </button>
            </form>
          )}

          <div className="search-box">
            <Search size={18} />
            <input
              placeholder="Search candidates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {renderCandidateTable(filteredCandidates)}
        </div>
      );
    }


    if (activePage === "Jobs") {

      return (
        <div className="content-card">
          <div className="section-heading">
            <div>
              <h3>Job Management</h3>
              <p>Manage available job positions</p>
            </div>

            <button
              className="primary-button"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus size={18} />
              Add Job
            </button>
          </div>

          {showForm && (
            <form className="data-form" onSubmit={handleJobSubmit}>
              <h3>Create Job Opening</h3>

              <div className="form-grid">

                <input
                  placeholder="Job Title"
                  required
                  value={jobForm.title}
                  onChange={e => setJobForm({
                    ...jobForm, title: e.target.value
                  })}
                />

                <input
                  placeholder="Department"
                  required
                  value={jobForm.department}
                  onChange={e => setJobForm({
                    ...jobForm, department: e.target.value
                  })}
                />

                <input
                  placeholder="Location"
                  value={jobForm.location}
                  onChange={e => setJobForm({
                    ...jobForm, location: e.target.value
                  })}
                />

                <select
                  value={jobForm.employment_type}
                  onChange={e => setJobForm({
                    ...jobForm, employment_type: e.target.value
                  })}
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="CONTRACT">Contract</option>
                </select>

                <input
                  type="number"
                  min="0"
                  placeholder="Minimum Salary"
                  value={jobForm.salary_min}
                  onChange={e => setJobForm({
                    ...jobForm, salary_min: e.target.value
                  })}
                />

                <input
                  type="number"
                  min="0"
                  placeholder="Maximum Salary"
                  value={jobForm.salary_max}
                  onChange={e => setJobForm({
                    ...jobForm, salary_max: e.target.value
                  })}
                />

                <textarea
                  placeholder="Job Description"
                  required
                  value={jobForm.description}
                  onChange={e => setJobForm({
                    ...jobForm, description: e.target.value
                  })}
                />

                <textarea
                  placeholder="Requirements"
                  value={jobForm.requirements}
                  onChange={e => setJobForm({
                    ...jobForm, requirements: e.target.value
                  })}
                />

              </div>

              <button className="primary-button" type="submit">
                Save Job
              </button>
            </form>
          )}

          <div className="search-box">
            <Search size={18} />
            <input
              placeholder="Search jobs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {renderJobTable(filteredJobs)}
        </div>
      );
    }


    if (["Applications", "Interviews", "Offers"].includes(activePage)) {
      return (
        <WorkflowPage
          page={activePage}
          candidates={candidates}
          jobs={jobs}
          applications={applications}
          interviews={interviews}
          offers={offers}
          {...workflowActions}
        />
      );
    }

    const pageData = {
      Applications: {
        data: applications,
        title: "Applications",
        description: "Track candidate applications",
        icon: FileText
      },
      Interviews: {
        data: interviews,
        title: "Interviews",
        description: "Manage scheduled interviews",
        icon: CalendarDays
      },
      Offers: {
        data: offers,
        title: "Offers",
        description: "Manage candidate job offers",
        icon: CheckCircle2
      }
    };

    const current = pageData[activePage];

    return (
      <div className="content-card">
        <div className="section-heading">
          <div>
            <h3>{current.title}</h3>
            <p>{current.description}</p>
          </div>
        </div>

        {!current.data.length ? (
          <div className="empty-state">
            No {activePage.toLowerCase()} available yet.
          </div>
        ) : (
          <div className="record-list">
            {current.data.map(item => (
              <div className="record-row" key={item.id}>
                <div className="record-icon">
                  <current.icon size={20} />
                </div>

                <div className="record-details">
                  <strong>
                    {activePage === "Applications"
                      ? `${item.candidate_name} – ${item.job_title}`
                      : activePage === "Interviews"
                        ? item.interviewer
                        : `Application #${item.application}`}
                  </strong>

                  <span>
                    {activePage === "Applications"
                      ? `Applied: ${new Date(item.applied_at).toLocaleDateString()}`
                      : activePage === "Interviews"
                        ? new Date(item.scheduled_at).toLocaleString()
                        : `Offered CTC: ${item.offered_ctc}`}
                  </span>
                </div>

                <span className="status">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }


  if (!authenticated) {
    return <Login onLogin={handleLogin} error={error} />;
  }

  return (
    <div className="app-layout">

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <main className="main-content">

        <Header
          title={activePage}
          onMenuClick={() => setSidebarOpen(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <div className="page-content">

          {error && (
            <div className="error-message">
              <span>{error}</span>
              <button onClick={() => setError("")}>Dismiss</button>
            </div>
          )}

          <div className="page-toolbar">
            <span>Workspace / {activePage}</span>

            <button
              className="refresh-button"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <RefreshCw className="spin" size={25} />
              Loading TalentFlow data...
            </div>
          ) : (
            renderPage()
          )}

        </div>

        <footer>
          © 2026 TalentFlow. Recruitment Management Platform.
        </footer>

      </main>
    </div>
  );
}

export default App;
