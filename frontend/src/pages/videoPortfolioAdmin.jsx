
import { useEffect, useMemo, useState } from "react";
import {
  loginVideoPortfolioAdmin,
  getAdminVideos,
  uploadPortfolioVideo,
  createPortfolioVideo,
  updatePortfolioVideo,
  deletePortfolioVideo,
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

const initialForm = {
  title: "",
  description: "",
  category: "Video Production",
  video_url: "",
  thumbnail_url: "",
  sort_order: 0,
  is_published: false,
};

export default function VideoPortfolioAdmin() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("cy_video_admin_token") || ""
  );
  const [password, setPassword] = useState("");
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function loadVideos(activeToken = token) {
    setLoading(true);
    setError("");

    try {
      const data = await getAdminVideos(activeToken);
      setVideos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load videos.");

      if (
        /401|expired|authentication|admin token/i.test(err.message || "")
      ) {
        sessionStorage.removeItem("cy_video_admin_token");
        setToken("");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadVideos(token);
  }, [token]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await loginVideoPortfolioAdmin(password);
      sessionStorage.setItem("cy_video_admin_token", data.access_token);
      setToken(data.access_token);
      setPassword("");
      setNotice("Welcome to your video portfolio.");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem("cy_video_admin_token");
    setToken("");
    setVideos([]);
    setNotice("");
    setError("");
  }

  function changeForm(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      let videoUrl = form.video_url.trim();

      if (videoFile) {
        const uploaded = await uploadPortfolioVideo(videoFile, token);
        videoUrl = uploaded.url;
      }

      if (!videoUrl) {
        throw new Error("Enter a video URL or choose a video file to upload.");
      }

      await createPortfolioVideo(
        {
          ...form,
          video_url: videoUrl,
          thumbnail_url: form.thumbnail_url.trim() || null,
          sort_order: Number(form.sort_order) || 0,
        },
        token
      );

      setForm(initialForm);
      setVideoFile(null);
      setShowForm(false);
      setNotice("Video added successfully.");
      await loadVideos(token);
    } catch (err) {
      setError(err.message || "Could not add video.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(video) {
    setError("");
    setNotice("");

    try {
      await updatePortfolioVideo(
        video.id,
        { is_published: !video.is_published },
        token
      );
      setNotice(
        video.is_published
          ? "Video unpublished."
          : "Video published successfully."
      );
      await loadVideos(token);
    } catch (err) {
      setError(err.message || "Could not update publication status.");
    }
  }

  async function changeOrder(video, value) {
    const order = Number(value);

    if (!Number.isInteger(order) || order < 0 || order === video.sort_order) {
      return;
    }

    try {
      await updatePortfolioVideo(video.id, { sort_order: order }, token);
      setNotice("Display order updated.");
      await loadVideos(token);
    } catch (err) {
      setError(err.message || "Could not update display order.");
    }
  }

  async function removeVideo(video) {
    const confirmed = window.confirm(
      `Delete "${video.title}" from your portfolio? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await deletePortfolioVideo(video.id, token);
      setVideos((current) => current.filter((item) => item.id !== video.id));
      setNotice("Video record deleted.");
    } catch (err) {
      setError(err.message || "Could not delete video.");
    }
  }

  const filteredVideos = useMemo(() => {
    const term = search.trim().toLowerCase();

    return [...videos]
      .filter((video) =>
        `${video.title} ${video.category} ${video.description}`
          .toLowerCase()
          .includes(term)
      )
      .sort(
        (a, b) =>
          (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
          (a.id ?? 0) - (b.id ?? 0)
      );
  }, [videos, search]);

  const publishedCount = videos.filter((video) => video.is_published).length;

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
    padding: "10px 15px",
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
    fontSize: 13,
    color: C.muted,
    marginBottom: 7,
  };

  if (!token) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: C.bg,
          color: C.text,
          display: "grid",
          placeItems: "center",
          padding: 20,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <form
          onSubmit={handleLogin}
          style={{
            width: "100%",
            maxWidth: 420,
            boxSizing: "border-box",
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: 30,
          }}
        >
          <div style={{ color: C.lime, fontWeight: 900, letterSpacing: 2 }}>
            CREATOR-YARD
          </div>
          <p
            style={{
              color: C.muted,
              fontSize: 12,
              letterSpacing: 2,
              marginBottom: 30,
            }}
          >
            VIDEO PORTFOLIO ADMIN
          </p>

          <h1 style={{ fontSize: 28, marginBottom: 8 }}>Welcome back.</h1>
          <p style={{ color: C.muted, marginBottom: 25 }}>
            Sign in to manage your video portfolio.
          </p>

          <label htmlFor="admin-password" style={labelStyle}>
            Admin password
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            maxLength={200}
            style={{ ...inputStyle, marginBottom: 16 }}
          />

          {error && (
            <p role="alert" style={{ color: C.red, fontSize: 13 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ ...primaryButton, width: "100%", padding: 13 }}
          >
            {loading ? "Signing in…" : "Sign in →"}
          </button>

          <p style={{ color: C.muted, fontSize: 12, marginTop: 22 }}>
            Your admin session expires when your token expires or you sign out.
          </p>
        </form>
      </main>
    );
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
          gap: 28,
          zIndex: 2,
        }}
      >
        <div>
          <div style={{ color: C.lime, fontWeight: 900, letterSpacing: 1 }}>
            CREATOR-YARD
          </div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>
            CREATIVE STUDIO
          </div>
        </div>

        <div>
          <div
            style={{
              color: C.muted,
              fontSize: 10,
              letterSpacing: 2,
              marginBottom: 12,
            }}
          >
            WORKSPACE
          </div>
          <div
            style={{
              padding: "12px 10px",
              background: "#293322",
              borderRadius: 8,
              color: C.lime,
              fontWeight: 700,
            }}
          >
            ▦ &nbsp; Video portfolio
          </div>
        </div>

        <div style={{ marginTop: "auto" }}>
          <div
            style={{
              color: C.muted,
              fontSize: 12,
              marginBottom: 12,
              overflowWrap: "anywhere",
            }}
          >
            Local development
          </div>
          <button style={{ ...buttonStyle, width: "100%" }} onClick={logout}>
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
        <header
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 18,
            marginBottom: 30,
          }}
        >
          <div>
            <div style={{ color: C.lime, fontSize: 12, letterSpacing: 2 }}>
              CONTENT MANAGEMENT
            </div>
            <h1 style={{ fontSize: "clamp(26px, 4vw, 36px)", margin: "8px 0" }}>
              Video portfolio
            </h1>
            <p style={{ color: C.muted, margin: 0 }}>
              Manage the work visitors see on your website.
            </p>
          </div>

          <button
            style={primaryButton}
            onClick={() => {
              setShowForm((value) => !value);
              setError("");
            }}
          >
            {showForm ? "Close form ×" : "+ Add new video"}
          </button>
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

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 14,
            marginBottom: 30,
          }}
        >
          {[
            ["Total videos", videos.length],
            ["Published", publishedCount],
            ["Drafts", videos.length - publishedCount],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div style={{ color: C.muted, fontSize: 13 }}>{label}</div>
              <div style={{ fontSize: 30, fontWeight: 800, marginTop: 10 }}>
                {value}
              </div>
            </div>
          ))}
        </section>

        {showForm && (
          <form
            onSubmit={handleCreate}
            style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 24,
              marginBottom: 28,
            }}
          >
            <h2 style={{ marginTop: 0 }}>Add a portfolio video</h2>
            <p style={{ color: C.muted, fontSize: 13 }}>
              Upload an MP4, WebM or QuickTime video, or supply an existing
              video URL. Uploaded files must be within the server's size limit.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                gap: 18,
              }}
            >
              <div>
                <label style={labelStyle} htmlFor="video-title">
                  Video title *
                </label>
                <input
                  id="video-title"
                  name="title"
                  value={form.title}
                  onChange={changeForm}
                  required
                  maxLength={200}
                  style={inputStyle}
                  placeholder="e.g. Brand campaign"
                />
              </div>

              <div>
                <label style={labelStyle} htmlFor="video-category">
                  Category *
                </label>
                <input
                  id="video-category"
                  name="category"
                  value={form.category}
                  onChange={changeForm}
                  required
                  maxLength={100}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle} htmlFor="video-file">
                  Upload video file
                </label>
                <input
                  id="video-file"
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  onChange={(event) =>
                    setVideoFile(event.target.files?.[0] || null)
                  }
                  style={{ ...inputStyle, padding: 9 }}
                />
                {videoFile && (
                  <small style={{ color: C.muted }}>
                    {videoFile.name} ·{" "}
                    {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                  </small>
                )}
              </div>

              <div>
                <label style={labelStyle} htmlFor="video-url">
                  Existing video URL
                </label>
                <input
                  id="video-url"
                  name="video_url"
                  type="url"
                  value={form.video_url}
                  onChange={changeForm}
                  style={inputStyle}
                  placeholder="https://..."
                  disabled={Boolean(videoFile)}
                />
              </div>

              <div>
                <label style={labelStyle} htmlFor="thumbnail-url">
                  Thumbnail image URL (optional)
                </label>
                <input
                  id="thumbnail-url"
                  name="thumbnail_url"
                  type="url"
                  value={form.thumbnail_url}
                  onChange={changeForm}
                  style={inputStyle}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label style={labelStyle} htmlFor="video-order">
                  Display order
                </label>
                <input
                  id="video-order"
                  name="sort_order"
                  type="number"
                  min="0"
                  step="1"
                  value={form.sort_order}
                  onChange={changeForm}
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle} htmlFor="video-description">
                  Description
                </label>
                <textarea
                  id="video-description"
                  name="description"
                  value={form.description}
                  onChange={changeForm}
                  maxLength={10000}
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                  placeholder="Describe the project, client or production…"
                />
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: C.text,
                }}
              >
                <input
                  type="checkbox"
                  name="is_published"
                  checked={form.is_published}
                  onChange={changeForm}
                />
                Publish this video immediately
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button type="submit" style={primaryButton} disabled={saving}>
                {saving ? "Saving video…" : "Save video"}
              </button>
              <button
                type="button"
                style={buttonStyle}
                onClick={() => {
                  setShowForm(false);
                  setForm(initialForm);
                  setVideoFile(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <section
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <h2 style={{ fontSize: 20, margin: 0 }}>Your videos</h2>
          <input
            aria-label="Search videos"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search videos…"
            style={{ ...inputStyle, maxWidth: 280 }}
          />
        </section>

        {loading && <p style={{ color: C.muted }}>Loading portfolio…</p>}

        {!loading && filteredVideos.length === 0 && (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              background: C.panel,
              border: `1px dashed ${C.border}`,
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 32 }}>▧</div>
            <h3>No videos found</h3>
            <p style={{ color: C.muted }}>
              Add your first project to start building the portfolio.
            </p>
          </div>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {filteredVideos.map((video) => (
            <article
              key={video.id}
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 13,
                overflow: "hidden",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  height: 160,
                  background: C.panel2,
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden",
                }}
              >
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div style={{ color: C.lime, fontSize: 40 }}>▶</div>
                )}
              </div>

              <div style={{ padding: 17 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      color: C.lime,
                      fontSize: 11,
                      background: "#293322",
                      padding: "5px 8px",
                      borderRadius: 5,
                    }}
                  >
                    {video.category || "Video Production"}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: video.is_published ? C.lime : C.muted,
                    }}
                  >
                    {video.is_published ? "● Published" : "○ Draft"}
                  </span>
                </div>

                <h3 style={{ margin: "0 0 8px", fontSize: 17 }}>
                  {video.title}
                </h3>

                <p
                  style={{
                    color: C.muted,
                    fontSize: 13,
                    lineHeight: 1.5,
                    minHeight: 39,
                    overflowWrap: "anywhere",
                  }}
                >
                  {video.description || "No description added."}
                </p>

                <label
                  style={{
                    ...labelStyle,
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    marginTop: 15,
                  }}
                >
                  Display order
                  <input
                    aria-label={`Display order for ${video.title}`}
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={video.sort_order ?? 0}
                    onBlur={(event) => changeOrder(video, event.target.value)}
                    style={{ ...inputStyle, width: 85, padding: 7 }}
                  />
                </label>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    style={{ ...primaryButton, flex: 1 }}
                    onClick={() => togglePublished(video)}
                  >
                    {video.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    style={{
                      ...buttonStyle,
                      color: C.red,
                      borderColor: "#654040",
                    }}
                    onClick={() => removeVideo(video)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        <footer
          style={{
            color: C.muted,
            fontSize: 12,
            marginTop: 40,
            borderTop: `1px solid ${C.border}`,
            paddingTop: 18,
          }}
        >
          Creator-Yard · Video Portfolio Management
        </footer>
      </main>
    </div>
  );
}
