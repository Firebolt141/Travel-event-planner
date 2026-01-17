"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  Plus,
  Trash2,
  LogOut,
  CalendarDays,
  List,
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
  const date = new Date(dateStr);
  const start = new Date(startStr);

  if (!endStr) {
    return date.getTime() === start.getTime(); // only show on the startDate
  }

  const end = new Date(endStr);
  return date >= start && date <= end;
}

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"events" | "trips" | "calendar">("events");


  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [selectedDate, setSelectedDate] = useState(formatDate(today));

  const [showModal, setShowModal] = useState(false);
  const [tripName, setTripName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isEventModal, setIsEventModal] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const router = useRouter();
  function goPrevMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      )
    );
  }

  function goNextMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      )
    );
  }

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, setUser);
    const unsubTrips = onSnapshot(collection(db, "trips"), (snap) => {
      setTrips(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubEvents = onSnapshot(collection(db, "events"), (snap) => {
      setEvents(snap.docs.map((d) => ({id: d.id, ...d.data()})));
    });

    return () => {
      unsubAuth();
      unsubTrips();
      unsubEvents();
    };
  }, []);

    if (!user) {
        return (
            <main
                className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white px-5 text-center">
                <h1 className="text-4xl font-bold mb-4">Meet Asuka 😎</h1>
                <p className="text-gray-400 mb-8 max-w-md">
                    Make plans to meet Asuka, keep track of all your trips, events, and TODOs,
                    and never forget the important stuff (or the silly stuff).
                    Go wild, plan adventures, or just see what Asuka is up to!
                </p>

                <button
                    className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-semibold"
                    onClick={() => setUser({name: "Demo User"})}
                >
                    Lets Go!
                </button>

                <p className="text-gray-500 text-sm">
                    After logging in, you'll see your trips, events, and TODOs. Let the planning begin! 🚀
                </p>
            </main>
        );
    }


  /* ---------------- CALENDAR DATA ---------------- */
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const eventsForDate = [
    ...trips.filter((t) =>
        isDateInRange(selectedDate, t.startDate, t.endDate)
    ),
    ...events.filter((e) =>
        isDateInRange(selectedDate, e.startDate, e.endDate)
    ),
  ];

  const todosForDate = trips.flatMap((trip) =>
    (trip.todos || [])
      .filter((todo: any) => {
        const date = todo.dueDate || todo.deadline;
        return date === selectedDate;
      })
      .map((todo: any) => ({
        ...todo,
        tripName: trip.name,
        tripId: trip.id,
      }))
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-28">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-3xl font-bold">Planner</h1>

        <div className="flex gap-2 mt-4">
          <button
              onClick={() => setActiveTab("events")}
              className={`flex-1 py-2 rounded-xl ${
                  activeTab === "events" ? "bg-indigo-600" : "bg-white/10"
              }`}
          >
            Events
          </button>

          <button
              onClick={() => setActiveTab("trips")}
              className={`flex-1 py-2 rounded-xl ${
                  activeTab === "trips" ? "bg-indigo-600" : "bg-white/10"
              }`}
          >
            <List size={16} className="inline mr-1"/> Trips
          </button>

          <button
              onClick={() => setActiveTab("calendar")}
              className={`flex-1 py-2 rounded-xl ${
                  activeTab === "calendar" ? "bg-indigo-600" : "bg-white/10"
              }`}
          >
            <CalendarDays size={16} className="inline mr-1"/> Calendar
          </button>
        </div>
      </header>
      {/* ---------------- EVENTS TAB ---------------- */}
      {activeTab === "events" && (
          <div className="px-5 space-y-4">
            {events.map((event) => (
                <div
                    key={event.id}
                    className="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-4"
                >
                  <div className="cursor-pointer" onClick={() => router.push(`/event/${event.id}`)}>
                    <p className="font-semibold text-lg">{event.name}</p>
                    <p className="text-xs text-gray-400">
                      {event.startDate} {event.startTime} → {event.endDate} {event.endTime}
                    </p>
                    {event.location && (
                        <p className="text-xs text-gray-400">📍 {event.location}</p>
                    )}
                  </div>

                  <button onClick={() => deleteDoc(doc(db, "events", event.id))}>
                    <Trash2 className="text-red-400" size={18}/>
                  </button>
                </div>
            ))}

            {events.length === 0 && (
                <p className="text-gray-500 text-sm">No events yet</p>
            )}
          </div>
      )}

      {/* ---------------- TRIPS TAB ---------------- */}
      {activeTab === "trips" && (
        <div className="px-5 space-y-4">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-4"
            >
              <div
                  onClick={() =>
                      router.push(`/trip/${trip.id}`)
                  }

                className="cursor-pointer"
              >
                <p className="font-semibold text-lg">{trip.name}</p>
                <p className="text-xs text-gray-400">
                  {trip.startDate} → {trip.endDate}
                </p>
              </div>

              <button
                onClick={() => deleteDoc(doc(db, "trips", trip.id))}
              >
                <Trash2 className="text-red-400" size={18} />
              </button>
            </div>
          ))}

          {trips.length === 0 && (
            <p className="text-gray-500 text-sm">No trips yet</p>
          )}
        </div>
      )}

      {/* ---------------- CALENDAR TAB ---------------- */}
      {activeTab === "calendar" && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={goPrevMonth}
              className="px-3 py-1 rounded-lg bg-white/10"
            >
              ←
            </button>

            <h2 className="text-lg font-semibold">
              {currentMonth.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </h2>

            <button
              onClick={goNextMonth}
              className="px-3 py-1 rounded-lg bg-white/10"
            >
              →
            </button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div
                key={`${d}-${i}`}
                className="text-center text-xs text-gray-400"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {days.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;

              const dateStr = formatDate(new Date(year, month, day));
              const hasEventOrTrip = [
                ...events,
                ...trips
              ].some(item => {
                const start = formatDate(new Date(item.startDate));
                const end = formatDate(new Date(item.endDate));
                return isDateInRange(dateStr, start, end);
              });



              const todosOnDay = trips.flatMap((t) =>
                (t.todos || []).filter(
                  (todo: any) => todo.dueDate === dateStr
                )
              );

              const hasPendingTodo = todosOnDay.some(
                (todo: any) => !todo.done
              );

              const hasCompletedTodo =
                todosOnDay.length > 0 && !hasPendingTodo;


              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative h-10 rounded-xl text-sm ${
                      selectedDate === dateStr
                          ? "bg-indigo-600"
                          : hasPendingTodo
                              ? "bg-red-500/40"
                              : hasCompletedTodo
                                  ? "bg-green-500/40"
                                  : hasEventOrTrip
                                      ? "bg-white/20"
                                      : "bg-white/5"
                  }`}
                >
                  {day}

                  {/* TODO STATUS DOT */}
                  {hasPendingTodo && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-400" />
                  )}

                  {!hasPendingTodo && hasCompletedTodo && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-green-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Date Details */}
          <div className="space-y-6">
            <h3 className="text-sm text-gray-400">{selectedDate}</h3>

            {/* EVENTS + TRIPS */}
            <div>
              <p className="text-xs text-gray-400 mb-2">EVENTS & TRIPS</p>

              {/* EVENTS */}
              {events.filter(e => {
                const start = formatDate(new Date(e.startDate));
                const end = formatDate(new Date(e.endDate));
                return isDateInRange(selectedDate, start, end);
              }).map(event => (
                  <div
                      key={event.id}
                      onClick={() => router.push(`/event/${event.id}`)}
                      className="p-4 mb-2 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <p className="font-semibold">{event.name}</p>
                  </div>
              ))}

              {/* TRIPS */}
              {trips.filter(t => isDateInRange(selectedDate, t.startDate, t.endDate)).map(trip => (
                  <div
                      key={trip.id}
                      onClick={() => router.push(`/trip/${trip.id}`)}
                      className="p-4 mb-2 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <p className="font-semibold">{trip.name}</p>
                  </div>
              ))}

              {events.filter(e => isDateInRange(selectedDate, e.startDate, e.endDate)).length === 0 &&
                  trips.filter(t => isDateInRange(selectedDate, t.startDate, t.endDate)).length === 0 && (
                      <p className="text-gray-500 text-sm">No events or trips</p>
                  )}
            </div>


            {/* TODO DEADLINES */}
            <div>
              <p className="text-xs text-gray-400 mb-2">TODO DEADLINES</p>
              {todosForDate.map((todo, i) => (
            <div
              key={i}
              onClick={() => router.push(`/trip/${todo.tripId}`)}
              className={`p-4 mb-2 rounded-2xl border ${
                todo.done
                  ? "bg-green-500/20 border-green-500/30"
                  : "bg-red-500/20 border-red-500/30"
              }`}
            >
                  <p
                    className={`font-semibold ${
                      todo.done ? "line-through text-green-300" : ""
                    }`}
                  >
                    {todo.text}
                  </p>
                  <p className="text-xs text-gray-300">
                    {todo.tripName} • PIC: {todo.pic}
                  </p>
                </div>
              ))}
              {todosForDate.length === 0 && (
                <p className="text-gray-500 text-sm">No deadlines</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Add */}
      <button
          onClick={() => {
            if (activeTab === "events") {
              setIsEventModal(true);  // Event modal
            } else {
              setIsEventModal(false); // Trip modal
            }
            setShowModal(true);
          }}
          className="fixed bottom-24 right-6 w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center"
      >
        <Plus size={28} />
      </button>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 py-4 flex justify-center">
        <button onClick={() => signOut(auth)} className="text-red-400">
          <LogOut />
        </button>
      </nav>

      {/* Create Trip Modal */}
      {showModal && (
          <div
              className="fixed inset-0 bg-black/70 flex items-end"
              onClick={() => setShowModal(false)} // click outside closes modal
          >
            <div
                className="bg-[#020617] w-full rounded-t-3xl p-6"
                onClick={(e) => e.stopPropagation()} // prevent modal inner clicks from closing
            >
              {isEventModal ? (
                  <>
                    <input
                        placeholder="Event name"
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                        className="w-full p-3 mb-3 rounded-xl bg-white/10"
                    />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-3 mb-3 rounded-xl bg-white/10"
                    />
                    <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full p-3 mb-3 rounded-xl bg-white/10"
                    />
                    <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full p-3 mb-3 rounded-xl bg-white/10"
                    />
                    <input
                        placeholder="Location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full p-3 mb-4 rounded-xl bg-white/10"
                    />

                    <button
                        onClick={async () => {
                          await addDoc(collection(db, "events"), {
                            name: tripName,
                            startDate,
                            startTime,
                            endTime,
                            location,
                          });
                          setShowModal(false);
                          setIsEventModal(false);
                          setTripName("");
                          setStartDate("");
                          setEndDate("");
                          setStartTime("");
                          setEndTime("");
                          setLocation("");
                        }}
                        className="w-full py-4 bg-indigo-600 rounded-2xl font-semibold"
                    >
                      Create Event
                    </button>
                  </>
              ) : (
                  /* Existing trip modal here */
                  <>
                    <input
                        placeholder="Trip name"
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                        className="w-full p-3 mb-3 rounded-xl bg-white/10"
                    />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-3 mb-3 rounded-xl bg-white/10"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full p-3 mb-4 rounded-xl bg-white/10"
                    />

                    <button
                        onClick={async () => {
                          await addDoc(collection(db, "trips"), {
                            name: tripName,
                            startDate,
                            endDate,
                          });
                          setShowModal(false);
                          setTripName("");
                          setStartDate("");
                          setEndDate("");
                        }}
                        className="w-full py-4 bg-indigo-600 rounded-2xl font-semibold"
                    >
                      Create Trip
                    </button>
                  </>
              )}
            </div>
          </div>
      )}

    </div>
  );
}
