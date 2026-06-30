import { User } from "next-auth";
import { AttachmentDTO, DBQuestion } from "@/src/interfaces/db";

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
  onAskClarification?: (questionOrId: string, files?: File[]) => void;
  showClarificationForm?: boolean;
  /** When true, render attachments under the question. Never set on the public page. */
  showAttachments?: boolean;
  /** Attachments for this question row (already source-filtered by the API). */
  attachments?: AttachmentDTO[];
  /** When true, the follow-up form offers a file uploader. */
  allowAttachments?: boolean;
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
    attachmentsMap?: Record<string, AttachmentDTO[]>;
}