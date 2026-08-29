import { useState, useEffect } from "react";

function Dashboard() {
  const [achievements, setAchievements] = useState([]);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);

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

      console.log("Backend response:", data);

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

  // Delete achievement
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
        // Remove the deleted achievement from the screen
        setAchievements((prevAchievements) =>
          prevAchievements.filter(
            (achievement) => achievement._id !== id
          )
        );

        setMessage(
          data.message || "Achievement deleted successfully!"
        );
      } else {
        setMessage(
          data.message || "Failed to delete achievement"
        );
      }
    } catch (error) {
      console.error("DELETE ACHIEVEMENT ERROR:", error);
      setMessage("Server error while deleting achievement");
    } finally {
      setDeletingId(null);
    }
  };

  // Automatically load achievements when Dashboard opens
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

      {message && (
        <p className="message">
          {message}
        </p>
      )}

      <div className="achievement-grid">

        {achievements.length === 0 ? (

          <div className="empty">
            <h3>No achievements yet.</h3>
            <p>
              Add your first achievement to see it here.
            </p>
          </div>

        ) : (

          achievements.map((achievement) => (

            <div
              className="achievement-card"
              key={achievement._id}
            >

              {/* Certificate */}
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

              {/* Achievement Details */}
              <div className="achievement-content">

                <div className="achievement-title-row">

                  <h2>
                    {achievement.title}
                  </h2>

                  <button
                    className="delete-button"
                    onClick={() =>
                      deleteAchievement(achievement._id)
                    }
                    disabled={deletingId === achievement._id}
                    title="Delete achievement"
                  >
                    {deletingId === achievement._id ? "..." : "🗑️"}
                  </button>

                </div>

                <p>
                  {achievement.description}
                </p>

                <div className="achievement-info">
                  <span>{achievement.type}</span>
                  <span>{achievement.organization}</span>
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