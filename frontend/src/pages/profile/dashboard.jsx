import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
} from "../../api/api";

function Dashboard() {
  const { profileToken } = useParams();
  const token = profileToken || PROFILE_TOKEN;

  const [profile, setProfile] = useState({
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
  });

  const [brands, setBrands] = useState([]);
  const [brandForm, setBrandForm] = useState({
    name: "",
    link: "",
    description: "",
    image: "",
  });

  const [editingBrandId, setEditingBrandId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBrandImage, setUploadingBrandImage] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
    // Load when the profile URL changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [profileData, productData] = await Promise.all([
        getProfile(token),
        getProducts(),
      ]);

      if (profileData) {
        setProfile((previous) => ({
          ...previous,
          ...profileData,
          store_name: profileData.store_name || "Creator-Yard",
        }));
      }

      // Show only client-brand records. Leave old shop products untouched.
      const portfolioBrands = Array.isArray(productData)
        ? productData.filter((item) => item.is_portfolio === true)
        : [];

      setBrands(portfolioBrands);
    } catch (err) {
      console.error("Dashboard loading failed:", err);
      setError(
        "Could not load your dashboard. Check that the backend is running and your profile token is correct."
      );
    } finally {
      setLoading(false);
    }
  }

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

    try {
      const payload = {
        store_name: profile.store_name.trim() || "Creator-Yard",
        logo_type: profile.logo_type || "both",
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

      await saveProfile(payload);
      setProfile((previous) => ({
        ...previous,
        ...payload,
      }));
      setNotice("Agency profile and contact details saved successfully.");
    } catch (err) {
      console.error("Profile save failed:", err);
      setError("Could not save your profile. Please check the backend and try again.");
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

      setProfile((previous) => ({
        ...previous,
        logo: result.url,
        logo_type:
          previous.logo_type === "text" ? "both" : previous.logo_type || "both",
      }));

      setNotice("Logo uploaded successfully. Save your profile to retain your other changes.");
    } catch (err) {
      console.error("Logo upload failed:", err);
      setError("Logo upload failed. Please try again.");
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
      setBrandForm((previous) => ({
        ...previous,
        image: result.url,
      }));
      setNotice("Brand logo uploaded successfully.");
    } catch (err) {
      console.error("Brand image upload failed:", err);
      setError("Could not upload the brand logo. Please try again.");
    } finally {
      setUploadingBrandImage(false);
    }
  }

  function resetBrandForm() {
    setBrandForm({
      name: "",
      link: "",
      description: "",
      image: "",
    });
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
      setError("Please enter the brand name.");
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

    try {
      if (editingBrandId !== null) {
        await updateProduct(editingBrandId, payload);
        setNotice("Client brand updated successfully.");
      } else {
        await createProduct(payload);
        setNotice("Client brand added successfully.");
      }

      resetBrandForm();
      await loadBrands();
    } catch (err) {
      console.error("Brand save failed:", err);
      setError(
        "Could not save the brand. Confirm that the backend supports the link and is_portfolio fields."
      );
    } finally {
      setSavingBrand(false);
    }
  }

  async function loadBrands() {
    try {
      const productData = await getProducts();
      setBrands(
        Array.isArray(productData)
          ? productData.filter((item) => item.is_portfolio === true)
          : []
      );
    } catch (err) {
      console.error("Could not refresh client brands:", err);
      setError("The brand was saved, but the brand list could not be refreshed.");
    }
  }

  async function handleDeleteBrand(brand) {
    const confirmed = window.confirm(
      `Remove "${brand.name}" from your client brands? This will delete only this portfolio record.`
    );

    if (!confirmed) return;

    setNotice("");
    setError("");

    try {
      // The list contains portfolio records only, never ordinary shop products.
      await deleteProduct(brand.id);
      setBrands((previous) => previous.filter((item) => item.id !== brand.id));

      if (editingBrandId === brand.id) {
        resetBrandForm();
      }

      setNotice("Client brand removed.");
    } catch (err) {
      console.error("Brand deletion failed:", err);
      setError("Could not remove this brand. Please try again.");
    }
  }

  function normalizeUrl(value) {
    const trimmed = (value || "").trim();
    if (!trimmed) return "";
    if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  if (loading) {
    return (
      <main className="dashboard profile-page">
        <div className="settings-card">
          <p>Loading Creator-Yard dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard profile-page">
      <header className="dashboard-header">
        <h1>Creator-Yard Dashboard</h1>
        <p>
          Manage your agency identity, contact information, and client brands.
        </p>
      </header>

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
        <h2>Agency Branding</h2>
        <p>Set the name and logo used to represent your agency.</p>

        <form onSubmit={handleSaveProfile}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="store_name">Agency Name</label>
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
              <label htmlFor="logo_type">Logo Display</label>
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
            <label htmlFor="agency-logo">Agency Logo</label>
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
                : "Choose an image file to upload your agency logo."}
            </small>
          </div>

          {profile.logo && (
            <div className="image-preview">
              <img
                src={getUploadUrl(profile.logo)}
                alt="Creator-Yard agency logo"
                style={{
                  maxWidth: "180px",
                  maxHeight: "140px",
                  objectFit: "contain",
                }}
              />
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save Agency Branding"}
            </button>
          </div>
        </form>
      </section>

      <section className="settings-card">
        <h2>Social Media & Contact</h2>
        <p>
          These details are for Creator-Yard and will be used by the website
          footer and contact links.
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
              <label htmlFor="whatsapp">WhatsApp Number or Link</label>
              <input
                id="whatsapp"
                name="whatsapp"
                value={profile.whatsapp || ""}
                onChange={handleProfileChange}
                placeholder="08012345678 or https://wa.me/2348012345678"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Business Email</label>
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
              <label htmlFor="phone">Business Phone</label>
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
              <label htmlFor="address">Business Address (Optional)</label>
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
              {savingProfile ? "Saving..." : "Save Contact Details"}
            </button>
          </div>
        </form>
      </section>

      <section className="settings-card">
        <h2>Brands We&apos;ve Worked With</h2>
        <p>
          Add client or partner brands to display their logos on your
          portfolio. You can optionally link each logo to a website or social
          media page.
        </p>

        <form onSubmit={handleSaveBrand}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="brand-name">Brand Name</label>
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
              <label htmlFor="brand-link">Website or Social Link (Optional)</label>
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
            <label htmlFor="brand-description">Short Description (Optional)</label>
            <textarea
              id="brand-description"
              name="description"
              value={brandForm.description}
              onChange={handleBrandChange}
              placeholder="Briefly describe the work or partnership"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="brand-image">Brand Logo</label>
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
                : "Upload the client's logo. Use a clear image with a transparent background where possible."}
            </small>
          </div>

          {brandForm.image && (
            <div className="image-preview">
              <img
                src={getUploadUrl(brandForm.image)}
                alt="Selected brand logo preview"
                style={{
                  maxWidth: "180px",
                  maxHeight: "120px",
                  objectFit: "contain",
                }}
              />
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={savingBrand || uploadingBrandImage}>
              {savingBrand
                ? "Saving..."
                : editingBrandId !== null
                  ? "Update Brand"
                  : "Add Brand"}
            </button>

            {editingBrandId !== null && (
              <button type="button" onClick={resetBrandForm}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <div className="portfolio-brand-list">
          <h3>Saved Client Brands ({brands.length})</h3>

          {brands.length === 0 ? (
            <p>No client brands added yet. Add your first brand above.</p>
          ) : (
            <div className="record-list">
              {brands.map((brand) => (
                <article className="record-card" key={brand.id}>
                  {brand.image && (
                    <img
                      src={getUploadUrl(brand.image)}
                      alt={`${brand.name} logo`}
                      style={{
                        width: "90px",
                        height: "70px",
                        objectFit: "contain",
                      }}
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
                          Visit brand link ↗
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