
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "./dashboard.css";

import {
  PROFILE_TOKEN,
  getProfile,
  saveProfile,
  uploadLogo,
  uploadProductImage,
  createProduct,
  getProducts,
  deleteProduct,
  updateProduct,
  getUploadUrl,
  getCurrentUserAccount,
  getAccountToken,
} from "../../api/api";

const EMPTY_PROFILE = {
  store_name: "Creator-Yard",
  logo_type: "both",
  logo: "",
  facebook: "",
  instagram: "",
  tiktok: "",
  twitter: "",
  whatsapp: "",
  email: "",
  phone: "",
  address: "",
  ceo_name: "",
  tagline: "",
  description: "",
};

const EMPTY_BRAND = {
  name: "",
  link: "",
  description: "",
  image: "",
};

function getAccountObject(result) {
  return (
    result?.user ??
    result?.account ??
    result?.data?.user ??
    result?.data ??
    result ??
    null
  );
}

function getAccountName(user) {
  return (
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    user?.display_name ||
    user?.email ||
    ""
  );
}

function getAccountRole(user) {
  const role = user?.role || user?.account_role || user?.access_level || "";

  if (!role) return "Team member";

  return String(role)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.length
    ? parts.map((part) => part[0]).join("").toUpperCase()
    : "CY";
}

function normalizeUrl(value) {
  const trimmed = String(value || "").trim();

  if (!trimmed) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;

  return `https://${trimmed}`;
}

function getErrorMessage(error, fallback) {
  if (error instanceof Error && error.message) {
    return `${fallback} ${error.message}`;
  }

  return fallback;
}

function Dashboard() {
  const { profileToken } = useParams();
  const navigate = useNavigate();

  // A profile-token route is public. The central admin dashboard requires login.
  const isAdminDashboard = !profileToken;
  const token = profileToken || PROFILE_TOKEN;

  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [brands, setBrands] = useState([]);
  const [brandForm, setBrandForm] = useState(EMPTY_BRAND);

  const [currentUser, setCurrentUser] = useState(null);
  const [accountLoading, setAccountLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBrandImage, setUploadingBrandImage] = useState(false);

  const [editingBrandId, setEditingBrandId] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Protect /admin/dashboard using the existing central account login.
  // Public /profile/:profileToken pages are not redirected.
  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      if (isAdminDashboard && !getAccountToken()) {
        navigate("/account", { replace: true });
        setAccountLoading(false);
        return;
      }

      try {
        const result = await getCurrentUserAccount();
        const user = getAccountObject(result);

        if (!user) {
          throw new Error("Your account session is not valid. Please sign in again.");
        }

        if (!active) return;

        setCurrentUser(user);
      } catch (err) {
        console.error("Could not load signed-in account:", err);

        if (!active) return;

        setCurrentUser(null);

        if (isAdminDashboard) {
          navigate("/account", { replace: true });
        }
      } finally {
        if (active) {
          setAccountLoading(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, [isAdminDashboard, navigate]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      getProfile(token),
      getProducts(),
    ]);

    const profileResult = results[0];
    const productsResult = results[1];
    const errors = [];

    if (profileResult.status === "fulfilled") {
      const data = profileResult.value;

      if (data && typeof data === "object") {
        setProfile((previous) => ({
          ...previous,
          ...data,
          store_name:
            data.store_name || previous.store_name || "Creator-Yard",
        }));
      }
    } else {
      console.error("Profile loading failed:", profileResult.reason);
      errors.push("Agency profile could not be loaded.");
    }

    if (productsResult.status === "fulfilled") {
      const data = productsResult.value;

      setBrands(
        Array.isArray(data)
          ? data.filter((item) => item.is_portfolio === true)
          : []
      );
    } else {
      console.error("Client brand loading failed:", productsResult.reason);
      errors.push("Client brands could not be loaded.");
    }

    if (errors.length) {
      setError(
        `${errors.join(" ")} Check that the backend is running and that your account has the required access.`
      );
    }

    setLoading(false);
  }, [token]);

  useEffect(() => {
    let active = true;

    async function runLoad() {
      if (!active) return;

      // Avoid unnecessary admin data requests while redirecting an anonymous user.
      if (isAdminDashboard && !getAccountToken()) return;

      await loadDashboard();
    }

    runLoad();

    return () => {
      active = false;
    };
  }, [isAdminDashboard, loadDashboard]);

  function handleProfileChange(event) {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    setNotice("");
    setError("");

    const payload = {
      store_name: profile.store_name.trim() || "Creator-Yard",
      logo_type: profile.logo_type || "both",
      logo: profile.logo || "",
      facebook: profile.facebook.trim(),
      instagram: profile.instagram.trim(),
      tiktok: profile.tiktok.trim(),
      twitter: profile.twitter.trim(),
      whatsapp: profile.whatsapp.trim(),
      email: profile.email.trim(),
      phone: profile.phone.trim(),
      address: profile.address.trim(),
      ceo_name: profile.ceo_name || "",
      tagline: profile.tagline || "",
      description: profile.description || "",
    };

    try {
      await saveProfile(payload);

      setProfile((previous) => ({
        ...previous,
        ...payload,
      }));

      setNotice("Agency profile and contact details saved successfully.");
    } catch (err) {
      console.error("Profile save failed:", err);
      setError(
        getErrorMessage(
          err,
          "Could not save your profile. Check your permissions and try again."
        )
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleLogoUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setUploadingLogo(true);
    setNotice("");
    setError("");

    try {
      const result = await uploadLogo(file);

      if (!result?.url) {
        throw new Error("The upload response did not include an image URL.");
      }

      setProfile((previous) => ({
        ...previous,
        logo: result.url,
        logo_type:
          previous.logo_type === "text"
            ? "both"
            : previous.logo_type || "both",
      }));

      setNotice("Logo uploaded. Save your agency profile to retain the changes.");
    } catch (err) {
      console.error("Logo upload failed:", err);
      setError(getErrorMessage(err, "Logo upload failed."));
    } finally {
      setUploadingLogo(false);
    }
  }

  function handleBrandChange(event) {
    const { name, value } = event.target;

    setBrandForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleBrandImageUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setUploadingBrandImage(true);
    setNotice("");
    setError("");

    try {
      const result = await uploadProductImage(file);

      if (!result?.url) {
        throw new Error("The upload response did not include an image URL.");
      }

      setBrandForm((previous) => ({
        ...previous,
        image: result.url,
      }));

      setNotice("Client brand logo uploaded successfully.");
    } catch (err) {
      console.error("Brand image upload failed:", err);
      setError(getErrorMessage(err, "Could not upload the client brand logo."));
    } finally {
      setUploadingBrandImage(false);
    }
  }

  function resetBrandForm() {
    setBrandForm(EMPTY_BRAND);
    setEditingBrandId(null);
  }

  function editBrand(brand) {
    setBrandForm({
      name: brand.name || "",
      link: brand.link || "",
      description: brand.description || "",
      image: brand.image || "",
    });

    setEditingBrandId(brand.id);
    setNotice("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveBrand(event) {
    event.preventDefault();

    if (!brandForm.name.trim()) {
      setError("Please enter the client or brand name.");
      return;
    }

    setSavingBrand(true);
    setNotice("");
    setError("");

    const payload = {
      name: brandForm.name.trim(),
      original_price: 0,
      discount: 0,
      price: 0,
      description: brandForm.description.trim(),
      image: brandForm.image || null,
      link: brandForm.link.trim() || null,
      is_portfolio: true,
    };

    const wasEditing = editingBrandId !== null;

    try {
      if (wasEditing) {
        await updateProduct(editingBrandId, payload);
      } else {
        await createProduct(payload);
      }

      resetBrandForm();

      setNotice(
        wasEditing
          ? "Client brand updated successfully."
          : "Client brand added successfully."
      );

      await loadDashboard();
    } catch (err) {
      console.error("Brand save failed:", err);
      setError(
        getErrorMessage(
          err,
          "Could not save the client brand. Check your account permissions and backend."
        )
      );
    } finally {
      setSavingBrand(false);
    }
  }

  async function handleDeleteBrand(brand) {
    const confirmed = window.confirm(
      `Remove "${brand.name}" from the client portfolio?`
    );

    if (!confirmed) return;

    setNotice("");
    setError("");

    try {
      await deleteProduct(brand.id);

      setBrands((previous) =>
        previous.filter((item) => item.id !== brand.id)
      );

      if (editingBrandId === brand.id) {
        resetBrandForm();
      }

      setNotice("Client brand removed successfully.");
    } catch (err) {
      console.error("Brand deletion failed:", err);
      setError(
        getErrorMessage(
          err,
          "Could not remove this brand. Check your account permissions and try again."
        )
      );
    }
  }

  const accountName = getAccountName(currentUser);
  const accountRole = getAccountRole(currentUser);
  const isAccountOwner =
    String(currentUser?.role || "").toLowerCase() === "owner";

  const editorLinks = [
    {
      title: "Homepage editor",
      description: "Update and publish the public homepage.",
      href: "/admin/homepage-content",
      permission: "manage_homepage_content",
    },
    {
      title: "Retail management editor",
      description: "Update and publish the retail management page.",
      href: "/admin/retail-management-content",
      permission: "manage_retail_content",
    },
    {
      title: "Video portfolio",
      description: "Manage video work and portfolio entries.",
      href: "/admin/video-portfolio",
      permission: "manage_video_portfolio",
    },
    {
      title: "Video production editor",
      description: "Edit and publish video-production content.",
      href: "/admin/video-production-content",
      permission: "manage_video_content",
    },
    {
      title: "Team accounts",
      description: "Approve team registrations and assign access.",
      href: "/admin/accounts",
      ownerOnly: true,
    },
  ].filter((item) => {
    if (!currentUser) return false;
    if (isAccountOwner) return true;
    if (item.ownerOnly) return false;

    return currentUser.permissions?.[item.permission] === true;
  });

  if (loading) {
    return (
      <main className="dashboard profile-page">
        <header className="cy-settings-topbar">
          <div className="cy-settings-heading">
            <div className="cy-settings-eyebrow">CREATOR YARD / WORKSPACE</div>
            <h1>Agency settings</h1>
            <p>Loading your agency workspace...</p>
          </div>
        </header>

        <section className="settings-card" aria-live="polite">
          <p>Loading agency profile and client brands...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard profile-page">
      <header className="cy-settings-topbar">
        <div className="cy-settings-heading">
          <div className="cy-settings-eyebrow">CREATOR YARD / WORKSPACE</div>
          <h1>Agency settings</h1>
          <p>
            Manage your agency identity, business contacts, and client portfolio.
          </p>
        </div>

        <div className="cy-settings-user">
          <div className="cy-settings-avatar" aria-hidden="true">
            {accountLoading ? "…" : getInitials(accountName)}
          </div>

          <div className="cy-settings-user-info">
            <strong>
              {accountLoading
                ? "Loading account..."
                : accountName || "Account unavailable"}
            </strong>
            <span>
              {accountLoading
                ? "Checking access"
                : currentUser
                  ? accountRole
                  : "Public profile"}
            </span>
          </div>
        </div>
      </header>

      {!profileToken && currentUser && (
        <section className="cy-editor-hub" aria-labelledby="cy-editor-hub-title">
          <div className="cy-editor-hub-heading">
            <div>
              <span className="cy-editor-hub-eyebrow">YOUR WORKSPACE</span>
              <h2 id="cy-editor-hub-title">Content and management</h2>
              <p>Open the tools available to your account.</p>
            </div>

            <span className="cy-editor-hub-role">{accountRole}</span>
          </div>

          {editorLinks.length > 0 ? (
            <div className="cy-editor-hub-grid">
              {editorLinks.map((item) => (
                <a
                  className="cy-editor-hub-card"
                  href={item.href}
                  key={item.href}
                >
                  <span className="cy-editor-hub-card-arrow" aria-hidden="true">
                    ↗
                  </span>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                  <span className="cy-editor-hub-open">Open workspace</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="cy-editor-hub-empty">
              No editor permissions have been assigned to your account yet.
              Contact the Creator Yard owner for access.
            </p>
          )}
        </section>
      )}

      {notice && (
        <div className="dashboard-notice" role="status">
          {notice}
        </div>
      )}

      {error && (
        <div className="dashboard-error" role="alert">
          {error}
        </div>
      )}

      <section className="settings-card">
        <h2>Agency branding</h2>
        <p>Manage the name and logo used to represent Creator Yard.</p>

        <form onSubmit={handleSaveProfile}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="store_name">Agency name</label>
              <input
                id="store_name"
                name="store_name"
                value={profile.store_name || ""}
                onChange={handleProfileChange}
                placeholder="Creator-Yard"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="logo_type">Logo display</label>
              <select
                id="logo_type"
                name="logo_type"
                value={profile.logo_type || "both"}
                onChange={handleProfileChange}
              >
                <option value="both">Logo and agency name</option>
                <option value="image">Logo only</option>
                <option value="text">Agency name only</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="agency-logo">Agency logo</label>
            <input
              id="agency-logo"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={uploadingLogo}
            />
            <small>
              {uploadingLogo
                ? "Uploading logo..."
                : "Choose a clear image for your agency logo."}
            </small>
          </div>

          {profile.logo && (
            <div className="image-preview">
              <img
                src={getUploadUrl(profile.logo)}
                alt="Creator Yard agency logo"
              />
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={savingProfile || uploadingLogo}>
              {savingProfile ? "Saving..." : "Save agency branding"}
            </button>
          </div>
        </form>
      </section>

      <section className="settings-card">
        <h2>Social media and contact</h2>
        <p>
          These details can be used for the agency website footer and contact links.
        </p>

        <form onSubmit={handleSaveProfile}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="facebook">Facebook URL</label>
              <input
                id="facebook"
                name="facebook"
                value={profile.facebook || ""}
                onChange={handleProfileChange}
                placeholder="https://facebook.com/yourpage"
              />
            </div>

            <div className="form-group">
              <label htmlFor="instagram">Instagram URL</label>
              <input
                id="instagram"
                name="instagram"
                value={profile.instagram || ""}
                onChange={handleProfileChange}
                placeholder="https://instagram.com/yourpage"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tiktok">TikTok URL</label>
              <input
                id="tiktok"
                name="tiktok"
                value={profile.tiktok || ""}
                onChange={handleProfileChange}
                placeholder="https://tiktok.com/@yourpage"
              />
            </div>

            <div className="form-group">
              <label htmlFor="twitter">X (Twitter) URL</label>
              <input
                id="twitter"
                name="twitter"
                value={profile.twitter || ""}
                onChange={handleProfileChange}
                placeholder="https://x.com/yourpage"
              />
            </div>

            <div className="form-group">
              <label htmlFor="whatsapp">WhatsApp number or link</label>
              <input
                id="whatsapp"
                name="whatsapp"
                value={profile.whatsapp || ""}
                onChange={handleProfileChange}
                placeholder="08012345678 or https://wa.me/234..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Business email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={profile.email || ""}
                onChange={handleProfileChange}
                placeholder="hello@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Business phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={profile.phone || ""}
                onChange={handleProfileChange}
                placeholder="+234..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Business address (optional)</label>
              <input
                id="address"
                name="address"
                value={profile.address || ""}
                onChange={handleProfileChange}
                placeholder="Your business address"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save contact details"}
            </button>
          </div>
        </form>
      </section>

      <section className="settings-card">
        <h2>Brands we’ve worked with</h2>
        <p>
          Manage client and partner logos displayed in your portfolio. Add a
          website or social media link if available.
        </p>

        <form onSubmit={handleSaveBrand}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="brand-name">Brand name</label>
              <input
                id="brand-name"
                name="name"
                value={brandForm.name}
                onChange={handleBrandChange}
                placeholder="Client or brand name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="brand-link">Website or social link (optional)</label>
              <input
                id="brand-link"
                name="link"
                type="text"
                value={brandForm.link}
                onChange={handleBrandChange}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="brand-description">Description (optional)</label>
            <textarea
              id="brand-description"
              name="description"
              value={brandForm.description}
              onChange={handleBrandChange}
              placeholder="Briefly describe the work or partnership."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="brand-image">Client brand logo</label>
            <input
              id="brand-image"
              type="file"
              accept="image/*"
              onChange={handleBrandImageUpload}
              disabled={uploadingBrandImage}
            />
            <small>
              {uploadingBrandImage
                ? "Uploading brand logo..."
                : "Use a clear logo image. Transparent PNG files work well."}
            </small>
          </div>

          {brandForm.image && (
            <div className="image-preview">
              <img
                src={getUploadUrl(brandForm.image)}
                alt="Client brand logo preview"
              />
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              disabled={savingBrand || uploadingBrandImage}
            >
              {savingBrand
                ? "Saving..."
                : editingBrandId !== null
                  ? "Update brand"
                  : "Add brand"}
            </button>

            {editingBrandId !== null && (
              <button type="button" className="button-secondary" onClick={resetBrandForm}>
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <div className="portfolio-brand-list">
          <h3>Saved client brands ({brands.length})</h3>

          {brands.length === 0 ? (
            <p>No client brands added yet. Add your first brand above.</p>
          ) : (
            <div className="record-list">
              {brands.map((brand) => (
                <article className="record-card" key={brand.id}>
                  {brand.image && (
                    <img
                      className="record-logo"
                      src={getUploadUrl(brand.image)}
                      alt={`${brand.name} logo`}
                    />
                  )}

                  <div className="record-details">
                    <h4>{brand.name}</h4>

                    {brand.description && <p>{brand.description}</p>}

                    {brand.link && (
                      <p>
                        <a
                          href={normalizeUrl(brand.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Visit brand link →
                        </a>
                      </p>
                    )}
                  </div>

                  <div className="record-actions">
                    <button
                      type="button"
                      onClick={() => editBrand(brand)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="button-danger"
                      onClick={() => handleDeleteBrand(brand)}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
