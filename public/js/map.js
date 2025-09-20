document.addEventListener("DOMContentLoaded", () => {
  if (!coordinates) {
    console.error("No coordinates found for this listing");
    document.getElementById("map").innerHTML = "<p style='text-align:center; color:gray;'>Location not available</p>";
    return;
  }

  const map = L.map("map").setView(coordinates, 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  // Default Leaflet icon
  const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  // Custom FontAwesome fan icon
  const fanIcon = L.divIcon({
    className: "custom-fa-icon",
    html: '<i class="fa-solid fa-fan"></i>',
    iconSize: [30, 30],
    iconAnchor: [15, 30]
  });

  // Place marker with default icon
  const marker = L.marker(coordinates, { icon: defaultIcon }).addTo(map)
    .bindPopup(listing.title || "Listing location")
    .openPopup();

  // Track toggle state
  let isFan = false;

  // Toggle icon on hover
  marker.on("mouseover", () => {
    if (isFan) {
      marker.setIcon(defaultIcon);
      isFan = false;
    } else {
      marker.setIcon(fanIcon);
      isFan = true;
    }
  });
});
