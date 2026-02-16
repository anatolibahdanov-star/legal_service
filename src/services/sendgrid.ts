import sgMail from '@sendgrid/mail';

// Set the SendGrid API key from environment variables
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export interface EmailDataI {
  recipient: string;
  username: string;
  url: string;
}

export default async function SendSendGridEmail(emailData: EmailDataI): Promise<boolean | null> {

  // Ensure required fields are present
  if (!emailData.recipient || !emailData.username) {
    console.error("(ERROR)SENDGRID SEND: Missing required fields", emailData)
    return null;
  }
  const templateId = process.env.SENDGRID_API_TPL ?? 'd-345899f3277849be87a032cc287e7acb'
  const verifiedEmail = process.env.SENDGRID_API_EMAIL ?? 'anatoli.bahdanov@gmail.com'

  const msg = {
    to: emailData.recipient, // Recipient email address
    from: verifiedEmail, // Your verified sender email address
    templateId: templateId, // The ID of your SendGrid dynamic template
    dynamicTemplateData: {
      firstname: emailData.username, // Data for the {{firstName}} placeholder in your template
      lllms_url: emailData.url,
    },
  };

  try {
    await sgMail.send(msg);
    console.log("Email sent successfully", emailData)
    return true
  } catch (error) {
    console.error("(ERROR)SENDGRID SEND: Missing required fields", (error as Error).message, emailData)
    return false
  }
}
