import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import api from './api';
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

{/* 🔰 Logo */}
      <div className="absolute top-4 left-4">
        <img src="../public/logo.jpg" alt="Logo" className="h-12 w-auto rounded shadow-md" />
      </div>

const UsersIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const CodeIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);
const PlusIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const ArrowLeftIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
const LoaderIcon = ({ className }) => (
  <svg className={className + " animate-spin"} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" stroke="currentColor">
    <defs>
      <linearGradient id="a">
        <stop offset="0" stopColor="#fff" stopOpacity="0"></stop>
        <stop offset="1" stopColor="#fff"></stop>
      </linearGradient>
    </defs>
    <path stroke="url(#a)" strokeLinecap="round" strokeWidth="15" d="M100 25A75 75 0 0 1 100 175"
      style={{ transformOrigin: 'center' }}></path>
  </svg>
);
const LogOutIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const UserIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// --- Shared components ---
const Input = ({ id, type, placeholder, value, onChange, error, disabled }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{placeholder}</label>
    <input id={id} type={type} value={value} onChange={onChange} disabled={disabled} required={!disabled}
      className={`w-full px-4 py-3 rounded-lg bg-gray-800 border ${error ? 'border-red-500' : 'border-gray-700'} text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-indigo-500'}`}
      placeholder={placeholder} />
    {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
  </div>
);

const Button = ({ children, onClick, type = "button", fullWidth = false, disabled = false, isLoading = false }) => (
  <button type={type} onClick={onClick} disabled={disabled || isLoading}
    className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${fullWidth ? 'w-full' : ''} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
    {isLoading ? <LoaderIcon className="w-6 h-6" /> : children}
  </button>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <LoaderIcon className="w-12 h-12 text-indigo-500" />
  </div>
);

const ErrorMessage = ({ message, onRetry }) => (
  <div className="bg-red-500/20 text-red-400 p-4 rounded-lg text-center">
    <p>Oops! Something went wrong</p>
    <p className="text-sm my-2">{message}</p>
    {onRetry && <button onClick={onRetry} className="text-indigo-400 hover:underline">Try again</button>}
  </div>
);

// --- Validation Schemas ---
const loginSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().min(4, "Minimum 4 characters").required("Required"),
});

const registerSchema = Yup.object({
  username: Yup.string().min(3, "Minimum 3 letters").required("Required"),
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().min(4, "Minimum 4 characters").required("Required"),
});

const profileSchema = Yup.object({
  githubUsername: Yup.string().required("Required"),
});

const createGroupSchema = Yup.object({
  name: Yup.string().min(2, "Too short").required("Required"),
  description: Yup.string().min(2, "Too short").required("Required"),
});

const createChallengeSchema = Yup.object({
  Topic: Yup.string().min(3, "Too short").required("Required"),
  difficulty: Yup.string().oneOf(['Easy', 'Medium', 'Hard']).required("Required"),
});

// --- Pages ---
// Login Page
function LoginPage({ navigateTo, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    try {
      await loginSchema.validate({ email, password }, { abortEarly: false });
      setLoading(true);
      const data = await api.login(email, password);
      localStorage.setItem("dojo_token", data.access_token);
      const user = await api.getMe();
      onLoginSuccess(user);
    } catch (err) {
      if (err.name === "ValidationError") {
        const errs = {};
        err.inner.forEach(({ path, message }) => { errs[path] = message; });
        setFieldErrors(errs);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
    {/* 🔰 Logo */}
      <div className="absolute top-4 left-4">
        <img src="/logo.jpg" alt="Dojo" className="h-16 w-auto rounded shadow-md" />
      </div>
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-4xl font-bold text-center text-white">Welcome to Dojo</h1>
        <p className="mt-2 text-center text-lg text-gray-400">Sign in to continue your training</p>
        {error && <ErrorMessage message={error} />}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <Input id="email" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} error={fieldErrors.email} />
          <Input id="password" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} error={fieldErrors.password} />
          <Button type="submit" fullWidth isLoading={loading}>Sign In</Button>
        </form>
        <p className="text-center text-gray-400 mt-3">
          Not a member? <button className="text-indigo-400" onClick={() => navigateTo("register")}>Register now</button>
        </p>
      </div>
    </div>
  );
}

// Register Page
function RegisterPage({ navigateTo }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
  e.preventDefault();
  setError(null);
  setFieldErrors({});
  try {
    await registerSchema.validate({ username, email, password }, { abortEarly: false });
    setLoading(true);
    await api.register(username, email, password);
    toast.success("Registered successfully! Please log in.");
    navigateTo("login");
  } catch (err) {
    if (err.name === "ValidationError") {
      const errs = {};
      err.inner.forEach(({ path, message }) => { errs[path] = message; });
      setFieldErrors(errs);
    } else {
      setError(err.message);
    }
  } finally {
    setLoading(false);
  }
}


  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
    {/* 🔰 Logo */}
      <div className="absolute top-4 left-4">
        <img src="/logo.jpg" alt="Dojo" className="h-16 w-auto rounded shadow-md" />
      </div>
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-4xl font-bold text-center text-white">Join the Dojo</h1>
        <p className="mt-2 text-center text-lg text-gray-400">Create your account to start competing</p>
        {error && <ErrorMessage message={error} />}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <Input id="username" type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} error={fieldErrors.username} />
          <Input id="email" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} error={fieldErrors.email} />
          <Input id="password" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} error={fieldErrors.password} />
          <Button type="submit" fullWidth isLoading={loading}>Create Account</Button>
        </form>
        <p className="text-center text-gray-400 mt-3">
          Already registered? <button className="text-indigo-400" onClick={() => navigateTo("login")}>Sign In</button>
        </p>
      </div>
    </div>
  );
}

// Profile Page
function ProfilePage({ navigateTo, user, onUserUpdate }) {
  const [githubUsername, setGithubUsername] = useState(user.githubUsername || user.github_username || "");
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccess(false);
    try {
      await profileSchema.validate({ githubUsername }, { abortEarly: false });
      setLoading(true);
      const updatedUser = await api.updateMe(githubUsername);
      onUserUpdate(updatedUser);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      if (err.name === "ValidationError") {
        const errs = {};
        err.inner.forEach(({ path, message }) => { errs[path] = message; });
        setFieldErrors(errs);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button onClick={() => navigateTo("dashboard")} className="flex items-center text-indigo-400 hover:text-indigo-300 mb-6">
        <ArrowLeftIcon className="w-5 h-5 mr-2" /> Back to Dashboard
      </button>
       {/* 🔰 Logo */}
      <div className="absolute top-4 left-4">
        <img src="/logo.jpg" alt="Dojo" className="h-16 w-auto rounded shadow-md" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-4">Your Profile</h1>
      <p className="mb-6 text-gray-400">Update your details here. Your GitHub username is required to participate.</p>
      <div className="bg-gray-800 p-6 rounded-xl max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <Input id="username" type="text" placeholder="Username" value={user.username} disabled />
          <Input id="email" type="email" placeholder="Email" value={user.email} disabled />
          <Input id="githubUsername" type="text" placeholder="GitHub Username" value={githubUsername} onChange={e => setGithubUsername(e.target.value)} error={fieldErrors.githubUsername || error} />
          <div className="flex items-center space-x-4">
            <Button type="submit" isLoading={loading}>Save Changes</Button>
            {success && <p className="text-green-400">Profile updated successfully!</p>}
          </div>
        </form>
      </div>
    </div>
  );
}

// Group Profile Page
function GroupProfilePage({ navigateTo, user, groupId }) {
  const [group, setGroup] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [challenges, setChallenges] = useState([]);

  const [selectedUserId, setSelectedUserId] = useState(null);
const [feedbackData, setFeedbackData] = useState([]);
const [showModal, setShowModal] = useState(false);

const handleFeedbackClick = async (userId) => {
  setSelectedUserId(userId);
  setShowModal(true);

  try {
    const res = await api.fetchFeedback(userId);

    // Assuming it returns last 2 challenges with test cases and their status
    setFeedbackData(res || []);
  } catch (err) {
    console.error("Error fetching feedback:", err);
    setFeedbackData([]);
  }
};


  // Fetch group and leaderboard data
  const fetchData = async () => {
    setLoading(true);
    try {
      const groups = await api.getGroups();
      const selectedGroup = groups.find((g) => (g.id || g.group_id) === groupId);

      if (!selectedGroup) {
        setError("Group not found");
        return;
      }

      setGroup(selectedGroup);
      debugger
      const leaderboardData = await api.getGroupLeaderboard(groupId);
      console.log("Leaderboard Data:", leaderboardData);
      setLeaderboard(leaderboardData || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load group data");
    } finally {
      setLoading(false);
    }
  };
const [challengeHistory, setChallengeHistory] = useState([]);
const [loadingChallengeHistory, setLoadingChallengeHistory] = useState(true);


useEffect(() => {
  async function loadGroupData() {
    setLoading(true);
    try {
      const groupRes = await api.getGroups();
      const groupData = groupRes.find((g) => g.id === groupId);
      setGroup(groupData);

      const leaderboardRes = await api.getGroupLeaderboard(groupId);
      
      setLeaderboard(leaderboardRes || []);

      const previousChallenges = await api.getPreviousChallenges(groupId);
      if (!previousChallenges || previousChallenges.length === 0) {
        toast.info("No challenge history found");
        setChallengeHistory([]); // important
      } else {
        setChallengeHistory(previousChallenges);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching group data:", err);
      toast.error("Failed to load group data");
    } finally {
      setLoading(false);  // ✅ FINAL step: always stop loading
    }
  }

  if (groupId) {
    loadGroupData();
  }
}, [groupId]);




  // Challenge creation handler
  const handleCreateChallenge = async (e) => {
    e.preventDefault();

    try {
      const validated = await createChallengeSchema.validate({ Topic: topic, difficulty });
      setSubmitLoading(true);

      const challenge = await api.createChallenge({
        group_id: groupId,
        Topic: validated.Topic,
        difficulty: validated.difficulty,
      });

      toast.success("Challenge created successfully!");
      
      setShowChallengeForm(false);
      setTopic("");
      setDifficulty("Easy");

      
    } catch (err) {
      toast.error(err.message || "Failed to create challenge");
    } finally {
      setSubmitLoading(false);
    }
  };

  const getRowClass = (index) => {
    // if (index === 0) return "bg-green-700 text-white";
    // if (index === 1) return "bg-blue-700 text-white";
    // if (index === 2) return "bg-yellow-700 text-black";
    return "";
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button onClick={() => navigateTo("dashboard")} className="flex items-center text-indigo-400 hover:text-indigo-300 mb-6">
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Back to Dashboard
      </button>

        {/* 🔰 Logo */}
      <div className="absolute top-4 left-4">
        <img src="/logo.jpg" alt="Dojo" className="h-16 w-auto rounded shadow-md" />
      </div>

      <div className="bg-gray-800 p-6 rounded-xl shadow">
        <h1 className="text-3xl text-white font-bold">{group.name}</h1>
        <p className="text-gray-400 mt-2">{group.description}</p>
        <p className="text-gray-500 text-xs mt-1">ID: {group.id || group.group_id}</p>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => setShowChallengeForm(true)}>+ Create Challenge</Button>
      </div>

      {showChallengeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl max-w-md w-full shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">Create New Challenge</h2>
            <form onSubmit={handleCreateChallenge} className="space-y-4" noValidate>
              <Input
                id="topic"
                type="text"
                placeholder="Topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
              <div>
                <label htmlFor="difficulty" className="block text-sm text-gray-300 mb-1">Difficulty</label>
                <select
                  id="difficulty"
                  className="w-full p-2 rounded text-black"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
              <div className="flex justify-between gap-2">
                <Button type="submit" isLoading={submitLoading}>Create</Button>
                <Button type="button" onClick={() => setShowChallengeForm(false)} variant="secondary">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-2xl font-bold text-white mb-4">Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p className="text-gray-400">No leaderboard yet.</p>
        ) :
         (
          <table className="w-full table-auto border border-gray-700 text-left text-sm text-white">
            <thead className="bg-gray-700 text-gray-300">
              <tr>
                <th className="px-4 py-2">Rank</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Score</th>
              <th className="px-4 py-2">Feedback</th>

              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user, index) => (
                <tr key={user.user_id || index} className={`${getRowClass(index)} border-b border-gray-700`}>
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">{user.email || user.username}</td>
                  <td className="px-4 py-2">{user.xp || user.points || user.score }</td>

                                  <td className="px-4 py-2">
                  <button
                    onClick={() => handleFeedbackClick(user.user_id)}
                    className="text-indigo-400 hover:underline text-sm"
                  >
                    View Feedback
                  </button>
                </td>
              
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white text-black rounded-lg p-6 max-w-lg w-full shadow-lg overflow-y-auto max-h-[80vh]">
      <h2 className="text-xl font-bold mb-4">Recent Feedback</h2>
      {feedbackData.length === 0 ? (
        <p>No feedback data found.</p>
      ) : (
        feedbackData.map((item, idx) => (
  <div key={idx} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
    <div className="flex justify-between items-center mb-2">
      <p className="font-semibold text-gray-800">
        Score: <span className="font-bold text-indigo-600">{item.score} / 100</span>
      </p>
      <p className="text-xs text-gray-500">
        {/* Formats the timestamp into a readable local date and time */}
        {new Date(item.processed_at).toLocaleString()}
      </p>
    </div>
    <p className="text-sm text-gray-700">{item.feedback}</p>
  </div>
        ))
      )}
      <div className="flex justify-end mt-4">
        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

      </div>
    

    {/* Challenge History */}
    <div>
      <h3 className="text-white text-xl font-semibold mb-2 mt-8">Challenge History</h3>

      {challengeHistory.length === 0 ? (
        <p className="text-gray-300 italic">No challenge history found for this group.</p>
      ) : (
        <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
          <thead>
            <tr className="text-left text-white bg-gray-700">
              <th className="p-3">#</th>
              <th className="p-3">Topic</th>
              <th className="p-3">Difficulty</th>
            </tr>
          </thead>
          <tbody>
          {[...challengeHistory.slice(-5)]  // clone last 5
            .reverse()                      // now reverse
            .map((ch, idx) => (
              <tr key={idx} className="text-white border-t border-gray-700">
                <td className="p-3">{idx + 1}</td>
                <td className="p-3">{ch.topic || ch.Topic}</td>
                <td className="p-3">{ch.difficulty}</td>
              </tr>
          ))}
        </tbody>

        </table>
      )}

   
    </div>
    
  </div>
  
)
}

      

// Dashboard Page
function Dashboard({ user, handleLogout, navigateTo }) {
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joiningGroupId, setJoiningGroupId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createErrors, setCreateErrors] = useState({});
  const [createGeneralError, setCreateGeneralError] = useState(null);
  const [currentPage,setCurrentPage]= useState(null);

  // Fetch groups
  async function fetchGroups() {
    setLoading(true);
    setError(null);
    try {
      const groups = await api.getGroups();
      setAllGroups(groups);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  async function handleCreateGroup(e) {
    e.preventDefault();
    setCreateGeneralError(null);
    setCreateErrors({});
    try {
      await createGroupSchema.validate({ name: newGroupName, description: newGroupDesc }, { abortEarly: false });
      setCreatingGroup(true);
      await api.createGroup(newGroupName, newGroupDesc);
      setShowCreateModal(false);
      setNewGroupName("");
      setNewGroupDesc("");
      await fetchGroups();
    } catch (err) {
      if (err.name === "ValidationError") {
        const errs = {};
        err.inner.forEach(({ path, message }) => { errs[path] = message; });
        setCreateErrors(errs);
      } else {
        setCreateGeneralError(err.message);
      }
    } finally {
      setCreatingGroup(false);
    }
  }

  async function handleJoinGroup(groupId, e) {
  e.stopPropagation();
  setJoiningGroupId(groupId);
  try {
    await api.joinGroup(groupId);
    toast.success("Successfully joined group!");
    navigateTo('Dashboard')

    await fetchGroups();

    
    setJoiningGroupId(groupId);
    setCurrentPage("groupProfilePage"); 

  } catch (err) {
    toast.error("Could not join group: " + err.message);
  } finally {
    setJoiningGroupId(null);
  }
}

  // Split user's joined groups and other groups
  const myGroups = allGroups.filter(g => (g.members || []).includes(user.id));
  const otherGroups = allGroups.filter(g => !myGroups.includes(g));

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
    {/* 🔰 Logo */}
      <div className="absolute top-4 left-4">
        <img src="/logo.jpg" alt="Dojo" className="h-12 w-auto rounded shadow-md" />
      </div>
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Welcome, {user.username}</h1>
          <p className="text-gray-400">Choose a group to get started</p>
        </div>
        <div className="flex gap-4 items-center">
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="mr-2 w-5 h-5" /> Create Group
          </Button>
          <button onClick={() => navigateTo("profile")} title="Profile" className="p-2 rounded-full hover:bg-gray-700">
            <UserIcon className="w-6 h-6 text-gray-400" />
          </button>
          <button onClick={handleLogout} title="Logout" className="p-2 rounded-full hover:bg-gray-700">
            <LogOutIcon className="w-6 h-6 text-gray-400" />
          </button>
        </div>
      </header>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={fetchGroups} />}

      {!loading && !error && (
        <>
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4">My Groups</h2>
            {myGroups.length === 0 ? (
              <p className="text-gray-400">You haven't joined any groups yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myGroups.map(group => (
                  <GroupCard key={group.id || group.group_id} group={group} onJoin={handleJoinGroup} onClick={() => navigateTo(`group:${group.id || group.group_id}`)} isJoined={true} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">All Groups</h2>
            {otherGroups.length === 0 ? (
              <p className="text-gray-400">No other groups available</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherGroups.map(group => (
                  <GroupCard key={group.id || group.group_id} group={group} onJoin={handleJoinGroup} onClick={() => navigateTo(`group:${group.id || group.group_id}`)} isJoined={false} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
          <div className="bg-gray-800 p-6 rounded-xl max-w-md w-full">
            <h2 className="text-xl text-white font-bold mb-4">Create New Group</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4" noValidate>
              <Input id="name" type="text" placeholder="Group Name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} error={createErrors.name} />
              <Input id="description" type="text" placeholder="Description" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} error={createErrors.description} />
              {createGeneralError && <p className="text-red-400">{createGeneralError}</p>}
              <div className="flex justify-between">
                <Button type="submit" isLoading={creatingGroup}>Create</Button>
                <Button type="button" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Group Card component
function GroupCard({ group, onJoin, onClick, isJoined }) {
  const [loading, setLoading] = useState(false);

  async function handleJoinClick(e) {
    e.stopPropagation();
    setLoading(true);
    try {
      await onJoin(group.id || group.group_id, e);
    } finally {
      setLoading(false);
    }
  }

    return (
    <div onClick={onClick} className="bg-gray-800 p-6 rounded-xl cursor-pointer hover:bg-gray-700 transition-shadow shadow-md relative">
      <h3 className="text-xl font-bold text-white">{group.name}</h3>
      <p className="text-gray-400 mb-1">{group.description}</p>
      <p className="text-gray-500 text-xs mb-2">ID: {group.id || group.group_id}</p>
      <div className="flex items-center justify-between border-t border-gray-700 pt-3 text-sm text-gray-300">
        <span className="flex items-center"><UsersIcon className="w-4 h-4 mr-1" /> {group.members?.length || 0} Members</span>
    
        {!isJoined && <Button type="button" onClick={handleJoinClick} isLoading={loading} disabled={loading}>Join</Button>}
      </div>
    </div>
  );
// ... [Previous imports and icon components remain exactly the same] ...
}


// Main App component
export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("login"); // login, register, dashboard, profile, group
  const [currentGroupId, setCurrentGroupId] = useState(null);
  const [currentChallengeId, setCurrentChallengeId] = useState(null); 
  // const [SubmitChallengePage, setSubmitChallengePage] = useState(null);

  useEffect(() => {
    async function init() {
      const token = localStorage.getItem("dojo_token");
      if (!token) {
        setUser(null);
        setCurrentPage("login");
        return;
      }
      try {
        const userData = await api.getMe();
        setUser(userData);
        setCurrentPage("dashboard");
      } catch {
        localStorage.removeItem("dojo_token");
        setUser(null);
        setCurrentPage("login");
      }
    }
    init();
  }, []);

   function navigateTo(page) {
    if (page.startsWith("group:")) {
      setCurrentGroupId(page.split(":")[1]);
      setCurrentPage("group");
    } else if (page.startsWith("submit:")) {
      setCurrentChallengeId(page.split(":")[1]);
      setCurrentPage("submit");
    } else {
      setCurrentGroupId(null);
      setCurrentChallengeId(null);
      setCurrentPage(page);
    }
  }

  async function onLoginSuccess(userData) {
    setUser(userData);
    setCurrentPage("dashboard");
  }

  function onUserUpdate(updated) {
    setUser(updated);
  }

  function handleLogout() {
    localStorage.removeItem("dojo_token");
    setUser(null);
    setCurrentPage("login");
  }

  function renderPage() {
    if (!user) {
      if (currentPage === "register") {
        return <RegisterPage navigateTo={navigateTo} 
        

/>;
      }
      return <LoginPage navigateTo={navigateTo} onLoginSuccess={onLoginSuccess} />;
    }

    switch (currentPage) {
      case "profile": 
        return <ProfilePage navigateTo={navigateTo} user={user} onUserUpdate={onUserUpdate} />;
      case "group": 
        return <GroupProfilePage navigateTo={navigateTo} user={user} groupId={currentGroupId} />;
      case "submit":
        
      case "dashboard":
      default:
        return <Dashboard user={user} handleLogout={handleLogout} navigateTo={navigateTo} />;
    }
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      {renderPage()}
       <ToastContainer
      position="bottom-center"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
    />
    </div>
    
  );

 

}