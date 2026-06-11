import * as metricsRepo from '../repositories/metrics.repository.js';

const toMap = (rows, key) =>
  rows.reduce((acc, r) => ({ ...acc, [r[key]]: Number(r.count) }), {});

// Адміністратор бачить метрики всієї системи,
// керівник (head) — лише своєї організації
export async function getMetrics(actor) {
  const organizationId = actor.role === 'admin' ? null : actor.organization_id;
  const r = await metricsRepo.metrics(undefined, organizationId);
  return {
    scope: organizationId ? 'organization' : 'system',
    totals: r.totals.rows[0],
    documents_by_status: toMap(r.docsByStatus.rows, 'status'),
    documents_by_type: r.docsByType.rows.map((x) => ({ type: x.doc_type, count: Number(x.count) })),
    avg_approval_hours: Math.round(Number(r.avgApproval.rows[0].hours) * 10) / 10,
    stuck_documents: Number(r.stuck.rows[0].count),
    top_authors: r.topAuthors.rows.map((x) => ({ name: x.full_name, docs: Number(x.docs) })),
    workload: r.workload.rows.map((x) => ({ name: x.full_name, open_tasks: Number(x.open_tasks) })),
    activity_by_day: r.activityByDay.rows.map((x) => ({ day: x.day, count: Number(x.cnt) })),
  };
}
