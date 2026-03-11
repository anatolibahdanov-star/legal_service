import sgMail from '@sendgrid/mail';
import logger from "@/src/services/logger"
import {EmailDataI, EmailDataForgotI} from "@/src/interfaces/email"

// Set the SendGrid API key from environment variables
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function SendSendGridEmail(emailData: EmailDataI): Promise<boolean | null> {
  const msg = "SENDGRID SEND SendSendGridEmail - "
  if (!emailData.recipient || !emailData.username) {
    logger.error(msg + "Missing required fields", emailData)
    return null;
  }
  const templateId = process.env.SENDGRID_API_TPL ?? 'd-345899f3277849be87a032cc287e7acb'
  const verifiedEmail = process.env.SENDGRID_API_EMAIL ?? 'anatoli.bahdanov@gmail.com'

  const email = {
    to: emailData.recipient, // Recipient email address
    from: verifiedEmail, // Your verified sender email address
    templateId: templateId, // The ID of your SendGrid dynamic template
    dynamicTemplateData: {
      firstname: emailData.username, // Data for the {{firstName}} placeholder in your template
      lllms_url: emailData.url,
    },
  };

  try {
    await sgMail.send(email);
    logger.info(msg + "Email sent successfully", emailData)
    return true
  } catch (error) {
    logger.error(msg + "Error in sending email", (error as Error).message, emailData)
    return false
  }
}

export async function SendSendGridEmailForgot(emailData: EmailDataForgotI): Promise<boolean | null> {
  const msg = "SENDGRID SEND SendSendGridEmailForgot - "
  if (!emailData.recipient || !emailData.username || !emailData.password) {
    logger.error(msg + "Missing required fields", emailData)
    return null;
  }
  const templateId = process.env.SENDGRID_API_TPL_FORGOT ?? 'd-ece3bc8e46eb404aa2319b06c5308f64'
  const verifiedEmail = process.env.SENDGRID_API_EMAIL ?? 'anatoli.bahdanov@gmail.com'

  const email = {
    to: emailData.recipient, // Recipient email address
    from: verifiedEmail, // Your verified sender email address
    templateId: templateId, // The ID of your SendGrid dynamic template
    dynamicTemplateData: {
      firstname: emailData.username, // Data for the {{firstName}} placeholder in your template
      lllms_url: emailData.url,
      lllms_url_about: emailData.url_about,
      password: emailData.password,
    },
  };

  try {
    await sgMail.send(email);
    logger.info(msg + "Email sent successfully", emailData)
    return true
  } catch (error) {
    logger.error(msg + "Error in sending email", (error as Error).message, emailData)
    return false
  }
}