// In-memory + localStorage fallback client for AI Studio preview environment
const DEMO_USER_ID = "demo-user-nova";
const STORAGE_PREFIX = "nova_mock_db_";

interface MockUser {
  id: string;
  email: string;
  user_metadata: { full_name?: string };
}

function getStoredTable(tableName: string): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + tableName);
    if (raw) return JSON.parse(raw);
  } catch {}
  return getInitialData(tableName);
}

function saveStoredTable(tableName: string, data: any[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + tableName, JSON.stringify(data));
  } catch {}
}

function getInitialData(tableName: string): any[] {
  const now = new Date().toISOString();
  if (tableName === "profiles") {
    return [
      {
        id: DEMO_USER_ID,
        email: "demo@nova.ai",
        full_name: "Nova Explorer",
        plan: "pro",
        created_at: now,
        updated_at: now,
      },
    ];
  }
  if (tableName === "projects") {
    return [
      {
        id: "proj-1",
        user_id: DEMO_USER_ID,
        name: "Autonomous Research Agent",
        description: "Building deep reasoning tools and cognitive workflows.",
        color: "#3b82f6",
        created_at: now,
        updated_at: now,
      },
      {
        id: "proj-2",
        user_id: DEMO_USER_ID,
        name: "Personal Knowledge Graph",
        description: "Associative indexing of notes, conversations, and docs.",
        color: "#06b6d4",
        created_at: now,
        updated_at: now,
      },
    ];
  }
  if (tableName === "tasks") {
    return [
      {
        id: "task-1",
        user_id: DEMO_USER_ID,
        title: "Review system prompt boundaries",
        status: "in_progress",
        priority: "high",
        created_at: now,
      },
      {
        id: "task-2",
        user_id: DEMO_USER_ID,
        title: "Index recent technical papers",
        status: "todo",
        priority: "medium",
        created_at: now,
      },
    ];
  }
  if (tableName === "memories") {
    return [
      {
        id: "mem-1",
        user_id: DEMO_USER_ID,
        content: "Prefers concise, mathematically grounded answers with direct code snippets.",
        category: "preference",
        archived: false,
        created_at: now,
        updated_at: now,
      },
    ];
  }
  if (tableName === "conversations") {
    return [
      {
        id: "conv-1",
        user_id: DEMO_USER_ID,
        title: "Welcome to NOVA AI",
        pinned: true,
        archived: false,
        model: "nova-auto",
        created_at: now,
        updated_at: now,
      },
    ];
  }
  if (tableName === "messages") {
    return [
      {
        id: "msg-1",
        conversation_id: "conv-1",
        user_id: DEMO_USER_ID,
        role: "assistant",
        content: "Welcome to NOVA! Your personal AI operating system is ready.",
        status: "complete",
        model: "nova-auto",
        provider: "nova_cloud",
        created_at: now,
      },
    ];
  }
  return [];
}

class MockQueryBuilder {
  private tableName: string;
  private filters: Array<(item: any) => boolean> = [];
  private orderFn: ((a: any, b: any) => number) | null = null;
  private limitCount: number | null = null;
  private isSingle = false;
  private isMaybeSingle = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(_cols = "*") {
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((item) => item[column] !== value);
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((item) => values.includes(item[column]));
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    const asc = opts?.ascending ?? true;
    this.orderFn = (a, b) => {
      const va = a[column];
      const vb = b[column];
      if (va < vb) return asc ? -1 : 1;
      if (va > vb) return asc ? 1 : -1;
      return 0;
    };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async insert(data: any | any[]) {
    const rows = Array.isArray(data) ? data : [data];
    const table = getStoredTable(this.tableName);
    const created: any[] = [];
    for (const r of rows) {
      const newRow = {
        id: r.id || `${this.tableName}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...r,
      };
      table.unshift(newRow);
      created.push(newRow);
    }
    saveStoredTable(this.tableName, table);
    return { data: Array.isArray(data) ? created : created[0], error: null };
  }

  async update(updates: any) {
    const table = getStoredTable(this.tableName);
    let updatedRows: any[] = [];
    const newTable = table.map((item) => {
      const match = this.filters.every((fn) => fn(item));
      if (match) {
        const u = { ...item, ...updates, updated_at: new Date().toISOString() };
        updatedRows.push(u);
        return u;
      }
      return item;
    });
    saveStoredTable(this.tableName, newTable);
    return { data: updatedRows, error: null };
  }

  async delete() {
    const table = getStoredTable(this.tableName);
    const remaining = table.filter((item) => !this.filters.every((fn) => fn(item)));
    saveStoredTable(this.tableName, remaining);
    return { data: null, error: null };
  }

  async upsert(data: any | any[]) {
    return this.insert(data);
  }

  // Promise-like resolution
  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    const table = getStoredTable(this.tableName);
    let result = table.filter((item) => this.filters.every((fn) => fn(item)));
    if (this.orderFn) {
      result.sort(this.orderFn);
    }
    if (this.limitCount !== null) {
      result = result.slice(0, this.limitCount);
    }
    let dataResult: any = result;
    if (this.isSingle) {
      dataResult = result[0] ?? null;
    } else if (this.isMaybeSingle) {
      dataResult = result[0] ?? null;
    }
    return Promise.resolve({ data: dataResult, error: null }).then(onfulfilled, onrejected);
  }
}

const authListeners = new Set<(event: string, session: any) => void>();

let currentMockUser: MockUser | null = {
  id: DEMO_USER_ID,
  email: "demo@nova.ai",
  user_metadata: { full_name: "Nova Explorer" },
};

export function createMockSupabaseClient(): any {
  return {
    auth: {
      async getSession() {
        const session = currentMockUser
          ? {
              user: currentMockUser,
              access_token: "mock-token",
              refresh_token: "mock-refresh",
              expires_in: 3600,
            }
          : null;
        return { data: { session }, error: null };
      },
      onAuthStateChange(callback: (event: string, session: any) => void) {
        authListeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => authListeners.delete(callback),
            },
          },
        };
      },
      async signInWithPassword({ email }: { email: string }) {
        currentMockUser = {
          id: DEMO_USER_ID,
          email: email || "demo@nova.ai",
          user_metadata: { full_name: email.split("@")[0] || "Nova Explorer" },
        };
        const session = { user: currentMockUser, access_token: "mock-token" };
        authListeners.forEach((l) => l("SIGNED_IN", session));
        return { data: { user: currentMockUser, session }, error: null };
      },
      async signUp({ email, options }: any) {
        currentMockUser = {
          id: DEMO_USER_ID,
          email: email || "demo@nova.ai",
          user_metadata: { full_name: options?.data?.full_name || "Nova Explorer" },
        };
        const session = { user: currentMockUser, access_token: "mock-token" };
        authListeners.forEach((l) => l("SIGNED_IN", session));
        return { data: { user: currentMockUser, session }, error: null };
      },
      async signOut() {
        currentMockUser = null;
        authListeners.forEach((l) => l("SIGNED_OUT", null));
        return { error: null };
      },
    },
    from(tableName: string) {
      return new MockQueryBuilder(tableName);
    },
  };
}
