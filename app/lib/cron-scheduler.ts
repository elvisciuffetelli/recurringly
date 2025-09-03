import cron from "node-cron";

class CronScheduler {
  private jobs: Map<string, any> = new Map();


  // Schedule email notifications at 9:00 AM every day
  startEmailNotifications() {
    const cronExpression = "0 9 * * *"; // 9:00 AM every day
    // For testing: '*/2 * * * *' // Every 2 minutes

    console.log("🕘 Scheduling email notifications for 9:00 AM every day...");

    const task = cron.schedule(
      cronExpression,
      async () => {
        console.log("📧 Running email notification cron job...");

        try {
          // Call our API endpoint to process all email notifications
          const response = await fetch(
            `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/cron/email-notifications`,
          );

          if (response.ok) {
            const result = await response.json();
            console.log(
              "✅ Email notifications completed successfully:",
              result.summary,
            );
          } else {
            const error = await response.json();
            console.error("❌ Email notifications failed:", error);
          }
        } catch (error) {
          console.error(
            "💥 Error calling email notification endpoint:",
            error,
          );
        }
      },
      {
        timezone: "Europe/Rome", // Change to your timezone
      },
    );

    this.jobs.set("email-notifications", task);

    // Start the cron job
    task.start();

    console.log("✅ Email notification cron job scheduled and started!");

    return task;
  }

  // Stop a specific cron job
  stopJob(jobName: string) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      job.destroy();
      this.jobs.delete(jobName);
      console.log(`🛑 Stopped cron job: ${jobName}`);
    }
  }

  // Stop all cron jobs
  stopAllJobs() {
    console.log("🛑 Stopping all cron jobs...");
    this.jobs.forEach((job, name) => {
      job.stop();
      job.destroy();
      console.log(`   Stopped: ${name}`);
    });
    this.jobs.clear();
    console.log("✅ All cron jobs stopped");
  }

  // Get status of all jobs
  getJobStatus() {
    const status: Record<string, boolean> = {};
    this.jobs.forEach((job, name) => {
      status[name] = job.running;
    });
    return status;
  }

  // Start all scheduled jobs
  startAllJobs() {
    console.log("🚀 Starting email notification cron jobs...");

    // Only start in production or when explicitly enabled
    if (
      process.env.NODE_ENV === "production" ||
      process.env.ENABLE_CRON === "true"
    ) {
      this.startEmailNotifications();

      console.log("✅ Email notification cron job started!");
    } else {
      console.log(
        "ℹ️  Cron jobs disabled in development. Set ENABLE_CRON=true to enable.",
      );
    }
  }
}

// Export singleton instance
export const cronScheduler = new CronScheduler();

// Helper function to initialize cron jobs
export function initializeCronJobs() {
  cronScheduler.startAllJobs();
}

// Helper function for testing cron job manually
export async function testEmailNotifications() {
  console.log("🧪 Testing email notifications...");
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/cron/email-notifications`,
    );
    const result = await response.json();
    console.log("Test result:", result);
    return result;
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  }
}
