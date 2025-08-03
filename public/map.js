const themePaths = {
  light: "light-modified",
  dark: "dark-modified",
};

const paramsString = window.location.search;
const params = new URLSearchParams(paramsString);

const options = {
  center: [Number(params.get("lon")), Number(params.get("lat"))],
  zoom: Number(params.get("zoom")),
  theme: params.get("theme"),
  marker: params.get("marker") == "true",
  markerPosition: [
    Number(params.get("markerLon")),
    Number(params.get("markerLat")),
  ],
  markerColor: `#${params.get("markerColor")}`,
};

const map = new maplibregl.Map({
  container: "map",
  center: options.center,
  zoom: options.zoom,
  attributionControl: {
    compact: false,
    customAttribution:
      "samv.me | Protomaps | © OpenStreetMap - openstreetmap.org/copyright",
  },
});

if (options.marker) {
  new maplibregl.Marker({ color: options.markerColor })
    .setLngLat(options.markerPosition)
    .addTo(map);
}

(async () => {
  const res = await fetch(
    `https://tileserver.samv.me/styles/${themePaths[options.theme]}/style.json`
  );
  let style = await res.json();

  // Attribution needs to be specified manually, this removes the automatic attribution
  for (let source of Object.keys(style.sources))
    style.sources[source].attribution = "";

  map.setStyle(style);
  map.once("load", () => {
    requestAnimationFrame(() => {
      window.MAP_LOADED = true;
    });
  });
})();
