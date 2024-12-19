"use client";

import { useState } from "react";
import styles from "./page.module.css";

interface AddTaskProps {
  onAdd: (task: string) => void;
}

export default function AddTask({ onAdd }: AddTaskProps) {
  const [newTask, setNewTask] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTask.trim()) return;

    onAdd(newTask.trim());

    // Clear the input
    setNewTask("");
  };

  return (
    <form onSubmit={handleSubmit} className={styles.addForm}>
      <input
        type="text"
        placeholder="Add a new task..."
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        className={styles.input}
      />
      <button type="submit" className={styles.addButton}>
        Add Task
      </button>
    </form>
  );
}
