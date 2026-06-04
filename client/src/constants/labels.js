// Єдине джерело лейблів статусів (раніше дублювалися по сторінках)

export const documentStatusLabels = {
  draft: 'Чернетка',
  on_review: 'На узгодженні',
  approved: 'Затверджено',
  rejected: 'Відхилено',
};

export const projectStatusLabels = {
  planned: 'Заплановано',
  active: 'Активний',
  on_hold: 'Призупинено',
  completed: 'Завершено',
  cancelled: 'Скасовано',
};

export const taskStatusLabels = {
  todo: 'До виконання',
  in_progress: 'В роботі',
  review: 'Перевірка',
  done: 'Готово',
};

export const taskPriorityLabels = {
  low: 'низький',
  medium: 'середній',
  high: 'високий',
  critical: 'критичний',
};

export const approvalDecisionLabels = {
  pending: 'очікує',
  approved: 'погоджено',
  rejected: 'відхилено',
};

export const roleLabels = {
  admin: 'Адміністратор',
  head: 'Керівник',
  member: 'Учасник',
};

// Ролі-мітки учасника в проєкті
export const MEMBER_ROLE_OPTIONS = ['координатор', 'організатор', 'волонтер', 'учасник'];

// Мітки, що дають право керувати проєктом (мають збігатися з бекендом)
export const MANAGER_LABELS = ['координатор', 'організатор'];

// Колонки Kanban-дошки
export const TASK_COLUMNS = [
  { key: 'todo', label: taskStatusLabels.todo },
  { key: 'in_progress', label: taskStatusLabels.in_progress },
  { key: 'review', label: taskStatusLabels.review },
  { key: 'done', label: taskStatusLabels.done },
];

export const taskNextStatus = {
  todo: 'in_progress', in_progress: 'review', review: 'done', done: 'todo',
};

export const notificationIcons = {
  approval_request: '🖊', approved: '✅', rejected: '❌', info: 'ℹ️',
};

export const activityActionIcons = {
  submit: '📤', approve: '✅', reject: '❌', delegate: '➡️', create: '➕', attach: '📎',
};
