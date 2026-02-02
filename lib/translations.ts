export type Language = "en" | "ja";

export const translations: Record<
  Language,
  {
    locale: string;
    languageShort: string;
    labels: {
      planner: string;
      appName: string;
      tagline: string;
      calendar: string;
      details: string;
      selected: string;
      eventsTrips: string;
      todoDeadlines: string;
      events: string;
      trips: string;
      todos: string;
      wishlist: string;
      globalTripDeadlines: string;
      total: string;
      items: string;
      tasks: string;
      people: string;
      addSomething: string;
      event: string;
      trip: string;
      todo: string;
      wishlistItem: string;
      meetups: string;
      travel: string;
      deadline: string;
      someday: string;
      planEvent: string;
      planTrip: string;
      addTask: string;
      addSomedayIdea: string;
      editTodo: string;
      editWishlistItem: string;
      eventName: string;
      tripName: string;
      taskPlaceholder: string;
      wishPlaceholder: string;
      startDate: string;
      endDate: string;
      startTime: string;
      endTime: string;
      locationOptional: string;
      dueDate: string;
      createEvent: string;
      createTrip: string;
      addTodo: string;
      addToWishlist: string;
      recurring: string;
      yes: string;
      no: string;
      global: string;
      due: string;
      pic: string;
      dates: string;
      description: string;
      descriptionPlaceholder: string;
      participants: string;
      name: string;
      task: string;
      assignPic: string;
      addParticipant: string;
      weatherNow: string;
      weatherLocation: string;
      weatherCurrent: string;
      weatherMin: string;
      weatherMax: string;
      weatherUpdated: string;
      progress: string;
      completed: string;
      calendarFilters: string;
      themePresets: string;
      repeat: string;
      repeatNone: string;
      repeatDaily: string;
      repeatWeekly: string;
      repeatMonthly: string;
      repeatYearly: string;
      reminders: string;
      enableReminders: string;
      reminderTime: string;
    };
    messages: {
      welcomeBack: string;
      subtitle: string;
      catchingZ: string;
      letsGo: string;
      nothingUrgent: string;
      noPlanned: string;
      noDeadlines: string;
      noEvents: string;
      noTrips: string;
      noTodos: string;
      noWishlist: string;
      somedayTap: string;
      addAtLeastOneParticipant: string;
      noParticipants: string;
      noTripTodos: string;
      loading: string;
      packingPixels: string;
      wakingPlans: string;
      oneTinyMoment: string;
      tipSave: string;
      eventDetails: string;
      tripDetails: string;
      weatherLoading: string;
      weatherError: string;
      remindersEnabled: string;
      remindersDenied: string;
      remindersUnsupported: string;
      remindersMissingKey: string;
      remindersSignIn: string;
    };
    actions: {
      seeYouLater: string;
      toggleTheme: string;
      switchToJapanese: string;
      switchToEnglish: string;
      previousMonth: string;
      nextMonth: string;
      add: string;
      delete: string;
      deleteEvent: string;
      deleteTrip: string;
      deleteTodo: string;
      deleteWishlist: string;
      editTodo: string;
      editWishlist: string;
      saveChanges: string;
      removeParticipant: string;
      createNextTrip: string;
      back: string;
    };
    daysShort: string[];
    moods: string[];
  }
> = {
  en: {
    locale: "en-US",
    languageShort: "EN",
    labels: {
      planner: "Planner",
      appName: "Asuka",
      tagline: "Your little planner",
      calendar: "Calendar",
      details: "Details",
      selected: "Selected",
      eventsTrips: "EVENTS & TRIPS",
      todoDeadlines: "TODO DEADLINES",
      events: "Events",
      trips: "Trips",
      todos: "TODOs",
      wishlist: "Wishlist",
      globalTripDeadlines: "global + trip deadlines",
      total: "total",
      items: "items",
      tasks: "tasks",
      people: "people",
      addSomething: "Add something ✨",
      event: "Event",
      trip: "Trip",
      todo: "TODO",
      wishlistItem: "Wishlist",
      meetups: "meetups",
      travel: "travel",
      deadline: "deadline",
      someday: "someday",
      planEvent: "Plan an Event ✨",
      planTrip: "Plan a Trip ✨",
      addTask: "Add a Task ✨",
      addSomedayIdea: "Add a Someday Idea 💭",
      editTodo: "Edit TODO ✏️",
      editWishlistItem: "Edit Wishlist ✏️",
      eventName: "Event name",
      tripName: "Trip name",
      taskPlaceholder: "What do you need to do?",
      wishPlaceholder: "Something you want to do someday…",
      startDate: "Start date",
      endDate: "End date",
      startTime: "Start time",
      endTime: "End time",
      locationOptional: "Location (optional)",
      dueDate: "Due date",
      createEvent: "Create Event",
      createTrip: "Create Trip",
      addTodo: "Add TODO",
      addToWishlist: "Add to Wishlist",
      recurring: "Recurring event?",
      yes: "Yes",
      no: "No",
      global: "Global",
      due: "Due",
      pic: "PIC",
      dates: "Dates",
      description: "Description",
      descriptionPlaceholder: "Add description…",
      participants: "Participants",
      name: "Name",
      task: "Task",
      assignPic: "Assign PIC",
      addParticipant: "Add Participant",
      weatherNow: "Weather now",
      weatherLocation: "Nishi-Waseda",
      weatherCurrent: "Current",
      weatherMin: "Min",
      weatherMax: "Max",
      weatherUpdated: "Updated",
      progress: "Progress",
      completed: "Completed",
      calendarFilters: "Calendar filters",
      themePresets: "Theme presets",
      repeat: "Repeat",
      repeatNone: "No repeat",
      repeatDaily: "Daily",
      repeatWeekly: "Weekly",
      repeatMonthly: "Monthly",
      repeatYearly: "Yearly",
      reminders: "Reminders",
      enableReminders: "Enable reminders",
      reminderTime: "Reminder time",
    },
    messages: {
      welcomeBack: "Welcome back",
      subtitle: "Events • Trips • TODOs • Wishlist",
      catchingZ: "Catching Z’s… zZz 🌙",
      letsGo: "Let’s go!",
      nothingUrgent: "Nothing urgent — enjoy! 💤",
      noPlanned: "Nothing planned here yet ✨",
      noDeadlines: "No deadlines — cozy day ☕",
      noEvents: "No events yet — add a little joy ✨",
      noTrips: "No trips yet — someday? 🧳",
      noTodos: "No deadlines — breathe 🌿",
      noWishlist: "Nothing here yet — add a little dream 💭",
      somedayTap: "Someday ✨ (tap to mark done)",
      addAtLeastOneParticipant: "Add at least 1 participant to assign PIC.",
      noParticipants: "No participants yet",
      noTripTodos: "No TODOs yet",
      loading: "Loading…",
      packingPixels: "Packing the pixels…",
      wakingPlans: "Waking the plans…",
      oneTinyMoment: "One tiny moment…",
      tipSave: "Tip: Click outside the box to save.",
      eventDetails: "Event details",
      tripDetails: "Trip details",
      weatherLoading: "Fetching live weather…",
      weatherError: "Weather unavailable right now.",
      remindersEnabled: "Push reminders enabled!",
      remindersDenied: "Notifications are blocked in your browser settings.",
      remindersUnsupported: "Push notifications aren’t supported in this browser.",
      remindersMissingKey: "FCM VAPID key missing. Add NEXT_PUBLIC_FCM_VAPID_KEY.",
      remindersSignIn: "Sign in to enable push reminders.",
    },
    actions: {
      seeYouLater: "See you later",
      toggleTheme: "Toggle theme",
      switchToJapanese: "Switch to Japanese",
      switchToEnglish: "Switch to English",
      previousMonth: "Previous month",
      nextMonth: "Next month",
      add: "Add",
      delete: "Delete",
      deleteEvent: "Delete event",
      deleteTrip: "Delete trip",
      deleteTodo: "Delete todo",
      deleteWishlist: "Delete wishlist item",
      editTodo: "Edit todo",
      editWishlist: "Edit wishlist item",
      saveChanges: "Save changes",
      removeParticipant: "Remove participant",
      createNextTrip: "Create next trip",
      back: "Back",
    },
    daysShort: ["S", "M", "T", "W", "T", "F", "S"],
    moods: [
      "Small steps are enough 🌿",
      "Plan something gentle today ☁️",
      "A little progress is still progress ✨",
      "Treat yourself kindly today ☕",
      "One cute plan at a time 🫶",
      "Make space for fun too 🌈",
      "You’re doing great — quietly 🌙",
      "Today feels like a good day to plan 🌤️",
    ],
  },
  ja: {
    locale: "ja-JP",
    languageShort: "日本語",
    labels: {
      planner: "プランナー",
      appName: "明日香",
      tagline: "ちいさなプランナー",
      calendar: "カレンダー",
      details: "詳細",
      selected: "選択日",
      eventsTrips: "イベント＆旅行",
      todoDeadlines: "TODO 期限",
      events: "イベント",
      trips: "旅行",
      todos: "TODO",
      wishlist: "ウィッシュリスト",
      globalTripDeadlines: "全体 + 旅行の期限",
      total: "件",
      items: "件",
      tasks: "件",
      people: "人",
      addSomething: "追加しよう ✨",
      event: "イベント",
      trip: "旅行",
      todo: "TODO",
      wishlistItem: "ウィッシュリスト",
      meetups: "集まり",
      travel: "旅行",
      deadline: "期限",
      someday: "いつか",
      planEvent: "イベントを計画 ✨",
      planTrip: "旅行を計画 ✨",
      addTask: "タスクを追加 ✨",
      addSomedayIdea: "いつかのアイデア 💭",
      editTodo: "TODOを編集 ✏️",
      editWishlistItem: "ウィッシュリストを編集 ✏️",
      eventName: "イベント名",
      tripName: "旅行名",
      taskPlaceholder: "何をする？",
      wishPlaceholder: "いつかやりたいこと…",
      startDate: "開始日",
      endDate: "終了日",
      startTime: "開始時間",
      endTime: "終了時間",
      locationOptional: "場所（任意）",
      dueDate: "期限",
      createEvent: "イベントを作成",
      createTrip: "旅行を作成",
      addTodo: "TODOを追加",
      addToWishlist: "ウィッシュリストに追加",
      recurring: "繰り返しイベント？",
      yes: "はい",
      no: "いいえ",
      global: "全体",
      due: "期限",
      pic: "担当",
      dates: "日付",
      description: "説明",
      descriptionPlaceholder: "説明を追加…",
      participants: "参加者",
      name: "名前",
      task: "タスク",
      assignPic: "担当者を選択",
      addParticipant: "参加者を追加",
      weatherNow: "今の天気",
      weatherLocation: "西早稲田",
      weatherCurrent: "現在",
      weatherMin: "最低",
      weatherMax: "最高",
      weatherUpdated: "更新",
      progress: "進捗",
      completed: "完了",
      calendarFilters: "カレンダー表示",
      themePresets: "テーマ",
      repeat: "繰り返し",
      repeatNone: "繰り返しなし",
      repeatDaily: "毎日",
      repeatWeekly: "毎週",
      repeatMonthly: "毎月",
      repeatYearly: "毎年",
      reminders: "リマインダー",
      enableReminders: "リマインダーを有効化",
      reminderTime: "リマインダー時間",
    },
    messages: {
      welcomeBack: "おかえりなさい",
      subtitle: "イベント • 旅行 • TODO • ウィッシュリスト",
      catchingZ: "休憩中… zZz 🌙",
      letsGo: "はじめよう！",
      nothingUrgent: "急ぎなし — のんびり 💤",
      noPlanned: "まだ予定なし ✨",
      noDeadlines: "期限なし — ほっと一息 ☕",
      noEvents: "イベントはまだありません ✨",
      noTrips: "旅行はまだありません 🧳",
      noTodos: "期限なし — 深呼吸 🌿",
      noWishlist: "まだありません — 夢を追加 💭",
      somedayTap: "いつか ✨（タップで完了）",
      addAtLeastOneParticipant: "担当者を選ぶには参加者を1人以上追加してください。",
      noParticipants: "参加者なし",
      noTripTodos: "TODOはまだありません",
      loading: "読み込み中…",
      packingPixels: "ピクセル準備中…",
      wakingPlans: "予定を起こし中…",
      oneTinyMoment: "ちょっとだけ待ってね…",
      tipSave: "ヒント：外側をクリックすると保存。",
      eventDetails: "イベント詳細",
      tripDetails: "旅行詳細",
      weatherLoading: "天気を取得中…",
      weatherError: "天気を取得できません。",
      remindersEnabled: "プッシュ通知を有効にしました！",
      remindersDenied: "ブラウザで通知がブロックされています。",
      remindersUnsupported: "このブラウザは通知に対応していません。",
      remindersMissingKey: "FCMのVAPIDキーが未設定です。",
      remindersSignIn: "通知を有効にするにはログインしてください。",
    },
    actions: {
      seeYouLater: "またね",
      toggleTheme: "テーマ切替",
      switchToJapanese: "日本語に切替",
      switchToEnglish: "英語に切替",
      previousMonth: "前の月",
      nextMonth: "次の月",
      add: "追加",
      delete: "削除",
      deleteEvent: "イベントを削除",
      deleteTrip: "旅行を削除",
      deleteTodo: "TODOを削除",
      deleteWishlist: "ウィッシュリストを削除",
      editTodo: "TODOを編集",
      editWishlist: "ウィッシュリストを編集",
      saveChanges: "変更を保存",
      removeParticipant: "参加者を削除",
      createNextTrip: "次の旅行を作成",
      back: "戻る",
    },
    daysShort: ["日", "月", "火", "水", "木", "金", "土"],
    moods: [
      "小さな一歩で十分だよ 🌿",
      "今日はやさしい予定を ☁️",
      "少しの前進も素敵 ✨",
      "自分に優しくね ☕",
      "かわいい計画を少しずつ 🫶",
      "楽しい時間も忘れずに 🌈",
      "静かに頑張っててえらい 🌙",
      "今日は計画にぴったりの日 🌤️",
    ],
  },
};
