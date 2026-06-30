import { AttachmentDTO } from "@/src/interfaces/db";

function formatSize(bytes: number): string {
  if (!bytes) return "";
  const k = 1024;
  const sizes = ["Б", "КБ", "МБ"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

interface AttachmentListProps {
  attachments: AttachmentDTO[];
  showSource?: boolean;
  className?: string;
}

export function AttachmentList({ attachments, showSource = false, className = "" }: AttachmentListProps) {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-2 mt-2 ${className}`}>
      {attachments.map((att) => (
        <a
          key={att.id}
          href={att.url}
          target="_blank"
          rel="noopener noreferrer"
          title={att.filename}
          className="flex items-center gap-2 max-w-[240px] px-2.5 py-1.5 rounded-lg bg-[rgba(52,52,124,0.06)] border border-[rgba(52,52,124,0.15)] hover:bg-[rgba(52,52,124,0.12)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="shrink-0">
            <path d="M7 1H2.5A.5.5 0 002 1.5v9a.5.5 0 00.5.5h7a.5.5 0 00.5-.5V4L7 1z" stroke="#34347C" strokeWidth="0.8" fill="rgba(52,52,124,0.05)" />
            <path d="M7 1v3h3" stroke="#34347C" strokeWidth="0.8" fill="none" />
          </svg>
          <span className="text-[12px] text-[#34347C] truncate">{att.filename}</span>
          {att.file_size ? (
            <span className="text-[10px] text-[rgba(18,22,27,0.45)] shrink-0">{formatSize(att.file_size)}</span>
          ) : null}
          {showSource && att.source === "lawyer" ? (
            <span className="text-[10px] text-[#10b981] shrink-0">юрист</span>
          ) : null}
        </a>
      ))}
    </div>
  );
}

export default AttachmentList;
