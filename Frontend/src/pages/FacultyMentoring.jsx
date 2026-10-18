import { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

const API_ROOT = `${API_BASE_URL}/api/faculty/mentoring`;
const REPORT_FIELDS = [
  ["topicsDiscussed", "Topics discussed"],
  ["academicProgress", "Academic progress"],
  ["careerGuidance", "Career guidance"],
  ["achievementsProgress", "Achievements and portfolio progress"],
  ["challenges", "Challenges and support needed"],
  ["recommendations", "Recommendations"],
  ["nextSteps", "Next steps"],
  ["shortTermGoals", "Short-term goals"],
  ["longTermGoals", "Long-term goals"],
  ["developmentActivities", "Development activities"],
  ["followUpPlan", "Follow-up plan"]
];

async function requestJson(url, options = {}) {
  const response = await fetch(url, { credentials: "include", ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "The request failed.");
  return data;
}

function FacultyMentoring() {
  return (
    <>
      <nav className="faculty-action-buttons mentoring-tabs" aria-label="Mentoring pages">
        <Link className="secondary-button" to="/faculty/mentoring">My Mentees</Link>
        <Link className="secondary-button" to="/faculty/mentoring/find-students">Find Students</Link>
        <Link className="verify-button faculty-link-button" to="/faculty/mentoring/schedule">Schedule Session</Link>
      </nav>
      <Routes>
        <Route index element={<AssignedStudents />} />
        <Route path="find-students" element={<FindStudents />} />
        <Route path="history" element={<PastMentoringHistory />} />
        <Route path="students/:studentId" element={<MentoringStudent />} />
        <Route path="schedule" element={<NewMentoringSession />} />
        <Route path="students/:studentId/new-session" element={<NewMentoringSession />} />
        <Route path="sessions/:sessionId" element={<MentoringSessionDetail />} />
      </Routes>
    </>
  );

}

function AssignedStudents() {
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ departments: [], branches: [], sections: [], academicYears: [], semesters: [] });
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (search.trim()) query.set("search", search.trim());
    if (department) query.set("department", department);
    if (branch) query.set("branch", branch);
    if (section) query.set("section", section);
    if (academicYear) query.set("currentAcademicYear", academicYear);
    if (semester) query.set("semester", semester);
    setLoading(true);
    requestJson(`${API_ROOT}/students?${query}`)
      .then((data) => {
        setStudents(data.students || []);
        setFilters(data.filters || { departments: [], branches: [], sections: [], academicYears: [], semesters: [] });
        setPagination(data.pagination || { total: 0, totalPages: 0 });
        setError("");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [page, search, department, branch, section, academicYear, semester, refresh]);

  const endMentoring = async (student) => {
    const name = student.profile?.fullName || student.fullName || student.username;
    if (!window.confirm(`End your mentoring relationship with ${name}? Historical sessions and records will be preserved.`)) return;
    setProcessing(student._id);
    setError("");
    setMessage("");
    try {
      const result = await requestJson(`${API_ROOT}/mentees/${student._id}`, { method: "PATCH" });
      setRefresh((value) => value + 1);
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setProcessing("");
    }
  };

  const update = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <section className="admin-users-panel">
      <div className="admin-section-heading">
        <div><h2>My Mentees</h2><p>{pagination.total} active mentoring relationships. Each student may work with multiple faculty mentors.</p><p><Link to="/faculty/mentoring/history">View past assignment session history</Link></p></div>
      </div>
      <div className="admin-filters">
        <div className="field"><label htmlFor="mentoring-search">Search name, roll number, or email</label><input id="mentoring-search" value={search} onChange={update(setSearch)} placeholder="Search my mentees" /></div>
        <Filter id="mentoring-department" label="Department" value={department} options={filters.departments} onChange={update(setDepartment)} />
        <Filter id="mentoring-branch" label="Branch" value={branch} options={filters.branches} onChange={update(setBranch)} />
        <Filter id="mentoring-section" label="Section" value={section} options={filters.sections} onChange={update(setSection)} />
        <Filter id="mentoring-year" label="Academic year" value={academicYear} options={filters.academicYears} onChange={update(setAcademicYear)} />
        <Filter id="mentoring-semester" label="Semester" value={semester} options={filters.semesters} onChange={update(setSemester)} />
      </div>
      {error && <p className="message error-message">{error}</p>}
      {message && <p className="message">{message}</p>}
      {loading ? <div className="empty"><h3>Loading mentees...</h3></div> : students.length === 0 ? (
        <div className="empty"><h3>No active mentees yet.</h3><p><Link to="/faculty/mentoring/find-students">Find a student to start mentoring.</Link></p></div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Student</th><th>Roll number</th><th>Program</th><th>Sessions</th><th>Pending actions</th><th>Last completed</th><th>Next session</th><th>Actions</th></tr></thead>
              <tbody>{students.map((student) => (
                <tr key={student._id}>
                  <td>{student.profile?.fullName || student.fullName || student.username}<br /><small>{student.email}</small></td>
                  <td>{student.profile?.rollNumber || "—"}</td>
                  <td>{[student.profile?.department, student.profile?.branch, student.profile?.section && `Section ${student.profile.section}`].filter(Boolean).join(" · ") || "—"}</td>
                  <td>{student.mentoring?.sessionCount || 0} total<br /><small>{student.mentoring?.completedCount || 0} completed</small></td>
                  <td>{student.mentoring?.pendingActionItems || 0}</td>
                  <td>{formatDate(student.mentoring?.lastSessionAt)}</td>
                  <td>{formatDate(student.mentoring?.nextSession)}</td>
                  <td><Link to={`/faculty/mentoring/students/${student._id}`}>Open profile</Link><br /><button type="button" className="secondary-button" disabled={processing === student._id} onClick={() => endMentoring(student)}>{processing === student._id ? "Ending..." : "End mentoring"}</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <Pagination page={page} pagination={pagination} setPage={setPage} />
        </>
      )}
    </section>
  );
}

function PastMentoringHistory() {
  const [sessions, setSessions] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    requestJson(`${API_ROOT}/history?page=${page}&limit=20`)
      .then((data) => {
        setSessions(data.sessions || []);
        setPagination(data.pagination || { total: 0, totalPages: 0 });
        setError("");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <section className="admin-users-panel">
      <div className="admin-section-heading"><div><p><Link to="/faculty/mentoring">← Current mentoring students</Link></p><h2>Past assignment history</h2><p>Read-only session records from students who are no longer assigned to you. Ending an assignment does not erase its mentoring history.</p></div></div>
      {error && <p className="message error-message">{error}</p>}
      {loading ? <div className="empty"><h3>Loading past session history...</h3></div> : sessions.length === 0 ? <div className="empty"><h3>No sessions from ended assignments.</h3></div> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Student</th><th>Session</th><th>Session date</th><th>Status</th><th>Assignment ended</th><th>Record</th></tr></thead>
              <tbody>{sessions.map((session) => <tr key={session._id}>
                <td>{session.student?.fullName || session.student?.username}<br /><small>{session.student?.email}</small></td>
                <td>{session.title}</td>
                <td>{formatDate(session.scheduledAt, true)}</td>
                <td><span className={`status-badge ${session.status}`}>{session.status}</span></td>
                <td>{formatDate(session.endedAssignmentAt)}</td>
                <td><Link to={`/faculty/mentoring/sessions/${session._id}`}>View read-only report</Link></td>
              </tr>)}</tbody>
            </table>
          </div>
          <Pagination page={page} pagination={pagination} setPage={setPage} />
        </>
      )}
    </section>
  );
}

function FindStudents() {
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ departments: [], branches: [], sections: [], academicYears: [], semesters: [] });
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (search.trim()) query.set("search", search.trim());
    if (department) query.set("department", department);
    if (branch) query.set("branch", branch);
    if (section) query.set("section", section);
    if (academicYear) query.set("currentAcademicYear", academicYear);
    if (semester) query.set("semester", semester);
    setLoading(true);
    requestJson(`${API_ROOT}/students/search?${query}`)
      .then((data) => {
        setStudents(data.students || []);
        setFilters(data.filters || { departments: [], branches: [], sections: [], academicYears: [], semesters: [] });
        setPagination(data.pagination || { total: 0, totalPages: 0 });
        setError("");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [page, search, department, branch, section, academicYear, semester, refresh]);

  const update = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  const startMentoring = async (student) => {
    setProcessing(student._id);
    setError("");
    setMessage("");
    try {
      const result = await requestJson(`${API_ROOT}/mentees/${student._id}`, { method: "POST" });
      setMessage(result.message);
      setRefresh((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setProcessing("");
    }
  };

  return (
    <section className="admin-users-panel">
      <div className="admin-section-heading"><div><h2>Find students</h2><p>Search registered students in your institution and start mentoring independently. Students can have more than one faculty mentor.</p></div></div>
      <div className="admin-filters">
        <div className="field"><label htmlFor="mentoring-search-students">Search name, roll number, or email</label><input id="mentoring-search-students" value={search} onChange={update(setSearch)} placeholder="Find students" /></div>
        <Filter id="find-department" label="Department" value={department} options={filters.departments} onChange={update(setDepartment)} />
        <Filter id="find-branch" label="Branch" value={branch} options={filters.branches} onChange={update(setBranch)} />
        <Filter id="find-section" label="Section" value={section} options={filters.sections} onChange={update(setSection)} />
        <Filter id="find-year" label="Academic year" value={academicYear} options={filters.academicYears} onChange={update(setAcademicYear)} />
        <Filter id="find-semester" label="Semester" value={semester} options={filters.semesters} onChange={update(setSemester)} />
      </div>
      {error && <p className="message error-message">{error}</p>}
      {message && <p className="message">{message}</p>}
      {loading ? <div className="empty"><h3>Loading students...</h3></div> : students.length === 0 ? (
        <div className="empty"><h3>No students match these filters.</h3></div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Student</th><th>Roll number</th><th>Department</th><th>Branch</th><th>Section</th><th>Year / semester</th><th>Mentoring</th></tr></thead>
              <tbody>{students.map((student) => (
                <tr key={student._id}>
                  <td>{student.profile?.fullName || student.fullName || student.username}<br /><small>{student.email}</small></td>
                  <td>{student.profile?.rollNumber || "—"}</td>
                  <td>{student.profile?.department || "—"}</td>
                  <td>{student.profile?.branch || "—"}</td>
                  <td>{student.profile?.section || "—"}</td>
                  <td>{[student.profile?.currentAcademicYear, student.profile?.currentSemester && `Semester ${student.profile.currentSemester}`].filter(Boolean).join(" · ") || "—"}</td>
                  <td>{student.relationship
                    ? <><span className="status-badge completed">Already mentoring</span><br /><Link to={`/faculty/mentoring/students/${student._id}`}>Open profile</Link></>
                    : <button type="button" className="verify-button" disabled={Boolean(processing)} onClick={() => startMentoring(student)}>{processing === student._id ? "Starting..." : "Start mentoring"}</button>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <Pagination page={page} pagination={pagination} setPage={setPage} />
        </>
      )}
    </section>
  );
}

function MentoringStudent() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      requestJson(`${API_ROOT}/students/${studentId}`),
      requestJson(`${API_ROOT}/students/${studentId}/sessions?page=${page}&limit=20`),
      requestJson(`${API_BASE_URL}/api/faculty/students/${studentId}/certificates?limit=100`)
    ])
      .then(([studentData, sessionData, certificateData]) => {
        setData(studentData);
        setSessions(sessionData.sessions || []);
        setCertificates(certificateData.certificates || []);
        setTotalPages(sessionData.pagination?.totalPages || 1);
        setError("");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [studentId, page]);

  if (loading) return <div className="empty"><h3>Loading mentoring profile...</h3></div>;
  if (error) return <section className="admin-users-panel"><p className="message error-message">{error}</p><Link to="/faculty/mentoring">Back to assigned students</Link></section>;
  const student = data?.student;
  const profile = student?.profile;
  const summary = data?.summary || {};
  const endMentoring = async () => {
    if (!window.confirm("End this mentoring relationship? All session history will be preserved.")) return;
    setEnding(true);
    setError("");
    try {
      await requestJson(`${API_ROOT}/mentees/${studentId}`, { method: "PATCH" });
      navigate("/faculty/mentoring");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setEnding(false);
    }
  };

  return (
    <section className="admin-users-panel">
      <div className="admin-section-heading">
        <div><p><Link to="/faculty/mentoring">← My Mentees</Link></p><h2>{profile?.fullName || student?.fullName || student?.username}</h2><p>{student?.email} · Mentoring since {formatDate(student?.assignedAt)}</p></div>
        <div className="faculty-action-buttons"><Link className="verify-button faculty-link-button" to={`/faculty/mentoring/students/${studentId}/new-session`}>Schedule session</Link><button className="reject-button" type="button" disabled={ending} onClick={endMentoring}>{ending ? "Ending..." : "End mentoring"}</button></div>
      </div>
      <section className="faculty-card">
        <h3>Achievements and certificates</h3>
        {!certificates.length ? <p>No student achievements or certificates are available.</p> : (
          <div className="mentoring-achievement-list">{certificates.map((achievement) => (
            <article key={achievement._id}>
              <h4>{achievement.title}</h4>
              <p>{achievement.type} · {achievement.organization} · {formatDate(achievement.date)}</p>
              <span className={`status-badge ${achievement.verificationStatus || "pending"}`}>{achievement.verificationStatus || "pending"}</span>
              {achievement.certificateUrl && <p><a href={achievement.certificateUrl} target="_blank" rel="noreferrer">View certificate</a></p>}
            </article>
          ))}</div>
        )}
      </section>
      <div className="admin-detail-grid">
        <DetailGroup title="Academic profile" items={[
          ["Roll number", profile?.rollNumber], ["Institution", profile?.institution], ["Degree", profile?.degree],
          ["Department", profile?.department], ["Branch", profile?.branch], ["Academic year", profile?.currentAcademicYear],
          ["Semester", profile?.currentSemester], ["Section", profile?.section], ["CGPA", profile?.cgpa]
        ]} />
        <DetailGroup title="Mentoring summary" items={[
          ["Sessions", summary.totalSessions], ["Completed", summary.completedSessions],
          ["Upcoming", summary.upcomingSessions], ["Most recent session", summary.mostRecentSession?.title],
          ["Recent session date", formatDate(summary.mostRecentSession?.scheduledAt)]
        ]} />
      </div>
      <section className="faculty-card">
        <h3>Outstanding action items</h3>
        {!summary.outstandingActionItems?.length ? <p>No outstanding action items.</p> : (
          <ul>{summary.outstandingActionItems.map((item) => (
            <li key={`${item.sessionId}-${item._id}`}><Link to={`/faculty/mentoring/sessions/${item.sessionId}`}>{item.description}</Link> — {item.responsible}, due {formatDate(item.dueAt)}{item.dueAt && new Date(item.dueAt) < new Date() ? " (overdue)" : ""}</li>
          ))}</ul>
        )}
      </section>
      <section className="faculty-card">
        <h3>Follow-ups</h3>
        {!summary.overdueFollowUps?.length && !summary.upcomingFollowUps?.length ? <p>No follow-ups are scheduled.</p> : (
          <ul>
            {summary.overdueFollowUps?.map((session) => <li key={`overdue-${session._id}`}><Link to={`/faculty/mentoring/sessions/${session._id}`}>{session.title}</Link> — overdue since {formatDate(session.followUpAt)}</li>)}
            {summary.upcomingFollowUps?.map((session) => <li key={`upcoming-${session._id}`}><Link to={`/faculty/mentoring/sessions/${session._id}`}>{session.title}</Link> — due {formatDate(session.followUpAt)}</li>)}
          </ul>
        )}
        {summary.upcomingSessionDetails?.length > 0 && <p><strong>Next session:</strong> {summary.upcomingSessionDetails.map((session) => <span key={session._id}><Link to={`/faculty/mentoring/sessions/${session._id}`}>{session.title}</Link> ({formatDate(session.scheduledAt, true)}) </span>)}</p>}
      </section>
      {summary.currentGoals && <section className="faculty-card"><h3>Current goals</h3><p><strong>Short term:</strong> {summary.currentGoals.shortTermGoals || "—"}</p><p><strong>Long term:</strong> {summary.currentGoals.longTermGoals || "—"}</p><p><strong>Development activities:</strong> {summary.currentGoals.developmentActivities || "—"}</p></section>}
      <section className="faculty-card">
        <h3>Session history</h3>
        {!sessions.length ? <p>No mentoring sessions have been recorded yet.</p> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Session</th><th>Date</th><th>Status</th><th>Follow-up</th><th>Actions</th></tr></thead>
              <tbody>{sessions.map((session) => (
                <tr key={session._id}><td>{session.title}</td><td>{formatDate(session.scheduledAt, true)}</td><td><span className={`status-badge ${session.status}`}>{session.status}</span></td><td>{formatDate(session.followUpAt)}</td><td><Link to={`/faculty/mentoring/sessions/${session._id}`}>View report</Link></td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && <Pagination page={page} pagination={{ totalPages }} setPage={setPage} />}
      </section>
    </section>
  );
}

function NewMentoringSession() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || "");
  const [form, setForm] = useState({ title: "", scheduledAt: "", endsAt: "", type: "online", meetingUrl: "", location: "", agenda: "", initialNotes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  useEffect(() => {
    setSelectedStudentId(studentId || "");
    if (!studentId) {
      requestJson(`${API_ROOT}/students?limit=100`)
        .then((data) => setStudents(data.students || []))
        .catch((requestError) => setError(requestError.message));
    }
  }, [studentId]);

  const submit = async (event) => {
    event.preventDefault();
    if (!selectedStudentId) {
      setError("Choose a current mentee before scheduling.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const start = new Date(form.scheduledAt);
      const end = form.endsAt ? new Date(form.endsAt) : null;
      if (Number.isNaN(start.getTime()) || (end && (Number.isNaN(end.getTime()) || end <= start))) {
        throw new Error("Session end time must be later than its valid start time.");
      }
      const result = await requestJson(`${API_ROOT}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, studentId: selectedStudentId, scheduledAt: start.toISOString(), endsAt: end ? end.toISOString() : null })
      });
      if (result.conflicts?.length) {
        window.alert(`Scheduling warning: this overlaps ${result.conflicts.map((conflict) => conflict.title).join(", ")}.`);
      }
      navigate(`/faculty/mentoring/sessions/${result.session._id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-users-panel">
      <div className="admin-section-heading"><div><p><Link to={studentId ? `/faculty/mentoring/students/${studentId}` : "/faculty/mentoring"}>← {studentId ? "Student mentoring profile" : "My Mentees"}</Link></p><h2>Schedule mentoring session</h2><p>Only you can access faculty-only notes. The student sees only the summary, goals, and action items you explicitly share.</p></div></div>
      {error && <p className="message error-message">{error}</p>}
      <form className="faculty-card mentoring-form" onSubmit={submit}>
        {!studentId && <div className="field"><label htmlFor="session-student">Student</label><select id="session-student" required value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}><option value="">Select a mentee</option>{students.map((student) => <option key={student._id} value={student._id}>{student.profile?.fullName || student.fullName || student.username}{student.profile?.rollNumber ? ` · ${student.profile.rollNumber}` : ""}</option>)}</select></div>}
        <div className="field"><label htmlFor="session-title">Session title</label><input id="session-title" required maxLength="200" value={form.title} onChange={update("title")} /></div>
        <div className="field"><label htmlFor="session-start">Start date and time</label><input id="session-start" type="datetime-local" required value={form.scheduledAt} onChange={update("scheduledAt")} /></div>
        <div className="field"><label htmlFor="session-end">End date and time</label><input id="session-end" type="datetime-local" min={form.scheduledAt} required value={form.endsAt} onChange={update("endsAt")} /></div>
        <div className="field"><label htmlFor="session-type">Session type</label><select id="session-type" required value={form.type} onChange={update("type")}><option value="in_person">In person</option><option value="online">Online</option><option value="other">Other</option></select></div>
        {form.type === "online"
          ? <div className="field"><label htmlFor="session-meeting-url">Meeting link</label><input id="session-meeting-url" type="url" required maxLength="2048" value={form.meetingUrl} onChange={update("meetingUrl")} placeholder="https://..." /></div>
          : <div className="field"><label htmlFor="session-location">{form.type === "in_person" ? "Location or venue" : "Format and joining instructions"}</label><input id="session-location" required={form.type === "in_person"} maxLength="500" value={form.location} onChange={update("location")} placeholder={form.type === "in_person" ? "Room, office, or laboratory" : "Describe the format or instructions"} /></div>}
        <div className="field"><label htmlFor="session-agenda">Agenda or purpose</label><textarea id="session-agenda" rows="4" required maxLength="5000" value={form.agenda} onChange={update("agenda")} /></div>
        <div className="field"><label htmlFor="session-initial-notes">Private preparation notes</label><textarea id="session-initial-notes" rows="4" maxLength="10000" value={form.initialNotes} onChange={update("initialNotes")} /></div>
        <button className="verify-button" disabled={saving}>{saving ? "Scheduling..." : "Schedule session"}</button>
      </form>
    </section>
  );
}

function MentoringSessionDetail() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [report, setReport] = useState({});
  const [newAction, setNewAction] = useState({ description: "", responsible: "student", dueAt: "", shareWithStudent: false });
  const [newGoal, setNewGoal] = useState({ title: "", description: "", targetDate: "", timeframe: "short_term", shareWithStudent: false });
  const [schedule, setSchedule] = useState(null);

  const load = () => requestJson(`${API_ROOT}/sessions/${sessionId}`).then(({ session: loaded }) => {
    setSession(loaded);
    setReport({ ...(loaded.report || {}), sharedSummary: loaded.sharedSummary || "", followUpAt: toLocalDateTime(loaded.followUpAt) });
    setSchedule({
      title: loaded.title,
      scheduledAt: toLocalDateTime(loaded.scheduledAt),
      endsAt: toLocalDateTime(loaded.endsAt),
      type: loaded.type,
      meetingUrl: loaded.meetingUrl || "",
      location: loaded.location || "",
      agenda: loaded.agenda || "",
      initialNotes: loaded.initialNotes || ""
    });
  });

  useEffect(() => {
    setLoading(true);
    load()
      .then(() => setError(""))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const updateReport = (field) => (event) => setReport((current) => ({ ...current, [field]: event.target.value }));
  const updateSchedule = (field) => (event) => setSchedule((current) => ({ ...current, [field]: event.target.value }));
  const save = async (url, body, successMessage, method = "PATCH") => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await requestJson(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      await load();
      setMessage(result.conflicts?.length
        ? `${successMessage} Scheduling warning: overlaps ${result.conflicts.map((conflict) => conflict.title).join(", ")}.`
        : successMessage);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty"><h3>Loading mentoring session...</h3></div>;
  if (error && !session) return <section className="admin-users-panel"><p className="message error-message">{error}</p><Link to="/faculty/mentoring">Back to mentoring</Link></section>;
  if (!session) return null;
  const student = session.student;
  const canManage = ["scheduled", "rescheduled"].includes(session.status);
  const hasAssignment = session.canManage === true;

  const saveReport = (event) => {
    event.preventDefault();
    const actionItems = newAction.description.trim() ? [{
      ...newAction,
      dueAt: newAction.dueAt ? new Date(newAction.dueAt).toISOString() : null
    }] : [];
    const body = { ...report, followUpAt: report.followUpAt ? new Date(report.followUpAt).toISOString() : null, actionItems };
    if (event.nativeEvent.submitter?.value === "complete") {
      if (!window.confirm("Save this report and mark the session as completed?")) return;
      body.confirmComplete = true;
    }
    save(`${API_ROOT}/sessions/${sessionId}/report`, body, body.confirmComplete ? "Report saved and session completed." : "Report saved.")
      .then((saved) => {
        if (saved) setNewAction({ description: "", responsible: "student", dueAt: "", shareWithStudent: false });
      });
  };

  const reschedule = (event) => {
    event.preventDefault();
    if (!window.confirm("Save the schedule changes for this session?")) return;
    save(`${API_ROOT}/sessions/${sessionId}`, {
      ...schedule,
      scheduledAt: new Date(schedule.scheduledAt).toISOString(),
      endsAt: schedule.endsAt ? new Date(schedule.endsAt).toISOString() : null
    }, "Session details updated.");
  };

  const updateAction = (actionItemId, update) => save(
    `${API_ROOT}/sessions/${sessionId}/action-items/${actionItemId}`,
    typeof update === "string" ? { status: update } : update,
    "Action item updated."
  );

  const addGoal = (event) => {
    event?.preventDefault();
    if (!newGoal.title.trim()) {
      setError("Goal title is required.");
      return;
    }
    const body = {
      ...newGoal,
      targetDate: newGoal.targetDate ? new Date(`${newGoal.targetDate}T12:00:00`).toISOString() : null
    };
    save(`${API_ROOT}/sessions/${sessionId}/goals`, body, "Goal created.", "POST")
      .then((saved) => {
        if (saved) setNewGoal({ title: "", description: "", targetDate: "", timeframe: "short_term", shareWithStudent: false });
      });
  };

  const updateGoal = (goalId, updates) => save(
    `${API_ROOT}/sessions/${sessionId}/goals/${goalId}`,
    updates,
    "Goal updated."
  );

  const cancel = () => {
    if (!window.confirm("Cancel this mentoring session? Its record and history will be retained.")) return;
    save(`${API_ROOT}/sessions/${sessionId}/cancel`, {}, "Session cancelled.");
  };

  return (
    <section className="admin-users-panel">
      <div className="admin-section-heading">
        <div><p><Link to={hasAssignment ? `/faculty/mentoring/students/${student?._id}` : "/faculty/mentoring/history"}>← {hasAssignment ? (student?.fullName || student?.username || "Student profile") : "Past assignment history"}</Link></p><h2>{session.title}</h2><p>{formatDate(session.scheduledAt, true)} · {session.type?.replace("_", " ")} · <span className={`status-badge ${session.status}`}>{session.status}</span></p></div>
      </div>
      {error && <p className="message error-message">{error}</p>}
      {message && <p className="message">{message}</p>}
      {!hasAssignment && <p className="message">This assignment has ended. The session record is available in read-only mode.</p>}
      <div className="faculty-card mentoring-session-info">
        {session.type === "online" && session.meetingUrl && <p><strong>Meeting link:</strong> <a href={session.meetingUrl} target="_blank" rel="noreferrer">{session.meetingUrl}</a></p>}
        {session.type !== "online" && <p><strong>{session.type === "in_person" ? "Location" : "Format and instructions"}:</strong> {session.location || "Not specified"}</p>}
        <p><strong>Agenda:</strong> {session.agenda || "Not specified"}</p>
        {session.initialNotes && <p><strong>Private preparation notes:</strong> {session.initialNotes}</p>}
        {session.scheduleHistory?.length > 0 && <details><summary>Schedule history</summary><ul>{session.scheduleHistory.map((entry, index) => <li key={`${entry.changedAt}-${index}`}>{formatDate(entry.scheduledAt, true)} ({entry.status})</li>)}</ul></details>}
      </div>
      {hasAssignment && canManage && (
        <>
          <details className="faculty-card">
            <summary>Reschedule or edit session details</summary>
            <form className="mentoring-form" onSubmit={reschedule}>
              <div className="field"><label htmlFor="edit-session-title">Session title</label><input id="edit-session-title" required value={schedule.title} onChange={updateSchedule("title")} /></div>
              <div className="field"><label htmlFor="edit-session-start">Start date and time</label><input id="edit-session-start" type="datetime-local" required value={schedule.scheduledAt} onChange={updateSchedule("scheduledAt")} /></div>
              <div className="field"><label htmlFor="edit-session-end">End date and time</label><input id="edit-session-end" type="datetime-local" min={schedule.scheduledAt} required value={schedule.endsAt} onChange={updateSchedule("endsAt")} /></div>
              <div className="field"><label htmlFor="edit-session-type">Type</label><select id="edit-session-type" value={schedule.type} onChange={updateSchedule("type")}><option value="in_person">In person</option><option value="online">Online</option><option value="other">Other</option></select></div>
              {schedule.type === "online"
                ? <div className="field"><label htmlFor="edit-session-meeting-url">Meeting link</label><input id="edit-session-meeting-url" type="url" required value={schedule.meetingUrl} onChange={updateSchedule("meetingUrl")} /></div>
                : <div className="field"><label htmlFor="edit-session-location">{schedule.type === "in_person" ? "Location" : "Format and instructions"}</label><input id="edit-session-location" required={schedule.type === "in_person"} value={schedule.location} onChange={updateSchedule("location")} /></div>}
              <div className="field"><label htmlFor="edit-session-agenda">Agenda</label><textarea id="edit-session-agenda" rows="3" value={schedule.agenda} onChange={updateSchedule("agenda")} /></div>
              <div className="field"><label htmlFor="edit-session-notes">Private preparation notes</label><textarea id="edit-session-notes" rows="3" value={schedule.initialNotes} onChange={updateSchedule("initialNotes")} /></div>
              <button className="verify-button" disabled={saving}>Save session changes</button>
            </form>
          </details>
          <button className="reject-button" type="button" disabled={saving} onClick={cancel}>Cancel session</button>
        </>
      )}
      {hasAssignment && session.status !== "cancelled" ? <form className="faculty-card mentoring-form" onSubmit={saveReport}>
        <h3>Mentoring report (faculty-only)</h3>
        <div className="field"><label htmlFor="report-shared-summary">Session summary shared with student</label><textarea id="report-shared-summary" rows="4" value={report.sharedSummary || ""} onChange={updateReport("sharedSummary")} /></div>
        {REPORT_FIELDS.map(([field, label]) => (
          <div className="field" key={field}><label htmlFor={`report-${field}`}>{label}</label><textarea id={`report-${field}`} rows="3" value={report[field] || ""} onChange={updateReport(field)} /></div>
        ))}
        <div className="field"><label htmlFor="report-follow-up">Follow-up date</label><input id="report-follow-up" type="datetime-local" value={report.followUpAt || ""} onChange={updateReport("followUpAt")} /></div>
        <h4>Add action item</h4>
        <div className="field"><label htmlFor="action-description">Action description</label><input id="action-description" value={newAction.description} onChange={(event) => setNewAction((current) => ({ ...current, description: event.target.value }))} /></div>
        <div className="field"><label htmlFor="action-owner">Responsible party</label><select id="action-owner" value={newAction.responsible} onChange={(event) => setNewAction((current) => ({ ...current, responsible: event.target.value }))}><option value="student">Student</option><option value="faculty">Faculty</option></select></div>
        <div className="field"><label htmlFor="action-due">Due date (optional)</label><input id="action-due" type="datetime-local" value={newAction.dueAt} onChange={(event) => setNewAction((current) => ({ ...current, dueAt: event.target.value }))} /></div>
        <div className="field"><label><input type="checkbox" checked={newAction.shareWithStudent} onChange={(event) => setNewAction((current) => ({ ...current, shareWithStudent: event.target.checked }))} /> Share this action item with the student</label></div>
        <h4>Goals</h4>
        {session.goals?.map((goal) => (
          <div className="student-goal" key={goal._id}>
            <strong>{goal.title}</strong>{goal.description && <p>{goal.description}</p>}
            <label>Status <select value={goal.status} disabled={saving} onChange={(event) => updateGoal(goal._id, { status: event.target.value })}><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></label>
            <label htmlFor={`goal-progress-${goal._id}`}>Progress notes</label><textarea id={`goal-progress-${goal._id}`} defaultValue={goal.progressNotes || ""} rows="2" onBlur={(event) => {
              if (event.currentTarget.value !== (goal.progressNotes || "")) updateGoal(goal._id, { progressNotes: event.currentTarget.value });
            }} />
            <label><input type="checkbox" checked={goal.shareWithStudent} disabled={saving} onChange={(event) => updateGoal(goal._id, { shareWithStudent: event.target.checked })} /> Share with student</label>
          </div>
        ))}
        <div className="mentoring-form">
          <div className="field"><label htmlFor="goal-title">New goal title</label><input id="goal-title" required maxLength="200" value={newGoal.title} onChange={(event) => setNewGoal((current) => ({ ...current, title: event.target.value }))} /></div>
          <div className="field"><label htmlFor="goal-description">Goal description</label><textarea id="goal-description" value={newGoal.description} onChange={(event) => setNewGoal((current) => ({ ...current, description: event.target.value }))} /></div>
          <div className="field"><label htmlFor="goal-timeframe">Goal timeframe</label><select id="goal-timeframe" value={newGoal.timeframe} onChange={(event) => setNewGoal((current) => ({ ...current, timeframe: event.target.value }))}><option value="short_term">Short term</option><option value="long_term">Long term</option></select></div>
          <div className="field"><label htmlFor="goal-target">Target date</label><input id="goal-target" type="date" value={newGoal.targetDate} onChange={(event) => setNewGoal((current) => ({ ...current, targetDate: event.target.value }))} /></div>
          <div className="field"><label><input type="checkbox" checked={newGoal.shareWithStudent} onChange={(event) => setNewGoal((current) => ({ ...current, shareWithStudent: event.target.checked }))} /> Share this goal with the student</label></div>
          <button className="secondary-button" type="button" disabled={saving} onClick={addGoal}>Add goal</button>
        </div>
        {session.actionItems?.length > 0 && <div><h4>Action items</h4><ul>{session.actionItems.map((item) => (
          <li key={item._id}>{item.description} — {item.responsible}, due {formatDate(item.dueAt)}; {item.status !== "completed" ? <select aria-label={`Status for ${item.description}`} value={item.status} disabled={saving} onChange={(event) => updateAction(item._id, event.target.value)}><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select> : <span> completed {formatDate(item.completedAt)}</span>} <label><input type="checkbox" checked={item.shareWithStudent} disabled={saving} onChange={(event) => updateAction(item._id, { shareWithStudent: event.target.checked })} /> Share with student</label></li>
        ))}</ul></div>}
        <div className="faculty-action-buttons">
          <button className="verify-button" type="submit" disabled={saving}>{saving ? "Saving..." : "Save report"}</button>
          {session.status !== "completed" && session.status !== "cancelled" && <button className="verify-button" type="submit" value="complete" disabled={saving}>{saving ? "Saving..." : "Save report and complete session"}</button>}
        </div>
      </form> : <ReportView session={session} />}
    </section>
  );
}

function ReportView({ session }) {
  return (
    <section className="faculty-card">
      <h3>Mentoring report (read-only)</h3>
      {REPORT_FIELDS.map(([field, label]) => <p key={field}><strong>{label}:</strong> {session.report?.[field] || "—"}</p>)}
      <p><strong>Follow-up date:</strong> {formatDate(session.followUpAt, true)}</p>
      <h4>Action items</h4>
      {!session.actionItems?.length ? <p>No action items.</p> : <ul>{session.actionItems.map((item) => <li key={item._id}>{item.description} — {item.responsible}; {item.status}; due {formatDate(item.dueAt)}</li>)}</ul>}
    </section>
  );
}

function Filter({ id, label, value, options, onChange }) {
  return <div className="field"><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={onChange}><option value="">All</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>;
}

function DetailGroup({ title, items }) {
  return <section className="admin-detail-group"><h3>{title}</h3><dl>{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl></section>;
}

function Pagination({ page, pagination, setPage }) {
  if (!pagination.totalPages || pagination.totalPages <= 1) return null;
  return <div className="pagination-controls"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pagination.totalPages}</span><button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</button></div>;
}

function formatDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString(undefined, withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}

function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default FacultyMentoring;
