import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../lib/prisma"
import { emailService } from "../../../lib/email-service"
import { isTomorrow } from "date-fns"

// This endpoint will be called by cron job to send daily email reminders
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Starting daily email reminder cron job...')

    // Get all users with their payments due tomorrow
    const users = await prisma.user.findMany({
      include: {
        subscriptions: {
          include: {
            payments: {
              where: {
                status: { in: ["PENDING", "OVERDUE"] }
              }
            }
          }
        }
      }
    })

    const emailResults = {
      totalUsers: users.length,
      emailsSent: 0,
      emailsFailed: 0,
      usersProcessed: 0,
      details: [] as any[]
    }

    for (const user of users) {
      if (!user.email) {
        console.log(`⚠️ User ${user.id} has no email address, skipping...`)
        continue
      }

      // Find payments due tomorrow for this user
      const paymentsDueTomorrow = user.subscriptions.flatMap(subscription => 
        subscription.payments.filter(payment => {
          const dueDate = new Date(payment.dueDate)
          return isTomorrow(dueDate)
        }).map(payment => ({
          ...payment,
          subscription
        }))
      )

      if (paymentsDueTomorrow.length === 0) {
        continue // No payments due tomorrow for this user
      }

      emailResults.usersProcessed++

      // Send email reminder for each payment due tomorrow
      for (const payment of paymentsDueTomorrow) {
        try {
          const emailSent = await emailService.sendPaymentNotification({
            userEmail: user.email,
            userName: user.name || undefined,
            payment: {
              id: payment.id,
              amount: Number(payment.amount),
              dueDate: payment.dueDate.toISOString(),
              status: payment.status as "PENDING" | "PAID" | "OVERDUE",
              subscription: {
                name: payment.subscription.name,
                currency: payment.subscription.currency,
                type: payment.subscription.type,
              },
            },
            notificationType: 'due_tomorrow',
          })

          if (emailSent) {
            emailResults.emailsSent++
            emailResults.details.push({
              userId: user.id,
              userEmail: user.email,
              paymentId: payment.id,
              subscriptionName: payment.subscription.name,
              amount: Number(payment.amount),
              currency: payment.subscription.currency,
              dueDate: payment.dueDate,
              status: 'sent'
            })
            
            console.log(`✅ Email sent to ${user.email} for ${payment.subscription.name} payment`)
          } else {
            emailResults.emailsFailed++
            emailResults.details.push({
              userId: user.id,
              userEmail: user.email,
              paymentId: payment.id,
              subscriptionName: payment.subscription.name,
              status: 'failed'
            })
            
            console.log(`❌ Failed to send email to ${user.email} for ${payment.subscription.name} payment`)
          }
        } catch (error) {
          emailResults.emailsFailed++
          emailResults.details.push({
            userId: user.id,
            userEmail: user.email,
            paymentId: payment.id,
            subscriptionName: payment.subscription.name,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          
          console.error(`💥 Error sending email to ${user.email}:`, error)
        }
      }
    }

    const summary = `📧 Daily email reminder job completed:
- Users checked: ${emailResults.totalUsers}
- Users with payments due tomorrow: ${emailResults.usersProcessed}
- Emails sent successfully: ${emailResults.emailsSent}
- Emails failed: ${emailResults.emailsFailed}`

    console.log(summary)

    return NextResponse.json({
      success: true,
      message: "Daily email reminder cron job completed successfully",
      timestamp: new Date().toISOString(),
      summary: emailResults
    })

  } catch (error) {
    console.error('💥 Error in daily email reminder cron job:', error)
    
    return NextResponse.json({
      success: false,
      error: "Failed to process daily email reminders",
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Optional: Add authentication for cron jobs if needed
// You can add a secret key check here for security:
// const authHeader = request.headers.get('authorization')
// if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
// }