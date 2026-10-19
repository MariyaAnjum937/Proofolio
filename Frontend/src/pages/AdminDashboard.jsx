import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useParams, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import Icon from "../components/Icons";
import { StatusBadge, RoleBadge, CategoryBadge } from "../components/Badge";
import { StatCard } from "../components/StatCard";
import { ConfirmModal } from "../components/Modal";
import { EmptyState, LoadingSkeleton } from "../components/EmptyState";

const API_ROOT = `${API_BASE_URL}/api/admin`;
const BRANCHES = ["CSE", "CSM", "CSD", "CSC", "CSE IoT", "Civil", "Mechanical", "ECE"];

async function fetchJson(url, options = {}) {
  const response = await fetch(url, { credentials: "include", ...options });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "The request failed.");
  }
  return data;
}

function AdminDashboard() {
  const navLinkClass = ({ isActive }) =>
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
            Institutional Admin Console
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Global governance over students, verified credentials, faculty directory, and branch assignments.
          </p>
        </div>
      </div>

      {/* Subnav Tabs */}
      <div className="flex items-center gap-1 p-1.5 bg-white border border-slate-200/90 rounded-xl overflow-x-auto shadow-xs">
        <NavLink to="/admin" end className={navLinkClass}>
          <Icon name="award" className="w-4 h-4" />
          <span>System Overview</span>
        </NavLink>
        <NavLink to="/admin/students" className={navLinkClass}>
          <Icon name="graduation-cap" className="w-4 h-4" />
          <span>Students Directory</span>
        </NavLink>
        <NavLink to="/admin/certificates" className={navLinkClass}>
          <Icon name="file-text" className="w-4 h-4" />
          <span>All Certificates</span>
        </NavLink>
        <NavLink to="/admin/faculty-directory" className={navLinkClass}>
          <Icon name="building" className="w-4 h-4" />
          <span>Faculty Directory</span>
        </NavLink>
        <NavLink to="/admin/faculty" className={navLinkClass}>
          <Icon name="shield" className="w-4 h-4" />
          <span>Faculty Approvals</span>
        </NavLink>
      </div>

      <Routes>
        <Route index element={<OverviewPage />} />
        <Route path="students" element={<StudentDirectoryPage />} />
        <Route path="students/:id" element={<StudentDetailsPage />} />
        <Route path="students/:id/certificates" element={<CertificatesPage />} />
        <Route path="certificates" element={<CertificateSectionPage />} />
        <Route path="faculty-directory" element={<FacultyDirectoryPage />} />
        <Route path="faculty" element={<FacultyApprovalsPage />} />
        <Route
          path="*"
          element={
            <EmptyState
              icon="alert-triangle"
              title="Page not found"
              description="This page is not part of the admin dashboard."
              actionLabel="Admin overview"
              actionTo="/admin"
            />
          }
        />
      </Routes>
    </div>
  );
}

function OverviewPage() {
  const [stats, setStats] = useState(null);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJson(`${API_ROOT}/overview`)
      .then((data) => {
        setStats(data.stats);
        setRecentStudents(data.recentStudents || []);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton count={4} />;
  if (error) return <div className="p-4 bg-rose-50 text-rose-800 text-sm rounded-xl">{error}</div>;
  if (!stats) return <EmptyState title="Dashboard statistics unavailable." />;

  const statCards = [
    { label: "Registered Students", value: stats.totalStudents, to: "/admin/students", icon: "graduation-cap", variant: "default" },
    { label: "Approved Faculty", value: stats.approvedFaculty, to: "/admin/faculty-directory", icon: "users", variant: "default" },
    { label: "Certificates Submitted", value: stats.totalCertificates, to: "/admin/certificates", icon: "file-text", variant: "default" },
    { label: "Verified Certificates", value: stats.approvedCertificates, to: "/admin/certificates?status=verified", icon: "check-circle", variant: "verified" },
    { label: "Pending Faculty Approvals", value: stats.pendingFacultyApprovals, to: "/admin/faculty", icon: "shield", variant: "pending" },
    { label: "Pending Certificate Reviews", value: stats.pendingCertificateReviews, to: "/admin/certificates?status=pending", icon: "clock", variant: "pending" },
    { label: "Faculty Certificates", value: stats.facultyCertificates, to: "/admin/certificates?ownerRole=faculty", icon: "award", variant: "default" }
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            to={card.to}
            icon={card.icon}
            variant={card.variant}
          />
        ))}
      </div>

      {/* Recent Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recently Registered Students</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest student profiles onboarded to Proofolio.</p>
          </div>
          <Link to="/admin/students" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <span>View All Students</span>
            <Icon name="chevron-right" className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentStudents.length === 0 ? (
          <EmptyState title="No recent student registrations." />
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Registration Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentStudents.map((student) => {
                  const name = student.fullName || student.username;
                  return (
                    <tr key={student._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-semibold text-slate-800">{name}</td>
                      <td className="p-3.5 text-slate-600">{student.email}</td>
                      <td className="p-3.5 text-slate-500">
                        {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          to={`/admin/students/${student._id}`}
                          className="px-2.5 py-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold rounded-lg"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StudentDirectoryPage() {
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({
    departments: [],
    branches: [],
    sections: [],
    academicYears: [],
    semesters: []
  });
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (search.trim()) query.set("search", search.trim());
    if (department) query.set("department", department);
    if (branch) query.set("branch", branch);
    if (section) query.set("section", section);
    if (academicYear) query.set("currentAcademicYear", academicYear);
    if (semester) query.set("semester", semester);

    setLoading(true);
    fetchJson(`${API_ROOT}/students?${query}`)
      .then((data) => {
        setStudents(data.students || []);
        if (data.filters) setFilters(data.filters);
        setPagination(data.pagination || { total: 0, totalPages: 0, limit: 20 });
        setError("");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [page, search, department, branch, section, academicYear, semester]);

  const updateFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900">Institutional Student Directory</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {pagination.total} registered students across all academic branches.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="field">
          <label htmlFor="student-search">Search</label>
          <input id="student-search" value={search} onChange={updateFilter(setSearch)} placeholder="Name, roll number, email..." className="text-xs" />
        </div>
        <FilterSelect id="student-department" label="Department" value={department} values={filters.departments} onChange={updateFilter(setDepartment)} />
        <FilterSelect id="student-branch" label="Branch" value={branch} values={BRANCHES} allLabel="All Branches" onChange={updateFilter(setBranch)} />
        <FilterSelect id="student-section" label="Section" value={section} values={filters.sections} onChange={updateFilter(setSection)} />
        <FilterSelect id="student-year" label="Academic Year" value={academicYear} values={filters.academicYears} onChange={updateFilter(setAcademicYear)} />
        <FilterSelect id="student-semester" label="Semester" value={semester} values={filters.semesters} onChange={updateFilter(setSemester)} />
      </div>

      {error && <div className="p-3 text-xs text-rose-800 bg-rose-50 rounded-xl">{error}</div>}

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : students.length === 0 ? (
        <EmptyState title="No students match the selected filter criteria." />
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
                  <th className="p-3.5">Section</th>
                  <th className="p-3.5 text-center">Certs</th>
                  <th className="p-3.5 text-right">Actions</th>
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
                      <td className="p-3.5 text-slate-600">{student.profile?.section || "—"}</td>
                      <td className="p-3.5 text-center font-bold text-slate-700">{student.certificateCount ?? 0}</td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <Link
                          to={`/admin/students/${student._id}`}
                          className="px-2.5 py-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold rounded-lg"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pagination={pagination} setPage={setPage} />
        </div>
      )}
    </div>
  );
}

function CertificateSectionPage() {
  const [searchParams] = useSearchParams();
  return searchParams.get("ownerRole") === "faculty"
    ? <CertificatesPage />
    : <CertificateStudentDirectoryPage />;
}

function CertificateStudentDirectoryPage() {
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [branch, setBranch] = useState(searchParams.get("branch") || "");
  const [certificateStatus, setCertificateStatus] = useState(searchParams.get("status") || "");
  const [certificateType, setCertificateType] = useState(searchParams.get("type") || "");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setBranch(searchParams.get("branch") || "");
    setCertificateStatus(searchParams.get("status") || "");
    setCertificateType(searchParams.get("type") || "");
  }, [searchParams]);

  useEffect(() => {
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (search.trim()) query.set("search", search.trim());
    if (branch) query.set("branch", branch);
    if (certificateStatus) query.set("certificateStatus", certificateStatus);
    if (certificateType) query.set("certificateType", certificateType);

    setLoading(true);
    fetchJson(`${API_ROOT}/students?${query}`)
      .then((data) => {
        setStudents(data.students || []);
        setPagination(data.pagination || { total: 0, totalPages: 0 });
        setError("");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [page, search, branch, certificateStatus, certificateType]);

  const updateFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Student Certificate Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {pagination.total} students · select a student to inspect their submitted certificate archive.
          </p>
        </div>
        <Link
          to="/admin/certificates?ownerRole=faculty"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          View Faculty Certificates Archive →
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="field">
          <label htmlFor="cert-stud-search">Search</label>
          <input id="cert-stud-search" value={search} onChange={updateFilter(setSearch)} placeholder="Student name, roll number..." className="text-xs" />
        </div>
        <FilterSelect id="cert-stud-branch" label="Branch" value={branch} values={BRANCHES} allLabel="All Branches" onChange={updateFilter(setBranch)} />
        <div className="field">
          <label htmlFor="dir-cert-status">Status</label>
          <select id="dir-cert-status" value={certificateStatus} onChange={updateFilter(setCertificateStatus)} className="text-xs">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="dir-cert-category">Category</label>
          <select id="dir-cert-category" value={certificateType} onChange={updateFilter(setCertificateType)} className="text-xs">
            <option value="">All Categories</option>
            {["Hackathon", "Internship", "Certification", "Workshop", "Competition", "Extracurricular", "Project", "Other"].map((val) => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="p-3 text-xs text-rose-800 bg-rose-50 rounded-xl">{error}</div>}

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
                  <th className="p-3.5">Branch</th>
                  <th className="p-3.5 text-center">Certificates</th>
                  <th className="p-3.5 text-right">Certificate Archives</th>
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
                      <td className="p-3.5 text-slate-600">{student.profile?.branch || "—"}</td>
                      <td className="p-3.5 text-center font-bold text-slate-800">{student.certificateCount ?? 0}</td>
                      <td className="p-3.5 text-right">
                        <Link
                          to={{
                            pathname: `/admin/students/${student._id}/certificates`,
                            search: new URLSearchParams({
                              ...(branch ? { branch } : {}),
                              ...(search.trim() ? { directorySearch: search.trim() } : {}),
                              ...(certificateStatus ? { status: certificateStatus } : {}),
                              ...(certificateType ? { type: certificateType } : {})
                            }).toString()
                          }}
                          className="px-2.5 py-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold rounded-lg"
                        >
                          View Records
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pagination={pagination} setPage={setPage} />
        </div>
      )}
    </div>
  );
}

function CertificatesPage() {
  const { id: studentId } = useParams();
  const [searchParams] = useSearchParams();
  const [certificates, setCertificates] = useState([]);
  const [student, setStudent] = useState(null);
  const [statusCounts, setStatusCounts] = useState({ pending: 0, verified: 0, rejected: 0 });
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [ownerRole, setOwnerRole] = useState(studentId ? "student" : searchParams.get("ownerRole") || "");
  const [department, setDepartment] = useState(searchParams.get("department") || "");
  const [branch, setBranch] = useState(searchParams.get("branch") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [sortOrder, setSortOrder] = useState(searchParams.get("sortOrder") || "desc");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setOwnerRole(studentId ? "student" : searchParams.get("ownerRole") || "");
    setSearch(searchParams.get("search") || "");
    setDepartment(searchParams.get("department") || "");
    setBranch(searchParams.get("branch") || "");
    setType(searchParams.get("type") || "");
    setStatus(searchParams.get("status") || "");
    setSortOrder(searchParams.get("sortOrder") || "desc");
    setDateFrom(searchParams.get("dateFrom") || "");
    setDateTo(searchParams.get("dateTo") || "");
  }, [searchParams, studentId]);

  useEffect(() => {
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (ownerRole) query.set("ownerRole", ownerRole);
    if (studentId) query.set("ownerRole", "student");
    if (studentId) query.set("studentId", studentId);
    if (branch) query.set("branch", branch);
    if (search.trim()) query.set("search", search.trim());
    if (department) query.set("department", department);
    if (type) query.set("type", type);
    if (status) query.set("status", status);
    if (sortOrder) query.set("sortOrder", sortOrder);
    if (dateFrom) query.set("dateFrom", dateFrom);
    if (dateTo) query.set("dateTo", dateTo);

    setLoading(true);
    const certificateRequest = fetchJson(`${API_ROOT}/certificates?${query}`);
    const studentRequest = studentId
      ? fetchJson(`${API_ROOT}/students/${studentId}`)
      : Promise.resolve(null);

    Promise.all([certificateRequest, studentRequest])
      .then(([data, studentData]) => {
        setCertificates(data.certificates || []);
        setStatusCounts(data.statusCounts || { pending: 0, verified: 0, rejected: 0 });
        setStudent(studentData?.student || null);
        setPagination(data.pagination || { total: 0, totalPages: 0, limit: 20 });
        setError("");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [studentId, page, search, ownerRole, department, branch, type, status, sortOrder, dateFrom, dateTo, searchParams]);

  const updateFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {studentId ? "Student Certificates" : ownerRole === "faculty" ? "Faculty Certificates" : "All Achievement Certificates"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {studentId
                ? `${student?.profile?.fullName || student?.fullName || student?.username || "Student"} · Roll: ${student?.profile?.rollNumber || "—"} · ${pagination.total} records`
                : `${pagination.total} records tracked`}
            </p>
          </div>
          {studentId && (
            <Link to="/admin/certificates" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              ← Back to Directory
            </Link>
          )}
        </div>

        {/* Status Count Metric Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Records" value={pagination.total} icon="file-text" />
          <StatCard label="Approved" value={statusCounts.verified} icon="check-circle" variant="verified" />
          <StatCard label="Pending" value={statusCounts.pending} icon="clock" variant="pending" />
          <StatCard label="Rejected" value={statusCounts.rejected} icon="x-circle" variant="rejected" />
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          {!studentId && (
            <div className="field">
              <label htmlFor="owner-role-filter">Owner Role</label>
              <select id="owner-role-filter" value={ownerRole} onChange={updateFilter(setOwnerRole)} className="text-xs">
                <option value="">All Roles</option>
                <option value="student">Student Only</option>
                <option value="faculty">Faculty Only</option>
              </select>
            </div>
          )}
          <div className="field">
            <label htmlFor="admin-cert-search">Search</label>
            <input id="admin-cert-search" value={search} onChange={updateFilter(setSearch)} placeholder="Title, student, roll..." className="text-xs" />
          </div>
          <div className="field">
            <label htmlFor="admin-cert-dept">Department</label>
            <input id="admin-cert-dept" value={department} onChange={updateFilter(setDepartment)} placeholder="Department..." className="text-xs" />
          </div>
          {!studentId && <FilterSelect id="admin-cert-branch" label="Branch" value={branch} values={BRANCHES} allLabel="All Branches" onChange={updateFilter(setBranch)} />}
          <div className="field">
            <label htmlFor="admin-cert-status">Status</label>
            <select id="admin-cert-status" value={status} onChange={updateFilter(setStatus)} className="text-xs">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="admin-cert-order">Order</label>
            <select id="admin-cert-order" value={sortOrder} onChange={updateFilter(setSortOrder)} className="text-xs">
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {error && <div className="p-3 text-xs text-rose-800 bg-rose-50 rounded-xl">{error}</div>}

        {loading ? (
          <LoadingSkeleton count={3} />
        ) : certificates.length === 0 ? (
          <EmptyState title="No certificates match the selected filters." />
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-3.5">Title</th>
                    <th className="p-3.5">Owner</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Organization</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {certificates.map((cert) => (
                    <tr key={cert._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-semibold text-slate-800 max-w-xs truncate">{cert.title}</td>
                      <td className="p-3.5">
                        <span className="font-medium text-slate-700 block">
                          {cert.profile?.fullName || cert.owner?.fullName || cert.owner?.username}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {cert.ownerRole === "faculty" ? cert.profile?.employeeId : cert.profile?.rollNumber}
                        </span>
                      </td>
                      <td className="p-3.5"><RoleBadge role={cert.ownerRole || cert.owner?.role} /></td>
                      <td className="p-3.5"><CategoryBadge category={cert.type} /></td>
                      <td className="p-3.5 text-slate-600">{cert.organization || "—"}</td>
                      <td className="p-3.5"><StatusBadge status={cert.verificationStatus} /></td>
                      <td className="p-3.5 text-right whitespace-nowrap space-x-2">
                        {cert.certificateUrl && (
                          <a
                            href={cert.certificateUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg inline-flex items-center gap-1"
                          >
                            <span>File</span>
                            <Icon name="external-link" className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pagination={pagination} setPage={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}

function FacultyDirectoryPage() {
  const [faculty, setFaculty] = useState([]);
  const [branches, setBranches] = useState(BRANCHES);
  const [branch, setBranch] = useState("");
  const [search, setSearch] = useState("");
  const [branchChanges, setBranchChanges] = useState({});
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadFaculty = useCallback(async () => {
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (branch) query.set("branch", branch);
    if (search.trim()) query.set("search", search.trim());
    setLoading(true);
    try {
      const data = await fetchJson(`${API_ROOT}/faculty?${query}`);
      setFaculty(data.faculty || []);
      setBranches(data.branches || BRANCHES);
      setPagination(data.pagination || { total: 0, totalPages: 0 });
      setBranchChanges(Object.fromEntries((data.faculty || []).map((m) => [m._id, m.profile?.branch || ""])));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [page, branch, search]);

  useEffect(() => {
    loadFaculty();
  }, [loadFaculty]);

  const saveBranch = async (member) => {
    setSavingId(member._id);
    setMessage("");
    setError("");
    try {
      const data = await fetchJson(`${API_ROOT}/faculty/${member._id}/branch`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch: branchChanges[member._id] })
      });
      setMessage(data.message || "Faculty branch assignment updated.");
      await loadFaculty();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900">Faculty Directory & Branch Assignments</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {pagination.total} registered faculty members · branch assignments govern student certificate review scope.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-xl">
        <div className="field">
          <label htmlFor="fac-dir-search">Search</label>
          <input id="fac-dir-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, employee ID, department..." className="text-xs" />
        </div>
        <FilterSelect id="fac-dir-branch" label="Branch Filter" value={branch} values={branches} allLabel="All Branches" onChange={(e) => setBranch(e.target.value)} />
      </div>

      {message && <div className="p-3 text-xs text-emerald-800 bg-emerald-50 rounded-xl">{message}</div>}
      {error && <div className="p-3 text-xs text-rose-800 bg-rose-50 rounded-xl">{error}</div>}

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : faculty.length === 0 ? (
        <EmptyState title="No faculty members match these filters." />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-3.5">Faculty Member</th>
                  <th className="p-3.5">Employee ID</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Designation</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Assigned Review Branch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {faculty.map((member) => {
                  const name = member.profile?.fullName || member.fullName || member.username;
                  const isModified = (branchChanges[member._id] || "") !== (member.profile?.branch || "");

                  return (
                    <tr key={member._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800 block">{name}</span>
                        <span className="text-[11px] text-slate-400">{member.email}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">{member.profile?.employeeId || "—"}</td>
                      <td className="p-3.5 text-slate-600">{member.profile?.department || "—"}</td>
                      <td className="p-3.5 text-slate-600">{member.profile?.designation || "—"}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {member.status || "approved"}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <select
                            value={branchChanges[member._id] || ""}
                            onChange={(e) => setBranchChanges((prev) => ({ ...prev, [member._id]: e.target.value }))}
                            className="text-xs py-1 px-2 border-slate-300 rounded-lg w-32"
                          >
                            <option value="">Unassigned</option>
                            {branches.map((b) => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={savingId === member._id || !isModified}
                            onClick={() => saveBranch(member)}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                              isModified
                                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            {savingId === member._id ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pagination={pagination} setPage={setPage} />
        </div>
      )}
    </div>
  );
}

function FacultyApprovalsPage() {
  const [pendingFaculty, setPendingFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, faculty: null, decision: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPendingFaculty = async () => {
    setLoading(true);
    try {
      const data = await fetchJson(`${API_ROOT}/faculty/pending`);
      setPendingFaculty(data.pendingFaculty || []);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingFaculty();
  }, []);

  const triggerDecision = (faculty, decision) => {
    setConfirmModal({ open: true, faculty, decision });
  };

  const handleDecision = async () => {
    const { faculty, decision } = confirmModal;
    if (!faculty) return;

    setActionId(faculty._id);
    setMessage("");
    setError("");

    try {
      const data = await fetchJson(`${API_ROOT}/faculty/${faculty._id}/${decision}`, { method: "PATCH" });
      setMessage(data.message || `Faculty registration ${decision}d successfully.`);
      setConfirmModal({ open: false, faculty: null, decision: "" });
      await loadPendingFaculty();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900">Faculty Registration Approvals</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Review new faculty credentials and authorize institutional access.
        </p>
      </div>

      {message && <div className="p-3 text-xs text-emerald-800 bg-emerald-50 rounded-xl">{message}</div>}
      {error && <div className="p-3 text-xs text-rose-800 bg-rose-50 rounded-xl">{error}</div>}

      {loading ? (
        <LoadingSkeleton count={2} />
      ) : pendingFaculty.length === 0 ? (
        <EmptyState
          icon="shield"
          title="No pending faculty registrations"
          description="All faculty applications have been processed."
        />
      ) : (
        <div className="space-y-4">
          {pendingFaculty.map((member) => {
            const name = member.profile?.fullName || member.fullName || member.username;
            return (
              <div key={member._id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      Pending Approval
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {member.email} · Employee ID: <strong>{member.profile?.employeeId || "—"}</strong>
                  </p>
                  <p className="text-xs text-slate-500">
                    {member.profile?.designation || "Faculty"} · Department: {member.profile?.department || "—"} · {member.profile?.institution || "—"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={actionId === member._id}
                    onClick={() => triggerDecision(member, "approve")}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 rounded-xl shadow-xs"
                  >
                    {actionId === member._id ? "Processing..." : "Approve Faculty"}
                  </button>
                  <button
                    type="button"
                    disabled={actionId === member._id}
                    onClick={() => triggerDecision(member, "reject")}
                    className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, faculty: null, decision: "" })}
        onConfirm={handleDecision}
        title={`${confirmModal.decision === "approve" ? "Approve" : "Reject"} Faculty Registration`}
        message={`Are you sure you want to ${confirmModal.decision} ${confirmModal.faculty?.profile?.fullName || confirmModal.faculty?.fullName || confirmModal.faculty?.username}'s faculty account?`}
        confirmText={confirmModal.decision === "approve" ? "Approve" : "Reject"}
        isDestructive={confirmModal.decision === "reject"}
        isLoading={actionId !== null}
      />
    </div>
  );
}

function StudentDetailsPage() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJson(`${API_ROOT}/students/${id}`)
      .then((data) => setStudent(data.student))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton count={3} />;
  if (error) return <div className="p-4 bg-rose-50 text-rose-800 text-sm rounded-xl">{error}</div>;
  if (!student) return <EmptyState title="Student record not found." />;

  const profile = student.profile || {};
  const summary = student.achievementSummary || {};

  return (
    <div className="space-y-6">
      <Link
        to="/admin/students"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <Icon name="arrow-left" className="w-4 h-4" />
        <span>Back to Student Directory</span>
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{profile.fullName || student.fullName || student.username}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{student.email} · Roll: {profile.rollNumber || "—"}</p>
        </div>
        <Link
          to={`/admin/students/${student._id}/certificates`}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
        >
          <Icon name="file-text" className="w-4 h-4" />
          <span>View Student Certificates ({summary.total ?? 0})</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Submissions" value={summary.total ?? 0} icon="file-text" />
        <StatCard label="Approved" value={summary.approved ?? 0} icon="check-circle" variant="verified" />
        <StatCard label="Pending" value={summary.pending ?? 0} icon="clock" variant="pending" />
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
            Academic Enrollment
          </h3>
          <dl className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Institution</dt>
              <dd className="font-semibold text-slate-800">{profile.institution || "—"}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Degree & Department</dt>
              <dd className="font-semibold text-slate-800">{profile.degree || "—"} · {profile.department || "—"}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Branch</dt>
              <dd className="font-semibold text-slate-800">{profile.branch || "—"}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Roll Number</dt>
              <dd className="font-semibold text-slate-800">{profile.rollNumber || "—"}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Academic Year</dt>
              <dd className="font-semibold text-slate-800">{profile.currentAcademicYear || "—"}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500">Semester & Section</dt>
              <dd className="font-semibold text-slate-800">Sem {profile.currentSemester ?? "—"} · Sec {profile.section || "—"}</dd>
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

function FilterSelect({ id, label, value, values = [], onChange, allLabel = "All" }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={onChange} className="text-xs">
        <option value="">{allLabel}</option>
        {values.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function Pagination({ page, pagination, setPage }) {
  if (!pagination.totalPages || pagination.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
      <span>Page {page} of {pagination.totalPages} · {pagination.total} records</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1.5 font-medium border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= pagination.totalPages}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1.5 font-medium border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;
