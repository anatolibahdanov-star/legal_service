import logger from "@/src/libs/logger"
import { format } from 'date-fns';
import { dFormat } from '@/src/interfaces/data';
import {EmailDataForgotI, EmailDataNewRequestI, EmailLawRatingDataI, EmailContactDataI, EmailPdfAttachmentI, EmailDataVerifyI, EmailDataVerifyNewI, EmailDataBalanceI, EmailDataBrandedI} from "@/src/interfaces/email"
import { getAdministrators } from '../../repositories/administrators/repo';
import { DBFilterAdministrators } from '../../interfaces/filters';
import { getAdminAdminUrl, getAdminContactUrl, getAdminQuestionUrl, getAdminUserUrl } from '../../helpers/tools';
import { sendEmail, EmailAttachment } from './transport';
import { readFileSync } from 'fs';
import { join } from 'path';

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

export async function sendForgotPasswordEmail(emailData: EmailDataForgotI): Promise<boolean | null> {
  const msg = "EMAIL SEND sendForgotPasswordEmail - "
  if (!emailData.recipient || !emailData.password) {
    logger.error(msg + "Missing required fields", { recipient: emailData.recipient })
    return null;
  }
  const loginUrl = emailData.url || (process.env.NEXTAUTH_URL ?? 'https://enki.legal')

  const ok = await sendEmail({
    to: emailData.recipient,
    subject: FORGOT_EMAIL_SUBJECT,
    text: buildForgotEmailText(emailData.recipient, emailData.password, loginUrl),
    html: buildForgotEmailHtml(emailData.recipient, emailData.password, loginUrl),
  })
  if (ok) {
    logger.info(msg + "Email sent successfully", { recipient: emailData.recipient })
  } else {
    logger.error(msg + "Error in sending email", { recipient: emailData.recipient })
  }
  return ok
}

const VERIFY_EMAIL_SUBJECT = 'Подтверждение email — Enki.legal';

const buildVerifyEmailText = (name: string, recipient: string, password: string, verifyUrl: string): string => {
  const greeting = name && name.trim() ? `Добрый день, ${name.trim()}!` : 'Добрый день!';
  return `${greeting}

Спасибо, что решили воспользоваться платформой Enki.legal.

Мы создали для вас аккаунт, чтобы вы могли получать профессиональные консультации от наших юристов, управлять своими вопросами и задавать дополнительные.

Ваши данные для входа:
Email: ${recipient}

Временный пароль: ${password}

Что нужно сделать дальше:
1. Перейдите по ссылке ниже и подтвердите свой email
2. Войдите в личный кабинет, используя email и временный пароль

Подтвердить email: ${verifyUrl}

После подтверждения email рекомендуем сменить временный пароль в настройках.

С уважением,
Команда Enki.legal
`;
};

const buildVerifyEmailHtml = (name: string, recipient: string, password: string, verifyUrl: string): string => {
  const greeting = name && name.trim() ? `Добрый день, ${escapeHtml(name.trim())}!` : 'Добрый день!';
  const safeEmail = escapeHtml(recipient);
  const safePassword = escapeHtml(password);
  const safeUrl = escapeHtml(verifyUrl);
  return `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${VERIFY_EMAIL_SUBJECT}</title>
  </head>
  <body style="margin:0; padding:0; background:#F5F7FA; font-family: Arial, Helvetica, sans-serif; color:#0F1B2D;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; background:#FFFFFF; border-radius:16px; padding:40px;">
            <tr>
              <td>
                <h1 style="margin:0 0 24px; font-size:22px; line-height:28px; color:#0F1B2D;">${greeting}</h1>
                <p style="margin:0 0 12px; font-size:15px; line-height:22px; color:#3a4452;">Спасибо, что решили воспользоваться платформой Enki.legal.</p>
                <p style="margin:0 0 24px; font-size:15px; line-height:22px; color:#3a4452;">Мы создали для вас аккаунт, чтобы вы могли получать профессиональные консультации от наших юристов, управлять своими вопросами и задавать дополнительные.</p>

                <div style="background:#EFE7D8; border-radius:12px; padding:20px; margin:0 0 24px;">
                  <p style="margin:0 0 12px; font-size:14px; color:#0F1B2D; font-weight:600;">Ваши данные для входа:</p>
                  <p style="margin:0 0 8px; font-size:15px; color:#0F1B2D;">Email: <strong>${safeEmail}</strong></p>
                  <p style="margin:0; font-size:15px; color:#0F1B2D;">Временный пароль: <strong style="font-family: 'Courier New', monospace; letter-spacing:0.5px;">${safePassword}</strong></p>
                </div>

                <p style="margin:0 0 12px; font-size:15px; line-height:22px; color:#0F1B2D; font-weight:600;">Что нужно сделать дальше:</p>
                <ol style="margin:0 0 24px; padding-left:20px; font-size:15px; line-height:22px; color:#3a4452;">
                  <li style="margin-bottom:6px;">Перейдите по ссылке ниже и подтвердите свой email</li>
                  <li>Войдите в личный кабинет, используя email и временный пароль</li>
                </ol>

                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 28px;">
                  <tr>
                    <td style="background:#5A8FB5; border-radius:12px;">
                      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:600; color:#FFFFFF; text-decoration:none;">Подтвердить email</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 8px; font-size:13px; line-height:20px; color:#6B7280;">После подтверждения email рекомендуем сменить временный пароль в настройках.</p>

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

export async function sendVerificationEmail(emailData: EmailDataVerifyI): Promise<boolean | null> {
  const msg = "EMAIL SEND sendVerificationEmail - "
  if (!emailData.recipient || !emailData.password || !emailData.url) {
    logger.error(msg + "Missing required fields", { recipient: emailData.recipient })
    return null;
  }
  const ok = await sendEmail({
    to: emailData.recipient,
    subject: VERIFY_EMAIL_SUBJECT,
    text: buildVerifyEmailText(emailData.username, emailData.recipient, emailData.password, emailData.url),
    html: buildVerifyEmailHtml(emailData.username, emailData.recipient, emailData.password, emailData.url),
  })
  if (ok) {
    logger.info(msg + "Email sent successfully", { recipient: emailData.recipient })
  } else {
    logger.error(msg + "Error in sending email", { recipient: emailData.recipient })
  }
  return ok
}

const VERIFY_NEW_EMAIL_SUBJECT = 'Подтвердите новый email на Enki.legal';

const buildVerifyNewEmailText = (name: string, verifyUrl: string): string => {
  const greeting = name && name.trim() ? `Добрый день, ${name.trim()}!` : 'Добрый день!';
  return `${greeting}

Вы изменили email в личном кабинете Enki.legal.

Чтобы продолжить получать ответы на email от профессиональных юристов, подтвердите новый email.

Подтвердить новый email: ${verifyUrl}

С уважением,
Команда Enki.legal
`;
};

const buildVerifyNewEmailHtml = (name: string, verifyUrl: string): string => {
  const greeting = name && name.trim() ? `Добрый день, ${escapeHtml(name.trim())}!` : 'Добрый день!';
  const safeUrl = escapeHtml(verifyUrl);
  return `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${VERIFY_NEW_EMAIL_SUBJECT}</title>
  </head>
  <body style="margin:0; padding:0; background:#F5F7FA; font-family: Arial, Helvetica, sans-serif; color:#0F1B2D;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; background:#FFFFFF; border-radius:16px; padding:40px;">
            <tr>
              <td>
                <h1 style="margin:0 0 24px; font-size:22px; line-height:28px; color:#0F1B2D;">${greeting}</h1>
                <p style="margin:0 0 12px; font-size:15px; line-height:22px; color:#3a4452;">Вы изменили email в личном кабинете Enki.legal.</p>
                <p style="margin:0 0 24px; font-size:15px; line-height:22px; color:#3a4452;">Чтобы продолжить получать ответы на email от профессиональных юристов, подтвердите новый email.</p>

                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 28px;">
                  <tr>
                    <td style="background:#5A8FB5; border-radius:12px;">
                      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:600; color:#FFFFFF; text-decoration:none;">Подтвердить новый email</a>
                    </td>
                  </tr>
                </table>

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

export async function sendVerifyNewEmail(emailData: EmailDataVerifyNewI): Promise<boolean | null> {
  const msg = "EMAIL SEND sendVerifyNewEmail - "
  if (!emailData.recipient || !emailData.url) {
    logger.error(msg + "Missing required fields", { recipient: emailData.recipient })
    return null;
  }
  const ok = await sendEmail({
    to: emailData.recipient,
    subject: VERIFY_NEW_EMAIL_SUBJECT,
    text: buildVerifyNewEmailText(emailData.username, emailData.url),
    html: buildVerifyNewEmailHtml(emailData.username, emailData.url),
  })
  if (ok) {
    logger.info(msg + "Email sent successfully", { recipient: emailData.recipient })
  } else {
    logger.error(msg + "Error in sending email", { recipient: emailData.recipient })
  }
  return ok
}

const buildNewRequestSubject = (isNew: boolean, id: string): string =>
  isNew ? `Новый вопрос №${id} — Enki.legal` : `Вопрос №${id} ожидает ответа — Enki.legal`

const buildNewRequestText = (
  adminName: string, userName: string, userEmail: string, id: string, siteUrl: string, editUrl: string, isNew: boolean,
): string => {
  const greeting = adminName && adminName.trim() ? `Здравствуйте, ${adminName.trim()}!` : 'Здравствуйте!'
  const lead = isNew
    ? `На платформе Enki.legal поступил новый вопрос №${id}.`
    : `Вопрос №${id} на платформе Enki.legal всё ещё ожидает ответа.`
  return `${greeting}

${lead}

Клиент: ${userName || '—'}
Email клиента: ${userEmail || '—'}

Открыть вопрос в админке: ${editUrl}
Платформа: ${siteUrl}

С уважением,
Команда Enki.legal
`
}

const buildNewRequestHtml = (
  adminName: string, userName: string, userEmail: string, id: string, siteUrl: string, editUrl: string, isNew: boolean,
): string => {
  const greeting = adminName && adminName.trim() ? `Здравствуйте, ${escapeHtml(adminName.trim())}!` : 'Здравствуйте!'
  const heading = isNew ? 'Новый вопрос' : 'Вопрос ожидает ответа'
  const lead = isNew
    ? `На платформе Enki.legal поступил новый вопрос №${escapeHtml(id)}.`
    : `Вопрос №${escapeHtml(id)} на платформе Enki.legal всё ещё ожидает ответа.`
  const safeUser = escapeHtml(userName) || '—'
  const safeEmail = escapeHtml(userEmail) || '—'
  const safeEdit = escapeHtml(editUrl)
  const safeSite = escapeHtml(siteUrl)
  return `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(buildNewRequestSubject(isNew, id))}</title>
  </head>
  <body style="margin:0; padding:0; background:#F5F7FA; font-family: Arial, Helvetica, sans-serif; color:#0F1B2D;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; background:#FFFFFF; border-radius:16px; padding:40px;">
            <tr>
              <td>
                <h1 style="margin:0 0 24px; font-size:22px; line-height:28px; color:#0F1B2D;">${heading}</h1>
                <p style="margin:0 0 12px; font-size:15px; line-height:22px; color:#3a4452;">${greeting}</p>
                <p style="margin:0 0 24px; font-size:15px; line-height:22px; color:#3a4452;">${lead}</p>

                <div style="background:#EFE7D8; border-radius:12px; padding:20px; margin:0 0 24px;">
                  <p style="margin:0 0 8px; font-size:15px; color:#0F1B2D;">Клиент: <strong>${safeUser}</strong></p>
                  <p style="margin:0; font-size:15px; color:#0F1B2D;">Email клиента: <strong>${safeEmail}</strong></p>
                </div>

                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 28px;">
                  <tr>
                    <td style="background:#5A8FB5; border-radius:12px;">
                      <a href="${safeEdit}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:600; color:#FFFFFF; text-decoration:none;">Открыть вопрос</a>
                    </td>
                  </tr>
                </table>

                <hr style="border:none; border-top:1px solid #E6EBF0; margin:24px 0;" />
                <p style="margin:0; font-size:13px; line-height:20px; color:#6B7280;">Платформа: <a href="${safeSite}" target="_blank" rel="noopener noreferrer" style="color:#5A8FB5;">${safeSite}</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export async function sendNewRequestEmail(emailData: EmailDataNewRequestI, isNew: boolean = true): Promise<boolean | null> {
  const msg = "EMAIL SEND sendNewRequestEmail - "
  if (!emailData.username) {
    logger.error(msg + "Missing required fields", emailData)
    return null;
  }
  const siteName = process.env.NEXTAUTH_URL ?? 'https://enki.legal'
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
    const ok = await sendEmail({
      to: admin.email,
      subject: buildNewRequestSubject(isNew, emailData.id),
      text: buildNewRequestText(admin.username, emailData.username, emailData.email, emailData.id, siteName, questionEditUrl, isNew),
      html: buildNewRequestHtml(admin.username, emailData.username, emailData.email, emailData.id, siteName, questionEditUrl, isNew),
    })
    if (ok) {
      logger.info(msg + "Email sent successfully", admin, emailData)
    } else {
      logger.error(msg + "Error in sending email", admin, emailData)
      allSuccess = false
    }
  }

  return allSuccess
}

export async function sendLowRatingEmail(emailData: EmailLawRatingDataI): Promise<boolean | null> {
  const contactEmail = process.env.CONTACT_EMAIL
  const subject = "Low rating received from Enki.Legal"
  const userUrl = `<a href="${getAdminUserUrl(emailData.user_id)}" target="_blank" rel="noopener noreferrer">${emailData.user_name}</a>`;
  const questionUrl = `<a href="${getAdminQuestionUrl(emailData.question_id)}" target="_blank" rel="noopener noreferrer">№${emailData.question_id}</a>`;
  const adminUrl = emailData.admin_id && emailData.user_name ? 
    `<a href="${getAdminAdminUrl(emailData.admin_id)}" target="_blank" rel="noopener noreferrer">${emailData.admin_name}</a>`: 
    'Нет Юриста назначенного на это дело';
  const lawyerText = emailData.admin_id && emailData.user_name ? emailData.admin_name : 'Нет юриста, назначенного на это дело'
  const text = `Получен новый низкий рейтинг ${emailData.question_rating} от пользователя ${emailData.user_name}.
Дело №${emailData.question_id}, юрист: ${lawyerText}.
Комментарий: ${emailData.question_rating_comment}
Дата: ${format((new Date(emailData.created_at)), dFormat)}.`
  const ok = await sendEmail({
    to: contactEmail as string,
    subject,
    text,
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
  })

  return ok
}

export async function sendContactEmail(emailData: EmailContactDataI): Promise<boolean | null> {
  const contactEmail = process.env.CONTACT_EMAIL
  const subject = "New contact request received from Enki.Legal"
  const userUrl = emailData.user_id && emailData.user_name ? 
    `<a href="${getAdminUserUrl(emailData.user_id)}" target="_blank" rel="noopener noreferrer">${emailData.user_name}</a>` :
    '';
  const contactUrl = `<a href="${getAdminContactUrl(emailData.id)}" target="_blank" rel="noopener noreferrer">№${emailData.id}</a>`;
  const fromWho = emailData.user_id && emailData.user_name ? emailData.user_name : ('E-mail ' + emailData.email)
  const text = `Получен новый запрос через контакт №${emailData.id} от пользователя ${fromWho}.
Телефон: ${emailData.phone}
E-mail: ${emailData.email}
Сообщение: ${emailData.message}
Дата: ${format((new Date(emailData.created_at)), dFormat)}.`
  const ok = await sendEmail({
    to: contactEmail as string,
    subject,
    text,
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
  })

  return ok
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
export async function sendPdfAttachmentEmail(
  emailData: EmailPdfAttachmentI,
): Promise<boolean> {
  const msg = "EMAIL SEND sendPdfAttachmentEmail - "
  if (!emailData.recipient) {
    logger.error(msg + "Missing recipient", { question_id: emailData.question_id })
    return false
  }
  if (!emailData.pdf || emailData.pdf.byteLength === 0) {
    logger.error(msg + "Empty PDF buffer", { question_id: emailData.question_id })
    return false
  }
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

  const ok = await sendEmail({
    to: emailData.recipient,
    subject,
    text: textBody,
    html: htmlBody,
    attachments: [
      {
        content: Buffer.from(emailData.pdf).toString('base64'),
        filename: emailData.filename,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  })
  if (ok) {
    logger.info(msg + "sent", {
      recipient: emailData.recipient,
      question_id: emailData.question_id,
      bytes: emailData.pdf.byteLength,
    })
  } else {
    logger.error(msg + "send failed", {
      recipient: emailData.recipient,
      question_id: emailData.question_id,
    })
  }
  return ok
}

const LOGO_CID = 'enkilogo'
let cachedLogoBase64: string | null | undefined
const brandLogoAttachment = (): EmailAttachment | null => {
  if (cachedLogoBase64 === undefined) {
    try {
      cachedLogoBase64 = readFileSync(join(process.cwd(), 'public', 'site', 'pdflogo.png')).toString('base64')
    } catch (error) {
      logger.error('EMAIL brand logo read failed', (error as Error).message)
      cachedLogoBase64 = null
    }
  }
  if (!cachedLogoBase64) return null
  return {
    content: cachedLogoBase64,
    filename: 'enki-logo.png',
    type: 'image/png',
    disposition: 'inline',
    contentId: LOGO_CID,
  }
}

const buildBrandedEmailText = (emailData: EmailDataBrandedI): string => {
  const cta = emailData.buttonLabel && emailData.buttonUrl
    ? `\n\n${emailData.buttonLabel}: ${emailData.buttonUrl}`
    : ''
  return `${emailData.subject}

${emailData.bodyText}${cta}

С уважением,
Команда enki.legal
`
}

// Turns plain http(s) URLs (already HTML-escaped) into clickable links so an
// inline {question_url}/{documents_url}/{payment_url} placeholder renders as a
// real hyperlink, not raw text.
const linkifyUrls = (escaped: string): string =>
  escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#5A8FB5; text-decoration:underline; word-break:break-all;">$1</a>'
  )

const buildBrandedBodyHtml = (bodyText: string): string => {
  const lines = bodyText.split('\n')
  const out: string[] = []
  for (const raw of lines) {
    const line = raw.trim()
    if (line === '') continue
    const safe = linkifyUrls(escapeHtml(line))
    if (line.startsWith('•')) {
      out.push(`<p style="margin:4px 0 4px 8px; font-size:15px; line-height:22px; color:#0F1B2D;">${safe}</p>`)
    } else {
      out.push(`<p style="margin:0 0 14px; font-size:15px; line-height:22px; color:#3a4452;">${safe}</p>`)
    }
  }
  return out.join('\n')
}

const buildBrandedEmailHtml = (emailData: EmailDataBrandedI): string => {
  const safeSubject = escapeHtml(emailData.subject)
  const bodyHtml = buildBrandedBodyHtml(emailData.bodyText)
  const button = emailData.buttonLabel && emailData.buttonUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:8px auto 28px;">
                  <tr>
                    <td style="background:#5A8FB5; border-radius:12px;">
                      <a href="${escapeHtml(emailData.buttonUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:600; color:#FFFFFF; text-decoration:none;">${escapeHtml(emailData.buttonLabel)}</a>
                    </td>
                  </tr>
                </table>`
    : ''
  return `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeSubject}</title>
  </head>
  <body style="margin:0; padding:0; background:#F5F7FA; font-family: Arial, Helvetica, sans-serif; color:#0F1B2D;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; background:#FFFFFF; border-radius:16px; padding:40px;">
            <tr>
              <td>
                <img src="cid:${LOGO_CID}" alt="enki.legal" width="160" style="display:block; height:auto; margin:0 0 28px;" />
                <h1 style="margin:0 0 24px; font-size:22px; line-height:28px; color:#0F1B2D;">${safeSubject}</h1>
                ${bodyHtml}
                ${button}
                <hr style="border:none; border-top:1px solid #E6EBF0; margin:24px 0;" />
                <p style="margin:0; font-size:13px; line-height:20px; color:#6B7280;">С уважением,<br />Команда enki.legal</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

/**
 * Sends a transactional notification wrapped in the shared branded HTML shell
 * (enki.legal logo header + body paragraphs + CTA button + footer).
 *
 * The copy (subject / body / button label) is resolved upstream from the
 * editable `email_template` rows. Returns `true` on success, `false` on any
 * SendGrid failure, `null` on missing required fields.
 */
export async function sendBrandedEmail(emailData: EmailDataBrandedI): Promise<boolean | null> {
  const msg = "EMAIL SEND sendBrandedEmail - "
  if (!emailData.recipient || !emailData.subject || !emailData.bodyText) {
    logger.error(msg + "Missing required fields", { recipient: emailData.recipient })
    return null
  }
  const logo = brandLogoAttachment()
  const ok = await sendEmail({
    to: emailData.recipient,
    subject: emailData.subject,
    text: buildBrandedEmailText(emailData),
    html: buildBrandedEmailHtml(emailData),
    ...(logo ? { attachments: [logo] } : {}),
  })
  if (ok) {
    logger.info(msg + "Email sent successfully", { recipient: emailData.recipient })
  } else {
    logger.error(msg + "Error in sending email", { recipient: emailData.recipient })
  }
  return ok
}

/**
 * Balance top-up notification (success or failure). Thin wrapper over the
 * shared branded sender — kept as a named entry point for balanceNotify.
 */
export async function sendBalanceEmail(emailData: EmailDataBalanceI): Promise<boolean | null> {
  return sendBrandedEmail(emailData)
}