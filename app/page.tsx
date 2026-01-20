"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  Plus,
  Trash2,
  LogOut,
  CalendarDays,
  List,
  Sparkles,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  Plane,
  CheckSquare,
  Heart,
} from "lucide-react";
import { useRouter } from "next/navigation";

/* ---------------- DATE HELPERS ---------------- */
function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isDateInRange(dateStr: string, startStr: string, endStr?: string) {
  if (!endStr) return dateStr === startStr;
  return dateStr >= startStr && dateStr <= endStr;
}

type CreateMode = "pick" | "event" | "trip" | "todo" | "wishlist";

type GlobalTodo = {
  id: string;
  text: string;
  dueDate: string;
  done: boolean;
  createdAt?: string;
};

type WishlistItem = {
  id: string;
  text: string;
  done: boolean;
  createdAt?: string;
};

export default function HomePage() {
  const [user, setUser] = useState<any>(null);

  const [events, setEvents] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [globalTodos, setGlobalTodos] = useState<GlobalTodo[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  const today = new Date();
  const todayStr = formatDate(today);

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Create modal
  const [showModal, setShowModal] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>("pick");

  // Shared inputs
  const [name, setName] = useState("");

  // Trip inputs
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");

  // Event inputs
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");

  // Global TODO inputs
  const [todoText, setTodoText] = useState("");
  const [todoDue, setTodoDue] = useState("");

  // Wishlist inputs
  const [wishText, setWishText] = useState("");

  const router = useRouter();

  function goPrevMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  }
  function goNextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  }

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        return;
      }
      const demo =
        typeof window !== "undefined" &&
        localStorage.getItem("demoUser") === "1";
      if (demo) setUser({ name: "Demo User", demo: true });
      else setUser(null);
    });

    const unsubTrips = onSnapshot(collection(db, "trips"), (snap) => {
      setTrips(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubEvents = onSnapshot(collection(db, "events"), (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubTodos = onSnapshot(collection(db, "todos"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setGlobalTodos(list as GlobalTodo[]);
    });

    // NEW: wishlist
    const unsubWishlist = onSnapshot(collection(db, "wishlist"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setWishlist(list as WishlistItem[]);
    });

    return () => {
      unsubAuth();
      unsubTrips();
      unsubEvents();
      unsubTodos();
      unsubWishlist();
    };
  }, []);

  /* ---------------- CALENDAR DATA ---------------- */
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = useMemo(() => {
    return [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
  }, [firstDay, daysInMonth]);

  /* ---------------- LISTS & FILTERS ---------------- */

  const tripTodosForDate = useMemo(() => {
    return (trips || []).flatMap((trip) =>
      (trip.todos || [])
        .filter((todo: any) => todo.dueDate === selectedDate)
        .map((todo: any) => ({
          ...todo,
          source: "trip" as const,
          tripName: trip.name,
          tripId: trip.id,
        }))
    );
  }, [trips, selectedDate]);

  const globalTodosForDate = useMemo(() => {
    return (globalTodos || [])
      .filter((t) => t.dueDate === selectedDate)
      .map((t) => ({ ...t, source: "global" as const }));
  }, [globalTodos, selectedDate]);

  const todosForDateCombined = useMemo(() => {
    return [...globalTodosForDate, ...tripTodosForDate];
  }, [globalTodosForDate, tripTodosForDate]);

  const eventsSoon = useMemo(() => {
    const sorted = [...(events || [])].sort((a, b) =>
      String(a.startDate || "").localeCompare(String(b.startDate || ""))
    );
    return sorted.slice(0, 6);
  }, [events]);

  const tripsSoon = useMemo(() => {
    const sorted = [...(trips || [])].sort((a, b) =>
      String(a.startDate || "").localeCompare(String(b.startDate || ""))
    );
    return sorted.slice(0, 6);
  }, [trips]);

  const todosSoon = useMemo(() => {
    const fromTrips = (trips || []).flatMap((trip) =>
      (trip.todos || []).map((todo: any) => ({
        ...todo,
        source: "trip" as const,
        tripName: trip.name,
        tripId: trip.id,
      }))
    );

    const fromGlobal = (globalTodos || []).map((t) => ({
      ...t,
      source: "global" as const,
    }));

    const all = [...fromGlobal, ...fromTrips];

    all.sort((a: any, b: any) =>
      String(a.dueDate || "").localeCompare(String(b.dueDate || ""))
    );

    return all.slice(0, 10);
  }, [trips, globalTodos]);

  const wishlistSoon = useMemo(() => {
    const sorted = [...(wishlist || [])].sort((a, b) =>
      String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
    );
    return sorted.slice(0, 10);
  }, [wishlist]);

  /* ---------------- ACTIONS ---------------- */

  function resetModalInputs() {
    setName("");

    setTripStartDate("");
    setTripEndDate("");

    setEventStartDate("");
    setEventEndDate("");
    setStartTime("");
    setEndTime("");
    setLocation("");

    setTodoText("");
    setTodoDue("");

    setWishText("");

    setCreateMode("pick");
  }

  async function createTrip() {
    if (!name || !tripStartDate || !tripEndDate) return;

    await addDoc(collection(db, "trips"), {
      name,
      startDate: tripStartDate,
      endDate: tripEndDate,
    });

    setShowModal(false);
    resetModalInputs();
  }

  async function createEvent() {
    if (!name || !eventStartDate || !eventEndDate || !startTime || !endTime)
      return;

    await addDoc(collection(db, "events"), {
      name,
      startDate: eventStartDate,
      endDate: eventEndDate,
      startTime,
      endTime,
      location,
    });

    setShowModal(false);
    resetModalInputs();
  }

  async function createGlobalTodo() {
    if (!todoText || !todoDue) return;

    await addDoc(collection(db, "todos"), {
      text: todoText,
      dueDate: todoDue,
      done: false,
      createdAt: new Date().toISOString(),
    });

    setShowModal(false);
    resetModalInputs();
  }

  async function toggleGlobalTodo(todo: GlobalTodo) {
    await updateDoc(doc(db, "todos", todo.id), { done: !todo.done });
  }

  async function deleteGlobalTodo(todo: GlobalTodo) {
    await deleteDoc(doc(db, "todos", todo.id));
  }

  async function createWishlistItem() {
    if (!wishText) return;

    await addDoc(collection(db, "wishlist"), {
      text: wishText,
      done: false,
      createdAt: new Date().toISOString(),
    });

    setShowModal(false);
    resetModalInputs();
  }

  async function toggleWishlistItem(item: WishlistItem) {
    await updateDoc(doc(db, "wishlist", item.id), { done: !item.done });
  }

  async function deleteWishlistItem(item: WishlistItem) {
    await deleteDoc(doc(db, "wishlist", item.id));
  }

  /* ---------------- LOGIN SCREEN ---------------- */
  if (!user) {
    return (
      <main className="min-h-screen bg-cute text-cute-ink relative overflow-hidden flex items-center justify-center px-5">
        <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/40 blur-2xl" />
        <div className="pointer-events-none absolute top-24 -right-24 w-80 h-80 rounded-full bg-white/35 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 w-96 h-96 rounded-full bg-white/30 blur-3xl" />

        <div className="max-w-md w-full">
          <div className="card-cute text-left">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-white/75 shadow-cute flex items-center justify-center">
                <Sparkles />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-cute-muted">Welcome back</p>
                <h1 className="text-4xl font-extrabold tracking-tight">
                  Asuka ✨
                </h1>
                <p className="text-sm text-cute-muted mt-1">
                  Events • Trips • TODOs • Wishlist
                </p>
              </div>
            </div>

            <button
              className="mt-5 w-full px-8 py-4 rounded-2xl bg-cute-accent text-white font-extrabold shadow-cute hover:opacity-95 active:scale-[0.99] transition"
              onClick={() => {
                localStorage.setItem("demoUser", "1");
                setUser({ name: "Demo User", demo: true });
              }}
            >
              Let’s go!
            </button>

            <p className="text-xs text-cute-muted mt-3">Demo login (local only).</p>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------- MAIN UI ---------------- */
  return (
    <div className="min-h-screen bg-cute text-cute-ink pb-28">
      {/* HEADER */}
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-cute-muted">Your little planner</p>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              Planner <PartyPopper className="opacity-80" size={22} />
            </h1>
          </div>

          <div className="pill">
            <span className="text-xs text-cute-muted">Today</span>
            <span className="text-sm font-semibold">{todayStr}</span>
          </div>
        </div>
      </header>

      {/* 2) CALENDAR FIRST */}
      <section className="px-5">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Calendar */}
          <div className="card-cute">
            <div className="flex items-center justify-between mb-3">
              <span className="badge badge-mint">
                <CalendarDays size={14} />
                Calendar
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={goPrevMonth}
                  className="mini-nav"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={18} />
                </button>

                <h2 className="text-sm font-semibold">
                  {currentMonth.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>

                <button
                  onClick={goNextMonth}
                  className="mini-nav"
                  aria-label="Next month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div
                  key={`${d}-${i}`}
                  className="text-center text-xs text-cute-muted"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;

                const dateStr = formatDate(new Date(year, month, day));
                const isSelected = selectedDate === dateStr;
                const isPast = dateStr < todayStr;

                const hasEvent = events.some((e) => e.startDate === dateStr);
                const hasTrip = trips.some((t) =>
                  isDateInRange(dateStr, t.startDate, t.endDate)
                );

                const tripTodosOnDay = trips.flatMap((t) =>
                  (t.todos || []).filter((todo: any) => todo.dueDate === dateStr)
                );
                const globalTodosOnDay = globalTodos.filter(
                  (t) => t.dueDate === dateStr
                );

                const todosOnDay = [...globalTodosOnDay, ...tripTodosOnDay];
                const hasDeadline = todosOnDay.length > 0;

                const hasPendingTodo = todosOnDay.some((todo: any) => !todo.done);
                const hasCompletedTodo =
                  todosOnDay.length > 0 && !hasPendingTodo;

                // 1) Past dates should be gray
                const baseClass = isSelected
                  ? "bg-cute-accent text-white"
                  : isPast
                  ? "bg-white/25 text-gray-400"
                  : hasPendingTodo
                  ? "bg-red-500/20"
                  : hasCompletedTodo
                  ? "bg-green-500/20"
                  : hasEvent || hasTrip
                  ? "bg-white/60"
                  : "bg-white/35";

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={[
                      "relative h-11 rounded-2xl text-sm font-semibold transition active:scale-[0.98]",
                      "shadow-[0_10px_30px_rgba(0,0,0,0.08)]",
                      baseClass,
                        isSelected ? "" : isPast ? "text-gray-400" : "text-cute-ink",
                        isPast && !isSelected ? "opacity-80" : "",

                    ].join(" ")}
                  >
                    {day}

                    {/* Dot Indicators */}
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                      {hasEvent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                      {hasTrip && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      )}
                      {hasDeadline && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-cute-muted">
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Event
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" /> Trip
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" /> TODO deadline
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400" /> Past date
              </span>
            </div>
          </div>

          {/* Selected Date Details */}
          <div className="card-cute">
            <div className="flex items-center justify-between mb-2">
              <span className="badge badge-sun">
                <List size={14} />
                Details
              </span>
              <span className="pill">
                <span className="text-xs text-cute-muted">Selected</span>
                <span className="text-sm font-semibold">{selectedDate}</span>
              </span>
            </div>

            {/* EVENTS + TRIPS */}
            <div className="mt-3">
              <p className="text-xs text-cute-muted mb-2">EVENTS & TRIPS</p>

              {events
                .filter((e) => e.startDate === selectedDate)
                .map((event) => (
                  <div
                    key={event.id}
                    onClick={() => router.push(`/event/${event.id}`)}
                    className="detail-pill detail-blue"
                    role="button"
                    tabIndex={0}
                  >
                    <p className="font-semibold">{event.name}</p>
                    <p className="text-xs opacity-80">
                      {event.startTime} → {event.endTime}
                      {event.location ? ` • ${event.location}` : ""}
                    </p>
                  </div>
                ))}

              {trips
                .filter((t) =>
                  isDateInRange(selectedDate, t.startDate, t.endDate)
                )
                .map((trip) => (
                  <div
                    key={trip.id}
                    onClick={() => router.push(`/trip/${trip.id}`)}
                    className="detail-pill detail-purple"
                    role="button"
                    tabIndex={0}
                  >
                    <p className="font-semibold">{trip.name}</p>
                    <p className="text-xs opacity-80">
                      {trip.startDate} → {trip.endDate}
                    </p>
                  </div>
                ))}

              {events.filter((e) => e.startDate === selectedDate).length === 0 &&
                trips.filter((t) =>
                  isDateInRange(selectedDate, t.startDate, t.endDate)
                ).length === 0 && (
                  <p className="text-sm text-cute-muted">No events or trips</p>
                )}
            </div>

            {/* TODO DEADLINES (combined) */}
            <div className="mt-5">
              <p className="text-xs text-cute-muted mb-2">TODO DEADLINES</p>

              {todosForDateCombined.map((todo: any, i: number) => {
                const isGlobal = todo.source === "global";

                return (
                  <div
                    key={`${todo.source}-${todo.id || todo.tripId}-${todo.text}-${i}`}
                    onClick={() => {
                      if (isGlobal) toggleGlobalTodo(todo);
                      else router.push(`/trip/${todo.tripId}`);
                    }}
                    className={`detail-pill ${
                      todo.done ? "detail-green" : "detail-red"
                    }`}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p
                          className={`font-semibold ${
                            todo.done ? "line-through opacity-80" : ""
                          }`}
                        >
                          {todo.text}
                        </p>
                        <p className="text-xs opacity-80">
                          {isGlobal
                            ? `Global • Due: ${todo.dueDate}`
                            : `${todo.tripName} • PIC: ${todo.pic}`}
                        </p>
                      </div>

                      {isGlobal ? (
                        <button
                          className="icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteGlobalTodo(todo);
                          }}
                          aria-label="Delete todo"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {todosForDateCombined.length === 0 && (
                <p className="text-sm text-cute-muted">No deadlines</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3) LIST SECTIONS */}
      <section className="px-5 mt-5">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* EVENTS */}
          <div className="card-cute">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="badge badge-blue">
                  <Sparkles size={14} />
                  Events
                </span>
                <span className="text-xs text-cute-muted">
                  {events.length} total
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {eventsSoon.map((event) => (
                <div
                  key={event.id}
                  className="row-cute"
                  onClick={() => router.push(`/event/${event.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{event.name}</p>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-cute-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={13} />
                        {event.startDate} {event.startTime} → {event.endDate}{" "}
                        {event.endTime}
                      </span>

                      {event.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={13} />
                          {event.location}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDoc(doc(db, "events", event.id));
                    }}
                    aria-label="Delete event"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              {eventsSoon.length === 0 && (
                <p className="text-sm text-cute-muted">No events yet</p>
              )}
            </div>
          </div>

          {/* TRIPS */}
          <div className="card-cute">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="badge badge-purple">
                  <Plane size={14} />
                  Trips
                </span>
                <span className="text-xs text-cute-muted">
                  {trips.length} total
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {tripsSoon.map((trip) => (
                <div
                  key={trip.id}
                  className="row-cute"
                  onClick={() => router.push(`/trip/${trip.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{trip.name}</p>
                    <p className="text-xs text-cute-muted mt-1">
                      {trip.startDate} → {trip.endDate}
                    </p>
                  </div>

                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDoc(doc(db, "trips", trip.id));
                    }}
                    aria-label="Delete trip"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              {tripsSoon.length === 0 && (
                <p className="text-sm text-cute-muted">No trips yet</p>
              )}
            </div>
          </div>

          {/* TODOs */}
          <div className="card-cute">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="badge badge-pink">
                  <CheckSquare size={14} />
                  TODOs
                </span>
                <span className="text-xs text-cute-muted">
                  global + trip deadlines
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {todosSoon.map((todo: any, i: number) => {
                const isGlobal = todo.source === "global";

                return (
                  <div
                    key={`${todo.source}-${todo.id || todo.tripId}-${todo.text}-${todo.dueDate}-${i}`}
                    className={`row-cute ${todo.done ? "opacity-80" : ""}`}
                    onClick={() => {
                      if (isGlobal) toggleGlobalTodo(todo);
                      else router.push(`/trip/${todo.tripId}`);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="min-w-0">
                      <p
                        className={`font-semibold truncate ${
                          todo.done ? "line-through text-cute-muted" : ""
                        }`}
                      >
                        {todo.text}
                      </p>

                      <p className="text-xs text-cute-muted mt-1">
                        {isGlobal
                          ? `Global • Due: ${todo.dueDate}`
                          : `${todo.tripName} • PIC: ${todo.pic} • Due: ${todo.dueDate}`}
                      </p>
                    </div>

                    {isGlobal ? (
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteGlobalTodo(todo);
                        }}
                        aria-label="Delete todo"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    ) : null}
                  </div>
                );
              })}

              {todosSoon.length === 0 && (
                <p className="text-sm text-cute-muted">No TODO deadlines</p>
              )}
            </div>
          </div>

          {/* Wishlist */}
          <div className="card-cute">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="badge"
                  style={{ color: "#db2777" /* pink */ }}
                >
                  <Heart size={14} />
                  Wishlist
                </span>
                <span className="text-xs text-cute-muted">
                  {wishlist.length} items
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {wishlistSoon.map((w) => (
                <div
                  key={w.id}
                  className={`row-cute ${w.done ? "opacity-80" : ""}`}
                  onClick={() => toggleWishlistItem(w)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="min-w-0">
                    <p
                      className={`font-semibold truncate ${
                        w.done ? "line-through text-cute-muted" : ""
                      }`}
                    >
                      {w.text}
                    </p>
                    <p className="text-xs text-cute-muted mt-1">
                      Someday ✨ (tap to mark done)
                    </p>
                  </div>

                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWishlistItem(w);
                    }}
                    aria-label="Delete wishlist item"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              {wishlistSoon.length === 0 && (
                <p className="text-sm text-cute-muted">
                  Nothing yet — add a “someday” idea!
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Floating Add */}
      <button
        onClick={() => {
          setShowModal(true);
          setCreateMode("pick");
        }}
        className="fixed bottom-24 right-6 w-16 h-16 rounded-3xl bg-cute-accent text-white shadow-cute flex items-center justify-center active:scale-[0.98] transition"
        aria-label="Add"
        title="Add"
      >
        <Plus size={28} />
      </button>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/50 backdrop-blur-md border-t border-white/60 py-4 flex justify-center">
        <button
          onClick={async () => {
            localStorage.removeItem("demoUser");
            await signOut(auth);
            setUser(null);
          }}
          className="px-4 py-2 rounded-2xl bg-white/70 shadow-cute hover:opacity-95 active:scale-[0.99] transition inline-flex items-center gap-2"
        >
          <LogOut size={18} />
          <span className="font-semibold text-sm">Logout</span>
        </button>
      </nav>

      {/* Create Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-end"
          onClick={() => {
            setShowModal(false);
            resetModalInputs();
          }}
        >
          <div
            className="bg-white w-full rounded-t-[28px] p-6 animate-slideUp shadow-[0_-20px_60px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Picker */}
{createMode === "pick" && (
  <>
    <div className="flex items-center justify-between mb-3">
      <p className="text-lg font-extrabold tracking-tight text-cute-ink">
        Add something ✨
      </p>
      <button
        className="mini-nav"
        onClick={() => {
          setShowModal(false);
          resetModalInputs();
        }}
      >
        ✕
      </button>
    </div>

    {/* 2x2 grid */}
    <div className="grid grid-cols-2 gap-3">
      {/* Event */}
      <button
        className="pick-btn pick-event"
        onClick={() => setCreateMode("event")}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/70 shadow-cute flex items-center justify-center">
            <Sparkles />
          </div>
          <div className="text-left">
            <p className="font-extrabold leading-tight">Event</p>
            <p className="text-xs opacity-80">meetups, plans</p>
          </div>
        </div>
      </button>

      {/* Trip */}
      <button
        className="pick-btn pick-trip"
        onClick={() => setCreateMode("trip")}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/70 shadow-cute flex items-center justify-center">
            <Plane />
          </div>
          <div className="text-left">
            <p className="font-extrabold leading-tight">Trip</p>
            <p className="text-xs opacity-80">travel plan</p>
          </div>
        </div>
      </button>

      {/* TODO */}
      <button
        className="pick-btn"
        onClick={() => setCreateMode("todo")}
        style={{
          boxShadow:
            "inset 4px 0 0 rgba(239, 68, 68, 0.55), 0 18px 45px rgba(0, 0, 0, 0.12)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/70 shadow-cute flex items-center justify-center">
            <CheckSquare />
          </div>
          <div className="text-left">
            <p className="font-extrabold leading-tight">TODO</p>
            <p className="text-xs opacity-80">has deadline</p>
          </div>
        </div>
      </button>

      {/* Wishlist */}
      <button
        className="pick-btn"
        onClick={() => setCreateMode("wishlist")}
        style={{
          boxShadow:
            "inset 4px 0 0 rgba(219, 39, 119, 0.55), 0 18px 45px rgba(0, 0, 0, 0.12)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/70 shadow-cute flex items-center justify-center">
            <Heart />
          </div>
          <div className="text-left">
            <p className="font-extrabold leading-tight">Wishlist</p>
            <p className="text-xs opacity-80">someday ✨</p>
          </div>
        </div>
      </button>
    </div>

    {/* tiny hint */}
    <p className="text-xs text-cute-muted mt-3">
      Tip: TODO = deadline. Wishlist = no deadline.
    </p>
  </>
)}


            {/* Event form */}
            {createMode === "event" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-lg font-extrabold tracking-tight text-cute-ink">
                    Create Event
                  </p>
                  <button
                    className="mini-nav"
                    onClick={() => setCreateMode("pick")}
                  >
                    ←
                  </button>
                </div>

                <div className="space-y-3">
                  <input
                    placeholder="Event name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="cute-input"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="cute-label">Start date</p>
                      <input
                        type="date"
                        value={eventStartDate}
                        onChange={(e) => {
                          setEventStartDate(e.target.value);
                          if (!eventEndDate) setEventEndDate(e.target.value);
                        }}
                        className="cute-input"
                      />
                    </div>
                    <div>
                      <p className="cute-label">End date</p>
                      <input
                        type="date"
                        value={eventEndDate}
                        onChange={(e) => setEventEndDate(e.target.value)}
                        className="cute-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="cute-label">Start time</p>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="cute-input"
                      />
                    </div>
                    <div>
                      <p className="cute-label">End time</p>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="cute-input"
                      />
                    </div>
                  </div>

                  <input
                    placeholder="Location (optional)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="cute-input"
                  />

                  <button
                    onClick={createEvent}
                    className="w-full py-4 rounded-2xl bg-cute-accent text-white font-extrabold shadow-cute active:scale-[0.99] transition disabled:opacity-50"
                    disabled={
                      !name ||
                      !eventStartDate ||
                      !eventEndDate ||
                      !startTime ||
                      !endTime
                    }
                  >
                    Create Event
                  </button>
                </div>
              </>
            )}

            {/* Trip form */}
            {createMode === "trip" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-lg font-extrabold tracking-tight text-cute-ink">
                    Create Trip
                  </p>
                  <button
                    className="mini-nav"
                    onClick={() => setCreateMode("pick")}
                  >
                    ←
                  </button>
                </div>

                <div className="space-y-3">
                  <input
                    placeholder="Trip name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="cute-input"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="cute-label">Start date</p>
                      <input
                        type="date"
                        value={tripStartDate}
                        onChange={(e) => setTripStartDate(e.target.value)}
                        className="cute-input"
                      />
                    </div>
                    <div>
                      <p className="cute-label">End date</p>
                      <input
                        type="date"
                        value={tripEndDate}
                        onChange={(e) => setTripEndDate(e.target.value)}
                        className="cute-input"
                      />
                    </div>
                  </div>

                  <button
                    onClick={createTrip}
                    className="w-full py-4 rounded-2xl bg-cute-accent text-white font-extrabold shadow-cute active:scale-[0.99] transition disabled:opacity-50"
                    disabled={!name || !tripStartDate || !tripEndDate}
                  >
                    Create Trip
                  </button>
                </div>
              </>
            )}

            {/* Global TODO form */}
            {createMode === "todo" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-lg font-extrabold tracking-tight text-cute-ink">
                    Create TODO
                  </p>
                  <button
                    className="mini-nav"
                    onClick={() => setCreateMode("pick")}
                  >
                    ←
                  </button>
                </div>

                <div className="space-y-3">
                  <input
                    placeholder="What do you need to do?"
                    value={todoText}
                    onChange={(e) => setTodoText(e.target.value)}
                    className="cute-input"
                  />

                  <div>
                    <p className="cute-label">Due date</p>
                    <input
                      type="date"
                      value={todoDue}
                      onChange={(e) => setTodoDue(e.target.value)}
                      className="cute-input"
                    />
                  </div>

                  <button
                    onClick={createGlobalTodo}
                    className="w-full py-4 rounded-2xl bg-cute-accent text-white font-extrabold shadow-cute active:scale-[0.99] transition disabled:opacity-50"
                    disabled={!todoText || !todoDue}
                  >
                    Add TODO
                  </button>
                </div>
              </>
            )}

            {/* Wishlist form */}
            {createMode === "wishlist" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-lg font-extrabold tracking-tight text-cute-ink">
                    Add Wishlist Item
                  </p>
                  <button
                    className="mini-nav"
                    onClick={() => setCreateMode("pick")}
                  >
                    ←
                  </button>
                </div>

                <div className="space-y-3">
                  <input
                    placeholder="Something you want to do someday…"
                    value={wishText}
                    onChange={(e) => setWishText(e.target.value)}
                    className="cute-input"
                  />

                  <button
                    onClick={createWishlistItem}
                    className="w-full py-4 rounded-2xl bg-cute-accent text-white font-extrabold shadow-cute active:scale-[0.99] transition disabled:opacity-50"
                    disabled={!wishText}
                  >
                    Add to Wishlist
                  </button>

                  <p className="text-xs text-cute-muted">
                    No deadline — just vibes ✨
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
