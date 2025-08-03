const paramsString = window.location.search;
const params = new URLSearchParams(paramsString);

const options = {
  center: [Number(params.get("lon")), Number(params.get("lat"))],
  zoom: Number(params.get("zoom")),
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

(async () => {
  const res = await fetch(
    "https://tileserver.samv.me/styles/light-modified/style.json"
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
