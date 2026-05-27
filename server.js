const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const INDEX_FILE = path.join(ROOT, "index.html");
const PHOTO_FILE = path.join(ROOT, "assets", "oluwatosin-hero.jpeg");
const WISHLIST_FILE = path.join(ROOT, "wishlist.json");

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function sendText(res, statusCode, text, contentType) {
  res.writeHead(statusCode, {
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(text)
  });
  res.end(text);
}

async function sendFile(res, filePath, contentType) {
  const file = await fs.readFile(filePath);
  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": file.length
  });
  res.end(file);
}

async function ensureWishlistFile() {
  try {
    await fs.access(WISHLIST_FILE);
  } catch (error) {
    const initialData = {
      title: "For Oluwatosin",
      updatedAt: new Date().toISOString(),
      items: []
    };
    await fs.writeFile(WISHLIST_FILE, JSON.stringify(initialData, null, 2));
  }
}

async function readWishlist() {
  await ensureWishlistFile();
  const raw = await fs.readFile(WISHLIST_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return {
    title: parsed.title || "For Oluwatosin",
    updatedAt: parsed.updatedAt || new Date().toISOString(),
    items: Array.isArray(parsed.items) ? parsed.items : []
  };
}

async function writeWishlist(data) {
  const next = {
    title: "For Oluwatosin",
    updatedAt: new Date().toISOString(),
    items: Array.isArray(data.items) ? data.items : []
  };
  await fs.writeFile(WISHLIST_FILE, JSON.stringify(next, null, 2));
  return next;
}

async function readRequestBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

function normalizeItem(input) {
  return {
    id: "wish-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
    itemName: String(input.itemName || "").trim(),
    itemLink: String(input.itemLink || "").trim(),
    priceIdea: String(input.priceIdea || "").trim(),
    itemDetails: String(input.itemDetails || "").trim(),
    priority: String(input.priority || "Medium").trim() || "Medium",
    specialNote: String(input.specialNote || "").trim(),
    createdAt: new Date().toISOString()
  };
}

function normalizeUpdatedItem(existingItem, input) {
  return {
    id: existingItem.id,
    itemName: String(input.itemName || "").trim(),
    itemLink: String(input.itemLink || "").trim(),
    priceIdea: String(input.priceIdea || "").trim(),
    itemDetails: String(input.itemDetails || "").trim(),
    priority: String(input.priority || "Medium").trim() || "Medium",
    specialNote: String(input.specialNote || "").trim(),
    createdAt: existingItem.createdAt || new Date().toISOString()
  };
}

async function handleRequest(req, res) {
  try {
    const url = new URL(req.url, "http://localhost");
    const pathname = url.pathname;

    if (req.method === "GET" && (pathname === "/" || pathname === "/admin")) {
      await sendFile(res, INDEX_FILE, "text/html; charset=utf-8");
      return;
    }

    if (req.method === "GET" && pathname === "/assets/oluwatosin-hero.jpeg") {
      await sendFile(res, PHOTO_FILE, "image/jpeg");
      return;
    }

    if (req.method === "GET" && pathname === "/data/wishlist.json") {
      const data = await readWishlist();
      sendJson(res, 200, data);
      return;
    }

    if (req.method === "GET" && pathname === "/api/wishlist") {
      const data = await readWishlist();
      sendJson(res, 200, data);
      return;
    }

    if (req.method === "POST" && pathname === "/api/wishlist") {
      const raw = await readRequestBody(req);
      const payload = raw ? JSON.parse(raw) : {};
      const nextItem = normalizeItem(payload);

      if (!nextItem.itemName) {
        sendJson(res, 400, { error: "Item name is required." });
        return;
      }

      const data = await readWishlist();
      data.items.push(nextItem);
      const saved = await writeWishlist(data);
      sendJson(res, 201, saved);
      return;
    }

    if (req.method === "DELETE" && pathname.startsWith("/api/wishlist/")) {
      const id = decodeURIComponent(pathname.slice("/api/wishlist/".length));
      const data = await readWishlist();
      const nextItems = data.items.filter((item) => item.id !== id);
      const saved = await writeWishlist({ items: nextItems });
      sendJson(res, 200, saved);
      return;
    }

    if (req.method === "PUT" && pathname.startsWith("/api/wishlist/")) {
      const id = decodeURIComponent(pathname.slice("/api/wishlist/".length));
      const raw = await readRequestBody(req);
      const payload = raw ? JSON.parse(raw) : {};
      const data = await readWishlist();
      const index = data.items.findIndex((item) => item.id === id);

      if (index === -1) {
        sendJson(res, 404, { error: "Wishlist item not found." });
        return;
      }

      const updatedItem = normalizeUpdatedItem(data.items[index], payload);

      if (!updatedItem.itemName) {
        sendJson(res, 400, { error: "Item name is required." });
        return;
      }

      data.items[index] = updatedItem;
      const saved = await writeWishlist(data);
      sendJson(res, 200, saved);
      return;
    }

    sendText(res, 404, "Not found", "text/plain; charset=utf-8");
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error." });
  }
}

function createServer() {
  return http.createServer(handleRequest);
}

async function startServer() {
  await ensureWishlistFile();
  const server = createServer();
  server.listen(PORT, HOST, () => {
    console.log("Wishlist server running on http://" + HOST + ":" + PORT);
  });
  return server;
}

module.exports = {
  createServer,
  ensureWishlistFile,
  normalizeItem,
  normalizeUpdatedItem,
  readWishlist,
  startServer,
  writeWishlist
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
