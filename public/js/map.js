// MapTiler map initialization
function initMap(coordinates, apiKey) {
  if (!window.maptilersdk) {
    console.error("MapTiler SDK not loaded");
    return;
  }

  maptilersdk.config.apiKey = apiKey;

  const map = new maptilersdk.Map({
    container: "map",
    style: maptilersdk.MapStyle.STREETS,
    center: coordinates,
    zoom: 12,
  });

  // Create a popup
  const popup = new maptilersdk.Popup({ offset: 25 }).setHTML(
    "<p><strong>Exact location will be shared after booking.</strong></p>",
  );

  // Add marker with popup on hover
  const marker = new maptilersdk.Marker()
    .setLngLat(coordinates)
    .setPopup(popup)
    .addTo(map);

  // Show popup on hover
  marker.getElement().addEventListener("mouseenter", () => {
    popup.addTo(map);
  });

  marker.getElement().addEventListener("mouseleave", () => {
    popup.remove();
  });
}
