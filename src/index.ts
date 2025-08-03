import express from "express";
import { chromium } from "playwright";

const app = express();
const port = 3000;

const browser = await chromium.launch();

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send(
    `<h1>Home Page</h1>
    <br>
    <h3>Current time: ${new Date(Date.now()).toTimeString()}</h3>`
  );
});

app.get("/screenshot", async (req, res) => {
  const params = {
    width: Number(req.query.width) || 640,
    height: Number(req.query.height) || 480,
    lon: Number(req.query.lon) || 0,
    lat: Number(req.query.lat) || 0,
    zoom: Number(req.query.zoom) || 1,
    theme: req.query.theme || "light",
  };

  const context = await browser.newContext({
    viewport: {
      width: params.width,
      height: params.height,
    },
  });
  const page = await context.newPage();
  await page.goto(
    `http://127.0.0.1:${port}/map.html?lon=${params.lon}&lat=${params.lat}&zoom=${params.zoom}&theme=${params.theme}`
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

app.listen(port, () => {
  console.log(`Listening at http://127.0.0.1:${port}`);
});
