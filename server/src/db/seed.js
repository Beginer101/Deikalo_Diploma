// Наповнення БД демонстраційними даними
import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Очищення (у правильному порядку через FK)
    await client.query(`
      TRUNCATE attachments, notifications, activity_log, document_templates,
               document_approvals, document_history, comments, documents,
               tasks, memberships, projects, users, organizations
      RESTART IDENTITY CASCADE;
    `);

    // --- Організації ---
    const org = await client.query(
      `INSERT INTO organizations (name, description) VALUES
        ($1,$2),($3,$4) RETURNING id`,
      [
        'Студентська рада університету',
        'Орган студентського самоврядування',
        'IT-клуб "DevHub"',
        'Спільнота студентів-розробників',
      ]
    );
    const orgRada = org.rows[0].id;
    const orgClub = org.rows[1].id;

    // --- Користувачі ---
    const pass = await bcrypt.hash('password123', 10);
    const users = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role, organization_id) VALUES
        ($1,$2,$3,'admin',$4),
        ($5,$6,$3,'head',$4),
        ($7,$8,$3,'member',$4),
        ($9,$10,$3,'member',$11),
        ($12,$13,$3,'head',$11)
       RETURNING id, role`,
      [
        'Адміністратор Системи', 'admin@studorg.ua', pass, orgRada,
        'Олена Коваленко', 'head@studorg.ua',
        'Іван Петренко', 'member@studorg.ua',
        'Марія Шевченко', 'maria@devhub.ua', orgClub,
        'Андрій Бондаренко', 'andrii@devhub.ua',
      ]
    );
    const [admin, head, member, maria, andrii] = users.rows.map((r) => r.id);

    // --- Проєкти ---
    const projects = await client.query(
      `INSERT INTO projects (title, description, status, organization_id, owner_id, start_date, end_date) VALUES
        ($1,$2,'active',$3,$4,'2026-02-01','2026-06-30'),
        ($5,$6,'planned',$3,$4,'2026-07-01','2026-09-15'),
        ($7,$8,'active',$9,$10,'2026-03-01','2026-12-20')
       RETURNING id`,
      [
        'День відкритих дверей 2026', 'Організація заходу для абітурієнтів', orgRada, head,
        'Літня школа лідерства', 'Тренінги для активу студради',
        'Hackathon DevHub Spring', 'Студентський хакатон на 48 годин', orgClub, andrii,
      ]
    );
    const [pOpenDay, pSummer, pHack] = projects.rows.map((r) => r.id);

    // --- Членство ---
    await client.query(
      `INSERT INTO memberships (user_id, project_id, role_label) VALUES
        ($1,$2,'головний організатор'),($3,$2,'волонтер'),
        ($4,$2,'секретар організації'),
        ($4,$5,'головний організатор'),($6,$5,'ментор')`,
      [head, pOpenDay, member, maria, pHack, andrii]
    );

    // --- Задачі ---
    await client.query(
      `INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, due_date) VALUES
        ('Забронювати актову залу','Узгодити з адміністрацією дату','done','high',$1,$2,'2026-03-10'),
        ('Підготувати програму заходу','Скласти розклад презентацій','in_progress','high',$1,$2,'2026-04-01'),
        ('Розробити афішу','Дизайн та друк промоматеріалів','todo','medium',$1,$3,'2026-04-15'),
        ('Скласти бюджет хакатону','Кошторис призового фонду','in_progress','critical',$4,$5,'2026-04-20'),
        ('Запросити менторів','Знайти 5 IT-менторів','todo','medium',$4,$5,'2026-05-01')`,
      [pOpenDay, head, member, pHack, andrii]
    );

    // --- Документи ---
    const docs = await client.query(
      `INSERT INTO documents (title, doc_type, content, status, project_id, author_id) VALUES
        ($1,'наказ',$2,'on_review',$3,$4),
        ($5,'кошторис',$6,'draft',$7,$8),
        ($9,'звіт',$10,'approved',$3,$4)
       RETURNING id`,
      [
        'Наказ про проведення Дня відкритих дверей',
        'Затвердити проведення заходу 25 квітня 2026 року...', pOpenDay, head,
        'Кошторис витрат на хакатон',
        'Призовий фонд: 30000 грн; кейтеринг: 15000 грн...', pHack, andrii,
        'Звіт про підготовчий етап',
        'Виконано бронювання залу та узгодження програми...',
      ]
    );
    const [dNakaz, dKoshtorys, dZvit] = docs.rows.map((r) => r.id);

    // --- Маршрут узгодження для наказу (на розгляді) ---
    await client.query(
      `INSERT INTO document_approvals (document_id, approver_id, step_order, decision) VALUES
        ($1,$2,1,'pending'),
        ($1,$3,2,'pending')`,
      [dNakaz, head, admin]
    );

    // --- Узгодження для звіту (затверджено) ---
    await client.query(
      `INSERT INTO document_approvals (document_id, approver_id, step_order, decision, comment, decided_at) VALUES
        ($1,$2,1,'approved','Погоджено без зауважень', now())`,
      [dZvit, admin]
    );

    // --- Історія документів ---
    await client.query(
      `INSERT INTO document_history (document_id, user_id, action) VALUES
        ($1,$2,'Створено документ'),
        ($1,$2,'Відправлено на узгодження'),
        ($3,$4,'Створено документ'),
        ($3,$4,'Затверджено')`,
      [dNakaz, head, dZvit, admin]
    );

    // --- Коментарі ---
    await client.query(
      `INSERT INTO comments (document_id, author_id, body) VALUES
        ($1,$2,'Прошу уточнити дату проведення.')`,
      [dNakaz, admin]
    );

    // --- Шаблони документів ---
    await client.query(
      `INSERT INTO document_templates (name, doc_type, content, created_by) VALUES
        ($1,'наказ',$2,$3),
        ($4,'кошторис',$5,$3),
        ($6,'звіт',$7,$3),
        ($8,'заявка',$9,$3)`,
      [
        'Наказ про проведення заходу',
        'НАКАЗ\n№ ___ від ___\n\nПро проведення заходу «____».\n\n1. Провести захід ___ року.\n2. Відповідальний: ____.\n3. Контроль залишаю за собою.\n\nКерівник: ____',
        admin,
        'Кошторис витрат',
        'КОШТОРИС ВИТРАТ\nЗахід: ____\n\n| Стаття витрат | Сума, грн |\n|---|---|\n| ____ | ____ |\n\nРазом: ____ грн.',
        'Звіт про проведення заходу',
        'ЗВІТ\nЗахід: ____\nДата: ____\n\n1. Мета заходу: ____\n2. Кількість учасників: ____\n3. Результати: ____\n4. Висновки: ____',
        'Заявка на фінансування',
        'ЗАЯВКА НА ФІНАНСУВАННЯ\nВід: ____\nСума: ____ грн\nПризначення: ____\nОбґрунтування: ____',
      ]
    );

    // --- Сповіщення (приклад: погоджувачам наказу) ---
    await client.query(
      `INSERT INTO notifications (user_id, type, message, link) VALUES
        ($1,'approval_request','Документ «Наказ про проведення Дня відкритих дверей» очікує вашого погодження',$2),
        ($3,'approval_request','Документ «Наказ про проведення Дня відкритих дверей» очікує вашого погодження',$2)`,
      [head, `/documents/${dNakaz}`, admin]
    );

    // --- Журнал активності ---
    await client.query(
      `INSERT INTO activity_log (user_id, entity_type, entity_id, action, summary) VALUES
        ($1,'document',$2,'submit','Олена Коваленко відправила документ «Наказ про проведення Дня відкритих дверей» на узгодження'),
        ($3,'document',$4,'approve','Адміністратор Системи затвердив документ «Звіт про підготовчий етап»'),
        ($1,'project',$5,'create','Олена Коваленко створила проєкт «День відкритих дверей 2026»')`,
      [head, dNakaz, admin, dZvit, pOpenDay]
    );

    await client.query('COMMIT');
    console.log('✅ Демонстраційні дані успішно завантажено.');
    console.log('   Тестові акаунти (пароль для всіх: password123):');
    console.log('   - admin@studorg.ua  (Адміністратор)');
    console.log('   - head@studorg.ua   (Керівник)');
    console.log('   - member@studorg.ua (Учасник)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Помилка завантаження даних:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
