import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import logger from "@/src/libs/logger"
import { format } from 'date-fns';
import { dFormat } from '@/src/interfaces/data';
import {EmailDataI, EmailDataForgotI, EmailDataNewRequestI, EmailLawRatingDataI, EmailContactDataI} from "@/src/interfaces/email"
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

const FORGOT_EMAIL_SUBJECT = 'Новый временный пароль — Enki.legal';

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' :
    c === '<' ? '&lt;' :
    c === '>' ? '&gt;' :
    c === '"' ? '&quot;' : '&#39;'
  );

const buildForgotEmailText = (recipient: string, password: string, loginUrl: string): string => `Добрый день!

Вы запросили восстановление пароля на платформе Enki.legal.

Мы сгенерировали для вас новый временный пароль.

Ваши данные для входа:
Email: ${recipient}
Временный пароль: ${password}

Что нужно сделать дальше:
1. Войдите в личный кабинет, используя email и новый временный пароль
2. Перейдите в настройки и смените пароль на постоянный

Войти в личный кабинет: ${loginUrl}

После первого входа рекомендуем сразу сменить временный пароль в настройках безопасности.

С уважением,
Команда Enki.legal
`;

const buildForgotEmailHtml = (recipient: string, password: string, loginUrl: string): string => {
  const safeEmail = escapeHtml(recipient);
  const safePassword = escapeHtml(password);
  const safeUrl = escapeHtml(loginUrl);
  return `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${FORGOT_EMAIL_SUBJECT}</title>
  </head>
  <body style="margin:0; padding:0; background:#F5F7FA; font-family: Arial, Helvetica, sans-serif; color:#0F1B2D;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; background:#FFFFFF; border-radius:16px; padding:40px;">
            <tr>
              <td>
                <h1 style="margin:0 0 24px; font-size:22px; line-height:28px; color:#0F1B2D;">Добрый день!</h1>
                <p style="margin:0 0 12px; font-size:15px; line-height:22px; color:#3a4452;">Вы запросили восстановление пароля на платформе Enki.legal.</p>
                <p style="margin:0 0 24px; font-size:15px; line-height:22px; color:#3a4452;">Мы сгенерировали для вас новый временный пароль.</p>

                <div style="background:#EFE7D8; border-radius:12px; padding:20px; margin:0 0 24px;">
                  <p style="margin:0 0 12px; font-size:14px; color:#0F1B2D; font-weight:600;">Ваши данные для входа:</p>
                  <p style="margin:0 0 8px; font-size:15px; color:#0F1B2D;">Email: <strong>${safeEmail}</strong></p>
                  <p style="margin:0; font-size:15px; color:#0F1B2D;">Временный пароль: <strong style="font-family: 'Courier New', monospace; letter-spacing:0.5px;">${safePassword}</strong></p>
                </div>

                <p style="margin:0 0 12px; font-size:15px; line-height:22px; color:#0F1B2D; font-weight:600;">Что нужно сделать дальше:</p>
                <ol style="margin:0 0 24px; padding-left:20px; font-size:15px; line-height:22px; color:#3a4452;">
                  <li style="margin-bottom:6px;">Войдите в личный кабинет, используя email и новый временный пароль</li>
                  <li>Перейдите в настройки и смените пароль на постоянный</li>
                </ol>

                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 28px;">
                  <tr>
                    <td style="background:#5A8FB5; border-radius:12px;">
                      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:600; color:#FFFFFF; text-decoration:none;">Войти в личный кабинет</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 8px; font-size:13px; line-height:20px; color:#6B7280;">После первого входа рекомендуем сразу сменить временный пароль в настройках безопасности.</p>

                <hr style="border:none; border-top:1px solid #E6EBF0; margin:24px 0;" />
                <p style="margin:0; font-size:13px; line-height:20px; color:#6B7280;">С уважением,<br />Команда Enki.legal</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

export async function SendSendGridEmailForgot(emailData: EmailDataForgotI): Promise<boolean | null> {
  const msg = "SENDGRID SEND SendSendGridEmailForgot - "
  if (!emailData.recipient || !emailData.password) {
    logger.error(msg + "Missing required fields", { recipient: emailData.recipient })
    return null;
  }
  const verifiedEmail = process.env.SENDGRID_API_EMAIL ?? 'anatoli.bahdanov@gmail.com'
  const loginUrl = emailData.url || (process.env.NEXTAUTH_URL ?? 'https://enki.legal')

  const email = {
    to: emailData.recipient,
    from: verifiedEmail,
    subject: FORGOT_EMAIL_SUBJECT,
    text: buildForgotEmailText(emailData.recipient, emailData.password, loginUrl),
    html: buildForgotEmailHtml(emailData.recipient, emailData.password, loginUrl),
  };

  try {
    await sgMail.send(email);
    logger.info(msg + "Email sent successfully", { recipient: emailData.recipient })
    return true
  } catch (error) {
    logger.error(msg + "Error in sending email", (error as Error).message, { recipient: emailData.recipient })
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