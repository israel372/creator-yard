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
    },
    body: JSON.stringify(review),
  });

  return response.json();
}

export async function deleteReview(id) {
  await fetch(`${API_BASE}/reviews/${id}`, {
    method: "DELETE",
  });
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