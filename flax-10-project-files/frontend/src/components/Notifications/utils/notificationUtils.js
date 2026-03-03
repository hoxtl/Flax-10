/**
 * Triggers a navigation event that App.jsx listens to.
 * This ensures that components outside the main router context (like toasts and panels)
 * can still control the dashboard navigation.
 * 
 * @param {string} url - The URL to navigate to (e.g., "/societies/1").
 */
export function navigateToUrl(url) {
    if (!url) return;

    // Standardize the URL by removing leading slash and applying any needed transformations
    const path = url.replace(/^\//, '');

    // Create and dispatch the custom 'navigate' event
    const event = new CustomEvent('navigate', { detail: path });
    window.dispatchEvent(event);
}
