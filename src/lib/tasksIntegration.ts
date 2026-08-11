import { getAccessToken } from './auth';

export interface TaskItem {
  id?: string;
  title: string;
  notes?: string;
  due?: string;
  status?: 'needsAction' | 'completed';
}

export const createGoogleTask = async (task: TaskItem) => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Необхідна авторизація в Google');
  }

  const payload: any = {
    title: task.title,
    notes: task.notes || ''
  };

  if (task.due) {
    // ISO 8601 date format required by Google Tasks e.g., 2026-08-15T00:00:00.000Z
    payload.due = new Date(task.due).toISOString();
  }

  const res = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Failed to create task:', errText);
    throw new Error('Не вдалося створити завдання в Google Tasks');
  }

  return await res.json();
};

export const fetchGoogleTasks = async () => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Необхідна авторизація в Google');
  }

  const res = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=false', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Failed to fetch tasks:', errText);
    throw new Error('Не вдалося отримати завдання з Google Tasks');
  }

  const data = await res.json();
  return data.items || [];
};

export const completeGoogleTask = async (taskId: string) => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Необхідна авторизація в Google');
  }

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'completed'
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Failed to complete task:', errText);
    throw new Error('Не вдалося оновити завдання в Google Tasks');
  }

  return await res.json();
};
