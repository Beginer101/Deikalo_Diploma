import path from 'path';
import fs from 'fs';
import { httpError } from '../lib/httpError.js';
import { UPLOAD_DIR } from '../middleware/upload.js';
import * as attachmentRepo from '../repositories/attachment.repository.js';
import { logActivity } from './notification.service.js';

export function listByDocument(documentId) {
  return attachmentRepo.listByDocument(undefined, documentId);
}

export async function createFromUpload(documentId, file, actor) {
  if (!file) throw httpError(400, 'Файл не передано');
  // Декодування кирилиці в оригінальній назві (multer latin1 -> utf8)
  const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
  const record = await attachmentRepo.create(undefined, {
    document_id: documentId,
    filename: file.filename,
    original_name: originalName,
    mime_type: file.mimetype,
    size_bytes: file.size,
    uploaded_by: actor.id,
  });
  await logActivity(undefined, {
    userId: actor.id,
    entityType: 'document',
    entityId: Number(documentId),
    action: 'attach',
    summary: `${actor.full_name} прикріпив(ла) файл «${originalName}»`,
  });
  return record;
}

export async function getFileForDownload(id) {
  const file = await attachmentRepo.findById(undefined, id);
  if (!file) throw httpError(404, 'Файл не знайдено');
  const filePath = path.join(UPLOAD_DIR, file.filename);
  if (!fs.existsSync(filePath)) throw httpError(404, 'Файл відсутній на диску');
  return { filePath, originalName: file.original_name };
}

export async function remove(id, actor) {
  const file = await attachmentRepo.findById(undefined, id);
  if (!file) throw httpError(404, 'Файл не знайдено');
  if (file.uploaded_by !== actor.id && actor.role !== 'admin') {
    throw httpError(403, 'Видалити може автор або адміністратор');
  }
  const filePath = path.join(UPLOAD_DIR, file.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await attachmentRepo.remove(undefined, id);
}
