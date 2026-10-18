import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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

  const signUp = async () => {
    const currentForm = accountType === "student" ? studentForm : facultyForm;

    if (currentForm.password !== currentForm.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (!currentForm.username || !currentForm.email || !currentForm.password) {
      setMessage("Please provide all required account details.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const endpoint = accountType === "student" ? "/api/auth/register/student" : "/api/auth/register/faculty";
      const payload = accountType === "student" ? studentForm : facultyForm;

      const response = await fetch(`http://localhost:3000${endpoint}`, {
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
          ? "Student account created successfully. Please sign in."
          : "Faculty registration submitted successfully. Please wait for admin approval.";

        navigate("/signin", {
          state: {
            message: successMessage
          }
        });
      } else {
        setMessage(data.message || "Registration failed.");
      }
    } catch (error) {
      console.error("SIGN UP ERROR:", error);
      setMessage("Server error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="form-card">
        <h1>Create Account</h1>
        <p>Start building your achievement portfolio.</p>

        <div className="field">
          <label htmlFor="accountType">Register as</label>
          <select id="accountType" value={accountType} onChange={(event) => setAccountType(event.target.value)}>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
          </select>
        </div>

        {accountType === "student" ? (
          <>
            <div className="field">
              <label htmlFor="student-fullName">Full name</label>
              <input id="student-fullName" name="fullName" value={studentForm.fullName} onChange={handleStudentChange} placeholder="Enter full name" />
            </div>

            <div className="field">
              <label htmlFor="student-username">Username</label>
              <input id="student-username" name="username" value={studentForm.username} onChange={handleStudentChange} placeholder="Choose a username" />
            </div>

            <div className="field">
              <label htmlFor="student-email">Email</label>
              <input id="student-email" name="email" type="email" value={studentForm.email} onChange={handleStudentChange} placeholder="you@example.com" />
            </div>

            <div className="field">
              <label htmlFor="student-phone">Phone number</label>
              <input id="student-phone" name="phone" value={studentForm.phone} onChange={handleStudentChange} placeholder="Optional phone number" />
            </div>

            <div className="field">
              <label htmlFor="student-password">Password</label>
              <input id="student-password" name="password" type="password" value={studentForm.password} onChange={handleStudentChange} placeholder="Create a password" />
            </div>

            <div className="field">
              <label htmlFor="student-confirmPassword">Confirm password</label>
              <input id="student-confirmPassword" name="confirmPassword" type="password" value={studentForm.confirmPassword} onChange={handleStudentChange} placeholder="Repeat password" />
            </div>

            <div className="field">
              <label htmlFor="student-institution">Institution</label>
              <input id="student-institution" name="institution" value={studentForm.institution} onChange={handleStudentChange} placeholder="College or university" />
            </div>

            <div className="field">
              <label htmlFor="student-degree">Degree / Program</label>
              <input id="student-degree" name="degree" value={studentForm.degree} onChange={handleStudentChange} placeholder="B.Tech / B.Sc" />
            </div>

            <div className="field">
              <label htmlFor="student-department">Department</label>
              <input id="student-department" name="department" value={studentForm.department} onChange={handleStudentChange} placeholder="Department" />
            </div>

            <div className="field">
              <label htmlFor="student-branch">Branch / Specialization</label>
              <input id="student-branch" name="branch" value={studentForm.branch} onChange={handleStudentChange} placeholder="Computer Science, ECE, etc." />
            </div>

            <div className="field">
              <label htmlFor="student-rollNumber">Roll number</label>
              <input id="student-rollNumber" name="rollNumber" value={studentForm.rollNumber} onChange={handleStudentChange} placeholder="University registration number" />
            </div>

            <div className="field">
              <label htmlFor="student-admissionYear">Admission year</label>
              <input id="student-admissionYear" name="admissionYear" type="number" value={studentForm.admissionYear} onChange={handleStudentChange} placeholder="2024" />
            </div>

            <div className="field">
              <label htmlFor="student-graduationYear">Expected graduation year</label>
              <input id="student-graduationYear" name="graduationYear" type="number" value={studentForm.graduationYear} onChange={handleStudentChange} placeholder="2028" />
            </div>

            <div className="field">
              <label htmlFor="student-currentAcademicYear">Current academic year</label>
              <input id="student-currentAcademicYear" name="currentAcademicYear" value={studentForm.currentAcademicYear} onChange={handleStudentChange} placeholder="2nd Year" />
            </div>

            <div className="field">
              <label htmlFor="student-currentSemester">Current semester</label>
              <input id="student-currentSemester" name="currentSemester" type="number" min="1" max="12" value={studentForm.currentSemester} onChange={handleStudentChange} placeholder="4" />
            </div>

            <div className="field">
              <label htmlFor="student-section">Section</label>
              <input id="student-section" name="section" value={studentForm.section} onChange={handleStudentChange} placeholder="Optional" />
            </div>

            <div className="field">
              <label htmlFor="student-cgpa">CGPA</label>
              <input id="student-cgpa" name="cgpa" type="number" min="0" max="10" step="0.01" value={studentForm.cgpa} onChange={handleStudentChange} placeholder="Optional" />
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <label htmlFor="faculty-fullName">Full name</label>
              <input id="faculty-fullName" name="fullName" value={facultyForm.fullName} onChange={handleFacultyChange} placeholder="Enter full name" />
            </div>

            <div className="field">
              <label htmlFor="faculty-username">Username</label>
              <input id="faculty-username" name="username" value={facultyForm.username} onChange={handleFacultyChange} placeholder="Choose a username" />
            </div>

            <div className="field">
              <label htmlFor="faculty-email">Official email</label>
              <input id="faculty-email" name="email" type="email" value={facultyForm.email} onChange={handleFacultyChange} placeholder="you@college.edu" />
            </div>

            <div className="field">
              <label htmlFor="faculty-phone">Phone number</label>
              <input id="faculty-phone" name="phone" value={facultyForm.phone} onChange={handleFacultyChange} placeholder="Optional phone number" />
            </div>

            <div className="field">
              <label htmlFor="faculty-password">Password</label>
              <input id="faculty-password" name="password" type="password" value={facultyForm.password} onChange={handleFacultyChange} placeholder="Create a password" />
            </div>

            <div className="field">
              <label htmlFor="faculty-confirmPassword">Confirm password</label>
              <input id="faculty-confirmPassword" name="confirmPassword" type="password" value={facultyForm.confirmPassword} onChange={handleFacultyChange} placeholder="Repeat password" />
            </div>

            <div className="field">
              <label htmlFor="faculty-institution">Institution</label>
              <input id="faculty-institution" name="institution" value={facultyForm.institution} onChange={handleFacultyChange} placeholder="College or university" />
            </div>

            <div className="field">
              <label htmlFor="faculty-employeeId">Employee ID</label>
              <input id="faculty-employeeId" name="employeeId" value={facultyForm.employeeId} onChange={handleFacultyChange} placeholder="Employee ID" />
            </div>

            <div className="field">
              <label htmlFor="faculty-department">Department</label>
              <input id="faculty-department" name="department" value={facultyForm.department} onChange={handleFacultyChange} placeholder="Department" />
            </div>

            <div className="field">
              <label htmlFor="faculty-designation">Designation</label>
              <input id="faculty-designation" name="designation" value={facultyForm.designation} onChange={handleFacultyChange} placeholder="Assistant Professor" />
            </div>

            <div className="field">
              <label htmlFor="faculty-specialization">Specialization</label>
              <input id="faculty-specialization" name="specialization" value={facultyForm.specialization} onChange={handleFacultyChange} placeholder="Optional specialization" />
            </div>

            <div className="field">
              <label htmlFor="faculty-experienceYears">Years of experience</label>
              <input id="faculty-experienceYears" name="experienceYears" type="number" min="0" value={facultyForm.experienceYears} onChange={handleFacultyChange} placeholder="Optional" />
            </div>
          </>
        )}

        <button onClick={signUp} disabled={submitting}>
          {submitting ? "Creating account..." : "Create Account"}
        </button>

        {message && <p className="message">{message}</p>}

        <p className="form-footer">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;