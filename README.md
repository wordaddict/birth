# For Oluwatosin

This version uses a tiny Node.js server so wishlist items are saved into a real local file: `wishlist.json`.

## Files

- `index.html` - the public page and the private admin page UI
- `server.js` - the tiny Node server
- `wishlist.json` - the saved wishlist data
- `assets/oluwatosin-hero.jpeg` - the featured photo

## Run locally

```bash
npm start
```

Then open:

- `http://localhost:3000/` for the public page
- `http://localhost:3000/admin` for your quiet admin view

## Environment variables

The server now loads `.env` automatically with `dotenv`.

Example:

```bash
cp .env.example .env
```

Supported values:

- `PORT`
- `HOST`

## How it works

- The public page only shows the romantic microsite and the add-wishlist form
- Submissions are saved by the Node server into `wishlist.json`
- The admin view at `/admin` shows the saved list and lets you remove items
- The raw JSON is also available at `http://localhost:3000/data/wishlist.json`

## Deploy simply

This is lightweight enough for small Node hosts like:

- Render
- Railway
- Fly.io

Deploy command:

```bash
npm start
```

## Notes

- There is no database
- There is no external service
- Data persistence depends on the host keeping `wishlist.json` on disk
- If you deploy to a platform with ephemeral storage, you will need a host that preserves the filesystem between restarts
# birthday
# birthday
# birthday
