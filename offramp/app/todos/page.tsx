import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

type Todo = {
  id: string;
  title?: string | null;
  task?: string | null;
  created_at?: string | null;
};

export default async function TodosPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos, error } = await supabase
    .from("todos")
    .select("id, title, task, created_at")
    .order("created_at", { ascending: false })
    .limit(25);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Example</p>
          <h1 className="text-3xl font-black text-black">Server-rendered todos</h1>
          <p className="text-sm text-slate-600">
            This page uses the shared Supabase helpers to read the `todos` table with the current user session.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full border-2 border-black px-4 py-2 text-xs font-bold uppercase text-black transition hover:bg-black hover:text-white"
        >
          Back home
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border-2 border-red-800 bg-red-100 px-4 py-3 text-sm font-semibold text-red-900">
          Unable to load todos: {error.message}
        </div>
      )}

      <ul className="space-y-3">
        {todos?.length ? (
          todos.map((todo: Todo) => (
            <li key={todo.id} className="rounded-2xl border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-xs font-semibold uppercase text-slate-500">
                {todo.created_at ? new Date(todo.created_at).toLocaleString() : "Unscheduled"}
              </p>
              <p className="text-lg font-bold text-black">{todo.title ?? todo.task ?? "Untitled todo"}</p>
              {todo.task && todo.title && <p className="text-sm text-slate-600">{todo.task}</p>}
            </li>
          ))
        ) : (
          <li className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            No todos found for this project yet.
          </li>
        )}
      </ul>
    </main>
  );
}
