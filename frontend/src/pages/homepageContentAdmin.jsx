import { useEffect, useState } from "react";
import homepageDefaults from "../homepageDefaults.js";
import {
  loginVideoPortfolioAdmin,
  getAdminHomepageContent,
  saveHomepageDraft,
  publishHomepageContent,
} from "../api/api";

const C = {
  bg: "#101211",
  panel: "#191c19",
  panel2: "#202420",
  border: "#303630",
  lime: "#c4f56a",
  text: "#f1f3ed",
  muted: "#929b90",
  red: "#ff7777",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  background: C.bg,
  color: C.text,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  outlineColor: C.lime,
  font: "inherit",
};

const buttonStyle = {
  padding: "10px 14px",
  borderRadius: 8,
  border: `1px solid ${C.border}`,
  background: C.panel2,
  color: C.text,
  cursor: "pointer",
  fontWeight: 600,
};

const primaryButton = {
  ...buttonStyle,
  background: C.lime,
  color: "#15190f",
  border: "1px solid transparent",
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  color: C.muted,
  marginBottom: 6,
};

const cardStyle = {
  background: C.panel,
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  padding: 20,
  marginBottom: 16,
};

const clone = (value) => JSON.parse(JSON.stringify(value));

function mergeDefaults(saved) {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
    return clone(homepageDefaults);
  }

  return {
    ...clone(homepageDefaults),
    ...saved,
    hero: { ...homepageDefaults.hero, ...(saved.hero || {}) },
    portfolio: {
      ...homepageDefaults.portfolio,
      ...(saved.portfolio || {}),
    },
    services: {
      ...homepageDefaults.services,
      ...(saved.services || {}),
      items: Array.isArray(saved.services?.items)
        ? saved.services.items
        : clone(homepageDefaults.services.items),
    },
    trainingCta: {
      ...homepageDefaults.trainingCta,
      ...(saved.trainingCta || {}),
    },
  };
}

function Field({ label, value, onChange, multiline = false, hint }) {
  const id = `homepage-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div style={{ marginBottom: 14, minWidth: 0 }}>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      {multiline ? (
        <textarea
          id={id}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
        />
      ) : (
        <input
          id={id}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          style={inputStyle}
        />
      )}
      {hint && (
        <div style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function SectionHeading({ title, description, visible, onToggle }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16,
      marginBottom: 20,
    }}>
      <div>
        <h2 style={{ margin: "0 0 6px", fontSize: 19 }}>{title}</h2>
        <p style={{ margin: 0, color: C.muted, fontSize: 13, lineHeight: 1.5 }}>
          {description}
        </p>
      </div>
      <label style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        fontSize: 12,
        whiteSpace: "nowrap",
        color: C.muted,
      }}>
        <input
          type="checkbox"
          checked={Boolean(visible)}
          onChange={(event) => onToggle(event.target.checked)}
        />
        Show section
      </label>
    </div>
  );
}

export default function HomepageContentAdmin() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("cy_video_admin_token") || ""
  );
  const [password, setPassword] = useState("");
  const [content, setContent] = useState(() => clone(homepageDefaults));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (token) loadContent(token);
    // Load only when the session token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadContent(activeToken) {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminHomepageContent(activeToken);
      setContent(mergeDefaults(data.content));
      setPublished(Boolean(data.is_published));
    } catch (err) {
      setError(err.message || "Could not load homepage content.");
      if (/401|403|expired|authentication|admin token/i.test(err.message || "")) {
        sessionStorage.removeItem("cy_video_admin_token");
        setToken("");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const data = await loginVideoPortfolioAdmin(password);
      sessionStorage.setItem("cy_video_admin_token", data.access_token);
      setPassword("");
      setToken(data.access_token);
      setNotice("Welcome to the Homepage Editor.");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem("cy_video_admin_token");
    setToken("");
    setContent(clone(homepageDefaults));
    setPublished(false);
    setNotice("");
    setError("");
  }

  function update(path, value) {
    setContent((current) => {
      const next = clone(current);
      const keys = path.split(".");
      let target = next;
      for (let i = 0; i < keys.length - 1; i += 1) {
        target = target[keys[i]];
      }
      target[keys[keys.length - 1]] = value;
      return next;
    });
    setNotice("");
  }

  function updateService(index, changes) {
    setContent((current) => {
      const next = clone(current);
      next.services.items[index] = {
        ...next.services.items[index],
        ...changes,
      };
      return next;
    });
    setNotice("");
  }

  function addService() {
    update("services.items", [
      ...content.services.items,
      {
        number: String(content.services.items.length + 1).padStart(2, "0"),
        title: "New service",
        description: "",
        tags: [],
        href: "",
      },
    ]);
  }

  function removeService(index) {
    update(
      "services.items",
      content.services.items.filter((_, i) => i !== index)
    );
  }

  async function handleSave(event) {
    event?.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await saveHomepageDraft(content, token);
      setNotice("Draft saved. Your live homepage has not changed.");
    } catch (err) {
      setError(err.message || "Could not save homepage draft.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!window.confirm("Publish these changes to the live homepage?")) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      await saveHomepageDraft(content, token);
      const result = await publishHomepageContent(token);
      setPublished(Boolean(result.is_published));
      setNotice("Homepage content published successfully.");
    } catch (err) {
      setError(err.message || "Could not publish homepage content.");
    } finally {
      setSaving(false);
    }
  }

  const pageStyle = {
    minHeight: "100vh",
    background: C.bg,
    color: C.text,
    padding: "32px 16px 64px",
    fontFamily: "Inter, system-ui, sans-serif",
  };

  const innerStyle = {
    maxWidth: 960,
    margin: "0 auto",
  };

  if (!token) {
    return (
      <main style={pageStyle}>
        <div style={{ ...cardStyle, maxWidth: 420, margin: "8vh auto" }}>
          <p style={{ color: C.lime, fontSize: 12, letterSpacing: 2 }}>
            CREATOR-YARD
          </p>
          <h1 style={{ marginTop: 0 }}>Homepage CMS</h1>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>
            Sign in with your existing admin password to manage the homepage.
          </p>
          {error && <p role="alert" style={{ color: C.red }}>{error}</p>}
          <form onSubmit={handleLogin}>
            <label htmlFor="homepage-admin-password" style={labelStyle}>
              Admin password
            </label>
            <input
              id="homepage-admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              style={{ ...inputStyle, marginBottom: 16 }}
            />
            <button type="submit" disabled={loading} style={primaryButton}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          {notice && <p style={{ color: C.lime }}>{notice}</p>}
          <p style={{ marginTop: 24 }}>
            <a href="/" style={{ color: C.lime }}>← View homepage</a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={innerStyle}>
        <header style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 28,
        }}>
          <div>
            <p style={{ color: C.lime, fontSize: 12, letterSpacing: 2 }}>
              CREATOR-YARD / CONTENT MANAGEMENT
            </p>
            <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", margin: "8px 0" }}>
              Homepage Editor
            </h1>
            <p style={{ color: C.muted, margin: 0 }}>
              Edit your copy and service cards before publishing.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a href="/" style={{
              ...buttonStyle,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}>
              View homepage
            </a>
            <button onClick={logout} style={buttonStyle}>Log out</button>
          </div>
        </header>

        <div style={{ ...cardStyle, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span style={{ color: C.muted }}>Publication status:</span>
          <strong style={{ color: published ? C.lime : C.muted }}>
            {published ? "Published version exists" : "Not yet published"}
          </strong>
          <span style={{ color: C.muted, fontSize: 12 }}>
            Saving a draft does not update the live page.
          </span>
        </div>

        {error && (
          <div role="alert" style={{ ...cardStyle, color: C.red }}>
            {error}
          </div>
        )}
        {notice && (
          <div role="status" style={{ ...cardStyle, color: C.lime }}>
            {notice}
          </div>
        )}
        {loading && <p style={{ color: C.muted }}>Loading homepage content…</p>}

        <form onSubmit={handleSave}>
          <section style={cardStyle}>
            <SectionHeading
              title="Hero section"
              description="The first message visitors see when they open Creator-Yard."
              visible={content.hero.visible}
              onToggle={(value) => update("hero.visible", value)}
            />
            <Field label="Eyebrow" value={content.hero.eyebrow}
              onChange={(value) => update("hero.eyebrow", value)} />
            <Field label="Main heading" value={content.hero.heading}
              onChange={(value) => update("hero.heading", value)} multiline />
            <Field label="Description" value={content.hero.description}
              onChange={(value) => update("hero.description", value)} multiline />
            <Field label="Primary button label" value={content.hero.primaryButton}
              onChange={(value) => update("hero.primaryButton", value)} />
            <Field label="Secondary button label" value={content.hero.secondaryButton}
              onChange={(value) => update("hero.secondaryButton", value)} />
          </section>

          <section style={cardStyle}>
            <SectionHeading
              title="Portfolio introduction"
              description="Manage the heading and introduction above your work."
              visible={content.portfolio.visible}
              onToggle={(value) => update("portfolio.visible", value)}
            />
            <Field label="Kicker" value={content.portfolio.kicker}
              onChange={(value) => update("portfolio.kicker", value)} />
            <Field label="Heading" value={content.portfolio.heading}
              onChange={(value) => update("portfolio.heading", value)} multiline />
            <Field label="Description" value={content.portfolio.description}
              onChange={(value) => update("portfolio.description", value)} multiline />
            <Field label="Additional note" value={content.portfolio.note}
              onChange={(value) => update("portfolio.note", value)} multiline />
          </section>

          <section style={cardStyle}>
            <SectionHeading
              title="Services"
              description="Edit the service cards displayed on the homepage."
              visible={content.services.visible}
              onToggle={(value) => update("services.visible", value)}
            />

            {content.services.items.map((service, index) => (
              <div key={`service-${index}`} style={{
                background: C.panel2,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: 16,
                marginBottom: 14,
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 14,
                }}>
                  <strong>Service {index + 1}</strong>
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    style={{ ...buttonStyle, color: C.red }}
                  >
                    Remove
                  </button>
                </div>
                <Field label="Number" value={service.number}
                  onChange={(value) => updateService(index, { number: value })} />
                <Field label="Title" value={service.title}
                  onChange={(value) => updateService(index, { title: value })} />
                <Field label="Description" value={service.description}
                  onChange={(value) => updateService(index, { description: value })} multiline />
                <Field
                  label="Tags"
                  value={(service.tags || []).join(", ")}
                  onChange={(value) => updateService(index, {
                    tags: value.split(",").map((tag) => tag.trim()).filter(Boolean),
                  })}
                  hint="Separate tags with commas."
                />
                <Field label="Link path" value={service.href}
                  onChange={(value) => updateService(index, { href: value })}
                  hint="For example: /retail-management. Leave blank if there is no page link."
                />
              </div>
            ))}

            <button type="button" onClick={addService} style={buttonStyle}>
              + Add service
            </button>
          </section>

          <section style={cardStyle}>
            <SectionHeading
              title="Training call-to-action"
              description="Invite visitors to explore practical training."
              visible={content.trainingCta.visible}
              onToggle={(value) => update("trainingCta.visible", value)}
            />
            <Field label="Kicker" value={content.trainingCta.kicker}
              onChange={(value) => update("trainingCta.kicker", value)} />
            <Field label="Heading" value={content.trainingCta.heading}
              onChange={(value) => update("trainingCta.heading", value)} multiline />
            <Field label="Description" value={content.trainingCta.description}
              onChange={(value) => update("trainingCta.description", value)} multiline />
            <Field label="Button label" value={content.trainingCta.buttonLabel}
              onChange={(value) => update("trainingCta.buttonLabel", value)} />
            <Field label="Button link" value={content.trainingCta.buttonHref}
              onChange={(value) => update("trainingCta.buttonHref", value)} />
          </section>

          <div style={{
            position: "sticky",
            bottom: 12,
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            flexWrap: "wrap",
            padding: 12,
            background: "#101211ed",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
          }}>
            <button type="submit" disabled={saving || loading} style={buttonStyle}>
              {saving ? "Working…" : "Save draft"}
            </button>
            <button
              type="button"
              disabled={saving || loading}
              onClick={handlePublish}
              style={primaryButton}
            >
              {saving ? "Working…" : "Publish homepage"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
