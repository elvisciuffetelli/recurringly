import { format } from "date-fns";
import nodemailer from "nodemailer";

interface Payment {
  id: string;
  amount: number;
  dueDate: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  subscription: {
    name: string;
    currency: string;
    type: string;
  };
}

interface EmailNotificationData {
  userEmail: string;
  userName?: string;
  payment: Payment;
  notificationType: "due_today" | "due_tomorrow" | "due_soon" | "overdue";
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure your email service here
    // For development, you can use Gmail, SendGrid, or Resend
    this.transporter = nodemailer.createTransport({
      // Gmail configuration (you'll need to use App Password)
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      // Alternative: Use SMTP configuration
      // host: process.env.SMTP_HOST,
      // port: parseInt(process.env.SMTP_PORT || '587'),
      // secure: false,
      // auth: {
      //   user: process.env.SMTP_USER,
      //   pass: process.env.SMTP_PASSWORD,
      // },
    });
  }

  private formatCurrency(amount: number, currency: string = "EUR") {
    if (Number.isNaN(amount) || !Number.isFinite(amount)) {
      amount = 0;
    }

    // Simple deterministic formatting to avoid hydration issues
    const formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formatted} €`;
  }

  private getEmailTemplate(data: EmailNotificationData) {
    const { payment, notificationType, userName = "gentile utente" } = data;
    const amount = this.formatCurrency(
      payment.amount,
      payment.subscription.currency,
    );
    const dueDate = format(new Date(payment.dueDate), "MMMM dd, yyyy");

    const templates = {
      due_today: {
        subject: `💰 Pagamento in scadenza oggi: ${payment.subscription.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Pagamento in scadenza oggi</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Promemoria Recurringly</p>
            </div>
            
            <div style="background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Ciao ${userName},</p>
              
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h2 style="color: #dc2626; margin: 0 0 10px 0; font-size: 20px;">🚨 Pagamento in scadenza oggi</h2>
                <p style="margin: 0; color: #7f1d1d; font-size: 16px;">
                  Il tuo pagamento di <strong>${amount}</strong> per <strong>${payment.subscription.name}</strong> è in scadenza oggi.
                </p>
              </div>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #374151;">Dettagli Pagamento:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Servizio:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${payment.subscription.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Importo:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${amount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Scadenza:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${dueDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Tipo:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${payment.subscription.type}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                Don't forget to mark this payment as paid in your Recurringly dashboard once you've processed it.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 12px;">
              <p>Questa email è stata inviata da Recurringly. La ricevi perché hai abilitato le notifiche di pagamento.</p>
            </div>
          </div>
        `,
      },
      due_tomorrow: {
        subject: `⏰ Pagamento in scadenza domani: ${payment.subscription.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Pagamento in scadenza domani</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Promemoria Recurringly</p>
            </div>
            
            <div style="background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Hi ${userName},</p>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h2 style="color: #d97706; margin: 0 0 10px 0; font-size: 20px;">⏰ Pagamento in scadenza domani</h2>
                <p style="margin: 0; color: #92400e; font-size: 16px;">
                  Il tuo pagamento di <strong>${amount}</strong> per <strong>${payment.subscription.name}</strong> è in scadenza domani.
                </p>
              </div>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #374151;">Dettagli Pagamento:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Servizio:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${payment.subscription.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Importo:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${amount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Scadenza:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${dueDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Tipo:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${payment.subscription.type}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                Questo è un promemoria amichevole per aiutarti a tenere sotto controllo i tuoi abbonamenti.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 12px;">
              <p>Questa email è stata inviata da Recurringly. La ricevi perché hai abilitato le notifiche di pagamento.</p>
            </div>
          </div>
        `,
      },
      due_soon: {
        subject: `📅 Pagamento in arrivo: ${payment.subscription.name} (Scadenza ${dueDate})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Pagamento in arrivo</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Promemoria Recurringly</p>
            </div>
            
            <div style="background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Hi ${userName},</p>
              
              <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h2 style="color: #1d4ed8; margin: 0 0 10px 0; font-size: 20px;">📅 Pagamento in arrivo</h2>
                <p style="margin: 0; color: #1e40af; font-size: 16px;">
                  Il tuo pagamento di <strong>${amount}</strong> per <strong>${payment.subscription.name}</strong> è in scadenza il ${dueDate}.
                </p>
              </div>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #374151;">Dettagli Pagamento:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Servizio:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${payment.subscription.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Importo:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${amount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Scadenza:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${dueDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Tipo:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${payment.subscription.type}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                Questo è un avviso amichevole per aiutarti a pianificare in anticipo.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 12px;">
              <p>Questa email è stata inviata da Recurringly. La ricevi perché hai abilitato le notifiche di pagamento.</p>
            </div>
          </div>
        `,
      },
      overdue: {
        subject: `🚨 IN RITARDO: Pagamento ${payment.subscription.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Pagamento in ritardo</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Avviso Recurringly</p>
            </div>
            
            <div style="background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Hi ${userName},</p>
              
              <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h2 style="color: #dc2626; margin: 0 0 10px 0; font-size: 20px;">🚨 Pagamento in ritardo</h2>
                <p style="margin: 0; color: #7f1d1d; font-size: 16px;">
                  Il tuo pagamento di <strong>${amount}</strong> per <strong>${payment.subscription.name}</strong> era in scadenza il ${dueDate} ed è ora in ritardo.
                </p>
              </div>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #374151;">Dettagli Pagamento:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Servizio:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${payment.subscription.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Importo:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${amount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Scadenza:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${dueDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Tipo:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${payment.subscription.type}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                Si prega di elaborare questo pagamento il prima possibile per evitare interruzioni del servizio.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 12px;">
              <p>Questa email è stata inviata da Recurringly. La ricevi perché hai abilitato le notifiche di pagamento.</p>
            </div>
          </div>
        `,
      },
    };

    return templates[notificationType];
  }

  async sendPaymentNotification(data: EmailNotificationData): Promise<boolean> {
    try {
      const template = this.getEmailTemplate(data);

      const mailOptions = {
        from: {
          name: "Recurringly",
          address: process.env.SMTP_USER || "noreply@mysubscriptions.app",
        },
        to: data.userEmail,
        subject: template.subject,
        html: template.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(
        `Email inviata con successo a ${data.userEmail}:`,
        result.messageId,
      );
      return true;
    } catch (error) {
      console.error("Impossibile inviare email:", error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("Connessione servizio email verificata");
      return true;
    } catch (error) {
      console.error("Connessione servizio email fallita:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export type { EmailNotificationData };
