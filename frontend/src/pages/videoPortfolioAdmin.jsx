
import { useEffect, useMemo, useState } from "react";
import {
  getAccountToken,
  getAdminVideos,
  uploadPortfolioVideo,
  createPortfolioVideo,
  updatePortfolioVideo,
  deletePortfolioVideo,
} from "../api/api";
import "./videoPortfolioAdmin.css";

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
  const [token] = useState(() => getAccountToken());
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function loadVideos() {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const data = await getAdminVideos(token);
      setVideos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.message ||
          "Could not load videos. Check your account permissions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadVideos();
    }
  }, [token]);

  function goToDashboard() {
    window.location.href = "/admin/dashboard";
  }

  function goToAccount() {
    window.location.href = "/account";
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
        throw new Error(
          "Enter a video URL or choose a video file to upload."
        );
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

      await loadVideos();
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

      await loadVideos();
    } catch (err) {
      setError(
        err.message || "Could not update publication status."
      );
    }
  }

  async function changeOrder(video, value) {
    const order = Number(value);

    if (
      !Number.isInteger(order) ||
      order < 0 ||
      order === Number(video.sort_order ?? 0)
    ) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await updatePortfolioVideo(
        video.id,
        { sort_order: order },
        token
      );

      setNotice("Display order updated.");
      await loadVideos();
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

      setVideos((current) =>
        current.filter((item) => item.id !== video.id)
      );

      setNotice("Video record deleted.");
    } catch (err) {
      setError(err.message || "Could not delete video.");
    }
  }

  const filteredVideos = useMemo(() => {
    const term = search.trim().toLowerCase();

    return [...videos]
      .filter((video) =>
        `${video.title || ""} ${video.category || ""} ${
          video.description || ""
        }`
          .toLowerCase()
          .includes(term)
      )
      .sort(
        (a, b) =>
          (Number(a.sort_order) || 0) -
            (Number(b.sort_order) || 0) ||
          (Number(a.id) || 0) - (Number(b.id) || 0)
      );
  }, [videos, search]);

  const publishedCount = videos.filter(
    (video) => video.is_published
  ).length;

  if (!token) {
    return (
      <main className="video-admin video-admin--auth">
        <section className="video-admin__auth-card">
          <div className="video-admin__brand">
            CREATOR-YARD
          </div>

          <p className="video-admin__eyebrow">
            VIDEO PORTFOLIO ADMIN
          </p>

          <h1>Account sign-in required</h1>

          <p className="video-admin__muted">
            Sign in with your approved Creator Yard owner, manager,
            or staff account. Your account must have permission to
            manage the video portfolio.
          </p>

          <button
            type="button"
            className="video-admin__button video-admin__button--primary video-admin__button--full"
            onClick={goToAccount}
          >
            Go to account sign in →
          </button>

          <button
            type="button"
            className="video-admin__text-button"
            onClick={goToDashboard}
          >
            Back to dashboard
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className="video-admin">
      <aside className="video-admin__sidebar">
        <div>
          <div className="video-admin__brand">
            CREATOR-YARD
          </div>

          <div className="video-admin__studio-label">
            CREATIVE STUDIO
          </div>
        </div>

        <nav className="video-admin__navigation">
          <span className="video-admin__navigation-label">
            WORKSPACE
          </span>

          <div className="video-admin__navigation-item video-admin__navigation-item--active">
            <span aria-hidden="true">▦</span>
            Video portfolio
          </div>
        </nav>

        <div className="video-admin__sidebar-bottom">
          <p className="video-admin__muted video-admin__sidebar-note">
            Central Creator Yard account
          </p>

          <button
            type="button"
            className="video-admin__button video-admin__button--full"
            onClick={goToDashboard}
          >
            Back to dashboard
          </button>
        </div>
      </aside>

      <main className="video-admin__content">
        <header className="video-admin__header">
          <div>
            <p className="video-admin__eyebrow">
              CONTENT MANAGEMENT
            </p>

            <h1>Video portfolio</h1>

            <p className="video-admin__muted">
              Manage the work visitors see on your website.
            </p>
          </div>

          <button
            type="button"
            className="video-admin__button video-admin__button--primary"
            onClick={() => {
              setShowForm((current) => !current);
              setError("");
              setNotice("");
            }}
          >
            {showForm ? "Close form ×" : "+ Add new video"}
          </button>
        </header>

        {error && (
          <div className="video-admin__alert video-admin__alert--error" role="alert">
            {error}
          </div>
        )}

        {notice && (
          <div className="video-admin__alert video-admin__alert--success" role="status">
            {notice}
          </div>
        )}

        <section className="video-admin__stats">
          <article className="video-admin__stat-card">
            <span>Total videos</span>
            <strong>{videos.length}</strong>
          </article>

          <article className="video-admin__stat-card">
            <span>Published</span>
            <strong>{publishedCount}</strong>
          </article>

          <article className="video-admin__stat-card">
            <span>Drafts</span>
            <strong>{videos.length - publishedCount}</strong>
          </article>
        </section>

        {showForm && (
          <form
            className="video-admin__form-card"
            onSubmit={handleCreate}
          >
            <h2>Add a portfolio video</h2>

            <p className="video-admin__muted video-admin__form-description">
              Upload an MP4, WebM or QuickTime video, or supply an
              existing video URL. Uploaded files must be within the
              server's size limit.
            </p>

            <div className="video-admin__form-grid">
              <div className="video-admin__field">
                <label htmlFor="video-title">Video title *</label>
                <input
                  id="video-title"
                  name="title"
                  value={form.title}
                  onChange={changeForm}
                  required
                  maxLength={200}
                  placeholder="e.g. Brand campaign"
                />
              </div>

              <div className="video-admin__field">
                <label htmlFor="video-category">Category *</label>
                <input
                  id="video-category"
                  name="category"
                  value={form.category}
                  onChange={changeForm}
                  required
                  maxLength={100}
                />
              </div>

              <div className="video-admin__field">
                <label htmlFor="video-file">Upload video file</label>
                <input
                  id="video-file"
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  onChange={(event) =>
                    setVideoFile(event.target.files?.[0] || null)
                  }
                />

                {videoFile && (
                  <small className="video-admin__file-info">
                    {videoFile.name} ·{" "}
                    {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                  </small>
                )}
              </div>

              <div className="video-admin__field">
                <label htmlFor="video-url">Existing video URL</label>
                <input
                  id="video-url"
                  name="video_url"
                  type="url"
                  value={form.video_url}
                  onChange={changeForm}
                  placeholder="https://..."
                  disabled={Boolean(videoFile)}
                />
              </div>

              <div className="video-admin__field">
                <label htmlFor="thumbnail-url">
                  Thumbnail image URL (optional)
                </label>
                <input
                  id="thumbnail-url"
                  name="thumbnail_url"
                  type="url"
                  value={form.thumbnail_url}
                  onChange={changeForm}
                  placeholder="https://..."
                />
              </div>

              <div className="video-admin__field">
                <label htmlFor="video-order">Display order</label>
                <input
                  id="video-order"
                  name="sort_order"
                  type="number"
                  min="0"
                  step="1"
                  value={form.sort_order}
                  onChange={changeForm}
                />
              </div>

              <div className="video-admin__field video-admin__field--full">
                <label htmlFor="video-description">Description</label>
                <textarea
                  id="video-description"
                  name="description"
                  value={form.description}
                  onChange={changeForm}
                  maxLength={10000}
                  rows={4}
                  placeholder="Describe the project, client or production…"
                />
              </div>

              <label className="video-admin__checkbox">
                <input
                  type="checkbox"
                  name="is_published"
                  checked={form.is_published}
                  onChange={changeForm}
                />
                <span>Publish this video immediately</span>
              </label>
            </div>

            <div className="video-admin__form-actions">
              <button
                type="submit"
                className="video-admin__button video-admin__button--primary"
                disabled={saving}
              >
                {saving ? "Saving video…" : "Save video"}
              </button>

              <button
                type="button"
                className="video-admin__button"
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

        <section className="video-admin__list-header">
          <h2>Your videos</h2>

          <input
            className="video-admin__search"
            aria-label="Search videos"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search videos…"
          />
        </section>

        {loading && (
          <p className="video-admin__muted">Loading portfolio…</p>
        )}

        {!loading && filteredVideos.length === 0 && (
          <div className="video-admin__empty">
            <div className="video-admin__empty-icon" aria-hidden="true">
              ▧
            </div>

            <h3>No videos found</h3>

            <p className="video-admin__muted">
              {search.trim()
                ? "Try another search term."
                : "Add your first project to start building the portfolio."}
            </p>
          </div>
        )}

        <section className="video-admin__video-grid">
          {filteredVideos.map((video) => (
            <article className="video-admin__video-card" key={video.id}>
              <div className="video-admin__thumbnail">
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt="" />
                ) : (
                  <span aria-hidden="true">▶</span>
                )}
              </div>

              <div className="video-admin__video-details">
                <div className="video-admin__video-meta">
                  <span className="video-admin__category">
                    {video.category || "Video Production"}
                  </span>

                  <span
                    className={
                      video.is_published
                        ? "video-admin__publish-status video-admin__publish-status--published"
                        : "video-admin__publish-status"
                    }
                  >
                    {video.is_published ? "● Published" : "○ Draft"}
                  </span>
                </div>

                <h3>{video.title}</h3>

                <p className="video-admin__video-description">
                  {video.description || "No description added."}
                </p>

                <label className="video-admin__order-control">
                  <span>Display order</span>

                  <input
                    aria-label={`Display order for ${video.title}`}
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={video.sort_order ?? 0}
                    onBlur={(event) =>
                      changeOrder(video, event.target.value)
                    }
                  />
                </label>

                <div className="video-admin__video-actions">
                  <button
                    type="button"
                    className="video-admin__button video-admin__button--primary video-admin__button--grow"
                    onClick={() => togglePublished(video)}
                  >
                    {video.is_published ? "Unpublish" : "Publish"}
                  </button>

                  <button
                    type="button"
                    className="video-admin__button video-admin__button--danger"
                    onClick={() => removeVideo(video)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        <footer className="video-admin__footer">
          Creator-Yard · Video Portfolio Management
        </footer>
      </main>
    </div>
  );
}
