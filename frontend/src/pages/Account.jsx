import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  loginUserAccount,
  registerUserAccount,
} from "../api/api";
import "./account.css";

export default function Account() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function change(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setBusy(true);

    try {
      if (mode === "register") {
        const result = await registerUserAccount({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        });
        setMessage(result.message || "Registration submitted for approval.");
        setMode("login");
        setForm({ full_name: "", email: form.email, phone: "", password: "" });
      } else {
        const result = await loginUserAccount(form.email.trim(), form.password);
        navigate(result.user.role === "owner" ? "/admin/accounts" : "/admin/dashboard");
      }
    } catch (err) {
      setError(err.message || "The request could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="account-page">
      <section className="account-card">
        <Link className="account-brand" to="/">CREATOR YARD</Link>
        <p className="account-eyebrow">TEAM ACCESS</p>
        <h1>{mode === "login" ? "Welcome back" : "Create your staff account"}</h1>
        <p className="account-intro">
          {mode === "login"
            ? "Sign in to access the tools your role permits."
            : "Your account must be approved by the owner before you can sign in."}
        </p>

        {error && <div className="account-message account-error" role="alert">{error}</div>}
        {message && <div className="account-message account-success" role="status">{message}</div>}

        <form onSubmit={submit} className="account-form">
          {mode === "register" && <>
            <label>Full name
              <input name="full_name" autoComplete="name" required minLength={2}
                maxLength={150} value={form.full_name} onChange={change} />
            </label>
            <label>Phone number
              <input name="phone" type="tel" autoComplete="tel" required
                minLength={7} maxLength={40} value={form.phone} onChange={change} />
            </label>
          </>}

          <label>Email address
            <input name="email" type="email" autoComplete="email" required
              maxLength={254} value={form.email} onChange={change} />
          </label>
          <label>Password
            <input name="password" type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required minLength={mode === "login" ? 1 : 12} maxLength={128}
              value={form.password} onChange={change} />
            {mode === "register" && <small>Use at least 12 characters.</small>}
          </label>

          <button type="submit" disabled={busy}>
            {busy ? "Please wait..." : mode === "login" ? "Sign in" : "Submit registration"}
          </button>
        </form>

        <p className="account-switch">
          {mode === "login" ? "Need a staff account?" : "Already registered?"}{" "}
          <button type="button" className="account-link"
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setMessage(""); }}>
            {mode === "login" ? "Register here" : "Sign in"}
          </button>
        </p>
        <Link className="account-home-link" to="/">Back to Creator Yard website</Link>
      </section>
    </main>
  );
}
