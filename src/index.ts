import { serve } from "@hono/node-server";
import { Hono } from "hono";
import mbgl from "@maplibre/maplibre-gl-native";
import sharp from "sharp";
import * as zod from "zod";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import Queue from "./Queue.js";

const MapOptions = zod.object({
  width: zod.coerce.number().min(1).max(2000).default(640),
  height: zod.coerce.number().min(1).max(2000).default(480),
  lat: zod.coerce.number().min(-90).max(90),
  lon: zod.coerce.number(),
  zoom: zod.coerce.number().min(0).max(21).default(0),
});

GlobalFonts.registerFromPath("./assets/noto/noto-sans-latin-400-normal.ttf");

const res = await fetch("https://tiles.samv.me/style/style");
const style = await res.json();

const map = new mbgl.Map();
map.load(style);

const queue = new Queue((i: () => void) => i());

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

  const buffer = await new Promise<Uint8Array<ArrayBufferLike>>(
    (resolve, reject) => {
      queue.enqueue(() => {
        map.render(options, (err, buffer) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(buffer);
        });
      });
    },
  );

  const canvas = createCanvas(options.width, options.height);
  const ctx = canvas.getContext("2d");

  const attributionText =
    "samv.me | © OpenStreetMap openstreetmap.org/copyright";
  const attributionPadding = 4;
  ctx.font = "11px Noto Sans";
  const measuredText = ctx.measureText(attributionText);

  ctx.fillStyle = "#ffffffa0";
  ctx.fillRect(
    options.width - measuredText.width - attributionPadding * 2,
    options.height -
      measuredText.actualBoundingBoxAscent -
      attributionPadding * 2,
    measuredText.width + attributionPadding * 2,
    measuredText.actualBoundingBoxAscent + attributionPadding * 2,
  );

  ctx.fillStyle = "#000000";
  ctx.fillText(
    attributionText,
    options.width - measuredText.width - attributionPadding,
    options.height - attributionPadding,
  );

  const attribution = await canvas.encode("png");

  const image = await sharp(buffer, {
    raw: {
      width: options.width,
      height: options.height,
      channels: 4,
    },
  })
    .composite([{ input: attribution, top: 0, left: 0 }])
    .png()
    .toBuffer();

  return c.body(Buffer.from(image));
});

serve({
  fetch: app.fetch,
  port: 3000,
});
console.log("Listening at http://127.0.0.1:3000");
