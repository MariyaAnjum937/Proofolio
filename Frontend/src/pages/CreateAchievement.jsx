import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import Icon from "../components/Icons";

const ACHIEVEMENT_TYPES = [
  "Hackathon",
  "Internship",
  "Certification",
  "Workshop",
  "Competition",
  "Extracurricular",
  "Project",
  "Other"
];

function CreateAchievement() {
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [organization, setOrganization] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [certificate, setCertificate] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10 MB limit.");
      return;
    }
    setCertificate(file);
    setError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const createAchievement = async (e) => {
    if (e) e.preventDefault();

    if (!title.trim()) {
      setError("Please provide an achievement title.");
      return;
    }

    if (!type) {
      setError("Please select the achievement category.");
      return;
    }

    if (!certificate) {
      setError("Please attach your certificate proof (PDF or image).");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("type", type);
      formData.append("organization", organization.trim());
      formData.append("date", date);
      formData.append("description", description.trim());
      formData.append("certificate", certificate);

      const response = await fetch(
        `${API_BASE_URL}/api/achievements/create`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Achievement record uploaded successfully!");
        // Clear form
        setTitle("");
        setType("");
        setOrganization("");
        setDate("");
        setDescription("");
        setCertificate(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setError(data.message || "Failed to create achievement record.");
      }
    } catch (err) {
      console.error("CREATE ACHIEVEMENT ERROR:", err);
      setError("Server error while uploading achievement. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Back Link & Header */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-3 transition-colors"
        >
          <Icon name="arrow-left" className="w-4 h-4" />
          <span>Back to Achievements</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Add New Achievement
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload your certificate and achievement details for departmental faculty verification.
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div className="p-4 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="check-circle" className="w-5 h-5 text-emerald-600" />
            <span>{message}</span>
          </div>
          <Link
            to="/dashboard"
            className="text-xs font-semibold text-emerald-700 underline hover:text-emerald-900"
          >
            View in Dashboard →
          </Link>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl text-sm font-medium bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
          <Icon name="alert-triangle" className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={createAchievement} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Title */}
        <div className="field">
          <label htmlFor="title">
            Achievement Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            placeholder="e.g. 1st Prize — Smart India Hackathon"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Category & Organization in 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="field">
            <label htmlFor="type">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              id="type"
              required
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Select achievement type</option>
              {ACHIEVEMENT_TYPES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="organization">
              Issuing Organization / Host
            </label>
            <input
              id="organization"
              type="text"
              placeholder="e.g. Google Cloud, MIT, AICTE"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          </div>
        </div>

        {/* Date */}
        <div className="field">
          <label htmlFor="date">Achievement Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="field">
          <label htmlFor="description">Description & Key Learnings</label>
          <textarea
            id="description"
            placeholder="Summarize your role, project scope, technologies used, or learning milestones..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        {/* File Upload Drag-and-Drop Area */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 block">
            Certificate Proof (PDF or Image) <span className="text-rose-500">*</span>
          </label>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              dragOver
                ? "border-indigo-500 bg-indigo-50/50"
                : certificate
                  ? "border-emerald-300 bg-emerald-50/30"
                  : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
            }`}
          >
            <input
              type="file"
              id="certificate"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => handleFile(e.target.files[0])}
              className="hidden"
            />

            {certificate ? (
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-200 max-w-md mx-auto">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Icon name={certificate.name.endsWith(".pdf") ? "file-text" : "award"} className="w-5 h-5" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{certificate.name}</p>
                    <p className="text-[11px] text-slate-400">{(certificate.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCertificate(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  title="Remove file"
                >
                  <Icon name="x" className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Icon name="upload" className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Click to browse or drag and drop certificate file
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Supports PDF, PNG, JPG, or WEBP (Max 10 MB)
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg"
                >
                  <Icon name="paperclip" className="w-3.5 h-3.5" />
                  Select File
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Verification Notice */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
          <Icon name="shield" className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <span>
            Once submitted, your achievement will appear as <strong>Pending Review</strong> until a departmental faculty member verifies the authenticity of your certificate.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            to="/dashboard"
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            {submitting && <Icon name="clock" className="w-4 h-4 animate-spin" />}
            <span>{submitting ? "Uploading Achievement..." : "Submit for Verification"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateAchievement;