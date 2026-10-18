import { useEffect, useState } from "react";

function StudentProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/api/student/profile", {
        method: "GET",
        credentials: "include"
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user || null);
        setProfile(data.profile || null);
        setMessage("");
      } else {
        setMessage(data.message || "Failed to load your profile.");
      }
    } catch (error) {
      console.error("FETCH STUDENT PROFILE ERROR:", error);
      setMessage("Server error while loading your profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const openEditor = () => {
    if (!profile) return;
    setForm({
      fullName: profile.fullName || user?.fullName || "",
      phone: profile.phone || "",
      institution: profile.institution || "",
      degree: profile.degree || "",
      department: profile.department || "",
      branch: profile.branch || "",
      rollNumber: profile.rollNumber || "",
      admissionYear: profile.admissionYear || "",
      graduationYear: profile.graduationYear || "",
      currentAcademicYear: profile.currentAcademicYear || "",
      currentSemester: profile.currentSemester || "",
      section: profile.section || "",
      cgpa: profile.cgpa ?? ""
    });
    setEditing(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:3000/api/student/profile", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user || user);
        setProfile(data.profile || profile);
        setEditing(false);
        setMessage(data.message || "Profile updated successfully.");
        await fetchProfile();
      } else {
        setMessage(data.message || "Unable to update profile.");
      }
    } catch (error) {
      console.error("UPDATE STUDENT PROFILE ERROR:", error);
      setMessage("Server error while saving your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="empty">
          <h3>Loading profile...</h3>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page">
        <div className="empty">
          <h3>No student profile found.</h3>
          <p>Complete your registration details to see them here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <h1>My Profile</h1>
          <p>View and update your academic profile.</p>
        </div>
      </div>

      {message && <p className="message">{message}</p>}

      {!editing ? (
        <>
          <div className="achievement-card">
            <div className="achievement-content">
              <div className="achievement-title-row">
                <h2>Personal Information</h2>
                <button className="verify-button" onClick={openEditor}>
                  Edit Profile
                </button>
              </div>

              <div className="achievement-info">
                <span>Full name: {profile.fullName || user?.fullName || "Not provided"}</span>
                <span>Username: {user?.username || "Not provided"}</span>
                <span>Email: {user?.email || "Not provided"}</span>
                <span>Phone: {profile.phone || "Not provided"}</span>
              </div>
            </div>
          </div>

          <div className="achievement-card">
            <div className="achievement-content">
              <h2>Academic Information</h2>
              <div className="achievement-info">
                <span>Institution: {profile.institution || "Not provided"}</span>
                <span>Degree: {profile.degree || "Not provided"}</span>
                <span>Department: {profile.department || "Not provided"}</span>
                <span>Branch: {profile.branch || "Not provided"}</span>
                <span>Roll Number: {profile.rollNumber || "Not provided"}</span>
                <span>Admission Year: {profile.admissionYear || "Not provided"}</span>
                <span>Graduation Year: {profile.graduationYear || "Not provided"}</span>
                <span>Academic Year: {profile.currentAcademicYear || "Not provided"}</span>
                <span>Semester: {profile.currentSemester || "Not provided"}</span>
                <span>Section: {profile.section || "Not provided"}</span>
                <span>CGPA: {profile.cgpa ?? "Not provided"}</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>Edit Profile</h2>

          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" name="fullName" value={form.fullName || ""} onChange={handleChange} />
          </div>

          <div className="field">
            <label htmlFor="phone">Phone number</label>
            <input id="phone" name="phone" value={form.phone || ""} onChange={handleChange} />
          </div>

          <div className="field">
            <label htmlFor="institution">Institution</label>
            <input id="institution" name="institution" value={form.institution || ""} onChange={handleChange} />
          </div>

          <div className="field">
            <label htmlFor="degree">Degree</label>
            <input id="degree" name="degree" value={form.degree || ""} onChange={handleChange} />
          </div>

          <div className="field">
            <label htmlFor="department">Department</label>
            <input id="department" name="department" value={form.department || ""} onChange={handleChange} />
          </div>

          <div className="field">
            <label htmlFor="branch">Branch / Specialization</label>
            <input id="branch" name="branch" value={form.branch || ""} onChange={handleChange} />
          </div>

          <div className="field">
            <label htmlFor="rollNumber">Roll Number</label>
            <input id="rollNumber" name="rollNumber" value={form.rollNumber || ""} onChange={handleChange} />
          </div>

          <div className="field">
            <label htmlFor="admissionYear">Admission Year</label>
            <input id="admissionYear" name="admissionYear" type="number" value={form.admissionYear || ""} onChange={handleChange} />
          </div>

          <div className="field">
            <label htmlFor="graduationYear">Expected Graduation Year</label>
            <input id="graduationYear" name="graduationYear" type="number" value={form.graduationYear || ""} onChange={handleChange} />
          </div>

          <div className="field">
            <label htmlFor="currentAcademicYear">Current Academic Year</label>
            <input id="currentAcademicYear" name="currentAcademicYear" value={form.currentAcademicYear || ""} onChange={handleChange} />
          </div>

          <div className="field">
            <label htmlFor="currentSemester">Current Semester</label>
            <input id="currentSemester" name="currentSemester" type="number" value={form.currentSemester || ""} onChange={handleChange} />
          </div>

          <div className="field">
            <label htmlFor="section">Section</label>
            <input id="section" name="section" value={form.section || ""} onChange={handleChange} />
          </div>

          <div className="field">
            <label htmlFor="cgpa">CGPA</label>
            <input id="cgpa" name="cgpa" type="number" step="0.01" value={form.cgpa ?? ""} onChange={handleChange} />
          </div>

          <div className="faculty-action-buttons">
            <button type="submit" className="verify-button" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" className="reject-button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default StudentProfile;
