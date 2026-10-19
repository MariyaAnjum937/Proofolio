import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import Icon from "../components/Icons";
import { EmptyState, LoadingSkeleton } from "../components/EmptyState";

function StudentProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/student/profile`, {
        method: "GET",
        credentials: "include"
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user || null);
        setProfile(data.profile || null);
        setError("");
      } else {
        setError(data.message || "Failed to load your profile.");
      }
    } catch (err) {
      console.error("FETCH STUDENT PROFILE ERROR:", err);
      setError("Server error while loading your profile.");
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
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/student/profile`, {
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
        setError(data.message || "Unable to update profile.");
      }
    } catch (err) {
      console.error("UPDATE STUDENT PROFILE ERROR:", err);
      setError("Server error while saving your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (!profile && !user) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <EmptyState
          icon="user"
          title="Student Profile Not Found"
          description="Complete your student registration or sign in again to access your profile."
          actionLabel="Go to Dashboard"
          actionTo="/dashboard"
        />
      </div>
    );
  }

  const fullName = profile?.fullName || user?.fullName || user?.username || "Student";
  const rollNumber = profile?.rollNumber || "Roll number not set";
  const branch = profile?.branch || profile?.department || "Unassigned branch";

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-2xl flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {fullName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                Student
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {rollNumber} · {branch} · {profile?.institution || "Institution not set"}
            </p>
          </div>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={openEditor}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <Icon name="edit" className="w-4 h-4 text-slate-500" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div className="p-4 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="check-circle" className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage("")} className="text-emerald-600 hover:text-emerald-800">
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl text-sm font-medium bg-rose-50 text-rose-800 border border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="alert-triangle" className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-rose-600 hover:text-rose-800">
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>
      )}

      {!editing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Icon name="user" className="w-4 h-4 text-indigo-600" />
              Personal Information
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <dt className="text-slate-500 font-medium">Full Name</dt>
                <dd className="font-semibold text-slate-800">{profile?.fullName || user?.fullName || "—"}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <dt className="text-slate-500 font-medium">Username</dt>
                <dd className="font-semibold text-slate-800">{user?.username || "—"}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <dt className="text-slate-500 font-medium">Email Address</dt>
                <dd className="font-semibold text-slate-800">{user?.email || "—"}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <dt className="text-slate-500 font-medium">Phone</dt>
                <dd className="font-semibold text-slate-800">{profile?.phone || "—"}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-slate-500 font-medium">Institution</dt>
                <dd className="font-semibold text-slate-800">{profile?.institution || "—"}</dd>
              </div>
            </dl>
          </div>

          {/* Academic Profile */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Icon name="graduation-cap" className="w-4 h-4 text-indigo-600" />
              Academic Information
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <dt className="text-slate-500 font-medium">Degree Program</dt>
                <dd className="font-semibold text-slate-800">{profile?.degree || "—"}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <dt className="text-slate-500 font-medium">Department</dt>
                <dd className="font-semibold text-slate-800">{profile?.department || "—"}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <dt className="text-slate-500 font-medium">Branch</dt>
                <dd className="font-semibold text-slate-800">{profile?.branch || "—"}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <dt className="text-slate-500 font-medium">Roll Number</dt>
                <dd className="font-semibold text-slate-800">{profile?.rollNumber || "—"}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <dt className="text-slate-500 font-medium">Academic Year</dt>
                <dd className="font-semibold text-slate-800">{profile?.currentAcademicYear || "—"}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <dt className="text-slate-500 font-medium">Current Semester</dt>
                <dd className="font-semibold text-slate-800">{profile?.currentSemester ?? "—"}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <dt className="text-slate-500 font-medium">Section</dt>
                <dd className="font-semibold text-slate-800">{profile?.section || "—"}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <dt className="text-slate-500 font-medium">CGPA</dt>
                <dd className="font-semibold text-indigo-600">
                  {profile?.cgpa !== null && profile?.cgpa !== undefined ? `${profile.cgpa} / 10.0` : "—"}
                </dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <dt className="text-slate-500 font-medium">Admission Year</dt>
                <dd className="font-semibold text-slate-800">{profile?.admissionYear || "—"}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-slate-500 font-medium">Graduation Year</dt>
                <dd className="font-semibold text-slate-800">{profile?.graduationYear || "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Edit Profile Details</h2>
            <span className="text-xs text-slate-400">Update your academic records</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="edit-fullName">Full Name</label>
              <input id="edit-fullName" name="fullName" value={form.fullName || ""} onChange={handleChange} />
            </div>

            <div className="field">
              <label htmlFor="edit-phone">Phone Number</label>
              <input id="edit-phone" name="phone" value={form.phone || ""} onChange={handleChange} />
            </div>

            <div className="field sm:col-span-2">
              <label htmlFor="edit-institution">Institution</label>
              <input id="edit-institution" name="institution" value={form.institution || ""} onChange={handleChange} />
            </div>

            <div className="field">
              <label htmlFor="edit-degree">Degree / Program</label>
              <input id="edit-degree" name="degree" value={form.degree || ""} onChange={handleChange} />
            </div>

            <div className="field">
              <label htmlFor="edit-department">Department</label>
              <input id="edit-department" name="department" value={form.department || ""} onChange={handleChange} />
            </div>

            <div className="field">
              <label htmlFor="edit-branch">Branch / Specialization</label>
              <input id="edit-branch" name="branch" value={form.branch || ""} onChange={handleChange} />
            </div>

            <div className="field">
              <label htmlFor="edit-rollNumber">Roll Number</label>
              <input id="edit-rollNumber" name="rollNumber" value={form.rollNumber || ""} onChange={handleChange} />
            </div>

            <div className="field">
              <label htmlFor="edit-currentAcademicYear">Current Academic Year</label>
              <input id="edit-currentAcademicYear" name="currentAcademicYear" value={form.currentAcademicYear || ""} onChange={handleChange} placeholder="e.g. 3rd Year" />
            </div>

            <div className="field">
              <label htmlFor="edit-currentSemester">Current Semester</label>
              <input id="edit-currentSemester" name="currentSemester" type="number" min="1" max="12" value={form.currentSemester || ""} onChange={handleChange} />
            </div>

            <div className="field">
              <label htmlFor="edit-section">Section</label>
              <input id="edit-section" name="section" value={form.section || ""} onChange={handleChange} />
            </div>

            <div className="field">
              <label htmlFor="edit-cgpa">CGPA</label>
              <input id="edit-cgpa" name="cgpa" type="number" step="0.01" min="0" max="10" value={form.cgpa ?? ""} onChange={handleChange} />
            </div>

            <div className="field">
              <label htmlFor="edit-admissionYear">Admission Year</label>
              <input id="edit-admissionYear" name="admissionYear" type="number" value={form.admissionYear || ""} onChange={handleChange} />
            </div>

            <div className="field">
              <label htmlFor="edit-graduationYear">Graduation Year</label>
              <input id="edit-graduationYear" name="graduationYear" type="number" value={form.graduationYear || ""} onChange={handleChange} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              {saving && <Icon name="clock" className="w-4 h-4 animate-spin" />}
              <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default StudentProfile;
