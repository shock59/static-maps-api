import { serve } from "@hono/node-server";
import { Hono } from "hono";
import mbgl from "@maplibre/maplibre-gl-native";
import sharp from "sharp";
import * as zod from "zod";

const MapOptions = zod.object({
  width: zod.coerce.number().min(1).max(2000).default(640),
  height: zod.coerce.number().min(1).max(2000).default(480),
  lat: zod.coerce.number().min(-90).max(90),
  lon: zod.coerce.number(),
  zoom: zod.coerce.number().min(0).max(21).default(0),
});

const res = await fetch("https://tiles.samv.me/style/style");
const style = await res.json();

const map = new mbgl.Map();
map.load(style);
const render: (
  options: mbgl.RenderOptions,
) => Promise<Uint8Array<ArrayBufferLike>> = (options) => {
  return new Promise((resolve, reject) => {
    map.render(options, (err, buffer) => {
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
  const { error, data: options } = MapOptions.safeParse(c.req.query());
  if (error) {
    const issue = error.issues[0];
    return c.text(
      issue ? `${String(issue.path[0])}: ${issue.message}` : "Error",
      400,
    );
  }

  const buffer = await render({
    width: options.width,
    height: options.height,
    center: [options.lon, options.lat],
    zoom: options.zoom,
  });

  const image = await sharp(buffer, {
    raw: {
      width: options.width,
      height: options.height,
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
