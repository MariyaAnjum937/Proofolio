
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

        <input
          type="text"
          placeholder="Achievement title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Type */}

        <select
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

        {/* Organization */}

        <input
          type="text"
          placeholder="Organization"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
        />

        {/* Date */}

        <label>
          Achievement Date
        </label>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {/* Description */}

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="5"
        />

        {/* Certificate */}

        <input
          type="file"
          onChange={(e) =>
            setCertificate(e.target.files[0])
          }
        />

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

