import { initializeCronJobs } from './cron-scheduler'

// This function runs when the application starts
export function initializeApplication() {
  console.log('🚀 Initializing MySubscriptions application...')
  
  // Start cron jobs for automatic email reminders
  initializeCronJobs()
  
  console.log('✅ Application initialization completed!')
}

// Call this when the app starts (in development and production)
if (typeof window === 'undefined') {
  // Only run on server side
  initializeApplication()
}