import { useEffect, useState } from "react";
import {
  loginVideoPortfolioAdmin,
  getAdminRetailManagementContent,
  saveRetailManagementDraft,
  publishRetailManagementContent,
} from "../api/api";

const TOKEN_KEY = "cy_video_admin_token";

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

const cardStyle = {
  background: C.panel,
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  padding: 20,
  marginBottom: 16,
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  color: C.muted,
  marginBottom: 6,
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const defaults = {
  hero: {
    visible: true,
    eyebrow: "RETAIL MANAGEMENT SYSTEM",
    heading: "Run your shop with confidence.",
    description:
      "A practical retail management and point-of-sale solution for Nigerian businesses.",
    primaryButton: "Get started",
    secondaryButton: "Try the demo",
  },
  benefits: {
    visible: true,
    heading: "Everything you need to manage daily sales",
    items: [
      {
        title: "Point of sale",
        description: "Record sales through a simple checkout workflow.",
      },
      {
        title: "Inventory visibility",
        description: "Review sample stock levels and product information.",
      },
      {
        title: "Sales reporting",
        description: "Present sales information in an easy-to-understand format.",
      },
    ],
  },
  pricing: {
    visible: true,
    heading: "Straightforward pricing",
    softwarePrice: "₦100,000",
    setupPrice: "From ₦50,000",
    devicePrice: "From ₦160,000",
    description:
      "Final setup and device costs depend on your business requirements and device availability.",
  },
  device: {
    visible: true,
    heading: "Retail POS tablet",
    model: "X10PRO Android tablet",
    androidVersion: "Android 10",
    buildVersion: "X10PRO_20250530",
    imageUrl: "",
    description:
      "Ask us about device availability, configuration, installation and support.",
  },
  demo: {
    visible: true,
    heading: "Try the interactive demo",
    description:
      "Explore the sample checkout experience. Demo transactions do not process real payments or update a live store.",
  },
  contact: {
    visible: true,
    heading: "Let's set up your shop",
    description:
      "Tell us about your business and we'll discuss the right setup.",
    whatsappNumber: "2347013415235",
    buttonLabel: "Chat with us on WhatsApp",
  },
};

const sections = [
  ["hero", "Hero"],
  ["benefits", "Features"],
  ["pricing", "Pricing"],
  ["device", "POS device"],
  ["demo", "Interactive demo"],
  ["contact", "Contact"],
];

function Field({ label, value, onChange, multiline = false, hint }) {
  const id = `retail-cms-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div style={{ marginBottom: 14, minWidth: 0 }}>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      {multiline ? (
        <textarea
          id={id}
          value={value ?? ""}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
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
        <p style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>{hint}</p>
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

export default function RetailManagementContentAdmin() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem(TOKEN_KEY) || ""
  );
  const [password, setPassword] = useState("");
  const [content, setContent] = useState(() => clone(defaults));
  const [jsonText, setJsonText] = useState(JSON.stringify(defaults, null, 2));
  const [advanced, setAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [published, setPublished] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  async function loadContent(activeToken = token) {
    setLoading(true);
    setError("");

    try {
      const data = await getAdminRetailManagementContent(activeToken);
      const saved = data.content && Object.keys(data.content).length
        ? data.content
        : clone(defaults);

      setContent(saved);
      setJsonText(JSON.stringify(saved, null, 2));
      setPublished(Boolean(data.is_published));
    } catch (err) {
      setError(err.message || "Could not load retail page content.");

      if (/401|expired|authentication|admin token/i.test(err.message || "")) {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken("");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadContent(token);
  }, [token]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await loginVideoPortfolioAdmin(password);
      sessionStorage.setItem(TOKEN_KEY, data.access_token);
      setToken(data.access_token);
      setPassword("");
      setNotice("Welcome to the Retail Management Page Editor.");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setContent(clone(defaults));
    setJsonText(JSON.stringify(defaults, null, 2));
    setNotice("");
    setError("");
  }

  function update(path, value) {
    setContent((current) => {
      const next = clone(current);
      const keys = path.split(".");
      let target = next;

      for (let i = 0; i < keys.length - 1; i += 1) {
        if (!target[keys[i]] || typeof target[keys[i]] !== "object") {
          target[keys[i]] = {};
        }
        target = target[keys[i]];
      }

      target[keys[keys.length - 1]] = value;
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
    setNotice("");
  }

  function readContent() {
    if (!advanced) return content;

    const parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Page content must be a JSON object.");
    }
    return parsed;
  }

  async function handleSave(event) {
    event?.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const latest = readContent();
      await saveRetailManagementDraft(latest, token);
      setContent(latest);
      setJsonText(JSON.stringify(latest, null, 2));
      setNotice("Draft saved. It is not live until you publish it.");
      setAdvanced(false);
    } catch (err) {
      setError(err.message || "Could not save draft.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const latest = readContent();
      await saveRetailManagementDraft(latest, token);
      const result = await publishRetailManagementContent(token);
      setContent(latest);
      setJsonText(JSON.stringify(latest, null, 2));
      setPublished(Boolean(result.is_published));
      setNotice("Retail Management page published successfully.");
      setAdvanced(false);
    } catch (err) {
      setError(err.message || "Could not publish retail page.");
    } finally {
      setSaving(false);
    }
  }

  if (!token) {
    return (
      <main style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        display: "grid",
        placeItems: "center",
        padding: 20,
        fontFamily: "Inter, system-ui, sans-serif",
      }}>
        <form onSubmit={handleLogin} style={{
          width: "100%",
          maxWidth: 420,
          boxSizing: "border-box",
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 18,
          padding: 30,
        }}>
          <div style={{ color: C.lime, fontWeight: 900, letterSpacing: 2 }}>
            CREATOR-YARD
          </div>
          <p style={{ color: C.muted, fontSize: 12, letterSpacing: 2 }}>
            RETAIL MANAGEMENT CMS
          </p>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>Manage your page.</h1>
          <p style={{ color: C.muted, marginBottom: 25 }}>
            Sign in with your existing admin password.
          </p>
          <label htmlFor="retail-admin-password" style={labelStyle}>
            Admin password
          </label>
          <input
            id="retail-admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            maxLength={200}
            style={{ ...inputStyle, marginBottom: 16 }}
          />
          {error && <p role="alert" style={{ color: C.red, fontSize: 13 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ ...primaryButton, width: "100%", padding: 13 }}>
            {loading ? "Signing in…" : "Sign in →"}
          </button>
        </form>
      </main>
    );
  }

  const currentSection = content[activeSection] || {};

  const simpleFields = {
    hero: [
      ["eyebrow", "Eyebrow"],
      ["heading", "Main heading"],
      ["description", "Description", true],
      ["primaryButton", "Primary button label"],
      ["secondaryButton", "Secondary button label"],
    ],
    benefits: [
      ["heading", "Heading"],
    ],
    pricing: [
      ["heading", "Heading"],
      ["softwarePrice", "Software price"],
      ["setupPrice", "Setup price"],
      ["devicePrice", "Device price"],
      ["description", "Pricing description", true],
    ],
    device: [
      ["heading", "Heading"],
      ["model", "Device model"],
      ["androidVersion", "Android version"],
      ["buildVersion", "Build version"],
      ["imageUrl", "Device image URL"],
      ["description", "Description", true],
    ],
    demo: [
      ["heading", "Heading"],
      ["description", "Demo disclaimer", true],
    ],
    contact: [
      ["heading", "Heading"],
      ["description", "Description", true],
      ["whatsappNumber", "WhatsApp number"],
      ["buttonLabel", "WhatsApp button label"],
    ],
  };

  const fields = simpleFields[activeSection] || [];

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      <aside style={{
        width: 225,
        position: "fixed",
        inset: "0 auto 0 0",
        boxSizing: "border-box",
        background: C.panel,
        borderRight: `1px solid ${C.border}`,
        padding: 22,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        zIndex: 2,
        overflowY: "auto",
      }}>
        <div>
          <div style={{ color: C.lime, fontWeight: 900, letterSpacing: 1 }}>
            CREATOR-YARD
          </div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>
            RETAIL MANAGEMENT CMS
          </div>
        </div>

        <div style={{ color: C.muted, fontSize: 11, letterSpacing: 1, marginTop: 10 }}>
          PAGE SECTIONS
        </div>

        {sections.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveSection(key)}
            style={{
              ...buttonStyle,
              textAlign: "left",
              borderColor: activeSection === key ? C.lime : C.border,
              background: activeSection === key ? "#293020" : C.panel2,
              color: activeSection === key ? C.lime : C.text,
            }}
          >
            {label}
          </button>
        ))}

        <a href="/retail-management" target="_blank" rel="noreferrer" style={{ color: C.text, fontSize: 13, marginTop: 8 }}>
          Preview public page ↗
        </a>

        <div style={{ marginTop: "auto", color: C.muted, fontSize: 12 }}>
          {published ? "A published version exists" : "Not yet published"}
          <button style={{ ...buttonStyle, width: "100%", marginTop: 12 }} onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: 225, padding: "28px clamp(16px, 4vw, 44px)", maxWidth: 1450 }}>
        <header style={{ marginBottom: 24 }}>
          <div style={{ color: C.lime, fontSize: 12, letterSpacing: 2 }}>
            CONTENT MANAGEMENT
          </div>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 36px)", margin: "8px 0" }}>
            Retail Management Page
          </h1>
          <p style={{ color: C.muted, lineHeight: 1.7, maxWidth: 800 }}>
            Edit the public marketing page, save private drafts, and publish when ready.
            The demo POS remains a demonstration and does not process real sales.
          </p>
        </header>

        {error && (
          <div role="alert" style={{ padding: 13, borderRadius: 8, border: "1px solid #6b3535", background: "#301e1e", color: "#ffb2b2", marginBottom: 18 }}>
            {error}
          </div>
        )}
        {notice && (
          <div role="status" style={{ padding: 13, borderRadius: 8, border: "1px solid #455834", background: "#202b1b", color: C.lime, marginBottom: 18 }}>
            {notice}
          </div>
        )}

        <form onSubmit={handleSave}>
          <section style={cardStyle}>
            <SectionHeading
              title={sections.find(([key]) => key === activeSection)?.[1] || "Page section"}
              description="Changes update the draft editor. Save or publish when ready."
              visible={currentSection.visible}
              onToggle={(value) => update(`${activeSection}.visible`, value)}
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 270px), 1fr))", gap: "0 18px" }}>
              {fields.map(([key, label, multiline]) => (
                <div key={key} style={{ gridColumn: multiline ? "1 / -1" : undefined }}>
                  <Field
                    label={label}
                    value={currentSection[key]}
                    multiline={Boolean(multiline)}
                    onChange={(value) => update(`${activeSection}.${key}`, value)}
                  />
                  {activeSection === "device" && key === "imageUrl" && currentSection.imageUrl && (
                    <img
                      src={currentSection.imageUrl}
                      alt="Retail POS device preview"
                      style={{ maxWidth: "100%", width: 320, borderRadius: 10, marginBottom: 14 }}
                      onError={(event) => { event.currentTarget.style.display = "none"; }}
                    />
                  )}
                </div>
              ))}
            </div>

            {activeSection === "benefits" && (
              <div>
                <h3>Feature cards</h3>
                {(currentSection.items || []).map((item, index) => (
                  <div key={`${index}-${item.title}`} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
                    <h4>Feature {index + 1}</h4>
                    <Field
                      label="Title"
                      value={item.title}
                      onChange={(value) => update(`benefits.items.${index}.title`, value)}
                    />
                    <Field
                      label="Description"
                      value={item.description}
                      multiline
                      onChange={(value) => update(`benefits.items.${index}.description`, value)}
                    />
                    <button
                      type="button"
                      style={buttonStyle}
                      onClick={() => update("benefits.items", currentSection.items.filter((_, i) => i !== index))}
                    >
                      Remove feature
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  style={buttonStyle}
                  onClick={() => update("benefits.items", [...(currentSection.items || []), { title: "", description: "" }])}
                >
                  + Add feature
                </button>
              </div>
            )}

            {activeSection === "contact" && (
              <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>
                WhatsApp number should use international digits without a plus sign,
                for example 2347013415235.
              </p>
            )}
          </section>

          <section style={cardStyle}>
            <SectionHeading
              title="Advanced JSON editor"
              description="Edit the complete page content for fields not available in the visual editor."
            />
            <button
              type="button"
              style={buttonStyle}
              onClick={() => {
                setJsonText(JSON.stringify(content, null, 2));
                setAdvanced((value) => !value);
              }}
            >
              {advanced ? "Close advanced editor" : "Open advanced editor"}
            </button>

            {advanced && (
              <textarea
                aria-label="Advanced retail page content JSON"
                value={jsonText}
                onChange={(event) => setJsonText(event.target.value)}
                spellCheck={false}
                rows={24}
                style={{
                  ...inputStyle,
                  marginTop: 16,
                  minHeight: 420,
                  resize: "vertical",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              />
            )}
          </section>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 40 }}>
            <button type="submit" disabled={saving || loading} style={primaryButton}>
              {saving ? "Saving…" : "Save draft"}
            </button>
            <button type="button" disabled={saving || loading} onClick={handlePublish} style={buttonStyle}>
              {saving ? "Working…" : "Publish page"}
            </button>
            <button type="button" disabled={loading || saving} onClick={() => loadContent(token)} style={buttonStyle}>
              {loading ? "Reloading…" : "Reload saved draft"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
