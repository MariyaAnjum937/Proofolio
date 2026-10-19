import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useParams } from "react-router-dom";
import FacultyMentoring from "./FacultyMentoring";
import { API_BASE_URL } from "../config/api";
import Icon from "../components/Icons";
import { StatusBadge, CategoryBadge } from "../components/Badge";
import { StatCard } from "../components/StatCard";
import { Modal, ConfirmModal } from "../components/Modal";
import { EmptyState, LoadingSkeleton } from "../components/EmptyState";

const FACULTY_API = `${API_BASE_URL}/api/faculty`;
const REVIEW_API = `${API_BASE_URL}/api/achievements`;
const CATEGORIES = ["Hackathon", "Internship", "Certification", "Workshop", "Competition", "Extracurricular", "Project", "Other"];

async function requestJson(url, options = {}) {
  const response = await fetch(url, { credentials: "include", ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "The request failed.");
  return data;
}

function FacultyDashboard() {
  const storedUser = JSON.parse(localStorage.getItem("proofolioUser") || "{}");
  const status = typeof storedUser.status === "string" ? storedUser.status.toLowerCase() : "approved";

  if (status !== "approved") {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Icon name="clock" className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Faculty Account Awaiting Approval</h1>
          <p className="text-sm text-slate-600 mb-6">
            {status === "rejected"
              ? "Your faculty account registration was rejected by an administrator. Please contact your department head."
              : "Your faculty account is pending review by the institutional administrator. You will be able to access the faculty dashboard once approved."}
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Current Status: {status}
          </div>
        </div>
      </div>
    );
  }

  const subNavLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
      isActive
        ? "text-indigo-600 bg-indigo-50/80 shadow-xs"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
    }`;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Faculty Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review branch student achievements, manage academic mentoring, and store professional credentials.
          </p>
        </div>
      </div>

      {/* Modern Subnav Tabs */}
      <div className="flex items-center gap-1 p-1.5 bg-white border border-slate-200/90 rounded-xl overflow-x-auto shadow-xs">
        <NavLink to="/faculty" end className={subNavLinkClass}>
          <Icon name="award" className="w-4 h-4" />
          <span>Overview</span>
        </NavLink>
        <NavLink to="/faculty/students" className={subNavLinkClass}>
          <Icon name="users" className="w-4 h-4" />
          <span>My Students</span>
        </NavLink>
        <NavLink to="/faculty/mentoring" className={subNavLinkClass}>
          <Icon name="graduation-cap" className="w-4 h-4" />
          <span>Mentoring</span>
        </NavLink>
        <NavLink to="/faculty/student-certificates" className={subNavLinkClass}>
          <Icon name="file-text" className="w-4 h-4" />
          <span>Student Certificates</span>
        </NavLink>
        <NavLink to="/faculty/my-certificates" className={subNavLinkClass}>
          <Icon name="shield" className="w-4 h-4" />
          <span>My Certificates</span>
        </NavLink>
        <NavLink to="/faculty/reviews" className={subNavLinkClass}>
          <Icon name="check-circle" className="w-4 h-4" />
          <span>Review Queue</span>
        </NavLink>
        <NavLink to="/faculty/profile" className={subNavLinkClass}>
          <Icon name="user" className="w-4 h-4" />
          <span>Faculty Profile</span>
        </NavLink>
      </div>

      {/* Routes */}
      <Routes>
        <Route index element={<FacultyOverview />} />
        <Route path="students" element={<FacultyStudents />} />
        <Route path="mentoring/*" element={<FacultyMentoring />} />
        <Route path="students/:studentId" element={<FacultyStudentProfile />} />
        <Route path="students/:studentId/certificates" element={<FacultyStudentCertificates />} />
        <Route path="student-certificates" element={<FacultyStudents certificateDirectory />} />
        <Route path="student-certificates/:certificateId" element={<FacultyCertificateDetail />} />
        <Route path="my-certificates" element={<MyCertificates />} />
        <Route path="reviews" element={<CertificateReviews />} />
        <Route path="profile" element={<FacultyProfile />} />
        <Route
          path="*"
          element={
            <EmptyState
              icon="alert-triangle"
              title="Page not found"
              description="This page is not part of the faculty dashboard."
              actionLabel="Faculty overview"
              actionTo="/faculty"
            />
          }
        />
      </Routes>
    </div>
  );
}

function FacultyOverview() {
  const [stats, setStats] = useState({ studentCount: 0, pendingReviews: 0, myCertificates: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      requestJson(`${FACULTY_API}/students?limit=1`),
      requestJson(`${REVIEW_API}/pending`),
      requestJson(`${FACULTY_API}/my-certificates`)
    ])
      .then(([students, reviews, certificates]) => {
        setStats({
          studentCount: students.pagination?.total || 0,
          pendingReviews: reviews.achievements?.length || 0,
          myCertificates: certificates.certificates?.length || 0
        });
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton count={3} />;
  if (error) return <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-sm">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Branch Students"
          value={stats.studentCount}
          icon="users"
          to="/faculty/students"
          variant="default"
        />
        <StatCard
          label="Pending Certificate Reviews"
          value={stats.pendingReviews}
          icon="clock"
          to="/faculty/reviews"
          variant="pending"
        />
        <StatCard
          label="My Faculty Certificates"
          value={stats.myCertificates}
          icon="award"
          to="/faculty/my-certificates"
          variant="verified"
        />
      </div>

      {/* Branch Access Notice & Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Icon name="shield" className="w-5 h-5 text-indigo-600" />
            Branch Authorization Scope
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            As a departmental faculty member, you have review and verification privileges for students enrolled in your administrator-assigned branch. Student achievement verification maintains institutional academic standards.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
          <Link
            to="/faculty/reviews"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <Icon name="check-circle" className="w-4 h-4" />
            <span>Process Pending Reviews ({stats.pendingReviews})</span>
          </Link>
          <Link
            to="/faculty/students"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors"
          >
            <Icon name="users" className="w-4 h-4" />
            <span>Browse Branch Students</span>
          </Link>
          <Link
            to="/faculty/mentoring"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors"
          >
            <Icon name="graduation-cap" className="w-4 h-4" />
            <span>Open Mentoring Console</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function FacultyStudents({ certificateDirectory = false }) {
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

  useEffect(() => {
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (search.trim()) query.set("search", search.trim());
    if (department) query.set("department", department);
    if (section) query.set("section", section);
    if (academicYear) query.set("currentAcademicYear", academicYear);
    if (semester) query.set("semester", semester);
    setLoading(true);
    requestJson(`${FACULTY_API}/students?${query}`)
      .then((data) => {
        setStudents(data.students || []);
        setFilters(data.filters || { departments: [], branches: [], sections: [], academicYears: [], semesters: [] });
        setPagination(data.pagination || { total: 0, totalPages: 0 });
        setError("");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [page, search, department, section, academicYear, semester]);

  const change = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {certificateDirectory ? "Student Certificate Directory" : "Branch Students Directory"}
          </h2>
          <p className="text-xs text-slate-500">
            {pagination.total} students registered in your assigned branch
            {certificateDirectory ? " · click a student to view their certificates" : "."}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="field">
          <label htmlFor="faculty-student-search">Search</label>
          <input
            id="faculty-student-search"
            value={search}
            onChange={change(setSearch)}
            placeholder="Name, roll number, or email..."
            className="text-xs"
          />
        </div>
        <FilterSelect id="faculty-department" label="Department" value={department} options={filters.departments} onChange={change(setDepartment)} />
        <FilterSelect id="faculty-section" label="Section" value={section} options={filters.sections} onChange={change(setSection)} />
        <FilterSelect id="faculty-year" label="Academic Year" value={academicYear} options={filters.academicYears} onChange={change(setAcademicYear)} />
        <FilterSelect id="faculty-semester" label="Semester" value={semester} options={filters.semesters} onChange={change(setSemester)} />
      </div>

      {error && <div className="p-3 text-xs text-rose-800 bg-rose-50 rounded-xl">{error}</div>}

      {loading ? (
        <LoadingSkeleton count={4} />
      ) : students.length === 0 ? (
        <EmptyState
          icon="users"
          title="No students match these filters"
          description="Try broadening your search query or clearing filter options."
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Roll Number</th>
                  <th className="p-3.5">Branch</th>
                  <th className="p-3.5">Year / Sem</th>
                  <th className="p-3.5">Section</th>
                  <th className="p-3.5 text-center">Total Certs</th>
                  <th className="p-3.5 text-center">Verified</th>
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
                      <td className="p-3.5 text-slate-600">{student.profile?.branch || "—"}</td>
                      <td className="p-3.5 text-slate-600">
                        {student.profile?.currentAcademicYear || "—"}{student.profile?.currentSemester ? ` (Sem ${student.profile.currentSemester})` : ""}
                      </td>
                      <td className="p-3.5 text-slate-600">{student.profile?.section || "—"}</td>
                      <td className="p-3.5 text-center font-semibold text-slate-700">{student.certificateCount ?? 0}</td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {student.verifiedCertificateCount ?? 0}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap space-x-2">
                        {!certificateDirectory && (
                          <Link
                            to={`/faculty/students/${student._id}`}
                            className="font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            Profile
                          </Link>
                        )}
                        <Link
                          to={`/faculty/students/${student._id}/certificates`}
                          className="font-semibold text-indigo-600 hover:text-indigo-800 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          Certificates
                        </Link>
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

function FacultyStudentProfile() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    requestJson(`${FACULTY_API}/students/${studentId}`)
      .then((data) => setStudent(data.student))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <LoadingSkeleton count={3} />;
  if (error) return <div className="p-4 bg-rose-50 text-rose-800 text-sm rounded-xl">{error}</div>;
  if (!student) return <EmptyState title="Student profile not found." />;

  const profile = student.profile || {};
  const summary = student.achievementSummary || {};

  return (
    <div className="space-y-6">
      <Link
        to="/faculty/students"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <Icon name="arrow-left" className="w-4 h-4" />
        <span>Back to Student Directory</span>
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{profile.fullName || student.fullName || student.username}</h2>
          <p className="text-xs text-slate-500 mt-0.5">Read-only student academic profile · {student.email}</p>
        </div>
        <Link
          to={`/faculty/students/${studentId}/certificates`}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
        >
          <Icon name="award" className="w-4 h-4" />
          <span>View Student Certificates</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Submissions" value={summary.total ?? 0} icon="award" />
        <StatCard label="Verified" value={summary.verified ?? 0} icon="check-circle" variant="verified" />
        <StatCard label="Pending Review" value={summary.pending ?? 0} icon="clock" variant="pending" />
        <StatCard label="Rejected" value={summary.rejected ?? 0} icon="x-circle" variant="rejected" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Icon name="user" className="w-4 h-4 text-indigo-600" />
            Personal Details
          </h3>
          <dl className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Full Name</dt>
              <dd className="font-semibold text-slate-800">{profile.fullName || student.fullName || "—"}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Username</dt>
              <dd className="font-semibold text-slate-800">{student.username || "—"}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Email Address</dt>
              <dd className="font-semibold text-slate-800">{student.email || "—"}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-slate-500">Phone</dt>
              <dd className="font-semibold text-slate-800">{profile.phone || student.phone || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Icon name="graduation-cap" className="w-4 h-4 text-indigo-600" />
            Academic Details
          </h3>
          <dl className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Institution</dt>
              <dd className="font-semibold text-slate-800">{profile.institution || "—"}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Degree</dt>
              <dd className="font-semibold text-slate-800">{profile.degree || "—"}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Department & Branch</dt>
              <dd className="font-semibold text-slate-800">{profile.department || "—"} / {profile.branch || "—"}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Roll Number</dt>
              <dd className="font-semibold text-slate-800">{profile.rollNumber || "—"}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Year & Semester</dt>
              <dd className="font-semibold text-slate-800">{profile.currentAcademicYear || "—"} (Sem {profile.currentSemester ?? "—"})</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Section</dt>
              <dd className="font-semibold text-slate-800">{profile.section || "—"}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-slate-500">CGPA</dt>
              <dd className="font-semibold text-indigo-600">{profile.cgpa ?? "—"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

function FacultyStudentCertificates() {
  const { studentId } = useParams();
  const [certificates, setCertificates] = useState([]);
  const [student, setStudent] = useState(null);
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [type, setType] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [status, setStatus] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (studentId) query.set("studentId", studentId);
    if (search.trim()) query.set("search", search.trim());
    if (department) query.set("department", department);
    if (type) query.set("type", type);
    if (academicYear) query.set("academicYear", academicYear);
    if (status) query.set("status", status);
    if (sortOrder) query.set("sortOrder", sortOrder);

    setLoading(true);
    Promise.all([
      requestJson(`${FACULTY_API}/students/${studentId}`),
      requestJson(`${FACULTY_API}/student-certificates?${query}`)
    ])
      .then(([studentData, data]) => {
        setStudent(studentData.student);
        setCertificates(data.certificates || []);
        setPagination(data.pagination || { total: 0, totalPages: 0 });
        setError("");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [studentId, search, department, type, academicYear, status, sortOrder, page]);

  const verifyCertificate = async (certificate) => {
    setProcessingId(certificate._id);
    setMessage("");
    setError("");
    try {
      const data = await requestJson(`${REVIEW_API}/${certificate._id}/verify`, { method: "PATCH" });
      setMessage(data.message || `Certificate verified.`);
      setCertificates((current) => current.map((item) => item._id === certificate._id
        ? { ...item, verificationStatus: "verified" }
        : item));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setProcessingId(null);
    }
  };

  const submitRejection = async () => {
    if (!rejectingItem) return;
    if (!rejectionReason.trim()) {
      setError("Please provide a feedback remark before rejecting.");
      return;
    }
    setProcessingId(rejectingItem._id);
    setMessage("");
    setError("");
    try {
      const data = await requestJson(`${REVIEW_API}/${rejectingItem._id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionRemark: rejectionReason.trim() })
      });
      setMessage(data.message || "Certificate marked rejected with feedback.");
      setCertificates((current) => current.map((item) => item._id === rejectingItem._id
        ? { ...item, verificationStatus: "rejected", rejectionRemark: rejectionReason.trim() }
        : item));
      setRejectingItem(null);
      setRejectionReason("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {student?.profile?.fullName || student?.fullName || student?.username || "Student"} · Certificates
          </h2>
          <p className="text-xs text-slate-500">
            {pagination.total} records · Roll number: {student?.profile?.rollNumber || "—"}
          </p>
        </div>
        <Link
          to="/faculty/student-certificates"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          ← Return to Student Directory
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="field">
          <label htmlFor="f-cert-search">Search</label>
          <input id="f-cert-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title..." className="text-xs" />
        </div>
        <div className="field">
          <label htmlFor="f-cert-dept">Department</label>
          <input id="f-cert-dept" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Dept..." className="text-xs" />
        </div>
        <FilterSelect id="f-cert-type" label="Category" value={type} options={CATEGORIES} onChange={(e) => setType(e.target.value)} />
        <div className="field">
          <label htmlFor="f-cert-year">Academic Year</label>
          <input id="f-cert-year" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="Year..." className="text-xs" />
        </div>
        <FilterSelect id="f-cert-status" label="Status" value={status} options={["pending", "verified", "rejected"]} onChange={(e) => setStatus(e.target.value)} />
        <div className="field">
          <label htmlFor="f-cert-sort">Order</label>
          <select id="f-cert-sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="text-xs">
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {message && <div className="p-3 text-xs text-emerald-800 bg-emerald-50 rounded-xl">{message}</div>}
      {error && <div className="p-3 text-xs text-rose-800 bg-rose-50 rounded-xl">{error}</div>}

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : certificates.length === 0 ? (
        <EmptyState title="No certificates match these filter options." />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-3.5">Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Organization</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {certificates.map((cert) => (
                  <tr key={cert._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-semibold text-slate-800 max-w-xs truncate">{cert.title}</td>
                    <td className="p-3.5"><CategoryBadge category={cert.type} /></td>
                    <td className="p-3.5 text-slate-600">{cert.organization || "—"}</td>
                    <td className="p-3.5 text-slate-500">{cert.date ? new Date(cert.date).toLocaleDateString() : "—"}</td>
                    <td className="p-3.5"><StatusBadge status={cert.verificationStatus} /></td>
                    <td className="p-3.5 text-right whitespace-nowrap space-x-2">
                      <Link
                        to={`/faculty/student-certificates/${cert._id}`}
                        className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg"
                      >
                        Preview
                      </Link>
                      {cert.verificationStatus === "pending" && (
                        <>
                          <button
                            type="button"
                            disabled={processingId === cert._id}
                            onClick={() => verifyCertificate(cert)}
                            className="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold rounded-lg border border-emerald-200"
                          >
                            Verify
                          </button>
                          <button
                            type="button"
                            disabled={processingId === cert._id}
                            onClick={() => {
                              setRejectingItem(cert);
                              setRejectionReason("");
                            }}
                            className="px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 font-semibold rounded-lg border border-rose-200"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} pagination={pagination} setPage={setPage} />
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={Boolean(rejectingItem)}
        onClose={() => setRejectingItem(null)}
        title="Reject Certificate Submission"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Please provide specific feedback for <strong>"{rejectingItem?.title}"</strong> explaining why it cannot be verified. The student will be able to review this feedback.
          </p>
          <div className="field">
            <label htmlFor="rejection-reason">Feedback Remarks <span className="text-rose-500">*</span></label>
            <textarea
              id="rejection-reason"
              rows={3}
              required
              placeholder="e.g. The certificate image is blurry; please re-upload a clear copy..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRejectingItem(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={processingId !== null || !rejectionReason.trim()}
              onClick={submitRejection}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 rounded-lg"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FacultyCertificateDetail() {
  const { certificateId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    requestJson(`${FACULTY_API}/student-certificates/${certificateId}`)
      .then((data) => setCertificate(data.certificate))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [certificateId]);

  if (loading) return <LoadingSkeleton count={3} />;
  if (error) return <div className="p-4 bg-rose-50 text-rose-800 text-sm rounded-xl">{error}</div>;
  if (!certificate) return <EmptyState title="Certificate record not found." />;

  const studentId = certificate.user?._id || certificate.user;
  const isPdf = certificate.certificateUrl && certificate.certificateUrl.split("?")[0].toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-6">
      <Link
        to={`/faculty/students/${studentId}/certificates`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <Icon name="arrow-left" className="w-4 h-4" />
        <span>Back to Student Certificates</span>
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CategoryBadge category={certificate.type} />
              <StatusBadge status={certificate.verificationStatus} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{certificate.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Submitted by: {certificate.profile?.fullName || certificate.user?.fullName || certificate.user?.username} · {certificate.profile?.rollNumber || "Roll number not provided"}
            </p>
          </div>
          {certificate.certificateUrl && (
            <a
              href={certificate.certificateUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              <Icon name="external-link" className="w-4 h-4" />
              <span>Open Original File</span>
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-0.5">Issuing Organization</span>
            <strong className="text-slate-800">{certificate.organization || "—"}</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-0.5">Achievement Date</span>
            <strong className="text-slate-800">{certificate.date ? new Date(certificate.date).toLocaleDateString() : "—"}</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-0.5">Submission Date</span>
            <strong className="text-slate-800">{certificate.createdAt ? new Date(certificate.createdAt).toLocaleDateString() : "—"}</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-0.5">Department</span>
            <strong className="text-slate-800">{certificate.profile?.department || "—"}</strong>
          </div>
        </div>

        {certificate.description && (
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 text-xs">
            <span className="font-semibold text-slate-700 block mb-1">Student Description:</span>
            <p className="text-slate-600 leading-relaxed">{certificate.description}</p>
          </div>
        )}

        {/* Certificate File Display */}
        <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center min-h-[360px]">
          {certificate.certificateUrl ? (
            isPdf ? (
              <iframe
                src={certificate.certificateUrl}
                title={`${certificate.title} preview`}
                className="w-full h-[520px] border-0"
              />
            ) : (
              <img
                src={certificate.certificateUrl}
                alt={`${certificate.title} certificate`}
                className="max-h-[500px] object-contain p-2"
              />
            )
          ) : (
            <p className="text-xs text-slate-400">No certificate file attached.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MyCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", type: "Certification", organization: "", date: "", expiresAt: "", description: "" });
  const [file, setFile] = useState(null);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const data = await requestJson(`${FACULTY_API}/my-certificates`);
      setCertificates(data.certificates || []);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  const updateField = (event) => setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  const resetForm = () => {
    setEditingId(null);
    setFile(null);
    setForm({ title: "", type: "Certification", organization: "", date: "", expiresAt: "", description: "" });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      let data;
      if (editingId) {
        data = await requestJson(`${FACULTY_API}/my-certificates/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
      } else {
        if (!file) {
          setError("Please select a certificate file to upload.");
          setSaving(false);
          return;
        }
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => formData.append(key, value));
        formData.append("certificate", file);
        data = await requestJson(`${FACULTY_API}/my-certificates`, { method: "POST", body: formData });
      }
      setMessage(data.message || "Certificate saved successfully.");
      resetForm();
      await loadCertificates();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const editCertificate = (cert) => {
    setEditingId(cert._id);
    setFile(null);
    setForm({
      title: cert.title || "",
      type: cert.type || "Certification",
      organization: cert.organization || "",
      date: cert.date ? new Date(cert.date).toISOString().slice(0, 10) : "",
      expiresAt: cert.expiresAt ? new Date(cert.expiresAt).toISOString().slice(0, 10) : "",
      description: cert.description || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      {/* Upload / Edit Form */}
      <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {editingId ? "Edit Professional Certificate Metadata" : "Upload Professional Faculty Certificate"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Store faculty certifications, pedagogy credentials, publications, and honors.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {message && <div className="p-3 text-xs text-emerald-800 bg-emerald-50 rounded-xl">{message}</div>}
        {error && <div className="p-3 text-xs text-rose-800 bg-rose-50 rounded-xl">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="field">
            <label htmlFor="f-cert-title">Title <span className="text-rose-500">*</span></label>
            <input id="f-cert-title" name="title" required value={form.title} onChange={updateField} placeholder="e.g. Certified Data Scientist" />
          </div>

          <div className="field">
            <label htmlFor="f-cert-category">Category</label>
            <select id="f-cert-category" name="type" value={form.type} onChange={updateField}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="field">
            <label htmlFor="f-cert-org">Issuing Organization <span className="text-rose-500">*</span></label>
            <input id="f-cert-org" name="organization" required value={form.organization} onChange={updateField} placeholder="e.g. IEEE, NPTEL" />
          </div>

          <div className="field">
            <label htmlFor="f-cert-date">Issue Date <span className="text-rose-500">*</span></label>
            <input id="f-cert-date" name="date" type="date" required value={form.date} onChange={updateField} />
          </div>

          <div className="field">
            <label htmlFor="f-cert-expiry">Expiry Date (Optional)</label>
            <input id="f-cert-expiry" name="expiresAt" type="date" value={form.expiresAt} onChange={updateField} />
          </div>

          {!editingId && (
            <div className="field">
              <label htmlFor="f-cert-file">Certificate File (Max 10 MB) <span className="text-rose-500">*</span></label>
              <input
                id="f-cert-file"
                type="file"
                required
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700"
              />
            </div>
          )}

          <div className="field sm:col-span-2 lg:col-span-3">
            <label htmlFor="f-cert-desc">Description (Optional)</label>
            <textarea id="f-cert-desc" name="description" rows={2} value={form.description} onChange={updateField} placeholder="Details or course scope..." />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs disabled:bg-indigo-400"
          >
            {saving ? "Saving..." : editingId ? "Save Changes" : "Upload Certificate"}
          </button>
        </div>
      </form>

      {/* List of Certificates */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
          My Professional Credentials
        </h2>

        {loading ? (
          <LoadingSkeleton count={2} />
        ) : certificates.length === 0 ? (
          <EmptyState title="No faculty certificates recorded yet." description="Upload your professional credentials to build your faculty profile." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert) => (
              <div key={cert._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <CategoryBadge category={cert.type} />
                  <span className="text-[11px] text-slate-400">
                    {cert.date ? new Date(cert.date).toLocaleDateString() : ""}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{cert.title}</h3>
                <p className="text-slate-600 font-medium">{cert.organization}</p>

                {cert.description && <p className="text-slate-500 line-clamp-2">{cert.description}</p>}

                <div className="pt-2 flex items-center justify-between border-t border-slate-200/80">
                  {cert.certificateUrl ? (
                    <a
                      href={cert.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                    >
                      <span>View File</span>
                      <Icon name="external-link" className="w-3.5 h-3.5" />
                    </a>
                  ) : <span className="text-slate-400">No file</span>}

                  <button
                    type="button"
                    onClick={() => editCertificate(cert)}
                    className="px-2.5 py-1 text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CertificateReviews() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectionRemark, setRejectionRemark] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await requestJson(`${REVIEW_API}/pending`);
      setAchievements(data.achievements || []);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const verifyItem = async (achievement) => {
    setProcessingId(achievement._id);
    setError("");
    setMessage("");
    try {
      const data = await requestJson(`${REVIEW_API}/${achievement._id}/verify`, { method: "PATCH" });
      setMessage(data.message || "Certificate verified successfully.");
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setProcessingId(null);
    }
  };

  const confirmRejection = async () => {
    if (!rejectModalItem) return;
    if (!rejectionRemark.trim()) {
      setError("Please provide a reason before rejecting.");
      return;
    }
    setProcessingId(rejectModalItem._id);
    setError("");
    setMessage("");
    try {
      const data = await requestJson(`${REVIEW_API}/${rejectModalItem._id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionRemark: rejectionRemark.trim() })
      });
      setMessage(data.message || "Certificate rejected with feedback remarks.");
      setRejectModalItem(null);
      setRejectionRemark("");
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900">Certificate Review Queue</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Review and verify student certificate submissions for your branch.
        </p>
      </div>

      {message && <div className="p-3 text-xs text-emerald-800 bg-emerald-50 rounded-xl">{message}</div>}
      {error && <div className="p-3 text-xs text-rose-800 bg-rose-50 rounded-xl">{error}</div>}

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : achievements.length === 0 ? (
        <EmptyState
          icon="check-circle"
          title="Review Queue is Clear"
          description="There are currently no student certificates waiting for review in your branch."
        />
      ) : (
        <div className="space-y-4">
          {achievements.map((item) => (
            <div key={item._id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CategoryBadge category={item.type} />
                  <StatusBadge status="pending" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600">
                  Student: <strong className="text-slate-800">{item.user?.fullName || item.user?.username}</strong> ({item.user?.email}) · Org: {item.organization || "—"}
                </p>
                {item.description && <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>}
                {item.certificateUrl && (
                  <a
                    href={item.certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 pt-1"
                  >
                    <span>View Certificate Proof</span>
                    <Icon name="external-link" className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={processingId === item._id}
                  onClick={() => verifyItem(item)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 rounded-xl shadow-xs transition-colors"
                >
                  {processingId === item._id ? "Processing..." : "Approve Certificate"}
                </button>
                <button
                  type="button"
                  disabled={processingId === item._id}
                  onClick={() => {
                    setRejectModalItem(item);
                    setRejectionRemark("");
                  }}
                  className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 rounded-xl transition-colors"
                >
                  Reject with Remarks
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal Dialog */}
      <Modal
        isOpen={Boolean(rejectModalItem)}
        onClose={() => setRejectModalItem(null)}
        title="Reject Certificate Submission"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Provide feedback explaining why <strong>"{rejectModalItem?.title}"</strong> cannot be approved.
          </p>
          <div className="field">
            <label htmlFor="modal-rejection-remark">Rejection Reason / Remark <span className="text-rose-500">*</span></label>
            <textarea
              id="modal-rejection-remark"
              rows={3}
              required
              placeholder="e.g. Please upload the official signed completion certificate instead of an enrollment receipt."
              value={rejectionRemark}
              onChange={(e) => setRejectionRemark(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRejectModalItem(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={processingId !== null || !rejectionRemark.trim()}
              onClick={confirmRejection}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 rounded-lg"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FacultyProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    requestJson(`${FACULTY_API}/profile`)
      .then((data) => {
        setUser(data.user);
        setProfile(data.profile);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton count={3} />;
  if (error) return <div className="p-4 bg-rose-50 text-rose-800 text-sm rounded-xl">{error}</div>;

  const fullName = profile?.fullName || user?.fullName || user?.username || "Faculty Member";

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shrink-0">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {user?.status || "approved"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {profile?.designation || "Faculty"} · {profile?.department || "Department"} · {user?.email}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Icon name="user" className="w-4 h-4 text-indigo-600" />
            Personal Details
          </h3>
          <dl className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Full Name</dt>
              <dd className="font-semibold text-slate-800">{profile?.fullName || user?.fullName || "—"}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Username</dt>
              <dd className="font-semibold text-slate-800">{user?.username || "—"}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Official Email</dt>
              <dd className="font-semibold text-slate-800">{user?.email || "—"}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-slate-500">Phone</dt>
              <dd className="font-semibold text-slate-800">{profile?.phone || user?.phone || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Icon name="building" className="w-4 h-4 text-indigo-600" />
            Institutional & Professional Role
          </h3>
          <dl className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Institution</dt>
              <dd className="font-semibold text-slate-800">{profile?.institution || "—"}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Employee ID</dt>
              <dd className="font-semibold text-slate-800">{profile?.employeeId || "—"}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Department</dt>
              <dd className="font-semibold text-slate-800">{profile?.department || "—"}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Assigned Review Branch</dt>
              <dd className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                {profile?.branch || "Not Assigned"}
              </dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Designation</dt>
              <dd className="font-semibold text-slate-800">{profile?.designation || "—"}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Specialization</dt>
              <dd className="font-semibold text-slate-800">{profile?.specialization || "—"}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-slate-500">Years of Experience</dt>
              <dd className="font-semibold text-slate-800">{profile?.experienceYears ? `${profile.experienceYears} Years` : "—"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

export default FacultyDashboard;
