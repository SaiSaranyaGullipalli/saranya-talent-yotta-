
import { useState } from "react";
import { UsersRound, LockKeyhole, UserRound } from "lucide-react";

export default function Login({ onLogin, error }) {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setSubmitting(true);

    try {
      await onLogin(username, password);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-brand">
          <div className="brand-icon">
            <UsersRound size={28} />
          </div>

          <h1>TalentFlow</h1>
          <p>Recruitment Management Platform</p>
        </div>

        <div className="login-heading">
          <h2>Welcome back!</h2>
          <p>Sign in to access your recruitment dashboard.</p>
        </div>

        {error && (
          <div className="login-error">{error}</div>
        )}

        <form onSubmit={handleSubmit}>

          <label>Username</label>

          <div className="login-input">
            <UserRound size={18} />

            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <label>Password</label>

          <div className="login-input">
            <LockKeyhole size={18} />

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            className="primary-button login-submit"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>

        </form>

        <p className="login-footer">
          Secure access for authorized TalentFlow users.
        </p>

      </div>
    </div>
  );
}
