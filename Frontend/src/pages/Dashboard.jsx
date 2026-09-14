import { useState, useEffect } from "react";

function Dashboard() {
  const [achievements, setAchievements] = useState([]);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const getVerificationLabel = (status) => {
    switch (status) {
      case "pending":
        return "⏳ Verification Pending";
      case "verified":
        return "✅ Verified";
      case "rejected":
        return "❌ Rejected";
      default:
        return "⏳ Verification Pending";
    }
  };

  const getStatusClassName = (status) => {
    switch (status) {
      case "pending":
        return "pending";
      case "verified":
        return "verified";
      case "rejected":
        return "rejected";
      default:
        return "pending";
    }
  };

  const totalCount = achievements.length;
  const pendingCount = achievements.filter((achievement) => (achievement.verificationStatus || "pending") === "pending").length;
  const verifiedCount = achievements.filter((achievement) => achievement.verificationStatus === "verified").length;

  const getAchievements = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/achievements/get",
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAchievements(data.achievements || data);
        setMessage("");
      } else {
        setMessage(data.message || "Failed to load achievements");
      }
    } catch (error) {
      console.error(error);
      setMessage("Server error");
    }
  };

  const deleteAchievement = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this achievement?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(id);

      const response = await fetch(
        `http://localhost:3000/api/delete/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAchievements((prevAchievements) =>
          prevAchievements.filter((achievement) => achievement._id !== id)
        );

        setMessage(data.message || "Achievement deleted successfully!");
      } else {
        setMessage(data.message || "Failed to delete achievement");
      }
    } catch (error) {
      console.error("DELETE ACHIEVEMENT ERROR:", error);
      setMessage("Server error while deleting achievement");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    getAchievements();
  }, []);

  return (
    <div className="page dashboard">
      <div className="dashboard-header">
        <div>
          <h1>My Achievements 🏆</h1>
          <p>Your achievements and certificates.</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span>Total</span>
          <strong>{totalCount}</strong>
        </div>
        <div className="stat-card pending-stat">
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </div>
        <div className="stat-card verified-stat">
          <span>Verified</span>
          <strong>{verifiedCount}</strong>
        </div>
      </div>

      {message && <p className="message">{message}</p>}

      <div className="achievement-grid">
        {achievements.length === 0 ? (
          <div className="empty">
            <h3>No achievements yet.</h3>
            <p>Add your first achievement to see it here.</p>
          </div>
        ) : (
          achievements.map((achievement) => (
            <div className="achievement-card" key={achievement._id}>
              {achievement.certificateUrl && (
                <div className="certificate-container">
                  <img
                    src={achievement.certificateUrl}
                    alt={`${achievement.title} certificate`}
                    className="certificate-image"
                  />

                  <a
                    href={achievement.certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="view-certificate"
                  >
                    View Certificate ↗
                  </a>
                </div>
              )}

              <div className="achievement-content">
                <div className="achievement-title-row">
                  <h2>{achievement.title}</h2>

                  <button
                    className="delete-button"
                    onClick={() => deleteAchievement(achievement._id)}
                    disabled={deletingId === achievement._id}
                    title="Delete achievement"
                  >
                    {deletingId === achievement._id ? "..." : "🗑️"}
                  </button>
                </div>

                <p>{achievement.description}</p>

                <div className="achievement-info">
                  <span>{achievement.type}</span>
                  <span>{achievement.organization}</span>
                </div>

                <div className={`status-badge ${getStatusClassName(achievement.verificationStatus)}`}>
                  {getVerificationLabel(achievement.verificationStatus)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;