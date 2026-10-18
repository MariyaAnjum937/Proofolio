import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useParams, useSearchParams } from "react-router-dom";

const API_ROOT = "http://localhost:3000/api/admin";

async function fetchJson(url, options = {}) {
  const response = await fetch(url, { credentials: "include", ...options });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "The request failed.");
  }
  return data;
}

function AdminDashboard() {
  return (
    <div className="page admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Institutional overview of students, achievements, and faculty approvals.</p>
        </div>
      </div>

      <nav className="admin-nav" aria-label="Admin dashboard">
        <NavLink to="/admin" end>Overview</NavLink>
        <NavLink to="/admin/students">Students</NavLink>
        <NavLink to="/admin/certificates">Certificates</NavLink>
        <NavLink to="/admin/faculty">Faculty Approvals</NavLink>
      </nav>

      <Routes>
        <Route index element={<OverviewPage />} />
        <Route path="students" element={<StudentDirectoryPage />} />
        <Route path="students/:id" element={<StudentDetailsPage />} />
        <Route path="students/:id/certificates" element={<CertificatesPage />} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="faculty" element={<FacultyApprovalsPage />} />
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

  if (loading) return <div className="empty"><h3>Loading dashboard statistics...</h3></div>;
  if (error) return <div className="message error-message">{error}</div>;
  if (!stats) return <div className="empty"><h3>Dashboard statistics are unavailable.</h3></div>;

  const cards = [
    { label: "Registered Students", value: stats.totalStudents, to: "/admin/students" },
    { label: "Approved Faculty", value: stats.approvedFaculty, to: "/admin/faculty" },
    { label: "Certificates Submitted", value: stats.totalCertificates, to: "/admin/certificates" },
    { label: "Faculty Certificates", value: stats.facultyCertificates, to: "/admin/certificates?ownerRole=faculty" },
    { label: "Approved Certificates", value: stats.approvedCertificates, to: "/admin/certificates?status=verified", className: "verified-stat" },
    { label: "Pending Faculty Approvals", value: stats.pendingFacultyApprovals, to: "/admin/faculty", className: "pending-stat" },
    { label: "Pending Certificate Reviews", value: stats.pendingCertificateReviews, to: "/admin/certificates?status=pending", className: "pending-stat" }
  ];

  return (
    <>
      <div className="stats-row admin-stats-row">
        {cards.map((card) => (
          <Link className={`stat-card admin-stat-card ${card.className || ""}`} to={card.to} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </Link>
        ))}
      </div>

      <section className="admin-users-panel admin-overview-panel">
        <div className="admin-section-heading">
          <div>
            <h2>Recently Registered Students</h2>
            <p>Latest student accounts registered in Proofolio.</p>
          </div>
          <Link className="text-action" to="/admin/students">View student directory</Link>
        </div>

        {recentStudents.length === 0 ? (
          <div className="empty"><h3>No students have registered yet.</h3></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Student</th><th>Email</th><th>Registered</th></tr>
              </thead>
              <tbody>
                {recentStudents.map((student) => (
                  <tr key={student._id}>
                    <td>{student.fullName || student.username}</td>
                    <td>{student.email}</td>
                    <td>{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
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
        setFilters(data.filters || filters);
        setPagination(data.pagination || { total: 0, totalPages: 0, limit: 20 });
        setError("");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [page, search, department, branch, section, academicYear, semester]);

  const updateFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <section className="admin-users-panel">
      <div className="admin-section-heading">
        <div>
          <h2>Student Directory</h2>
          <p>{pagination.total} registered students</p>
        </div>
      </div>

      <div className="admin-filters">
        <div className="field">
          <label htmlFor="student-search">Search name, roll number, or email</label>
          <input id="student-search" value={search} onChange={updateFilter(setSearch)} placeholder="Search students" />
        </div>
        <FilterSelect id="student-department" label="Department" value={department} values={filters.departments} onChange={updateFilter(setDepartment)} />
        <FilterSelect id="student-branch" label="Branch" value={branch} values={filters.branches} onChange={updateFilter(setBranch)} />
        <FilterSelect id="student-section" label="Section" value={section} values={filters.sections} onChange={updateFilter(setSection)} />
        <FilterSelect id="student-year" label="Academic year" value={academicYear} values={filters.academicYears} onChange={updateFilter(setAcademicYear)} />
        <FilterSelect id="student-semester" label="Semester" value={semester} values={filters.semesters} onChange={updateFilter(setSemester)} />
      </div>

      {error && <p className="message error-message">{error}</p>}
      {loading ? (
        <div className="empty"><h3>Loading students...</h3></div>
      ) : students.length === 0 ? (
        <div className="empty"><h3>No students match these filters.</h3></div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th><th>Roll number</th><th>Department</th><th>Branch</th>
                  <th>Academic year</th><th>Semester</th><th>Section</th><th>Certificates</th><th>Profile</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.profile?.fullName || student.fullName || student.username}</td>
                    <td>{student.profile?.rollNumber || "—"}</td>
                    <td>{student.profile?.department || "—"}</td>
                    <td>{student.profile?.branch || "—"}</td>
                    <td>{student.profile?.currentAcademicYear || "—"}</td>
                    <td>{student.profile?.currentSemester ?? "—"}</td>
                    <td>{student.profile?.section || "—"}</td>
                    <td>{student.certificateCount ?? 0}</td>
                    <td><Link to={`/admin/students/${student._id}`}>View details</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pagination={pagination} setPage={setPage} />
        </>
      )}
    </section>
  );
}

function FilterSelect({ id, label, value, values, onChange }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={onChange}>
        <option value="">All</option>
        {values.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

function Pagination({ page, pagination, setPage }) {
  if (pagination.totalPages <= 1) return null;
  return (
    <div className="admin-pagination">
      <span>Page {page} of {pagination.totalPages} · {pagination.total} records</span>
      <div>
        <button type="button" onClick={() => setPage((current) => current - 1)} disabled={page <= 1}>Previous</button>
        <button type="button" onClick={() => setPage((current) => current + 1)} disabled={page >= pagination.totalPages}>Next</button>
      </div>
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

  if (loading) return <div className="empty"><h3>Loading student profile...</h3></div>;
  if (error) return <p className="message error-message">{error}</p>;
  if (!student) return <div className="empty"><h3>Student profile not found.</h3></div>;

  const profile = student.profile || {};
  const summary = student.achievementSummary || {};

  return (
    <div className="admin-detail-page">
      <Link className="text-action" to="/admin/students">← Back to students</Link>
      <section className="admin-users-panel">
        <div className="admin-section-heading">
          <div>
            <h2>{profile.fullName || student.fullName || student.username}</h2>
            <p>Read-only student profile</p>
          </div>
          <Link className="verify-button admin-link-button" to={`/admin/students/${student._id}/certificates`}>View certificates</Link>
        </div>
        <div className="admin-detail-grid">
          <DetailGroup title="Personal Information" items={[
            ["Full name", profile.fullName || student.fullName],
            ["Username", student.username],
            ["Email", student.email],
            ["Phone", profile.phone || student.phone]
          ]} />
          <DetailGroup title="Academic Information" items={[
            ["Institution", profile.institution],
            ["Degree", profile.degree],
            ["Department", profile.department],
            ["Branch / Specialization", profile.branch],
            ["Roll number", profile.rollNumber],
            ["Admission year", profile.admissionYear],
            ["Expected graduation", profile.graduationYear],
            ["Academic year", profile.currentAcademicYear],
            ["Semester", profile.currentSemester],
            ["Section", profile.section],
            ["CGPA", profile.cgpa]
          ]} />
        </div>
      </section>
      <section className="stats-row admin-detail-stats">
        <div className="stat-card"><span>Total certificates</span><strong>{summary.total ?? 0}</strong></div>
        <div className="stat-card verified-stat"><span>Approved</span><strong>{summary.approved ?? 0}</strong></div>
        <div className="stat-card pending-stat"><span>Pending</span><strong>{summary.pending ?? 0}</strong></div>
        <div className="stat-card"><span>Rejected</span><strong>{summary.rejected ?? 0}</strong></div>
      </section>
    </div>
  );
}

function DetailGroup({ title, items }) {
  return (
    <section className="admin-detail-group">
      <h3>{title}</h3>
      <dl>
        {items.map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{value === null || value === undefined || value === "" ? "—" : value}</dd></div>
        ))}
      </dl>
    </section>
  );
}

function CertificatesPage() {
  const { id: studentId } = useParams();
  const [searchParams] = useSearchParams();
  const [certificates, setCertificates] = useState([]);
  const [student, setStudent] = useState(null);
  const [statusCounts, setStatusCounts] = useState({ pending: 0, verified: 0, rejected: 0 });
  const [search, setSearch] = useState("");
  const [ownerRole, setOwnerRole] = useState(searchParams.get("ownerRole") || "");
  const [department, setDepartment] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setOwnerRole(searchParams.get("ownerRole") || "");
    setStatus(searchParams.get("status") || "");
  }, [searchParams]);

  useEffect(() => {
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (ownerRole) query.set("ownerRole", ownerRole);
    if (studentId) query.set("studentId", studentId);
    if (search.trim()) query.set("search", search.trim());
    if (department) query.set("department", department);
    if (type) query.set("type", type);
    if (status) query.set("status", status);
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
  }, [studentId, page, search, ownerRole, department, type, status, dateFrom, dateTo]);

  const updateFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <section className="admin-users-panel">
      <div className="admin-section-heading">
        <div>
          <h2>{studentId ? "Student Certificates" : "Student Certificates Directory"}</h2>
          <p>
            {studentId
              ? `${student?.profile?.fullName || student?.fullName || student?.username || "Student"} · Roll number: ${student?.profile?.rollNumber || "—"} · ${pagination.total} achievement records`
              : `${pagination.total} achievement records`}
          </p>
        </div>
        {studentId && <Link className="text-action" to={`/admin/students/${studentId}`}>← Back to student profile</Link>}
      </div>

      <div className="stats-row admin-detail-stats">
        <div className="stat-card"><span>Total certificates</span><strong>{pagination.total}</strong></div>
        <div className="stat-card pending-stat"><span>Pending</span><strong>{statusCounts.pending}</strong></div>
        <div className="stat-card verified-stat"><span>Approved</span><strong>{statusCounts.verified}</strong></div>
        <div className="stat-card"><span>Rejected</span><strong>{statusCounts.rejected}</strong></div>
      </div>

      <div className="admin-filters certificate-filters">
        <div className="field">
          <label htmlFor="certificate-owner-role">Certificate owner</label>
          <select id="certificate-owner-role" value={ownerRole} onChange={updateFilter(setOwnerRole)}>
            <option value="">All certificates</option>
            <option value="student">Student certificates</option>
            <option value="faculty">Faculty certificates</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="certificate-search">Search title, student, or roll number</label>
          <input id="certificate-search" value={search} onChange={updateFilter(setSearch)} placeholder="Search certificates" />
        </div>
        <div className="field">
          <label htmlFor="certificate-department">Department</label>
          <input id="certificate-department" value={department} onChange={updateFilter(setDepartment)} placeholder="All departments" />
        </div>
        <div className="field">
          <label htmlFor="certificate-type">Category</label>
          <select id="certificate-type" value={type} onChange={updateFilter(setType)}>
            <option value="">All categories</option>
            {["Hackathon", "Internship", "Certification", "Workshop", "Competition", "Extracurricular", "Project", "Other"].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="certificate-status">Verification status</label>
          <select id="certificate-status" value={status} onChange={updateFilter(setStatus)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="certificate-date-from">Submitted from</label>
          <input id="certificate-date-from" type="date" value={dateFrom} onChange={updateFilter(setDateFrom)} />
        </div>
        <div className="field">
          <label htmlFor="certificate-date-to">Submitted through</label>
          <input id="certificate-date-to" type="date" value={dateTo} onChange={updateFilter(setDateTo)} />
        </div>
      </div>

      {error && <p className="message error-message">{error}</p>}
      {loading ? (
        <div className="empty"><h3>Loading certificates...</h3></div>
      ) : certificates.length === 0 ? (
        <div className="empty"><h3>No certificates match these filters.</h3></div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Achievement</th><th>Owner</th><th>Role</th><th>Roll number / Employee ID</th><th>Department</th><th>Category</th><th>Organization</th><th>Issue date</th><th>Submitted</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {certificates.map((certificate) => (
                  <tr key={certificate._id}>
                    <td>{certificate.title}</td>
                    <td>{certificate.profile?.fullName || certificate.owner?.fullName || certificate.owner?.username}</td>
                    <td>{certificate.ownerRole || certificate.owner?.role}</td>
                    <td>{certificate.ownerRole === "faculty" ? certificate.profile?.employeeId || "—" : certificate.profile?.rollNumber || "—"}</td>
                    <td>{certificate.profile?.department || "—"}</td>
                    <td>{certificate.type}</td>
                    <td>{certificate.organization}</td>
                    <td>{certificate.date ? new Date(certificate.date).toLocaleDateString() : "—"}</td>
                    <td>{certificate.createdAt ? new Date(certificate.createdAt).toLocaleDateString() : "—"}</td>
                    <td><span className={`status-badge ${certificate.verificationStatus || "pending"}`}>{certificate.verificationStatus || "pending"}</span></td>
                    <td className="admin-table-actions">
                      {certificate.ownerRole === "faculty"
                        ? <Link to={`/admin/certificates?ownerRole=faculty`}>Faculty</Link>
                        : <Link to={`/admin/students/${certificate.owner?._id}`}>Student</Link>}
                      {certificate.certificateUrl && <a href={certificate.certificateUrl} target="_blank" rel="noreferrer">View file</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pagination={pagination} setPage={setPage} />
        </>
      )}
    </section>
  );
}

function FacultyApprovalsPage() {
  const [pendingFaculty, setPendingFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
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

  const decideFaculty = async (faculty, decision) => {
    const name = faculty.profile?.fullName || faculty.fullName || faculty.username;
    const action = decision === "approve" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${action} ${name}'s faculty registration?`)) return;

    setActionId(faculty._id);
    setMessage("");
    try {
      const data = await fetchJson(`${API_ROOT}/faculty/${faculty._id}/${decision}`, { method: "PATCH" });
      setMessage(data.message || `Faculty account ${decision}d successfully.`);
      await loadPendingFaculty();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <section className="admin-users-panel">
      <div className="admin-section-heading">
        <div><h2>Faculty Approvals</h2><p>Review registrations before granting faculty access.</p></div>
      </div>
      {message && <p className="message">{message}</p>}
      {error && <p className="message error-message">{error}</p>}
      {loading ? (
        <div className="empty"><h3>Loading pending faculty...</h3></div>
      ) : pendingFaculty.length === 0 ? (
        <div className="empty"><h3>No faculty registrations are waiting for approval.</h3></div>
      ) : (
        <div className="admin-users-list">
          {pendingFaculty.map((faculty) => (
            <div key={faculty._id} className="admin-user-row faculty-review-row">
              <div className="admin-user-info">
                <div className="admin-user-header">
                  <strong>{faculty.profile?.fullName || faculty.fullName || faculty.username}</strong>
                  <span className="role-pill faculty">Pending</span>
                </div>
                <span>{faculty.email}</span>
                <span>{faculty.profile?.designation || "—"} · {faculty.profile?.department || "—"}</span>
                <span>{faculty.profile?.institution || "—"} · Employee ID: {faculty.profile?.employeeId || "—"}</span>
                {faculty.createdAt && <span>Registered: {new Date(faculty.createdAt).toLocaleDateString()}</span>}
              </div>
              <div className="faculty-action-buttons">
                <button className="verify-button" onClick={() => decideFaculty(faculty, "approve")} disabled={actionId === faculty._id}>
                  {actionId === faculty._id ? "Processing..." : "Approve"}
                </button>
                <button className="reject-button" onClick={() => decideFaculty(faculty, "reject")} disabled={actionId === faculty._id}>
                  {actionId === faculty._id ? "Processing..." : "Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminDashboard;
