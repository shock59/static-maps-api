const themePaths = {
  light: "light-modified",
  dark: "dark-modified",
};

const sentinelStyle = {
  version: 8,
  sources: {
    "raster-tiles": {
      type: "raster",
      tiles: [
        "http://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/g/{z}/{y}/{x}.jpg",
      ],
      tileSize: 256,
      attribution:
        "samv.me | Sentinel-2 cloudless - s2maps.eu by EOX IT Services GmbH - eox.at (Contains modified Copernicus Sentinel data 2023)",
    },
  },
  layers: [
    {
      id: "simple-tiles",
      type: "raster",
      source: "raster-tiles",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
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
  fadeDuration: 0,
  attributionControl: {
    compact: false,
  },
});

if (options.marker) {
  new maplibregl.Marker({ color: options.markerColor })
    .setLngLat(options.markerPosition)
    .addTo(map);
}

(async () => {
  if (options.theme == "satellite") {
    map.setStyle(sentinelStyle);
  } else {
    const res = await fetch(
      `https://tileserver.samv.me/styles/${
        themePaths[options.theme]
      }/style.json`
    );
    let style = await res.json();

    // Attribution needs to be specified manually, this removes the automatic attribution
    for (let source of Object.keys(style.sources))
      style.sources[source].attribution =
        "samv.me | Protomaps | © OpenStreetMap - openstreetmap.org/copyright";

    map.setStyle(style);
  }
  map.once("load", () => {
    requestAnimationFrame(() => {
      window.MAP_LOADED = true;
    });
  });
})();
