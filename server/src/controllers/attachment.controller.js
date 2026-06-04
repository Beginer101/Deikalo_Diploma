import * as service from '../services/attachment.service.js';

export async function listByDocument(req, res) {
  res.json(await service.listByDocument(req.params.documentId));
}

export async function upload(req, res) {
  res.status(201).json(await service.createFromUpload(req.params.documentId, req.file, req.user));
}

export async function download(req, res) {
  const { filePath, originalName } = await service.getFileForDownload(req.params.id);
  res.download(filePath, originalName);
}

export async function remove(req, res) {
  await service.remove(req.params.id, req.user);
  res.status(204).end();
}
