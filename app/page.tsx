"use client";

import { startTransition, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  arrayRemove,
  arrayUnion,
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
  Palette,
  ArrowUp,
  ArrowDown,
  Languages,
  Pencil,
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
  pic?: string;
  done: boolean;
  order?: number;
  recurrence?: RecurrenceType;
  createdAt?: string;
};
type WishlistItem = {
  id: string;
  text: string;
  done: boolean;
  createdAt?: string;
  order?: number;
};
type TripTodo = {
  text: string;
  pic: string;
  done: boolean;
  dueDate: string;
  order?: number;
};
type TripItem = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  recurrence?: RecurrenceType;
  todos?: TripTodo[];
};
type EventItem = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime?: string;
  location?: string;
  recurring?: boolean;
};
type TripTodoWithSource = TripTodo & {
  source: "trip";
  tripName: string;
  tripId: string;
};
type GlobalTodoWithSource = GlobalTodo & {
  source: "global";
};
type CombinedTodo = TripTodoWithSource | GlobalTodoWithSource;
type CountType = "total" | "items" | "tasks" | "people";
type WeatherState = {
  currentTemp: number;
  minTemp: number;
  maxTemp: number;
  weatherCode: number;
  updatedAt: string;
};
type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

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
function stringSeed(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return hash;
}
function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 2 ** 32;
  };
}

/* ---------------- CONFETTI ---------------- */
function ConfettiBurst({ show, seed }: { show: boolean; seed: number }) {
  const pieces = useMemo(() => {
    const rand = seededRandom(seed);
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: Math.round(rand() * 92) + 4,
      delay: rand() * 180,
      bg: `hsl(${Math.floor(rand() * 360)} 85% 70%)`,
    }));
  }, [seed]);
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
  const { theme, preset, setPreset, toggleTheme } = useTheme();
  const { language, strings, toggleLanguage } = useLanguage();
  const router = useRouter();

  const [user, setUser] = useState<User | { name: string; demo: boolean } | null>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [globalTodos, setGlobalTodos] = useState<GlobalTodo[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  const today = new Date();
  const todayStr = formatDate(today);

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showEventDots, setShowEventDots] = useState(true);
  const [showTripDots, setShowTripDots] = useState(true);
  const [showTodoDots, setShowTodoDots] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>("pick");

  const [name, setName] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");
  const [tripRecurrence, setTripRecurrence] = useState<RecurrenceType>("none");

  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [eventRecurring, setEventRecurring] = useState<"no" | "yes">("no");

  const [todoText, setTodoText] = useState("");
  const [todoDue, setTodoDue] = useState("");
  const [todoPic, setTodoPic] = useState("");
  const [todoRecurrence, setTodoRecurrence] = useState<RecurrenceType>("none");

  const [wishText, setWishText] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editType, setEditType] = useState<"todo" | "tripTodo" | "wishlist" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editPic, setEditPic] = useState("");
  const [editRecurrence, setEditRecurrence] = useState<RecurrenceType>("none");
  const [editTripId, setEditTripId] = useState<string | null>(null);
  const [editTripTodoOriginal, setEditTripTodoOriginal] = useState<TripTodoWithSource | null>(null);

  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimer = useRef<number | null>(null);
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [weatherError, setWeatherError] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);

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
      setTrips(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TripItem, "id">) })));
    });

    const unsubEvents = onSnapshot(collection(db, "events"), (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EventItem, "id">) })));
    });

    const unsubTodos = onSnapshot(collection(db, "todos"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GlobalTodo, "id">) }));
      setGlobalTodos(list);
    });

    const unsubWishlist = onSnapshot(collection(db, "wishlist"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WishlistItem, "id">) }));
      setWishlist(list);
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

  const todoOrderValue = (todo: { order?: number; dueDate: string }) => {
    if (typeof todo.order === "number") return todo.order;
    return Number.isNaN(Date.parse(todo.dueDate)) ? 0 : Date.parse(todo.dueDate);
  };
  const compareTodos = (a: { done: boolean; order?: number; dueDate: string }, b: { done: boolean; order?: number; dueDate: string }) => {
    const status = Number(a.done) - Number(b.done);
    if (status !== 0) return status;
    return todoOrderValue(a) - todoOrderValue(b);
  };

  const tripTodosForDate = useMemo<TripTodoWithSource[]>(() => {
    return (trips || []).flatMap((trip) =>
      (trip.todos || [])
        .filter((todo) => todo.dueDate === selectedDate)
        .sort(compareTodos)
        .map((todo) => ({
          ...todo,
          source: "trip" as const,
          tripName: trip.name,
          tripId: trip.id,
        }))
    );
  }, [trips, selectedDate]);

  const globalTodosForDate = useMemo<GlobalTodoWithSource[]>(() => {
    return (globalTodos || [])
      .filter((t) => t.dueDate === selectedDate)
      .sort(compareTodos)
      .map((t) => ({ ...t, source: "global" as const }));
  }, [globalTodos, selectedDate]);

  const todosForDateCombined = useMemo<CombinedTodo[]>(() => {
    return [...globalTodosForDate, ...tripTodosForDate].sort(compareTodos);
  }, [globalTodosForDate, tripTodosForDate]);

  const todosSoon = useMemo<CombinedTodo[]>(() => {
    const fromTrips = (trips || []).flatMap((trip) =>
      (trip.todos || [])
        .sort(compareTodos)
        .map((todo) => ({
          ...todo,
          source: "trip" as const,
          tripName: trip.name,
          tripId: trip.id,
        }))
    );
    const fromGlobal = (globalTodos || []).map((t) => ({ ...t, source: "global" as const }));
    const all: CombinedTodo[] = [...fromGlobal, ...fromTrips];
    all.sort(compareTodos);
    return all.slice(0, 10);
  }, [globalTodos]);

  const eventsSoon = useMemo(() => {
    const sorted = [...(events || [])].sort((a, b) => String(a.startDate || "").localeCompare(String(b.startDate || "")));
    return sorted.slice(0, 6);
  }, [events]);

  const tripsSoon = useMemo(() => {
    const sorted = [...(trips || [])].sort((a, b) => String(a.startDate || "").localeCompare(String(b.startDate || "")));
    return sorted.slice(0, 6);
  }, [trips]);

  const wishlistOrderValue = (item: WishlistItem) => {
    if (typeof item.order === "number") return item.order;
    if (item.createdAt && !Number.isNaN(Date.parse(item.createdAt))) {
      return Date.parse(item.createdAt);
    }
    return 0;
  };
  const wishlistOrdered = useMemo(() => {
    return [...(wishlist || [])].sort((a, b) => wishlistOrderValue(a) - wishlistOrderValue(b));
  }, [wishlist]);
  const wishlistSoon = useMemo(() => {
    return wishlistOrdered.slice(0, 10);
  }, [wishlistOrdered]);

  const todaysTodos = (() => {
    const forToday = (globalTodos || []).filter((t) => t.dueDate === todayStr);
    const tripForToday = (trips || []).flatMap((trip) => (trip.todos || []).filter((todo) => todo.dueDate === todayStr));
    return [...forToday, ...tripForToday];
  })();

  const todayAllDone = todaysTodos.length > 0 && todaysTodos.every((t) => !!t.done);
  const filteredTodosForDate = showTodoDots ? todosForDateCombined : [];
  const eventsForDate = showEventDots ? events.filter((e) => e.startDate === selectedDate) : [];
  const tripsForDate = showTripDots
    ? trips.filter((t) => isDateInRange(selectedDate, t.startDate, t.endDate))
    : [];

  useEffect(() => {
    if (!todayAllDone) return;
    const key = `asuka_confetti_done_${todayStr}`;
    let already = "1";
    if (typeof window !== "undefined") {
      try {
        already = sessionStorage.getItem(key) ?? "";
      } catch {
        already = "1";
      }
    }
    if (already) return;

    try {
      sessionStorage.setItem(key, "1");
    } catch {
      return;
    }
    const showTimer = window.setTimeout(() => setShowConfetti(true), 0);
    if (confettiTimer.current) window.clearTimeout(confettiTimer.current);
    confettiTimer.current = window.setTimeout(() => setShowConfetti(false), 1200);
    return () => window.clearTimeout(showTimer);
  }, [todayAllDone, todayStr]);

  useEffect(() => {
    let isMounted = true;
    const fetchWeather = async () => {
      setWeatherLoading(true);
      setWeatherError(false);
      try {
        const response = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=35.7068&longitude=139.6967&current=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Asia%2FTokyo&forecast_days=1"
        );
        if (!response.ok) throw new Error("weather failed");
        const data = await response.json();
        if (!isMounted) return;
        const currentTemp = data?.current?.temperature_2m;
        const weatherCode = data?.current?.weathercode;
        const minTemp = data?.daily?.temperature_2m_min?.[0];
        const maxTemp = data?.daily?.temperature_2m_max?.[0];
        const updatedAt = data?.current?.time;
        if ([currentTemp, weatherCode, minTemp, maxTemp, updatedAt].some((v) => v === undefined)) {
          throw new Error("weather missing");
        }
        setWeather({
          currentTemp,
          minTemp,
          maxTemp,
          weatherCode,
          updatedAt,
        });
      } catch {
        if (isMounted) {
          setWeatherError(true);
        }
      } finally {
        if (isMounted) {
          setWeatherLoading(false);
        }
      }
    };
    fetchWeather();
    return () => {
      isMounted = false;
    };
  }, []);

  const weatherEmoji = (code: number, temp: number) => {
    if (code === 0) return "☀️";
    if (code === 1 || code === 2) return "🌤️";
    if (code === 3) return "☁️";
    if (code >= 45 && code <= 48) return "🌫️";
    if (code >= 51 && code <= 67) return "🌧️";
    if (code >= 71 && code <= 77) return "☃️";
    if (code >= 80 && code <= 82) return "🌦️";
    if (code >= 85 && code <= 86) return "⛄";
    if (code >= 95) return "⛈️";
    if (temp <= 5) return "⛄";
    return "🌈";
  };

  const weatherRunnerVariant = (code: number, temp: number) => {
    if (temp <= 5 || (code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
    if (code >= 51 && code <= 67) return "rain";
    if (code >= 80 && code <= 82) return "rain";
    return "sun";
  };

  function resetModalInputs() {
    setName("");
    setTripStartDate("");
    setTripEndDate("");
    setTripRecurrence("none");
    setEventStartDate("");
    setEventEndDate("");
    setStartTime("");
    setEndTime("");
    setLocation("");
    setEventRecurring("no");
    setTodoText("");
    setTodoDue("");
    setTodoPic("");
    setTodoRecurrence("none");
    setWishText("");
    setCreateMode("pick");
    setShowEditModal(false);
    setEditType(null);
    setEditId(null);
    setEditText("");
    setEditDue("");
    setEditPic("");
    setEditRecurrence("none");
    setEditTripId(null);
    setEditTripTodoOriginal(null);
  }

  async function createTrip() {
    if (!name || !tripStartDate || !tripEndDate) return;
    await addDoc(collection(db, "trips"), {
      name,
      startDate: tripStartDate,
      endDate: tripEndDate,
      recurrence: tripRecurrence,
    });
    setShowModal(false);
    resetModalInputs();
  }

  async function createEvent() {
    if (!name || !eventStartDate || !eventEndDate || !startTime) return;
    await addDoc(collection(db, "events"), {
      name,
      startDate: eventStartDate,
      endDate: eventEndDate,
      startTime,
      endTime: endTime || "",
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
      pic: todoPic,
      done: false,
      order: Date.now(),
      recurrence: todoRecurrence,
      createdAt: new Date().toISOString(),
    });
    setShowModal(false);
    resetModalInputs();
  }

  async function toggleGlobalTodo(todo: GlobalTodo) {
    const nextDone = !todo.done;
    await updateDoc(doc(db, "todos", todo.id), { done: nextDone });
    if (nextDone && todo.recurrence && todo.recurrence !== "none") {
      const dueDate = new Date(`${todo.dueDate}T00:00:00`);
      const nextDue = addRecurrence(dueDate, todo.recurrence);
      await addDoc(collection(db, "todos"), {
        text: todo.text,
        dueDate: toDateInput(nextDue),
        pic: todo.pic,
        done: false,
        order: Date.now(),
        recurrence: todo.recurrence,
        createdAt: new Date().toISOString(),
      });
    }
  }
  async function deleteGlobalTodo(todo: GlobalTodo) {
    await deleteDoc(doc(db, "todos", todo.id));
  }

  async function updateGlobalTodo(todo: GlobalTodo) {
    await updateDoc(doc(db, "todos", todo.id), {
      text: editText.trim(),
      dueDate: editDue,
      pic: editPic.trim(),
      recurrence: editRecurrence,
    });
  }

  function baseTripTodo(todo: TripTodoWithSource) {
    return {
      text: todo.text,
      pic: todo.pic,
      done: todo.done,
      dueDate: todo.dueDate,
      order: todo.order,
    };
  }

  async function toggleTripTodo(todo: TripTodoWithSource) {
    const baseTodo = baseTripTodo(todo);
    await updateDoc(doc(db, "trips", todo.tripId), {
      todos: arrayRemove(baseTodo),
    });
    await updateDoc(doc(db, "trips", todo.tripId), {
      todos: arrayUnion({ ...baseTodo, done: !baseTodo.done }),
    });
  }

  function toggleCombinedTodo(todo: CombinedTodo) {
    if (todo.source === "global") {
      toggleGlobalTodo(todo);
    } else {
      toggleTripTodo(todo);
    }
  }

  async function updateTripTodo() {
    if (!editTripId || !editTripTodoOriginal) return;
    const updatedTodo = {
      text: editText.trim(),
      pic: editPic.trim(),
      done: editTripTodoOriginal.done,
      dueDate: editDue,
      order: editTripTodoOriginal.order ?? Date.now(),
    };
    await updateDoc(doc(db, "trips", editTripId), {
      todos: arrayRemove(baseTripTodo(editTripTodoOriginal)),
    });
    await updateDoc(doc(db, "trips", editTripId), {
      todos: arrayUnion(updatedTodo),
    });
  }

  async function moveWishlistItem(itemId: string, direction: -1 | 1) {
    const ordered = wishlistOrdered;
    const index = ordered.findIndex((item) => item.id === itemId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return;
    const current = ordered[index];
    const target = ordered[targetIndex];
    const base = Date.now();
    const currentOrder = typeof current.order === "number" ? current.order : base + index;
    const targetOrder = typeof target.order === "number" ? target.order : base + targetIndex;
    await Promise.all([
      updateDoc(doc(db, "wishlist", current.id), { order: targetOrder }),
      updateDoc(doc(db, "wishlist", target.id), { order: currentOrder }),
    ]);
  }

  async function createWishlistItem() {
    if (!wishText) return;
    await addDoc(collection(db, "wishlist"), {
      text: wishText,
      done: false,
      createdAt: new Date().toISOString(),
      order: Date.now(),
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

  async function updateWishlistItem(item: WishlistItem) {
    await updateDoc(doc(db, "wishlist", item.id), { text: editText.trim() });
  }

  function openEditTodo(todo: GlobalTodo) {
    setEditType("todo");
    setEditId(todo.id);
    setEditText(todo.text);
    setEditDue(todo.dueDate);
    setEditPic(todo.pic ?? "");
    setEditRecurrence(todo.recurrence ?? "none");
    setShowEditModal(true);
  }

  function openEditTripTodo(todo: TripTodoWithSource) {
    setEditType("tripTodo");
    setEditTripId(todo.tripId);
    setEditTripTodoOriginal(todo);
    setEditId(null);
    setEditText(todo.text);
    setEditDue(todo.dueDate);
    setEditPic(todo.pic);
    setEditRecurrence("none");
    setShowEditModal(true);
  }

  function openEditWishlist(item: WishlistItem) {
    setEditType("wishlist");
    setEditId(item.id);
    setEditText(item.text);
    setEditDue("");
    setEditPic("");
    setEditRecurrence("none");
    setShowEditModal(true);
  }

  // Delay fix helpers: prefetch + transition
  const goEvent = (id: string) => startTransition(() => router.push(`/event/${id}`));
  const goTrip = (id: string) => startTransition(() => router.push(`/trip/${id}`));
  const prefetchEvent = (id: string) => router.prefetch(`/event/${id}`);
  const prefetchTrip = (id: string) => router.prefetch(`/trip/${id}`);

  const headerMood = dailyMood(todayStr, strings.moods);
  const season = seasonEmoji(today.getMonth());
  const locale = strings.locale;
  const confettiSeed = stringSeed(todayStr);
  const countLabel = (count: number, type: CountType) =>
    language === "ja" ? `${count}${strings.labels[type]}` : `${count} ${strings.labels[type]}`;
  const handleKeyActivate =
    (action: () => void) =>
    (event: KeyboardEvent<HTMLDivElement | HTMLButtonElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        action();
      }
    };
  const addRecurrence = (date: Date, recurrence: RecurrenceType) => {
    const next = new Date(date);
    if (recurrence === "daily") next.setDate(next.getDate() + 1);
    if (recurrence === "weekly") next.setDate(next.getDate() + 7);
    if (recurrence === "monthly") next.setMonth(next.getMonth() + 1);
    if (recurrence === "yearly") next.setFullYear(next.getFullYear() + 1);
    return next;
  };
  const toDateInput = (date: Date) => date.toISOString().slice(0, 10);
  const toDateTimeInput = (date: Date) => date.toISOString().slice(0, 16);
  const presetOptions = [
    { id: "lilac", label: "Lilac", color: "#7c3aed" },
    { id: "mint", label: "Mint", color: "#10b981" },
    { id: "ocean", label: "Ocean", color: "#0ea5e9" },
    { id: "sunset", label: "Sunset", color: "#f97316" },
    { id: "aurora", label: "Aurora", color: "#22d3ee" },
    { id: "berry", label: "Berry", color: "#fb7185" },
    { id: "citrus", label: "Citrus", color: "#facc15" },
  ] as const;
  const activePreset = presetOptions.find((option) => option.id === preset);
  const cyclePreset = () => {
    const ids = presetOptions.map((option) => option.id);
    const index = ids.indexOf(preset);
    const nextPreset = ids[(index + 1) % ids.length];
    setPreset(nextPreset);
  };
  const recurrenceSummary = (recurrence?: RecurrenceType) => {
    if (!recurrence || recurrence === "none") return strings.labels.repeatNone;
    if (recurrence === "daily") return strings.labels.repeatDaily;
    if (recurrence === "weekly") return strings.labels.repeatWeekly;
    if (recurrence === "monthly") return strings.labels.repeatMonthly;
    return strings.labels.repeatYearly;
  };

  function resetEditInputs() {
    setShowEditModal(false);
    setEditType(null);
    setEditId(null);
    setEditText("");
    setEditDue("");
    setEditPic("");
    setEditRecurrence("none");
  }

  const activeTodo = editType === "todo" ? globalTodos.find((todo) => todo.id === editId) : null;
  const activeWishlist = editType === "wishlist" ? wishlist.find((item) => item.id === editId) : null;

  /* ---------------- LOGIN ---------------- */
  if (!user) {
    const monaSrc =
      theme === "night"
        ? "https://github.githubassets.com/images/mona-loading-dark.gif"
        : "https://github.githubassets.com/images/mona-loading-default.gif";

    return (
      <main className="min-h-screen bg-cute text-cute-ink relative overflow-hidden flex items-center justify-center px-5">
        <ConfettiBurst show={showConfetti} seed={confettiSeed} />

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
                  {theme === "day" ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <button
                  className="mini-nav"
                  onClick={cyclePreset}
                  aria-label={`${strings.labels.themePresets}: ${activePreset?.label ?? preset}`}
                  title={`${strings.labels.themePresets}: ${activePreset?.label ?? preset}`}
                >
                  <Palette size={18} />
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
      <ConfettiBurst show={showConfetti} seed={confettiSeed} />

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
              {theme === "day" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              className="mini-nav"
              onClick={cyclePreset}
              aria-label={`${strings.labels.themePresets}: ${activePreset?.label ?? preset}`}
              title={`${strings.labels.themePresets}: ${activePreset?.label ?? preset}`}
            >
              <Palette size={18} />
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

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs text-cute-muted">{strings.labels.calendarFilters}</span>
              <button
                type="button"
                className="filter-toggle"
                data-active={showEventDots}
                onClick={() => setShowEventDots((prev) => !prev)}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {strings.labels.events}
              </button>
              <button
                type="button"
                className="filter-toggle"
                data-active={showTripDots}
                onClick={() => setShowTripDots((prev) => !prev)}
              >
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                {strings.labels.trips}
              </button>
              <button
                type="button"
                className="filter-toggle"
                data-active={showTodoDots}
                onClick={() => setShowTodoDots((prev) => !prev)}
              >
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {strings.labels.todos}
              </button>
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

                const hasEvent = showEventDots && events.some((e) => e.startDate === dateStr);
                const hasTrip = showTripDots && trips.some((t) => isDateInRange(dateStr, t.startDate, t.endDate));

                const tripTodosOnDay = showTodoDots
                  ? trips.flatMap((t) => (t.todos || []).filter((todo) => todo.dueDate === dateStr))
                  : [];
                const globalTodosOnDay = showTodoDots ? globalTodos.filter((t) => t.dueDate === dateStr) : [];
                const todosOnDay = [...globalTodosOnDay, ...tripTodosOnDay];
                const hasDeadline = todosOnDay.length > 0;

                const hasPendingTodo = todosOnDay.some((todo) => !todo.done);
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
          <div className="space-y-4">
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

                {eventsForDate.map((event) => (
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
                      {event.startTime}
                      {event.endTime ? ` → ${event.endTime}` : ""}
                      {event.location ? ` • ${event.location}` : ""}
                    </p>
                  </div>
                ))}

                {tripsForDate.map((trip) => (
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

                {eventsForDate.length === 0 && tripsForDate.length === 0 && (
                    <p className="text-sm text-cute-muted mt-2">{strings.messages.noPlanned}</p>
                  )}
              </div>

              <div className="mt-5">
                <p className="text-xs text-cute-muted mb-2">{strings.labels.todoDeadlines}</p>

                {filteredTodosForDate.map((todo, i) => {
                  const isGlobal = todo.source === "global";
                  return (
                    <div
                      key={
                        todo.source === "global"
                          ? `${todo.source}-${todo.id}-${todo.text}-${i}`
                          : `${todo.source}-${todo.tripId}-${todo.text}-${todo.dueDate}-${i}`
                      }
                      onClick={() => toggleCombinedTodo(todo)}
                      onKeyDown={handleKeyActivate(() => toggleCombinedTodo(todo))}
                      className={`detail-pill ${todo.done ? "detail-green" : "detail-red"}`}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`font-semibold ${todo.done ? "line-through opacity-80" : ""}`}>{todo.text}</p>
                          <p className="text-xs opacity-80">
                            {isGlobal
                              ? `${strings.labels.global} • ${strings.labels.due}: ${todo.dueDate}${
                                  todo.pic ? ` • ${strings.labels.pic}: ${todo.pic}` : ""
                                } • ${strings.labels.repeat}: ${recurrenceSummary(todo.recurrence)}`
                              : `${todo.tripName} • ${strings.labels.pic}: ${todo.pic}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            className="icon-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (todo.source === "global") {
                                openEditTodo(todo);
                              } else {
                                openEditTripTodo(todo);
                              }
                            }}
                            aria-label={strings.actions.editTodo}
                            title={strings.actions.editTodo}
                          >
                            <Pencil size={18} />
                          </button>
                          {isGlobal ? (
                            <button
                              className="icon-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (todo.source === "global") {
                                  deleteGlobalTodo(todo);
                                }
                              }}
                              aria-label={strings.actions.deleteTodo}
                              title={strings.actions.deleteTodo}
                            >
                              <Trash2 size={18} />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredTodosForDate.length === 0 && (
                  <p className="text-sm text-cute-muted mt-2">{strings.messages.noDeadlines}</p>
                )}
              </div>
            </div>

            <div className="card-cute">
              <div className="flex items-center justify-between">
                <span className="badge badge-sun">{strings.labels.weatherNow}</span>
              </div>

              {weatherLoading ? (
                <p className="text-sm text-cute-muted mt-3">{strings.messages.weatherLoading}</p>
              ) : weatherError || !weather ? (
                <p className="text-sm text-cute-muted mt-3">{strings.messages.weatherError}</p>
              ) : (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="weather-emoji">{weatherEmoji(weather.weatherCode, weather.currentTemp)}</span>
                    <div>
                      <p className="font-semibold">
                        {strings.labels.weatherCurrent}: {Math.round(weather.currentTemp)}°C
                      </p>
                      <p className="text-xs text-cute-muted">
                        {strings.labels.weatherMin}: {Math.round(weather.minTemp)}°C • {strings.labels.weatherMax}: {Math.round(weather.maxTemp)}°C
                      </p>
                    </div>
                  </div>
                  <div
                    key={weatherRunnerVariant(weather.weatherCode, weather.currentTemp)}
                    className={`weather-runner weather-runner--${weatherRunnerVariant(
                      weather.weatherCode,
                      weather.currentTemp
                    )}`}
                  >
                    <iframe
                      src="https://tenor.com/embed/25840732"
                      title="Quby running"
                      loading="lazy"
                      allow="autoplay; encrypted-media"
                    />
                  </div>
                </div>
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
                        {event.startDate} {event.startTime}
                        {event.endTime ? ` → ${event.endDate} ${event.endTime}` : ` → ${event.endDate}`}
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
                      {trip.recurrence && trip.recurrence !== "none"
                        ? ` • ${strings.labels.repeat}: ${recurrenceSummary(trip.recurrence)}`
                        : ""}
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
              {todosSoon.map((todo, i) => {
                const isGlobal = todo.source === "global";
                return (
                  <div
                    key={
                      todo.source === "global"
                        ? `${todo.source}-${todo.id}-${todo.text}-${todo.dueDate}-${i}`
                        : `${todo.source}-${todo.tripId}-${todo.text}-${todo.dueDate}-${i}`
                    }
                    className={`row-cute ${todo.done ? "opacity-80" : ""}`}
                    onClick={() => toggleCombinedTodo(todo)}
                    onKeyDown={handleKeyActivate(() => toggleCombinedTodo(todo))}
                    role="button"
                    tabIndex={0}
                  >
                    <button
                      className="icon-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (todo.source === "global") {
                          toggleGlobalTodo(todo);
                        }
                      }}
                      aria-label={todo.done ? strings.actions.undo : strings.actions.done}
                      title={todo.done ? strings.actions.undo : strings.actions.done}
                    >
                      <CheckSquare size={16} />
                    </button>
                    <div className="min-w-0">
                      <p className={`font-semibold truncate ${todo.done ? "line-through text-cute-muted" : ""}`}>{todo.text}</p>
                      <p className="text-xs text-cute-muted mt-1">
                        {isGlobal
                          ? `${strings.labels.global} • ${strings.labels.due}: ${todo.dueDate}${
                              todo.pic ? ` • ${strings.labels.pic}: ${todo.pic}` : ""
                            } • ${strings.labels.repeat}: ${recurrenceSummary(todo.recurrence)}`
                          : `${todo.tripName} • ${strings.labels.pic}: ${todo.pic} • ${strings.labels.due}: ${todo.dueDate}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (todo.source === "global") {
                            openEditTodo(todo);
                          } else {
                            openEditTripTodo(todo);
                          }
                        }}
                        aria-label={strings.actions.editTodo}
                        title={strings.actions.editTodo}
                      >
                        <Pencil size={18} />
                      </button>
                      {isGlobal ? (
                        <button
                          className="icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (todo.source === "global") {
                              deleteGlobalTodo(todo);
                            }
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
                  onKeyDown={handleKeyActivate(() => toggleWishlistItem(w))}
                  role="button"
                  tabIndex={0}
                >
                  <div className="min-w-0">
                    <p className={`font-semibold truncate ${w.done ? "line-through text-cute-muted" : ""}`}>{w.text}</p>
                    <p className="text-xs text-cute-muted mt-1">{strings.messages.somedayTap}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      className="icon-btn disabled:opacity-40"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveWishlistItem(w.id, -1);
                      }}
                      aria-label={strings.actions.moveUp}
                      title={strings.actions.moveUp}
                      disabled={wishlistOrdered[0]?.id === w.id}
                    >
                      <ArrowUp size={18} />
                    </button>
                    <button
                      className="icon-btn disabled:opacity-40"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveWishlistItem(w.id, 1);
                      }}
                      aria-label={strings.actions.moveDown}
                      title={strings.actions.moveDown}
                      disabled={wishlistOrdered[wishlistOrdered.length - 1]?.id === w.id}
                    >
                      <ArrowDown size={18} />
                    </button>
                    <button
                      className="icon-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditWishlist(w);
                      }}
                      aria-label={strings.actions.editWishlist}
                      title={strings.actions.editWishlist}
                    >
                      <Pencil size={18} />
                    </button>
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
                      disabled={!name || !eventStartDate || !eventEndDate || !startTime}
                    >
                      {strings.labels.createEvent}
                    </button>
                  </div>
                )}

                {createMode === "trip" && (
                  <div className="space-y-3">
                    <p className="text-lg font-extrabold">{strings.labels.planTrip}</p>
                    <input placeholder={strings.labels.tripName} value={name} onChange={(e) => setName(e.target.value)} className="cute-input" />
                    <div>
                      <p className="cute-label">{strings.labels.repeat}</p>
                      <select
                        value={tripRecurrence}
                        onChange={(e) => setTripRecurrence(e.target.value as RecurrenceType)}
                        className="cute-input"
                      >
                        <option value="none">{strings.labels.repeatNone}</option>
                        <option value="weekly">{strings.labels.repeatWeekly}</option>
                        <option value="monthly">{strings.labels.repeatMonthly}</option>
                        <option value="yearly">{strings.labels.repeatYearly}</option>
                      </select>
                    </div>
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
                      <p className="cute-label">{strings.labels.pic}</p>
                      <input
                        placeholder={strings.labels.assignPic}
                        value={todoPic}
                        onChange={(e) => setTodoPic(e.target.value)}
                        className="cute-input"
                      />
                    </div>
                    <div>
                      <p className="cute-label">{strings.labels.dueDate}</p>
                      <input type="date" value={todoDue} onChange={(e) => setTodoDue(e.target.value)} className="cute-input" />
                    </div>
                    <div>
                      <p className="cute-label">{strings.labels.repeat}</p>
                      <select
                        value={todoRecurrence}
                        onChange={(e) => setTodoRecurrence(e.target.value as RecurrenceType)}
                        className="cute-input"
                      >
                        <option value="none">{strings.labels.repeatNone}</option>
                        <option value="daily">{strings.labels.repeatDaily}</option>
                        <option value="weekly">{strings.labels.repeatWeekly}</option>
                        <option value="monthly">{strings.labels.repeatMonthly}</option>
                        <option value="yearly">{strings.labels.repeatYearly}</option>
                      </select>
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

      {/* Edit Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-black/35 flex items-end"
          onClick={() => resetEditInputs()}
        >
          <div
            className="modal-sheet w-full rounded-t-[28px] p-6 shadow-[0_-20px_60px_rgba(0,0,0,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-lg font-extrabold tracking-tight">
                {editType === "wishlist" ? strings.labels.editWishlistItem : strings.labels.editTodo}
              </p>
              <button className="mini-nav" onClick={resetEditInputs}>
                ✕
              </button>
            </div>

            {(editType === "todo" || editType === "tripTodo") && (
              <div className="space-y-3">
                <input
                  placeholder={strings.labels.taskPlaceholder}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="cute-input"
                />
                <div>
                  <p className="cute-label">{strings.labels.pic}</p>
                  <input
                    placeholder={strings.labels.assignPic}
                    value={editPic}
                    onChange={(e) => setEditPic(e.target.value)}
                    className="cute-input"
                  />
                </div>
                <div>
                  <p className="cute-label">{strings.labels.dueDate}</p>
                  <input type="date" value={editDue} onChange={(e) => setEditDue(e.target.value)} className="cute-input" />
                </div>
                {editType === "todo" ? (
                  <>
                    <div>
                      <p className="cute-label">{strings.labels.repeat}</p>
                      <select
                        value={editRecurrence}
                        onChange={(e) => setEditRecurrence(e.target.value as RecurrenceType)}
                        className="cute-input"
                      >
                        <option value="none">{strings.labels.repeatNone}</option>
                        <option value="daily">{strings.labels.repeatDaily}</option>
                        <option value="weekly">{strings.labels.repeatWeekly}</option>
                        <option value="monthly">{strings.labels.repeatMonthly}</option>
                        <option value="yearly">{strings.labels.repeatYearly}</option>
                      </select>
                    </div>
                  </>
                ) : null}
                <button
                  onClick={async () => {
                    if (!editText.trim() || !editDue) return;
                    if (editType === "todo") {
                      if (!activeTodo) return;
                      await updateGlobalTodo(activeTodo);
                    }
                    if (editType === "tripTodo") {
                      if (!editPic.trim()) return;
                      if (!editTripTodoOriginal) return;
                      await updateTripTodo();
                    }
                    resetEditInputs();
                  }}
                  className="w-full py-4 rounded-2xl bg-cute-accent text-white font-extrabold shadow-cute active:scale-[0.99] transition disabled:opacity-50"
                  disabled={
                    !editText.trim() || !editDue || (editType === "tripTodo" && !editPic.trim())
                  }
                >
                  {strings.actions.saveChanges}
                </button>
              </div>
            )}

            {editType === "wishlist" && (
              <div className="space-y-3">
                <input
                  placeholder={strings.labels.wishPlaceholder}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="cute-input"
                />
                <button
                  onClick={async () => {
                    if (!activeWishlist) return;
                    if (!editText.trim()) return;
                    await updateWishlistItem(activeWishlist);
                    resetEditInputs();
                  }}
                  className="w-full py-4 rounded-2xl bg-cute-accent text-white font-extrabold shadow-cute active:scale-[0.99] transition disabled:opacity-50"
                  disabled={!editText.trim()}
                >
                  {strings.actions.saveChanges}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
