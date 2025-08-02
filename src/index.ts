import express from "express";
import { chromium } from "playwright";

const app = express();
const port = 3000;

const browser = await chromium.launch();

app.get("/", (req, res) => {
  res.send(
    `<h1>Home Page</h1>
    <br>
    <h3>Current time: ${new Date(Date.now()).toTimeString()}</h3>`
  );
});

app.get("/screenshot", async (req, res) => {
  const context = await browser.newContext({
    viewport: {
      width: Number(req.query.width || 640),
      height: Number(req.query.height || 480),
    },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000");
  await page.title(); // Wait for page load

  const buffer = await page.screenshot({ type: "png" });

  await page.close();
  await context.close();
  res.contentType("png");
  res.send(buffer);
});

app.listen(port, () => {
  console.log(`Listening at http://127.0.0.1:${port}`);
});
