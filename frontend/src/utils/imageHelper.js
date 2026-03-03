
// Helper to construct full image URLs
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;

  const baseUrl = (import.meta.env.VITE_SERVER_URL || "http://localhost:8000").replace(/\/$/, "");

  // Normalize slashes (Windows paths use backslash)
  let normalized = path.replace(/\\/g, "/");

  // Strip absolute path prefix if present (e.g. "D:/project/backend/uploads/...")
  const uploadsIdx = normalized.indexOf("uploads/");
  if (uploadsIdx > 0) {
    normalized = normalized.slice(uploadsIdx);
  }

  // Ensure single leading slash
  const cleanPath = normalized.startsWith("/") ? normalized : `/${normalized}`;

  return `${baseUrl}${cleanPath}`;
};


// Startard onError handler for images
export const handleImageError = (e) => {
  e.target.onerror = null; // Prevent infinite loop
  e.target.src = "https://placehold.co/400x250?text=Image+Not+Found";
};
