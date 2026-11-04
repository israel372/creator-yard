import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setupOwnerAccount } from "../api/api";
import "./account.css";

export default function OwnerSetup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "", setup_key: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function change(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await setupOwnerAccount({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        setup_key: form.setup_key,
      });
      navigate("/admin/accounts");
    } catch (err) {
      setError(err.message || "Owner setup failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="account-page">
      <section className="account-card">
        <Link className="account-brand" to="/">CREATOR YARD</Link>
        <p className="account-eyebrow">INITIAL ADMINISTRATOR</p>
        <h1>Set up the first Owner</h1>
        <p className="account-intro">
          This is for the initial owner only. The server setup key is required,
          and the backend will refuse setup if an Owner already exists.
        </p>
        <div className="account-message account-warning">
          Keep the setup key private. Do not share it or put it in public website code.
        </div>
        {error && <div className="account-message account-error" role="alert">{error}</div>}

        <form onSubmit={submit} className="account-form">
          <label>Full name
            <input name="full_name" autoComplete="name" required minLength={2}
              maxLength={150} value={form.full_name} onChange={change} />
          </label>
          <label>Email address
            <input name="email" type="email" autoComplete="email" required
              maxLength={254} value={form.email} onChange={change} />
          </label>
          <label>Phone number
            <input name="phone" type="tel" autoComplete="tel" required
              minLength={7} maxLength={40} value={form.phone} onChange={change} />
          </label>
          <label>Password
            <input name="password" type="password" autoComplete="new-password"
              required minLength={12} maxLength={128}
              value={form.password} onChange={change} />
            <small>Use at least 12 characters.</small>
          </label>
          <label>Owner setup key
            <input name="setup_key" type="password" autoComplete="off"
              required minLength={32} maxLength={256}
              value={form.setup_key} onChange={change} />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? "Setting up Owner..." : "Create Owner account"}
          </button>
        </form>
        <Link className="account-home-link" to="/account">Return to account sign in</Link>
      </section>
    </main>
  );
}
