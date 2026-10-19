import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import Icon from "../components/Icons";
import { StatusBadge, CategoryBadge } from "../components/Badge";
import { StatCard } from "../components/StatCard";
import { ConfirmModal } from "../components/Modal";
import { EmptyState, LoadingSkeleton } from "../components/EmptyState";

const CATEGORIES = ["All", "Hackathon", "Internship", "Certification", "Workshop", "Competition", "Extracurricular", "Project", "Other"];
const STATUSES = [
  { label: "All Statuses", value: "all" },
  { label: "Verified", value: "verified" },
  { label: "Pending Review", value: "pending" },
  { label: "Rejected", value: "rejected" }
];

function Dashboard() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [selectedAchievementToDelete, setSelectedAchievementToDelete] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const getAchievements = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/achievements/get`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAchievements(data.achievements || data || []);
        setError("");
      } else {
        setError(data.message || "Failed to load achievements");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAchievements();
  }, []);

  const totalCount = achievements.length;
  const pendingCount = achievements.filter((a) => (a.verificationStatus || "pending").toLowerCase() === "pending").length;
  const verifiedCount = achievements.filter((a) => (a.verificationStatus || "").toLowerCase() === "verified").length;
  const rejectedCount = achievements.filter((a) => (a.verificationStatus || "").toLowerCase() === "rejected").length;

  const filteredAchievements = useMemo(() => {
    return achievements.filter((item) => {
      const titleMatch = (item.title || "").toLowerCase().includes(searchQuery.toLowerCase());
      const orgMatch = (item.organization || "").toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = (item.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = !searchQuery.trim() || titleMatch || orgMatch || descMatch;

      const matchesCategory = selectedCategory === "All" || (item.type || "").toLowerCase() === selectedCategory.toLowerCase();

      const itemStatus = (item.verificationStatus || "pending").toLowerCase();
      const matchesStatus = selectedStatus === "all" || itemStatus === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [achievements, searchQuery, selectedCategory, selectedStatus]);

  const initiateDelete = (achievement) => {
    setSelectedAchievementToDelete(achievement);
    setConfirmDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAchievementToDelete) return;
    const id = selectedAchievementToDelete._id;

    try {
      setDeletingId(id);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/api/delete/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAchievements((prev) => prev.filter((item) => item._id !== id));
        setMessage(data.message || "Achievement record deleted successfully.");
        setConfirmDeleteModalOpen(false);
        setSelectedAchievementToDelete(null);
      } else {
        setError(data.message || "Failed to delete achievement.");
      }
    } catch (err) {
      console.error("DELETE ERROR:", err);
      setError("Server error while deleting achievement.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Achievements
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your verified certificates, achievements, and credentials.
          </p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Icon name="plus" className="w-4 h-4" />
          <span>Add Achievement</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Records"
          value={totalCount}
          icon="award"
          variant="default"
        />
        <StatCard
          label="Verified"
          value={verifiedCount}
          icon="check-circle"
          variant="verified"
        />
        <StatCard
          label="Pending Review"
          value={pendingCount}
          icon="clock"
          variant="pending"
        />
        <StatCard
          label="Rejected"
          value={rejectedCount}
          icon="x-circle"
          variant="rejected"
        />
      </div>

      {/* Alerts */}
      {message && (
        <div className="p-4 rounded-xl text-xs sm:text-sm font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between">
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
        <div className="p-4 rounded-xl text-xs sm:text-sm font-medium bg-rose-50 text-rose-800 border border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="alert-triangle" className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-rose-600 hover:text-rose-800">
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <Icon name="search" className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, organization, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="w-40">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs"
              aria-label="Filter by category"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
              ))}
            </select>
          </div>

          <div className="w-40">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs"
              aria-label="Filter by status"
            >
              {STATUSES.map((st) => (
                <option key={st.value} value={st.value}>{st.label}</option>
              ))}
            </select>
          </div>

          {(searchQuery || selectedCategory !== "All" || selectedStatus !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setSelectedStatus("all");
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 whitespace-nowrap px-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Achievement List / Grid */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : filteredAchievements.length === 0 ? (
        <EmptyState
          icon="award"
          title={achievements.length === 0 ? "No achievements recorded yet" : "No matching achievements"}
          description={
            achievements.length === 0
              ? "Start building your verified portfolio by uploading your first achievement certificate."
              : "Try adjusting your search query or filter options to find what you are looking for."
          }
          actionLabel={achievements.length === 0 ? "Add Your First Achievement" : undefined}
          actionTo={achievements.length === 0 ? "/create" : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((item) => {
            const isPdf = item.certificateUrl && item.certificateUrl.split("?")[0].toLowerCase().endsWith(".pdf");

            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Certificate Preview Header */}
                  {item.certificateUrl ? (
                    <div className="relative h-44 bg-slate-100 overflow-hidden border-b border-slate-100 flex items-center justify-center">
                      {isPdf ? (
                        <div className="text-center p-6 flex flex-col items-center justify-center">
                          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-2 shadow-xs">
                            <Icon name="file-text" className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">PDF Document</span>
                          <span className="text-[11px] text-slate-400">Click to preview</span>
                        </div>
                      ) : (
                        <img
                          src={item.certificateUrl}
                          alt={`${item.title} certificate`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <a
                        href={item.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-xs"
                      >
                        <Icon name="external-link" className="w-4 h-4" />
                        <span>View Full Certificate</span>
                      </a>
                    </div>
                  ) : (
                    <div className="h-24 bg-gradient-to-r from-slate-100 to-indigo-50/50 flex items-center justify-center border-b border-slate-100">
                      <Icon name="award" className="w-8 h-8 text-indigo-300" />
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <CategoryBadge category={item.type || "Achievement"} />
                      <StatusBadge status={item.verificationStatus} />
                    </div>

                    <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h3>

                    {item.organization && (
                      <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                        <Icon name="building" className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.organization}</span>
                      </p>
                    )}

                    {item.description && (
                      <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {item.date && (
                      <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
                        <Icon name="calendar" className="w-3 h-3" />
                        <span>Date: {new Date(item.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                      </p>
                    )}

                    {/* Rejection Remarks */}
                    {item.verificationStatus === "rejected" && item.rejectionRemark && (
                      <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                        <p className="font-semibold text-rose-800 flex items-center gap-1 mb-0.5">
                          <Icon name="alert-triangle" className="w-3.5 h-3.5 text-rose-600" />
                          Faculty Feedback:
                        </p>
                        <p className="text-rose-700 leading-normal">{item.rejectionRemark}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  {item.certificateUrl ? (
                    <a
                      href={item.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>Certificate</span>
                      <Icon name="external-link" className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">No file</span>
                  )}

                  <button
                    type="button"
                    onClick={() => initiateDelete(item)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete record"
                    aria-label={`Delete ${item.title}`}
                  >
                    <Icon name="trash" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDeleteModalOpen}
        onClose={() => {
          setConfirmDeleteModalOpen(false);
          setSelectedAchievementToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Achievement"
        message={`Are you sure you want to delete "${selectedAchievementToDelete?.title}"? This action will permanently remove the achievement and its verification records.`}
        confirmText="Delete Record"
        isDestructive={true}
        isLoading={deletingId !== null}
      />
    </div>
  );
}

export default Dashboard;