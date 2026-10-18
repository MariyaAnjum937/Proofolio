import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useParams } from "react-router-dom";
import FacultyMentoring from "./FacultyMentoring";

const FACULTY_API = "http://localhost:3000/api/faculty";
const REVIEW_API = "http://localhost:3000/api/achievements";
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
      <div className="page">
        <div className="dashboard-header">
          <div><h1>Faculty Profile</h1><p>Your account status is {status}.</p></div>
        </div>
        <p className="message">
          {status === "rejected"
            ? "Your faculty account was rejected. Please contact the administrator."
            : "Your account is awaiting administrator approval. Faculty dashboard features will be available after approval."}
        </p>
      </div>
    );
  }

  return (
    <div className="page faculty-dashboard">
      <div className="dashboard-header">
        <div><h1>Faculty Dashboard</h1><p>Review student achievements and manage your professional certificates.</p></div>
      </div>
      <nav className="faculty-nav" aria-label="Faculty dashboard">
        <NavLink to="/faculty" end>Overview</NavLink>
        <NavLink to="/faculty/students">My Students</NavLink>
        <NavLink to="/faculty/mentoring">Mentoring</NavLink>
        <NavLink to="/faculty/student-certificates">Student Certificates</NavLink>
        <NavLink to="/faculty/my-certificates">My Certificates</NavLink>
        <NavLink to="/faculty/reviews">Certificate Reviews</NavLink>
        <NavLink to="/faculty/profile">My Profile</NavLink>
      </nav>
      <Routes>
        <Route index element={<FacultyOverview />} />
        <Route path="students" element={<FacultyStudents />} />
        <Route path="mentoring/*" element={<FacultyMentoring />} />
        <Route path="students/:studentId" element={<FacultyStudentProfile />} />
        <Route path="students/:studentId/certificates" element={<FacultyStudentCertificates />} />
        <Route path="student-certificates" element={<FacultyStudentCertificates />} />
        <Route path="student-certificates/:certificateId" element={<FacultyCertificateDetail />} />
        <Route path="my-certificates" element={<MyCertificates />} />
        <Route path="reviews" element={<CertificateReviews />} />
        <Route path="profile" element={<FacultyProfile />} />
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

  if (loading) return <div className="empty"><h3>Loading faculty overview...</h3></div>;
  if (error) return <p className="message error-message">{error}</p>;

  return (
    <>
      <div className="stats-row">
        <Link className="stat-card admin-stat-card" to="/faculty/students"><span>Students</span><strong>{stats.studentCount}</strong></Link>
        <Link className="stat-card pending-stat admin-stat-card" to="/faculty/reviews"><span>Pending Certificate Reviews</span><strong>{stats.pendingReviews}</strong></Link>
        <Link className="stat-card verified-stat admin-stat-card" to="/faculty/my-certificates"><span>My Certificates</span><strong>{stats.myCertificates}</strong></Link>
      </div>
      <section className="faculty-card">
        <h2>Faculty tools</h2>
        <p>Student directory access follows the current institution-wide faculty review policy. Faculty members can browse student profiles and achievements, review student certificate submissions, and maintain their own professional certificate collection.</p>
        <div className="faculty-action-buttons">
          <Link className="verify-button faculty-link-button" to="/faculty/students">Browse students</Link>
          <Link className="verify-button faculty-link-button" to="/faculty/student-certificates">Browse student certificates</Link>
        </div>
      </section>
    </>
  );
}

function FacultyStudents() {
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

  useEffect(() => {
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (search.trim()) query.set("search", search.trim());
    if (department) query.set("department", department);
    if (branch) query.set("branch", branch);
    if (section) query.set("section", section);
    if (academicYear) query.set("currentAcademicYear", academicYear);
    if (semester) query.set("semester", semester);
    setLoading(true);
    requestJson(`${FACULTY_API}/students?${query}`)
      .then((data) => {
        setStudents(data.students || []);
        setFilters(data.filters || filters);
        setPagination(data.pagination || { total: 0, totalPages: 0 });
        setError("");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [page, search, department, branch, section, academicYear, semester]);

  const change = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <section className="admin-users-panel">
      <div className="admin-section-heading"><div><h2>My Students</h2><p>{pagination.total} students in the current directory scope.</p></div></div>
      <div className="admin-filters">
        <div className="field"><label htmlFor="faculty-student-search">Search name, roll number, or email</label><input id="faculty-student-search" value={search} onChange={change(setSearch)} placeholder="Search students" /></div>
        <Filter id="faculty-department" label="Department" value={department} options={filters.departments} onChange={change(setDepartment)} />
        <Filter id="faculty-branch" label="Branch" value={branch} options={filters.branches} onChange={change(setBranch)} />
        <Filter id="faculty-section" label="Section" value={section} options={filters.sections} onChange={change(setSection)} />
        <Filter id="faculty-year" label="Academic year" value={academicYear} options={filters.academicYears} onChange={change(setAcademicYear)} />
        <Filter id="faculty-semester" label="Semester" value={semester} options={filters.semesters} onChange={change(setSemester)} />
      </div>
      {error && <p className="message error-message">{error}</p>}
      {loading ? <div className="empty"><h3>Loading students...</h3></div> : students.length === 0 ? (
        <div className="empty"><h3>No students match these filters.</h3></div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Roll number</th><th>Department</th><th>Branch</th><th>Section</th><th>Academic year</th><th>Semester</th><th>Certificates</th><th>Verified</th><th>Actions</th></tr></thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.profile?.fullName || student.fullName || student.username}</td>
                    <td>{student.profile?.rollNumber || "—"}</td>
                    <td>{student.profile?.department || "—"}</td>
                    <td>{student.profile?.branch || "—"}</td>
                    <td>{student.profile?.section || "—"}</td>
                    <td>{student.profile?.currentAcademicYear || "—"}</td>
                    <td>{student.profile?.currentSemester ?? "—"}</td>
                    <td>{student.certificateCount ?? 0}</td>
                    <td>{student.verifiedCertificateCount ?? 0}</td>
                    <td className="admin-table-actions">
                      <Link to={`/faculty/students/${student._id}`}>Profile</Link>
                      <Link to={`/faculty/students/${student._id}/certificates`}>Certificates</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} pagination={pagination} setPage={setPage} />
        </>
      )}
    </section>
  );
}

function Filter({ id, label, value, options, onChange }) {
  return <div className="field"><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={onChange}><option value="">All</option>{options.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>;
}

function Pager({ page, pagination, setPage }) {
  if (!pagination.totalPages || pagination.totalPages <= 1) return null;
  return (
    <div className="admin-pagination">
      <span>Page {page} of {pagination.totalPages} · {pagination.total} records</span>
      <div><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></div>
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
  if (loading) return <div className="empty"><h3>Loading student profile...</h3></div>;
  if (error) return <p className="message error-message">{error}</p>;
  if (!student) return <div className="empty"><h3>Student profile not found.</h3></div>;
  const profile = student.profile || {};
  const summary = student.achievementSummary || {};
  return (
    <div className="admin-detail-page">
      <Link className="text-action" to="/faculty/students">← Back to students</Link>
      <section className="admin-users-panel">
        <div className="admin-section-heading">
          <div><h2>{profile.fullName || student.fullName || student.username}</h2><p>Read-only student profile</p></div>
          <Link className="verify-button faculty-link-button" to={`/faculty/students/${studentId}/certificates`}>View Certificates</Link>
        </div>
        <div className="admin-detail-grid">
          <DetailGroup title="Personal Information" items={[["Full name", profile.fullName || student.fullName], ["Username", student.username], ["Email", student.email], ["Phone", profile.phone || student.phone]]} />
          <DetailGroup title="Academic Information" items={[
            ["Institution", profile.institution], ["Degree", profile.degree], ["Department", profile.department],
            ["Branch", profile.branch], ["Roll number", profile.rollNumber], ["Admission year", profile.admissionYear],
            ["Expected graduation", profile.graduationYear], ["Academic year", profile.currentAcademicYear],
            ["Semester", profile.currentSemester], ["Section", profile.section], ["CGPA", profile.cgpa]
          ]} />
        </div>
      </section>
      <div className="stats-row admin-detail-stats">
        <div className="stat-card"><span>Certificates</span><strong>{summary.total ?? 0}</strong></div>
        <div className="stat-card verified-stat"><span>Verified</span><strong>{summary.verified ?? 0}</strong></div>
        <div className="stat-card pending-stat"><span>Pending</span><strong>{summary.pending ?? 0}</strong></div>
        <div className="stat-card"><span>Rejected</span><strong>{summary.rejected ?? 0}</strong></div>
      </div>
    </div>
  );
}

function DetailGroup({ title, items }) {
  return <section className="admin-detail-group"><h3>{title}</h3><dl>{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value === null || value === undefined || value === "" ? "—" : value}</dd></div>)}</dl></section>;
}

function FacultyStudentCertificates() {
  const { studentId } = useParams();
  const [certificates, setCertificates] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [type, setType] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (studentId) query.set("studentId", studentId);
    if (search.trim()) query.set("search", search.trim());
    if (department) query.set("department", department);
    if (type) query.set("type", type);
    if (academicYear) query.set("academicYear", academicYear);
    if (status) query.set("status", status);
    setLoading(true);
    requestJson(`${FACULTY_API}/student-certificates?${query}`)
      .then((data) => {
        setCertificates(data.certificates || []);
        setPagination(data.pagination || { total: 0, totalPages: 0 });
        setError("");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [studentId, search, department, type, academicYear, status, page]);
  const change = (setter) => (event) => { setter(event.target.value); setPage(1); };
  return (
    <section className="admin-users-panel">
      <div className="admin-section-heading"><div><h2>{studentId ? "Student Certificates" : "Student Certificates"}</h2><p>{pagination.total} student achievement submissions</p></div>{studentId && <Link className="text-action" to={`/faculty/students/${studentId}`}>← Student profile</Link>}</div>
      <div className="admin-filters">
        <div className="field"><label htmlFor="faculty-certificate-search">Search student, roll number, or title</label><input id="faculty-certificate-search" value={search} onChange={change(setSearch)} placeholder="Search certificates" /></div>
        <div className="field"><label htmlFor="faculty-certificate-department">Department</label><input id="faculty-certificate-department" value={department} onChange={change(setDepartment)} placeholder="All departments" /></div>
        <Filter id="faculty-certificate-type" label="Category" value={type} options={CATEGORIES} onChange={change(setType)} />
        <div className="field"><label htmlFor="faculty-academic-year">Academic year</label><input id="faculty-academic-year" value={academicYear} onChange={change(setAcademicYear)} placeholder="All years" /></div>
        <Filter id="faculty-certificate-status" label="Verification" value={status} options={["pending", "verified", "rejected"]} onChange={change(setStatus)} />
      </div>
      {error && <p className="message error-message">{error}</p>}
      {loading ? <div className="empty"><h3>Loading student certificates...</h3></div> : certificates.length === 0 ? (
        <div className="empty"><h3>No certificates match these filters.</h3></div>
      ) : (
        <>
          <div className="admin-table-wrap"><table className="admin-table">
            <thead><tr><th>Title</th><th>Student</th><th>Roll number</th><th>Department</th><th>Category</th><th>Organization</th><th>Achievement date</th><th>Submitted</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{certificates.map((certificate) => (
              <tr key={certificate._id}>
                <td>{certificate.title}</td><td>{certificate.profile?.fullName || certificate.student?.fullName || certificate.student?.username}</td>
                <td>{certificate.profile?.rollNumber || "—"}</td><td>{certificate.profile?.department || "—"}</td>
                <td>{certificate.type}</td><td>{certificate.organization}</td>
                <td>{certificate.date ? new Date(certificate.date).toLocaleDateString() : "—"}</td>
                <td>{certificate.createdAt ? new Date(certificate.createdAt).toLocaleDateString() : "—"}</td>
                <td><span className={`status-badge ${certificate.verificationStatus || "pending"}`}>{certificate.verificationStatus || "pending"}</span></td>
                <td className="admin-table-actions"><Link to={`/faculty/students/${certificate.student?._id}`}>Student</Link><Link to={`/faculty/student-certificates/${certificate._id}`}>View</Link></td>
              </tr>
            ))}</tbody>
          </table></div>
          <Pager page={page} pagination={pagination} setPage={setPage} />
        </>
      )}
    </section>
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
  if (loading) return <div className="empty"><h3>Loading certificate...</h3></div>;
  if (error) return <p className="message error-message">{error}</p>;
  if (!certificate) return <div className="empty"><h3>Certificate not found.</h3></div>;
  const studentId = certificate.user?._id || certificate.user;
  return (
    <section className="admin-users-panel">
      <div className="admin-section-heading">
        <div><h2>{certificate.title}</h2><p>{certificate.profile?.fullName || certificate.user?.fullName || certificate.user?.username} · {certificate.profile?.rollNumber || "Roll number unavailable"}</p></div>
        <Link className="text-action" to={`/faculty/students/${studentId}/certificates`}>← Student certificates</Link>
      </div>
      <DetailGroup title="Certificate details" items={[
        ["Category", certificate.type], ["Organization", certificate.organization],
        ["Achievement date", certificate.date ? new Date(certificate.date).toLocaleDateString() : null],
        ["Submitted", certificate.createdAt ? new Date(certificate.createdAt).toLocaleDateString() : null],
        ["Status", certificate.verificationStatus], ["Department", certificate.profile?.department]
      ]} />
      {certificate.certificateUrl ? (
        <div className="certificate-preview">
          <a href={certificate.certificateUrl} target="_blank" rel="noreferrer">Open certificate</a>
          {certificate.certificateUrl.split("?")[0].toLowerCase().endsWith(".pdf")
            ? <iframe src={certificate.certificateUrl} title={`${certificate.title} certificate`} />
            : <img src={certificate.certificateUrl} alt={`${certificate.title} certificate`} />}
        </div>
      ) : <p className="message">Certificate file is unavailable.</p>}
    </section>
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
  useEffect(() => { loadCertificates(); }, []);

  const updateField = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
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
          setError("Choose a certificate file to upload.");
          return;
        }
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => formData.append(key, value));
        formData.append("certificate", file);
        data = await requestJson(`${FACULTY_API}/my-certificates`, { method: "POST", body: formData });
      }
      setMessage(data.message || "Certificate saved.");
      resetForm();
      await loadCertificates();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const editCertificate = (certificate) => {
    setEditingId(certificate._id);
    setFile(null);
    setForm({
      title: certificate.title || "",
      type: certificate.type || "Certification",
      organization: certificate.organization || "",
      date: certificate.date ? new Date(certificate.date).toISOString().slice(0, 10) : "",
      expiresAt: certificate.expiresAt ? new Date(certificate.expiresAt).toISOString().slice(0, 10) : "",
      description: certificate.description || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="admin-detail-page">
      <form className="admin-form faculty-certificate-form" onSubmit={submit}>
        <h2>{editingId ? "Edit Certificate Details" : "Upload Professional Certificate"}</h2>
        <p>These files belong to your faculty account. Newly uploaded certificates are not marked verified.</p>
        <div className="admin-filters">
          <FieldInput id="faculty-cert-title" name="title" label="Certificate title" value={form.title} onChange={updateField} required />
          <div className="field"><label htmlFor="faculty-cert-type">Category</label><select id="faculty-cert-type" name="type" value={form.type} onChange={updateField}>{CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></div>
          <FieldInput id="faculty-cert-org" name="organization" label="Issuing organization" value={form.organization} onChange={updateField} required />
          <FieldInput id="faculty-cert-date" name="date" label="Issue date" type="date" value={form.date} onChange={updateField} required />
          <FieldInput id="faculty-cert-expiry" name="expiresAt" label="Expiry date (optional)" type="date" value={form.expiresAt} onChange={updateField} />
          {!editingId && <div className="field"><label htmlFor="faculty-cert-file">Certificate file (PDF or image, max 10 MB)</label><input id="faculty-cert-file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} required /></div>}
          <div className="field field-wide"><label htmlFor="faculty-cert-description">Description (optional)</label><textarea id="faculty-cert-description" name="description" value={form.description} onChange={updateField} rows="3" /></div>
        </div>
        {error && <p className="message error-message">{error}</p>}
        {message && <p className="message">{message}</p>}
        <div className="faculty-action-buttons">
          <button className="verify-button" type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Save Changes" : "Upload Certificate"}</button>
          {editingId && <button className="reject-button" type="button" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <section className="admin-users-panel">
        <div className="admin-section-heading"><div><h2>My Certificates</h2><p>Your professional achievements and credentials.</p></div></div>
        {loading ? <div className="empty"><h3>Loading your certificates...</h3></div> : certificates.length === 0 ? (
          <div className="empty"><h3>You have not uploaded professional certificates yet.</h3></div>
        ) : (
          <div className="faculty-list">
            {certificates.map((certificate) => (
              <article className="faculty-card" key={certificate._id}>
                <div className="faculty-card-header">
                  <div><p className="eyebrow small">My professional achievement</p><h2>{certificate.title}</h2></div>
                  <span className={`status-badge ${certificate.verificationStatus || "pending"}`}>{certificate.verificationStatus || "pending"}</span>
                </div>
                <div className="faculty-meta"><p><strong>Category:</strong> {certificate.type}</p><p><strong>Organization:</strong> {certificate.organization}</p><p><strong>Issue date:</strong> {certificate.date ? new Date(certificate.date).toLocaleDateString() : "—"}</p><p><strong>Expiry:</strong> {certificate.expiresAt ? new Date(certificate.expiresAt).toLocaleDateString() : "—"}</p></div>
                {certificate.description && <p>{certificate.description}</p>}
                {certificate.certificateUrl ? <a href={certificate.certificateUrl} target="_blank" rel="noreferrer">Open certificate file</a> : <p className="message">Certificate file is unavailable.</p>}
                <div className="faculty-action-buttons"><button className="verify-button" type="button" onClick={() => editCertificate(certificate)}>Edit metadata</button></div>
                {certificate.verificationStatus === "pending" && <p className="message">This certificate is not verified; no faculty-certificate review workflow is currently enabled.</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FieldInput({ id, name, label, value, onChange, type = "text", required = false }) {
  return <div className="field"><label htmlFor={id}>{label}</label><input id={id} name={name} type={type} value={value} onChange={onChange} required={required} /></div>;
}

function CertificateReviews() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [remarks, setRemarks] = useState({});
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
  useEffect(() => { load(); }, []);

  const decide = async (achievement, decision) => {
    const remark = (remarks[achievement._id] || "").trim();
    if (decision === "reject" && !remark) {
      setError("Enter a reason before rejecting a certificate.");
      return;
    }
    if (!window.confirm(`Are you sure you want to ${decision} "${achievement.title}"?`)) return;
    setProcessingId(achievement._id);
    setError("");
    setMessage("");
    try {
      const options = { method: "PATCH" };
      if (decision === "reject") {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify({ rejectionRemark: remark });
      }
      const data = await requestJson(`${REVIEW_API}/${achievement._id}/${decision}`, options);
      setMessage(data.message || `Certificate ${decision}d.`);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="admin-users-panel">
      <div className="admin-section-heading"><div><h2>Certificate Reviews</h2><p>Review student-submitted certificates. Faculty-owned certificates are not included.</p></div></div>
      {message && <p className="message">{message}</p>}
      {error && <p className="message error-message">{error}</p>}
      {loading ? <div className="empty"><h3>Loading pending reviews...</h3></div> : achievements.length === 0 ? (
        <div className="empty"><h3>No student certificates are waiting for review.</h3></div>
      ) : (
        <div className="faculty-list">
          {achievements.map((achievement) => (
            <article className="faculty-card" key={achievement._id}>
              <div className="faculty-card-header">
                <div><p className="eyebrow small">Student submission</p><h2>{achievement.title}</h2><p>{achievement.user?.fullName || achievement.user?.username} · {achievement.user?.email}</p></div>
                <span className="status-badge pending">Pending</span>
              </div>
              <div className="faculty-meta"><p><strong>Category:</strong> {achievement.type}</p><p><strong>Organization:</strong> {achievement.organization}</p><p><strong>Achievement date:</strong> {achievement.date ? new Date(achievement.date).toLocaleDateString() : "—"}</p></div>
              {achievement.description && <p>{achievement.description}</p>}
              {achievement.certificateUrl ? <a href={achievement.certificateUrl} target="_blank" rel="noreferrer">Open certificate file</a> : <p className="message">Certificate file is unavailable.</p>}
              <div className="field rejection-remark-field"><label htmlFor={`faculty-reason-${achievement._id}`}>Rejection reason (required to reject)</label><textarea id={`faculty-reason-${achievement._id}`} value={remarks[achievement._id] || ""} onChange={(event) => setRemarks((previous) => ({ ...previous, [achievement._id]: event.target.value }))} rows="2" /></div>
              <div className="faculty-action-buttons">
                <button className="verify-button" type="button" disabled={processingId === achievement._id} onClick={() => decide(achievement, "verify")}>{processingId === achievement._id ? "Processing..." : "Approve certificate"}</button>
                <button className="reject-button" type="button" disabled={processingId === achievement._id} onClick={() => decide(achievement, "reject")}>{processingId === achievement._id ? "Processing..." : "Reject certificate"}</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function FacultyProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    requestJson(`${FACULTY_API}/profile`)
      .then((data) => { setUser(data.user); setProfile(data.profile); })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="empty"><h3>Loading faculty profile...</h3></div>;
  if (error) return <p className="message error-message">{error}</p>;
  return (
    <section className="admin-users-panel">
      <div className="admin-section-heading"><div><h2>My Profile</h2><p>Professional profile information.</p></div><span className="status-badge verified">{user?.status || "approved"}</span></div>
      <div className="admin-detail-grid">
        <DetailGroup title="Personal Information" items={[["Full name", profile?.fullName || user?.fullName], ["Username", user?.username], ["Official email", user?.email], ["Phone", profile?.phone || user?.phone]]} />
        <DetailGroup title="Professional Information" items={[["Institution", profile?.institution], ["Employee ID", profile?.employeeId], ["Department", profile?.department], ["Designation", profile?.designation], ["Specialization", profile?.specialization], ["Years of experience", profile?.experienceYears]]} />
      </div>
    </section>
  );
}

export default FacultyDashboard;
