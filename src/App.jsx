import React from "react";
import "./App.css";

export default function App() {
  const [projectCount, setProjectCount] = React.useState(0);
  return (
    <div style={{ width: "100vw" }}>
      <Header />
      <div className="container">
        <Dashboard
          projectCount={projectCount}
          setProjectCount={setProjectCount}
        />
        <ProjectForm setProjectCount={setProjectCount} />
        <ProjectList setProjectCount={setProjectCount} />
      </div>
    </div>
  );
}

// Header Component
function Header() {
  return (
    <header className="header">
      <div className="container header-content">
        <div className="logo">
          <h1>IAD Assignment</h1>
        </div>
        <div>Task Management</div>
      </div>
    </header>
  );
}

// Dashboard Component
function Dashboard({ projectCount, setProjectCount }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    fetchProjectCount();
  }, []);

  const fetchProjectCount = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://railway-app-production-f84d.up.railway.app/api/projects/count"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch project count");
      }
      const data = await response.json();
      setProjectCount(data.count);
      setError(null);
    } catch (err) {
      setError("Error loading project count. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      {loading ? (
        <div className="loading">Loading stats...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="stats">
          <div className="stat-card">
            <h3>Total Projects</h3>
            <div className="count">{projectCount}</div>
          </div>
          <div className="stat-card">
            <h3>Active Projects</h3>
            <div className="count">{projectCount}</div>
          </div>
          <div className="stat-card">
            <h3>Completed Projects</h3>
            <div className="count">0</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Project Form Component
function ProjectForm({ setProjectCount }) {
  const [projectName, setProjectName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);
  const [editMode, setEditMode] = React.useState(false);
  const [editId, setEditId] = React.useState(null);

  // Listen for edit events from ProjectList
  React.useEffect(() => {
    const handleEdit = (event) => {
      if (event.detail) {
        const { id, name } = event.detail;
        setProjectName(name);
        setEditMode(true);
        setEditId(id);
      }
    };

    window.addEventListener("edit-project", handleEdit);
    return () => window.removeEventListener("edit-project", handleEdit);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!projectName.trim() || projectName.length < 3) {
      setError("Project name must be at least 3 characters");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let url =
        "https://railway-app-production-f84d.up.railway.app/api/projects";
      let method = "POST";

      if (editMode) {
        url = `${url}/${editId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: projectName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save project");
      }

      setSuccess(
        editMode
          ? "Project updated successfully!"
          : "Project added successfully!"
      );
      setProjectName("");
      if (!editMode) {
        setProjectCount((prevState) => prevState + 1);
      }
      setEditMode(false);
      setEditId(null);

      // Dispatch event to refresh project list
      window.dispatchEvent(new Event("refresh-projects"));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setProjectName("");
    setEditMode(false);
    setEditId(null);
    setError(null);
  };

  return (
    <div className="project-form">
      <h2>{editMode ? "Edit Project" : "Add New Project"}</h2>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="projectName">Project Name</label>
          <input
            type="text"
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter project name"
            disabled={loading}
          />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading
              ? "Saving..."
              : editMode
              ? "Update Project"
              : "Add Project"}
          </button>

          {editMode && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={cancelEdit}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// Project List Component
function ProjectList({ setProjectCount }) {
  const [projects, setProjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    fetchProjects();

    // Listen for refresh events from ProjectForm
    window.addEventListener("refresh-projects", fetchProjects);
    return () => window.removeEventListener("refresh-projects", fetchProjects);
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://railway-app-production-f84d.up.railway.app/api/projects"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();
      setProjects(data.projects);
      setProjectCount(data.projects.length);
      setError(null);
    } catch (err) {
      setError("Error loading projects. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project) => {
    // Dispatch custom event to notify ProjectForm
    const event = new CustomEvent("edit-project", {
      detail: { id: project.id, name: project.name },
    });
    window.dispatchEvent(event);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      const response = await fetch(
        `https://railway-app-production-f84d.up.railway.app/api/projects/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      // Refresh the project list
      fetchProjects();
    } catch (err) {
      setError("Error deleting project. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="project-list">
      <h2>Projects</h2>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div>No projects found. Add your first project above!</div>
      ) : (
        projects.map((project) => (
          <div key={project.id} className="project-item">
            <div className="project-name">{project.name}</div>
            <div className="project-actions">
              <button
                className="btn btn-primary"
                onClick={() => handleEdit(project)}
              >
                Edit
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(project.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
