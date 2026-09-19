import { useEffect, useState } from "react";
import "./App.css";
import { io } from "socket.io-client";

const API = "http://localhost:5000";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Task = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  project?: {
    id?: string;
    name: string;
    description?: string;
  };
};

type Project = {
  id: string;
  name: string;
  description?: string;
  tasks?: Task[];
};

type Notification = {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type Activity = {
  id: string;
  action: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
  task?: {
    id: string;
    title: string;
    status: string;
  };
};

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [developers, setDevelopers] = useState<User[]>([]);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedDeveloper, setSelectedDeveloper] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  const [message, setMessage] = useState("");

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Activity Feed
  const [activities, setActivities] = useState<Activity[]>([]);

  // Task Search
  const [taskSearch, setTaskSearch] = useState("");

  // ==========================================
  // LOAD NOTIFICATIONS
  // ==========================================

  const loadNotifications = async () => {
    let token = sessionStorage.getItem("accessToken");

    if (!token) return;

    try {
      let response = await fetch(`${API}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        const refreshResponse = await fetch(
          `${API}/api/auth/refresh`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        const refreshData = await refreshResponse.json();

        if (!refreshResponse.ok || !refreshData.success) {
          console.error("Session expired. Please login again.");
          sessionStorage.removeItem("accessToken");
          return;
        }

        const refreshedToken = refreshData.accessToken;

        if (
          !refreshedToken ||
          typeof refreshedToken !== "string"
        ) {
          console.error("Failed to refresh access token.");
          sessionStorage.removeItem("accessToken");
          return;
        }

        token = refreshedToken;
        sessionStorage.setItem("accessToken", token);

        response = await fetch(
          `${API}/api/notifications`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      const data = await response.json();

      if (response.ok && data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        console.error(
          "Notification loading failed:",
          data
        );
      }
    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error
      );
    }
  };

  // ==========================================
  // MARK NOTIFICATIONS READ
  // ==========================================

  const markNotificationsRead = async () => {
    const token = sessionStorage.getItem("accessToken");

    if (!token) return;

    try {
      const response = await fetch(
        `${API}/api/notifications/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setUnreadCount(0);

        setNotifications((previous) =>
          previous.map((notification) => ({
            ...notification,
            isRead: true,
          }))
        );
      }
    } catch (error) {
      console.error(
        "Failed to mark notifications read:",
        error
      );
    }
  };

  // ==========================================
  // LOAD ACTIVITY FEED
  // ==========================================

  const loadActivities = async () => {
    const token = sessionStorage.getItem("accessToken");

    if (!token) return;

    try {
      const response = await fetch(
        `${API}/api/activities`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error("Activity loading error:", error);
    }
  };

  // ==========================================
  // LOGIN
  // ==========================================

  const login = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoginMessage("");

    try {
      const response = await fetch(
        `${API}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setLoginMessage(
          data.message || "Login failed"
        );
        return;
      }

      sessionStorage.setItem(
        "accessToken",
        data.accessToken
      );

      sessionStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setUser(data.user);
      setLoggedIn(true);
      setLoginMessage("");

      setTimeout(() => {
        loadNotifications();
      }, 100);
    } catch (error) {
      console.error(error);
      setLoginMessage("Backend connection failed");
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");

    setLoggedIn(false);
    setUser(null);

    setTasks([]);
    setProjects([]);
    setDevelopers([]);
    setNotifications([]);
    setUnreadCount(0);
    setActivities([]);

    setShowNotifications(false);
    setTaskSearch("");
  };

  // ==========================================
  // LOAD DEVELOPER TASKS
  // ==========================================

  const loadTasks = async () => {
    let token = sessionStorage.getItem("accessToken");

    if (!token) return;

    try {
      let response = await fetch(
        `${API}/api/tasks/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        const refreshResponse = await fetch(
          `${API}/api/auth/refresh`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        const refreshData =
          await refreshResponse.json();

        const refreshedToken =
          refreshData?.accessToken;

        if (
          !refreshResponse.ok ||
          !refreshData.success ||
          typeof refreshedToken !== "string" ||
          !refreshedToken
        ) {
          console.error(
            "Session expired. Please login again."
          );

          sessionStorage.removeItem(
            "accessToken"
          );

          return;
        }

        token = refreshedToken;

        sessionStorage.setItem(
          "accessToken",
          refreshedToken
        );

        response = await fetch(
          `${API}/api/tasks/my`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      const data = await response.json();

      if (response.ok) {
        setTasks(data.tasks || []);
      } else {
        console.error(
          "Task loading failed:",
          data
        );
      }
    } catch (error) {
      console.error(
        "Task loading error:",
        error
      );
    }
  };

  // ==========================================
  // LOAD PROJECTS
  // ==========================================

  const loadProjects = async () => {
    const token = sessionStorage.getItem(
      "accessToken"
    );

    if (!token) return;

    try {
      const response = await fetch(
        `${API}/api/projects`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log("PROJECTS:", data);

      if (response.ok) {
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error(
        "Project loading error:",
        error
      );
    }
  };

  // ==========================================
  // LOAD DEVELOPERS
  // ==========================================

  const loadDevelopers = async () => {
    const token = sessionStorage.getItem(
      "accessToken"
    );

    if (!token) return;

    try {
      const response = await fetch(
        `${API}/api/users/developers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.developers) {
        setDevelopers(data.developers);
        return;
      }

      setDevelopers([]);
    } catch (error) {
      console.error(
        "Developer loading error:",
        error
      );

      setDevelopers([]);
    }
  };

  // ==========================================
  // CREATE PROJECT
  // ==========================================

  const createProject = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const token = sessionStorage.getItem(
      "accessToken"
    );

    if (!token) return;

    if (!projectName.trim()) {
      alert("Enter project name");
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/projects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: projectName,
            description: projectDescription,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Project creation failed"
        );
        return;
      }

      alert("Project created successfully!");

      setProjectName("");
      setProjectDescription("");

      loadProjects();
    } catch (error) {
      console.error(error);
      alert("Backend connection failed");
    }
  };

  // ==========================================
  // CREATE TASK
  // ==========================================

  const createTask = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const token = sessionStorage.getItem(
      "accessToken"
    );

    if (!token) return;

    if (
      !taskTitle ||
      !selectedProject ||
      !selectedDeveloper
    ) {
      alert(
        "Please fill Task, Project and Developer"
      );
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: taskTitle,
            description: taskDescription,
            projectId: selectedProject,
            developerId: selectedDeveloper,
            priority,
            dueDate: dueDate || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Task creation failed"
        );
        return;
      }

      alert("Task created successfully!");

      setTaskTitle("");
      setTaskDescription("");
      setSelectedProject("");
      setSelectedDeveloper("");
      setPriority("MEDIUM");
      setDueDate("");

      loadProjects();
    } catch (error) {
      console.error(error);
      alert("Backend connection failed");
    }
  };

  // ==========================================
  // UPDATE TASK STATUS
  // ==========================================

  const updateTaskStatus = async (
    taskId: string,
    status: string
  ) => {
    const token = sessionStorage.getItem(
      "accessToken"
    );

    if (!token) return;

    try {
      const response = await fetch(
        `${API}/api/tasks/${taskId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Status update failed"
        );
        return;
      }

      setMessage(
        "Task status updated successfully!"
      );

      loadTasks();
      loadNotifications();

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (error) {
      console.error(error);
    }
  };

  // ==========================================
  // INITIAL LOGIN CHECK
  // ==========================================

  useEffect(() => {
    const savedUser =
      sessionStorage.getItem("user");

    const savedToken =
      sessionStorage.getItem(
        "accessToken"
      );

    if (savedUser && savedToken) {
      try {
        const parsedUser =
          JSON.parse(savedUser);

        setUser(parsedUser);
        setLoggedIn(true);
      } catch (error) {
        console.error(
          "Saved user data error:",
          error
        );

        sessionStorage.removeItem("user");
        sessionStorage.removeItem(
          "accessToken"
        );
      }
    }
  }, []);

  // ==========================================
  // LOAD DATA
  // ==========================================

  useEffect(() => {
    if (!loggedIn || !user) return;

    loadNotifications();

    if (user.role === "DEVELOPER") {
      loadTasks();
    }

    if (
      user.role === "PROJECT_MANAGER" ||
      user.role === "ADMIN"
    ) {
      loadProjects();
      loadDevelopers();
      loadActivities();
    }
  }, [loggedIn, user]);

  // ==========================================
  // SOCKET.IO
  // ==========================================

  useEffect(() => {
    if (!loggedIn) return;

    const socket = io(API, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log(
        "Socket connected:",
        socket.id
      );
    });

    socket.on("welcome", (data) => {
      console.log(
        "Welcome event:",
        data
      );
    });

    socket.on(
      "taskStatusUpdated",
      (data) => {
        console.log(
          "🔥 LIVE TASK UPDATE:",
          data
        );

        if (
          user?.role === "DEVELOPER"
        ) {
          loadTasks();
          loadNotifications();
        }

        if (
          user?.role ===
            "PROJECT_MANAGER" ||
          user?.role === "ADMIN"
        ) {
          loadActivities();
          loadProjects();
        }
      }
    );

    socket.on(
      "newNotification",
      (data) => {
        console.log(
          "🔔 LIVE NOTIFICATION:",
          data
        );

        if (
          user?.role === "DEVELOPER" &&
          data.userId === user.id
        ) {
          loadNotifications();
        }
      }
    );

    socket.on("disconnect", () => {
      console.log(
        "Socket disconnected"
      );
    });

    return () => {
      socket.off("connect");
      socket.off("welcome");
      socket.off(
        "taskStatusUpdated"
      );
      socket.off(
        "newNotification"
      );
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [loggedIn, user]);

  // ==========================================
  // LOGIN PAGE
  // ==========================================

  if (!loggedIn) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Client Dashboard</h1>

          <p className="login-subtitle">
            Practice Project
          </p>

          <form onSubmit={login}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <div className="password-box">
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
              >
                {showPassword
                  ? "🙈"
                  : "👁️"}
              </button>
            </div>

            <button
              type="submit"
              className="login-button"
            >
              Login
            </button>
          </form>

          {loginMessage && (
            <p className="error-message">
              {loginMessage}
            </p>
          )}

          <div className="practice-login">
            <p>Practice Accounts</p>

            <small>
              Developer:
              developer1@test.com
            </small>

            <small>
              Manager:
              manager2@test.com
            </small>

            <small>
              Password: Test@12345
            </small>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // DEVELOPER DASHBOARD
  // ==========================================

  if (user?.role === "DEVELOPER") {
    const completed = tasks.filter(
      (task) =>
        task.status === "DONE"
    ).length;

    const inProgress = tasks.filter(
      (task) =>
        task.status === "IN_PROGRESS"
    ).length;

    const todo = tasks.filter(
      (task) =>
        task.status === "TODO"
    ).length;

    const inReview = tasks.filter(
      (task) =>
        task.status === "IN_REVIEW"
    ).length;

    const overdueCount = tasks.filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate) <
          new Date() &&
        task.status !== "DONE"
    ).length;

    const uniqueProjects =
      Array.from(
        new Map(
          tasks
            .filter(
              (task) => task.project
            )
            .map((task) => [
              task.project?.id,
              task.project,
            ])
        ).values()
      );

    // SEARCH TASKS / PROJECTS
    const filteredTasks =
      tasks.filter((task) => {
        const search =
          taskSearch.toLowerCase();

        return (
          task.title
            .toLowerCase()
            .includes(search) ||
          (
            task.project?.name || ""
          )
            .toLowerCase()
            .includes(search)
        );
      });

    return (
      <div className="dashboard">
        <header className="topbar">
          <div>
            <h1>Client Dashboard</h1>

            <p>
              Welcome, {user.name}
            </p>
          </div>

          <div className="topbar-actions">
            {/* NOTIFICATIONS */}
            <div className="notification-wrapper">
              <button
                className="notification-button"
                onClick={() => {
                  const nextState =
                    !showNotifications;

                  setShowNotifications(
                    nextState
                  );

                  if (nextState) {
                    markNotificationsRead();
                  }
                }}
                aria-label="Notifications"
              >
                🔔

                {unreadCount > 0 && (
                  <span className="notification-count">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="notification-panel">
                  <div className="notification-panel-header">
                    <h3>
                      Notifications
                    </h3>

                    {notifications.length >
                      0 && (
                      <button
                        onClick={
                          markNotificationsRead
                        }
                      >
                        Mark read
                      </button>
                    )}
                  </div>

                  {notifications.length ===
                  0 ? (
                    <p className="no-notifications">
                      No notifications
                    </p>
                  ) : (
                    notifications.map(
                      (notification) => (
                        <div
                          className={`notification-item ${
                            !notification.isRead
                              ? "unread"
                              : ""
                          }`}
                          key={
                            notification.id
                          }
                        >
                          <p>
                            {
                              notification.message
                            }
                          </p>

                          <small>
                            {new Date(
                              notification.createdAt
                            ).toLocaleString()}
                          </small>
                        </div>
                      )
                    )
                  )}
                </div>
              )}
            </div>

            <button
              className="logout"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="content">
          {/* DASHBOARD SUMMARY */}
          <section className="summary-grid">
            <div className="summary-card">
              <h3>Projects</h3>
              <p>
                {uniqueProjects.length}
              </p>
            </div>

            <div className="summary-card">
              <h3>Total Tasks</h3>
              <p>{tasks.length}</p>
            </div>

            <div className="summary-card">
              <h3>Overdue</h3>
              <p>{overdueCount}</p>
            </div>
          </section>

          {/* STATUS SUMMARY */}
          <div className="stats">
            <div className="stat-card">
              <h3>Total Tasks</h3>
              <strong>
                {tasks.length}
              </strong>
            </div>

            <div className="stat-card">
              <h3>To Do</h3>
              <strong>{todo}</strong>
            </div>

            <div className="stat-card">
              <h3>In Progress</h3>
              <strong>
                {inProgress}
              </strong>
            </div>

            <div className="stat-card">
              <h3>In Review</h3>
              <strong>{inReview}</strong>
            </div>

            <div className="stat-card">
              <h3>Completed</h3>
              <strong>
                {completed}
              </strong>
            </div>
          </div>

          {/* MY PROJECTS */}
          <section className="project-section">
            <h2>📁 My Projects</h2>

            {uniqueProjects.length ===
            0 ? (
              <p>
                No projects assigned yet.
              </p>
            ) : (
              <div className="project-grid">
                {uniqueProjects.map(
                  (project) => (
                    <div
                      className="project-card"
                      key={project?.id}
                    >
                      <h3>
                        {project?.name}
                      </h3>

                      <p>
                        {project?.description ||
                          "No project description"}
                      </p>

                      <span>
                        Tasks:{" "}
                        {
                          tasks.filter(
                            (task) =>
                              task.project
                                ?.id ===
                              project?.id
                          ).length
                        }
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          {/* MY TASKS */}
          <section className="task-section">
            <h2>My Tasks</h2>

            {message && (
              <p className="success-message">
                {message}
              </p>
            )}

            {/* SEARCH */}
            <input
              type="text"
              className="task-search"
              placeholder="🔍 Search tasks or projects..."
              value={taskSearch}
              onChange={(e) =>
                setTaskSearch(
                  e.target.value
                )
              }
            />

            <div className="task-grid">
              {filteredTasks.length ===
              0 ? (
                <p>
                  {tasks.length === 0
                    ? "No tasks assigned."
                    : "No tasks found."}
                </p>
              ) : (
                filteredTasks.map(
                  (task) => {
                    const isOverdue =
                      !!task.dueDate &&
                      new Date(
                        task.dueDate
                      ) < new Date() &&
                      task.status !== "DONE";

                    return (
                      <div
                        className={`task-card ${
                          isOverdue
                            ? "task-overdue"
                            : ""
                        }`}
                        key={task.id}
                      >
                        {/* OVERDUE */}
                        {isOverdue && (
                          <div className="overdue-badge">
                            ⚠️ OVERDUE
                          </div>
                        )}

                        <div className="task-header">
                          <h3>
                            {task.title}
                          </h3>

                          <span
                            className={`status ${task.status}`}
                          >
                            {task.status ===
                            "TODO"
                              ? "To Do"
                              : task.status ===
                                "IN_PROGRESS"
                              ? "In Progress"
                              : task.status ===
                                "IN_REVIEW"
                              ? "In Review"
                              : task.status ===
                                "DONE"
                              ? "Completed"
                              : task.status}
                          </span>
                        </div>

                        <p>
                          {task.description ||
                            "No description"}
                        </p>

                        <div className="task-info">
                          {/* PRIORITY */}
                          <span
                            className={`priority priority-${task.priority}`}
                          >
                            Priority:{" "}
                            {task.priority}
                          </span>

                          {/* PROJECT */}
                          <span>
                            Project:{" "}
                            {task.project
                              ?.name ||
                              "Unknown"}
                          </span>

                          {/* DUE DATE */}
                          {task.dueDate && (
                            <span>
                              Due:{" "}
                              {new Date(
                                task.dueDate
                              ).toLocaleDateString(
                                "en-GB"
                              )}
                            </span>
                          )}
                        </div>

                        {/* STATUS UPDATE */}
                        <select
                          value={
                            task.status
                          }
                          onChange={(e) =>
                            updateTaskStatus(
                              task.id,
                              e.target.value
                            )
                          }
                        >
                          <option value="TODO">
                            To Do
                          </option>

                          <option value="IN_PROGRESS">
                            In Progress
                          </option>

                          <option value="IN_REVIEW">
                            In Review
                          </option>

                          <option value="DONE">
                            Completed
                          </option>
                        </select>
                      </div>
                    );
                  }
                )
              )}
            </div>
          </section>
        </main>
      </div>
    );
  }

  // ==========================================
  // MANAGER / ADMIN DASHBOARD
  // ==========================================

  return (
    <div className="dashboard">
      <header className="topbar">
        <div>
          <h1>
            {user?.role === "ADMIN"
              ? "Admin Dashboard"
              : "Manager Dashboard"}
          </h1>

          <p>
            Welcome, {user?.name}
          </p>
        </div>

        <button
          className="logout"
          onClick={logout}
        >
          Logout
        </button>
      </header>

      <main className="content">
        {/* DASHBOARD SUMMARY */}
        <section className="summary-grid">
          <div className="summary-card">
            <h3>Projects</h3>
            <p>{projects.length}</p>
          </div>

          <div className="summary-card">
            <h3>Developers</h3>
            <p>
              {developers.length}
            </p>
          </div>

          <div className="summary-card">
            <h3>Total Tasks</h3>
            <p>
              {projects.reduce(
                (total, project) =>
                  total +
                  (project.tasks
                    ?.length || 0),
                0
              )}
            </p>
          </div>
        </section>

        {/* CREATE PROJECT */}
        <section className="form-section">
          <h2>Create Project</h2>

          <form
            onSubmit={createProject}
          >
            <input
              type="text"
              placeholder="Project Name"
              value={projectName}
              onChange={(e) =>
                setProjectName(
                  e.target.value
                )
              }
            />

            <textarea
              placeholder="Project Description"
              value={
                projectDescription
              }
              onChange={(e) =>
                setProjectDescription(
                  e.target.value
                )
              }
            />

            <button type="submit">
              Create Project
            </button>
          </form>
        </section>

        {/* CREATE TASK */}
        <section className="form-section">
          <h2>Create Task</h2>

          <form onSubmit={createTask}>
            <input
              type="text"
              placeholder="Task Title"
              value={taskTitle}
              onChange={(e) =>
                setTaskTitle(
                  e.target.value
                )
              }
            />

            <textarea
              placeholder="Task Description"
              value={taskDescription}
              onChange={(e) =>
                setTaskDescription(
                  e.target.value
                )
              }
            />

            <select
              value={selectedProject}
              onChange={(e) =>
                setSelectedProject(
                  e.target.value
                )
              }
            >
              <option value="">
                Select Project
              </option>

              {projects.map(
                (project) => (
                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.name}
                  </option>
                )
              )}
            </select>

            <select
              value={
                selectedDeveloper
              }
              onChange={(e) =>
                setSelectedDeveloper(
                  e.target.value
                )
              }
            >
              <option value="">
                Select Developer
              </option>

              {developers.map(
                (developer) => (
                  <option
                    key={developer.id}
                    value={developer.id}
                  >
                    {developer.name} (
                    {developer.email})
                  </option>
                )
              )}
            </select>

            <select
              value={priority}
              onChange={(e) =>
                setPriority(
                  e.target.value
                )
              }
            >
              <option value="LOW">
                LOW
              </option>

              <option value="MEDIUM">
                MEDIUM
              </option>

              <option value="HIGH">
                HIGH
              </option>

              <option value="CRITICAL">
                CRITICAL
              </option>
            </select>

            <input
              type="date"
              value={dueDate}
              onChange={(e) =>
                setDueDate(
                  e.target.value
                )
              }
            />

            <button type="submit">
              Create Task
            </button>
          </form>
        </section>

        {/* LIVE ACTIVITY FEED */}
        <section className="activity-section">
          <div className="activity-header">
            <div>
              <h2>
                ⚡ Live Activity Feed
              </h2>

              <p>
                Recent project activity
              </p>
            </div>

            <button
              className="activity-refresh"
              onClick={loadActivities}
            >
              Refresh
            </button>
          </div>

          {activities.length ===
          0 ? (
            <p className="no-activities">
              No recent activity.
            </p>
          ) : (
            <div className="activity-list">
              {activities.map(
                (activity) => (
                  <div
                    className="activity-item"
                    key={activity.id}
                  >
                    <div className="activity-icon">
                      ⚡
                    </div>

                    <div className="activity-content">
                      <strong>
                        {
                          activity.user
                            .name
                        }
                      </strong>

                      <p>
                        {activity.action}
                      </p>

                      {activity.task && (
                        <span className="activity-task">
                          Task:{" "}
                          {
                            activity.task
                              .title
                          }
                        </span>
                      )}

                      <small>
                        {new Date(
                          activity.createdAt
                        ).toLocaleString()}
                      </small>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* MY PROJECTS */}
        <section className="task-section">
          <h2>My Projects</h2>

          {projects.length ===
          0 ? (
            <p>No projects found.</p>
          ) : (
            <div className="task-grid">
              {projects.map(
                (project) => (
                  <div
                    className="task-card"
                    key={project.id}
                  >
                    <h3>
                      {project.name}
                    </h3>

                    <p>
                      {project.description ||
                        "No description"}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;