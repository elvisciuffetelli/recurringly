// This function runs when the application starts
export function initializeApplication() {
  console.log("🚀 Initializing Recurringly application...");

  // Note: Cron jobs are now handled by Vercel Cron Jobs (vercel.json)
  // No need to initialize node-cron in serverless environment

  console.log("✅ Application initialization completed!");
}

// Call this when the app starts (in development and production)
if (typeof window === "undefined") {
  // Only run on server side
  initializeApplication();
}
