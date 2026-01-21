"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
type ThemeMode = "day" | "night";

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

/* ---------------- DELIGHT HELPERS ---------------- */
function seasonEmoji(monthIndex0: number) {
  if (monthIndex0 === 2 || monthIndex0 === 3 || monthIndex0 === 4) return "🌸";
  if (monthIndex0 === 5 || monthIndex0 === 6 || monthIndex0 === 7) return "☀️";
  if (monthIndex0 === 8 || monthIndex0 === 9 || monthIndex0 === 10) return "🍁";
  return "❄️";
}

function dailyMood(todayStr: string) {
  const moods = [
    "Small steps are enough 🌿",
    "Plan something gentle today ☁️",
    "A little progress is still progress ✨",
    "Treat yourself kindly today ☕",
    "One cute plan at a time 🫶",
    "Make space for fun too 🌈",
    "You’re doing great — quietly 🌙",
    "Today feels like a good day to plan 🌤️",
  ];
  let hash = 0;
  for (let i = 0; i < todayStr.length; i++) {
    hash = (hash * 31 + todayStr.charCodeAt(i)) >>> 0;
  }
  return moods[hash % moods.length];
}

function SunshineBuddy({
  size = 120,
  label = "Asuka buddy",
}: {
  size?: number;
  label?: string;
}) {
  return (
    <div className="cute-float" aria-label={label} title={label}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        <path
          d="M26 66c0-28 18-46 44-46s44 18 44 46-18 54-44 54-44-26-44-54Z"
          fill="rgba(255,255,255,0.55)"
        />
        <circle cx="92" cy="44" r="18" fill="rgba(250,204,21,0.95)" />
        <circle cx="92" cy="44" r="18" fill="url(#g1)" opacity="0.35" />
        <g
          opacity="0.75"
          stroke="rgba(250,204,21,0.9)"
          strokeWidth="4"
          strokeLinecap="round"
        >
          <path d="M92 16v6" />
          <path d="M92 66v6" />
          <path d="M64 44h6" />
          <path d="M114 44h6" />
          <path d="M73 25l4 4" />
          <path d="M107 59l4 4" />
          <path d="M73 63l4-4" />
          <path d="M107 29l4-4" />
        </g>

        <path
          d="M44 78c0-18 12-30 26-30s26 12 26 30-12 34-26 34-26-16-26-34Z"
          fill="rgba(255,255,255,0.92)"
          stroke="rgba(17,24,39,0.10)"
        />
        <path
          d="M52 54l-8 10c-2 2-1 6 2 6h10"
          fill="rgba(255,255,255,0.92)"
          stroke="rgba(17,24,39,0.10)"
        />
        <path
          d="M88 54l8 10c2 2 1 6-2 6H84"
          fill="rgba(255,255,255,0.92)"
          stroke="rgba(17,24,39,0.10)"
        />

        <g
          className="buddy-blink"
          opacity="0.9"
          stroke="rgba(31,41,55,0.75)"
          strokeWidth="4"
          strokeLinecap="round"
        >
          <path d="M58 78c4 3 8 3 12 0" />
          <path d="M70 78c4 3 8 3 12 0" />
        </g>

        <path
          d="M70 86l-2 2 2 2 2-2-2-2Z"
          fill="rgba(244,114,182,0.9)"
        />
        <path
          d="M70 90c-6 6-12 6-18 0"
          stroke="rgba(31,41,55,0.55)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <path
          d="M44 40l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"
          fill="rgba(244,114,182,0.85)"
          opacity="0.9"
        />

        <defs>
          <radialGradient
            id="g1"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(90 38) rotate(90) scale(26)"
          >
            <stop stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

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
  const [user, setUser] = useState<any>(null);

  const [events, setEvents] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [globalTodos, setGlobalTodos] = useState<GlobalTodo[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  const today = new Date();
  const todayStr = formatDate(today);

  const [theme, setTheme] = useState<ThemeMode>("day");

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
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

  const [todoText, setTodoText] = useState("");
  const [todoDue, setTodoDue] = useState("");

  const [wishText, setWishText] = useState("");

  const router = useRouter();

  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimer = useRef<number | null>(null);

  /* Theme: read & store in localStorage; CSS driven by data-theme on wrapper */
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("asukaTheme") : null;
    setTheme(saved === "night" ? "night" : "day");
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("asukaTheme", theme);
  }, [theme]);

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
        typeof window !== "undefined" && localStorage.getItem("demoUser") === "1";
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
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );
    return sorted.slice(0, 10);
  }, [wishlist]);

  /* Progress feel (today only) */
  const todaysTodos = useMemo(() => {
    const forToday = (globalTodos || []).filter((t) => t.dueDate === todayStr);
    const tripForToday = (trips || []).flatMap((trip) =>
      (trip.todos || []).filter((todo: any) => todo.dueDate === todayStr)
    );
    return [...forToday, ...tripForToday];
  }, [globalTodos, trips, todayStr]);

  const todayAllDone = useMemo(() => {
    if (todaysTodos.length === 0) return false;
    return todaysTodos.every((t: any) => !!t.done);
  }, [todaysTodos]);

  useEffect(() => {
    if (!todayAllDone) return;
    const key = `asuka_confetti_done_${todayStr}`;
    const already =
      typeof window !== "undefined" ? sessionStorage.getItem(key) : "1";
    if (already) return;

    sessionStorage.setItem(key, "1");
    setShowConfetti(true);

    if (confettiTimer.current) window.clearTimeout(confettiTimer.current);
    confettiTimer.current = window.setTimeout(() => setShowConfetti(false), 1200);
  }, [todayAllDone, todayStr]);

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
    const nextDone = !item.done;
    await updateDoc(doc(db, "wishlist", item.id), { done: nextDone });

    if (nextDone) {
      const key = `asuka_confetti_wish_${item.id}`;
      const already =
        typeof window !== "undefined" ? sessionStorage.getItem(key) : "1";
      if (!already) {
        sessionStorage.setItem(key, "1");
        setShowConfetti(true);
        if (confettiTimer.current) window.clearTimeout(confettiTimer.current);
        confettiTimer.current = window.setTimeout(
          () => setShowConfetti(false),
          1100
        );
      }
    }
  }

  async function deleteWishlistItem(item: WishlistItem) {
    await deleteDoc(doc(db, "wishlist", item.id));
  }

  const headerMood = dailyMood(todayStr);
  const season = seasonEmoji(today.getMonth());

  /* ---------------- LOGIN SCREEN ---------------- */
  if (!user) {
    return (
      <main
        data-theme={theme}
        className="min-h-screen bg-cute text-cute-ink relative overflow-hidden flex items-center justify-center px-5"
      >
        <ConfettiBurst show={showConfetti} />

        <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/40 blur-2xl" />
        <div className="pointer-events-none absolute top-24 -right-24 w-80 h-80 rounded-full bg-white/35 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 w-96 h-96 rounded-full bg-white/30 blur-3xl" />

        <div className="max-w-md w-full">
          <div className="card-cute text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-cute-muted">Welcome back</p>
                <h1 className="text-4xl font-extrabold tracking-tight">
                  Asuka ✨
                </h1>
                <p className="text-sm text-cute-muted mt-1">
                  Events • Trips • TODOs • Wishlist
                </p>
              </div>

              <button
                className="mini-nav"
                onClick={() => setTheme((t) => (t === "day" ? "night" : "day"))}
                aria-label="Toggle theme"
                title="Toggle theme"
              >
                {theme === "day" ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center">
              <SunshineBuddy size={150} label="Asuka sunshine buddy" />
            </div>

            <p className="text-sm text-cute-muted mt-2 text-center">
              “Tomorrow’s sunshine” vibes 🌤️
            </p>

            <button
              className="mt-5 w-full px-8 py-4 rounded-2xl bg-cute-accent text-white font-extrabold shadow-cute hover:opacity-95 active:scale-[0.99] transition"
              onClick={() => {
                localStorage.setItem("demoUser", "1");
                setUser({ name: "Demo User", demo: true });
              }}
            >
              Let’s go!
            </button>

            <p className="text-xs text-cute-muted mt-3">
              Demo login (local only).
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------- MAIN UI ---------------- */
  return (
    <div
      data-theme={theme}
      className="min-h-screen bg-cute text-cute-ink pb-28"
    >
      <ConfettiBurst show={showConfetti} />

      {/* HEADER */}
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-cute-muted">Your little planner {season}</p>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              Planner <PartyPopper className="opacity-80" size={22} />
            </h1>

            <p className="text-sm text-cute-muted mt-1">
              {todayAllDone ? "Nothing urgent — enjoy! 💤" : headerMood}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="pill">
              <span className="text-xs text-cute-muted">Today</span>
              <span className="text-sm font-semibold">{todayStr}</span>
            </div>

            <button
              className="mini-nav"
              onClick={() => setTheme((t) => (t === "day" ? "night" : "day"))}
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === "day" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* CALENDAR FIRST */}
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
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() - 1,
                        1
                      )
                    )
                  }
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
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1,
                        1
                      )
                    )
                  }
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
                      isSelected
                        ? ""
                        : isPast
                        ? "text-gray-400"
                        : "text-cute-ink",
                      isPast && !isSelected ? "opacity-70" : "",
                    ].join(" ")}
                  >
                    {day}

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
                .filter((t) => isDateInRange(selectedDate, t.startDate, t.endDate))
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
                  <div className="mt-3 text-center">
                    <div className="flex justify-center">
                      <SunshineBuddy size={90} label="Empty state buddy" />
                    </div>
                    <p className="text-sm text-cute-muted mt-2">
                      Nothing planned here yet ✨
                    </p>
                  </div>
                )}
            </div>

            {/* TODO DEADLINES */}
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
                    className={`detail-pill ${todo.done ? "detail-green" : "detail-red"}`}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`font-semibold ${todo.done ? "line-through opacity-80" : ""}`}>
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
                <p className="text-sm text-cute-muted">No deadlines — breathe 🌿</p>
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
                  Events
                </span>
                <span className="text-xs text-cute-muted">{events.length} total</span>
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
                <p className="text-sm text-cute-muted">
                  No events yet — add a little joy ✨
                </p>
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
                <span className="text-xs text-cute-muted">{trips.length} total</span>
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
                <p className="text-sm text-cute-muted">
                  No trips yet — someday? 🧳
                </p>
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
                <div className="mt-3 text-center">
                  <div className="flex justify-center">
                    <SunshineBuddy size={88} label="No todos buddy" />
                  </div>
                  <p className="text-sm text-cute-muted mt-2">
                    No deadlines — cozy day ☕
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Wishlist */}
          <div className="card-cute">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="badge" style={{ color: "#db2777" }}>
                  <Heart size={14} />
                  Wishlist
                </span>
                <span className="text-xs text-cute-muted">{wishlist.length} items</span>
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
                  Nothing here yet — add a little dream 💭
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
          <span className="font-semibold text-sm">See you later</span>
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
            {/* Picker (2x2) */}
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

                <div className="grid grid-cols-2 gap-3">
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
                        <p className="text-xs opacity-80">meetups</p>
                      </div>
                    </div>
                  </button>

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
                        <p className="text-xs opacity-80">travel</p>
                      </div>
                    </div>
                  </button>

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
                        <p className="text-xs opacity-80">deadline</p>
                      </div>
                    </div>
                  </button>

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
                        <p className="text-xs opacity-80">someday</p>
                      </div>
                    </div>
                  </button>
                </div>

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
                    Plan an Event ✨
                  </p>
                  <button className="mini-nav" onClick={() => setCreateMode("pick")}>
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
                    Plan a Trip ✨
                  </p>
                  <button className="mini-nav" onClick={() => setCreateMode("pick")}>
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
                    Add a Task ✨
                  </p>
                  <button className="mini-nav" onClick={() => setCreateMode("pick")}>
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
                    Add a Someday Idea 💭
                  </p>
                  <button className="mini-nav" onClick={() => setCreateMode("pick")}>
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
