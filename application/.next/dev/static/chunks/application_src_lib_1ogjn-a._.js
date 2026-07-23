(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/application/src/lib/api-client.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "accountsApi",
    ()=>accountsApi,
    "alkansyaApi",
    ()=>alkansyaApi,
    "authApi",
    ()=>authApi,
    "backendApiBasePath",
    ()=>backendApiBasePath,
    "creditCardPaymentsApi",
    ()=>creditCardPaymentsApi,
    "dashboardApi",
    ()=>dashboardApi,
    "expenseCategoriesApi",
    ()=>expenseCategoriesApi,
    "expenseSchedulerApi",
    ()=>expenseSchedulerApi,
    "expensesApi",
    ()=>expensesApi,
    "financeApi",
    ()=>financeApi,
    "getAuthToken",
    ()=>getAuthToken,
    "incomeCategoriesApi",
    ()=>incomeCategoriesApi,
    "incomesApi",
    ()=>incomesApi,
    "monthlyMonitoringApi",
    ()=>monthlyMonitoringApi,
    "preferencesApi",
    ()=>preferencesApi,
    "receivablesApi",
    ()=>receivablesApi,
    "requestBackend",
    ()=>requestBackend,
    "setAuthToken",
    ()=>setAuthToken,
    "syncApi",
    ()=>syncApi,
    "transactionsApi",
    ()=>transactionsApi,
    "transfersApi",
    ()=>transfersApi,
    "userNotionConfigApi",
    ()=>userNotionConfigApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/application/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const backendApiBasePath = __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_BACKEND_API_BASE_PATH ?? "/api/v1";
let authToken = null;
function setAuthToken(t) {
    authToken = t;
}
function getAuthToken() {
    return authToken;
}
async function requestBackend(endpoint, init) {
    const headers = {
        "content-type": "application/json",
        ...init?.headers
    };
    if (authToken) {
        headers.authorization = `Bearer ${authToken}`;
    }
    const response = await fetch(`${backendApiBasePath}${endpoint}`, {
        ...init,
        headers
    });
    // A 401 means the session is invalid/expired. Clear it and bounce to login
    // so a stale token never silently fails a write while GET requests keep
    // working via the backend's shared fallback.
    if (response.status === 401 && ("TURBOPACK compile-time value", "object") !== "undefined") {
        authToken = null;
        try {
            localStorage.removeItem("nf_token");
        } catch  {
        // ignore
        }
        const path = window.location.pathname;
        if (path !== "/login" && path !== "/register") {
            window.location.href = "/login?session=expired";
        }
    }
    const payload = await response.json();
    if (!response.ok && payload.success) {
        return {
            success: false,
            error: {
                code: "UNEXPECTED_RESPONSE",
                message: "The backend returned an unsuccessful HTTP status with a success payload."
            }
        };
    }
    return payload;
}
const accountsApi = {
    list (params) {
        const query = params?.includeInactive ? "?includeInactive=true" : "";
        return requestBackend(`/accounts${query}`);
    },
    detail (id) {
        return requestBackend(`/accounts/${encodeURIComponent(id)}`);
    }
};
const incomeCategoriesApi = {
    list (params) {
        const query = params?.normalOnly ? "?normalOnly=true" : "";
        return requestBackend(`/income-categories${query}`);
    },
    detail (id) {
        return requestBackend(`/income-categories/${encodeURIComponent(id)}`);
    }
};
const expenseCategoriesApi = {
    list () {
        return requestBackend("/expense-categories");
    },
    detail (id) {
        return requestBackend(`/expense-categories/${encodeURIComponent(id)}`);
    }
};
const incomesApi = {
    list (params) {
        const query = buildQueryString(params);
        return requestBackend(`/incomes${query}`);
    },
    detail (id) {
        return requestBackend(`/incomes/${encodeURIComponent(id)}`);
    },
    create (body) {
        return requestBackend("/incomes", {
            method: "POST",
            body: JSON.stringify(body)
        });
    },
    update (id, body) {
        return requestBackend(`/incomes/${encodeURIComponent(id)}`, {
            method: "PATCH",
            body: JSON.stringify(body)
        });
    },
    delete (id) {
        return requestBackend(`/incomes/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });
    }
};
const expensesApi = {
    list (params) {
        const query = buildQueryString(params);
        return requestBackend(`/expenses${query}`);
    },
    detail (id) {
        return requestBackend(`/expenses/${encodeURIComponent(id)}`);
    },
    create (body) {
        return requestBackend("/expenses", {
            method: "POST",
            body: JSON.stringify(body)
        });
    },
    update (id, body) {
        return requestBackend(`/expenses/${encodeURIComponent(id)}`, {
            method: "PATCH",
            body: JSON.stringify(body)
        });
    },
    delete (id) {
        return requestBackend(`/expenses/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });
    }
};
function workflowApi(path) {
    return {
        list (params) {
            return requestBackend(`${path}${buildQueryString(params)}`);
        },
        detail (id) {
            return requestBackend(`${path}/${encodeURIComponent(id)}`);
        },
        create (body) {
            return requestBackend(path, {
                method: "POST",
                body: JSON.stringify(body)
            });
        },
        update (id, body) {
            return requestBackend(`${path}/${encodeURIComponent(id)}`, {
                method: "PATCH",
                body: JSON.stringify(body)
            });
        },
        delete (id) {
            return requestBackend(`${path}/${encodeURIComponent(id)}`, {
                method: "DELETE"
            });
        }
    };
}
const transactionsApi = workflowApi("/transactions");
const transfersApi = workflowApi("/transfers");
const creditCardPaymentsApi = workflowApi("/credit-card-payments");
const alkansyaApi = workflowApi("/alkansya");
const receivablesApi = workflowApi("/receivables");
const monthlyMonitoringApi = {
    list (month) {
        const query = month ? `?month=${encodeURIComponent(month)}` : "";
        return requestBackend(`/monthly-monitoring${query}`);
    }
};
const dashboardApi = {
    summary (month) {
        return requestBackend(`/dashboard/summary?month=${encodeURIComponent(month)}`);
    }
};
const expenseSchedulerApi = {
    list () {
        return requestBackend("/expense-scheduler");
    }
};
const syncApi = {
    status () {
        return requestBackend("/sync/status");
    },
    schemaStatus () {
        return requestBackend("/system/schema-status");
    },
    pullLatest (options) {
        return requestBackend("/sync/pull", {
            method: "POST",
            body: JSON.stringify(options)
        });
    },
    commit (body) {
        return requestBackend("/sync/commit", {
            method: "POST",
            body: JSON.stringify(body)
        });
    }
};
const authApi = {
    login (body) {
        return requestBackend("/auth/login", {
            method: "POST",
            body: JSON.stringify(body)
        });
    },
    register (body) {
        return requestBackend("/auth/register", {
            method: "POST",
            body: JSON.stringify(body)
        });
    },
    google (token) {
        return requestBackend("/auth/google", {
            method: "POST",
            body: JSON.stringify({
                token
            })
        });
    },
    logout () {
        return requestBackend("/auth/logout", {
            method: "POST"
        });
    },
    me () {
        return requestBackend("/auth/me");
    },
    changeEmail (body) {
        return requestBackend("/auth/email", {
            method: "PATCH",
            body: JSON.stringify(body)
        });
    },
    changePassword (body) {
        return requestBackend("/auth/password", {
            method: "PATCH",
            body: JSON.stringify(body)
        });
    },
    deleteAccount (body) {
        return requestBackend("/auth/account", {
            method: "DELETE",
            body: JSON.stringify(body)
        });
    }
};
const preferencesApi = {
    get () {
        return requestBackend("/user/preferences");
    },
    save (body) {
        return requestBackend("/user/preferences", {
            method: "PUT",
            body: JSON.stringify(body)
        });
    }
};
const userNotionConfigApi = {
    get () {
        return requestBackend("/user/notion-config");
    },
    save (body) {
        return requestBackend("/user/notion-config", {
            method: "PUT",
            body: JSON.stringify(body)
        });
    },
    remove () {
        return requestBackend("/user/notion-config", {
            method: "DELETE"
        });
    }
};
// ── Utility ───────────────────────────────────────────────────────────
function buildQueryString(params) {
    if (!params) {
        return "";
    }
    const entries = Object.entries(params).filter(([, value])=>value !== undefined && value !== "");
    if (entries.length === 0) {
        return "";
    }
    return `?${entries.map(([key, value])=>`${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&")}`;
}
const financeApi = {
    dashboardSummary (month) {
        return dashboardApi.summary(month);
    },
    syncStatus () {
        return syncApi.status();
    },
    schemaStatus () {
        return syncApi.schemaStatus();
    },
    pullLatest (options) {
        return syncApi.pullLatest(options);
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/application/src/lib/auth-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/src/lib/api-client.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
/** Best-effort user reconstruction from a JWT payload (no verification). */ function decodeUserFromToken(token) {
    try {
        const part = token.split(".")[1];
        const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
        const payload = JSON.parse(json);
        if (!payload.id || !payload.email) return null;
        return {
            id: payload.id,
            email: payload.email,
            name: payload.email.split("@")[0]
        };
    } catch  {
        return null;
    }
}
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            const saved = localStorage.getItem("nf_token");
            if (saved) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setAuthToken"])(saved);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requestBackend"])("/auth/me", {
                    headers: {
                        authorization: `Bearer ${saved}`
                    }
                }).then({
                    "AuthProvider.useEffect": (res)=>{
                        if (res.success) {
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["startTransition"])({
                                "AuthProvider.useEffect": ()=>setUser(res.data)
                            }["AuthProvider.useEffect"]);
                        }
                    // A definitive 401 is handled centrally by requestBackend (it clears
                    // the token and redirects to /login), so nothing to do here.
                    }
                }["AuthProvider.useEffect"]).catch({
                    "AuthProvider.useEffect": ()=>{
                        // Transient/network error (e.g. backend restarting) — keep the saved
                        // token and optimistically restore the user from it, so a blip does
                        // not silently sign the user out.
                        const optimistic = decodeUserFromToken(saved);
                        if (optimistic) {
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["startTransition"])({
                                "AuthProvider.useEffect": ()=>setUser(optimistic)
                            }["AuthProvider.useEffect"]);
                        }
                    }
                }["AuthProvider.useEffect"]).finally({
                    "AuthProvider.useEffect": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["startTransition"])({
                            "AuthProvider.useEffect": ()=>setLoading(false)
                        }["AuthProvider.useEffect"])
                }["AuthProvider.useEffect"]);
            } else {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["startTransition"])({
                    "AuthProvider.useEffect": ()=>setLoading(false)
                }["AuthProvider.useEffect"]);
            }
        }
    }["AuthProvider.useEffect"], []);
    const login = async (email, password)=>{
        const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requestBackend"])("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email,
                password
            })
        });
        if (!res.success) {
            return {
                ok: false,
                error: res.error.message
            };
        }
        localStorage.setItem("nf_token", res.data.accessToken);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setAuthToken"])(res.data.accessToken);
        setUser(res.data.user);
        return {
            ok: true
        };
    };
    const register = async (email, password, name)=>{
        const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requestBackend"])("/auth/register", {
            method: "POST",
            body: JSON.stringify({
                email,
                password,
                name
            })
        });
        if (!res.success) {
            return {
                ok: false,
                error: res.error.message
            };
        }
        localStorage.setItem("nf_token", res.data.accessToken);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setAuthToken"])(res.data.accessToken);
        setUser(res.data.user);
        return {
            ok: true
        };
    };
    const logout = async ()=>{
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requestBackend"])("/auth/logout", {
                method: "POST"
            });
        } catch  {
        // Ignore errors
        }
        localStorage.removeItem("nf_token");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setAuthToken"])(null);
        setUser(null);
    };
    const changeEmail = async (currentPassword, newEmail)=>{
        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authApi"].changeEmail({
            currentPassword,
            newEmail
        });
        if (!res.success) return {
            ok: false,
            error: res.error.message
        };
        // A fresh token carrying the new email is returned — persist it.
        localStorage.setItem("nf_token", res.data.accessToken);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setAuthToken"])(res.data.accessToken);
        setUser(res.data.user);
        return {
            ok: true
        };
    };
    const changePassword = async (currentPassword, newPassword)=>{
        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authApi"].changePassword({
            currentPassword,
            newPassword
        });
        if (!res.success) return {
            ok: false,
            error: res.error.message
        };
        return {
            ok: true
        };
    };
    const deleteAccount = async (currentPassword)=>{
        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authApi"].deleteAccount({
            currentPassword
        });
        if (!res.success) return {
            ok: false,
            error: res.error.message
        };
        localStorage.removeItem("nf_token");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setAuthToken"])(null);
        setUser(null);
        return {
            ok: true
        };
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            loading,
            login,
            register,
            logout,
            changeEmail,
            changePassword,
            deleteAccount
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/application/src/lib/auth-context.tsx",
        lineNumber: 139,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "NiO5z6JIqzX62LS5UWDgIqbZYyY=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
_s1(useAuth, "/dMy7t63NXD4eYACoT93CePwGrg=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/application/src/lib/theme-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeProvider",
    ()=>ThemeProvider,
    "useTheme",
    ()=>useTheme
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
const ThemeContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
const STORAGE_KEY = "nf_theme";
const DEFAULTS = {
    mode: "system",
    primaryColor: "#5b6cf9",
    secondaryColor: "#0d9488"
};
function loadTheme() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULTS;
        const parsed = JSON.parse(raw);
        return {
            ...DEFAULTS,
            ...parsed
        };
    } catch  {
        return DEFAULTS;
    }
}
function saveTheme(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch  {
    /* storage full or unavailable */ }
}
function resolveEffectiveMode(mode) {
    if (mode !== "system") return mode;
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function ThemeProvider({ children }) {
    _s();
    const [stored, setStored] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(DEFAULTS);
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Load from localStorage on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeProvider.useEffect": ()=>{
            setStored(loadTheme());
            setMounted(true);
        }
    }["ThemeProvider.useEffect"], []);
    // Apply data-theme attribute and CSS custom properties
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeProvider.useEffect": ()=>{
            if (!mounted) return;
            const effective = resolveEffectiveMode(stored.mode);
            document.documentElement.setAttribute("data-theme", effective);
            document.documentElement.style.setProperty("--blue", stored.primaryColor);
            document.documentElement.style.setProperty("--green", stored.secondaryColor);
            document.documentElement.style.setProperty("--focus", `${stored.primaryColor}47`); // 28% opacity hex
        }
    }["ThemeProvider.useEffect"], [
        stored,
        mounted
    ]);
    // Listen for system color scheme changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeProvider.useEffect": ()=>{
            if (stored.mode !== "system") return;
            const mq = window.matchMedia("(prefers-color-scheme: dark)");
            const handler = {
                "ThemeProvider.useEffect.handler": ()=>{
                    const effective = resolveEffectiveMode("system");
                    document.documentElement.setAttribute("data-theme", effective);
                }
            }["ThemeProvider.useEffect.handler"];
            mq.addEventListener("change", handler);
            return ({
                "ThemeProvider.useEffect": ()=>mq.removeEventListener("change", handler)
            })["ThemeProvider.useEffect"];
        }
    }["ThemeProvider.useEffect"], [
        stored.mode
    ]);
    const setMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ThemeProvider.useCallback[setMode]": (mode)=>{
            setStored({
                "ThemeProvider.useCallback[setMode]": (prev)=>{
                    const next = {
                        ...prev,
                        mode
                    };
                    saveTheme(next);
                    return next;
                }
            }["ThemeProvider.useCallback[setMode]"]);
        }
    }["ThemeProvider.useCallback[setMode]"], []);
    const setPrimaryColor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ThemeProvider.useCallback[setPrimaryColor]": (color)=>{
            setStored({
                "ThemeProvider.useCallback[setPrimaryColor]": (prev)=>{
                    const next = {
                        ...prev,
                        primaryColor: color
                    };
                    saveTheme(next);
                    return next;
                }
            }["ThemeProvider.useCallback[setPrimaryColor]"]);
        }
    }["ThemeProvider.useCallback[setPrimaryColor]"], []);
    const setSecondaryColor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ThemeProvider.useCallback[setSecondaryColor]": (color)=>{
            setStored({
                "ThemeProvider.useCallback[setSecondaryColor]": (prev)=>{
                    const next = {
                        ...prev,
                        secondaryColor: color
                    };
                    saveTheme(next);
                    return next;
                }
            }["ThemeProvider.useCallback[setSecondaryColor]"]);
        }
    }["ThemeProvider.useCallback[setSecondaryColor]"], []);
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ThemeProvider.useMemo[value]": ()=>({
                mode: stored.mode,
                primaryColor: stored.primaryColor,
                secondaryColor: stored.secondaryColor,
                setMode,
                setPrimaryColor,
                setSecondaryColor
            })
    }["ThemeProvider.useMemo[value]"], [
        stored,
        setMode,
        setPrimaryColor,
        setSecondaryColor
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ThemeContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/application/src/lib/theme-context.tsx",
        lineNumber: 126,
        columnNumber: 10
    }, this);
}
_s(ThemeProvider, "oLzwgyBctY/nUJi8aoHjJ4wsLkQ=");
_c = ThemeProvider;
function useTheme() {
    _s1();
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}
_s1(useTheme, "/dMy7t63NXD4eYACoT93CePwGrg=");
var _c;
__turbopack_context__.k.register(_c, "ThemeProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=application_src_lib_1ogjn-a._.js.map