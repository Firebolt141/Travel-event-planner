"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Circle,
  Users,
} from "lucide-react";

type Participant = {
  name: string;
  email: string;
};

type Todo = {
  text: string;
  pic: string;
  done: boolean;
  dueDate: string;
};

export default function TripDetailPage({ type }: { type?: "trip" | "event" }) {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const itemType = type || "trip"; // default to trip if no type passed

  const [item, setItem] = useState<any>(null);
  const [description, setDescription] = useState("");

  // Participant input
  const [pName, setPName] = useState("");
  const [pEmail, setPEmail] = useState("");

  // Todo input
  const [todoText, setTodoText] = useState("");
  const [todoPic, setTodoPic] = useState("");
  const [todoDue, setTodoDue] = useState("");

  useEffect(() => {
    if (!id) return;

    const collectionName = itemType === "event" ? "events" : "trips";

    const unsub = onSnapshot(doc(db, collectionName, id), (snap) => {
      const data = snap.data();
      if (!data) return;
      setItem({id: snap.id, ...data});
      setDescription(data.description || "");
    });

    return () => unsub();
  }, [id, itemType]);

  if (!item) {
    return (
        <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
          Loading…
        </div>
    );
  }


  /* ---------------- PARTICIPANTS ---------------- */
  async function addParticipant() {
    if (!pName || !pEmail) return;

    const collectionName = itemType === "event" ? "events" : "trips";

    await updateDoc(doc(db, collectionName, id), {
      participants: arrayUnion({name: pName, email: pEmail}),
    });

    setPName("");
    setPEmail("");
  }


  async function deleteParticipant(p: Participant) {
    const collectionName = itemType === "event" ? "events" : "trips";

    await updateDoc(doc(db, collectionName, id), {
      participants: arrayRemove(p),
    });
  }


  /* ---------------- TODOS ---------------- */
  async function addTodo() {
    if (!todoText || !todoPic || !todoDue) return;

    const newTodo: Todo = {
      text: todoText,
      pic: todoPic,
      done: false,
      dueDate: todoDue,
    };

    const collectionName = itemType === "event" ? "events" : "trips";

    await updateDoc(doc(db, collectionName, id), {
      todos: arrayUnion(newTodo),
    });

    setTodoText("");
    setTodoPic("");
    setTodoDue("");
  }


  async function toggleTodo(todo: Todo) {
    const collectionName = itemType === "event" ? "events" : "trips";

    await updateDoc(doc(db, collectionName, id), {
      todos: arrayRemove(todo),
    });

    await updateDoc(doc(db, collectionName, id), {
      todos: arrayUnion({...todo, done: !todo.done}),
    });
  }

  async function deleteTodo(todo: Todo) {
    const collectionName = itemType === "event" ? "events" : "trips";

    await updateDoc(doc(db, collectionName, id), {
      todos: arrayRemove(todo),
    });
  }


  return (
    <div className="min-h-screen bg-[#020617] text-white p-5 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}>
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-bold">{item.name}</h1>
      </div>

      {/* Dates */}
      <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/10">
        <p className="text-sm text-gray-400">Dates</p>
        <p className="font-semibold mt-1">
          {item.startDate} → {item.endDate}
        </p>
      </div>

      {/* Description */}
      <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
        <p className="text-sm text-gray-400 mb-2">Description</p>
        <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={async () => {
              const collectionName = itemType === "event" ? "events" : "trips";
              await updateDoc(doc(db, collectionName, id), {description});
            }}
            placeholder="Add trip description…"
            className="w-full min-h-[80px] bg-transparent text-white outline-none resize-none"
        />
      </div>

      {/* PARTICIPANTS */}
      <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} />
          <p className="text-sm text-gray-400">Participants</p>
        </div>

        <div className="space-y-2 mb-4">
          {(item.participants || []).map((p: Participant, i: number) => (
            <div
              key={i}
              className="flex justify-between items-center bg-black/30 p-3 rounded-xl"
            >
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-gray-400">{p.email}</p>
              </div>
              <button onClick={() => deleteParticipant(p)}>
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>

        <input
          placeholder="Name"
          value={pName}
          onChange={(e) => setPName(e.target.value)}
          className="w-full p-2 mb-2 rounded-xl bg-white/10"
        />
        <input
          placeholder="Email"
          value={pEmail}
          onChange={(e) => setPEmail(e.target.value)}
          className="w-full p-2 mb-3 rounded-xl bg-white/10"
        />

        <button
          onClick={addParticipant}
          className="w-full py-3 rounded-xl bg-indigo-600"
        >
          Add Participant
        </button>
      </div>

      {/* TODOS */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
        <p className="text-sm text-gray-400 mb-3">TODOs</p>

        <div className="space-y-3 mb-4">
          {(item.todos || []).map((todo: Todo, i: number) => (
            <div
              key={i}
              className="flex justify-between items-center bg-black/30 p-3 rounded-xl"
            >
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => toggleTodo(todo)}
              >
                {todo.done ? (
                  <CheckCircle2 className="text-green-400" />
                ) : (
                  <Circle className="text-gray-400" />
                )}

                <div>
                  <p
                    className={`font-medium ${
                      todo.done ? "line-through text-gray-400" : ""
                    }`}
                  >
                    {todo.text}
                  </p>
                  <p className="text-xs text-gray-400">
                    PIC: {todo.pic} • Due: {todo.dueDate}
                  </p>
                </div>
              </div>

              <button onClick={() => deleteTodo(todo)}>
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>

        {/* ADD TODO */}
        <input
          placeholder="Task"
          value={todoText}
          onChange={(e) => setTodoText(e.target.value)}
          className="w-full p-2 mb-2 rounded-xl bg-white/10"
        />

        {/* 🔥 FIXED DARK DROPDOWN */}
        <select
          value={todoPic}
          onChange={(e) => setTodoPic(e.target.value)}
          disabled={(item.participants || []).length === 0}
          className="
            w-full mb-3 p-2 rounded-xl
            bg-black/40 text-white
            border border-white/10
            appearance-none
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            disabled:opacity-50
          "
        >
          <option value="" className="bg-[#020617] text-white">
            Assign PIC
          </option>

          {(item.participants || []).map((p: Participant, i: number) => (
              <option
                  key={`${p.name}-${i}`}
                  value={p.name}
                  className="bg-[#020617] text-white"
              >
                {p.name}
              </option>
          ))}
        </select>

        <input
          type="date"
          value={todoDue}
          onChange={(e) => setTodoDue(e.target.value)}
          className="w-full p-2 mb-3 rounded-xl bg-white/10"
        />

        <button
          onClick={addTodo}
          className="w-full py-3 rounded-xl bg-indigo-600"
        >
          Add TODO
        </button>
      </div>
    </div>
  );
}
