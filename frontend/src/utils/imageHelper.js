
// Helper to construct full image URLs
export const getImageUrl = (path) => {
  if (!path) return "https://placehold.co/400x250?text=No+Image";
  if (path.startsWith("http")) return path;
  
  // Use VITE_SERVER_URL or default to localhost:8000
  const baseUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";
  
  // Ensure we don't double slash or miss a slash
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  return `${cleanBase}${cleanPath}`;
};

// Startard onError handler for images
export const handleImageError = (e) => {
  e.target.onerror = null; // Prevent infinite loop
  e.target.src = "https://placehold.co/400x250?text=Image+Not+Found";
};
