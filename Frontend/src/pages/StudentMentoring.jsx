import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

const API_ROOT = `${API_BASE_URL}/api/student/mentoring`;

async function requestJson(url, options = {}) {
  const response = await fetch(url, { credentials: "include", ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "The request failed.");
  return data;
}

function StudentMentoring() {
  const [mentors, setMentors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const [mentorData, sessionData] = await Promise.all([
      requestJson(`${API_ROOT}/mentors`),
      requestJson(`${API_ROOT}/sessions`)
    ]);
    setMentors(mentorData.mentors || []);
    setSessions(sessionData.sessions || []);
  }, []);

  useEffect(() => {
    load()
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [load]);

  const updateActionItem = async (sessionId, actionItemId, status) => {
    const key = `${sessionId}-${actionItemId}`;
    setProcessing(key);
    setError("");
    setMessage("");
    try {
      await requestJson(`${API_ROOT}/sessions/${sessionId}/action-items/${actionItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      await load();
      setMessage("Action item updated.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setProcessing("");
    }
  };

  const now = Date.now();
  const upcoming = sessions.filter((session) => (
    ["scheduled", "rescheduled"].includes(session.status) && new Date(session.scheduledAt).getTime() >= now
  ));
  const history = sessions.filter((session) => !upcoming.includes(session));

  if (loading) return <main className="page"><div className="empty"><h2>Loading mentoring information...</h2></div></main>;

  return (
    <main className="page">
      <div className="dashboard-header">
        <div><h1>My Mentoring</h1><p>Your mentors, upcoming sessions, shared goals, and follow-up actions.</p></div>
      </div>
      {error && <p className="message error-message">{error}</p>}
      {message && <p className="message">{message}</p>}

      <section className="faculty-card">
        <h2>My mentors</h2>
        {mentors.length === 0 ? <p>You do not have an active faculty mentor yet.</p> : (
          <div className="mentoring-mentor-grid">
            {mentors.map(({ _id, faculty, assignedAt }) => (
              <article className="admin-detail-group" key={_id}>
                <h3>{faculty?.profile?.fullName || faculty?.fullName || faculty?.username || "Faculty mentor"}</h3>
                <p>{faculty?.profile?.designation || "Faculty"}{faculty?.profile?.department ? ` · ${faculty.profile.department}` : ""}</p>
                <p>{faculty?.email || ""}</p>
                <p>Mentoring since {formatDate(assignedAt)}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="faculty-card">
        <h2>Upcoming sessions</h2>
        {upcoming.length === 0 ? <p>No upcoming mentoring sessions.</p> : upcoming.map((session) => (
          <SessionCard key={session._id} session={session} processing={processing} onUpdate={updateActionItem} />
        ))}
      </section>

      <section className="faculty-card">
        <h2>Goals and action items</h2>
        {!sessions.some((session) => session.goals.length || session.actionItems.length) ? <p>No shared goals or action items yet.</p> : sessions.map((session) => (
          (session.goals.length > 0 || session.actionItems.length > 0) && (
            <div key={`shared-${session._id}`} className="mentoring-session-info">
              <h3>{session.title}</h3>
              {session.goals.map((goal) => (
                <div key={goal._id} className="student-goal">
                  <strong>{goal.title}</strong> · {label(goal.timeframe)} · {label(goal.status)}
                  {goal.description && <p>{goal.description}</p>}
                  {goal.targetDate && <p>Target date: {formatDate(goal.targetDate)}</p>}
                  {goal.progressNotes && <p>Progress: {goal.progressNotes}</p>}
                  {goal.completedAt && <p>Completed: {formatDate(goal.completedAt)}</p>}
                </div>
              ))}
              {session.actionItems.map((item) => (
                <ActionItem
                  key={item._id}
                  item={item}
                  session={session}
                  processing={processing}
                  onUpdate={updateActionItem}
                />
              ))}
            </div>
          )
        ))}
      </section>

      <section className="faculty-card">
        <h2>Session history</h2>
        {history.length === 0 ? <p>No previous mentoring sessions.</p> : history.map((session) => (
          <SessionCard key={session._id} session={session} processing={processing} onUpdate={updateActionItem} />
        ))}
      </section>
    </main>
  );
}

function SessionCard({ session, processing, onUpdate }) {
  return (
    <article className="mentoring-session-card">
      <div className="faculty-card-header">
        <div><h3>{session.title}</h3><p>{session.faculty?.fullName || session.faculty?.username || "Faculty mentor"} · {formatDate(session.scheduledAt, true)}{session.endsAt ? ` – ${formatDate(session.endsAt, true)}` : ""}</p></div>
        <span className={`status-badge ${session.status}`}>{label(session.status)}</span>
      </div>
      <p>Session type: {label(session.type)}</p>
      {session.type === "online" && session.meetingUrl && <p><a href={session.meetingUrl} target="_blank" rel="noreferrer">Join online session</a></p>}
      {session.type === "in_person" && session.location && <p>Location: {session.location}</p>}
      {session.type === "other" && session.location && <p>Joining instructions: {session.location}</p>}
      {session.agenda && <p><strong>Agenda:</strong> {session.agenda}</p>}
      {session.sharedSummary && <p><strong>Shared summary:</strong> {session.sharedSummary}</p>}
      {session.followUpAt && <p><strong>Follow-up:</strong> {formatDate(session.followUpAt, true)}</p>}
      {session.goals?.map((goal) => (
        <p key={goal._id}><strong>Goal: {goal.title}</strong> · {label(goal.status)}{goal.targetDate ? ` · due ${formatDate(goal.targetDate)}` : ""}</p>
      ))}
      {session.actionItems?.map((item) => (
        <ActionItem
          key={item._id}
          item={item}
          session={session}
          processing={processing}
          onUpdate={onUpdate}
        />
      ))}
    </article>
  );
}

function ActionItem({ item, session, processing, onUpdate }) {
  const canUpdate = item.responsible === "student" && item.status !== "completed";
  return (
    <div className="student-action-item">
      <span><strong>Action:</strong> {item.description} · {label(item.status)}{item.dueAt ? ` · due ${formatDate(item.dueAt)}` : ""}{item.completedAt ? ` · completed ${formatDate(item.completedAt)}` : ""}</span>
      {canUpdate && (
        <div className="faculty-action-buttons">
          {item.status === "pending" && <button type="button" className="secondary-button" disabled={Boolean(processing)} onClick={() => onUpdate(session._id, item._id, "in_progress")}>Mark in progress</button>}
          <button type="button" className="verify-button" disabled={Boolean(processing)} onClick={() => onUpdate(session._id, item._id, "completed")}>Mark completed</button>
        </div>
      )}
    </div>
  );
}

function formatDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString(undefined, withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}

function label(value) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()) : "—";
}

export default StudentMentoring;
