import logger from "@/src/libs/logger"
import { getUsersWithUnpaidReminder, markUserUnpaidReminded } from "@/src/repositories/requests/repo"
import { notifyUnpaidReminder } from "@/src/services/unpaidReminderNotify"
import { getSettingBool, getSettingInt } from "@/src/services/settings"

const msgGlobal = "CRON unpaidReminder - "

let isRunning = false

const paymentUrl = (): string => {
    const base = (process.env.NEXT_PUBLIC_URL ?? process.env.NEXTAUTH_URL ?? "https://enki.legal").replace(/\/+$/, "")
    return `${base}/admin#/profile`
}

/**
 * Sends a single "you have an unpaid question — top up your balance" reminder
 * to each user who has at least one Unpaid, not-yet-reminded question.
 *
 * One email per user (even with several unpaid questions). After sending, the
 * user's current Unpaid questions are flipped to reminder_sent=1 so they are
 * not nagged again until a NEW question is created (which defaults to 0).
 *
 * Intended to run no more than once every 3 days (see instrumentation.ts).
 */
export const unpaidReminder = async (): Promise<boolean> => {
    const msg = msgGlobal

    if (isRunning) {
        logger.info(msg + "previous run still in progress, skipping")
        return true
    }
    isRunning = true

    try {
        if (!getSettingBool('unpaid_reminder_enabled', false)) {
            logger.info(msg + "reminders disabled in settings, skipping")
            return true
        }
        const minAgeDays = Math.max(0, getSettingInt('unpaid_reminder_days', 3))
        const rows = await getUsersWithUnpaidReminder(minAgeDays)
        if (rows === null) {
            logger.error(msg + "can't load users with unpaid questions")
            return false
        }
        if (rows.length === 0) {
            logger.info(msg + "no users to remind")
            return true
        }

        logger.info(msg + "users to remind", { count: rows.length })

        const url = paymentUrl()
        let sentCount = 0
        for (const row of rows) {
            const result = await notifyUnpaidReminder({
                recipient: row.email,
                userName: row.username,
                questionId: row.question_id,
                paymentUrl: url,
            })
            if (result === "sent") {
                // Latch ONLY on a real send. If the latch write fails, the user
                // may get one duplicate next run — log it so it's visible.
                const marked = await markUserUnpaidReminded(row.user_id)
                if (!marked) {
                    logger.warn(msg + "reminder sent but latch failed (possible duplicate next run)", { user_id: row.user_id })
                }
                sentCount++
            } else if (result === "failed") {
                logger.error(msg + "reminder not sent, will retry next run", { user_id: row.user_id })
            } else {
                // "skipped": no real email / template disabled — do NOT latch.
                logger.info(msg + "reminder skipped (no email / template off)", { user_id: row.user_id })
            }
        }

        logger.info(msg + "done", { processed: rows.length, reminded: sentCount })
        return true
    } catch (err) {
        logger.error(msg + "failed", (err as Error).message)
        return false
    } finally {
        isRunning = false
    }
}
