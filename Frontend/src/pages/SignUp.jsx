import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import Icon from "../components/Icons";

const initialStudentForm = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  institution: "",
  degree: "",
  department: "",
  branch: "",
  rollNumber: "",
  admissionYear: "",
  graduationYear: "",
  currentAcademicYear: "",
  currentSemester: "",
  section: "",
  cgpa: ""
};

const initialFacultyForm = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  institution: "",
  employeeId: "",
  department: "",
  designation: "",
  specialization: "",
  experienceYears: ""
};

function SignUp() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState("student");
  const [studentForm, setStudentForm] = useState(initialStudentForm);
  const [facultyForm, setFacultyForm] = useState(initialFacultyForm);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleStudentChange = (event) => {
    const { name, value } = event.target;
    setStudentForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleFacultyChange = (event) => {
    const { name, value } = event.target;
    setFacultyForm((previous) => ({ ...previous, [name]: value }));
  };

  const signUp = async (e) => {
    if (e) e.preventDefault();
    const currentForm = accountType === "student" ? studentForm : facultyForm;

    if (currentForm.password !== currentForm.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (!currentForm.username || !currentForm.email || !currentForm.password) {
      setMessage("Please provide all required account credentials (Username, Email, and Password).");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const endpoint = accountType === "student" ? "/api/auth/register/student" : "/api/auth/register/faculty";
      const payload = accountType === "student" ? studentForm : facultyForm;

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem("isLoggedIn");
        const successMessage = accountType === "student"
          ? "Student account created successfully! Please sign in."
          : "Faculty registration submitted successfully! Please wait for administrator approval.";

        navigate("/signin", {
          state: {
            message: successMessage
          }
        });
      } else {
        setMessage(data.message || "Registration failed. Please check your information.");
      }
    } catch (error) {
      console.error("SIGN UP ERROR:", error);
      setMessage("Server connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-8 sm:py-12 max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl p-6 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4">
            <Icon name="award" className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Create your Proofolio account</h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Join the verified achievement network for students and academic faculty.
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl mb-8">
          <button
            type="button"
            onClick={() => setAccountType("student")}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              accountType === "student"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Icon name="graduation-cap" className="w-4 h-4" />
            <span>Student Account</span>
          </button>
          <button
            type="button"
            onClick={() => setAccountType("faculty")}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              accountType === "faculty"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Icon name="user" className="w-4 h-4" />
            <span>Faculty Account</span>
          </button>
        </div>

        {message && (
          <div className="p-3.5 rounded-xl text-xs font-medium mb-6 bg-rose-50 text-rose-800 border border-rose-200 flex items-start gap-2.5">
            <Icon name="alert-triangle" className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={signUp} className="space-y-8">
          {/* Section 1: Credentials */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Icon name="shield" className="w-4 h-4 text-indigo-600" />
              1. Account Credentials
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="field">
                <label htmlFor="reg-username">Username <span className="text-rose-500">*</span></label>
                <input
                  id="reg-username"
                  name="username"
                  required
                  value={accountType === "student" ? studentForm.username : facultyForm.username}
                  onChange={accountType === "student" ? handleStudentChange : handleFacultyChange}
                  placeholder="e.g. jdoe24"
                />
              </div>

              <div className="field">
                <label htmlFor="reg-email">Official Email <span className="text-rose-500">*</span></label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  required
                  value={accountType === "student" ? studentForm.email : facultyForm.email}
                  onChange={accountType === "student" ? handleStudentChange : handleFacultyChange}
                  placeholder={accountType === "student" ? "you@college.edu" : "faculty@college.edu"}
                />
              </div>

              <div className="field">
                <label htmlFor="reg-password">Password <span className="text-rose-500">*</span></label>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  required
                  value={accountType === "student" ? studentForm.password : facultyForm.password}
                  onChange={accountType === "student" ? handleStudentChange : handleFacultyChange}
                  placeholder="Create a strong password"
                />
              </div>

              <div className="field">
                <label htmlFor="reg-confirmPassword">Confirm Password <span className="text-rose-500">*</span></label>
                <input
                  id="reg-confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={accountType === "student" ? studentForm.confirmPassword : facultyForm.confirmPassword}
                  onChange={accountType === "student" ? handleStudentChange : handleFacultyChange}
                  placeholder="Repeat your password"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Personal Profile */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Icon name="user" className="w-4 h-4 text-indigo-600" />
              2. Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="field">
                <label htmlFor="reg-fullName">Full Name</label>
                <input
                  id="reg-fullName"
                  name="fullName"
                  value={accountType === "student" ? studentForm.fullName : facultyForm.fullName}
                  onChange={accountType === "student" ? handleStudentChange : handleFacultyChange}
                  placeholder="First and last name"
                />
              </div>

              <div className="field">
                <label htmlFor="reg-phone">Phone Number (Optional)</label>
                <input
                  id="reg-phone"
                  name="phone"
                  value={accountType === "student" ? studentForm.phone : facultyForm.phone}
                  onChange={accountType === "student" ? handleStudentChange : handleFacultyChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="field sm:col-span-2">
                <label htmlFor="reg-institution">Institution / University</label>
                <input
                  id="reg-institution"
                  name="institution"
                  value={accountType === "student" ? studentForm.institution : facultyForm.institution}
                  onChange={accountType === "student" ? handleStudentChange : handleFacultyChange}
                  placeholder="e.g. National Institute of Technology"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Academic or Faculty Details */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Icon name={accountType === "student" ? "graduation-cap" : "building"} className="w-4 h-4 text-indigo-600" />
              {accountType === "student" ? "3. Academic Profile" : "3. Professional Details"}
            </h3>

            {accountType === "student" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="field">
                  <label htmlFor="student-rollNumber">Roll / Reg Number</label>
                  <input
                    id="student-rollNumber"
                    name="rollNumber"
                    value={studentForm.rollNumber}
                    onChange={handleStudentChange}
                    placeholder="e.g. 21CS042"
                  />
                </div>

                <div className="field">
                  <label htmlFor="student-department">Department</label>
                  <input
                    id="student-department"
                    name="department"
                    value={studentForm.department}
                    onChange={handleStudentChange}
                    placeholder="e.g. Engineering"
                  />
                </div>

                <div className="field">
                  <label htmlFor="student-branch">Branch / Specialization</label>
                  <input
                    id="student-branch"
                    name="branch"
                    value={studentForm.branch}
                    onChange={handleStudentChange}
                    placeholder="e.g. CSE, ECE, Mechanical"
                  />
                </div>

                <div className="field">
                  <label htmlFor="student-degree">Degree / Program</label>
                  <input
                    id="student-degree"
                    name="degree"
                    value={studentForm.degree}
                    onChange={handleStudentChange}
                    placeholder="e.g. B.Tech"
                  />
                </div>

                <div className="field">
                  <label htmlFor="student-currentAcademicYear">Current Academic Year</label>
                  <input
                    id="student-currentAcademicYear"
                    name="currentAcademicYear"
                    value={studentForm.currentAcademicYear}
                    onChange={handleStudentChange}
                    placeholder="e.g. 3rd Year"
                  />
                </div>

                <div className="field">
                  <label htmlFor="student-currentSemester">Current Semester</label>
                  <input
                    id="student-currentSemester"
                    name="currentSemester"
                    type="number"
                    min="1"
                    max="12"
                    value={studentForm.currentSemester}
                    onChange={handleStudentChange}
                    placeholder="e.g. 5"
                  />
                </div>

                <div className="field">
                  <label htmlFor="student-section">Section</label>
                  <input
                    id="student-section"
                    name="section"
                    value={studentForm.section}
                    onChange={handleStudentChange}
                    placeholder="e.g. A"
                  />
                </div>

                <div className="field">
                  <label htmlFor="student-cgpa">Current CGPA</label>
                  <input
                    id="student-cgpa"
                    name="cgpa"
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    value={studentForm.cgpa}
                    onChange={handleStudentChange}
                    placeholder="e.g. 8.75"
                  />
                </div>

                <div className="field">
                  <label htmlFor="student-admissionYear">Admission Year</label>
                  <input
                    id="student-admissionYear"
                    name="admissionYear"
                    type="number"
                    value={studentForm.admissionYear}
                    onChange={handleStudentChange}
                    placeholder="2023"
                  />
                </div>

                <div className="field">
                  <label htmlFor="student-graduationYear">Graduation Year</label>
                  <input
                    id="student-graduationYear"
                    name="graduationYear"
                    type="number"
                    value={studentForm.graduationYear}
                    onChange={handleStudentChange}
                    placeholder="2027"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="field">
                  <label htmlFor="faculty-employeeId">Employee ID</label>
                  <input
                    id="faculty-employeeId"
                    name="employeeId"
                    value={facultyForm.employeeId}
                    onChange={handleFacultyChange}
                    placeholder="e.g. EMP-1042"
                  />
                </div>

                <div className="field">
                  <label htmlFor="faculty-department">Department</label>
                  <input
                    id="faculty-department"
                    name="department"
                    value={facultyForm.department}
                    onChange={handleFacultyChange}
                    placeholder="e.g. Computer Science"
                  />
                </div>

                <div className="field">
                  <label htmlFor="faculty-designation">Designation</label>
                  <input
                    id="faculty-designation"
                    name="designation"
                    value={facultyForm.designation}
                    onChange={handleFacultyChange}
                    placeholder="e.g. Associate Professor"
                  />
                </div>

                <div className="field">
                  <label htmlFor="faculty-specialization">Specialization</label>
                  <input
                    id="faculty-specialization"
                    name="specialization"
                    value={facultyForm.specialization}
                    onChange={handleFacultyChange}
                    placeholder="e.g. Artificial Intelligence"
                  />
                </div>

                <div className="field">
                  <label htmlFor="faculty-experienceYears">Years of Experience</label>
                  <input
                    id="faculty-experienceYears"
                    name="experienceYears"
                    type="number"
                    min="0"
                    value={facultyForm.experienceYears}
                    onChange={handleFacultyChange}
                    placeholder="e.g. 8"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-6 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {submitting && <Icon name="clock" className="w-4 h-4 animate-spin" />}
              <span>{submitting ? "Creating your account..." : "Complete Registration"}</span>
            </button>

            <p className="text-center text-xs text-slate-500">
              Already have an account?{" "}
              <Link to="/signin" className="font-semibold text-indigo-600 hover:text-indigo-800">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignUp;