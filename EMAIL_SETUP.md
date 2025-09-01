# Email Notification Setup

This guide will help you set up email notifications for payment reminders in MySubscriptions.

## Email Service Configuration

### Option 1: Gmail (Recommended for development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security > 2-Step Verification
   - App passwords > Generate app password
   - Select "Mail" and your device
   - Copy the generated password (16 characters)

3. **Add to your .env.local file**:
```env
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
```

### Option 2: Custom SMTP (For production)

You can use any SMTP service like SendGrid, Mailgun, or your own SMTP server:

```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

## Features

### Email Types
- **🚨 Overdue**: Red priority emails for payments that are past due
- **⏰ Due Today**: Orange priority emails for payments due today
- **📅 Due Tomorrow**: Yellow priority emails for payments due tomorrow
- **📆 Due Soon**: Blue priority emails for payments due within 7 days

### Email Templates
- Professional HTML templates with responsive design
- Color-coded by urgency level
- Payment details including amount, due date, and subscription info
- Branded with MySubscriptions styling

### Notification Options

#### Manual Email Sending
- Click the notification bell in the header
- Click "Email All" to send emails for all current notifications

#### API Endpoints
- `POST /api/notifications/email` - Send email for a specific payment
- `GET /api/notifications/email` - Send emails for all due payments

## Testing

### Test Email Connection
You can test your email configuration by calling the test endpoint:

```javascript
// In your browser console or API client
fetch('/api/notifications/email', { method: 'GET' })
  .then(res => res.json())
  .then(data => console.log(data))
```

### Environment Variables
Create or update your `.env.local` file with:

```env
# Email Configuration (Choose one option)

# Option 1: Gmail
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Option 2: Custom SMTP
# SMTP_HOST=smtp.your-provider.com
# SMTP_PORT=587
# SMTP_USER=your-username
# SMTP_PASSWORD=your-password
```

## Security Notes

1. **Never commit email credentials** to version control
2. **Use App Passwords** for Gmail, not your regular password
3. **Use environment variables** for all sensitive configuration
4. **Consider using a dedicated email service** for production (SendGrid, Mailgun, etc.)

## Troubleshooting

### Common Issues

1. **"Invalid login" error with Gmail**:
   - Make sure 2FA is enabled
   - Use App Password, not regular password
   - Check that the email address is correct

2. **Emails not sending**:
   - Check environment variables are set correctly
   - Verify SMTP settings
   - Check server logs for detailed error messages

3. **Emails going to spam**:
   - Use a dedicated email service for production
   - Set up SPF, DKIM, and DMARC records
   - Use a proper "from" email address

### Debug Mode
Check your server logs for detailed error messages. The email service logs all attempts and errors.

## Usage

### Automatic Notifications
The system automatically detects payment due dates and creates notifications. Users can then:

1. View notifications in the notification bell dropdown
2. Click "Email All" to send email reminders for all notifications
3. Individual notifications can be dismissed after emails are sent

### Manual Trigger
You can also trigger emails programmatically:

```javascript
// Send email for a specific payment
const response = await fetch('/api/notifications/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    paymentId: 'payment-id',
    notificationType: 'due_today' // or 'due_tomorrow', 'due_soon', 'overdue'
  })
})
```

## Next Steps

Consider setting up:
- **Cron jobs** for automatic daily email sending
- **Webhook integration** with calendar apps
- **SMS notifications** for urgent overdue payments
- **Email preferences** for users to customize notification timing