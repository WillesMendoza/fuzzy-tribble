// src/app/TaskList.tsx
"use client";

import styles from "./page.module.css";

interface Task {
  id: string;
  description: string;
  completed?: boolean;
}

interface TaskListProps {
  tasks: Task[];
  onDelete?: (id: string) => void;
  onToggle?: (id: string) => void;
}

export default function TaskList({ tasks, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className={styles.emptyMessage}>
        No tasks yet. Add some tasks to get started!
      </p>
    );
  }

  return (
    <ul className={styles.taskList}>
      {tasks.map((task) => (
        <li key={task.id} className={styles.taskItem}>
          <div className={styles.taskContent}>
            <span
              className={`${styles.taskText} ${
                task.completed ? styles.completed : ""
              }`}
            >
              {task.description}
            </span>
          </div>
          <button
            onClick={() => onDelete?.(task.id)}
            className={styles.deleteButton}
            aria-label="Delete task"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
