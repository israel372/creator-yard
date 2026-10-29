
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
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 13px",
  background: C.bg,
  color: C.text,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  outlineColor: C.lime,
  font: "inherit",
};

const buttonStyle = {
  padding: "11px 16px",
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

export default function VideoProductionContentAdmin() {
  const navigate = useNavigate();

  // Use the same account token as the central Creator Yard login.
  const [token, setToken] = useState(() => getAccountToken());
  const [contentText, setContentText] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [published, setPublished] = useState(false);

  async function loadContent(activeToken = token) {
    if (!activeToken) {
      navigate("/account", { replace: true });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getAdminVideoProductionContent(activeToken);

      const savedContent =
        data.content && Object.keys(data.content).length > 0
          ? data.content
          : videoProductionDefaults;

      setContentText(JSON.stringify(savedContent, null, 2));
      setPublished(Boolean(data.is_published));
    } catch (err) {
      const message = err.message || "Could not load page content.";
      setError(message);

      if (
        /401|unauthorized|expired|authentication|please sign in|invalid.*token|credentials/i.test(
          message
        )
      ) {
        logoutUserAccount();
        setToken("");
        navigate("/account", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/account", { replace: true });
      return;
    }

    loadContent(token);
    // Load the editor when the account token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate]);

  function logout() {
    logoutUserAccount();
    setToken("");
    setContentText("{}");
    setNotice("");
    setError("");
    navigate("/account", { replace: true });
  }

  function parseContent() {
    try {
      const parsed = JSON.parse(contentText);

      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        throw new Error("The page content must be a JSON object.");
      }

      return parsed;
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(`Invalid JSON: ${err.message}`);
      }

      throw err;
    }
  }

  async function handleSave(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const content = parseContent();

      await saveVideoProductionDraft(content, token);

      setNotice("Draft saved. It is not live until you publish it.");

      await loadContent(token);
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
      const content = parseContent();

      // Save the latest editor contents before publishing.
      await saveVideoProductionDraft(content, token);

      const result = await publishVideoProductionContent(token);

      setPublished(Boolean(result.is_published));
      setNotice("Page content published successfully.");
    } catch (err) {
      setError(err.message || "Could not publish page content.");
    } finally {
      setSaving(false);
    }
  }

  // Unauthenticated visitors are sent to the central account login.
  if (!token) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <aside
        style={{
          width: 225,
          position: "fixed",
          inset: "0 auto 0 0",
          boxSizing: "border-box",
          background: C.panel,
          borderRight: `1px solid ${C.border}`,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          zIndex: 2,
        }}
      >
        <div>
          <div
            style={{
              color: C.lime,
              fontWeight: 900,
              letterSpacing: 1,
            }}
          >
            CREATOR-YARD
          </div>

          <div
            style={{
              color: C.muted,
              fontSize: 11,
              marginTop: 6,
            }}
          >
            CREATIVE STUDIO
          </div>
        </div>

        <div
          style={{
            color: C.lime,
            fontWeight: 700,
            lineHeight: 1.8,
          }}
        >
          ▦ &nbsp; Page content editor
        </div>

        <a
          href="/video-production"
          target="_blank"
          rel="noreferrer"
          style={{ color: C.text, fontSize: 13 }}
        >
          Preview public page ↗
        </a>

        <a
          href="/admin/video-portfolio"
          style={{ color: C.text, fontSize: 13 }}
        >
          Manage portfolio videos →
        </a>

        <div style={{ marginTop: "auto" }}>
          <div
            style={{
              color: C.muted,
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            {published
              ? "A published version exists"
              : "Not yet published"}
          </div>

          <button
            type="button"
            style={{ ...buttonStyle, width: "100%" }}
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main
        style={{
          marginLeft: 225,
          padding: "35px clamp(18px, 4vw, 48px)",
          maxWidth: 1500,
        }}
      >
        <header style={{ marginBottom: 28 }}>
          <div
            style={{
              color: C.lime,
              fontSize: 12,
              letterSpacing: 2,
            }}
          >
            CONTENT MANAGEMENT
          </div>

          <h1
            style={{
              fontSize: "clamp(26px, 4vw, 36px)",
              margin: "8px 0",
            }}
          >
            Video Production Page
          </h1>

          <p style={{ color: C.muted, lineHeight: 1.7 }}>
            Edit the page content as JSON. Text, image URLs, buttons,
            services, process steps and packages can be represented in
            this content object. Save a draft before publishing changes
            to visitors.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            style={{
              padding: 13,
              borderRadius: 8,
              border: "1px solid #6b3535",
              background: "#301e1e",
              color: "#ffb2b2",
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            style={{
              padding: 13,
              borderRadius: 8,
              border: "1px solid #455834",
              background: "#202b1b",
              color: C.lime,
              marginBottom: 20,
            }}
          >
            {notice}
          </div>
        )}

        <form onSubmit={handleSave}>
          <section
            style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 20,
              marginBottom: 18,
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: 18 }}>
              Page content JSON
            </h2>

            <p
              style={{
                color: C.muted,
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              Use valid JSON with double-quoted keys and strings. Keep
              a copy of your text before making major edits. The editor
              loads your saved draft, not just the currently published
              version.
            </p>

            <textarea
              aria-label="Video production page content JSON"
              value={contentText}
              onChange={(event) => setContentText(event.target.value)}
              spellCheck={false}
              rows={26}
              style={{
                ...inputStyle,
                minHeight: 480,
                resize: "vertical",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            />
          </section>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 40,
            }}
          >
            <button
              type="submit"
              disabled={saving || loading}
              style={primaryButton}
            >
              {saving ? "Saving…" : "Save draft"}
            </button>

            <button
              type="button"
              disabled={saving || loading}
              onClick={handlePublish}
              style={buttonStyle}
            >
              {saving ? "Working…" : "Publish page"}
            </button>

            <button
              type="button"
              disabled={loading || saving}
              onClick={() => loadContent(token)}
              style={buttonStyle}
            >
              Reload saved draft
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
