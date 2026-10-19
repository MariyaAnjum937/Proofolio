import { useEffect, useState, useCallback } from "react";
import { Link, Route, Routes, useNavigate, useParams, NavLink } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import Icon from "../components/Icons";
import { StatusBadge, CategoryBadge } from "../components/Badge";
import { StatCard } from "../components/StatCard";
import { ConfirmModal } from "../components/Modal";
import { EmptyState, LoadingSkeleton } from "../components/EmptyState";

const API_ROOT = `${API_BASE_URL}/api/faculty/mentoring`;
const REPORT_FIELDS = [
  ["topicsDiscussed", "Topics Discussed"],
  ["academicProgress", "Academic Progress"],
  ["careerGuidance", "Career Guidance"],
  ["achievementsProgress", "Achievements & Portfolio Progress"],
  ["challenges", "Challenges & Support Needed"],
  ["recommendations", "Faculty Recommendations"],
  ["nextSteps", "Next Steps"],
  ["shortTermGoals", "Short-Term Goals"],
  ["longTermGoals", "Long-Term Goals"],
  ["developmentActivities", "Development Activities"],
  ["followUpPlan", "Follow-Up Plan"]
];

async function requestJson(url, options = {}) {
  const response = await fetch(url, { credentials: "include", ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "The request failed.");
  return data;
}

function FacultyMentoring() {
  const tabClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
      isActive
        ? "text-indigo-700 bg-white shadow-xs"
        : "text-slate-600 hover:text-slate-900"
    }`;

  return (
    <div className="space-y-6">
      {/* Mentoring Subnavigation */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-1.5 bg-slate-100 rounded-xl">
        <div className="flex items-center gap-1">
          <NavLink to="/faculty/mentoring" end className={tabClass}>
            <Icon name="users" className="w-3.5 h-3.5" />
            <span>My Mentees</span>
          </NavLink>
          <NavLink to="/faculty/mentoring/find-students" className={tabClass}>
            <Icon name="search" className="w-3.5 h-3.5" />
            <span>Find Students</span>
          </NavLink>
          <NavLink to="/faculty/mentoring/history" className={tabClass}>
            <Icon name="clock" className="w-3.5 h-3.5" />
            <span>Past History</span>
          </NavLink>
        </div>

        <Link
          to="/faculty/mentoring/schedule"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
        >
          <Icon name="plus" className="w-3.5 h-3.5" />
          <span>Schedule New Session</span>
        </Link>
      </div>

      <Routes>
        <Route index element={<AssignedStudents />} />
        <Route path="find-students" element={<FindStudents />} />
        <Route path="history" element={<PastMentoringHistory />} />
        <Route path="students/:studentId" element={<MentoringStudent />} />
        <Route path="schedule" element={<NewMentoringSession />} />
        <Route path="students/:studentId/new-session" element={<NewMentoringSession />} />
        <Route path="sessions/:sessionId" element={<MentoringSessionDetail />} />
        <Route
          path="*"
          element={
            <EmptyState
              icon="alert-triangle"
              title="Page not found"
              description="This page is not part of faculty mentoring."
              actionLabel="Mentoring overview"
              actionTo="/faculty/mentoring"
            />
          }
        />
      </Routes>
    </div>
  );
}

function AssignedStudents() {
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ departments: [], branches: [], sections: [], academicYears: [], semesters: [] });
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
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
  const [endingStudent, setEndingStudent] = useState(null);

  useEffect(() => {
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (search.trim()) query.set("search", search.trim());
    if (department) query.set("department", department);
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
  }, [page, search, department, section, academicYear, semester, refresh]);

  const confirmEndMentoring = async () => {
    if (!endingStudent) return;
    setProcessing(endingStudent._id);
    setError("");
    setMessage("");
    try {
      const result = await requestJson(`${API_ROOT}/mentees/${endingStudent._id}`, { method: "PATCH" });
      setRefresh((v) => v + 1);
      setMessage(result.message || "Mentoring relationship concluded.");
      setEndingStudent(null);
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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Active Mentees</h2>
          <p className="text-xs text-slate-500">
            {pagination.total} assigned students in your active mentoring portfolio.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="field">
          <label htmlFor="mentoring-search">Search Mentees</label>
          <input id="mentoring-search" value={search} onChange={update(setSearch)} placeholder="Name, roll number..." className="text-xs" />
        </div>
        <FilterSelect id="mentoring-department" label="Department" value={department} options={filters.departments} onChange={update(setDepartment)} />
        <FilterSelect id="mentoring-section" label="Section" value={section} options={filters.sections} onChange={update(setSection)} />
        <FilterSelect id="mentoring-year" label="Academic Year" value={academicYear} options={filters.academicYears} onChange={update(setAcademicYear)} />
        <FilterSelect id="mentoring-semester" label="Semester" value={semester} options={filters.semesters} onChange={update(setSemester)} />
      </div>

      {error && <div className="p-3 text-xs text-rose-800 bg-rose-50 rounded-xl">{error}</div>}
      {message && <div className="p-3 text-xs text-emerald-800 bg-emerald-50 rounded-xl">{message}</div>}

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : students.length === 0 ? (
        <EmptyState
          icon="users"
          title="No active mentees found"
          description="You can browse eligible students in your branch and add them to your mentoring cohort."
          actionLabel="Find Branch Students"
          actionTo="/faculty/mentoring/find-students"
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Roll Number</th>
                  <th className="p-3.5">Program</th>
                  <th className="p-3.5 text-center">Sessions</th>
                  <th className="p-3.5 text-center">Pending Actions</th>
                  <th className="p-3.5">Next Session</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const name = student.profile?.fullName || student.fullName || student.username;
                  return (
                    <tr key={student._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block">{name}</span>
                            <span className="text-[11px] text-slate-400">{student.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">{student.profile?.rollNumber || "—"}</td>
                      <td className="p-3.5 text-slate-600">
                        {[student.profile?.department, student.profile?.branch, student.profile?.section && `Sec ${student.profile.section}`].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="font-bold text-slate-800">{student.mentoring?.sessionCount || 0}</span>
                        <span className="text-[10px] text-slate-400 block">({student.mentoring?.completedCount || 0} done)</span>
                      </td>
                      <td className="p-3.5 text-center">
                        {student.mentoring?.pendingActionItems > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            {student.mentoring.pendingActionItems}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600">{formatDate(student.mentoring?.nextSession)}</td>
                      <td className="p-3.5 text-right whitespace-nowrap space-x-2">
                        <Link
                          to={`/faculty/mentoring/students/${student._id}`}
                          className="px-2.5 py-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold rounded-lg"
                        >
                          Profile
                        </Link>
                        <button
                          type="button"
                          disabled={processing === student._id}
                          onClick={() => setEndingStudent(student)}
                          className="px-2.5 py-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-medium rounded-lg"
                        >
                          End
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pager page={page} pagination={pagination} setPage={setPage} />
        </div>
      )}

      {/* End Mentoring Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(endingStudent)}
        onClose={() => setEndingStudent(null)}
        onConfirm={confirmEndMentoring}
        title="End Mentoring Relationship"
        message={`Are you sure you want to end your mentoring relationship with ${endingStudent?.profile?.fullName || endingStudent?.fullName || endingStudent?.username}? All historical records, past reports, and sessions will be preserved in your history.`}
        confirmText="End Mentoring"
        isDestructive={true}
        isLoading={Boolean(processing)}
      />
    </div>
  );
}

function FindStudents() {
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ departments: [], branches: [], sections: [], academicYears: [], semesters: [] });
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
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
  }, [page, search, department, section, academicYear, semester, refresh]);

  const startMentoring = async (student) => {
    setProcessing(student._id);
    setError("");
    setMessage("");
    try {
      const result = await requestJson(`${API_ROOT}/mentees/${student._id}`, { method: "POST" });
      setMessage(result.message || "Student added to your mentees.");
      setRefresh((v) => v + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setProcessing("");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900">Find Branch Students</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Search registered students in your assigned branch and establish new mentoring relationships.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="field">
          <label htmlFor="find-student-search">Search</label>
          <input id="find-student-search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Name, roll number..." className="text-xs" />
        </div>
        <FilterSelect id="find-department" label="Department" value={department} options={filters.departments} onChange={(e) => { setDepartment(e.target.value); setPage(1); }} />
        <FilterSelect id="find-section" label="Section" value={section} options={filters.sections} onChange={(e) => { setSection(e.target.value); setPage(1); }} />
        <FilterSelect id="find-year" label="Academic Year" value={academicYear} options={filters.academicYears} onChange={(e) => { setAcademicYear(e.target.value); setPage(1); }} />
        <FilterSelect id="find-semester" label="Semester" value={semester} options={filters.semesters} onChange={(e) => { setSemester(e.target.value); setPage(1); }} />
      </div>

      {error && <div className="p-3 text-xs text-rose-800 bg-rose-50 rounded-xl">{error}</div>}
      {message && <div className="p-3 text-xs text-emerald-800 bg-emerald-50 rounded-xl">{message}</div>}

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : students.length === 0 ? (
        <EmptyState title="No students found matching your criteria." />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Roll Number</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Branch</th>
                  <th className="p-3.5">Year / Sem</th>
                  <th className="p-3.5 text-right">Mentoring Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const name = student.profile?.fullName || student.fullName || student.username;
                  return (
                    <tr key={student._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800 block">{name}</span>
                        <span className="text-[11px] text-slate-400">{student.email}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">{student.profile?.rollNumber || "—"}</td>
                      <td className="p-3.5 text-slate-600">{student.profile?.department || "—"}</td>
                      <td className="p-3.5 text-slate-600">{student.profile?.branch || "—"}</td>
                      <td className="p-3.5 text-slate-600">
                        {student.profile?.currentAcademicYear || "—"}{student.profile?.currentSemester ? ` (Sem ${student.profile.currentSemester})` : ""}
                      </td>
                      <td className="p-3.5 text-right">
                        {student.relationship ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active Mentee
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={Boolean(processing)}
                            onClick={() => startMentoring(student)}
                            className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-lg shadow-xs transition-colors"
                          >
                            {processing === student._id ? "Adding..." : "+ Start Mentoring"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pager page={page} pagination={pagination} setPage={setPage} />
        </div>
      )}
    </div>
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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900">Past Mentoring History</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Archived session records from concluded mentoring relationships.
        </p>
      </div>

      {error && <div className="p-3 text-xs text-rose-800 bg-rose-50 rounded-xl">{error}</div>}

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : sessions.length === 0 ? (
        <EmptyState title="No past session history found." />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Session Title</th>
                  <th className="p-3.5">Scheduled Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Ended Date</th>
                  <th className="p-3.5 text-right">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((session) => (
                  <tr key={session._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-800 block">{session.student?.fullName || session.student?.username}</span>
                      <span className="text-[11px] text-slate-400">{session.student?.email}</span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">{session.title}</td>
                    <td className="p-3.5 text-slate-600">{formatDate(session.scheduledAt, true)}</td>
                    <td className="p-3.5"><StatusBadge status={session.status} /></td>
                    <td className="p-3.5 text-slate-500">{formatDate(session.endedAssignmentAt)}</td>
                    <td className="p-3.5 text-right">
                      <Link
                        to={`/faculty/mentoring/sessions/${session._id}`}
                        className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg"
                      >
                        View Report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} pagination={pagination} setPage={setPage} />
        </div>
      )}
    </div>
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
  const [endModalOpen, setEndModalOpen] = useState(false);

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

  if (loading) return <LoadingSkeleton count={3} />;
  if (error) return <div className="p-4 bg-rose-50 text-rose-800 text-sm rounded-xl">{error}</div>;

  const student = data?.student;
  const profile = student?.profile || {};
  const summary = data?.summary || {};

  const handleEndMentoring = async () => {
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
    <div className="space-y-6">
      <Link
        to="/faculty/mentoring"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <Icon name="arrow-left" className="w-4 h-4" />
        <span>Back to My Mentees</span>
      </Link>

      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{profile.fullName || student?.fullName || student?.username}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {student?.email} · Mentoring since {formatDate(student?.assignedAt)} · Roll: {profile.rollNumber || "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/faculty/mentoring/students/${studentId}/new-session`}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
          >
            Schedule Session
          </Link>
          <button
            type="button"
            onClick={() => setEndModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl"
          >
            End Mentoring
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Sessions" value={summary.totalSessions ?? 0} icon="calendar" />
        <StatCard label="Completed" value={summary.completedSessions ?? 0} icon="check-circle" variant="verified" />
        <StatCard label="Upcoming" value={summary.upcomingSessions ?? 0} icon="clock" variant="pending" />
        <StatCard label="Verified Certs" value={certificates.filter((c) => c.verificationStatus === "verified").length} icon="award" />
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
          Mentoring Sessions
        </h3>

        {sessions.length === 0 ? (
          <EmptyState
            title="No sessions recorded with this student yet."
            actionLabel="Schedule First Session"
            actionTo={`/faculty/mentoring/students/${studentId}/new-session`}
          />
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-3">Session</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Follow-up</th>
                    <th className="p-3 text-right">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-semibold text-slate-800">{s.title}</td>
                      <td className="p-3 text-slate-600">{formatDate(s.scheduledAt, true)}</td>
                      <td className="p-3"><StatusBadge status={s.status} /></td>
                      <td className="p-3 text-slate-500">{formatDate(s.followUpAt)}</td>
                      <td className="p-3 text-right">
                        <Link
                          to={`/faculty/mentoring/sessions/${s._id}`}
                          className="px-2.5 py-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold rounded-lg"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} pagination={{ totalPages }} setPage={setPage} />
          </div>
        )}
      </div>

      {/* Confirm End Modal */}
      <ConfirmModal
        isOpen={endModalOpen}
        onClose={() => setEndModalOpen(false)}
        onConfirm={handleEndMentoring}
        title="End Mentoring Relationship"
        message="Are you sure you want to conclude this mentoring relationship? All past session records, goals, and feedback will remain preserved."
        confirmText="End Mentoring"
        isDestructive={true}
        isLoading={ending}
      />
    </div>
  );
}

function NewMentoringSession() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || "");
  const [form, setForm] = useState({
    title: "",
    scheduledAt: "",
    endsAt: "",
    type: "online",
    meetingUrl: "",
    location: "",
    agenda: "",
    initialNotes: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  useEffect(() => {
    setSelectedStudentId(studentId || "");
    if (!studentId) {
      requestJson(`${API_ROOT}/students?limit=100`)
        .then((data) => setStudents(data.students || []))
        .catch((requestError) => setError(requestError.message));
    }
  }, [studentId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError("Please select a student from your active mentees.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const start = new Date(form.scheduledAt);
      const end = form.endsAt ? new Date(form.endsAt) : null;
      if (Number.isNaN(start.getTime()) || (end && (Number.isNaN(end.getTime()) || end <= start))) {
        throw new Error("End time must be after the session start time.");
      }

      const result = await requestJson(`${API_ROOT}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          studentId: selectedStudentId,
          scheduledAt: start.toISOString(),
          endsAt: end ? end.toISOString() : null
        })
      });

      navigate(`/faculty/mentoring/sessions/${result.session._id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to={studentId ? `/faculty/mentoring/students/${studentId}` : "/faculty/mentoring"}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <Icon name="arrow-left" className="w-4 h-4" />
        <span>Back to Mentoring</span>
      </Link>

      <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Schedule Mentoring Session</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Set up an online or in-person session with your mentee. Private preparation notes are visible only to faculty.
          </p>
        </div>

        {error && <div className="p-3.5 text-xs text-rose-800 bg-rose-50 rounded-xl">{error}</div>}

        {!studentId && (
          <div className="field">
            <label htmlFor="session-student">Select Mentee <span className="text-rose-500">*</span></label>
            <select
              id="session-student"
              required
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="">Choose a mentee...</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.profile?.fullName || s.fullName || s.username} {s.profile?.rollNumber ? `(${s.profile.rollNumber})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label htmlFor="session-title">Session Title <span className="text-rose-500">*</span></label>
          <input
            id="session-title"
            required
            maxLength={200}
            placeholder="e.g. Midterm Academic Progress & Career Review"
            value={form.title}
            onChange={update("title")}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="field">
            <label htmlFor="session-start">Start Date & Time <span className="text-rose-500">*</span></label>
            <input
              id="session-start"
              type="datetime-local"
              required
              value={form.scheduledAt}
              onChange={update("scheduledAt")}
            />
          </div>

          <div className="field">
            <label htmlFor="session-end">End Date & Time <span className="text-rose-500">*</span></label>
            <input
              id="session-end"
              type="datetime-local"
              required
              min={form.scheduledAt}
              value={form.endsAt}
              onChange={update("endsAt")}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="session-type">Session Mode</label>
          <select id="session-type" value={form.type} onChange={update("type")}>
            <option value="online">Online Video Meeting</option>
            <option value="in_person">In-Person Meeting</option>
            <option value="other">Other / Hybrid</option>
          </select>
        </div>

        {form.type === "online" ? (
          <div className="field">
            <label htmlFor="session-meeting-url">Meeting URL <span className="text-rose-500">*</span></label>
            <input
              id="session-meeting-url"
              type="url"
              required
              placeholder="https://meet.google.com/... or https://zoom.us/..."
              value={form.meetingUrl}
              onChange={update("meetingUrl")}
            />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="session-location">Location / Venue</label>
            <input
              id="session-location"
              required={form.type === "in_person"}
              placeholder="e.g. Faculty Room 304, CS Block"
              value={form.location}
              onChange={update("location")}
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="session-agenda">Agenda & Objectives <span className="text-rose-500">*</span></label>
          <textarea
            id="session-agenda"
            rows={3}
            required
            placeholder="Outline the key topics to be discussed with the student..."
            value={form.agenda}
            onChange={update("agenda")}
          />
        </div>

        <div className="field">
          <label htmlFor="session-initial-notes">Faculty Preparation Notes (Private to Faculty)</label>
          <textarea
            id="session-initial-notes"
            rows={2}
            placeholder="Private notes, student background review, focus points..."
            value={form.initialNotes}
            onChange={update("initialNotes")}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            to="/faculty/mentoring"
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-xs"
          >
            {saving ? "Scheduling..." : "Confirm & Schedule"}
          </button>
        </div>
      </form>
    </div>
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
  const [newAction, setNewAction] = useState({ description: "", responsible: "student", dueAt: "", shareWithStudent: true });
  const [newGoal, setNewGoal] = useState({ title: "", description: "", targetDate: "", timeframe: "short_term", shareWithStudent: true });

  const load = useCallback(() =>
    requestJson(`${API_ROOT}/sessions/${sessionId}`).then(({ session: loaded }) => {
      setSession(loaded);
      setReport({
        ...(loaded.report || {}),
        sharedSummary: loaded.sharedSummary || "",
        followUpAt: toLocalDateTime(loaded.followUpAt)
      });
    }), [sessionId]);

  useEffect(() => {
    setLoading(true);
    load()
      .then(() => setError(""))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [load]);

  const updateReport = (field) => (e) => setReport((prev) => ({ ...prev, [field]: e.target.value }));

  const save = async (url, body, successMessage, method = "PATCH") => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await requestJson(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      await load();
      setMessage(successMessage);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveReport = (e) => {
    e.preventDefault();
    const actionItems = newAction.description.trim() ? [{
      ...newAction,
      dueAt: newAction.dueAt ? new Date(newAction.dueAt).toISOString() : null
    }] : [];
    const body = {
      ...report,
      followUpAt: report.followUpAt ? new Date(report.followUpAt).toISOString() : null,
      actionItems
    };

    save(`${API_ROOT}/sessions/${sessionId}/report`, body, "Session report saved successfully.")
      .then((saved) => {
        if (saved) setNewAction({ description: "", responsible: "student", dueAt: "", shareWithStudent: true });
      });
  };

  const completeSession = () => {
    if (!window.confirm("Mark this mentoring session as completed?")) return;
    const body = {
      ...report,
      confirmComplete: true,
      followUpAt: report.followUpAt ? new Date(report.followUpAt).toISOString() : null
    };
    save(`${API_ROOT}/sessions/${sessionId}/report`, body, "Session completed and report archived.");
  };

  const addGoal = (e) => {
    e?.preventDefault();
    if (!newGoal.title.trim()) {
      setError("Please enter a goal title.");
      return;
    }
    const body = {
      ...newGoal,
      targetDate: newGoal.targetDate ? new Date(`${newGoal.targetDate}T12:00:00`).toISOString() : null
    };
    save(`${API_ROOT}/sessions/${sessionId}/goals`, body, "Goal added.", "POST")
      .then((saved) => {
        if (saved) setNewGoal({ title: "", description: "", targetDate: "", timeframe: "short_term", shareWithStudent: true });
      });
  };

  if (loading) return <LoadingSkeleton count={3} />;
  if (error && !session) return <div className="p-4 bg-rose-50 text-rose-800 text-sm rounded-xl">{error}</div>;
  if (!session) return null;

  return (
    <div className="space-y-6">
      <Link
        to={`/faculty/mentoring/students/${session.student?._id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <Icon name="arrow-left" className="w-4 h-4" />
        <span>Back to Mentee Profile</span>
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase text-slate-400">Mentoring Session</span>
              <StatusBadge status={session.status} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{session.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mentee: <strong className="text-slate-700">{session.student?.fullName || session.student?.username}</strong> · {formatDate(session.scheduledAt, true)}
            </p>
          </div>
          {session.type === "online" && session.meetingUrl && (
            <a
              href={session.meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              <Icon name="video" className="w-4 h-4" />
              <span>Launch Online Meeting</span>
            </a>
          )}
        </div>

        {message && <div className="p-3 text-xs text-emerald-800 bg-emerald-50 rounded-xl">{message}</div>}
        {error && <div className="p-3 text-xs text-rose-800 bg-rose-50 rounded-xl">{error}</div>}

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
          <p><strong className="text-slate-800">Agenda:</strong> {session.agenda || "None provided"}</p>
          {session.initialNotes && <p><strong className="text-slate-800">Faculty Notes:</strong> {session.initialNotes}</p>}
        </div>
      </div>

      {/* Report Form */}
      <form onSubmit={saveReport} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Session Report & Progress Notes</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Document discussion outcomes, student challenges, and recommendations.
          </p>
        </div>

        <div className="field">
          <label htmlFor="shared-summary">Shared Summary (Visible to Student)</label>
          <textarea
            id="shared-summary"
            rows={3}
            placeholder="High-level summary of what was discussed..."
            value={report.sharedSummary || ""}
            onChange={updateReport("sharedSummary")}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REPORT_FIELDS.map(([field, fieldLabel]) => (
            <div className="field" key={field}>
              <label htmlFor={`rep-${field}`}>{fieldLabel}</label>
              <textarea
                id={`rep-${field}`}
                rows={2}
                value={report[field] || ""}
                onChange={updateReport(field)}
              />
            </div>
          ))}
        </div>

        <div className="field max-w-sm">
          <label htmlFor="follow-up-date">Follow-up Date (Optional)</label>
          <input
            id="follow-up-date"
            type="datetime-local"
            value={report.followUpAt || ""}
            onChange={updateReport("followUpAt")}
          />
        </div>

        {/* Action Items */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Assign Action Item</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="field sm:col-span-2">
              <label htmlFor="action-desc">Action Description</label>
              <input
                id="action-desc"
                type="text"
                placeholder="e.g. Revise resume, submit draft paper..."
                value={newAction.description}
                onChange={(e) => setNewAction((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="action-responsible">Responsible</label>
              <select
                id="action-responsible"
                value={newAction.responsible}
                onChange={(e) => setNewAction((prev) => ({ ...prev, responsible: e.target.value }))}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>
          </div>
          {session.actionItems?.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Existing Action Items</span>
              <ul className="space-y-1 text-xs">
                {session.actionItems.map((item, idx) => (
                  <li key={item._id || idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-700">{item.description}</span>
                    <span className="text-[11px] text-slate-400 capitalize">Assigned to: {item.responsible}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Session Goals */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Session Goals</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="field sm:col-span-2">
              <label htmlFor="goal-title">Goal Title</label>
              <input
                id="goal-title"
                type="text"
                placeholder="e.g. Complete cloud computing certification..."
                value={newGoal.title}
                onChange={(e) => setNewGoal((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="goal-timeframe">Timeframe</label>
              <select
                id="goal-timeframe"
                value={newGoal.timeframe}
                onChange={(e) => setNewGoal((prev) => ({ ...prev, timeframe: e.target.value }))}
              >
                <option value="short_term">Short Term</option>
                <option value="medium_term">Medium Term</option>
                <option value="long_term">Long Term</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={addGoal}
              className="px-4 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg"
            >
              + Add Goal
            </button>
          </div>
          {session.goals?.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Existing Goals</span>
              <ul className="space-y-1 text-xs">
                {session.goals.map((g, idx) => (
                  <li key={g._id || idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-700">{g.title}</span>
                    <span className="text-[11px] text-slate-400 capitalize">{g.timeframe?.replace('_', ' ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
          >
            {saving ? "Saving..." : "Save Draft Report"}
          </button>
          {session.status !== "completed" && session.status !== "cancelled" && (
            <button
              type="button"
              disabled={saving}
              onClick={completeSession}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
            >
              Complete Session
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function formatDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}

function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function FilterSelect({ id, label, value, options = [], onChange }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={onChange} className="text-xs">
        <option value="">All</option>
        {options.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
    </div>
  );
}

function Pager({ page, pagination, setPage }) {
  if (!pagination.totalPages || pagination.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
      <span>Page {page} of {pagination.totalPages} · {pagination.total} records</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((v) => v - 1)}
          className="px-3 py-1.5 font-medium border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= pagination.totalPages}
          onClick={() => setPage((v) => v + 1)}
          className="px-3 py-1.5 font-medium border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default FacultyMentoring;
