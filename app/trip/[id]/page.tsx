"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Trash2, Users, CalendarDays, Sparkles, Plane, MapPin, Languages, Moon, Sun } from "lucide-react";
import { useLanguage } from "@/app/components/useLanguage";
import { useTheme } from "@/app/components/ThemeClient";

/* ---------------- TYPES ---------------- */

type Participant = {
  name: string;
};

type CountType = "people";
type RecurrenceType = "none" | "weekly" | "monthly" | "yearly";
type ItemData = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location?: string;
  description?: string;
  participants?: Participant[];
  recurrence?: RecurrenceType;
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
  const recurrenceSummary = (recurrence?: RecurrenceType) => {
    if (!recurrence || recurrence === "none") return strings.labels.repeatNone;
    if (recurrence === "weekly") return strings.labels.repeatWeekly;
    if (recurrence === "monthly") return strings.labels.repeatMonthly;
    return strings.labels.repeatYearly;
  };
  const addRecurrence = (date: Date, recurrence: RecurrenceType) => {
    const next = new Date(date);
    if (recurrence === "weekly") next.setDate(next.getDate() + 7);
    if (recurrence === "monthly") next.setMonth(next.getMonth() + 1);
    if (recurrence === "yearly") next.setFullYear(next.getFullYear() + 1);
    return next;
  };
  const [item, setItem] = useState<ItemData | null>(null);
  const [description, setDescription] = useState("");

  // Participant input
  const [pName, setPName] = useState("");

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

  async function createNextTripOccurrence() {
    if (itemType !== "trip") return;
    if (!item?.recurrence || item.recurrence === "none") return;
    const start = new Date(`${item.startDate}T00:00:00`);
    const end = new Date(`${item.endDate}T00:00:00`);
    const nextStart = addRecurrence(start, item.recurrence);
    const nextEnd = addRecurrence(end, item.recurrence);
    await addDoc(collection(db, "trips"), {
      name: item.name,
      startDate: nextStart.toISOString().slice(0, 10),
      endDate: nextEnd.toISOString().slice(0, 10),
      participants: item.participants || [],
      recurrence: item.recurrence,
    });
  }

  function openEditTodo(todo: Todo) {
    setEditTodoOriginal(todo);
    setEditTodoText(todo.text);
    setEditTodoPic(todo.pic);
    setEditTodoDue(todo.dueDate);
    setShowEditTodo(true);
  }

  function resetEditTodo() {
    setShowEditTodo(false);
    setEditTodoOriginal(null);
    setEditTodoText("");
    setEditTodoPic("");
    setEditTodoDue("");
  }

  async function updateTodo() {
    if (!editTodoOriginal) return;
    if (!editTodoText.trim() || !editTodoPic.trim() || !editTodoDue) return;
    await updateDoc(doc(db, collectionName, id), {
      todos: arrayRemove(editTodoOriginal),
    });
    await updateDoc(doc(db, collectionName, id), {
      todos: arrayUnion({
        ...editTodoOriginal,
        text: editTodoText.trim(),
        pic: editTodoPic.trim(),
        dueDate: editTodoDue,
      }),
    });
    resetEditTodo();
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
          {itemType === "trip" ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-xs text-cute-muted">
                {strings.labels.repeat}: {recurrenceSummary(item.recurrence)}
              </p>
              {item.recurrence && item.recurrence !== "none" ? (
                <button
                  className="mini-nav"
                  onClick={createNextTripOccurrence}
                  aria-label={strings.actions.createNextTrip}
                  title={strings.actions.createNextTrip}
                >
                  +
                </button>
              ) : null}
            </div>
          ) : null}

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

      </main>

      {showEditTodo && (
        <div className="fixed inset-0 bg-black/35 flex items-end" onClick={resetEditTodo}>
          <div
            className="modal-sheet w-full rounded-t-[28px] p-6 shadow-[0_-20px_60px_rgba(0,0,0,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-lg font-extrabold tracking-tight">{strings.labels.editTodo}</p>
              <button className="mini-nav" onClick={resetEditTodo}>
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <input
                placeholder={strings.labels.task}
                value={editTodoText}
                onChange={(event) => setEditTodoText(event.target.value)}
                className="cute-input"
              />
              <div>
                <p className="cute-label">{strings.labels.pic}</p>
                <input
                  placeholder={strings.labels.assignPic}
                  value={editTodoPic}
                  onChange={(event) => setEditTodoPic(event.target.value)}
                  className="cute-input"
                />
              </div>
              <div>
                <p className="cute-label">{strings.labels.dueDate}</p>
                <input
                  type="date"
                  value={editTodoDue}
                  onChange={(event) => setEditTodoDue(event.target.value)}
                  className="cute-input"
                />
              </div>
              <button
                onClick={updateTodo}
                className="w-full py-3 rounded-2xl bg-cute-accent text-white font-extrabold shadow-cute active:scale-[0.99] transition disabled:opacity-50"
                disabled={!editTodoText.trim() || !editTodoPic.trim() || !editTodoDue}
              >
                {strings.actions.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
