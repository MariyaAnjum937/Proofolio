import { useEffect, useState } from "react";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalAdmins: 0,
    totalAchievements: 0,
    pendingAchievements: 0,
    verifiedAchievements: 0,
    rejectedAchievements: 0
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "student"
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/api/admin/overview", {
        method: "GET",
        credentials: "include"
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
        setStats(data.stats || {
          totalStudents: 0,
          totalFaculty: 0,
          totalAdmins: 0,
          totalAchievements: 0,
          pendingAchievements: 0,
          verifiedAchievements: 0,
          rejectedAchievements: 0
        });
        setMessage("");
      } else {
        setMessage(data.message || "Failed to load users.");
      }
    } catch (error) {
      console.error("FETCH USERS ERROR:", error);
      setMessage("Server error while loading users.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id, nextRole) => {
    try {
      const response = await fetch(`http://localhost:3000/api/admin/users/${id}/role`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: nextRole })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "User role updated.");
        fetchUsers();
      } else {
        setMessage(data.message || "Failed to update role.");
      }
    } catch (error) {
      console.error("ROLE UPDATE ERROR:", error);
      setMessage("Server error while updating role.");
    }
  };

  const handleDeleteUser = async (id) => {
    const confirmed = window.confirm("Delete this user?");

    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:3000/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "User deleted successfully.");
        fetchUsers();
      } else {
        setMessage(data.message || "Failed to delete user.");
      }
    } catch (error) {
      console.error("DELETE USER ERROR:", error);
      setMessage("Server error while deleting user.");
    }
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/api/admin/users", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "User created successfully.");
        setForm({ username: "", email: "", password: "", role: "student" });
        fetchUsers();
      } else {
        setMessage(data.message || "Failed to create user.");
      }
    } catch (error) {
      console.error("CREATE USER ERROR:", error);
      setMessage("Server error while creating user.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const studentCount = stats.totalStudents || users.filter((user) => user.role === "student").length;
  const facultyCount = stats.totalFaculty || users.filter((user) => user.role === "faculty").length;
  const adminCount = stats.totalAdmins || users.filter((user) => user.role === "admin").length;
  const totalAchievements = stats.totalAchievements || 0;
  const pendingAchievements = stats.pendingAchievements || 0;
  const verifiedAchievements = stats.verifiedAchievements || 0;
  const rejectedAchievements = stats.rejectedAchievements || 0;

  const filteredUsers = users.filter((user) => {
    const searchable = `${user.username} ${user.email}`.toLowerCase();
    return searchable.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage all users, assign roles, and remove accounts when needed.</p>
        </div>
      </div>

      {message && <p className="message">{message}</p>}

      <div className="stats-row admin-stats-row">
        <div className="stat-card">
          <span>Students</span>
          <strong>{studentCount}</strong>
        </div>
        <div className="stat-card pending-stat">
          <span>Faculty</span>
          <strong>{facultyCount}</strong>
        </div>
        <div className="stat-card verified-stat">
          <span>Admins</span>
          <strong>{adminCount}</strong>
        </div>
        <div className="stat-card">
          <span>Total Achievements</span>
          <strong>{totalAchievements}</strong>
        </div>
        <div className="stat-card pending-stat">
          <span>Pending</span>
          <strong>{pendingAchievements}</strong>
        </div>
        <div className="stat-card verified-stat">
          <span>Verified</span>
          <strong>{verifiedAchievements}</strong>
        </div>
        <div className="stat-card rejected-stat">
          <span>Rejected</span>
          <strong>{rejectedAchievements}</strong>
        </div>
      </div>

      <div className="admin-panel">
        <form className="admin-form" onSubmit={handleCreateUser}>
          <h2>Add User</h2>

          <div className="field">
            <label htmlFor="admin-username">Username</label>
            <input
              id="admin-username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Username"
            />
          </div>

          <div className="field">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
            />
          </div>

          <div className="field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Password"
            />
          </div>

          <div className="field">
            <label htmlFor="admin-role">Role</label>
            <select
              id="admin-role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit">Create User</button>
        </form>

        <div className="admin-users-panel">
          <h2>All Users</h2>

          <div className="field search-field">
            <label htmlFor="admin-search">Search users</label>
            <input
              id="admin-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email"
            />
          </div>

          {loading ? (
            <div className="empty">
              <h3>Loading users...</h3>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty">
              <h3>No matching users found.</h3>
            </div>
          ) : (
            <div className="admin-users-list">
              {filteredUsers.map((user) => (
                <div key={user._id} className="admin-user-row">
                  <div className="admin-user-info">
                    <div className="admin-user-header">
                      <strong>{user.username}</strong>
                      <span className={`role-pill ${user.role}`}>{user.role}</span>
                    </div>
                    <span>{user.email}</span>
                  </div>

                  <div className="admin-user-actions">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="admin">Admin</option>
                    </select>

                    <button className="delete-button admin-delete" onClick={() => handleDeleteUser(user._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
