import cron from 'node-cron'

class CronScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map()

  // Schedule daily email reminders at 9:00 AM every day
  startDailyEmailReminders() {
    const cronExpression = '0 9 * * *' // 9:00 AM every day
    // For testing: '*/2 * * * *' // Every 2 minutes
    
    console.log('🕘 Scheduling daily email reminders for 9:00 AM every day...')
    
    const task = cron.schedule(cronExpression, async () => {
      console.log('🔔 Running daily email reminder cron job...')
      
      try {
        // Call our API endpoint to process email reminders
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/daily-email-reminders`)
        
        if (response.ok) {
          const result = await response.json()
          console.log('✅ Daily email reminders completed successfully:', result.summary)
        } else {
          const error = await response.json()
          console.error('❌ Daily email reminders failed:', error)
        }
      } catch (error) {
        console.error('💥 Error calling daily email reminder endpoint:', error)
      }
    }, {
      scheduled: false, // Don't start immediately
      timezone: 'Europe/Rome' // Change to your timezone
    })

    this.jobs.set('daily-email-reminders', task)
    
    // Start the cron job
    task.start()
    
    console.log('✅ Daily email reminder cron job scheduled and started!')
    
    return task
  }

  // Schedule overdue payment alerts at 10:00 AM every day
  startOverduePaymentAlerts() {
    const cronExpression = '0 10 * * *' // 10:00 AM every day
    
    console.log('🕙 Scheduling overdue payment alerts for 10:00 AM every day...')
    
    const task = cron.schedule(cronExpression, async () => {
      console.log('🚨 Running overdue payment alert cron job...')
      
      try {
        // Call the existing email API but only for overdue payments
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications/email?type=overdue`)
        
        if (response.ok) {
          const result = await response.json()
          console.log('✅ Overdue payment alerts completed:', result)
        } else {
          console.error('❌ Overdue payment alerts failed')
        }
      } catch (error) {
        console.error('💥 Error in overdue payment alerts:', error)
      }
    }, {
      scheduled: false,
      timezone: 'Europe/Rome'
    })

    this.jobs.set('overdue-alerts', task)
    task.start()
    
    console.log('✅ Overdue payment alert cron job scheduled and started!')
    
    return task
  }

  // Stop a specific cron job
  stopJob(jobName: string) {
    const job = this.jobs.get(jobName)
    if (job) {
      job.stop()
      job.destroy()
      this.jobs.delete(jobName)
      console.log(`🛑 Stopped cron job: ${jobName}`)
    }
  }

  // Stop all cron jobs
  stopAllJobs() {
    console.log('🛑 Stopping all cron jobs...')
    this.jobs.forEach((job, name) => {
      job.stop()
      job.destroy()
      console.log(`   Stopped: ${name}`)
    })
    this.jobs.clear()
    console.log('✅ All cron jobs stopped')
  }

  // Get status of all jobs
  getJobStatus() {
    const status: Record<string, boolean> = {}
    this.jobs.forEach((job, name) => {
      status[name] = job.running
    })
    return status
  }

  // Start all scheduled jobs
  startAllJobs() {
    console.log('🚀 Starting email reminder cron jobs...')
    
    // Only start in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
      this.startDailyEmailReminders()
      this.startOverduePaymentAlerts()
      
      console.log('✅ All cron jobs started!')
    } else {
      console.log('ℹ️  Cron jobs disabled in development. Set ENABLE_CRON=true to enable.')
    }
  }
}

// Export singleton instance
export const cronScheduler = new CronScheduler()

// Helper function to initialize cron jobs
export function initializeCronJobs() {
  cronScheduler.startAllJobs()
}

// Helper function for testing cron job manually
export async function testDailyEmailReminders() {
  console.log('🧪 Testing daily email reminders...')
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/daily-email-reminders`)
    const result = await response.json()
    console.log('Test result:', result)
    return result
  } catch (error) {
    console.error('Test failed:', error)
    throw error
  }
}