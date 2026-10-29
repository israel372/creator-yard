const API_BASE =
import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const PROFILE_TOKEN = "ZFE_e9utZYmdUP1-bPg3HyIfOPw9eYfXsidVO44U_jI";

// Backend Status
export async function getBackendStatus() {
  const response = await fetch(`${API_BASE}/`);

  if (!response.ok) {
    throw new Error("Backend connection failed");
  }

  return response.json();
}


// Get Store Profile
export async function getProfile(profileToken = PROFILE_TOKEN) {
  const response = await fetch(`${API_BASE}/profile/${profileToken}`);

  if (!response.ok) {
    throw new Error("Failed to load profile");
  }

  return response.json();
}

// Save Store Profile
export async function saveProfile(profileData) {
  const response = await fetch(`${API_BASE}/profile/${PROFILE_TOKEN}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...accountAuthHeaders(),
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    throw new Error("Failed to save profile");
  }

  return response.json();
}


// Save uploadLogo
export async function uploadLogo(file) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(`${API_BASE}/profile/logo`, {
    method: "POST",
    headers: accountAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload logo");
  }

  return response.json();
}
// save uploadHero
export async function uploadHero(file) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_BASE}/profile/hero`,
    {
      method: "POST",
      headers: accountAuthHeaders(),
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to upload hero image");
  }

  return response.json();
}

// Upload Product Image
export async function uploadProductImage(file) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(`${API_BASE}/products/upload`, {
    method: "POST",
    headers: accountAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload product image");
  }

  return response.json();
}

// Create Product
export async function createProduct(product) {
  const response = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...accountAuthHeaders(),
    },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    throw new Error("Failed to create product");
  }

  return response.json();
}

export async function getProducts() {
  const response = await fetch(`${API_BASE}/products`);

  if (!response.ok) {
    throw new Error("Failed to load products");
  }

  return response.json();
}

export async function deleteProduct(id) {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: "DELETE",
    headers: accountAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete product");
  }

  return response.json();
}


export async function updateProduct(id, product) {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...accountAuthHeaders(),
    },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    throw new Error("Failed to update product");
  }

  return response.json();
}




export async function getReviews() {
  const response = await fetch(`${API_BASE}/reviews`);
  return response.json();
}

export async function createReview(review) {
  const response = await fetch(`${API_BASE}/reviews/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(review),
  });

  return response.json();
}

export async function updateReview(id, review) {
  const response = await fetch(`${API_BASE}/reviews/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...accountAuthHeaders(),
    },
    body: JSON.stringify(review),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to update review");
  }

  return response.json();
}

export async function deleteReview(id) {
  const response = await fetch(`${API_BASE}/reviews/${id}`, {
    method: "DELETE",
    headers: accountAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to delete review");
  }

  return response.json();
}


// Export API base URL
export const API = API_BASE;

// Helper for uploaded files/images
export const getUploadUrl = (filename) => {
  if (!filename) return "";

  // Supabase already gives us the complete public URL
  if (filename.startsWith("http://") || filename.startsWith("https://")) {
    return filename;
  }

  // Keep support for older/local uploaded files
  return `${API_BASE}/uploads/${filename}`;
};

// Video Portfolio
export async function getPublishedVideos() {
  const response = await fetch(`${API_BASE}/video-portfolio/`);

  if (!response.ok) {
    throw new Error("Failed to load video portfolio");
  }

  return response.json();
}

// Video Portfolio Admin

export async function loginVideoPortfolioAdmin(password) {
  const response = await fetch(
    `${API_BASE}/video-portfolio/admin/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Admin login failed");
  }

  return data;
}

export async function getAdminVideos(token) {
  const response = await fetch(
    `${API_BASE}/video-portfolio/admin/`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load portfolio videos");
  }

  return response.json();
}

export async function uploadPortfolioVideo(file, token) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE}/video-portfolio/admin/upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Video upload failed");
  }

  return {
    ...data,
    url: data.url.startsWith("http")
      ? data.url
      : `${API_BASE}${data.url}`,
  };
}

export async function createPortfolioVideo(video, token) {
  const response = await fetch(
    `${API_BASE}/video-portfolio/admin/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(video),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Failed to create video");
  }

  return data;
}

export async function updatePortfolioVideo(id, video, token) {
  const response = await fetch(
    `${API_BASE}/video-portfolio/admin/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(video),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Failed to update video");
  }

  return data;
}

export async function deletePortfolioVideo(id, token) {
  const response = await fetch(
    `${API_BASE}/video-portfolio/admin/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to delete video");
  }
}
// Video Production Page CMS

export async function getPublishedVideoProductionContent() {
  const response = await fetch(`${API_BASE}/video-production/content`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Failed to load video production page content");
  }

  return data;
}

export async function getAdminVideoProductionContent(token) {
  const response = await fetch(`${API_BASE}/video-production/admin/content`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Failed to load page content");
  }

  return data;
}

export async function saveVideoProductionDraft(content, token) {
  const response = await fetch(`${API_BASE}/video-production/admin/content`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Failed to save page draft");
  }

  return data;
}

export async function publishVideoProductionContent(token) {
  const response = await fetch(
    `${API_BASE}/video-production/admin/content/publish`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Failed to publish page content");
  }

  return data;
}


// Homepage CMS
export async function getPublishedHomepageContent() {
  const response = await fetch(`${API_BASE}/homepage/content`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Failed to load homepage content.");
  }
  return data;
}

export async function getAdminHomepageContent(token) {
  const activeToken = token || getAccountToken();
  const response = await fetch(`${API_BASE}/homepage/admin/content`, {
    headers: { Authorization: `Bearer ${activeToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Failed to load homepage draft.");
  }
  return data;
}

export async function saveHomepageDraft(content, token) {
  const activeToken = token || getAccountToken();
  const response = await fetch(`${API_BASE}/homepage/admin/content`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${activeToken}`,
    },
    body: JSON.stringify({ content }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Failed to save homepage draft.");
  }
  return data;
}

export async function publishHomepageContent(token) {
  const activeToken = token || getAccountToken();
  const response = await fetch(`${API_BASE}/homepage/admin/content/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${activeToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Failed to publish homepage content.");
  }
  return data;
}

// Retail management page CMS
export async function getPublishedRetailManagementContent() {
  const response = await fetch(`${API_BASE}/retail-management/content`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Failed to load retail management content.");
  }
  return data;
}

export async function getAdminRetailManagementContent(token) {
  const activeToken = token || getAccountToken();
  const response = await fetch(`${API_BASE}/retail-management/admin/content`, {
    headers: { Authorization: `Bearer ${activeToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Failed to load retail management draft.");
  }
  return data;
}

export async function saveRetailManagementDraft(content, token) {
  const activeToken = token || getAccountToken();
  const response = await fetch(`${API_BASE}/retail-management/admin/content`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${activeToken}`,
    },
    body: JSON.stringify({ content }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Failed to save retail management draft.");
  }
  return data;
}

export async function publishRetailManagementContent(token) {
  const activeToken = token || getAccountToken();
  const response = await fetch(
    `${API_BASE}/retail-management/admin/content/publish`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${activeToken}` },
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Failed to publish retail management content.");
  }
  return data;
}
// Creator Yard staff and owner accounts.
// This token is intentionally separate from the video-production admin token.
const ACCOUNT_TOKEN_KEY = "cy_account_token";

export function getAccountToken() {
  return sessionStorage.getItem(ACCOUNT_TOKEN_KEY) || "";
}

function accountAuthHeaders() {
  const token = getAccountToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function saveAccountToken(token) {
  if (!token) {
    throw new Error("A valid account token is required.");
  }

  sessionStorage.setItem(ACCOUNT_TOKEN_KEY, token);
}

export function logoutUserAccount() {
  sessionStorage.removeItem(ACCOUNT_TOKEN_KEY);
}

async function accountRequest(path, options = {}) {
  const token = getAccountToken();
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Account request failed.");
  }

  return data;
}

export async function registerUserAccount(account) {
  return accountRequest("/accounts/register", {
    method: "POST",
    body: JSON.stringify(account),
  });
}

export async function setupOwnerAccount(account) {
  const data = await accountRequest("/accounts/setup-owner", {
    method: "POST",
    body: JSON.stringify(account),
  });

  if (!data.access_token || !data.user) {
    throw new Error("The server returned an incomplete owner setup response.");
  }

  saveAccountToken(data.access_token);
  return data;
}

export async function loginUserAccount(email, password) {
  const data = await accountRequest("/accounts/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!data.access_token || !data.user) {
    throw new Error("The server returned an incomplete login response.");
  }

  saveAccountToken(data.access_token);
  return data;
}

export async function getCurrentUserAccount() {
  return accountRequest("/accounts/me");
}

export async function getManagedAccounts() {
  return accountRequest("/accounts/users");
}

export async function getPendingAccounts() {
  return accountRequest("/accounts/pending");
}

export async function updateManagedAccount(userId, access) {
  return accountRequest(`/accounts/${userId}/access`, {
    method: "PATCH",
    body: JSON.stringify(access),
  });
}

