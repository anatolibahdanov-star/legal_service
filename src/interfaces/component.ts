import { User } from "next-auth";
import { DBQuestion } from "@/src/interfaces/db";

export interface CaseModalProps {
  user: User;
  caseItem: DBQuestion;
  isOpen: boolean;
  onClose: () => void;
  openRatingSection?: boolean;
  openNewQuestionWindow: () => void;
}

export interface ChatMessagePropsI {
  message: DBQuestion;
  isFromUser?: boolean;
  /** Admin view: highlight AI-edited {{...}} spans in red instead of stripping them. */
  isAdmin?: boolean;
  isLastLawyerMessage?: boolean;
  onAskClarification?: (questionOrId: string) => void;
  showClarificationForm?: boolean;
}

export interface profileDataQuestionsI {
    data: DBQuestion[];
    count: number;
}

export interface StatusPagePropsI {
  slug: string;
}

export interface AdminJobViewPropsI {
    record: DBQuestion;
    jobs: DBQuestion[];
}