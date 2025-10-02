import express from "express";
import { chromium } from "playwright";
import { countryGeojson } from "./countryGeojson.js";

const cgjString = `const countryGeojson = ${JSON.stringify(countryGeojson)}`;

const app = express();
const port = 3000;

const browser = await chromium.launch({
  args: ["--disable-web-security"],
});

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/map", async (req, res) => {
  const viewport = {
    width: Number(req.query.width) || 640,
    height: Number(req.query.height) || 480,
  };
  const params: { [key: string]: any } = {
    lon: Number(req.query.lon) || 0,
    lat: Number(req.query.lat) || 0,
    zoom: Number(req.query.zoom) || 1,

    theme: req.query.theme || "light",

    marker: !!req.query.markerLon,
    markerLon: Number(req.query.markerLon) || 0,
    markerLat: Number(req.query.markerLat) || 0,
    markerColor: req.query.markerColor || "ff5050",

    country: req.query.country || "",
  };

  // Check if the params were acceptable
  const sendError = (message: string) => res.status(400).send(message);

  if (isNaN(viewport.width) || viewport.width > 2000 || viewport.width < 1)
    return sendError("Invalid width (must be between 1-2000)");
  if (isNaN(viewport.height) || viewport.height > 2000 || viewport.height < 1)
    return sendError("Invalid height (must be between 1-2000)");
  if (isNaN(params.zoom) || params.zoom > 22 || params.zoom < 1)
    return sendError("Invalid zoom (must be between 1-22)");
  if (!["light", "dark", "satellite"].includes(params.theme))
    return sendError('Invalid theme (must be "light", "dark", or "satellite")');
  if (!/^([0-9A-F]{3}){1,2}$/i.test(params.markerColor))
    return sendError("Invalid marker colour (must be a valid hex code)");

  const context = await browser.newContext({
    viewport,
  });
  const page = await context.newPage();
  await page.goto(
    `http://127.0.0.1:${port}/map.html?${Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join("&")}`
  );

  await page.title(); // Wait for page load

  // Wait for the map to load
  await page.waitForFunction(() => {
    return (window as any).MAP_LOADED;
  });

  const buffer = await page.screenshot({ type: "png" });

  await page.close();
  await context.close();
  res.contentType("png");
  res.send(buffer);
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/countryCodes", (req, res) => {
  const countries = countryGeojson.features
    .map((country) => ({
      name: country.properties.name_long,
      iso: country.properties.iso_a2_eh,
    }))
    .toSorted((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLocaleLowerCase())
    );
  res.render("countryCodes", {
    countries,
  });
});

app.get("/countryGeojson.js", (req, res) => {
  res.send(cgjString);
});

app.listen(port, () => {
  console.log(`Listening at http://127.0.0.1:${port}`);
});
