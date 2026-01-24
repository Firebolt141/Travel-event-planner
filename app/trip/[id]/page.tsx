"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Circle,
  Users,
  CalendarDays,
  Sparkles,
  Plane,
  MapPin,
  Languages,
  Moon,
  Sun,
} from "lucide-react";
import { useLanguage } from "@/app/components/useLanguage";
import { useTheme } from "@/app/components/ThemeClient";

/* ---------------- TYPES ---------------- */

type Participant = {
  name: string;
};

type Todo = {
  text: string;
  pic: string;
  done: boolean;
  dueDate: string;
};
type CountType = "tasks" | "people";
type ItemData = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location?: string;
  description?: string;
  participants?: Participant[];
  todos?: Todo[];
};

/* ---------------- PAGE ---------------- */

export default function TripDetailPage({ type }: { type?: "trip" | "event" }) {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const itemType = type || "trip";
  const { strings, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const countLabel = (count: number, type: CountType) =>
    language === "ja" ? `${count}${strings.labels[type]}` : `${count} ${strings.labels[type]}`;

  const [item, setItem] = useState<ItemData | null>(null);
  const [description, setDescription] = useState("");

  // Participant input
  const [pName, setPName] = useState("");

  // Todo input
  const [todoText, setTodoText] = useState("");
  const [todoPic, setTodoPic] = useState("");
  const [todoDue, setTodoDue] = useState("");

  const collectionName = useMemo(
    () => (itemType === "event" ? "events" : "trips"),
    [itemType]
  );

  /* ---------------- DATA ---------------- */

  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(doc(db, collectionName, id), (snap) => {
      const data = snap.data();
      if (!data) return;
      const payload = { id: snap.id, ...(data as Omit<ItemData, "id">) };
      setItem(payload);
      setDescription(payload.description || "");
    });

    return () => unsub();
  }, [id, collectionName]);


  if (!item) {
    return (
      <div className="min-h-screen bg-cute text-cute-ink flex items-center justify-center px-5">
        <div className="card-cute max-w-md w-full text-center">
          <div className="mx-auto mb-3 w-14 h-14 rounded-3xl bg-white/70 shadow-cute flex items-center justify-center">
            <Sparkles />
          </div>
          <p className="text-sm text-cute-muted">{strings.messages.loading}</p>
        </div>
      </div>
    );
  }

  /* ---------------- PARTICIPANTS ---------------- */

  async function addParticipant() {
    if (!pName) return;

    await updateDoc(doc(db, collectionName, id), {
      participants: arrayUnion({ name: pName }),
    });

    setPName("");
  }

  async function deleteParticipant(p: Participant) {
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

    await updateDoc(doc(db, collectionName, id), {
      todos: arrayUnion(newTodo),
    });

    setTodoText("");
    setTodoPic("");
    setTodoDue("");
  }

  async function toggleTodo(todo: Todo) {
    // same behavior as before: remove old object, add toggled one
    await updateDoc(doc(db, collectionName, id), {
      todos: arrayRemove(todo),
    });

    await updateDoc(doc(db, collectionName, id), {
      todos: arrayUnion({ ...todo, done: !todo.done }),
    });
  }

  async function deleteTodo(todo: Todo) {
    await updateDoc(doc(db, collectionName, id), {
      todos: arrayRemove(todo),
    });
  }

  /* ---------------- UI ---------------- */

  const isEvent = itemType === "event";
  return (
    <div className="min-h-screen bg-cute text-cute-ink pb-28">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <button
              className="mini-nav"
              onClick={() => router.push("/")}
              aria-label={strings.actions.back}
              title={strings.actions.back}
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <p className="text-xs text-cute-muted">
                {isEvent ? strings.messages.eventDetails : strings.messages.tripDetails}
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                {item.name}
                {isEvent ? (
                  <Sparkles className="opacity-80" size={20} />
                ) : (
                  <Plane className="opacity-80" size={20} />
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`badge ${isEvent ? "badge-blue" : "badge-purple"}`}>
              {isEvent ? <Sparkles size={14} /> : <Plane size={14} />}
              {isEvent ? strings.labels.event : strings.labels.trip}
            </span>
            <button
              className="mini-nav"
              onClick={toggleLanguage}
              aria-label={language === "en" ? strings.actions.switchToJapanese : strings.actions.switchToEnglish}
              title={language === "en" ? strings.actions.switchToJapanese : strings.actions.switchToEnglish}
            >
              <Languages size={18} />
            </button>
            <button
              className="mini-nav"
              onClick={toggleTheme}
              aria-label={strings.actions.toggleTheme}
              title={strings.actions.toggleTheme}
            >
              {theme === "day" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="px-5">
        {/* Dates */}
        <div className="card-cute mb-4">
          <div className="flex items-center justify-between">
            <span className="badge badge-mint">
              <CalendarDays size={14} />
              {strings.labels.dates}
            </span>
          </div>

          <p className="mt-3 font-semibold">
            {item.startDate} → {item.endDate}
          </p>

          {/* Optional: show location on event if present (won't break trips) */}
          {isEvent && item.location ? (
            <p className="text-sm text-cute-muted mt-2 inline-flex items-center gap-2">
              <MapPin size={16} />
              {item.location}
            </p>
          ) : null}
        </div>

        {/* Description */}
        <div className="card-cute mb-4">
          <p className="text-xs text-cute-muted mb-2">{strings.labels.description}</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={async () => {
              await updateDoc(doc(db, collectionName, id), { description });
            }}
            placeholder={strings.labels.descriptionPlaceholder}
            className="cute-input min-h-[100px] resize-none"
          />
          <p className="text-xs text-cute-muted mt-2">
            {strings.messages.tipSave}
          </p>
        </div>

        {/* Participants */}
        <div className="card-cute mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="badge badge-sun">
              <Users size={14} />
              {strings.labels.participants}
            </span>
            <span className="text-xs text-cute-muted">
              {countLabel((item.participants || []).length, "people")}
            </span>
          </div>

          <div className="space-y-2 mb-3">
            {(item.participants || []).map((p: Participant, i: number) => (
              <div key={i} className="row-cute">
                <p className="font-semibold">{p.name}</p>
                <button
                  className="icon-btn"
                  onClick={() => deleteParticipant(p)}
                  aria-label={strings.actions.removeParticipant}
                  title={strings.actions.removeParticipant}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            {(item.participants || []).length === 0 && (
              <p className="text-sm text-cute-muted">{strings.messages.noParticipants}</p>
            )}
          </div>

          <input
            placeholder={strings.labels.name}
            value={pName}
            onChange={(e) => setPName(e.target.value)}
            className="cute-input mb-3"
          />

          <button
            onClick={addParticipant}
            className="w-full py-3 rounded-2xl bg-cute-accent text-white font-extrabold shadow-cute active:scale-[0.99] transition disabled:opacity-50"
            disabled={!pName}
          >
            {strings.labels.addParticipant}
          </button>
        </div>

        {/* TODOs */}
        <div className="card-cute">
          <div className="flex items-center justify-between mb-3">
            <span className="badge badge-pink">
              <Circle size={14} />
              {strings.labels.todos}
            </span>
            <span className="text-xs text-cute-muted">
              {countLabel((item.todos || []).length, "tasks")}
            </span>
          </div>

          <div className="space-y-2 mb-4">
            {(item.todos || []).map((todo: Todo, i: number) => (
              <div key={i} className="row-cute">
                <div
                  className="flex items-start gap-3 flex-1 cursor-pointer"
                  onClick={() => toggleTodo(todo)}
                  role="button"
                  tabIndex={0}
                >
                  {todo.done ? (
                    <CheckCircle2 className="mt-0.5" />
                  ) : (
                    <Circle className="mt-0.5 opacity-70" />
                  )}

                  <div className="min-w-0">
                    <p
                      className={`font-semibold truncate ${
                        todo.done ? "line-through text-cute-muted" : ""
                      }`}
                    >
                      {todo.text}
                    </p>
                    <p className="text-xs text-cute-muted mt-1">
                      {strings.labels.pic}: {todo.pic} • {strings.labels.due}: {todo.dueDate}
                    </p>
                  </div>
                </div>

                <button
                  className="icon-btn"
                  onClick={() => deleteTodo(todo)}
                  aria-label={strings.actions.deleteTodo}
                  title={strings.actions.deleteTodo}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            {(item.todos || []).length === 0 && (
              <p className="text-sm text-cute-muted">{strings.messages.noTripTodos}</p>
            )}
          </div>

          <input
            placeholder={strings.labels.task}
            value={todoText}
            onChange={(e) => setTodoText(e.target.value)}
            className="cute-input mb-2"
          />

          <select
            value={todoPic}
            onChange={(e) => setTodoPic(e.target.value)}
            disabled={(item.participants || []).length === 0}
            className="cute-input mb-2"
          >
            <option value="">{strings.labels.assignPic}</option>
            {(item.participants || []).map((p: Participant, i: number) => (
              <option key={i} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={todoDue}
            onChange={(e) => setTodoDue(e.target.value)}
            className="cute-input mb-3"
          />

          <button
            onClick={addTodo}
            className="w-full py-3 rounded-2xl bg-cute-accent text-white font-extrabold shadow-cute active:scale-[0.99] transition disabled:opacity-50"
            disabled={!todoText || !todoPic || !todoDue}
          >
            {strings.labels.addTodo}
          </button>

          {(item.participants || []).length === 0 && (
            <p className="text-xs text-cute-muted mt-2">
              {strings.messages.addAtLeastOneParticipant}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
