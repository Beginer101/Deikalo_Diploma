// Чиста (тестована) логіка визначення статусу документа за станом кроків узгодження.
// approvals — масив об'єктів зі статусом decision: 'pending' | 'approved' | 'rejected'.
export function computeDocumentStatus(approvals) {
  if (!Array.isArray(approvals) || approvals.length === 0) return 'draft';
  if (approvals.some((a) => a.decision === 'rejected')) return 'rejected';
  if (approvals.every((a) => a.decision === 'approved')) return 'approved';
  return 'on_review';
}
