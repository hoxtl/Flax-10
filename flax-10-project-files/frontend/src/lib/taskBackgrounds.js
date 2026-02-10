export const BACKGROUND_URLS = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920",
  // Add more Unsplash URLs
];

export function pickBackgroundByKey(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return BACKGROUND_URLS[hash % BACKGROUND_URLS.length];
}