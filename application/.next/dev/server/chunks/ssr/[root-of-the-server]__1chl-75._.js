module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/application/src/lib/api-client.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
const backendApiBasePath = process.env.NEXT_PUBLIC_BACKEND_API_BASE_PATH ?? "/api/v1";
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
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
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
}),
"[project]/application/src/lib/auth-context.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/src/lib/api-client.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
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
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const saved = localStorage.getItem("nf_token");
        if (saved) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setAuthToken"])(saved);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["requestBackend"])("/auth/me", {
                headers: {
                    authorization: `Bearer ${saved}`
                }
            }).then((res)=>{
                if (res.success) {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["startTransition"])(()=>setUser(res.data));
                }
            // A definitive 401 is handled centrally by requestBackend (it clears
            // the token and redirects to /login), so nothing to do here.
            }).catch(()=>{
                // Transient/network error (e.g. backend restarting) — keep the saved
                // token and optimistically restore the user from it, so a blip does
                // not silently sign the user out.
                const optimistic = decodeUserFromToken(saved);
                if (optimistic) {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["startTransition"])(()=>setUser(optimistic));
                }
            }).finally(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["startTransition"])(()=>setLoading(false)));
        } else {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["startTransition"])(()=>setLoading(false));
        }
    }, []);
    const login = async (email, password)=>{
        const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["requestBackend"])("/auth/login", {
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
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setAuthToken"])(res.data.accessToken);
        setUser(res.data.user);
        return {
            ok: true
        };
    };
    const register = async (email, password, name)=>{
        const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["requestBackend"])("/auth/register", {
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
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setAuthToken"])(res.data.accessToken);
        setUser(res.data.user);
        return {
            ok: true
        };
    };
    const logout = async ()=>{
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["requestBackend"])("/auth/logout", {
                method: "POST"
            });
        } catch  {
        // Ignore errors
        }
        localStorage.removeItem("nf_token");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setAuthToken"])(null);
        setUser(null);
    };
    const changeEmail = async (currentPassword, newEmail)=>{
        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authApi"].changeEmail({
            currentPassword,
            newEmail
        });
        if (!res.success) return {
            ok: false,
            error: res.error.message
        };
        // A fresh token carrying the new email is returned — persist it.
        localStorage.setItem("nf_token", res.data.accessToken);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setAuthToken"])(res.data.accessToken);
        setUser(res.data.user);
        return {
            ok: true
        };
    };
    const changePassword = async (currentPassword, newPassword)=>{
        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authApi"].changePassword({
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
        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authApi"].deleteAccount({
            currentPassword
        });
        if (!res.success) return {
            ok: false,
            error: res.error.message
        };
        localStorage.removeItem("nf_token");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setAuthToken"])(null);
        setUser(null);
        return {
            ok: true
        };
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
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
function useAuth() {
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/dynamic-access-async-storage.external.js [external] (next/dist/server/app-render/dynamic-access-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/dynamic-access-async-storage.external.js", () => require("next/dist/server/app-render/dynamic-access-async-storage.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1chl-75._.js.map