import { getAdministrators, updateAdministratorRating } from "../repositories/administrators/repo"
import logger from "@/src/libs/logger"
import { UserStatusesE } from "../interfaces/data"
import { getQuestions } from "../repositories/requests/repo"

export const adminRating = async (): Promise<boolean> => {
    const msg = "CRON adminRating - "
    const filter = {status: UserStatusesE.Activated}
    const admins = await getAdministrators("1", "100", ['id', 'DESC'], filter)
    const ids = new Set<number>()

    if(admins === null) {
        logger.error("(ERROR)" + msg + "Can't get active admins.");
        return false;
    }

    if(admins.length < 1) {
        logger.info(msg + "No active admins found.");
        return true;
    }

    logger.info(msg + "Found items.", admins.length);
    let counter = 0
    for(const admin of admins) {
        const id = parseInt(admin.id)
        if(!ids.has(id)) {
            const qFilter = {admin_id: id, is_rating: true}
            const questions = await getQuestions("1", "100", ['id', 'DESC'], qFilter)
            if(questions === null || questions.length < 1) {
                logger.info(msg + "No rated questions found for Administrator with id.", id);
            } else {
                const average = (questions.reduce((sum, obj) => sum + (obj.rating ?? 0), 0) / questions.length).toFixed(2);
                await updateAdministratorRating(id.toString(), average)
                counter++
            }
            ids.add(id)
        }
    }
    logger.info(msg + "Updated items [" + counter + '] from [' + ids.size +']');
    return true
}