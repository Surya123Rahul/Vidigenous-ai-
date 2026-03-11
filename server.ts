import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import session from "express-session";
import sessionFileStore from "session-file-store";

const FileStore = sessionFileStore(session);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("Starting VidiGenius Server...");

  let db: any;
  try {
    db = new Database("vidigenius.db");
    console.log("Database initialized successfully.");
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        mobile TEXT UNIQUE,
        name TEXT,
        avatar TEXT,
        credits INTEGER DEFAULT 5,
        tier TEXT DEFAULT 'Free'
      );
      CREATE TABLE IF NOT EXISTS social_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        provider TEXT,
        account_name TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS video_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        url TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        name TEXT,
        description TEXT,
        status TEXT,
        type TEXT,
        script TEXT,
        video_url TEXT,
        thumbnail TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS user_api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        provider TEXT,
        api_key TEXT,
        UNIQUE(user_id, provider),
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS usage_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT, -- 'api_call', 'generation', 'storage'
        amount INTEGER DEFAULT 1,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS unlocked_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        item_id TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, item_id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);
  } catch (err) {
    console.error("Database initialization failed:", err);
  }

  // Session configuration for iframe compatibility
  app.use(session({
    store: new FileStore({ path: './sessions' }),
    secret: 'vidigenius-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,      // Required for SameSite=None
      sameSite: 'none',  // Required for cross-origin iframe
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }));

  app.use(express.json({ limit: '50mb' }));
  
  // Add COOP/COEP headers for SharedArrayBuffer (required for ffmpeg.wasm)
  app.use((req, res, next) => {
    res.header("Cross-Origin-Embedder-Policy", "require-corp");
    res.header("Cross-Origin-Opener-Policy", "same-origin");
    next();
  });

  // Mock Session (In a real app, use express-session or JWT)
  // let currentUser: any = null; // Removed in favor of express-session

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Google Search Console Verification (MUST be before Vite/Static middleware)
  app.get("/googlee783eef80bc750ca.html", (req, res) => {
    res.set("Content-Type", "text/plain");
    res.send("google-site-verification: googlee783eef80bc750ca.html");
  });

  // Auth Endpoints
  app.post("/api/auth/google", (req, res) => {
    const { idToken, isSignUp } = req.body;
    
    if (!idToken) return res.status(400).json({ error: "No ID token provided" });

    let email = "";
    let name = "";
    let avatar = "";

    try {
      const payloadBase64 = idToken.split('.')[1];
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
      email = payload.email;
      name = payload.name || email.split('@')[0];
      avatar = payload.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;
    } catch (e) {
      console.error("JWT Decode error:", e);
      return res.status(400).json({ error: "Invalid token format" });
    }
    
    if (!email) return res.status(400).json({ error: "Email not found in token" });

    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    
    if (!user) {
      if (!isSignUp) {
        return res.status(404).json({ error: "Account not found. Please sign up first." });
      }
      db.prepare("INSERT INTO users (email, name, avatar) VALUES (?, ?, ?)").run(email, name, avatar);
      user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    }
    
    (req.session as any).user = user;
    res.json({ user });
  });

  app.post("/api/auth/mobile", (req, res) => {
    const { idToken, mobile, isSignUp } = req.body;
    
    if (!mobile) return res.status(400).json({ error: "Mobile number is required" });
    
    let user = db.prepare("SELECT * FROM users WHERE mobile = ?").get(mobile);
    
    if (!user) {
      if (!isSignUp) {
        return res.status(404).json({ error: "Account not found. Please sign up first." });
      }
      db.prepare("INSERT INTO users (mobile, name, avatar) VALUES (?, ?, ?)").run(mobile, `User ${mobile.slice(-4)}`, `https://api.dicebear.com/7.x/avataaars/svg?seed=${mobile}`);
      user = db.prepare("SELECT * FROM users WHERE mobile = ?").get(mobile);
    }
    
    (req.session as any).user = user;
    res.json({ user });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, mobile, name, isSignUp } = req.body;
    let user;
    if (email) {
      user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (!user) {
        if (!isSignUp) return res.status(404).json({ error: "Account not found" });
        db.prepare("INSERT INTO users (email, name, avatar) VALUES (?, ?, ?)").run(email, name || email.split('@')[0], `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`);
        user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      }
    } else if (mobile) {
      user = db.prepare("SELECT * FROM users WHERE mobile = ?").get(mobile);
      if (!user) {
        if (!isSignUp) return res.status(404).json({ error: "Account not found" });
        db.prepare("INSERT INTO users (mobile, name, avatar) VALUES (?, ?, ?)").run(mobile, `User ${mobile.slice(-4)}`, `https://api.dicebear.com/7.x/avataaars/svg?seed=${mobile}`);
        user = db.prepare("SELECT * FROM users WHERE mobile = ?").get(mobile);
      }
    }
    (req.session as any).user = user;
    res.json({ user });
  });

  app.post("/api/auth/demo", (req, res) => {
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get("demo@vidigenius.ai");
    if (!user) {
      db.prepare("INSERT INTO users (email, name, avatar, credits, tier) VALUES (?, ?, ?, ?, ?)")
        .run("demo@vidigenius.ai", "Demo User", "https://api.dicebear.com/7.x/avataaars/svg?seed=demo", 100, "Enterprise");
      user = db.prepare("SELECT * FROM users WHERE email = ?").get("demo@vidigenius.ai");
    }
    (req.session as any).user = user;
    res.json({ user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });

  app.get("/api/user/profile", (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    
    // Refresh user data from DB
    const freshUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
    const socialAccounts = db.prepare("SELECT * FROM social_accounts WHERE user_id = ?").all(user.id);
    const apiKeys = db.prepare("SELECT provider, api_key FROM user_api_keys WHERE user_id = ?").all(user.id);
    res.json({ ...freshUser, socialAccounts, apiKeys });
  });

  app.get("/api/user/usage", (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    
    const stats = db.prepare(`
      SELECT type, SUM(amount) as total 
      FROM usage_stats 
      WHERE user_id = ? 
      GROUP BY type
    `).all(user.id);

    const history = db.prepare(`
      SELECT strftime('%Y-%m-%d', timestamp) as date, SUM(amount) as total
      FROM usage_stats
      WHERE user_id = ? AND timestamp >= date('now', '-7 days')
      GROUP BY date
      ORDER BY date ASC
    `).all(user.id);

    res.json({ stats, history });
  });

  app.post("/api/user/usage/record", (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { type, amount } = req.body;
    db.prepare("INSERT INTO usage_stats (user_id, type, amount) VALUES (?, ?, ?)").run(user.id, type, amount || 1);
    res.json({ success: true });
  });

  app.post("/api/user/credits/update", (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { amount } = req.body;
    db.prepare("UPDATE users SET credits = credits + ? WHERE id = ?").run(amount, user.id);
    const updatedUser = db.prepare("SELECT credits FROM users WHERE id = ?").get(user.id);
    res.json({ success: true, credits: updatedUser.credits });
  });

  app.get("/api/user/marketplace/unlocked", (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const items = db.prepare("SELECT item_id FROM unlocked_items WHERE user_id = ?").all(user.id);
    res.json(items.map((i: any) => i.item_id));
  });

  app.post("/api/user/marketplace/unlock", (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { itemId, price } = req.body;
    
    const dbUser = db.prepare("SELECT credits FROM users WHERE id = ?").get(user.id);
    if (dbUser.credits < price) {
      return res.status(400).json({ error: "Insufficient credits" });
    }

    const transaction = db.transaction(() => {
      db.prepare("UPDATE users SET credits = credits - ? WHERE id = ?").run(price, user.id);
      db.prepare("INSERT INTO unlocked_items (user_id, item_id) VALUES (?, ?)").run(user.id, itemId);
    });

    try {
      transaction();
      const updatedUser = db.prepare("SELECT credits FROM users WHERE id = ?").get(user.id);
      res.json({ success: true, credits: updatedUser.credits });
    } catch (err) {
      res.status(500).json({ error: "Failed to unlock item" });
    }
  });

  app.post("/api/user/api-keys", (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { provider, apiKey } = req.body;
    db.prepare(`
      INSERT INTO user_api_keys (user_id, provider, api_key) 
      VALUES (?, ?, ?) 
      ON CONFLICT(user_id, provider) DO UPDATE SET api_key = excluded.api_key
    `).run(user.id, provider, apiKey);
    res.json({ success: true });
  });

  app.get("/api/user/history", (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const history = db.prepare("SELECT * FROM video_history WHERE user_id = ? ORDER BY timestamp DESC").all(user.id);
    res.json(history);
  });

  app.post("/api/user/history/add", (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { title, url } = req.body;
    db.prepare("INSERT INTO video_history (user_id, title, url) VALUES (?, ?, ?)").run(user.id, title, url);
    res.json({ success: true });
  });

  // Project Management Endpoints
  app.get("/api/projects", (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const projects = db.prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC").all(user.id);
    res.json(projects);
  });

  app.post("/api/projects", (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { id, name, description, status, type, script, video_url, thumbnail } = req.body;
    
    db.prepare(`
      INSERT INTO projects (id, user_id, name, description, status, type, script, video_url, thumbnail, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET 
        name = excluded.name,
        description = excluded.description,
        status = excluded.status,
        type = excluded.type,
        script = excluded.script,
        video_url = excluded.video_url,
        thumbnail = excluded.thumbnail,
        updated_at = CURRENT_TIMESTAMP
    `).run(id, user.id, name, description, status, type, script, video_url, thumbnail);
    
    res.json({ success: true });
  });

  app.delete("/api/projects/:id", (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { id } = req.params;
    db.prepare("DELETE FROM projects WHERE id = ? AND user_id = ?").run(id, user.id);
    res.json({ success: true });
  });

  // Veed.io Proxy Route
  app.post("/api/veed/subtitles", async (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    
    const { videoUrl } = req.body;
    
    // Check for user's custom API key
    const userKey = db.prepare("SELECT api_key FROM user_api_keys WHERE user_id = ? AND provider = 'veed'").get(user.id);
    const apiKey = userKey?.api_key || process.env.VEED_IO_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: "Veed.io API key is missing. Please add it in settings." });
    }

    try {
      const response = await fetch("https://api.veed.io/v1/subtitles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({ 
          video_url: videoUrl,
          options: {
            auto_generate: true,
            language: "en-US",
            output_format: "srt"
          }
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unknown API error" }));
        return res.status(response.status).json({ error: error.message || `Veed.io failed with status ${response.status}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Veed.io Proxy Error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.get("/api/veed/subtitles/:jobId", async (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    
    const { jobId } = req.params;
    const userKey = db.prepare("SELECT api_key FROM user_api_keys WHERE user_id = ? AND provider = 'veed'").get(user.id);
    const apiKey = userKey?.api_key || process.env.VEED_IO_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: "Veed.io API key is missing." });
    }

    try {
      const response = await fetch(`https://api.veed.io/v1/subtitles/${jobId}`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Failed to fetch status for job ${jobId}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // OAuth Endpoints
  app.get("/api/auth/url/:provider", (req, res) => {
    const { provider } = req.params;
    const redirectUri = `${process.env.APP_URL}/auth/callback`;
    
    let authUrl = "";
    const scopes = {
      google: "email profile",
      youtube: "https://www.googleapis.com/auth/youtube.upload",
      instagram: "user_profile,user_media",
      facebook: "email,public_profile",
      twitter: "tweet.read,users.read"
    };

    const clientIds = {
      google: process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
      youtube: process.env.YOUTUBE_CLIENT_ID || "YOUR_YOUTUBE_CLIENT_ID",
      instagram: process.env.INSTAGRAM_CLIENT_ID || "YOUR_INSTAGRAM_CLIENT_ID",
      facebook: process.env.FACEBOOK_CLIENT_ID || "YOUR_FACEBOOK_CLIENT_ID",
      twitter: process.env.TWITTER_CLIENT_ID || "YOUR_TWITTER_CLIENT_ID"
    };

    const baseUrls = {
      google: "https://accounts.google.com/o/oauth2/v2/auth",
      youtube: "https://accounts.google.com/o/oauth2/v2/auth",
      instagram: "https://api.instagram.com/oauth/authorize",
      facebook: "https://www.facebook.com/v12.0/dialog/oauth",
      twitter: "https://twitter.com/i/oauth2/authorize"
    };

    const baseUrl = baseUrls[provider as keyof typeof baseUrls];
    const clientId = clientIds[provider as keyof typeof clientIds];
    const scope = scopes[provider as keyof typeof scopes];

    if (baseUrl && clientId) {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: scope,
        state: provider // Use state to pass provider back to callback
      });
      authUrl = `${baseUrl}?${params.toString()}`;
    }
    
    res.json({ url: authUrl });
  });

  // OAuth Callback Handler
  app.get("/auth/callback", (req, res) => {
    const { code, state: provider } = req.query;
    const user = (req.session as any).user;
    
    if (user && provider) {
      // In a real app, you'd exchange the code for tokens here
      // For this demo, we'll simulate a successful connection
      const accountName = `${user.name}'s ${provider} account`;
      
      try {
        db.prepare(`
          INSERT INTO social_accounts (user_id, provider, account_name) 
          VALUES (?, ?, ?)
        `).run(user.id, provider, accountName);
      } catch (err) {
        console.error("Failed to save social account:", err);
      }
    }

    res.send(`
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #050505; color: white; margin: 0; }
            .card { background: #0a0a0a; padding: 2rem; border-radius: 1.5rem; border: 1px solid rgba(255,255,255,0.1); text-align: center; }
            .spinner { border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #10b981; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner"></div>
            <p>Authentication successful! Closing window...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: '${provider}' }, '*');
              setTimeout(() => window.close(), 1000);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  });

  app.get("/api/user/veed-key", (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const userKey = db.prepare("SELECT api_key FROM user_api_keys WHERE user_id = ? AND provider = 'veed'").get(user.id);
    res.json({ apiKey: userKey?.api_key || process.env.VEED_IO_API_KEY });
  });

  app.get("/api/user/veo-key", (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const userKey = db.prepare("SELECT api_key FROM user_api_keys WHERE user_id = ? AND provider = 'veo'").get(user.id);
    res.json({ apiKey: userKey?.api_key || process.env.GEMINI_API_KEY });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in DEVELOPMENT mode with Vite middleware.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running in PRODUCTION mode serving static files.");
    const distPath = path.join(__dirname, "dist");
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VidiGenius Server running on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
