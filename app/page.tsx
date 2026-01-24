"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
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
  Moon,
  Sun,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "./components/ThemeClient";
import { useLanguage } from "./components/useLanguage";

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

/* ---------------- TYPES ---------------- */
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
type CountType = "total" | "items" | "tasks" | "people";

/* ---------------- DELIGHT HELPERS ---------------- */
function seasonEmoji(monthIndex0: number) {
  if (monthIndex0 === 2 || monthIndex0 === 3 || monthIndex0 === 4) return "🌸";
  if (monthIndex0 === 5 || monthIndex0 === 6 || monthIndex0 === 7) return "☀️";
  if (monthIndex0 === 8 || monthIndex0 === 9 || monthIndex0 === 10) return "🍁";
  return "❄️";
}
function dailyMood(todayStr: string, moods: string[]) {
  let hash = 0;
  for (let i = 0; i < todayStr.length; i++) hash = (hash * 31 + todayStr.charCodeAt(i)) >>> 0;
  return moods[hash % moods.length];
}

/* ---------------- CONFETTI ---------------- */
function ConfettiBurst({ show }: { show: boolean }) {
  const pieces = useMemo(() => {
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: Math.round(Math.random() * 92) + 4,
      delay: Math.random() * 180,
      bg: `hsl(${Math.floor(Math.random() * 360)} 85% 70%)`,
    }));
  }, []);
  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.bg,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* ---------------- PAGE ---------------- */
export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const { language, strings, toggleLanguage } = useLanguage();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);

  const [events, setEvents] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [globalTodos, setGlobalTodos] = useState<GlobalTodo[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  const today = new Date();
  const todayStr = formatDate(today);

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [showModal, setShowModal] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>("pick");

  const [name, setName] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");

  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [eventRecurring, setEventRecurring] = useState<"no" | "yes">("no");

  const [todoText, setTodoText] = useState("");
  const [todoDue, setTodoDue] = useState("");

  const [wishText, setWishText] = useState("");

  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimer = useRef<number | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        return;
      }
      const demo = typeof window !== "undefined" && localStorage.getItem("demoUser") === "1";
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

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = useMemo(() => {
    return [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  }, [firstDay, daysInMonth]);

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

  const todosSoon = useMemo(() => {
    const fromTrips = (trips || []).flatMap((trip) =>
      (trip.todos || []).map((todo: any) => ({
        ...todo,
        source: "trip" as const,
        tripName: trip.name,
        tripId: trip.id,
      }))
    );
    const fromGlobal = (globalTodos || []).map((t) => ({ ...t, source: "global" as const }));
    const all = [...fromGlobal, ...fromTrips];
    all.sort((a: any, b: any) => String(a.dueDate || "").localeCompare(String(b.dueDate || "")));
    return all.slice(0, 10);
  }, [trips, globalTodos]);

  const eventsSoon = useMemo(() => {
    const sorted = [...(events || [])].sort((a, b) => String(a.startDate || "").localeCompare(String(b.startDate || "")));
    return sorted.slice(0, 6);
  }, [events]);

  const tripsSoon = useMemo(() => {
    const sorted = [...(trips || [])].sort((a, b) => String(a.startDate || "").localeCompare(String(b.startDate || "")));
    return sorted.slice(0, 6);
  }, [trips]);

  const wishlistSoon = useMemo(() => {
    const sorted = [...(wishlist || [])].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return sorted.slice(0, 10);
  }, [wishlist]);

  const todaysTodos = useMemo(() => {
    const forToday = (globalTodos || []).filter((t) => t.dueDate === todayStr);
    const tripForToday = (trips || []).flatMap((trip) => (trip.todos || []).filter((todo: any) => todo.dueDate === todayStr));
    return [...forToday, ...tripForToday];
  }, [globalTodos, trips, todayStr]);

  const todayAllDone = useMemo(() => {
    if (todaysTodos.length === 0) return false;
    return todaysTodos.every((t: any) => !!t.done);
  }, [todaysTodos]);

  useEffect(() => {
    if (!todayAllDone) return;
    const key = `asuka_confetti_done_${todayStr}`;
    const already = typeof window !== "undefined" ? sessionStorage.getItem(key) : "1";
    if (already) return;

    sessionStorage.setItem(key, "1");
    setShowConfetti(true);
    if (confettiTimer.current) window.clearTimeout(confettiTimer.current);
    confettiTimer.current = window.setTimeout(() => setShowConfetti(false), 1200);
  }, [todayAllDone, todayStr]);

  function resetModalInputs() {
    setName("");
    setTripStartDate("");
    setTripEndDate("");
    setEventStartDate("");
    setEventEndDate("");
    setStartTime("");
    setEndTime("");
    setLocation("");
    setEventRecurring("no");
    setTodoText("");
    setTodoDue("");
    setWishText("");
    setCreateMode("pick");
  }

  async function createTrip() {
    if (!name || !tripStartDate || !tripEndDate) return;
    await addDoc(collection(db, "trips"), { name, startDate: tripStartDate, endDate: tripEndDate });
    setShowModal(false);
    resetModalInputs();
  }

  async function createEvent() {
    if (!name || !eventStartDate || !eventEndDate || !startTime || !endTime) return;
    await addDoc(collection(db, "events"), {
      name,
      startDate: eventStartDate,
      endDate: eventEndDate,
      startTime,
      endTime,
      location,
      recurring: eventRecurring === "yes",
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

  // Delay fix helpers: prefetch + transition
  const goEvent = (id: string) => startTransition(() => router.push(`/event/${id}`));
  const goTrip = (id: string) => startTransition(() => router.push(`/trip/${id}`));
  const prefetchEvent = (id: string) => router.prefetch(`/event/${id}`);
  const prefetchTrip = (id: string) => router.prefetch(`/trip/${id}`);

  const headerMood = dailyMood(todayStr, strings.moods);
  const season = seasonEmoji(today.getMonth());
  const nextLanguageLabel = language === "en" ? "日本語" : "EN";
  const locale = strings.locale;
  const countLabel = (count: number, type: CountType) =>
    language === "ja" ? `${count}${strings.labels[type]}` : `${count} ${strings.labels[type]}`;

  /* ---------------- LOGIN ---------------- */
  if (!user) {
    const monaSrc =
      theme === "night"
        ? "https://github.githubassets.com/images/mona-loading-dark.gif"
        : "https://github.githubassets.com/images/mona-loading-default.gif";

    return (
      <main className="min-h-screen bg-cute text-cute-ink relative overflow-hidden flex items-center justify-center px-5">
        <ConfettiBurst show={showConfetti} />

        <div className="login-blob blob1" />
        <div className="login-blob blob2" />
        <div className="login-blob blob3" />

        <div className="max-w-md w-full">
          <div className="card-cute text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-cute-muted">{strings.messages.welcomeBack}</p>
                <h1 className="text-4xl font-extrabold tracking-tight">{strings.labels.appName} ✨</h1>
                <p className="text-sm text-cute-muted mt-1">{strings.messages.subtitle}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="lang-toggle"
                  onClick={toggleLanguage}
                  aria-label={language === "en" ? strings.actions.switchToJapanese : strings.actions.switchToEnglish}
                  title={language === "en" ? strings.actions.switchToJapanese : strings.actions.switchToEnglish}
                >
                  <span className="lang-dot" />
                  <span className="text-xs font-semibold">{nextLanguageLabel}</span>
                </button>
                <button
                  className="mini-nav"
                  onClick={toggleTheme}
                  aria-label={strings.actions.toggleTheme}
                  title={strings.actions.toggleTheme}
                >
                  {theme === "day" ? <Moon size={18} /> : <Sun size={18} />}
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center">
              <img
                src={monaSrc}
                alt="Mona loading"
                width={150}
                height={150}
                className="cute-float"
                style={{ imageRendering: "auto" }}
              />
            </div>

            <p className="text-sm text-cute-muted mt-2 text-center">{strings.messages.catchingZ}</p>

            <button
              className="mt-5 w-full px-8 py-4 rounded-2xl bg-cute-accent text-white font-extrabold shadow-cute hover:opacity-95 active:scale-[0.99] transition"
              onClick={() => {
                localStorage.setItem("demoUser", "1");
                setUser({ name: "Demo User", demo: true });
              }}
            >
              {strings.messages.letsGo}
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------- MAIN ---------------- */
  return (
    <div className="min-h-screen bg-cute text-cute-ink pb-28">
      <ConfettiBurst show={showConfetti} />

      <header className="px-5 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-cute-muted">
              {strings.labels.tagline} {season}
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              {strings.labels.planner} <PartyPopper className="opacity-80" size={22} />
            </h1>
            <p className="text-sm text-cute-muted mt-1">{todayAllDone ? strings.messages.nothingUrgent : headerMood}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="lang-toggle"
              onClick={toggleLanguage}
              aria-label={language === "en" ? strings.actions.switchToJapanese : strings.actions.switchToEnglish}
              title={language === "en" ? strings.actions.switchToJapanese : strings.actions.switchToEnglish}
            >
              <span className="lang-dot" />
              <span className="text-xs font-semibold">{nextLanguageLabel}</span>
            </button>

            <button
              className="mini-nav"
              onClick={toggleTheme}
              aria-label={strings.actions.toggleTheme}
              title={strings.actions.toggleTheme}
            >
              {theme === "day" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* CALENDAR FIRST */}
      <section className="px-5">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card-cute">
            <div className="flex items-center justify-between mb-3">
              <span className="badge badge-mint">
                <CalendarDays size={14} />
                {strings.labels.calendar}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                  className="mini-nav"
                  aria-label={strings.actions.previousMonth}
                >
                  <ChevronLeft size={18} />
                </button>

                <h2 className="text-sm font-semibold">
                  {currentMonth.toLocaleString(locale, { month: "long", year: "numeric" })}
                </h2>

                <button
                  onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                  className="mini-nav"
                  aria-label={strings.actions.nextMonth}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {strings.daysShort.map((d, i) => (
                <div key={`${d}-${i}`} className="text-center text-xs text-cute-muted">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;

                const dateStr = formatDate(new Date(year, month, day));
                const isSelected = selectedDate === dateStr;
                const isPast = dateStr < todayStr;

                const hasEvent = events.some((e) => e.startDate === dateStr);
                const hasTrip = trips.some((t) => isDateInRange(dateStr, t.startDate, t.endDate));

                const tripTodosOnDay = trips.flatMap((t) => (t.todos || []).filter((todo: any) => todo.dueDate === dateStr));
                const globalTodosOnDay = globalTodos.filter((t) => t.dueDate === dateStr);
                const todosOnDay = [...globalTodosOnDay, ...tripTodosOnDay];
                const hasDeadline = todosOnDay.length > 0;

                const hasPendingTodo = todosOnDay.some((todo: any) => !todo.done);
                const hasCompletedTodo = todosOnDay.length > 0 && !hasPendingTodo;

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
                      isPast && !isSelected ? "opacity-70" : "",
                    ].join(" ")}
                  >
                    {day}

                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                      {hasEvent && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                      {hasTrip && <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                      {hasDeadline && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details */}
          <div className="card-cute">
            <div className="flex items-center justify-between mb-2">
              <span className="badge badge-sun">
                <List size={14} />
                {strings.labels.details}
              </span>
              <span className="pill">
                <span className="text-xs text-cute-muted">{strings.labels.selected}</span>
                <span className="text-sm font-semibold">{selectedDate}</span>
              </span>
            </div>

            <div className="mt-3">
              <p className="text-xs text-cute-muted mb-2">{strings.labels.eventsTrips}</p>

              {events.filter((e) => e.startDate === selectedDate).map((event) => (
                <div
                  key={event.id}
                  onMouseEnter={() => prefetchEvent(event.id)}
                  onTouchStart={() => prefetchEvent(event.id)}
                  onClick={() => goEvent(event.id)}
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

              {trips.filter((t) => isDateInRange(selectedDate, t.startDate, t.endDate)).map((trip) => (
                <div
                  key={trip.id}
                  onMouseEnter={() => prefetchTrip(trip.id)}
                  onTouchStart={() => prefetchTrip(trip.id)}
                  onClick={() => goTrip(trip.id)}
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
                trips.filter((t) => isDateInRange(selectedDate, t.startDate, t.endDate)).length === 0 && (
                  <p className="text-sm text-cute-muted mt-2">{strings.messages.noPlanned}</p>
                )}
            </div>

            <div className="mt-5">
              <p className="text-xs text-cute-muted mb-2">{strings.labels.todoDeadlines}</p>

              {todosForDateCombined.map((todo: any, i: number) => {
                const isGlobal = todo.source === "global";
                return (
                  <div
                    key={`${todo.source}-${todo.id || todo.tripId}-${todo.text}-${i}`}
                    onMouseEnter={() => (!isGlobal ? prefetchTrip(todo.tripId) : undefined)}
                    onTouchStart={() => (!isGlobal ? prefetchTrip(todo.tripId) : undefined)}
                    onClick={() => (isGlobal ? toggleGlobalTodo(todo) : goTrip(todo.tripId))}
                    className={`detail-pill ${todo.done ? "detail-green" : "detail-red"}`}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`font-semibold ${todo.done ? "line-through opacity-80" : ""}`}>{todo.text}</p>
                        <p className="text-xs opacity-80">
                          {isGlobal
                            ? `${strings.labels.global} • ${strings.labels.due}: ${todo.dueDate}`
                            : `${todo.tripName} • ${strings.labels.pic}: ${todo.pic}`}
                        </p>
                      </div>

                      {isGlobal ? (
                        <button
                          className="icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteGlobalTodo(todo);
                          }}
                          aria-label={strings.actions.deleteTodo}
                          title={strings.actions.deleteTodo}
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {todosForDateCombined.length === 0 && (
                <p className="text-sm text-cute-muted mt-2">{strings.messages.noDeadlines}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* LIST SECTIONS */}
      <section className="px-5 mt-5">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* EVENTS */}
          <div className="card-cute">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="badge badge-blue">
                  <Sparkles size={14} />
                  {strings.labels.events}
                </span>
                <span className="text-xs text-cute-muted">{countLabel(events.length, "total")}</span>
              </div>
            </div>

            <div className="space-y-2">
              {eventsSoon.map((event) => (
                <div
                  key={event.id}
                  className="row-cute"
                  onMouseEnter={() => prefetchEvent(event.id)}
                  onTouchStart={() => prefetchEvent(event.id)}
                  onClick={() => goEvent(event.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{event.name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-cute-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={13} />
                        {event.startDate} {event.startTime} → {event.endDate} {event.endTime}
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
                    aria-label={strings.actions.deleteEvent}
                    title={strings.actions.deleteEvent}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              {eventsSoon.length === 0 && (
                <p className="text-sm text-cute-muted mt-2">{strings.messages.noEvents}</p>
              )}
            </div>
          </div>

          {/* TRIPS */}
          <div className="card-cute">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="badge badge-purple">
                  <Plane size={14} />
                  {strings.labels.trips}
                </span>
                <span className="text-xs text-cute-muted">{countLabel(trips.length, "total")}</span>
              </div>
            </div>

            <div className="space-y-2">
              {tripsSoon.map((trip) => (
                <div
                  key={trip.id}
                  className="row-cute"
                  onMouseEnter={() => prefetchTrip(trip.id)}
                  onTouchStart={() => prefetchTrip(trip.id)}
                  onClick={() => goTrip(trip.id)}
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
                    aria-label={strings.actions.deleteTrip}
                    title={strings.actions.deleteTrip}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              {tripsSoon.length === 0 && (
                <p className="text-sm text-cute-muted mt-2">{strings.messages.noTrips}</p>
              )}
            </div>
          </div>

          {/* TODOs */}
          <div className="card-cute">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="badge badge-pink">
                  <CheckSquare size={14} />
                  {strings.labels.todos}
                </span>
                <span className="text-xs text-cute-muted">{strings.labels.globalTripDeadlines}</span>
              </div>
            </div>

            <div className="space-y-2">
              {todosSoon.map((todo: any, i: number) => {
                const isGlobal = todo.source === "global";
                return (
                  <div
                    key={`${todo.source}-${todo.id || todo.tripId}-${todo.text}-${todo.dueDate}-${i}`}
                    className={`row-cute ${todo.done ? "opacity-80" : ""}`}
                    onMouseEnter={() => (!isGlobal ? prefetchTrip(todo.tripId) : undefined)}
                    onTouchStart={() => (!isGlobal ? prefetchTrip(todo.tripId) : undefined)}
                    onClick={() => (isGlobal ? toggleGlobalTodo(todo) : goTrip(todo.tripId))}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="min-w-0">
                      <p className={`font-semibold truncate ${todo.done ? "line-through text-cute-muted" : ""}`}>{todo.text}</p>
                    <p className="text-xs text-cute-muted mt-1">
                        {isGlobal
                          ? `${strings.labels.global} • ${strings.labels.due}: ${todo.dueDate}`
                          : `${todo.tripName} • ${strings.labels.pic}: ${todo.pic} • ${strings.labels.due}: ${todo.dueDate}`}
                      </p>
                    </div>

                    {isGlobal ? (
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteGlobalTodo(todo);
                        }}
                        aria-label={strings.actions.deleteTodo}
                        title={strings.actions.deleteTodo}
                      >
                        <Trash2 size={18} />
                      </button>
                    ) : null}
                  </div>
                );
              })}

              {todosSoon.length === 0 && (
                <p className="text-sm text-cute-muted mt-2">{strings.messages.noTodos}</p>
              )}
            </div>
          </div>

          {/* Wishlist */}
          <div className="card-cute">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="badge" style={{ color: "#f9a8d4" }}>
                  <Heart size={14} />
                  {strings.labels.wishlist}
                </span>
                <span className="text-xs text-cute-muted">{countLabel(wishlist.length, "items")}</span>
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
                    <p className={`font-semibold truncate ${w.done ? "line-through text-cute-muted" : ""}`}>{w.text}</p>
                    <p className="text-xs text-cute-muted mt-1">{strings.messages.somedayTap}</p>
                  </div>

                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWishlistItem(w);
                    }}
                    aria-label={strings.actions.deleteWishlist}
                    title={strings.actions.deleteWishlist}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              {wishlistSoon.length === 0 && (
                <p className="text-sm text-cute-muted mt-2">{strings.messages.noWishlist}</p>
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
        aria-label={strings.actions.add}
        title={strings.actions.add}
      >
        <Plus size={28} />
      </button>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 py-4 flex justify-center nav-cute">
        <button
          onClick={async () => {
            localStorage.removeItem("demoUser");
            await signOut(auth);
            setUser(null);
          }}
          className="px-4 py-2 rounded-2xl shadow-cute hover:opacity-95 active:scale-[0.99] transition inline-flex items-center gap-2 nav-btn"
        >
          <LogOut size={18} />
          <span className="font-semibold text-sm">{strings.actions.seeYouLater}</span>
        </button>
      </nav>

      {/* Create Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/35 flex items-end"
          onClick={() => {
            setShowModal(false);
            resetModalInputs();
          }}
        >
          <div
            className="modal-sheet w-full rounded-t-[28px] p-6 shadow-[0_-20px_60px_rgba(0,0,0,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            {createMode === "pick" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-lg font-extrabold tracking-tight">{strings.labels.addSomething}</p>
                  <button className="mini-nav" onClick={() => { setShowModal(false); resetModalInputs(); }}>
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button className="pick-btn" onClick={() => setCreateMode("event")}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/30 shadow-cute flex items-center justify-center">
                        <Sparkles />
                      </div>
                      <div className="text-left">
                        <p className="font-extrabold leading-tight">{strings.labels.event}</p>
                        <p className="text-xs text-cute-muted">{strings.labels.meetups}</p>
                      </div>
                    </div>
                  </button>

                  <button className="pick-btn" onClick={() => setCreateMode("trip")}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/30 shadow-cute flex items-center justify-center">
                        <Plane />
                      </div>
                      <div className="text-left">
                        <p className="font-extrabold leading-tight">{strings.labels.trip}</p>
                        <p className="text-xs text-cute-muted">{strings.labels.travel}</p>
                      </div>
                    </div>
                  </button>

                  <button className="pick-btn" onClick={() => setCreateMode("todo")}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/30 shadow-cute flex items-center justify-center">
                        <CheckSquare />
                      </div>
                      <div className="text-left">
                        <p className="font-extrabold leading-tight">{strings.labels.todo}</p>
                        <p className="text-xs text-cute-muted">{strings.labels.deadline}</p>
                      </div>
                    </div>
                  </button>

                  <button className="pick-btn" onClick={() => setCreateMode("wishlist")}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/30 shadow-cute flex items-center justify-center">
                        <Heart />
                      </div>
                      <div className="text-left">
                        <p className="font-extrabold leading-tight">{strings.labels.wishlistItem}</p>
                        <p className="text-xs text-cute-muted">{strings.labels.someday}</p>
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}

            {createMode !== "pick" && (
              <div className="mt-2">
                <button className="mini-nav mb-3" onClick={() => setCreateMode("pick")}>
                  ←
                </button>

                {createMode === "event" && (
                  <div className="space-y-3">
                    <p className="text-lg font-extrabold">{strings.labels.planEvent}</p>
                    <input placeholder={strings.labels.eventName} value={name} onChange={(e) => setName(e.target.value)} className="cute-input" />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="cute-label">{strings.labels.startDate}</p>
                        <input type="date" value={eventStartDate} onChange={(e) => { setEventStartDate(e.target.value); if (!eventEndDate) setEventEndDate(e.target.value); }} className="cute-input" />
                      </div>
                      <div>
                        <p className="cute-label">{strings.labels.endDate}</p>
                        <input type="date" value={eventEndDate} onChange={(e) => setEventEndDate(e.target.value)} className="cute-input" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="cute-label">{strings.labels.startTime}</p>
                        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="cute-input" />
                      </div>
                      <div>
                        <p className="cute-label">{strings.labels.endTime}</p>
                        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="cute-input" />
                      </div>
                    </div>
                    <input placeholder={strings.labels.locationOptional} value={location} onChange={(e) => setLocation(e.target.value)} className="cute-input" />
                    <div className="cute-radio-group">
                      <p className="cute-label">{strings.labels.recurring}</p>
                      <label className="cute-radio">
                        <input
                          type="radio"
                          name="recurring"
                          value="no"
                          checked={eventRecurring === "no"}
                          onChange={() => setEventRecurring("no")}
                        />
                        <span>{strings.labels.no}</span>
                      </label>
                      <label className="cute-radio">
                        <input
                          type="radio"
                          name="recurring"
                          value="yes"
                          checked={eventRecurring === "yes"}
                          onChange={() => setEventRecurring("yes")}
                        />
                        <span>{strings.labels.yes}</span>
                      </label>
                    </div>
                    <button
                      onClick={createEvent}
                      className="w-full py-4 rounded-2xl bg-cute-accent text-white font-extrabold shadow-cute active:scale-[0.99] transition disabled:opacity-50"
                      disabled={!name || !eventStartDate || !eventEndDate || !startTime || !endTime}
                    >
                      {strings.labels.createEvent}
                    </button>
                  </div>
                )}

                {createMode === "trip" && (
                  <div className="space-y-3">
                    <p className="text-lg font-extrabold">{strings.labels.planTrip}</p>
                    <input placeholder={strings.labels.tripName} value={name} onChange={(e) => setName(e.target.value)} className="cute-input" />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="cute-label">{strings.labels.startDate}</p>
                        <input type="date" value={tripStartDate} onChange={(e) => setTripStartDate(e.target.value)} className="cute-input" />
                      </div>
                      <div>
                        <p className="cute-label">{strings.labels.endDate}</p>
                        <input type="date" value={tripEndDate} onChange={(e) => setTripEndDate(e.target.value)} className="cute-input" />
                      </div>
                    </div>
                    <button
                      onClick={createTrip}
                      className="w-full py-4 rounded-2xl bg-cute-accent text-white font-extrabold shadow-cute active:scale-[0.99] transition disabled:opacity-50"
                      disabled={!name || !tripStartDate || !tripEndDate}
                    >
                      {strings.labels.createTrip}
                    </button>
                  </div>
                )}

                {createMode === "todo" && (
                  <div className="space-y-3">
                    <p className="text-lg font-extrabold">{strings.labels.addTask}</p>
                    <input placeholder={strings.labels.taskPlaceholder} value={todoText} onChange={(e) => setTodoText(e.target.value)} className="cute-input" />
                    <div>
                      <p className="cute-label">{strings.labels.dueDate}</p>
                      <input type="date" value={todoDue} onChange={(e) => setTodoDue(e.target.value)} className="cute-input" />
                    </div>
                    <button
                      onClick={createGlobalTodo}
                      className="w-full py-4 rounded-2xl bg-cute-accent text-white font-extrabold shadow-cute active:scale-[0.99] transition disabled:opacity-50"
                      disabled={!todoText || !todoDue}
                    >
                      {strings.labels.addTodo}
                    </button>
                  </div>
                )}

                {createMode === "wishlist" && (
                  <div className="space-y-3">
                    <p className="text-lg font-extrabold">{strings.labels.addSomedayIdea}</p>
                    <input placeholder={strings.labels.wishPlaceholder} value={wishText} onChange={(e) => setWishText(e.target.value)} className="cute-input" />
                    <button
                      onClick={createWishlistItem}
                      className="w-full py-4 rounded-2xl bg-cute-accent text-white font-extrabold shadow-cute active:scale-[0.99] transition disabled:opacity-50"
                      disabled={!wishText}
                    >
                      {strings.labels.addToWishlist}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
