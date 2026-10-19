import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import Icon from "../components/Icons";
import { StatusBadge } from "../components/Badge";
import { EmptyState, LoadingSkeleton } from "../components/EmptyState";

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
      setMessage("Action item updated successfully.");
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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 py-6">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Mentoring & Guidance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Collaborate with your faculty mentors, track scheduled sessions, and complete action items.
          </p>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="p-4 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="check-circle" className="w-5 h-5 text-emerald-600" />
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
            <Icon name="alert-triangle" className="w-5 h-5 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-rose-600 hover:text-rose-800">
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Mentors Section */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Icon name="users" className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Assigned Faculty Mentors</h2>
        </div>

        {mentors.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p>You do not have an active faculty mentor assigned yet.</p>
            <p className="text-xs text-slate-400 mt-1">Mentors are assigned by departmental faculty members.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mentors.map(({ _id, faculty, assignedAt }) => {
              const name = faculty?.profile?.fullName || faculty?.fullName || faculty?.username || "Faculty Mentor";
              const designation = faculty?.profile?.designation || "Faculty";
              const dept = faculty?.profile?.department;

              return (
                <div key={_id} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-base flex items-center justify-center shrink-0">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{name}</h3>
                    <p className="text-slate-600 font-medium">{designation}{dept ? ` · ${dept}` : ""}</p>
                    <p className="text-slate-500 mt-1 flex items-center gap-1">
                      <Icon name="mail" className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{faculty?.email || "—"}</span>
                    </p>
                    <p className="text-slate-400 text-[11px] mt-1.5 flex items-center gap-1">
                      <Icon name="calendar" className="w-3 h-3" />
                      <span>Mentoring since {formatDate(assignedAt)}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Upcoming Sessions */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Icon name="calendar" className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Upcoming Mentoring Sessions</h2>
        </div>

        {upcoming.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No upcoming mentoring sessions scheduled.
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((session) => (
              <SessionCard
                key={session._id}
                session={session}
                processing={processing}
                onUpdate={updateActionItem}
                isUpcoming={true}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. Goals and Action Items */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Icon name="award" className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Shared Goals & Action Items</h2>
        </div>

        {!sessions.some((s) => (s.goals && s.goals.length > 0) || (s.actionItems && s.actionItems.length > 0)) ? (
          <div className="py-6 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No shared goals or action items assigned yet.
          </div>
        ) : (
          <div className="space-y-6">
            {sessions.map((session) => (
              ((session.goals && session.goals.length > 0) || (session.actionItems && session.actionItems.length > 0)) && (
                <div key={`shared-${session._id}`} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Icon name="book-open" className="w-4 h-4 text-indigo-600" />
                      Session: {session.title}
                    </h3>
                    <span className="text-xs text-slate-500">{formatDate(session.scheduledAt)}</span>
                  </div>

                  {/* Goals */}
                  {session.goals && session.goals.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Goals</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {session.goals.map((goal) => (
                          <div key={goal._id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <strong className="text-slate-900 font-semibold">{goal.title}</strong>
                              <StatusBadge status={goal.status} />
                            </div>
                            {goal.description && <p className="text-slate-600">{goal.description}</p>}
                            <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-2">
                              <span>Timeframe: {label(goal.timeframe)}</span>
                              {goal.targetDate && <span>· Due: {formatDate(goal.targetDate)}</span>}
                            </div>
                            {goal.progressNotes && (
                              <p className="text-indigo-600 bg-indigo-50/50 p-1.5 rounded mt-1">
                                Progress: {goal.progressNotes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Items */}
                  {session.actionItems && session.actionItems.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Follow-up Action Items</p>
                      <div className="space-y-2">
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
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        )}
      </section>

      {/* 4. Session History */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Icon name="clock" className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Session History</h2>
        </div>

        {history.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No previous mentoring session records.
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((session) => (
              <SessionCard
                key={session._id}
                session={session}
                processing={processing}
                onUpdate={updateActionItem}
                isUpcoming={false}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SessionCard({ session, processing, onUpdate, isUpcoming }) {
  const isOnline = session.type === "online";
  const facultyName = session.faculty?.fullName || session.faculty?.username || "Faculty Mentor";

  return (
    <div className={`p-5 rounded-xl border transition-all ${
      isUpcoming ? "bg-indigo-50/20 border-indigo-200/80 shadow-xs" : "bg-white border-slate-200"
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">{session.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mentor: <strong className="text-slate-700">{facultyName}</strong> · {formatDate(session.scheduledAt, true)}
            {session.endsAt ? ` – ${formatDate(session.endsAt, true)}` : ""}
          </p>
        </div>
        <StatusBadge status={session.status} />
      </div>

      <div className="py-3 space-y-2 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1 font-medium">
            <Icon name={isOnline ? "video" : "map-pin"} className="w-4 h-4 text-slate-400" />
            Mode: {label(session.type)}
          </span>

          {isOnline && session.meetingUrl && (
            <a
              href={session.meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              <Icon name="video" className="w-3.5 h-3.5" />
              <span>Join Online Meeting</span>
            </a>
          )}

          {!isOnline && session.location && (
            <span className="text-slate-700">Location: {session.location}</span>
          )}
        </div>

        {session.agenda && (
          <p className="mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
            <strong className="text-slate-800">Agenda:</strong> {session.agenda}
          </p>
        )}

        {session.sharedSummary && (
          <p className="mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
            <strong className="text-slate-800">Shared Summary:</strong> {session.sharedSummary}
          </p>
        )}

        {session.followUpAt && (
          <p className="text-slate-500 mt-1 flex items-center gap-1">
            <Icon name="calendar" className="w-3.5 h-3.5 text-slate-400" />
            <span>Follow-up Scheduled: {formatDate(session.followUpAt, true)}</span>
          </p>
        )}
      </div>

      {session.actionItems && session.actionItems.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          {session.actionItems.map((item) => (
            <ActionItem
              key={item._id}
              item={item}
              session={session}
              processing={processing}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ActionItem({ item, session, processing, onUpdate }) {
  const canUpdate = item.responsible === "student" && item.status !== "completed";
  const isBusy = processing === `${session._id}-${item._id}`;

  return (
    <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">{item.description}</span>
          <StatusBadge status={item.status} className="scale-90 origin-left" />
        </div>
        <p className="text-[11px] text-slate-400">
          Responsible: {label(item.responsible)}
          {item.dueAt ? ` · Due: ${formatDate(item.dueAt)}` : ""}
          {item.completedAt ? ` · Completed: ${formatDate(item.completedAt)}` : ""}
        </p>
      </div>

      {canUpdate && (
        <div className="flex items-center gap-2 shrink-0">
          {item.status === "pending" && (
            <button
              type="button"
              disabled={Boolean(processing)}
              onClick={() => onUpdate(session._id, item._id, "in_progress")}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Start Progress
            </button>
          )}
          <button
            type="button"
            disabled={Boolean(processing)}
            onClick={() => onUpdate(session._id, item._id, "completed")}
            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
          >
            {isBusy ? <Icon name="clock" className="w-3.5 h-3.5 animate-spin" /> : <Icon name="check" className="w-3.5 h-3.5" />}
            <span>Mark Complete</span>
          </button>
        </div>
      )}
    </div>
  );
}

function formatDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}

function label(value) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()) : "—";
}

export default StudentMentoring;
