import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import logger from "@/src/libs/logger"
import { format } from 'date-fns';
import { dFormat } from '@/src/interfaces/data';
import {EmailDataI, EmailDataForgotI, EmailDataNewRequestI, EmailLawRatingDataI, EmailContactDataI, EmailPdfAttachmentI} from "@/src/interfaces/email"
import { getAdministrators } from '../repositories/administrators/repo';
import { DBFilterAdministrators } from '../interfaces/filters';
import { getAdminAdminUrl, getAdminContactUrl, getAdminQuestionUrl, getAdminUserUrl } from '../helpers/tools';

// Set the SendGrid API key from environment variables
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true for port 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    // This allows the connection to a server with a self-signed certificate
    rejectUnauthorized: false 
  }
});

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

export async function SendSendGridEmailNewRequest(emailData: EmailDataNewRequestI, isNew: boolean = true): Promise<boolean | null> {
  const msg = "SENDGRID SEND SendSendGridEmailNewRequest - "
  if (!emailData.username) {
    logger.error(msg + "Missing required fields", emailData)
    return null;
  }
  const siteName = process.env.NEXTAUTH_URL ?? 'https://enki.legal'
  const templateId = isNew ? (process.env.SENDGRID_API_TPL_NREQUEST ?? 'd-909ede094aa942d884651db0d12a9b65') :
    (process.env.SENDGRID_API_TPL_LREQUEST ?? 'd-27af5327e4bc48cba0d58711277096a4')
  const verifiedEmail = process.env.SENDGRID_API_EMAIL ?? 'anatoli.bahdanov@gmail.com'
  const questionEditUrl = siteName + '/en/admin#/requests/' + emailData.id

  const adminFilter: DBFilterAdministrators = {status: 1}
  if(emailData.admin_id) {
    adminFilter.id = emailData.admin_id
  }
  const admins = await getAdministrators("1", "100", ['id', 'DESC'], adminFilter)
  if (admins === null) {
    logger.error(msg + "Can't find administrators", emailData)
    return null;
  }

  let allSuccess = true
  for (const admin of admins) {
    const email = {
      to: admin.email, // Recipient email address
      from: verifiedEmail, // Your verified sender email address
      templateId: templateId, // The ID of your SendGrid dynamic template
      dynamicTemplateData: {
        firstname: admin.username,
        user_firstname: emailData.username,
        user_email: emailData.email,
        user_request_id: emailData.id,
        lllms_url: siteName,
        lllms_url_edit: questionEditUrl,
      },
    };

    try {
      await sgMail.send(email);
      logger.info(msg + "Email sent successfully", admin, emailData)
    } catch (error) {
      logger.error(msg + "Error in sending email", (error as Error).message, admin, emailData)
      allSuccess = false
    }
  }

  return allSuccess
}

export async function sendEmailLowRating(emailData: EmailLawRatingDataI): Promise<boolean | null> {
  const contactEmail = process.env.CONTACT_EMAIL
  const subject = "Low rating received from Enki.Legal"
  const userUrl = `<a href="${getAdminUserUrl(emailData.user_id)}" target="_blank" rel="noopener noreferrer">${emailData.user_name}</a>`;
  const questionUrl = `<a href="${getAdminQuestionUrl(emailData.question_id)}" target="_blank" rel="noopener noreferrer">№${emailData.question_id}</a>`;
  const adminUrl = emailData.admin_id && emailData.user_name ? 
    `<a href="${getAdminAdminUrl(emailData.admin_id)}" target="_blank" rel="noopener noreferrer">${emailData.admin_name}</a>`: 
    'Нет Юриста назначенного на это дело';
  let result = false
  try {
    const info = await transporter.sendMail({
      from: `"Sender Name" <${process.env.SMTP_USER}>`,
      to: contactEmail,
      subject: subject,
      html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
            <h1 style="color: #333;">Получен новый низкий рэйтинг <b>${emailData.question_rating}</b> от пользователя ${userUrl}</h1>
            <p>Низкий рэйтинг был выставлен делу с номером ${questionUrl}, которое ведет юрист ${adminUrl}</p>
            <p>Комментарий от пользователя: <b>${emailData.question_rating_comment}</b></p>
            <p>Дата от ${format((new Date(emailData.created_at)), dFormat)}.</p>
            <hr />
            <footer style="font-size: 0.8em; color: #777;">Отправлено от ENKI.LEGAL</footer>
          </div>
        `,
    });
    console.log("Result of sending sendEmailLowRating - ", info, emailData)
    result = info.messageId ? true : false
  } catch (error) {
    console.error('Error sending email:', error);
  }
  

  return result
}

export async function sendEmailContact(emailData: EmailContactDataI): Promise<boolean | null> {
  const contactEmail = process.env.CONTACT_EMAIL
  const subject = "New contact request received from Enki.Legal"
  const userUrl = emailData.user_id && emailData.user_name ? 
    `<a href="${getAdminUserUrl(emailData.user_id)}" target="_blank" rel="noopener noreferrer">${emailData.user_name}</a>` :
    '';
  const contactUrl = `<a href="${getAdminContactUrl(emailData.id)}" target="_blank" rel="noopener noreferrer">№${emailData.id}</a>`;
  let result = false
  try {
    const info = await transporter.sendMail({
      from: `"Sender Name" <${process.env.SMTP_USER}>`,
      to: contactEmail,
      subject: subject,
      html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
            <h1 style="color: #333;">Получен новый запрос через контакт <b>${contactUrl}</b> от пользователя ${emailData.user_id ? userUrl : ('c E-mail ' + emailData.email)}</h1>
            <p>Телефон пользователя: <b>${emailData.phone}</b></p>
            <p>E-mail пользователя: <b>${emailData.email}</b></p>
            <p>Сообщение от пользователя: <b>${emailData.message}</b></p>
            <p>Дата от ${format((new Date(emailData.created_at)), dFormat)}.</p>
            <hr />
            <footer style="font-size: 0.8em; color: #777;">Отправлено от ENKI.LEGAL</footer>
          </div>
        `,
    });
    console.log("Result of sending sendEmailContact - ", info, emailData)
    result = info.messageId ? true : false
  } catch (error) {
    console.error('Error sending email:', error);
  }

  return result
}

/**
 * Sends the lawyer's PDF answer to the user as an attachment via SendGrid.
 *
 * The body wording is fixed by product requirements — no SendGrid dynamic
 * template is used so we can keep the exact copy in one place.
 *
 * Returns `true` on success, `false` on any SendGrid / network failure.
 * Errors are logged via the shared winston logger; the caller decides how to
 * surface them to the end user.
 */
export async function SendSendGridPdfAttachment(
  emailData: EmailPdfAttachmentI,
): Promise<boolean> {
  const msg = "SENDGRID SEND SendSendGridPdfAttachment - "
  if (!emailData.recipient) {
    logger.error(msg + "Missing recipient", { question_id: emailData.question_id })
    return false
  }
  if (!emailData.pdf || emailData.pdf.byteLength === 0) {
    logger.error(msg + "Empty PDF buffer", { question_id: emailData.question_id })
    return false
  }
  const verifiedEmail = process.env.SENDGRID_API_EMAIL ?? 'anatoli.bahdanov@gmail.com'

  const subject = `Ответ юриста на ваш вопрос — Enki.legal`
  const textBody = [
    'Добрый день!',
    '',
    'Во вложении находится PDF-документ с ответом юриста на платформе Enki.legal.',
    '',
    `Тема вопроса: ${emailData.question_subject || '—'}`,
    `Дата обращения: ${emailData.question_date || '—'}`,
    '',
    'С уважением,',
    'Команда Enki.legal',
  ].join('\n')
  const htmlBody = `
    <div style="font-family: sans-serif; font-size: 14px; line-height: 1.5; color: #29282b;">
      <p>Добрый день!</p>
      <p>Во вложении находится PDF-документ с ответом юриста на платформе Enki.legal.</p>
      <p>
        <strong>Тема вопроса:</strong> ${escapeHtml(emailData.question_subject) || '—'}<br/>
        <strong>Дата обращения:</strong> ${escapeHtml(emailData.question_date) || '—'}
      </p>
      <p>С уважением,<br/>Команда Enki.legal</p>
    </div>
  `

  const email = {
    to: emailData.recipient,
    from: verifiedEmail,
    subject,
    text: textBody,
    html: htmlBody,
    attachments: [
      {
        content: Buffer.from(emailData.pdf).toString('base64'),
        filename: emailData.filename,
        type: 'application/pdf',
        disposition: 'attachment' as const,
      },
    ],
  }

  try {
    await sgMail.send(email)
    logger.info(msg + "sent", {
      recipient: emailData.recipient,
      question_id: emailData.question_id,
      bytes: emailData.pdf.byteLength,
    })
    return true
  } catch (error) {
    logger.error(msg + "send failed", {
      recipient: emailData.recipient,
      question_id: emailData.question_id,
      error: (error as Error).message,
    })
    return false
  }
}

function escapeHtml(value: string): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}