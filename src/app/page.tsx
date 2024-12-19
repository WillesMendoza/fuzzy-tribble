"use client";

import styles from "./page.module.css";
import AddTask from "./AddTask";
import TaskList from "./TaskList";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

interface Task {
  id: string;
  description: string;
  completed?: boolean;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  // const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const response = await fetch("INSERT_API_GW_URL");
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = (description: string) => {
    const newTask: Task = {
      id: uuidv4(),
      description,
    };
    setTasks([...tasks, newTask]);
    // TODO: Send the new task to the API
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
    // TODO: Call DELETE task API
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div>
          <h1>ToDo List</h1>
          <AddTask onAdd={addTask} />
        </div>
        <div>
          {
            // loading ? (
            //   <div>Loading...</div>
            // ) :
            <TaskList tasks={tasks} onDelete={deleteTask} />
          }
        </div>
      </main>
    </div>
  );
}
