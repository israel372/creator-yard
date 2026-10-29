
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCurrentUserAccount,
  getManagedAccounts,
  getPendingAccounts,
  updateManagedAccount,
  logoutUserAccount,
} from "../api/api";
import "./accounts.css";

const PERMISSIONS = [
  ["manage_clients", "Manage client brands", "Control client brand details and listings."],
  ["manage_products", "Manage products", "Create and manage products."],
  ["manage_profile", "Edit business profile", "Update the public business profile."],
  ["manage_reviews", "Manage reviews", "Manage customer reviews."],
  ["manage_video_portfolio", "Manage video portfolio", "Manage video work and portfolio entries."],
  ["manage_video_content", "Manage video-production content", "Manage video-production content."],
  ["manage_homepage_content", "Manage homepage content", "Edit and publish the homepage."],
  ["manage_retail_content", "Manage retail management page", "Edit and publish the retail management page."],
  ["view_reports", "View reports", "Access available business reports."],
];

function readableDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function readableDateTime(value) {
  if (!value) return "No login recorded";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function errorMessage(error) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function initials(name) {
  return (name || "User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function normaliseAccount(account) {
  return {
    role: account.role === "manager" ? "manager" : "staff",
    status: account.status || "pending",
    permissions: Object.fromEntries(
      PERMISSIONS.map(([key]) => [key, account.permissions?.[key] === true])
    ),
  };
}

export default function Accounts() {
  const navigate = useNavigate();

  const [owner, setOwner] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [pending, setPending] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const current = await getCurrentUserAccount();
      const user = current.user || current.account || current;

      if (user.role !== "owner") {
        navigate("/account", { replace: true });
        return;
      }

      const [allResult, pendingResult] = await Promise.all([
        getManagedAccounts(),
        getPendingAccounts(),
      ]);

      const all = Array.isArray(allResult.accounts) ? allResult.accounts : [];
      const waiting = Array.isArray(pendingResult.accounts)
        ? pendingResult.accounts
        : [];

      setOwner(user);
      setAccounts(all);
      setPending(waiting);

      setDrafts((previous) => {
        const nextDrafts = {};

        for (const account of all) {
          // Keep unsaved edits while refreshing; otherwise use the server values.
          nextDrafts[account.id] =
            previous[account.id] || normaliseAccount(account);
        }

        for (const account of waiting) {
          if (!nextDrafts[account.id]) {
            nextDrafts[account.id] =
              previous[account.id] || normaliseAccount(account);
          }
        }

        return nextDrafts;
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  function changeDraft(id, field, value) {
    setDrafts((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        [field]: value,
      },
    }));
  }

  function changePermission(id, key, checked) {
    setDrafts((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        permissions: {
          ...previous[id]?.permissions,
          [key]: checked,
        },
      },
    }));
  }

  async function saveAccount(id, overrides = {}) {
    const draft = drafts[id];
    if (!draft) return;

    setSavingId(id);
    setError("");
    setNotice("");

    try {
      await updateManagedAccount(id, {
        role: overrides.role ?? draft.role,
        status: overrides.status ?? draft.status,
        permissions: draft.permissions,
      });

      setNotice(
        overrides.status === "approved"
          ? "Account approved successfully."
          : overrides.status === "rejected"
            ? "Registration rejected."
            : "Account access updated successfully."
      );

      await loadAccounts();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSavingId(null);
    }
  }

  function signOut() {
    logoutUserAccount();
    navigate("/account", { replace: true });
  }

  const approvedCount = useMemo(
    () => accounts.filter((account) => account.status === "approved").length,
    [accounts]
  );

  const managerCount = useMemo(
    () => accounts.filter((account) => account.role === "manager").length,
    [accounts]
  );

  const visiblePending = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pending;

    return pending.filter((account) =>
      [account.full_name, account.email, account.phone]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [pending, search]);

  const visibleAccounts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return accounts;

    return accounts.filter((account) =>
      [account.full_name, account.email, account.phone, account.role, account.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [accounts, search]);

  return (
    <div className="cy-admin-shell">
      <aside className="cy-admin-sidebar">
        <button
          type="button"
          className="cy-admin-brand"
          onClick={() => navigate("/")}
          aria-label="Creator Yard home"
        >
          <span className="cy-admin-brand-mark">CY</span>
          <span className="cy-admin-brand-copy">
            <strong>CREATOR YARD</strong>
            <small>CREATIVE STUDIO</small>
          </span>
        </button>

        <div className="cy-admin-sidebar-label">WORKSPACE</div>

        <nav className="cy-admin-nav" aria-label="Admin navigation">
          <button
            type="button"
            className="cy-admin-nav-item"
            onClick={() => navigate("/")}
          >
            <span className="cy-admin-nav-icon">⌂</span>
            <span>Website home</span>
            <span className="cy-admin-nav-arrow">↗</span>
          </button>

          <button
            type="button"
            className="cy-admin-nav-item active"
            onClick={() => navigate("/admin/accounts")}
            aria-current="page"
          >
            <span className="cy-admin-nav-icon">▦</span>
            <span>Account access</span>
          </button>
        </nav>

        <div className="cy-admin-sidebar-spacer" />

        <div className="cy-admin-security-card">
          <span className="cy-admin-security-icon">✦</span>
          <strong>Access control</strong>
          <p>Keep your workspace secure by giving each account only the access it needs.</p>
        </div>

        <div className="cy-admin-sidebar-footer">
          <span className="cy-admin-online-dot" />
          <span>Local admin workspace</span>
        </div>
      </aside>

      <main className="cy-admin-main">
        <header className="cy-admin-topbar">
          <div className="cy-admin-breadcrumb">
            <span>Workspace</span>
            <span className="cy-admin-breadcrumb-separator">/</span>
            <strong>Account management</strong>
          </div>

          <div className="cy-admin-topbar-user">
            <div className="cy-admin-owner-avatar">
              {initials(owner?.full_name)}
            </div>
            <div className="cy-admin-owner-info">
              <strong>{owner?.full_name || "Workspace owner"}</strong>
              <span>Owner account</span>
            </div>
            <button
              type="button"
              className="cy-admin-signout"
              onClick={signOut}
            >
              Sign out <span aria-hidden="true">↗</span>
            </button>
          </div>
        </header>

        <div className="cy-admin-content">
          <section className="cy-admin-page-heading">
            <div>
              <div className="cy-admin-eyebrow">
                <span className="cy-admin-eyebrow-line" />
                ADMINISTRATION
              </div>
              <h1>Account management</h1>
              <p>
                Manage your team, review new registrations, and control access
                across Creator Yard.
              </p>
            </div>

            <button
              type="button"
              className="cy-admin-button cy-admin-button-light"
              onClick={loadAccounts}
              disabled={loading}
            >
              <span className={loading ? "cy-admin-refresh-icon spinning" : "cy-admin-refresh-icon"}>
                ↻
              </span>
              {loading ? "Refreshing…" : "Refresh data"}
            </button>
          </section>

          {error && (
            <div className="cy-admin-alert cy-admin-alert-error" role="alert">
              <span className="cy-admin-alert-symbol">!</span>
              <div>
                <strong>Something needs your attention</strong>
                <p>{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {notice && (
            <div className="cy-admin-alert cy-admin-alert-success" role="status">
              <span className="cy-admin-alert-symbol">✓</span>
              <div>
                <strong>Changes saved</strong>
                <p>{notice}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          )}

          <section className="cy-admin-stats" aria-label="Account summary">
            <article className="cy-admin-stat-card">
              <div className="cy-admin-stat-top">
                <span className="cy-admin-stat-label">Total accounts</span>
                <span className="cy-admin-stat-icon stat-purple">▦</span>
              </div>
              <div className="cy-admin-stat-value">
                {loading ? "—" : accounts.length}
              </div>
              <div className="cy-admin-stat-foot">
                <span className="cy-admin-stat-dot purple-dot" />
                All registered accounts
              </div>
            </article>

            <article className="cy-admin-stat-card">
              <div className="cy-admin-stat-top">
                <span className="cy-admin-stat-label">Awaiting approval</span>
                <span className="cy-admin-stat-icon stat-amber">◷</span>
              </div>
              <div className="cy-admin-stat-value">
                {loading ? "—" : pending.length}
              </div>
              <div className="cy-admin-stat-foot">
                <span className="cy-admin-stat-dot amber-dot" />
                Requires your review
              </div>
            </article>

            <article className="cy-admin-stat-card">
              <div className="cy-admin-stat-top">
                <span className="cy-admin-stat-label">Approved accounts</span>
                <span className="cy-admin-stat-icon stat-green">✓</span>
              </div>
              <div className="cy-admin-stat-value">
                {loading ? "—" : approvedCount}
              </div>
              <div className="cy-admin-stat-foot">
                <span className="cy-admin-stat-dot green-dot" />
                Approved for access
              </div>
            </article>

            <article className="cy-admin-stat-card">
              <div className="cy-admin-stat-top">
                <span className="cy-admin-stat-label">Managers</span>
                <span className="cy-admin-stat-icon stat-blue">♙</span>
              </div>
              <div className="cy-admin-stat-value">
                {loading ? "—" : managerCount}
              </div>
              <div className="cy-admin-stat-foot">
                <span className="cy-admin-stat-dot blue-dot" />
                Assigned manager role
              </div>
            </article>
          </section>

          <section className="cy-admin-management-panel">
            <div className="cy-admin-panel-heading">
              <div>
                <h2>Team access</h2>
                <p>Review registrations and configure account permissions.</p>
              </div>
              <div className="cy-admin-panel-secure">
                <span>⌑</span> Owner-only controls
              </div>
            </div>

            <div className="cy-admin-toolbar">
              <div className="cy-admin-tabs" role="tablist" aria-label="Account views">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "pending"}
                  className={activeTab === "pending" ? "cy-admin-tab active" : "cy-admin-tab"}
                  onClick={() => setActiveTab("pending")}
                >
                  Pending approvals
                  <span className={pending.length ? "cy-admin-tab-count has-items" : "cy-admin-tab-count"}>
                    {pending.length}
                  </span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "all"}
                  className={activeTab === "all" ? "cy-admin-tab active" : "cy-admin-tab"}
                  onClick={() => setActiveTab("all")}
                >
                  All accounts
                  <span className="cy-admin-tab-count">{accounts.length}</span>
                </button>
              </div>

              <label className="cy-admin-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, email or phone"
                  aria-label="Search accounts"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </label>
            </div>

            {loading ? (
              <div className="cy-admin-loading">
                <span className="cy-admin-spinner" />
                <strong>Loading your workspace</strong>
                <p>Getting the latest account information…</p>
              </div>
            ) : activeTab === "pending" ? (
              <div className="cy-admin-list-area">
                <div className="cy-admin-list-caption">
                  <span>
                    {visiblePending.length} registration
                    {visiblePending.length === 1 ? "" : "s"} to review
                  </span>
                  <span>New accounts have no protected access until approved.</span>
                </div>

                {visiblePending.length === 0 ? (
                  <div className="cy-admin-empty-state">
                    <div className="cy-admin-empty-icon">✓</div>
                    <h3>{search ? "No matching registrations" : "You're all caught up"}</h3>
                    <p>
                      {search
                        ? "Try another name, email address or phone number."
                        : "There are no pending registrations to review right now."}
                    </p>
                    {search && (
                      <button
                        type="button"
                        className="cy-admin-text-button"
                        onClick={() => setSearch("")}
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="cy-admin-account-list">
                    {visiblePending.map((account) => {
                      const draft = drafts[account.id] || normaliseAccount(account);
                      const isSaving = savingId === account.id;

                      return (
                        <article
                          className="cy-admin-account-card cy-admin-pending-card"
                          key={account.id}
                        >
                          <div className="cy-admin-account-identity">
                            <div className="cy-admin-person-avatar">
                              {initials(account.full_name)}
                            </div>
                            <div className="cy-admin-person-copy">
                              <div className="cy-admin-person-title">
                                <h3>{account.full_name || "Unnamed user"}</h3>
                                <span className="cy-admin-status status-pending">
                                  Pending review
                                </span>
                              </div>
                              <p>{account.email || "No email provided"}</p>
                              <p>{account.phone || "No phone provided"}</p>
                              <span className="cy-admin-created-date">
                                Registered {readableDate(account.created_at)}
                              </span>
                            </div>
                          </div>

                          <div className="cy-admin-pending-controls">
                            <label className="cy-admin-field">
                              <span>Assign initial role</span>
                              <select
                                value={draft.role}
                                onChange={(event) =>
                                  changeDraft(account.id, "role", event.target.value)
                                }
                              >
                                <option value="staff">Staff</option>
                                <option value="manager">Manager</option>
                              </select>
                            </label>

                            <div className="cy-admin-review-actions">
                              <button
                                type="button"
                                className="cy-admin-button cy-admin-button-primary"
                                disabled={isSaving}
                                onClick={() =>
                                  saveAccount(account.id, { status: "approved" })
                                }
                              >
                                {isSaving ? "Saving…" : "✓ Approve account"}
                              </button>
                              <button
                                type="button"
                                className="cy-admin-button cy-admin-button-danger-outline"
                                disabled={isSaving}
                                onClick={() =>
                                  saveAccount(account.id, { status: "rejected" })
                                }
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="cy-admin-list-area">
                <div className="cy-admin-list-caption">
                  <span>
                    Showing {visibleAccounts.length} of {accounts.length} accounts
                  </span>
                  <span>Changes apply when you select Save access.</span>
                </div>

                {visibleAccounts.length === 0 ? (
                  <div className="cy-admin-empty-state">
                    <div className="cy-admin-empty-icon">⌕</div>
                    <h3>{search ? "No matching accounts" : "No accounts found"}</h3>
                    <p>
                      {search
                        ? "Try searching with a different name, email, role or status."
                        : "Accounts will appear here when they are registered."}
                    </p>
                  </div>
                ) : (
                  <div className="cy-admin-account-list">
                    {visibleAccounts.map((account) => {
                      const draft = drafts[account.id];
                      const isOwner = account.role === "owner";
                      const isSaving = savingId === account.id;

                      return (
                        <article className="cy-admin-account-card" key={account.id}>
                          <div className="cy-admin-account-identity">
                            <div
                              className={
                                isOwner
                                  ? "cy-admin-person-avatar owner-avatar"
                                  : "cy-admin-person-avatar"
                              }
                            >
                              {initials(account.full_name)}
                            </div>
                            <div className="cy-admin-person-copy">
                              <div className="cy-admin-person-title">
                                <h3>{account.full_name || "Unnamed user"}</h3>
                                <span
                                  className={`cy-admin-status status-${account.status || "pending"}`}
                                >
                                  {account.status || "pending"}
                                </span>
                              </div>
                              <p>{account.email || "No email provided"}</p>
                              <p>{account.phone || "No phone provided"}</p>
                              <span className="cy-admin-created-date">
                                Created {readableDate(account.created_at)}
                              </span>
                              <span className="cy-admin-last-login">
                                Last login: {readableDateTime(account.last_login_at)}
                              </span>
                              {isOwner && (
                                <div className="cy-admin-owner-protected">
                                  <span>♙</span>
                                  Owner account — protected from changes
                                </div>
                              )}
                            </div>
                          </div>

                          {!isOwner && draft && (
                            <div className="cy-admin-account-configuration">
                              <div className="cy-admin-field-row">
                                <label className="cy-admin-field">
                                  <span>Account role</span>
                                  <select
                                    value={draft.role}
                                    onChange={(event) =>
                                      changeDraft(account.id, "role", event.target.value)
                                    }
                                  >
                                    <option value="staff">Staff</option>
                                    <option value="manager">Manager</option>
                                  </select>
                                </label>

                                <label className="cy-admin-field">
                                  <span>Account status</span>
                                  <select
                                    value={draft.status}
                                    onChange={(event) =>
                                      changeDraft(account.id, "status", event.target.value)
                                    }
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="suspended">Suspended</option>
                                  </select>
                                </label>
                              </div>

                              {draft.status === "pending" && (
                                <p className="cy-admin-inline-hint">
                                  Pending accounts cannot access protected features.
                                  Approve the account to grant access.
                                </p>
                              )}

                              <details className="cy-admin-permissions-details">
                                <summary>
                                  <span className="cy-admin-permissions-summary-copy">
                                    <strong>Permissions</strong>
                                    <small>
                                      {PERMISSIONS.filter(
                                        ([key]) => draft.permissions[key] === true
                                      ).length}{" "}
                                      of {PERMISSIONS.length} permissions enabled
                                    </small>
                                  </span>
                                  <span className="cy-admin-details-toggle">＋</span>
                                </summary>

                                <fieldset className="cy-admin-permission-grid">
                                  <legend className="cy-admin-visually-hidden">
                                    Account permissions
                                  </legend>
                                  {PERMISSIONS.map(([key, label, description]) => (
                                    <label
                                      className="cy-admin-permission-option"
                                      key={key}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={draft.permissions[key] === true}
                                        onChange={(event) =>
                                          changePermission(
                                            account.id,
                                            key,
                                            event.target.checked
                                          )
                                        }
                                      />
                                      <span className="cy-admin-custom-checkbox">
                                        <span>✓</span>
                                      </span>
                                      <span className="cy-admin-permission-copy">
                                        <strong>{label}</strong>
                                        <small>{description}</small>
                                      </span>
                                    </label>
                                  ))}
                                </fieldset>
                              </details>

                              <div className="cy-admin-save-row">
                                <span className="cy-admin-save-note">
                                  Access changes are not active until saved.
                                </span>
                                <button
                                  type="button"
                                  className="cy-admin-button cy-admin-button-primary"
                                  disabled={isSaving || draft.status === "pending"}
                                  onClick={() => saveAccount(account.id)}
                                >
                                  {isSaving ? "Saving changes…" : "Save access"}
                                  {!isSaving && <span aria-hidden="true">→</span>}
                                </button>
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>

          <footer className="cy-admin-page-footer">
            <span>CREATOR YARD <span className="cy-admin-footer-dot">·</span> ADMIN WORKSPACE</span>
            <span>Account access is managed by the workspace owner.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

