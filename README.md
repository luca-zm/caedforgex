# CardForge AI

**CardForge AI** is a comprehensive card game creation engine powered by Google Gemini. It allows users to design cards with AI-generated art, build decks, and playtest custom rules in a sandbox environment.

This project is built as a **Progressive Web App (PWA)** hosted on **Cloudflare Pages**, utilizing **Cloudflare D1** (SQL Database) for game data and **Cloudflare R2** (Object Storage) for card images.

---

## 🚀 Deployment Guide (From GitHub to Cloudflare)

Follow these steps to deploy your own instance.

### Phase 1: GitHub Setup
1.  **Create a Repository**: Create a new public or private repository on GitHub.
2.  **Push Code**: Run the following commands in your local project folder to upload the code:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    git push -u origin main
    ```

### Phase 2: Cloudflare Resources Setup
Before deploying the app, you need to create the storage resources in Cloudflare.

1.  **Log in to Cloudflare Dashboard**.
2.  **Create Database (D1)**:
    *   Go to **Workers & Pages** > **D1**.
    *   Click **Create**.
    *   Name it `cardforge-db`.
    *   *Note*: You will need to bind this later.
3.  **Create Storage (R2)**:
    *   Go to **R2**.
    *   Click **Create Bucket**.
    *   Name it `cardforge-assets`.
    *   **Important**: Go to the bucket's **Settings** > **Public Access**.
    *   Enable **R2.dev subdomain** (or connect a custom domain).
    *   Copy the "Public R2.dev Bucket URL" (e.g., `https://pub-xxxxxxxx.r2.dev`). You will need this for the Environment Variables.

### Phase 3: Connect Pages to GitHub
1.  Go to **Workers & Pages** > **Create Application** > **Pages**.
2.  Select **Connect to Git**.
3.  Select the repository you created in Phase 1.
4.  **Build Settings**:
    *   **Framework Preset**: None / Create React App (either works as we serve static files + functions).
    *   **Build command**: (Leave empty).
    *   **Output directory**: (Leave empty or set to `/` if required).

### Phase 4: Configuration & Secrets (The ".env" part)
Cloudflare Pages does not use a `.env` file for production. You must set these in the Dashboard **before** the deployment finishes (or redeploy after setting them).

1.  In your Pages project, go to **Settings** > **Functions**.
2.  **Scroll to "R2 Bucket Bindings"**:
    *   **Variable Name**: `BUCKET` (Must be exactly this).
    *   **R2 Bucket**: Select `cardforge-assets`.
3.  **Scroll to "D1 Database Bindings"**:
    *   **Variable Name**: `DB` (Must be exactly this).
    *   **D1 Database**: Select `cardforge-db`.
4.  Go to **Settings** > **Environment Variables**:
    *   Add variable: `API_KEY` -> Your **Google Gemini API Key**.
    *   Add variable: `PUBLIC_R2_URL` -> The URL you copied in Phase 2 (e.g., `https://pub-xxxx.r2.dev`). **Do not** include a trailing slash.

### Phase 5: Initialize the Database (Make it Ready)
Your application is deployed, but the database is empty and will throw errors until tables are created.

1.  Go to **Workers & Pages** > **D1**.
2.  Click on your `cardforge-db`.
3.  Click on the **Console** tab.
4.  Open the file `schema.sql` from this repository.
5.  Copy the entire content of `schema.sql`.
6.  Paste it into the D1 Console command line and click **Execute**.
    *   *Success message: "Executed x commands".*

---

## 📲 How to Install (PWA)

This app is installable on Android and iOS.

1.  Open your deployed Cloudflare Pages URL on your mobile device.
2.  **Android (Chrome)**: Tap the menu (⋮) -> "Add to Home Screen" or "Install App".
3.  **iOS (Safari)**: Tap the Share button -> "Add to Home Screen".

## 🛠 Local Development

To run this locally with Cloudflare features mocked:

1.  Install Wrangler: `npm install -g wrangler`
2.  Login: `wrangler login`
3.  Run:
    ```bash
    wrangler pages dev . --d1 DB=cardforge-db --r2 BUCKET=cardforge-assets --binding API_KEY=your_key_here
    ```

---

<div align="center">

<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  <h1>Built with AI Studio</h2>

  <p>The fastest path from prompt to production with Gemini.</p>

  <a href="https://aistudio.google.com/apps">Start building</a>

</div>
