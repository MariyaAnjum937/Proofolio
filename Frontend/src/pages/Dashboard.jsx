
import { useState, useEffect } from "react";

function Dashboard() {
  const [achievements, setAchievements] = useState([]);
  const [message, setMessage] = useState("");

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

                <h2>
                  {achievement.title}
                </h2>

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
