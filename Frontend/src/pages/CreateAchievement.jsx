import { useState } from "react";

function CreateAchievement() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [organization, setOrganization] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [certificate, setCertificate] = useState(null);

  const [message, setMessage] = useState("");

  const createAchievement = async () => {
    try {
      if (!certificate) {
        setMessage("Please select a certificate.");
        return;
      }

      const formData = new FormData();

      formData.append("title", title);
      formData.append("type", type);
      formData.append("organization", organization);
      formData.append("date", date);
      formData.append("description", description);
      formData.append("certificate", certificate);

      const response = await fetch(
        "http://localhost:3000/api/achievements/create",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const data = await response.json();

      console.log("STATUS:", response.status);
      console.log("RESPONSE:", data);

      if (response.ok) {
        setMessage(
          data.message || "Achievement created successfully!"
        );

        // Clear form
        setTitle("");
        setType("");
        setOrganization("");
        setDate("");
        setDescription("");
        setCertificate(null);
      } else {
        setMessage(
          data.message || "Failed to create achievement"
        );
      }

    } catch (error) {
      console.error("CREATE ACHIEVEMENT ERROR:", error);
      setMessage(error.message);
    }
  };

  return (
    <div className="page">

      <div className="form-card">

        <h1>Add Achievement 📜</h1>

        <p>
          Upload and record your achievement.
        </p>

        {/* Title */}
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            placeholder="e.g. Winner - National Hackathon"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Type */}
        <div className="field">
          <label htmlFor="type">Type</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Select achievement type</option>
            <option value="Hackathon">Hackathon</option>
            <option value="Internship">Internship</option>
            <option value="Certification">Certification</option>
            <option value="Workshop">Workshop</option>
            <option value="Competition">Competition</option>
          </select>
        </div>

        {/* Organization */}
        <div className="field">
          <label htmlFor="organization">Organization</label>
          <input
            id="organization"
            type="text"
            placeholder="e.g. Google, MIT, Devfolio"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
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
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            placeholder="Briefly describe what you did and what you learned"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="5"
          />
        </div>

        {/* Certificate */}
        <div className="field">
          <label htmlFor="certificate">Certificate</label>

          <input
            id="certificate"
            className="file-input"
            type="file"
            onChange={(e) =>
              setCertificate(e.target.files[0])
            }
          />
          <label htmlFor="certificate" className="file-label">
            <span className="file-icon">📎</span>
            {certificate ? "Change file" : "Choose a file"}
          </label>

          {certificate && (
            <span className="file-name">{certificate.name}</span>
          )}
        </div>

        <button onClick={createAchievement}>
          Add Achievement
        </button>

        {message && (
          <p className="message">
            {message}
          </p>
        )}

      </div>

    </div>
  );
}

export default CreateAchievement;