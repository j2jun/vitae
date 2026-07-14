"use client";

import { useEffect, useState } from "react";

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/todos")
      .then((res) => res.json())
      .then((res) => (res.error ? setError(res.error) : setTodos(res.todos)));
  }

  useEffect(load, []);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      setError("Couldn't add that to-do.");
      return;
    }
    const { todo } = await res.json();
    setTodos((prev) => [...(prev ?? []), todo]);
    setText("");
  }

  async function toggleDone(todo: Todo) {
    setTodos((prev) => prev?.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)) ?? null);
    await fetch(`/api/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !todo.done }),
    });
  }

  async function deleteTodo(id: number) {
    setTodos((prev) => prev?.filter((t) => t.id !== id) ?? null);
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
  }

  if (error) return <p>{error}</p>;
  if (!todos) return <p>Loading to-dos…</p>;

  return (
    <div>
      <form onSubmit={addTodo}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a to-do"
        />
        <button type="submit">Add</button>
      </form>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <label>
              <input type="checkbox" checked={todo.done} onChange={() => toggleDone(todo)} />
              <span style={{ textDecoration: todo.done ? "line-through" : "none" }}>
                {todo.text}
              </span>
            </label>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
