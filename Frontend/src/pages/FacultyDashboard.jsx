import { useEffect, useState } from "react";

function FacultyDashboard() {
  const [pendingAchievements, setPendingAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState("");
  const [rejectionRemarks, setRejectionRemarks] = useState({});
  const [rejectionErrors, setRejectionErrors] = useState({});

  const pendingCount = pendingAchievements.length;

  const getPendingAchievements = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:3000/api/achievements/pending",
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPendingAchievements(data.achievements || []);
        setMessage("");
      } else {
        if (response.status === 401) {
          setMessage("Your session has expired. Please sign in again.");
        } else if (response.status === 403) {
          setMessage("You do not have access to verify achievements.");
        } else {
          setMessage(data.message || "Failed to load pending achievements.");
        }
      }
    } catch (error) {
      console.error("FETCH PENDING ERROR:", error);
      setMessage("Server error while loading pending achievements.");
    } finally {
      setLoading(false);
    }
  };

  const verifyAchievement = async (id) => {
    try {
      setProcessingId(id);
      setMessage("");

      const response = await fetch(
        `http://localhost:3000/api/achievements/${id}/verify`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPendingAchievements((previous) =>
          previous.filter((achievement) => achievement._id !== id)
        );
        setMessage(data.message || "Achievement verified successfully.");
      } else {
        if (response.status === 401) {
          setMessage("Your session has expired. Please sign in again.");
        } else if (response.status === 403) {
          setMessage("Access denied. Faculty permissions are required.");
        } else if (response.status === 404) {
          setMessage("Achievement not found.");
        } else if (response.status === 500) {
          setMessage("The server could not verify this achievement right now.");
        } else {
          setMessage(data.message || "Unable to verify achievement.");
        }
      }
    } catch (error) {
      console.error("VERIFY ACHIEVEMENT ERROR:", error);
      setMessage("Server error while verifying achievement.");
    } finally {
      setProcessingId(null);
    }
  };

  const rejectAchievement = async (id) => {
    const rejectionRemark = (rejectionRemarks[id] || "").trim();

    if (!rejectionRemark) {
      setRejectionErrors((previous) => ({
        ...previous,
        [id]: "Enter a reason before rejecting this certificate."
      }));
      setMessage("Please provide a remark before rejecting this achievement.");
      return;
    }

    try {
      setProcessingId(id);
      setMessage("");
      setRejectionErrors((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
      });

      const response = await fetch(
        `http://localhost:3000/api/achievements/${id}/reject`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ rejectionRemark })
        }
      );

      const data = await response.json();

      if (response.ok) {
        const rejectedTitle = pendingAchievements.find((achievement) => achievement._id === id)?.title || "Achievement";
        setPendingAchievements((previous) =>
          previous.filter((achievement) => achievement._id !== id)
        );
        setRejectionRemarks((previous) => {
          const next = { ...previous };
          delete next[id];
          return next;
        });
        setRejectionErrors((previous) => {
          const next = { ...previous };
          delete next[id];
          return next;
        });
        setMessage(`${rejectedTitle} was rejected successfully.`);
      } else {
        if (response.status === 401) {
          setMessage("Your session has expired. Please sign in again.");
        } else if (response.status === 403) {
          setMessage("Access denied. Faculty permissions are required.");
        } else if (response.status === 404) {
          setMessage("Achievement not found.");
        } else if (response.status === 500) {
          setMessage("The server could not reject this achievement right now.");
        } else {
          setMessage(data.message || "Unable to reject achievement.");
        }
      }
    } catch (error) {
      console.error("REJECT ACHIEVEMENT ERROR:", error);
      setMessage("Server error while rejecting achievement.");
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    getPendingAchievements();
  }, []);

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <h1>Faculty Verification 👩‍🏫</h1>
          <p>Review and verify pending student achievements.</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </div>
        <div className="stat-card verified-stat">
          <span>Ready to Review</span>
          <strong>{pendingCount > 0 ? "Yes" : "No"}</strong>
        </div>
      </div>

      {message && <p className="message">{message}</p>}

      {loading ? (
        <div className="empty">
          <h3>Loading pending achievements...</h3>
        </div>
      ) : pendingAchievements.length === 0 ? (
        <div className="empty">
          <h3>No achievements are waiting for verification.</h3>
          <p>New student submissions will appear here.</p>
        </div>
      ) : (
        <div className="faculty-list">
          {pendingAchievements.map((achievement) => (
            <div key={achievement._id} className="faculty-card">
              <div className="faculty-card-header">
                <div>
                  <p className="eyebrow small">Student Submission</p>
                  <h2>{achievement.title}</h2>
                </div>

                <div className="faculty-action-buttons">
                  <button
                    className="verify-button"
                    onClick={() => verifyAchievement(achievement._id)}
                    disabled={processingId === achievement._id}
                  >
                    {processingId === achievement._id
                      ? "Processing..."
                      : "Verify Achievement"}
                  </button>

                  <button
                    className="reject-button"
                    onClick={() => rejectAchievement(achievement._id)}
                    disabled={processingId === achievement._id}
                  >
                    {processingId === achievement._id
                      ? "Processing..."
                      : "Reject Achievement"}
                  </button>
                </div>
              </div>

              <div className="rejection-remark-field">
                <label htmlFor={`rejection-remark-${achievement._id}`}>
                  Rejection remark
                </label>
                <textarea
                  id={`rejection-remark-${achievement._id}`}
                  value={rejectionRemarks[achievement._id] || ""}
                  onChange={(event) =>
                    (() => {
                      setRejectionRemarks((previous) => ({
                        ...previous,
                        [achievement._id]: event.target.value
                      }));
                      setRejectionErrors((previous) => {
                        const next = { ...previous };
                        delete next[achievement._id];
                        return next;
                      });
                    })()
                  }
                  placeholder="Explain why this certificate was rejected"
                  rows="3"
                  required
                  disabled={processingId === achievement._id}
                />
                {rejectionErrors[achievement._id] && (
                  <p className="field-error">{rejectionErrors[achievement._id]}</p>
                )}
              </div>

              <div className="faculty-meta">
                <div>
                  <span className="meta-label">Student</span>
                  <strong>{achievement.user?.username || "Unknown"}</strong>
                </div>
                <div>
                  <span className="meta-label">Email</span>
                  <strong>{achievement.user?.email || "No email provided"}</strong>
                </div>
              </div>

              <div className="faculty-details-grid">
                <div>
                  <span className="meta-label">Type</span>
                  <p>{achievement.type || "Not specified"}</p>
                </div>
                <div>
                  <span className="meta-label">Organization</span>
                  <p>{achievement.organization || "Not specified"}</p>
                </div>
                <div>
                  <span className="meta-label">Date</span>
                  <p>{achievement.date || "Not specified"}</p>
                </div>
                <div>
                  <span className="meta-label">Position</span>
                  <p>{achievement.position || "Not provided"}</p>
                </div>
              </div>

              <div className="faculty-description">
                <span className="meta-label">Description</span>
                <p>{achievement.description || "No description provided."}</p>
              </div>

              {achievement.certificateUrl && (
                <div className="faculty-certificate">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FacultyDashboard;
