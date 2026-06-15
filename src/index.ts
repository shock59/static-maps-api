import { serve } from "@hono/node-server";
import { Hono } from "hono";
import mbgl from "@maplibre/maplibre-gl-native";
import sharp from "sharp";

const res = await fetch("https://tiles.openfreemap.org/styles/bright");
const style = await res.json();

const map = new mbgl.Map();
map.load(style);
const render: () => Promise<Uint8Array<ArrayBufferLike>> = () => {
  return new Promise((resolve, reject) => {
    map.render((err, buffer) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(buffer);
    });
  });
};

const app = new Hono();
app.get("/", (c) => c.text("hai"));

app.get("/map", async (c) => {
  const buffer = await render();

  const image = await sharp(buffer, {
    raw: {
      width: 512,
      height: 512,
      channels: 4,
    },
  })
    .png()
    .toBuffer();

  return c.body(Buffer.from(image));
});

serve({
  fetch: app.fetch,
  port: 3000,
});
console.log("Listening at http://127.0.0.1:3000");
