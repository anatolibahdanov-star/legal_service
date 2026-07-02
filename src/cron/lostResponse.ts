import { EmailDataNewRequestI } from "../interfaces/email"
import { getQuestions, updateInfoStatus } from "../repositories/requests/repo"
import logger from "@/src/libs/logger"
import { sendNewRequestEmail } from "../libs/email/senders"
import { QuestionInfoStatusesE } from "../interfaces/data"

export const lostResponse = async (): Promise<boolean> => {
    const msg = "CRON lostResponse - "
    const lostQuestionTime = parseInt(process.env.LOST_QUESTION_TIME ?? "1")
    const filter = {lost: lostQuestionTime}
    const questions = await getQuestions("1", "20", ['id', 'DESC'], filter, true)
    const ids = new Set<number>()

    if(questions === null) {
        logger.error("(ERROR)" + msg + "Can't get questions");
        return false;
    }

    if(questions.length < 1) {
        logger.info(msg + "No active lost questions found.");
        return true;
    }

    logger.info(msg + "Found items.", questions.length);
    // for(const question of questions) {
    //     const id = parseInt(question.parent_id ?? question.id)
    //     if(!ids.has(id)) {
    //         const sendData: EmailDataNewRequestI = {
    //             id: question.id,
    //             username: question.username,
    //             email: question.email
    //         }
    //         const isSendEmail = await sendNewRequestEmail(sendData, false)
    //         let infoStatus = QuestionInfoStatusesE.Sent
    //         if(!isSendEmail) {
    //             logger.error(msg + "email on new request event was not sent", sendData)
    //             infoStatus = QuestionInfoStatusesE.None
    //         }

    //         await updateInfoStatus(question.id, infoStatus)
    //         ids.add(id)
    //     }
        
    // }

    return true
}