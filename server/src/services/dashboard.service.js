import * as metricsRepo from '../repositories/metrics.repository.js';

const toMap = (rows) =>
  rows.reduce((acc, r) => ({ ...acc, [r.status]: Number(r.count) }), {});

export async function getSummary(userId) {
  const { orgs, projects, tasks, docs, pendingForMe, myTasks } =
    await metricsRepo.dashboardCounts(undefined, userId);

  return {
    organizations: Number(orgs.rows[0].count),
    projects: toMap(projects.rows),
    tasks: toMap(tasks.rows),
    documents: toMap(docs.rows),
    pending_approvals_for_me: Number(pendingForMe.rows[0].count),
    my_open_tasks: Number(myTasks.rows[0].count),
  };
}
