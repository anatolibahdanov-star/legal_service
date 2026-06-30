export const ATTACH_MAX_FILES = 5;
export const ATTACH_MAX_SIZE = 3 * 1024 * 1024;
export const ATTACH_EXTENSIONS = ['doc', 'docx', 'pdf', 'xlsx'] as const;

export const ATTACH_ACCEPT = '.doc,.docx,.pdf,.xlsx';

export const ATTACH_MIME_BY_EXT: Record<string, string> = {
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export interface AttachmentLike {
  name: string;
  size: number;
  type?: string;
}

export interface AttachmentValidationResult {
  ok: boolean;
  error?: string;
}

export function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  if (idx < 0 || idx === filename.length - 1) return '';
  return filename.slice(idx + 1).toLowerCase();
}

function isContradictoryMime(type: string | undefined): boolean {
  if (!type) return false;
  return /^(image|video|audio)\//i.test(type);
}

export function validateAttachmentFile(file: AttachmentLike): AttachmentValidationResult {
  const ext = getExtension(file.name);
  if (!(ATTACH_EXTENSIONS as readonly string[]).includes(ext)) {
    return { ok: false, error: `Недопустимый тип файла «${file.name}». Разрешены: doc, docx, pdf, xlsx.` };
  }
  if (file.size > ATTACH_MAX_SIZE) {
    return { ok: false, error: `Файл «${file.name}» больше 3 МБ.` };
  }
  if (isContradictoryMime(file.type)) {
    return { ok: false, error: `Недопустимый тип файла «${file.name}».` };
  }
  return { ok: true };
}

export function validateAttachmentSet(
  files: AttachmentLike[],
  existingCount: number = 0,
): AttachmentValidationResult {
  if (files.length + existingCount > ATTACH_MAX_FILES) {
    return { ok: false, error: `Можно прикрепить не более ${ATTACH_MAX_FILES} файлов.` };
  }
  for (const file of files) {
    const res = validateAttachmentFile(file);
    if (!res.ok) return res;
  }
  return { ok: true };
}
