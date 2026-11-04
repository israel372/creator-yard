import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import videoProductionDefaults from "../videoProductionDefaults.js";
import {
  getAccountToken,
  logoutUserAccount,
  getAdminVideoProductionContent,
  saveVideoProductionDraft,
  publishVideoProductionContent,
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

function setPath(object, path, value) {
  const result = { ...object };
  const keys = path.split(".");
  let source = object;
  let target = result;

  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    const child = source?.[key];
    target[key] = Array.isArray(child) ? [...child] : { ...(child || {}) };
    source = child;
    target = target[key];
  }

  target[keys[keys.length - 1]] = value;
  return result;
}

function Field({ label, value, onChange, multiline = false, type = "text", hint }) {
  const id = `cms-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
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
          type={type}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          style={inputStyle}
        />
      )}
      {hint && <div style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function SectionHeading({ title, description, visible, onToggle }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
      <div>
        <h2 style={{ margin: "0 0 6px", fontSize: 19 }}>{title}</h2>
        {description && <p style={{ margin: 0, color: C.muted, fontSize: 13, lineHeight: 1.5 }}>{description}</p>}
      </div>
      {typeof visible === "boolean" && (
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, whiteSpace: "nowrap", color: C.muted }}>
          <input type="checkbox" checked={visible} onChange={(event) => onToggle(event.target.checked)} />
          Show section
        </label>
      )}
    </div>
  );
}

function ImagePreview({ url }) {
  if (!url) {
    return <div style={{ background: C.bg, border: `1px dashed ${C.border}`, borderRadius: 8, padding: 22, color: C.muted, fontSize: 12 }}>Add an image URL to preview it here.</div>;
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <img
        src={url}
        alt="Content preview"
        loading="lazy"
        onError={(event) => { event.currentTarget.style.display = "none"; }}
        onLoad={(event) => { event.currentTarget.style.display = "block"; }}
        style={{ width: "100%", maxWidth: 420, maxHeight: 220, objectFit: "cover", borderRadius: 9, border: `1px solid ${C.border}` }}
      />
      <a href={url} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 6, color: C.lime, fontSize: 12 }}>Open image ↗</a>
    </div>
  );
}

export default function VideoProductionContentAdmin() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => getAccountToken() || "");
  const [content, setContent] = useState(() => clone(videoProductionDefaults));
  const [jsonText, setJsonText] = useState("");
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
      const data = await getAdminVideoProductionContent(activeToken);
      const saved = data.content && Object.keys(data.content).length
        ? data.content
        : clone(videoProductionDefaults);
      setContent(saved);
      setJsonText(JSON.stringify(saved, null, 2));
      setPublished(Boolean(data.is_published));
    } catch (err) {
      setError(err.message || "Could not load page content.");
      if (/401|expired|authentication|admin token/i.test(err.message || "")) {
        logoutUserAccount();
        setToken("");
        navigate("/account");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/account");
      return;
    }
    loadContent(token);
  }, [token]);

  function update(path, value) {
    setContent((current) => {
      const next = setPath(current, path, value);
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
    setNotice("");
  }

  function readContent() {
    if (!advanced) return content;
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("The page content must be a JSON object.");
      }
      return parsed;
    } catch (err) {
      if (err instanceof SyntaxError) throw new Error(`Invalid JSON: ${err.message}`);
      throw err;
    }
  }

  async function handleSave(event) {
    event?.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const latest = readContent();
      await saveVideoProductionDraft(latest, token);
      setContent(latest);
      setJsonText(JSON.stringify(latest, null, 2));
      setNotice("Draft saved. It is not live until you publish it.");
      if (advanced) setAdvanced(false);
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
      await saveVideoProductionDraft(latest, token);
      const result = await publishVideoProductionContent(token);
      setContent(latest);
      setJsonText(JSON.stringify(latest, null, 2));
      setPublished(Boolean(result.is_published));
      setNotice("Page content published successfully.");
      if (advanced) setAdvanced(false);
    } catch (err) {
      setError(err.message || "Could not publish page content.");
    } finally {
      setSaving(false);
    }
  }

  function updateListItem(path, index, changes) {
    const list = [...(path.split(".").reduce((value, key) => value?.[key], content) || [])];
    list[index] = { ...list[index], ...changes };
    update(path, list);
  }

  function addListItem(path, template) {
    const list = path.split(".").reduce((value, key) => value?.[key], content) || [];
    update(path, [...list, clone(template)]);
  }

  function removeListItem(path, index) {
    const list = path.split(".").reduce((value, key) => value?.[key], content) || [];
    update(path, list.filter((_, i) => i !== index));
  }

  if (!token) return null;

  const sections = [
    ["hero", "Hero"],
    ["intro", "Introduction"],
    ["showcase", "Video showcase"],
    ["servicesSection", "Services"],
    ["process", "Our process"],
    ["packages", "Packages"],
    ["contact", "Contact"],
  ];

  const simpleFields = {
    hero: [
      ["eyebrow", "Eyebrow"], ["headingLine1", "Heading line 1"], ["headingEmphasis", "Emphasised heading"],
      ["headingLine2", "Heading line 2"], ["headingLine3", "Heading line 3"], ["description", "Description", true],
      ["primaryButton", "Primary button"], ["secondaryButton", "Secondary button"],
      ["processLabel", "Process label"], ["brandLabel", "Brand label"], ["frameLabel", "Frame label"],
    ],
    intro: [
      ["kicker", "Small heading"], ["headingLine1", "Heading line 1"], ["headingLine2", "Heading line 2"],
      ["description", "Description", true], ["linkLabel", "Link label"],
    ],
    showcase: [
      ["kicker", "Small heading"], ["headingLine1", "Heading line 1"], ["headingLine2", "Heading line 2"],
      ["description", "Description", true], ["sampleCategory", "Sample category"],
      ["sampleTitle", "Sample title"], ["sampleDescription", "Sample description"],
      ["sampleVideoUrl", "Video URL"], ["sampleThumbnailUrl", "Thumbnail image URL"],
    ],
    servicesSection: [
      ["kicker", "Small heading"], ["headingLine1", "Heading line 1"], ["headingLine2", "Heading line 2"],
      ["description", "Description", true], ["buttonLabel", "Button label"],
    ],
    process: [
      ["kicker", "Small heading"], ["headingLine1", "Heading line 1"], ["headingLine2", "Heading line 2"],
    ],
    packages: [
      ["kicker", "Small heading"], ["headingLine1", "Heading line 1"], ["headingLine2", "Heading line 2"],
      ["description", "Description", true], ["footnote", "Footnote", true],
    ],
    contact: [
      ["kicker", "Small heading"], ["headingLine1", "Heading line 1"], ["headingLine2", "Heading line 2"],
      ["description", "Description", true], ["whatsappButton", "WhatsApp button label"], ["emailButton", "Email button label"],
    ],
  };

  const currentSection = content[activeSection] || {};
  const fields = simpleFields[activeSection] || [];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Inter, system-ui, sans-serif" }}>
      <aside style={{ width: 225, position: "fixed", inset: "0 auto 0 0", boxSizing: "border-box", background: C.panel, borderRight: `1px solid ${C.border}`, padding: 22, display: "flex", flexDirection: "column", gap: 20, zIndex: 2, overflowY: "auto" }}>
        <div>
          <div style={{ color: C.lime, fontWeight: 900, letterSpacing: 1 }}>CREATOR-YARD</div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>CREATIVE STUDIO · CMS</div>
        </div>
        <div style={{ color: C.muted, fontSize: 11, letterSpacing: 1 }}>PAGE SECTIONS</div>
        {sections.map(([key, label]) => (
          <button key={key} type="button" onClick={() => setActiveSection(key)} style={{ ...buttonStyle, textAlign: "left", borderColor: activeSection === key ? C.lime : C.border, background: activeSection === key ? "#293020" : C.panel2, color: activeSection === key ? C.lime : C.text }}>
            {label}
          </button>
        ))}
        <a href="/video-production" target="_blank" rel="noreferrer" style={{ color: C.text, fontSize: 13, marginTop: 8 }}>Preview public page ↗</a>
        <a href="/admin/video-portfolio" style={{ color: C.text, fontSize: 13 }}>Manage portfolio videos →</a>
        <div style={{ marginTop: "auto", color: C.muted, fontSize: 12 }}>{published ? "A published version exists" : "Not yet published"}
          <a href="/admin/dashboard" style={{ ...buttonStyle, display: "block", width: "100%", boxSizing: "border-box", marginTop: 12, textAlign: "center", textDecoration: "none" }}>Back to dashboard</a>
        </div>
      </aside>

      <main style={{ marginLeft: 225, padding: "28px clamp(16px, 4vw, 44px)", maxWidth: 1450 }}>
        <header style={{ marginBottom: 24 }}>
          <div style={{ color: C.lime, fontSize: 12, letterSpacing: 2 }}>CONTENT MANAGEMENT</div>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 36px)", margin: "8px 0" }}>Video Production Page</h1>
          <p style={{ color: C.muted, lineHeight: 1.7, maxWidth: 800, marginBottom: 0 }}>Edit the public page using fields and previews instead of raw JSON. Save a draft to keep changes private, then publish when you are ready.</p>
        </header>

        {error && <div role="alert" style={{ padding: 13, borderRadius: 8, border: "1px solid #6b3535", background: "#301e1e", color: "#ffb2b2", marginBottom: 18 }}>{error}</div>}
        {notice && <div role="status" style={{ padding: 13, borderRadius: 8, border: "1px solid #455834", background: "#202b1b", color: C.lime, marginBottom: 18 }}>{notice}</div>}

        <form onSubmit={handleSave}>
          <section style={cardStyle}>
            <SectionHeading title={sections.find(([key]) => key === activeSection)?.[1] || "Page section"} description="Changes here update the draft editor. Remember to save or publish when finished." visible={currentSection.visible} onToggle={(value) => update(`${activeSection}.visible`, value)} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 270px), 1fr))", gap: "0 18px" }}>
              {fields.map(([key, label, multiline]) => (
                <div key={key} style={{ gridColumn: multiline ? "1 / -1" : undefined }}>
                  <Field label={label} value={currentSection[key]} multiline={Boolean(multiline)} onChange={(value) => update(`${activeSection}.${key}`, value)} />
                  {activeSection === "showcase" && key === "sampleThumbnailUrl" && <ImagePreview url={currentSection.sampleThumbnailUrl} />}
                </div>
              ))}
            </div>

            {activeSection === "servicesSection" && (
              <div>
                <h3 style={{ marginTop: 26 }}>Service cards</h3>
                {(currentSection.services || []).map((item, index) => (
                  <div key={`${index}-${item.title}`} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <h4 style={{ margin: "0 0 14px" }}>Service {index + 1}</h4>
                      <button type="button" style={buttonStyle} onClick={() => removeListItem("servicesSection.services", index)}>Remove</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))", gap: "0 14px" }}>
                      {["number", "title", "description", "image"].map((key) => (
                        <Field key={key} label={key === "number" ? "Number" : key[0].toUpperCase() + key.slice(1)} value={item[key]} multiline={key === "description"} onChange={(value) => updateListItem("servicesSection.services", index, { [key]: value })} />
                      ))}
                    </div>
                    <ImagePreview url={item.image} />
                    <Field label="Tags (separate with commas)" value={(item.tags || []).join(", ")} onChange={(value) => updateListItem("servicesSection.services", index, { tags: value.split(",").map((tag) => tag.trim()).filter(Boolean) })} />
                  </div>
                ))}
                <button type="button" style={buttonStyle} onClick={() => addListItem("servicesSection.services", { number: String((currentSection.services || []).length + 1).padStart(2, "0"), title: "", description: "", image: "", tags: [] })}>+ Add service</button>
              </div>
            )}

            {activeSection === "process" && (
              <div>
                <h3 style={{ marginTop: 26 }}>Process steps</h3>
                {(currentSection.steps || []).map((item, index) => (
                  <div key={`${index}-${item.title}`} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><h4 style={{ margin: "0 0 14px" }}>Step {index + 1}</h4><button type="button" style={buttonStyle} onClick={() => removeListItem("process.steps", index)}>Remove</button></div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))", gap: "0 14px" }}>
                      {["number", "title", "description"].map((key) => <Field key={key} label={key[0].toUpperCase() + key.slice(1)} value={item[key]} multiline={key === "description"} onChange={(value) => updateListItem("process.steps", index, { [key]: value })} />)}
                    </div>
                  </div>
                ))}
                <button type="button" style={buttonStyle} onClick={() => addListItem("process.steps", { number: String((currentSection.steps || []).length + 1).padStart(2, "0"), title: "", description: "" })}>+ Add step</button>
              </div>
            )}

            {activeSection === "packages" && (
              <div>
                <h3 style={{ marginTop: 26 }}>Packages</h3>
                {(currentSection.items || []).map((item, index) => (
                  <div key={`${index}-${item.title}`} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><h4 style={{ margin: "0 0 14px" }}>Package {index + 1}</h4><button type="button" style={buttonStyle} onClick={() => removeListItem("packages.items", index)}>Remove</button></div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))", gap: "0 14px" }}>
                      {["number", "tier", "title", "description", "buttonLabel"].map((key) => <Field key={key} label={key === "buttonLabel" ? "Button label" : key[0].toUpperCase() + key.slice(1)} value={item[key]} multiline={key === "description"} onChange={(value) => updateListItem("packages.items", index, { [key]: value })} />)}
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, color: C.muted, fontSize: 13 }}><input type="checkbox" checked={Boolean(item.featured)} onChange={(event) => updateListItem("packages.items", index, { featured: event.target.checked })} /> Feature this package</label>
                  </div>
                ))}
                <button type="button" style={buttonStyle} onClick={() => addListItem("packages.items", { number: String((currentSection.items || []).length + 1).padStart(2, "0"), tier: "", title: "", description: "", buttonLabel: "Request a quote", featured: false })}>+ Add package</button>
              </div>
            )}

            {activeSection === "showcase" && (
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginTop: 16 }}>
                <h3>Video preview</h3>
                {currentSection.sampleVideoUrl ? (
                  <video controls preload="metadata" poster={currentSection.sampleThumbnailUrl || undefined} style={{ width: "100%", maxWidth: 640, maxHeight: 360, background: "#000", borderRadius: 10 }}>
                    <source src={currentSection.sampleVideoUrl} />
                    Your browser does not support this video.
                  </video>
                ) : <p style={{ color: C.muted, fontSize: 13 }}>Add a video URL above to preview it.</p>}
              </div>
            )}
          </section>

          <section style={cardStyle}>
            <SectionHeading title="Advanced JSON editor" description="Use this only for fields not exposed in the visual editor. Your latest visual edits are copied here automatically." />
            <button type="button" style={buttonStyle} onClick={() => { setJsonText(JSON.stringify(content, null, 2)); setAdvanced((value) => !value); }}>
              {advanced ? "Close advanced editor" : "Open advanced editor"}
            </button>
            {advanced && (
              <textarea aria-label="Advanced page content JSON" value={jsonText} onChange={(event) => setJsonText(event.target.value)} spellCheck={false} rows={24} style={{ ...inputStyle, marginTop: 16, minHeight: 420, resize: "vertical", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, lineHeight: 1.6 }} />
            )}
          </section>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 40 }}>
            <button type="submit" disabled={saving || loading} style={primaryButton}>{saving ? "Saving…" : "Save draft"}</button>
            <button type="button" disabled={saving || loading} onClick={handlePublish} style={buttonStyle}>{saving ? "Working…" : "Publish page"}</button>
            <button type="button" disabled={loading || saving} onClick={() => loadContent(token)} style={buttonStyle}>{loading ? "Reloading…" : "Reload saved draft"}</button>
          </div>
        </form>
      </main>
    </div>
  );
}
