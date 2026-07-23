module.exports = [
"[project]/application/src/components/color-picker.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ColorPicker",
    ()=>ColorPicker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-dom.js [app-ssr] (ecmascript)");
"use client";
;
;
;
const PRESET_SWATCHES = [
    // Blues
    "#5b6cf9",
    "#3b82f6",
    "#2563eb",
    "#1d4ed8",
    "#1e40af",
    // Greens
    "#0d9488",
    "#10b981",
    "#059669",
    "#047857",
    "#065f46",
    // Purples
    "#7c3aed",
    "#8b5cf6",
    "#a78bfa",
    "#6d28d9",
    "#5b21b6",
    // Roses
    "#e11d48",
    "#f43f5e",
    "#fb7185",
    "#be123c",
    "#9f1239",
    // Ambers
    "#d97706",
    "#f59e0b",
    "#fbbf24",
    "#b45309",
    "#92400e",
    // Neutrals
    "#1c1917",
    "#44403c",
    "#79716b",
    "#a8a29e",
    "#d6d3d1"
];
const MODE_TABS = [
    {
        key: "swatches",
        label: "Swatches"
    },
    {
        key: "wheel",
        label: "Wheel"
    }
];
function ColorPicker({ value, onChange }) {
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("swatches");
    const backdropRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Close on outside click (scoped to backdrop element)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!open) return;
        function handle(e) {
            if (backdropRef.current && !backdropRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handle);
        return ()=>document.removeEventListener("mousedown", handle);
    }, [
        open
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "color-picker",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: `color-picker__trigger ${open ? "color-picker__trigger--open" : ""}`,
                onClick: ()=>setOpen((prev)=>!prev),
                "aria-label": "Choose color",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "color-picker__trigger-swatch",
                        style: {
                            background: value
                        }
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/color-picker.tsx",
                        lineNumber: 60,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "color-picker__trigger-hex",
                        children: value
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/color-picker.tsx",
                        lineNumber: 61,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/color-picker.tsx",
                lineNumber: 54,
                columnNumber: 7
            }, this),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createPortal"])(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: backdropRef,
                className: "color-picker__backdrop",
                onClick: (e)=>{
                    if (e.target === e.currentTarget) setOpen(false);
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "color-picker__panel",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "color-picker__tabs",
                            children: MODE_TABS.map((tab)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: `color-picker__tab ${mode === tab.key ? "color-picker__tab--active" : ""}`,
                                    onClick: ()=>setMode(tab.key),
                                    children: tab.label
                                }, tab.key, false, {
                                    fileName: "[project]/application/src/components/color-picker.tsx",
                                    lineNumber: 78,
                                    columnNumber: 19
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/color-picker.tsx",
                            lineNumber: 76,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "color-picker__body",
                            children: [
                                mode === "swatches" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "color-picker__swatches",
                                    children: PRESET_SWATCHES.map((swatch)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            className: `color-picker__swatch-btn ${value === swatch ? "color-picker__swatch-btn--active" : ""}`,
                                            style: {
                                                background: swatch
                                            },
                                            onClick: ()=>{
                                                onChange(swatch);
                                                setOpen(false);
                                            },
                                            "aria-label": swatch
                                        }, swatch, false, {
                                            fileName: "[project]/application/src/components/color-picker.tsx",
                                            lineNumber: 94,
                                            columnNumber: 23
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/color-picker.tsx",
                                    lineNumber: 92,
                                    columnNumber: 19
                                }, this),
                                mode === "wheel" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "color-picker__wheel",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "color",
                                        className: "color-picker__native",
                                        value: value,
                                        onChange: (e)=>onChange(e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/color-picker.tsx",
                                        lineNumber: 111,
                                        columnNumber: 21
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/color-picker.tsx",
                                    lineNumber: 110,
                                    columnNumber: 19
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/color-picker.tsx",
                            lineNumber: 90,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/color-picker.tsx",
                    lineNumber: 74,
                    columnNumber: 13
                }, this)
            }, void 0, false, {
                fileName: "[project]/application/src/components/color-picker.tsx",
                lineNumber: 67,
                columnNumber: 11
            }, this), document.body)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/color-picker.tsx",
        lineNumber: 52,
        columnNumber: 5
    }, this);
}
}),
"[project]/application/src/lib/fab-export-context.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FabExportProvider",
    ()=>FabExportProvider,
    "useFabExport",
    ()=>useFabExport,
    "useFabRegister",
    ()=>useFabRegister
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
const FabRegisterContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
const FabDataContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
function FabExportProvider({ children }) {
    const [receipt, setReceipt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [insight, setInsight] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Setters are referentially stable, so registrant pages never re-render from
    // context — that avoids a set → re-render → recompute → set feedback loop.
    const register = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
            setReceipt,
            setInsight
        }), []);
    const data = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
            receipt,
            insight
        }), [
        receipt,
        insight
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FabRegisterContext.Provider, {
        value: register,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FabDataContext.Provider, {
            value: data,
            children: children
        }, void 0, false, {
            fileName: "[project]/application/src/lib/fab-export-context.tsx",
            lineNumber: 76,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/lib/fab-export-context.tsx",
        lineNumber: 75,
        columnNumber: 5
    }, this);
}
function useFabRegister() {
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(FabRegisterContext);
    if (!ctx) {
        throw new Error("useFabRegister must be used within a FabExportProvider");
    }
    return ctx;
}
function useFabExport() {
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(FabDataContext);
    if (!ctx) {
        throw new Error("useFabExport must be used within a FabExportProvider");
    }
    return ctx;
}
}),
"[project]/application/src/lib/export-node.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SHOT_HIDE_CLASS",
    ()=>SHOT_HIDE_CLASS,
    "downloadNodeAsPng",
    ()=>downloadNodeAsPng,
    "nodeToPngDataUrl",
    ()=>nodeToPngDataUrl,
    "printNode",
    ()=>printNode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$html$2d$to$2d$image$2f$es$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/html-to-image/es/index.js [app-ssr] (ecmascript)");
;
const SHOT_HIDE_CLASS = "fab-shot-hide";
function shouldKeepNode(node) {
    if (node.nodeType !== 1) return true;
    if (node.classList?.contains(SHOT_HIDE_CLASS)) return false;
    return true;
}
async function nodeToPngDataUrl(node) {
    if (typeof document !== "undefined" && document.fonts?.ready) {
        try {
            await document.fonts.ready;
        } catch  {
        /* fonts API unavailable — continue */ }
    }
    const options = {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
        // Capture the full laid-out size so nothing is clipped by scroll overflow.
        width: node.scrollWidth,
        height: node.scrollHeight,
        filter: shouldKeepNode
    };
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$html$2d$to$2d$image$2f$es$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toPng"])(node, options); // warm-up pass
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$html$2d$to$2d$image$2f$es$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toPng"])(node, options);
}
async function downloadNodeAsPng(node, filename) {
    const dataUrl = await nodeToPngDataUrl(node);
    const link = document.createElement("a");
    link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    link.href = dataUrl;
    link.click();
}
function printNode(node) {
    const printRoot = document.createElement("div");
    printRoot.className = "print-root";
    const clone = node.cloneNode(true);
    clone.removeAttribute("data-print-surface");
    printRoot.appendChild(clone);
    document.body.appendChild(printRoot);
    document.body.classList.add("is-printing");
    let done = false;
    const cleanup = ()=>{
        if (done) return;
        done = true;
        document.body.classList.remove("is-printing");
        printRoot.remove();
        window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    // Fallback in case afterprint never fires (e.g. print cancelled in some
    // browsers). Long enough not to yank the surface mid-dialog.
    window.setTimeout(cleanup, 60_000);
    window.print();
}
}),
"[project]/application/src/lib/finance-data.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "financeSections",
    ()=>financeSections,
    "getAccountName",
    ()=>getAccountName,
    "getAccountType",
    ()=>getAccountType,
    "getActiveSectionLabel",
    ()=>getActiveSectionLabel,
    "getExpenseCategoryName",
    ()=>getExpenseCategoryName,
    "getIncomeCategoryName",
    ()=>getIncomeCategoryName,
    "getSectionById",
    ()=>getSectionById,
    "months",
    ()=>months
]);
const financeSections = [
    {
        id: "dashboard",
        label: "Dashboard",
        group: "primary"
    },
    {
        id: "accounts",
        label: "Accounts",
        group: "primary"
    },
    {
        id: "income",
        label: "Income",
        group: "primary"
    },
    {
        id: "expense",
        label: "Expense",
        group: "primary"
    },
    {
        id: "monthly-monitoring",
        label: "Monthly Monitoring",
        shortLabel: "Monitoring",
        group: "primary"
    },
    {
        id: "transfer",
        label: "Transfer",
        group: "workflow"
    },
    {
        id: "credit-card-payment",
        label: "Credit Card Payment",
        shortLabel: "CC Payment",
        group: "workflow"
    },
    {
        id: "alkansya",
        label: "Alkansya",
        group: "workflow"
    },
    {
        id: "receivables",
        label: "Receivables",
        group: "workflow"
    },
    {
        id: "sync",
        label: "Sync Center",
        shortLabel: "Sync",
        group: "system"
    },
    {
        id: "settings",
        label: "Settings",
        group: "system"
    }
];
function getSectionById(section) {
    return financeSections.find((item)=>item.id === section);
}
const months = [
    "2026-01",
    "2026-02",
    "2026-03",
    "2026-04",
    "2026-05",
    "2026-06",
    "2026-07"
];
function getAccountName(id) {
    return id ?? "—";
}
function getAccountType(id) {
    return id ?? "Cash";
}
function getIncomeCategoryName(id) {
    return id ?? "—";
}
function getExpenseCategoryName(id) {
    return id ?? "—";
}
function getActiveSectionLabel(id) {
    return financeSections.find((section)=>section.id === id)?.label ?? "Dashboard";
}
}),
"[project]/application/src/lib/use-data.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAccount",
    ()=>useAccount,
    "useAccounts",
    ()=>useAccounts,
    "useAlkansya",
    ()=>useAlkansya,
    "useApiData",
    ()=>useApiData,
    "useCreditCardPayments",
    ()=>useCreditCardPayments,
    "useDashboardData",
    ()=>useDashboardData,
    "useExpenseCategories",
    ()=>useExpenseCategories,
    "useExpenseScheduler",
    ()=>useExpenseScheduler,
    "useExpenses",
    ()=>useExpenses,
    "useIncomeCategories",
    ()=>useIncomeCategories,
    "useIncomes",
    ()=>useIncomes,
    "useMonthlyMonitoring",
    ()=>useMonthlyMonitoring,
    "useReceivables",
    ()=>useReceivables,
    "useSchemaStatus",
    ()=>useSchemaStatus,
    "useSyncStatus",
    ()=>useSyncStatus,
    "useTransfers",
    ()=>useTransfers,
    "useWorkflowRecords",
    ()=>useWorkflowRecords
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/src/lib/auth-context.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/src/lib/api-client.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function useApiData(fetcher, fallback, /**
   * Serialized query key. When it changes the data is refetched — this is what
   * makes month/view-mode switches issue a fresh query instead of showing the
   * initial (stale) result forever.
   */ key) {
    const { user, loading: authLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        status: "loading"
    });
    const fetcherRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(fetcher);
    // eslint-disable-next-line react-hooks/refs
    fetcherRef.current = fetcher;
    const fallbackRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(fallback);
    // eslint-disable-next-line react-hooks/refs
    fallbackRef.current = fallback;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Wait for AuthProvider to finish deciding whether the caller is
        // authenticated. If we fire the fetch before AuthProvider's own useEffect
        // populates api-client's module-level authToken, the Bearer header is
        // missing and every backend read returns empty (the per-user Notion
        // config never gets loaded server-side).
        if (authLoading) return;
        let cancelled = false;
        queueMicrotask(()=>{
            if (!cancelled) {
                setState({
                    status: "loading"
                });
            }
        });
        fetcherRef.current().then((result)=>{
            if (cancelled) return;
            if (result.success) {
                setState({
                    status: "success",
                    data: result.data
                });
            } else if (fallbackRef.current !== undefined) {
                setState({
                    status: "success",
                    data: fallbackRef.current
                });
            } else {
                setState({
                    status: "error",
                    error: result.error?.message ?? "Request failed"
                });
            }
        }).catch((err)=>{
            if (cancelled) return;
            if (fallbackRef.current !== undefined) {
                setState({
                    status: "success",
                    data: fallbackRef.current
                });
            } else {
                setState({
                    status: "error",
                    error: err instanceof Error ? err.message : "Network error"
                });
            }
        });
        return ()=>{
            cancelled = true;
        };
    }, [
        key,
        authLoading,
        user?.id
    ]);
    const refetch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        setState({
            status: "loading"
        });
        try {
            const result = await fetcherRef.current();
            if (result.success) {
                setState({
                    status: "success",
                    data: result.data
                });
            } else if (fallbackRef.current !== undefined) {
                setState({
                    status: "success",
                    data: fallbackRef.current
                });
            } else {
                setState({
                    status: "error",
                    error: result.error?.message ?? "Request failed"
                });
            }
        } catch (err) {
            if (fallbackRef.current !== undefined) {
                setState({
                    status: "success",
                    data: fallbackRef.current
                });
            } else {
                setState({
                    status: "error",
                    error: err instanceof Error ? err.message : "Network error"
                });
            }
        }
    }, []);
    return {
        state,
        refetch
    };
}
function useDashboardData(month) {
    return useApiData(()=>__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["dashboardApi"].summary(month));
}
function useAccounts(includeInactive = false) {
    return useApiData(()=>__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["accountsApi"].list({
            includeInactive
        }));
}
function useAccount(id) {
    return useApiData(()=>__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["accountsApi"].detail(id));
}
function useIncomeCategories(normalOnly = false) {
    return useApiData(()=>__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["incomeCategoriesApi"].list({
            normalOnly
        }));
}
function useExpenseCategories() {
    return useApiData(()=>__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["expenseCategoriesApi"].list());
}
function useIncomes(params) {
    const key = JSON.stringify(params ?? {});
    return useApiData(()=>__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["incomesApi"].list(params), undefined, key);
}
function useExpenses(params) {
    const key = JSON.stringify(params ?? {});
    return useApiData(()=>__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["expensesApi"].list(params), undefined, key);
}
function useTransfers(params) {
    return useApiData(()=>__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["transfersApi"].list(params));
}
function useCreditCardPayments(params) {
    return useApiData(()=>__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["creditCardPaymentsApi"].list(params));
}
function useAlkansya(params) {
    return useApiData(()=>__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["alkansyaApi"].list(params));
}
function useReceivables(params) {
    return useApiData(()=>__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["receivablesApi"].list(params));
}
const workflowApiBySection = {
    transfer: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["transfersApi"],
    "credit-card-payment": __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["creditCardPaymentsApi"],
    alkansya: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["alkansyaApi"],
    receivables: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["receivablesApi"]
};
function useWorkflowRecords(section, params) {
    const api = workflowApiBySection[section];
    const key = JSON.stringify({
        section,
        ...params ?? {}
    });
    return useApiData(()=>api.list(params), undefined, key);
}
function useSyncStatus() {
    return useApiData(()=>__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["syncApi"].status(), {
        lastSyncAt: null,
        state: "idle",
        pendingOperations: 0,
        failedOperations: 0
    });
}
function useSchemaStatus() {
    return useApiData(()=>__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["syncApi"].schemaStatus());
}
function useMonthlyMonitoring(month) {
    return useApiData(()=>__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["monthlyMonitoringApi"].list(month));
}
function useExpenseScheduler() {
    return useApiData(()=>__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["expenseSchedulerApi"].list());
}
}),
"[project]/application/src/lib/date-range.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "activeSelectorUnit",
    ()=>activeSelectorUnit,
    "anchorMonth",
    ()=>anchorMonth,
    "computeRange",
    ()=>computeRange,
    "expenseModeToUnit",
    ()=>expenseModeToUnit,
    "incomeModeToUnit",
    ()=>incomeModeToUnit,
    "rangeLabel",
    ()=>rangeLabel,
    "stepAnchor",
    ()=>stepAnchor,
    "todayIso",
    ()=>todayIso
]);
function todayIso() {
    const now = new Date();
    return isoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
function isoDate(y, m, d) {
    return `${y.toString().padStart(4, "0")}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
}
/** Parse a YYYY-MM-DD string into a UTC-noon Date (timezone-safe). */ function parse(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12));
}
function fmt(date) {
    return isoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}
function incomeModeToUnit(mode) {
    switch(mode){
        case "Daily":
            return "day";
        case "Weekly":
            return "week";
        case "Annually":
            return "year";
        case "Monthly":
        default:
            return "month";
    }
}
function expenseModeToUnit(mode) {
    switch(mode){
        case "Daily":
            return "day";
        case "Weekly":
            return "week";
        case "Monthly":
            return "month";
        case "Annually":
            return "year";
        default:
            return null;
    }
}
function computeRange(unit, anchorIso) {
    const d = parse(anchorIso);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    if (unit === "day") {
        return {
            start: anchorIso,
            end: anchorIso
        };
    }
    if (unit === "year") {
        return {
            start: isoDate(y, 1, 1),
            end: isoDate(y, 12, 31)
        };
    }
    if (unit === "month") {
        const end = new Date(Date.UTC(y, m + 1, 0, 12)); // last day of month
        return {
            start: isoDate(y, m + 1, 1),
            end: fmt(end)
        };
    }
    // week: Monday → Sunday containing the anchor
    const day = d.getUTCDay(); // 0=Sun … 6=Sat
    const mondayOffset = (day + 6) % 7;
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - mondayOffset);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    return {
        start: fmt(monday),
        end: fmt(sunday)
    };
}
function stepAnchor(unit, anchorIso, delta) {
    const d = parse(anchorIso);
    if (unit === "day") d.setUTCDate(d.getUTCDate() + delta);
    else if (unit === "week") d.setUTCDate(d.getUTCDate() + delta * 7);
    else if (unit === "month") d.setUTCMonth(d.getUTCMonth() + delta);
    else d.setUTCFullYear(d.getUTCFullYear() + delta);
    return fmt(d);
}
const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];
function rangeLabel(unit, anchorIso) {
    const d = parse(anchorIso);
    const y = d.getUTCFullYear();
    const monthName = MONTH_NAMES[d.getUTCMonth()];
    if (unit === "day") {
        return `${monthName} ${d.getUTCDate()}, ${y}`;
    }
    if (unit === "year") {
        return `${y}`;
    }
    if (unit === "month") {
        return `${monthName} ${y}`;
    }
    const { start, end } = computeRange("week", anchorIso);
    const s = parse(start);
    const e = parse(end);
    const sLabel = `${MONTH_NAMES[s.getUTCMonth()].slice(0, 3)} ${s.getUTCDate()}`;
    const eLabel = `${MONTH_NAMES[e.getUTCMonth()].slice(0, 3)} ${e.getUTCDate()}`;
    return `${sLabel} – ${eLabel}, ${y}`;
}
function anchorMonth(anchorIso) {
    return anchorIso.slice(0, 7);
}
function activeSelectorUnit(section, incomeViewMode, expenseViewMode) {
    switch(section){
        case "income":
            return incomeModeToUnit(incomeViewMode);
        case "expense":
            return expenseModeToUnit(expenseViewMode);
        case "dashboard":
        case "monthly-monitoring":
        case "transfer":
        case "credit-card-payment":
            return "month";
        // Alkansya (Savings) and Receivables are month-independent buckets, so
        // they show no date selector and query every matching record.
        case "alkansya":
        case "receivables":
            return null;
        default:
            return null;
    }
}
}),
"[project]/application/src/lib/finance-rules.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "auxiliaryIncomeCategoryLabels",
    ()=>auxiliaryIncomeCategoryLabels,
    "calculateCategoryTotalOverview",
    ()=>calculateCategoryTotalOverview,
    "calculateExpectedPaymentDate",
    ()=>calculateExpectedPaymentDate,
    "calculateGrossPrice",
    ()=>calculateGrossPrice,
    "calculateInstallmentAmount",
    ()=>calculateInstallmentAmount,
    "calculateNetIncome",
    ()=>calculateNetIncome,
    "calculatePaidAmount",
    ()=>calculatePaidAmount,
    "calculatePasabuyReceivedAmount",
    ()=>calculatePasabuyReceivedAmount,
    "calculatePasabuyerBalance",
    ()=>calculatePasabuyerBalance,
    "calculateRemainingBalance",
    ()=>calculateRemainingBalance,
    "calculateTotalCashFlow",
    ()=>calculateTotalCashFlow,
    "getExpenseConditionalSections",
    ()=>getExpenseConditionalSections,
    "getExpenseStatusFromDatePaid",
    ()=>getExpenseStatusFromDatePaid,
    "getMoneyValueTone",
    ()=>getMoneyValueTone,
    "getMonthKeyFromIsoDate",
    ()=>getMonthKeyFromIsoDate,
    "getNormalIncomeCategories",
    ()=>getNormalIncomeCategories,
    "getWorkflowFixedCategory",
    ()=>getWorkflowFixedCategory,
    "incomeTransactionOnlyFields",
    ()=>incomeTransactionOnlyFields,
    "isAuxiliaryIncomeCategory",
    ()=>isAuxiliaryIncomeCategory,
    "isCreditAccountExpense",
    ()=>isCreditAccountExpense,
    "isCreditLikeAccountType",
    ()=>isCreditLikeAccountType,
    "isExpenseRecordInViewScope",
    ()=>isExpenseRecordInViewScope,
    "isIncomeRecordInViewScope",
    ()=>isIncomeRecordInViewScope,
    "isMonthlyMonitoringEditable",
    ()=>isMonthlyMonitoringEditable,
    "isOutstandingExpense",
    ()=>isOutstandingExpense,
    "isPasabuyCategory",
    ()=>isPasabuyCategory,
    "isPasabuyCategoryName",
    ()=>isPasabuyCategoryName,
    "isUnpaidPasabuyExpense",
    ()=>isUnpaidPasabuyExpense,
    "normalIncomeFields",
    ()=>normalIncomeFields,
    "pasabuyStatusLabels",
    ()=>pasabuyStatusLabels,
    "pasabuyerLabels",
    ()=>pasabuyerLabels,
    "paymentFrequencyLabels",
    ()=>paymentFrequencyLabels,
    "paymentStatusLabels",
    ()=>paymentStatusLabels,
    "shouldShowCreditExpenseFields",
    ()=>shouldShowCreditExpenseFields,
    "shouldShowGlobalMonthSelector",
    ()=>shouldShowGlobalMonthSelector,
    "shouldShowPasabuyFields",
    ()=>shouldShowPasabuyFields,
    "transactionWorkflowCategories",
    ()=>transactionWorkflowCategories
]);
const normalIncomeFields = [
    "Name",
    "Date",
    "Gross Income",
    "Capital Expenditure",
    "Accounts",
    "Categories"
];
const incomeTransactionOnlyFields = [
    "Transacted Account",
    "CC Payment Covered"
];
const auxiliaryIncomeCategoryLabels = [
    "IOU",
    "Transfer",
    "Old Income Logger",
    "Credit Card Payment",
    "Debt Payment"
];
const paymentStatusLabels = [
    "Paid",
    "Unpaid",
    "Installment",
    "Cancelled"
];
const paymentFrequencyLabels = [
    "Daily",
    "Weekly",
    "Monthly",
    "Quarterly",
    "Annually"
];
const pasabuyerLabels = [
    "Shared",
    "Maimai",
    "Claire",
    "22-H"
];
const pasabuyStatusLabels = [
    "Payment not yet receive",
    "Payment partially received",
    "Payment partially received (installment)",
    "Payment fully received"
];
const transactionWorkflowCategories = {
    transfer: "Transfer",
    "credit-card-payment": "Credit Card Payment",
    alkansya: "Savings"
};
function isCreditLikeAccountType(type) {
    return type === "Credit Account" || type === "e-Credit" || type === "BNPL";
}
function calculateTotalCashFlow(accounts) {
    return roundMoney(accounts.filter((account)=>!account.inactive && !isCreditLikeAccountType(account.type)).reduce((sum, account)=>sum + account.currentBalance, 0));
}
function isAuxiliaryIncomeCategory(label) {
    return auxiliaryIncomeCategoryLabels.some((category)=>category.toLowerCase() === label.toLowerCase());
}
function getNormalIncomeCategories(categories) {
    return categories.filter((category)=>!isAuxiliaryIncomeCategory(category.source));
}
function shouldShowCreditExpenseFields(accountType) {
    return isCreditLikeAccountType(accountType);
}
function shouldShowPasabuyFields(viewMode, categoryName) {
    return viewMode === "Unpaid Pasabuy" || isPasabuyCategoryName(categoryName);
}
function getExpenseConditionalSections(options) {
    return {
        creditCard: shouldShowCreditExpenseFields(options.accountType),
        pasabuy: shouldShowPasabuyFields(options.viewMode, options.categoryName)
    };
}
function getWorkflowFixedCategory(section) {
    return transactionWorkflowCategories[section];
}
function isMonthlyMonitoringEditable(section) {
    return section !== "monthly-monitoring";
}
function calculateNetIncome(grossIncome, capitalExpenditure) {
    return roundMoney(grossIncome - capitalExpenditure);
}
function calculateCategoryTotalOverview(categorySpending, totalSpending) {
    if (totalSpending <= 0) {
        return 0;
    }
    return roundMoney(categorySpending / totalSpending * 100);
}
function calculateGrossPrice(expenseAmount, interest) {
    return roundMoney(expenseAmount + interest);
}
function calculateInstallmentAmount(options) {
    if (options.paymentStatus !== "Installment" || !options.periodCount || options.periodCount <= 0) {
        return null;
    }
    return roundMoney(options.grossPrice / options.periodCount);
}
function calculatePaidAmount(options) {
    if (options.paymentStatus === "Paid") {
        return roundMoney(options.grossPrice);
    }
    if (options.paymentStatus === "Installment" && options.installmentAmount && options.paidPeriod) {
        return roundMoney(options.installmentAmount * options.paidPeriod);
    }
    return 0;
}
function calculateRemainingBalance(grossPrice, paidAmount) {
    return roundMoney(Math.max(grossPrice - paidAmount, 0));
}
function calculatePasabuyReceivedAmount(options) {
    if (options.pasabuyStatus === "Payment fully received") {
        return roundMoney(options.grossPrice);
    }
    if (options.pasabuyStatus === "Payment partially received (installment)" && options.installmentAmount && options.pasabuyPaidPeriod) {
        return roundMoney(options.installmentAmount * options.pasabuyPaidPeriod);
    }
    if (options.pasabuyStatus === "Payment partially received" && options.periodCount && options.periodCount > 0 && options.pasabuyPaidPeriod) {
        return roundMoney(options.grossPrice / options.periodCount * options.pasabuyPaidPeriod);
    }
    return 0;
}
function calculatePasabuyerBalance(grossPrice, receivedAmount) {
    return calculateRemainingBalance(grossPrice, receivedAmount);
}
function calculateExpectedPaymentDate(options) {
    if (!options.purchaseDate || !options.billingDay || !options.dueDay) {
        return null;
    }
    const purchaseDate = parseIsoDate(options.purchaseDate);
    if (!purchaseDate) {
        return null;
    }
    const billingMonthOffset = purchaseDate.day <= options.billingDay ? 0 : 1;
    const billingMonthIndex = purchaseDate.monthIndex + billingMonthOffset;
    const dueMonthOffset = options.dueDay > options.billingDay ? 0 : 1;
    const dueDate = createClampedDate(purchaseDate.year, billingMonthIndex + dueMonthOffset, options.dueDay);
    return formatIsoDate(dueDate);
}
function getMoneyValueTone(value) {
    if (value > 0) {
        return "green";
    }
    if (value < 0) {
        return "rose";
    }
    return "ink";
}
function isPasabuyCategoryName(categoryName) {
    return categoryName.toLowerCase() === "pasabuy";
}
function isPasabuyCategory(category) {
    return category.auxiliary === "Yes" && isPasabuyCategoryName(category.name);
}
function isOutstandingExpense(record) {
    return record.datePaid === null || record.paymentStatus !== "Paid";
}
function shouldShowGlobalMonthSelector(options) {
    if (options.section === "accounts" || options.section === "sync" || options.section === "settings") {
        return false;
    }
    if (options.section === "income") {
        return options.incomeViewMode === "Monthly";
    }
    if (options.section === "expense") {
        return options.expenseViewMode === "Monthly";
    }
    return true;
}
function getMonthKeyFromIsoDate(value) {
    return value.slice(0, 7);
}
function isIncomeRecordInViewScope(record, viewMode, selectedMonth, referenceDate = new Date()) {
    return isIsoDateInViewScope(record.date, viewMode, selectedMonth, referenceDate);
}
function isExpenseRecordInViewScope(record, viewMode, selectedMonth, referenceDate = new Date()) {
    if (viewMode === "Daily" || viewMode === "Weekly" || viewMode === "Monthly") {
        return isIsoDateInViewScope(record.purchaseDate, viewMode, selectedMonth, referenceDate);
    }
    return true;
}
function getExpenseStatusFromDatePaid(datePaid) {
    return datePaid ? "paid" : "unpaid";
}
function isUnpaidPasabuyExpense(record, categoryName) {
    return isPasabuyCategoryName(categoryName) && (record.datePaid === null || record.pasabuyStatus !== "Payment fully received");
}
function isCreditAccountExpense(record, accounts) {
    const account = accounts.find((item)=>item.id === record.accountId);
    return account ? isCreditLikeAccountType(account.type) : false;
}
function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
function parseIsoDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
        return null;
    }
    return {
        year: Number(match[1]),
        monthIndex: Number(match[2]) - 1,
        day: Number(match[3])
    };
}
function createClampedDate(year, monthIndex, day) {
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    return new Date(year, monthIndex, Math.min(day, lastDay));
}
function formatIsoDate(date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
}
function isIsoDateInViewScope(value, viewMode, selectedMonth, referenceDate) {
    if (viewMode === "Monthly") {
        return getMonthKeyFromIsoDate(value) === selectedMonth;
    }
    if (viewMode === "Annually") {
        return value.slice(0, 4) === `${referenceDate.getFullYear()}`;
    }
    const date = parseDateObject(value);
    if (!date) {
        return false;
    }
    if (viewMode === "Daily") {
        return formatIsoDate(date) === formatIsoDate(referenceDate);
    }
    const startOfWeek = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
    const mondayOffset = (startOfWeek.getDay() + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return date >= startOfWeek && date <= endOfWeek;
}
function parseDateObject(value) {
    const parts = parseIsoDate(value);
    if (!parts) {
        return null;
    }
    return new Date(parts.year, parts.monthIndex, parts.day);
}
}),
"[project]/application/src/lib/format.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "formatDate",
    ()=>formatDate,
    "formatMoney",
    ()=>formatMoney,
    "formatPercent",
    ()=>formatPercent,
    "toYYMMDD",
    ()=>toYYMMDD
]);
const moneyFormatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2
});
const wholeMoneyFormatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0
});
const dateFormatter = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric"
});
function formatMoney(value, options) {
    if (options?.compact) {
        return wholeMoneyFormatter.format(value);
    }
    return moneyFormatter.format(value);
}
function formatDate(value) {
    if (!value) {
        return "—";
    }
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return "—";
    }
    return dateFormatter.format(parsed);
}
function formatPercent(value) {
    return `${value.toFixed(1)}%`;
}
function toYYMMDD(isoDate) {
    if (!isoDate) return null;
    const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    return `${match[1].slice(2)}${match[2]}${match[3]}`;
}
}),
"[project]/application/src/components/finance-workspace.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FinanceWorkspace",
    ()=>FinanceWorkspace
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/next/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/src/lib/auth-context.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$theme$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/src/lib/theme-context.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$components$2f$color$2d$picker$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/src/components/color-picker.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/src/lib/api-client.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$fab$2d$export$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/src/lib/fab-export-context.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$export$2d$node$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/src/lib/export-node.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/triangle-alert.mjs [app-ssr] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2d$left$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDownLeft$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/arrow-down-left.mjs [app-ssr] (ecmascript) <export default as ArrowDownLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/arrow-left.mjs [app-ssr] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpRight$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/arrow-up-right.mjs [app-ssr] (ecmascript) <export default as ArrowUpRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpDown$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/arrow-up-down.mjs [app-ssr] (ecmascript) <export default as ArrowUpDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$banknote$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Banknote$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/banknote.mjs [app-ssr] (ecmascript) <export default as Banknote>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/building-2.mjs [app-ssr] (ecmascript) <export default as Building2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$days$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarDays$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/calendar-days.mjs [app-ssr] (ecmascript) <export default as CalendarDays>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/circle-check.mjs [app-ssr] (ecmascript) <export default as CheckCircle2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/chevron-down.mjs [app-ssr] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/chevron-left.mjs [app-ssr] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/chevron-right.mjs [app-ssr] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/chevron-up.mjs [app-ssr] (ecmascript) <export default as ChevronUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevrons$2d$up$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronsUpDown$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/chevrons-up-down.mjs [app-ssr] (ecmascript) <export default as ChevronsUpDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$dollar$2d$sign$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CircleDollarSign$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/circle-dollar-sign.mjs [app-ssr] (ecmascript) <export default as CircleDollarSign>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardCheck$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/clipboard-check.mjs [app-ssr] (ecmascript) <export default as ClipboardCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/copy.mjs [app-ssr] (ecmascript) <export default as Copy>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/download.mjs [app-ssr] (ecmascript) <export default as Download>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/trending-up.mjs [app-ssr] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/credit-card.mjs [app-ssr] (ecmascript) <export default as CreditCard>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/database.mjs [app-ssr] (ecmascript) <export default as Database>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$exclamation$2d$point$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileWarning$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/file-exclamation-point.mjs [app-ssr] (ecmascript) <export default as FileWarning>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gauge$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Gauge$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/gauge.mjs [app-ssr] (ecmascript) <export default as Gauge>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$key$2d$round$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__KeyRound$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/key-round.mjs [app-ssr] (ecmascript) <export default as KeyRound>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$landmark$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Landmark$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/landmark.mjs [app-ssr] (ecmascript) <export default as Landmark>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/layout-dashboard.mjs [app-ssr] (ecmascript) <export default as LayoutDashboard>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2d$keyhole$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LockKeyhole$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/lock-keyhole.mjs [app-ssr] (ecmascript) <export default as LockKeyhole>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/log-out.mjs [app-ssr] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/mail.mjs [app-ssr] (ecmascript) <export default as Mail>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/menu.mjs [app-ssr] (ecmascript) <export default as Menu>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$palette$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Palette$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/palette.mjs [app-ssr] (ecmascript) <export default as Palette>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/pencil.mjs [app-ssr] (ecmascript) <export default as Pencil>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$piggy$2d$bank$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PiggyBank$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/piggy-bank.mjs [app-ssr] (ecmascript) <export default as PiggyBank>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/plus.mjs [app-ssr] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$printer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Printer$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/printer.mjs [app-ssr] (ecmascript) <export default as Printer>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$qr$2d$code$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__QrCode$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/qr-code.mjs [app-ssr] (ecmascript) <export default as QrCode>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$camera$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Camera$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/camera.mjs [app-ssr] (ecmascript) <export default as Camera>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ImageDown$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/image-down.mjs [app-ssr] (ecmascript) <export default as ImageDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileDown$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/file-down.mjs [app-ssr] (ecmascript) <export default as FileDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$receipt$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Receipt$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/receipt.mjs [app-ssr] (ecmascript) <export default as Receipt>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/refresh-cw.mjs [app-ssr] (ecmascript) <export default as RefreshCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/save.mjs [app-ssr] (ecmascript) <export default as Save>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$frown$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Frown$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/frown.mjs [app-ssr] (ecmascript) <export default as Frown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/settings.mjs [app-ssr] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/shield-check.mjs [app-ssr] (ecmascript) <export default as ShieldCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$smartphone$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Smartphone$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/smartphone.mjs [app-ssr] (ecmascript) <export default as Smartphone>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$smile$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Smile$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/smile.mjs [app-ssr] (ecmascript) <export default as Smile>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/trash-2.mjs [app-ssr] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wallet$2d$cards$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__WalletCards$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/wallet-cards.mjs [app-ssr] (ecmascript) <export default as WalletCards>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/application/node_modules/lucide-react/dist/esm/icons/x.mjs [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$Bar$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/recharts/es6/cartesian/Bar.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$BarChart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/recharts/es6/chart/BarChart.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$CartesianGrid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/recharts/es6/cartesian/CartesianGrid.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Cell$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/recharts/es6/component/Cell.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$Pie$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/recharts/es6/polar/Pie.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$PieChart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/recharts/es6/chart/PieChart.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$ResponsiveContainer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/recharts/es6/component/ResponsiveContainer.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Tooltip$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/recharts/es6/component/Tooltip.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$XAxis$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/recharts/es6/cartesian/XAxis.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$YAxis$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/node_modules/recharts/es6/cartesian/YAxis.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/src/lib/finance-data.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$use$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/src/lib/use-data.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$date$2d$range$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/src/lib/date-range.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/src/lib/finance-rules.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/application/src/lib/format.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
const sectionIcons = {
    dashboard: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__["LayoutDashboard"],
    accounts: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wallet$2d$cards$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__WalletCards$3e$__["WalletCards"],
    income: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpRight$3e$__["ArrowUpRight"],
    expense: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2d$left$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDownLeft$3e$__["ArrowDownLeft"],
    "monthly-monitoring": __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$days$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarDays$3e$__["CalendarDays"],
    transfer: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpDown$3e$__["ArrowUpDown"],
    "credit-card-payment": __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__["CreditCard"],
    alkansya: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$piggy$2d$bank$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PiggyBank$3e$__["PiggyBank"],
    receivables: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$banknote$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Banknote$3e$__["Banknote"],
    sync: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"],
    settings: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"]
};
const incomeViewModes = [
    "Daily",
    "Weekly",
    "Monthly",
    "Annually"
];
const expenseViewModes = [
    "Daily",
    "Weekly",
    "Monthly",
    "Annually",
    "To pay",
    "To buy",
    "Installments",
    "Unpaid CC",
    "Unpaid Pasabuy"
];
const expenseCategoryFilterWithoutPasabuy = "__without-pasabuy";
const prototypeAccent = "#5B6CF9";
const categoryPalette = [
    prototypeAccent,
    "#0D9488",
    "#D97706",
    "#E11D48",
    "#7C3AED",
    "#64748B"
];
/**
 * Update the [YYMMDDx] tag in a description string based on a new date.
 * - If the description has no tag, prepend [YYMMDDx] with default code 'x'.
 * - If the description already has a [..] tag, replace the date portion
 *   while preserving the existing transaction code letter.
 * Preserves any text after the tag.
 */ function applyNotionTag(description, yyymmdd) {
    if (!yyymmdd) return description;
    const tagRegex = /^\[(\d{6})([a-zA-Z])\]\s*/;
    const match = description.match(tagRegex);
    if (match) {
        // Preserve existing transaction code letter
        const code = match[2];
        const rest = description.slice(match[0].length);
        return `[${yyymmdd}${code}] ${rest}`;
    }
    // No existing tag — prepend with default code 'x'
    return `[${yyymmdd}x] ${description}`;
}
/**
 * Update the [YYMMDD] tag in an income name string based on a new date.
 * Income uses [YYMMDD] format (no transaction code letter).
 */ function applyIncomeTag(name, yyymmdd) {
    if (!yyymmdd) return name;
    const tagRegex = /^\[(\d{6})\]\s*/;
    const match = name.match(tagRegex);
    if (match) {
        const rest = name.slice(match[0].length);
        return `[${yyymmdd}] ${rest}`;
    }
    // No existing tag — prepend
    return `[${yyymmdd}] ${name}`;
}
/** Strip Notion's [YYMMDD] or [YYMMDDx] prefix from names/descriptions for display. */ function stripNotionTag(text) {
    return text.replace(/^\[.*?\]\s*/, '');
}
function getMonthLabel(value) {
    const [year, month] = value.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric"
    }).format(date);
}
function cx(...classes) {
    return classes.filter(Boolean).join(" ");
}
function parseNumberInput(value) {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
}
function parseOptionalNumberInput(value) {
    if (value.trim() === "") {
        return null;
    }
    return parseNumberInput(value);
}
function isSpecificExpenseCategoryFilter(value) {
    return value !== "" && value !== expenseCategoryFilterWithoutPasabuy;
}
function getIncomeGrossTotal(records) {
    return records.reduce((sum, record)=>sum + record.grossIncome, 0);
}
function getIncomeCapitalExpenditureTotal(records) {
    return records.reduce((sum, record)=>sum + record.capitalExpenditure, 0);
}
function getIncomeNetTotal(records) {
    return records.reduce((sum, record)=>sum + (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateNetIncome"])(record.grossIncome, record.capitalExpenditure), 0);
}
function getExpenseTotal(records) {
    return records.reduce((sum, record)=>sum + record.amount, 0);
}
function useLiveCollections() {
    const { state: accountsState } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$use$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAccounts"])(true);
    // All categories power the id→name lookup maps; the normal-only set (filtered
    // server-side, excluding Transfer / Credit Card Payment / Savings / IOU / etc.)
    // powers the pickers in the normal Income form.
    const { state: allIncomeCategoriesState } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$use$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useIncomeCategories"])(false);
    const { state: normalIncomeCategoriesState } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$use$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useIncomeCategories"])(true);
    const { state: expenseCategoriesState } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$use$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useExpenseCategories"])();
    // Sorted alphabetically at the source so every dropdown (filters and the
    // income/expense log forms) presents options in A→Z order.
    const byName = (a, b)=>a.name.localeCompare(b.name);
    const bySource = (a, b)=>a.source.localeCompare(b.source);
    const allAccounts = (accountsState.status === "success" ? accountsState.data : []).slice().sort(byName);
    const activeAccounts = allAccounts.filter((account)=>!account.inactive && account.type !== "Auxiliary");
    const nonCreditActiveAccounts = activeAccounts.filter((account)=>!(0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isCreditLikeAccountType"])(account.type));
    const creditActiveAccounts = activeAccounts.filter((account)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isCreditLikeAccountType"])(account.type));
    const allIncomeCategories = (allIncomeCategoriesState.status === "success" ? allIncomeCategoriesState.data : []).slice().sort(bySource);
    const normalIncomeCategories = (normalIncomeCategoriesState.status === "success" ? normalIncomeCategoriesState.data : []).slice().sort(bySource);
    const expenseCategories = (expenseCategoriesState.status === "success" ? expenseCategoriesState.data : []).slice().sort(byName);
    const accountNameById = new Map(allAccounts.map((a)=>[
            a.id,
            a.name
        ]));
    const incomeCategoryNameById = new Map(allIncomeCategories.map((c)=>[
            c.id,
            c.source
        ]));
    const expenseCategoryNameById = new Map(expenseCategories.map((c)=>[
            c.id,
            c.name
        ]));
    return {
        allAccounts,
        activeAccounts,
        nonCreditActiveAccounts,
        creditActiveAccounts,
        allIncomeCategories,
        normalIncomeCategories,
        expenseCategories,
        accountNameById,
        incomeCategoryNameById,
        expenseCategoryNameById
    };
}
function getIncomeCategorySummaries(records, categories) {
    const totalNetIncome = getIncomeNetTotal(records);
    return categories.map((category)=>{
        const categoryRecords = records.filter((record)=>record.categoryId === category.id);
        const grossIncome = getIncomeGrossTotal(categoryRecords);
        const capitalExpenditure = getIncomeCapitalExpenditureTotal(categoryRecords);
        const netIncome = getIncomeNetTotal(categoryRecords);
        return {
            id: category.id,
            source: category.source,
            grossIncome,
            capitalExpenditure,
            netIncome,
            earningPercentage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateCategoryTotalOverview"])(netIncome, totalNetIncome)
        };
    });
}
function getExpenseCategorySummaries(records, categories) {
    const totalExpense = getExpenseTotal(records);
    return categories.filter((category)=>category.auxiliary === "No").map((category)=>{
        const categoryRecords = records.filter((record)=>record.categoryId === category.id);
        const spending = getExpenseTotal(categoryRecords);
        const remaining = category.monthlyBudget - spending;
        const usage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateCategoryTotalOverview"])(spending, category.monthlyBudget);
        return {
            id: category.id,
            name: category.name,
            monthlyBudget: category.monthlyBudget,
            upcomingBudget: category.upcomingBudget,
            auxiliary: category.auxiliary,
            spending,
            remaining,
            overview: `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatPercent"])(usage)} used`,
            totalOverview: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateCategoryTotalOverview"])(spending, totalExpense)
        };
    });
}
function FinanceWorkspace({ activeSection }) {
    const { user, loading: authLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const [selectedDate, setSelectedDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$date$2d$range$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["todayIso"])());
    const selectedMonth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$date$2d$range$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["anchorMonth"])(selectedDate);
    const [incomeViewMode, setIncomeViewMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("Monthly");
    const [expenseViewMode, setExpenseViewMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("Monthly");
    const [sidebarCollapsed, setSidebarCollapsed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [mobileNavOpen, setMobileNavOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [syncState, setSyncState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("idle");
    const [schemaHealth, setSchemaHealth] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("notChecked");
    const [pendingOperations, setPendingOperations] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [lastSync, setLastSync] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("—");
    // FAB visibility preference (per-user, synced via the backend). Defaults on.
    // localStorage cache prevents flash on remount while API is in flight.
    const [showFab, setShowFab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return true;
        //TURBOPACK unreachable
        ;
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (authLoading || !user) return;
        let cancelled = false;
        __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["preferencesApi"].get().then((res)=>{
            if (!cancelled && res.success) {
                setShowFab(res.data.showFab);
                // Sync localStorage cache
                try {
                    localStorage.setItem("nf_show_fab", String(res.data.showFab));
                } catch  {}
            }
        }).catch(()=>{
        /* keep default on network/backend error */ });
        return ()=>{
            cancelled = true;
        };
    }, [
        authLoading,
        user
    ]);
    async function updateShowFab(next) {
        setShowFab(next);
        // Persist to localStorage immediately
        try {
            localStorage.setItem("nf_show_fab", String(next));
        } catch  {}
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["preferencesApi"].save({
                showFab: next
            });
        } catch  {
        /* optimistic; ignore persistence errors */ }
    }
    const selectorUnit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$date$2d$range$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["activeSelectorUnit"])(activeSection, incomeViewMode, expenseViewMode);
    // Sync is pull-only: it refreshes the app's cache from Notion. Creates and
    // updates go straight to Notion from the item modals (POST/PATCH), so there
    // is nothing to push here.
    async function runSync() {
        setSyncState("syncing");
        try {
            const pullResult = await __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["syncApi"].pullLatest({
                resources: [
                    "accounts",
                    "incomeCategories",
                    "expenseCategories",
                    "incomes",
                    "expenses"
                ],
                month: selectedMonth
            });
            if (pullResult.success) {
                setSyncState("fresh");
                setPendingOperations(0);
                setLastSync(new Date().toISOString().replace("T", " ").slice(0, 16));
            } else {
                setSyncState("error");
            }
        } catch  {
            setSyncState("error");
        }
    }
    async function verifySchema() {
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["syncApi"].schemaStatus();
            if (result.success) {
                setSchemaHealth("verified");
            } else {
                setSchemaHealth("warning");
            }
        } catch  {
            // Fall back to mock verify behavior
            setSchemaHealth("warning");
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$fab$2d$export$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FabExportProvider"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: cx("workspace", sidebarCollapsed && "workspace--sidebar-collapsed", mobileNavOpen && "workspace--mobile-nav-open"),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Sidebar, {
                    activeSection: activeSection,
                    collapsed: sidebarCollapsed,
                    onToggle: ()=>setSidebarCollapsed((current)=>!current),
                    onNavigate: ()=>setMobileNavOpen(false)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 537,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mobile-nav-backdrop",
                    role: "presentation",
                    onClick: ()=>setMobileNavOpen(false)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 543,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "workspace__main",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TopBar, {
                            activeSection: activeSection,
                            expenseViewMode: expenseViewMode,
                            incomeViewMode: incomeViewMode,
                            lastSync: lastSync,
                            pendingOperations: pendingOperations,
                            schemaHealth: schemaHealth,
                            selectedDate: selectedDate,
                            selectorUnit: selectorUnit,
                            syncState: syncState,
                            onDateChange: setSelectedDate,
                            onSchemaVerify: verifySchema,
                            onSync: runSync,
                            onMobileNavToggle: ()=>setMobileNavOpen((v)=>!v)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 549,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                            className: "workspace__content",
                            children: [
                                activeSection === "dashboard" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DashboardPage, {
                                    lastSync: lastSync,
                                    selectedMonth: selectedMonth
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 566,
                                    columnNumber: 13
                                }, this),
                                activeSection === "accounts" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AccountsPage, {}, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 571,
                                    columnNumber: 44
                                }, this),
                                activeSection === "income" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(IncomePage, {
                                    viewMode: incomeViewMode,
                                    onViewModeChange: setIncomeViewMode,
                                    selectedDate: selectedDate
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 573,
                                    columnNumber: 13
                                }, this),
                                activeSection === "expense" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ExpensePage, {
                                    viewMode: expenseViewMode,
                                    onViewModeChange: setExpenseViewMode,
                                    selectedDate: selectedDate
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 580,
                                    columnNumber: 13
                                }, this),
                                activeSection === "monthly-monitoring" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MonthlyMonitoringPage, {
                                    selectedMonth: selectedMonth
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 587,
                                    columnNumber: 13
                                }, this),
                                isWorkflowSection(activeSection) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(WorkflowPage, {
                                    section: activeSection,
                                    selectedMonth: selectedMonth
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 590,
                                    columnNumber: 13
                                }, this),
                                activeSection === "sync" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SyncPage, {
                                    lastSync: lastSync,
                                    pendingOperations: pendingOperations,
                                    schemaHealth: schemaHealth,
                                    syncState: syncState,
                                    onSchemaVerify: verifySchema,
                                    onSync: runSync
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 593,
                                    columnNumber: 13
                                }, this),
                                activeSection === "settings" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SettingsPage, {
                                    schemaHealth: schemaHealth,
                                    onSchemaVerify: verifySchema,
                                    showFab: showFab,
                                    onShowFabChange: updateShowFab
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 603,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 564,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 548,
                    columnNumber: 7
                }, this),
                showFab && user && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(WorkspaceFab, {
                    activeSection: activeSection,
                    selectedDate: selectedDate
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 613,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 530,
            columnNumber: 5
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 529,
        columnNumber: 5
    }, this);
}
function isWorkflowSection(section) {
    return section === "transfer" || section === "credit-card-payment" || section === "alkansya" || section === "receivables";
}
function AccountTypeIcon({ type, size = 18 }) {
    switch(type){
        case "Cash":
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$banknote$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Banknote$3e$__["Banknote"], {
                size: size
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 635,
                columnNumber: 14
            }, this);
        case "Credit Account":
        case "e-Credit":
        case "BNPL":
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__["CreditCard"], {
                size: size
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 639,
                columnNumber: 14
            }, this);
        case "Savings":
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$landmark$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Landmark$3e$__["Landmark"], {
                size: size
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 641,
                columnNumber: 14
            }, this);
        case "e-Wallet":
        case "Digital Bank":
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$smartphone$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Smartphone$3e$__["Smartphone"], {
                size: size
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 644,
                columnNumber: 14
            }, this);
        default:
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__["Building2"], {
                size: size
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 646,
                columnNumber: 14
            }, this);
    }
}
function isImageUrl(value) {
    return /^(https?:\/\/|data:|\/)/.test(value);
}
function AccountIcon({ account }) {
    if (account.icon && isImageUrl(account.icon)) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
            src: account.icon,
            alt: "",
            width: 24,
            height: 24,
            className: "account-icon",
            unoptimized: true,
            onError: (event)=>{
                const target = event.currentTarget;
                target.style.display = "none";
                const fallback = target.nextElementSibling;
                if (fallback) {
                    fallback.style.display = "grid";
                }
            }
        }, void 0, false, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 657,
            columnNumber: 7
        }, this);
    }
    if (account.icon) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "account-icon account-icon--emoji",
            "aria-hidden": "true",
            children: account.icon
        }, void 0, false, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 678,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "account-icon account-icon--fallback",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AccountTypeIcon, {
            type: account.type,
            size: 18
        }, void 0, false, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 686,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 685,
        columnNumber: 5
    }, this);
}
function Sidebar({ activeSection, collapsed, onToggle, onNavigate }) {
    const { user, logout } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const groupedSections = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
            primary: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["financeSections"].filter((section)=>section.group === "primary"),
            workflow: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["financeSections"].filter((section)=>section.group === "workflow"),
            system: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["financeSections"].filter((section)=>section.group === "system")
        }), []);
    const initials = user?.name ? user.name.split(" ").map((w)=>w[0]).join("").toUpperCase().slice(0, 2) : user?.email?.slice(0, 2).toUpperCase() ?? "?";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
        className: "sidebar",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "brand",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "brand__mark",
                        children: "N"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 718,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "brand__name",
                            children: "Notable Finance"
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 720,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 719,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "sidebar-toggle",
                        "aria-expanded": !collapsed,
                        "aria-label": collapsed ? "Expand sidebar" : "Collapse sidebar",
                        onClick: onToggle,
                        children: collapsed ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                            size: 14
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 729,
                            columnNumber: 24
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                            size: 14
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 729,
                            columnNumber: 53
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 722,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 717,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                className: "nav",
                "aria-label": "Finance sections",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(NavGroup, {
                        title: "Core",
                        sections: groupedSections.primary,
                        activeSection: activeSection,
                        onNavigate: onNavigate
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 733,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(NavGroup, {
                        title: "Workflows",
                        sections: groupedSections.workflow,
                        activeSection: activeSection,
                        onNavigate: onNavigate
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 734,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(NavGroup, {
                        title: "System",
                        sections: groupedSections.system,
                        activeSection: activeSection,
                        onNavigate: onNavigate
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 735,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 732,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "sidebar-profile",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "sidebar-profile__avatar",
                        children: initials
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 738,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: user?.name ?? user?.email ?? "Guest"
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 740,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: user ? "Authenticated" : "Not signed in"
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 741,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 739,
                        columnNumber: 9
                    }, this),
                    user && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        title: "Sign out",
                        onClick: logout,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                            size: 13
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 745,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 744,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 737,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 716,
        columnNumber: 5
    }, this);
}
function NavGroup({ title, sections, activeSection, onNavigate }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "nav__group",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "nav__title",
                children: title
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 766,
                columnNumber: 7
            }, this),
            sections.map((section)=>{
                const Icon = sectionIcons[section.id];
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    href: `/${section.id}`,
                    className: cx("nav__item", activeSection === section.id && "nav__item--active"),
                    onClick: onNavigate,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                            size: 17
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 776,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: section.shortLabel ?? section.label
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 777,
                            columnNumber: 13
                        }, this)
                    ]
                }, section.id, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 770,
                    columnNumber: 11
                }, this);
            })
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 765,
        columnNumber: 5
    }, this);
}
function TopBar({ lastSync, pendingOperations, schemaHealth, selectedDate, selectorUnit, syncState, onDateChange, onSchemaVerify, onSync, onMobileNavToggle }) {
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const initials = user?.name ? user.name.split(" ").map((w)=>w[0]).join("").toUpperCase().slice(0, 2) : user?.email?.slice(0, 2).toUpperCase() ?? "?";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "topbar",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "mobile-nav-toggle",
                "aria-label": "Open navigation",
                onClick: onMobileNavToggle,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__["Menu"], {
                    size: 18
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 824,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 818,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "topbar__actions",
                "aria-label": "Workspace controls",
                children: [
                    selectorUnit && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DateRangeSelector, {
                        unit: selectorUnit,
                        anchorDate: selectedDate,
                        onChange: onDateChange
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 828,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                        syncState: syncState,
                        schemaHealth: schemaHealth
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 834,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "sync-meta",
                        children: [
                            pendingOperations,
                            " pending"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 835,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "sync-meta",
                        children: [
                            "Last sync ",
                            lastSync
                        ]
                    }, void 0, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 836,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "button",
                        onClick: onSchemaVerify,
                        title: "Check /system/schema-status",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__["Database"], {
                                size: 12
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 843,
                                columnNumber: 11
                            }, this),
                            "Schema Check"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 837,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "sync-btn-wrapper",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "button button--primary",
                            onClick: onSync,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                    size: 12,
                                    className: syncState === "syncing" ? "spin" : undefined
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 848,
                                    columnNumber: 13
                                }, this),
                                "Sync"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 847,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 846,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/settings",
                        className: "topbar__avatar",
                        children: initials
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 852,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 826,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 817,
        columnNumber: 5
    }, this);
}
const PICKER_MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
];
function DateRangeSelector({ unit, anchorDate, onChange }) {
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [year, month, day] = anchorDate.split("-").map(Number);
    const [draftYear, setDraftYear] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(year);
    function toggleOpen() {
        setOpen((v)=>{
            const next = !v;
            if (next) setDraftYear(year); // sync draft to current anchor on open
            return next;
        });
    }
    const label = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$date$2d$range$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rangeLabel"])(unit, anchorDate);
    const showDayPicker = unit === "day" || unit === "week";
    const showMonthGrid = unit === "day" || unit === "week" || unit === "month";
    function pickMonth(m) {
        // Keep the day when possible; clamp to the 1st for month/year scopes.
        const targetDay = showDayPicker ? day : 1;
        onChange(`${draftYear.toString().padStart(4, "0")}-${(m + 1).toString().padStart(2, "0")}-${targetDay.toString().padStart(2, "0")}`);
        if (!showDayPicker) setOpen(false);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "month-stepper",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                "aria-label": "Previous",
                onClick: ()=>onChange((0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$date$2d$range$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["stepAnchor"])(unit, anchorDate, -1)),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                    size: 13
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 906,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 901,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "month-stepper__label",
                onClick: toggleOpen,
                "aria-expanded": open,
                children: label
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 908,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                "aria-label": "Next",
                onClick: ()=>onChange((0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$date$2d$range$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["stepAnchor"])(unit, anchorDate, 1)),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                    size: 13
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 921,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 916,
                columnNumber: 7
            }, this),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "date-picker__backdrop",
                        role: "presentation",
                        onClick: ()=>setOpen(false)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 926,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "date-picker",
                        role: "dialog",
                        "aria-label": "Pick a date",
                        children: unit === "year" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "date-picker__year-list",
                            children: Array.from({
                                length: 9
                            }, (_, i)=>year - 4 + i).map((y)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: cx("date-picker__cell", y === year && "is-active"),
                                    onClick: ()=>{
                                        onChange(`${y}-01-01`);
                                        setOpen(false);
                                    },
                                    children: y
                                }, y, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 935,
                                    columnNumber: 19
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 933,
                            columnNumber: 15
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "date-picker__year-row",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>setDraftYear((y)=>y - 1),
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                                                size: 14
                                            }, void 0, false, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 952,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 951,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: draftYear
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 954,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>setDraftYear((y)=>y + 1),
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                                size: 14
                                            }, void 0, false, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 956,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 955,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 950,
                                    columnNumber: 17
                                }, this),
                                showMonthGrid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "date-picker__month-grid",
                                    children: PICKER_MONTHS.map((mName, m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            className: cx("date-picker__cell", draftYear === year && m + 1 === month && "is-active"),
                                            onClick: ()=>pickMonth(m),
                                            children: mName
                                        }, mName, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 962,
                                            columnNumber: 23
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 960,
                                    columnNumber: 19
                                }, this),
                                showDayPicker && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "date-picker__day",
                                    children: [
                                        "Exact day",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "date",
                                            value: anchorDate,
                                            onChange: (e)=>{
                                                if (e.target.value) {
                                                    onChange(e.target.value);
                                                    setOpen(false);
                                                }
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 979,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 977,
                                    columnNumber: 19
                                }, this)
                            ]
                        }, void 0, true)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 931,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 900,
        columnNumber: 5
    }, this);
}
function StatusPill({ syncState, schemaHealth }) {
    if (syncState === "syncing") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "pill pill--info",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                    size: 14,
                    className: "spin"
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 1010,
                    columnNumber: 9
                }, this),
                "Syncing"
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 1009,
            columnNumber: 7
        }, this);
    }
    if (schemaHealth === "warning") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "pill pill--warning",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$exclamation$2d$point$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileWarning$3e$__["FileWarning"], {
                    size: 14
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 1019,
                    columnNumber: 9
                }, this),
                "Schema review"
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 1018,
            columnNumber: 7
        }, this);
    }
    if (schemaHealth === "verified" || syncState === "fresh") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "pill pill--success",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__["CheckCircle2"], {
                    size: 14
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 1028,
                    columnNumber: 9
                }, this),
                "Fresh"
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 1027,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "pill",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gauge$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Gauge$3e$__["Gauge"], {
                size: 14
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1036,
                columnNumber: 7
            }, this),
            "Ready"
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 1035,
        columnNumber: 5
    }, this);
}
function DashboardPage({ lastSync, selectedMonth }) {
    const { creditActiveAccounts, nonCreditActiveAccounts, expenseCategories, accountNameById, expenseCategoryNameById } = useLiveCollections();
    const { state: incomesState } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$use$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useIncomes"])({
        month: selectedMonth
    });
    const { state: expensesState } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$use$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useExpenses"])({
        month: selectedMonth
    });
    const { state: alkansyaState } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$use$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWorkflowRecords"])("alkansya", {
        month: selectedMonth
    });
    const { state: transferState } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$use$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWorkflowRecords"])("transfer", {
        month: selectedMonth
    });
    const { state: ccPaymentState } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$use$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWorkflowRecords"])("credit-card-payment", {
        month: selectedMonth
    });
    const monthLabel = getMonthLabel(selectedMonth);
    const monthIncomes = (incomesState.status === "success" ? incomesState.data : []).filter((r)=>!r.name?.includes("[Deleted:"));
    const monthExpenses = (expensesState.status === "success" ? expensesState.data : []).filter((r)=>!r.description?.includes("[Deleted:"));
    const monthAlkansya = (alkansyaState.status === "success" ? alkansyaState.data : []).filter((r)=>!r.name?.includes("[Deleted:"));
    const monthlyGrossIncome = monthIncomes.reduce((sum, r)=>sum + r.grossIncome, 0);
    // Pasabuy expenses are paid on behalf of others ("pinasabay lang"), so they
    // are not part of the user's own monthly expense.
    const pasabuyCategoryIds = new Set(expenseCategories.filter((c)=>/pasabuy/i.test(c.name)).map((c)=>c.id));
    const ownExpenses = monthExpenses.filter((r)=>!pasabuyCategoryIds.has(r.categoryId));
    const monthlyExpenses = ownExpenses.reduce((sum, r)=>sum + r.amount + (r.interest ?? 0), 0);
    const alkansyaBalance = monthAlkansya.reduce((sum, r)=>sum + (r.grossIncome - r.capitalExpenditure), 0);
    const totalCashFlow = nonCreditActiveAccounts.reduce((sum, a)=>sum + (a.currentBalance ?? 0), 0);
    const availableCredit = creditActiveAccounts.reduce((sum, a)=>sum + (a.availableLimit ?? 0), 0);
    const creditLimit = creditActiveAccounts.reduce((sum, a)=>sum + (a.creditLimit ?? 0), 0);
    const creditBalanceTotal = creditActiveAccounts.reduce((sum, a)=>sum + (a.currentBalance ?? 0), 0);
    // #1 — Monthly Total CC Transactions: sum of expenses on a credit account.
    const creditAccountIds = new Set(creditActiveAccounts.map((a)=>a.id));
    const monthlyCcTransactions = monthExpenses.filter((r)=>creditAccountIds.has(r.accountId)).reduce((sum, r)=>sum + r.amount + (r.interest ?? 0), 0);
    // #2 — Spending by category (with % of month's expense), used for both the
    // Spending Breakdown donut and the Top 5 Spending Category panel.
    // Pasabuy is a passthrough (someone else pays us back), not user spending —
    // exclude it so the breakdown reflects real category spend.
    const spendingBreakdown = expenseCategories.filter((cat)=>!/pasabuy/i.test(cat.name)).map((cat)=>{
        const value = monthExpenses.filter((r)=>r.categoryId === cat.id).reduce((sum, r)=>sum + r.amount + (r.interest ?? 0), 0);
        return {
            name: cat.name,
            value
        };
    }).filter((row)=>row.value > 0).sort((a, b)=>b.value - a.value);
    const topSpendingCategories = spendingBreakdown.slice(0, 5).map((row)=>({
            name: row.name,
            value: row.value,
            percent: monthlyExpenses > 0 ? row.value / monthlyExpenses * 100 : 0
        }));
    // #2 — Most Expensive Purchase of the Month (largest individual expenses).
    const topExpensePurchases = [
        ...monthExpenses
    ].map((r)=>({
            id: r.id,
            description: r.description.replace(/\s*\[Deleted:.*\]/, ""),
            amount: r.amount + (r.interest ?? 0),
            category: expenseCategoryNameById.get(r.categoryId) ?? "—",
            account: accountNameById.get(r.accountId) ?? "—"
        })).sort((a, b)=>b.amount - a.amount).slice(0, 5);
    const sectionPriority = {
        income: 0,
        "credit-card-payment": 1,
        expense: 2,
        transfer: 3
    };
    const sectionMeta = {
        income: "Income",
        "credit-card-payment": "CC Payment",
        expense: "Expense",
        transfer: "Transfer"
    };
    const incomeItems = [
        ...monthIncomes
    ].map((r)=>({
            id: r.id,
            date: r.date,
            title: r.name.replace(/\s*\[Deleted:.*\]/, ""),
            section: "income",
            value: r.grossIncome - r.capitalExpenditure
        }));
    const ccPaymentItems = (ccPaymentState.status === "success" ? ccPaymentState.data : []).filter((r)=>!r.name?.includes("[Deleted:")).map((r)=>({
            id: r.id,
            date: r.date,
            title: r.name.replace(/\s*\[Deleted:.*\]/, ""),
            section: "credit-card-payment",
            value: r.grossIncome - r.capitalExpenditure
        }));
    const expenseItems = [
        ...monthExpenses
    ].map((r)=>({
            id: r.id,
            date: r.purchaseDate,
            title: r.description.replace(/\s*\[Deleted:.*\]/, ""),
            section: "expense",
            value: -(r.amount + (r.interest ?? 0))
        }));
    const transferItems = (transferState.status === "success" ? transferState.data : []).filter((r)=>!r.name?.includes("[Deleted:")).map((r)=>({
            id: r.id,
            date: r.date,
            title: r.name.replace(/\s*\[Deleted:.*\]/, ""),
            section: "transfer",
            value: r.grossIncome - r.capitalExpenditure
        }));
    const recentTransactions = [
        ...incomeItems,
        ...ccPaymentItems,
        ...expenseItems,
        ...transferItems
    ].sort((a, b)=>{
        if (b.date > a.date) return 1;
        if (b.date < a.date) return -1;
        return (sectionPriority[a.section] ?? 99) - (sectionPriority[b.section] ?? 99);
    }).slice(0, 5).map((r)=>({
            id: r.id,
            date: r.date,
            title: r.title,
            meta: sectionMeta[r.section] ?? r.section,
            section: r.section,
            value: r.value,
            tone: r.value >= 0 ? "green" : "rose"
        }));
    const display = {
        totalCashFlow,
        monthlyGrossIncome,
        monthlyExpenses,
        alkansyaBalance,
        pendingOperations: monthExpenses.filter((r)=>r.datePaid === null).length,
        lastSync,
        availableCredit,
        creditLimit,
        creditBalanceTotal,
        monthlyCcTransactions,
        spendingBreakdown,
        topSpendingCategories,
        topExpensePurchases,
        recentTransactions
    };
    const spendingData = display.spendingBreakdown.length > 0 ? display.spendingBreakdown.map((item)=>({
            name: item.name,
            value: item.value,
            color: categoryPalette[display.spendingBreakdown.indexOf(item) % categoryPalette.length]
        })) : [];
    const toneForValue = (value)=>value >= 0 ? "green" : "rose";
    const recentData = display.recentTransactions.length > 0 ? display.recentTransactions.map((item)=>({
            id: item.id,
            date: item.date,
            title: item.title,
            meta: item.meta,
            section: item.section,
            value: item.value,
            tone: toneForValue(item.value)
        })) : [];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "page-stack",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "metric-grid metric-grid--prototype",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                        title: "Total Cash Flow",
                        value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(display.totalCashFlow),
                        detail: "Non-credit accounts",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wallet$2d$cards$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__WalletCards$3e$__["WalletCards"],
                        tone: "blue"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1264,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                        title: "Monthly Income",
                        value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(display.monthlyGrossIncome),
                        detail: monthLabel,
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$banknote$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Banknote$3e$__["Banknote"],
                        tone: "green"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1271,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                        title: "Monthly Expenses",
                        value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(display.monthlyExpenses),
                        detail: monthLabel,
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$receipt$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Receipt$3e$__["Receipt"],
                        tone: "rose"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1278,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                        title: "Sync Queue",
                        value: `${display.pendingOperations}`,
                        detail: `Last sync ${display.lastSync}`,
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"],
                        tone: "amber"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1285,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1263,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "metric-grid metric-grid--prototype",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                        title: "Alkansya Balance",
                        value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(display.alkansyaBalance),
                        detail: monthLabel,
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$piggy$2d$bank$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PiggyBank$3e$__["PiggyBank"],
                        tone: "green"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1295,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                        title: "Available Credit",
                        value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(display.availableCredit),
                        detail: `Limit ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(display.creditLimit, {
                            compact: true
                        })}`,
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__["CreditCard"],
                        tone: "blue"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1302,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                        title: "Monthly Total CC Transactions",
                        value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(display.monthlyCcTransactions),
                        detail: `${creditActiveAccounts.length} credit accounts · ${monthLabel}`,
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__["CreditCard"],
                        tone: "amber"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1309,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                        title: "CC Balance Total",
                        value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(display.creditBalanceTotal),
                        detail: `${creditActiveAccounts.length} credit accounts`,
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"],
                        tone: "rose"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1316,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1294,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "dashboard-chart-grid",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TopExpensePurchasesCard, {
                        purchases: display.topExpensePurchases,
                        monthLabel: monthLabel
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1326,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SpendingBreakdownCard, {
                        data: spendingData,
                        monthLabel: monthLabel
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1327,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1325,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "dashboard-bottom-grid",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TopSpendingCategoriesCard, {
                        categories: display.topSpendingCategories,
                        monthLabel: monthLabel
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1331,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(RecentTransactionsList, {
                        records: recentData
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1332,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1330,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 1262,
        columnNumber: 5
    }, this);
}
function TopExpensePurchasesCard({ purchases, monthLabel }) {
    // Rank ramp: #1 red → #5 yellow.
    const rankColors = [
        "#DC2626",
        "#EA580C",
        "#F97316",
        "#F59E0B",
        "#CA8A04"
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "dashboard-card",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "dashboard-card__header dashboard-card__header--stacked",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "Most Expensive Purchase of the Month"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1357,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: monthLabel
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1358,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1356,
                columnNumber: 7
            }, this),
            purchases.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
                title: "No expenses",
                detail: "No expenses are scoped to this month."
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1361,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "top-expense-list",
                children: purchases.map((p, index)=>{
                    const color = rankColors[index] ?? rankColors[rankColors.length - 1];
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "top-expense-row",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "top-expense-row__rank",
                                style: {
                                    backgroundColor: color
                                },
                                children: index + 1
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 1368,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "top-expense-row__content",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        className: "top-expense-row__title",
                                        style: {
                                            color
                                        },
                                        children: p.description || "Untitled"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 1375,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "top-expense-row__meta",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: [
                                                    p.category,
                                                    " · ",
                                                    p.account
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 1379,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(p.amount)
                                            }, void 0, false, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 1380,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 1378,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 1374,
                                columnNumber: 17
                            }, this)
                        ]
                    }, p.id, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1367,
                        columnNumber: 15
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1363,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 1355,
        columnNumber: 5
    }, this);
}
function TopSpendingCategoriesCard({ categories, monthLabel }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "dashboard-card",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "dashboard-card__header dashboard-card__header--stacked",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "Top 5 Spending Category"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1402,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: monthLabel
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1403,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1401,
                columnNumber: 7
            }, this),
            categories.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
                title: "No spending",
                detail: "No expenses are scoped to this month."
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1406,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "budget-usage-list",
                children: categories.map((cat)=>{
                    const percent = Math.round(cat.percent);
                    const color = percent > 50 ? "#E11D48" : percent > 25 ? "#D97706" : prototypeAccent;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "budget-usage-row",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: cat.name
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 1415,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: [
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(cat.value, {
                                                compact: true
                                            }),
                                            " · ",
                                            percent,
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 1416,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 1414,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "budget-usage-track",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                    style: {
                                        width: `${Math.min(percent, 100)}%`,
                                        backgroundColor: color
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 1419,
                                    columnNumber: 19
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 1418,
                                columnNumber: 17
                            }, this)
                        ]
                    }, cat.name, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1413,
                        columnNumber: 15
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1408,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 1400,
        columnNumber: 5
    }, this);
}
function RecentTransactionsList({ records }) {
    const iconMap = {
        income: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpRight$3e$__["ArrowUpRight"],
        expense: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2d$left$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDownLeft$3e$__["ArrowDownLeft"],
        transfer: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpDown$3e$__["ArrowUpDown"],
        "credit-card-payment": __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__["CreditCard"]
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "dashboard-card recent-list-card",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "recent-list-card__header",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    children: "Recent Transactions"
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 1452,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1451,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "recent-list",
                children: records.map((record)=>{
                    const Icon = iconMap[record.section] ?? __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpRight$3e$__["ArrowUpRight"];
                    const prefix = record.value > 0 ? "+" : "-";
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "recent-list__row",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: cx("recent-list__icon", `recent-list__icon--${record.tone}`),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 1462,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 1461,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "recent-list__copy",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: record.title
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 1465,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: record.meta
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 1466,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 1464,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: cx("recent-list__amount", `recent-list__amount--${record.section}`),
                                children: [
                                    prefix,
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(Math.abs(record.value), {
                                        compact: true
                                    })
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 1468,
                                columnNumber: 15
                            }, this)
                        ]
                    }, record.id, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1460,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1454,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 1450,
        columnNumber: 5
    }, this);
}
function SpendingBreakdownCard({ data, monthLabel }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "dashboard-card dashboard-card--spending",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "dashboard-card__header dashboard-card__header--stacked",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "Spending Breakdown"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1491,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: monthLabel
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1492,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1490,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "spending-donut",
                "aria-label": "Spending breakdown donut chart",
                children: data.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$ResponsiveContainer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ResponsiveContainer"], {
                    width: "100%",
                    height: "100%",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$PieChart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PieChart"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$Pie$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Pie"], {
                                cx: "50%",
                                cy: "50%",
                                data: data,
                                dataKey: "value",
                                innerRadius: 47,
                                isAnimationActive: false,
                                outerRadius: 76,
                                stroke: "none",
                                children: data.map((entry)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Cell$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cell"], {
                                        fill: entry.color
                                    }, entry.name, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 1509,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 1498,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Tooltip$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Tooltip"], {
                                contentStyle: {
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid rgba(28,25,23,0.09)",
                                    borderRadius: 10,
                                    fontSize: 12
                                },
                                formatter: (value)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(Number(value))
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 1512,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1497,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 1496,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
                    title: "No spending",
                    detail: "No expenses are scoped to this month."
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 1524,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1494,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "spending-list",
                children: data.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "spending-list__row",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                        style: {
                                            backgroundColor: item.color
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 1530,
                                        columnNumber: 19
                                    }, this),
                                    item.name
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 1530,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(item.value, {
                                    compact: true
                                })
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 1531,
                                columnNumber: 13
                            }, this)
                        ]
                    }, item.name, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1529,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1527,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 1489,
        columnNumber: 5
    }, this);
}
function AccountsPage() {
    const [viewMode, setViewMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("cards");
    const [accountScope, setAccountScope] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("standard");
    const [hideZeroBalance, setHideZeroBalance] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [cardTypeFilter, setCardTypeFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [selectedAccount, setSelectedAccount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const { state: accountsState } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$use$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAccounts"])(true);
    const sourceAccounts = accountsState.status === "success" ? accountsState.data : [];
    // Distinct account (card) types present, for the Card Type filter dropdown.
    const cardTypeOptions = Array.from(new Set(sourceAccounts.filter((a)=>!a.inactive && a.type !== "Auxiliary").map((a)=>a.type))).sort();
    const visibleAccounts = sourceAccounts.filter((account)=>{
        if (account.inactive) return false;
        if (hideZeroBalance && account.currentBalance === 0) return false;
        if (cardTypeFilter && account.type !== cardTypeFilter) return false;
        if (accountScope === "all") return account.type !== "Auxiliary";
        if (accountScope === "credit") return (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isCreditLikeAccountType"])(account.type);
        return !(0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isCreditLikeAccountType"])(account.type) && account.type !== "Auxiliary";
    }).sort((a, b)=>a.name.localeCompare(b.name));
    const accountTableHeaders = accountScope === "credit" ? [
        "Account",
        "Type",
        "Balance",
        "Credit Limit",
        "Available Balance",
        "Total Payment Made",
        "Total Purchase Expenses",
        "Billing",
        "Due"
    ] : [
        "Account",
        "Type",
        "Balance",
        "Total Cash Inflow",
        "Total Cash Outflow"
    ];
    const accountTableRows = visibleAccounts.map((account)=>{
        const accountCell = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "account-cell",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AccountIcon, {
                    account: account
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 1575,
                    columnNumber: 9
                }, this),
                account.name
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 1574,
            columnNumber: 7
        }, this);
        if (accountScope === "credit") {
            return [
                accountCell,
                account.type,
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(account.currentBalance),
                account.creditLimit !== null ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(account.creditLimit, {
                    compact: true
                }) : "-",
                account.availableLimit !== null ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(account.availableLimit, {
                    compact: true
                }) : "-",
                account.totalIncomes !== null ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(account.totalIncomes, {
                    compact: true
                }) : "-",
                account.totalExpenses !== null ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(account.totalExpenses, {
                    compact: true
                }) : "-",
                account.billingDay?.toString() ?? "-",
                account.dueDay?.toString() ?? "-"
            ];
        }
        return [
            accountCell,
            account.type,
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(account.currentBalance),
            account.totalIncomes !== null ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(account.totalIncomes, {
                compact: true
            }) : "-",
            account.totalExpenses !== null ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(account.totalExpenses, {
                compact: true
            }) : "-"
        ];
    });
    const accountTotalBalance = visibleAccounts.reduce((sum, account)=>sum + account.currentBalance, 0);
    const accountTotalIncome = visibleAccounts.reduce((sum, account)=>sum + (account.totalIncomes ?? 0), 0);
    const accountTotalExpense = visibleAccounts.reduce((sum, account)=>sum + (account.totalExpenses ?? 0), 0);
    const accountTableFooterRows = accountScope === "credit" ? [] : [
        [
            "Total",
            "",
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(accountTotalBalance),
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(accountTotalIncome, {
                compact: true
            }),
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(accountTotalExpense, {
                compact: true
            })
        ]
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "page-stack",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PageToolbar, {
                title: "Accounts",
                actions: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FilterSelect, {
                            placeholder: "All card types",
                            placeholderDisabled: false,
                            value: cardTypeFilter,
                            onChange: setCardTypeFilter,
                            children: cardTypeOptions.map((type)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: type,
                                    children: type
                                }, type, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 1641,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 1634,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FilterToggle, {
                            label: "Hide zero balance",
                            checked: hideZeroBalance,
                            onChange: setHideZeroBalance
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 1644,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SegmentedControl, {
                            label: "Account view",
                            options: [
                                {
                                    label: "Cards",
                                    value: "cards"
                                },
                                {
                                    label: "Table",
                                    value: "table"
                                }
                            ],
                            value: viewMode,
                            onChange: (value)=>setViewMode(value)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 1649,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SegmentedControl, {
                            label: "Account mode",
                            options: [
                                {
                                    label: "All Accounts",
                                    value: "all"
                                },
                                {
                                    label: "Accounts",
                                    value: "standard"
                                },
                                {
                                    label: "Credit Accounts",
                                    value: "credit"
                                }
                            ],
                            value: accountScope,
                            onChange: (value)=>setAccountScope(value)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 1658,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1630,
                columnNumber: 7
            }, this),
            viewMode === "cards" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "account-grid",
                children: visibleAccounts.map((account)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "account-card account-card--button",
                        onClick: ()=>setSelectedAccount(account),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "account-card__top",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "account-card__name-row",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AccountIcon, {
                                                account: account
                                            }, void 0, false, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 1683,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                        children: account.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 1685,
                                                        columnNumber: 21
                                                    }, this),
                                                    account.inactive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        children: "Inactive account"
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 1686,
                                                        columnNumber: 42
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 1684,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 1682,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Badge, {
                                        tone: account.inactive ? "neutral" : (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isCreditLikeAccountType"])(account.type) ? "amber" : "blue",
                                        children: account.type
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 1689,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 1681,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MoneyLine, {
                                label: "Current Balance",
                                value: account.currentBalance
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 1701,
                                columnNumber: 15
                            }, this),
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isCreditLikeAccountType"])(account.type) && account.creditLimit !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MoneyLine, {
                                label: "Credit Limit",
                                value: account.creditLimit
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 1703,
                                columnNumber: 17
                            }, this),
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isCreditLikeAccountType"])(account.type) && account.availableLimit !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MoneyLine, {
                                label: "Available Limit",
                                value: account.availableLimit
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 1706,
                                columnNumber: 17
                            }, this),
                            account.totalIncomes !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MoneyLine, {
                                label: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isCreditLikeAccountType"])(account.type) ? "Total Payment Made" : "Total Cash Inflow",
                                value: account.totalIncomes
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 1709,
                                columnNumber: 17
                            }, this),
                            account.totalExpenses !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MoneyLine, {
                                label: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isCreditLikeAccountType"])(account.type) ? "Total Purchase Expenses" : "Total Cash Outflow",
                                value: account.totalExpenses
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 1715,
                                columnNumber: 17
                            }, this)
                        ]
                    }, account.id, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1675,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1673,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DataTable, {
                headers: accountTableHeaders,
                rows: accountTableRows,
                footerRows: accountTableFooterRows,
                onRowClick: (rowIndex)=>{
                    const account = visibleAccounts[rowIndex];
                    if (account) {
                        setSelectedAccount(account);
                    }
                }
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1724,
                columnNumber: 9
            }, this),
            selectedAccount && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AccountDetailModal, {
                account: selectedAccount,
                onClose: ()=>setSelectedAccount(null)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1738,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 1629,
        columnNumber: 5
    }, this);
}
const ANNUAL_MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
];
function buildAnnualGroups(records, groupBy, accountNameById, categoryNameById) {
    if (groupBy === "month") {
        const sums = new Array(12).fill(0);
        for (const r of records){
            const m = Number((r.dateIso || "").slice(5, 7)) - 1;
            if (m >= 0 && m < 12) sums[m] += r.value;
        }
        return ANNUAL_MONTHS.map((label, i)=>({
                label,
                value: sums[i]
            }));
    }
    const nameById = groupBy === "account" ? accountNameById : categoryNameById;
    const sums = new Map();
    for (const r of records){
        const key = (groupBy === "account" ? r.accountId ?? "" : r.categoryId) || "—";
        sums.set(key, (sums.get(key) ?? 0) + r.value);
    }
    return [
        ...sums.entries()
    ].map(([key, value])=>({
            label: nameById.get(key) ?? "—",
            value
        })).sort((a, b)=>b.value - a.value);
}
function GroupBySelect({ value, onChange }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: "group-by",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
            value: value,
            onChange: (e)=>onChange(e.target.value),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                    value: "month",
                    children: "Group by Month"
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 1798,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                    value: "account",
                    children: "Group by Account"
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 1799,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                    value: "category",
                    children: "Group by Category"
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 1800,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 1797,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 1796,
        columnNumber: 5
    }, this);
}
function AnnualBarChart({ data, color }) {
    if (!data.some((d)=>d.value !== 0)) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
            title: "No data",
            detail: "Nothing to chart for this year."
        }, void 0, false, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 1814,
            columnNumber: 12
        }, this);
    }
    const rotated = data.length > 6;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "annual-chart",
        "aria-label": "Annual bar chart",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$ResponsiveContainer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ResponsiveContainer"], {
            width: "100%",
            height: "100%",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$BarChart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BarChart"], {
                data: data,
                margin: {
                    top: 8,
                    right: 8,
                    left: 4,
                    bottom: 4
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$CartesianGrid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CartesianGrid"], {
                        strokeDasharray: "3 3",
                        stroke: "rgba(28,25,23,0.06)",
                        vertical: false
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1821,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$XAxis$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["XAxis"], {
                        dataKey: "label",
                        tick: {
                            fontSize: 11,
                            fill: "#79716B"
                        },
                        tickLine: false,
                        axisLine: false,
                        interval: 0,
                        angle: rotated ? -35 : 0,
                        textAnchor: rotated ? "end" : "middle",
                        height: rotated ? 78 : 28
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1822,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$YAxis$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["YAxis"], {
                        tick: {
                            fontSize: 11,
                            fill: "#79716B"
                        },
                        tickLine: false,
                        axisLine: false,
                        width: 52,
                        tickFormatter: (v)=>`₱${(Number(v) / 1000).toFixed(0)}k`
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1832,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Tooltip$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Tooltip"], {
                        cursor: {
                            fill: "rgba(28,25,23,0.05)"
                        },
                        formatter: (v)=>[
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(Number(v)),
                                ""
                            ],
                        contentStyle: {
                            backgroundColor: "#FFFFFF",
                            border: "1px solid rgba(28,25,23,0.09)",
                            borderRadius: 10,
                            fontSize: 12
                        }
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1839,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$Bar$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Bar"], {
                        dataKey: "value",
                        fill: color,
                        radius: [
                            5,
                            5,
                            0,
                            0
                        ],
                        isAnimationActive: false
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 1849,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 1820,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 1819,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 1818,
        columnNumber: 5
    }, this);
}
function IncomePage({ viewMode, onViewModeChange, selectedDate }) {
    const { nonCreditActiveAccounts, normalIncomeCategories, accountNameById, incomeCategoryNameById } = useLiveCollections();
    const range = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$date$2d$range$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["computeRange"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$date$2d$range$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["incomeModeToUnit"])(viewMode), selectedDate);
    const [accountId, setAccountId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [categoryId, setCategoryId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [formAccountId, setFormAccountId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [formCategoryId, setFormCategoryId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [grossIncomeInput, setGrossIncomeInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [capitalExpenditureInput, setCapitalExpenditureInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [nameInput, setNameInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [dateInput, setDateInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [modal, setModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editing, setEditing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [saveError, setSaveError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editingId, setEditingId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [annualView, setAnnualView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("table");
    const [groupBy, setGroupBy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("month");
    const isAnnual = viewMode === "Annually";
    const calculatedNetIncome = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateNetIncome"])(parseNumberInput(grossIncomeInput), parseNumberInput(capitalExpenditureInput));
    const { state: incomesState, refetch } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$use$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useIncomes"])({
        rangeStart: range.start,
        rangeEnd: range.end,
        accountId: accountId || undefined,
        categoryId: categoryId || undefined
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handler = ()=>{
            void refetch();
        };
        window.addEventListener(DATA_CHANGED_EVENT, handler);
        return ()=>window.removeEventListener(DATA_CHANGED_EVENT, handler);
    }, [
        refetch
    ]);
    // Auto-update [YYMMDD] tag when date changes (new or edit mode).
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (modal?.mode !== "new" && modal?.mode !== "edit") return;
        const yyymmdd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toYYMMDD"])(dateInput);
        if (!yyymmdd) return;
        setNameInput((prev)=>applyIncomeTag(prev, yyymmdd));
    }, [
        dateInput,
        modal?.mode
    ]);
    const isLoading = incomesState.status === "loading";
    const allIncomeRecords = incomesState.status === "success" ? incomesState.data : [];
    const visibleIncomeRecords = allIncomeRecords.filter((record)=>!record.name?.includes("[Deleted:"));
    const annualIncomeGroups = buildAnnualGroups(visibleIncomeRecords.map((r)=>({
            dateIso: r.date,
            accountId: r.accountId,
            categoryId: r.categoryId,
            value: r.grossIncome
        })), groupBy, accountNameById, incomeCategoryNameById);
    function openIncomeModal(mode, title, recordId) {
        const record = recordId != null ? visibleIncomeRecords.find((r)=>r.id === recordId) : undefined;
        setNameInput(record?.name ?? "");
        setDateInput(record?.date ?? "");
        setFormAccountId(record?.accountId ?? "");
        setFormCategoryId(record?.categoryId ?? "");
        setGrossIncomeInput(record?.grossIncome?.toString() ?? "");
        setCapitalExpenditureInput(record?.capitalExpenditure?.toString() ?? "");
        setEditingId(record?.id ?? null);
        setEditing(mode === "new"); // new starts editable; edit starts read-only
        setSaveError(null);
        setModal({
            mode,
            title
        });
    }
    async function handleSaveIncome() {
        if (!nameInput.trim() || !dateInput) {
            setSaveError("Name and date are required.");
            return;
        }
        const payload = {
            name: nameInput.trim(),
            date: dateInput,
            grossIncome: parseNumberInput(grossIncomeInput),
            capitalExpenditure: parseNumberInput(capitalExpenditureInput),
            accountId: formAccountId,
            categoryId: formCategoryId
        };
        setSaving(true);
        setSaveError(null);
        const res = modal?.mode === "edit" && editingId ? await __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["incomesApi"].update(editingId, payload) : await __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["incomesApi"].create(payload);
        setSaving(false);
        if (!res.success) {
            setSaveError(res.error.message || "Failed to save to Notion.");
            return;
        }
        setModal(null);
        await refetch();
    }
    function handleDuplicateIncome() {
        // Keep the currently-loaded field values but detach from the source record
        // so Save creates a fresh income instead of updating the original.
        setEditingId(null);
        setEditing(true);
        setSaveError(null);
        setModal({
            mode: "new",
            title: "New Income (Copy)"
        });
    }
    async function handleDeleteIncome() {
        if (!editingId) return;
        if (!window.confirm("Soft-delete this income in Notion?")) return;
        setSaving(true);
        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["incomesApi"].delete(editingId);
        setSaving(false);
        if (!res.success) {
            setSaveError(res.error.message || "Failed to delete.");
            return;
        }
        setModal(null);
        await refetch();
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "page-stack",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PageToolbar, {
                title: "Income",
                actions: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FilterSelect, {
                            placeholder: "All Accounts",
                            placeholderDisabled: false,
                            value: accountId,
                            onChange: setAccountId,
                            children: nonCreditActiveAccounts.map((account)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: account.id,
                                    children: account.name
                                }, account.id, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2013,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2006,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FilterSelect, {
                            placeholder: "All Categories",
                            placeholderDisabled: false,
                            value: categoryId,
                            onChange: setCategoryId,
                            children: normalIncomeCategories.map((category)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: category.id,
                                    children: category.source
                                }, category.id, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2025,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2018,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "button button--primary",
                            onClick: ()=>openIncomeModal("new", "New Income"),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2035,
                                    columnNumber: 15
                                }, this),
                                "New Income"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2030,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 2002,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SegmentedControl, {
                label: "Income view",
                options: incomeViewModes.map((mode)=>({
                        label: mode,
                        value: mode
                    })),
                value: viewMode,
                onChange: (value)=>onViewModeChange(value)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 2042,
                columnNumber: 7
            }, this),
            isAnnual && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "annual-controls",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SegmentedControl, {
                        label: "Annual display",
                        options: [
                            {
                                label: "Table",
                                value: "table"
                            },
                            {
                                label: "Chart",
                                value: "chart"
                            }
                        ],
                        value: annualView,
                        onChange: (v)=>setAnnualView(v)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 2051,
                        columnNumber: 11
                    }, this),
                    annualView === "chart" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(GroupBySelect, {
                        value: groupBy,
                        onChange: setGroupBy
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 2061,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 2050,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Panel, {
                title: `${viewMode} Income Records`,
                children: [
                    isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LoadingBlock, {
                        label: "Querying Notion…"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 2067,
                        columnNumber: 23
                    }, this),
                    isAnnual && annualView === "chart" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AnnualBarChart, {
                        data: annualIncomeGroups,
                        color: "#0D9488"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 2069,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DataTable, {
                        headers: [
                            "Name",
                            "Date",
                            "Account",
                            "Category",
                            "Gross",
                            "Expenditure",
                            "Net"
                        ],
                        rows: visibleIncomeRecords.map((record)=>{
                            const netIncome = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateNetIncome"])(record.grossIncome, record.capitalExpenditure);
                            return [
                                stripNotionTag(record.name),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"])(record.date),
                                accountNameById.get(record.accountId ?? "") ?? "—",
                                incomeCategoryNameById.get(record.categoryId) ?? "—",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(record.grossIncome),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(record.capitalExpenditure),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MoneyValue, {
                                    value: netIncome
                                }, `${record.id}-net`, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2083,
                                    columnNumber: 15
                                }, this)
                            ];
                        }),
                        footerRows: [
                            [
                                "Total",
                                "",
                                "",
                                "",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(getIncomeGrossTotal(visibleIncomeRecords)),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(getIncomeCapitalExpenditureTotal(visibleIncomeRecords)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MoneyValue, {
                                    value: getIncomeNetTotal(visibleIncomeRecords)
                                }, "income-total-net", false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2094,
                                    columnNumber: 15
                                }, this)
                            ]
                        ],
                        onRowClick: (rowIndex)=>{
                            const record = visibleIncomeRecords[rowIndex];
                            if (record) {
                                openIncomeModal("edit", record.name, record.id);
                            }
                        }
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 2071,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 2066,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FormModal, {
                deleteLabel: "Soft Delete",
                modal: modal,
                editing: editing,
                saving: saving,
                error: saveError,
                subtitle: "Net income updates from gross income less capital expenditure.",
                onEdit: ()=>setEditing(true),
                onSave: handleSaveIncome,
                onDelete: handleDeleteIncome,
                onDuplicate: handleDuplicateIncome,
                onClose: ()=>setModal(null),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "form-grid form-grid--single",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Name",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                placeholder: "Income title",
                                value: nameInput,
                                onChange: (event)=>setNameInput(event.target.value)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 2125,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2124,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Date",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "date",
                                value: dateInput,
                                onChange: (event)=>setDateInput(event.target.value)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 2132,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2131,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Gross Income",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                inputMode: "decimal",
                                placeholder: "0.00",
                                value: grossIncomeInput,
                                onChange: (event)=>setGrossIncomeInput(event.target.value)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 2139,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2138,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Capital Expenditure",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                inputMode: "decimal",
                                placeholder: "0.00",
                                value: capitalExpenditureInput,
                                onChange: (event)=>setCapitalExpenditureInput(event.target.value)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 2147,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2146,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Accounts",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: formAccountId,
                                onChange: (event)=>setFormAccountId(event.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "— None —"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 2156,
                                        columnNumber: 15
                                    }, this),
                                    nonCreditActiveAccounts.map((account)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: account.id,
                                            children: account.name
                                        }, account.id, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 2158,
                                            columnNumber: 17
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 2155,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2154,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Categories",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: formCategoryId,
                                onChange: (event)=>setFormCategoryId(event.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "— None —"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 2164,
                                        columnNumber: 15
                                    }, this),
                                    normalIncomeCategories.map((category)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: category.id,
                                            children: category.source
                                        }, category.id, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 2166,
                                            columnNumber: 17
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 2163,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2162,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                            label: "Net Income",
                            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(calculatedNetIncome),
                            valueTone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMoneyValueTone"])(calculatedNetIncome)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2170,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 2123,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 2110,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 2001,
        columnNumber: 5
    }, this);
}
function ExpensePage({ viewMode, onViewModeChange, selectedDate }) {
    const { activeAccounts, expenseCategories, accountNameById, expenseCategoryNameById } = useLiveCollections();
    const expenseUnit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$date$2d$range$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["expenseModeToUnit"])(viewMode);
    const expenseRange = expenseUnit ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$date$2d$range$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["computeRange"])(expenseUnit, selectedDate) : null;
    const [descriptionInput, setDescriptionInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [accountFilterId, setAccountFilterId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [expenseCategoryFilter, setExpenseCategoryFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [pasabuyerFilter, setPasabuyerFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [annualView, setAnnualView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("table");
    const [groupBy, setGroupBy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("month");
    const isAnnual = viewMode === "Annually";
    const [formAccountId, setFormAccountId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [formCategoryId, setFormCategoryId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [purchaseDateInput, setPurchaseDateInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [datePaidInput, setDatePaidInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [expenseAmountInput, setExpenseAmountInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [interestInput, setInterestInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [paymentStatus, setPaymentStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [paymentFrequency, setPaymentFrequency] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [periodCountInput, setPeriodCountInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [paidPeriodInput, setPaidPeriodInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [pasabuyer, setPasabuyer] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [pasabuyStatus, setPasabuyStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [pasabuyDateOfPaymentInput, setPasabuyDateOfPaymentInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [pasabuyPaidPeriodInput, setPasabuyPaidPeriodInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [pasabuyAccountReceiverId, setPasabuyAccountReceiverId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [modal, setModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const pasabuyCategory = expenseCategories.find((c)=>/pasabuy/i.test(c.name));
    const selectedFormAccount = activeAccounts.find((account)=>account.id === formAccountId);
    const accountType = selectedFormAccount?.type ?? "Cash";
    const categoryName = expenseCategoryNameById.get(formCategoryId) ?? "";
    const sections = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getExpenseConditionalSections"])({
        accountType,
        viewMode,
        categoryName
    });
    const expenseAmount = parseNumberInput(expenseAmountInput);
    const interestAmount = sections.creditCard ? parseNumberInput(interestInput) : 0;
    const periodCount = parseOptionalNumberInput(periodCountInput);
    const paidPeriod = parseOptionalNumberInput(paidPeriodInput);
    const pasabuyPaidPeriod = parseOptionalNumberInput(pasabuyPaidPeriodInput);
    const grossPrice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateGrossPrice"])(expenseAmount, interestAmount);
    const installmentAmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateInstallmentAmount"])({
        grossPrice,
        paymentStatus,
        periodCount
    });
    const paidAmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculatePaidAmount"])({
        grossPrice,
        paymentStatus,
        installmentAmount,
        paidPeriod
    });
    const remainingBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateRemainingBalance"])(grossPrice, paidAmount);
    const expectedPaymentDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateExpectedPaymentDate"])({
        purchaseDate: purchaseDateInput,
        billingDay: selectedFormAccount?.billingDay ?? null,
        dueDay: selectedFormAccount?.dueDay ?? null
    });
    const pasabuyReceivedAmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculatePasabuyReceivedAmount"])({
        grossPrice,
        pasabuyStatus,
        installmentAmount,
        pasabuyPaidPeriod,
        periodCount
    });
    const pasabuyerBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculatePasabuyerBalance"])(grossPrice, pasabuyReceivedAmount);
    const [editing, setEditing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [saveError, setSaveError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editingId, setEditingId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const { state: expensesState, refetch } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$use$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useExpenses"])({
        rangeStart: expenseRange?.start,
        rangeEnd: expenseRange?.end,
        accountId: accountFilterId || undefined,
        categoryId: isSpecificExpenseCategoryFilter(expenseCategoryFilter) ? expenseCategoryFilter : undefined,
        paymentStatus: undefined,
        pasabuyer: pasabuyerFilter || undefined,
        expenseViewMode: viewMode
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handler = ()=>{
            void refetch();
        };
        window.addEventListener(DATA_CHANGED_EVENT, handler);
        return ()=>window.removeEventListener(DATA_CHANGED_EVENT, handler);
    }, [
        refetch
    ]);
    const isLoading = expensesState.status === "loading";
    const allExpenseRecords = expensesState.status === "success" ? expensesState.data : [];
    const visibleExpenseRecords = allExpenseRecords.filter((record)=>{
        if (record.description?.includes("[Deleted:")) return false;
        if (expenseCategoryFilter === expenseCategoryFilterWithoutPasabuy && pasabuyCategory && record.categoryId === pasabuyCategory.id) {
            return false;
        }
        return true;
    });
    const annualExpenseGroups = buildAnnualGroups(visibleExpenseRecords.map((r)=>({
            dateIso: r.purchaseDate,
            accountId: r.accountId,
            categoryId: r.categoryId,
            value: r.amount + (r.interest ?? 0)
        })), groupBy, accountNameById, expenseCategoryNameById);
    // Derived credit/installment figures per record, mirroring the modal's math,
    // for the detailed CC Transactions and Installments table columns.
    const accountById = new Map(activeAccounts.map((a)=>[
            a.id,
            a
        ]));
    function deriveExpenseComputed(record) {
        const gross = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateGrossPrice"])(record.amount, record.interest ?? 0);
        const installment = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateInstallmentAmount"])({
            grossPrice: gross,
            paymentStatus: record.paymentStatus,
            periodCount: record.periodCount
        });
        const paid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculatePaidAmount"])({
            grossPrice: gross,
            paymentStatus: record.paymentStatus,
            installmentAmount: installment,
            paidPeriod: record.paidPeriod
        });
        const remaining = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateRemainingBalance"])(gross, paid);
        const account = accountById.get(record.accountId ?? "");
        const expected = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateExpectedPaymentDate"])({
            purchaseDate: record.purchaseDate,
            billingDay: account?.billingDay ?? null,
            dueDay: account?.dueDay ?? null
        });
        return {
            gross,
            installment,
            paid,
            remaining,
            expected
        };
    }
    // Auto-update [YYMMDDx] tag when purchase date changes (new or edit mode).
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (modal?.mode !== "new" && modal?.mode !== "edit") return;
        const yyymmdd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toYYMMDD"])(purchaseDateInput);
        if (!yyymmdd) return;
        setDescriptionInput((prev)=>applyNotionTag(prev, yyymmdd));
    }, [
        purchaseDateInput,
        modal?.mode
    ]);
    function openExpenseModal(mode, title, recordId) {
        const record = recordId != null ? visibleExpenseRecords.find((r)=>r.id === recordId) : undefined;
        const nextCategoryId = record?.categoryId ?? (viewMode === "Unpaid Pasabuy" ? pasabuyCategory?.id : undefined) ?? (isSpecificExpenseCategoryFilter(expenseCategoryFilter) ? expenseCategoryFilter : "");
        setDescriptionInput(record?.description ?? "");
        setFormAccountId(record?.accountId ?? accountFilterId);
        setFormCategoryId(nextCategoryId);
        setPurchaseDateInput(record?.purchaseDate ?? "");
        setDatePaidInput(record?.datePaid ?? "");
        setExpenseAmountInput(record?.amount?.toString() ?? "");
        setInterestInput(record?.interest?.toString() ?? "");
        setPaymentStatus(record?.paymentStatus ?? "");
        setPaymentFrequency(record?.paymentFrequency ?? "");
        setPeriodCountInput(record?.periodCount?.toString() ?? "");
        setPaidPeriodInput(record?.paidPeriod?.toString() ?? "");
        setPasabuyer(record?.pasabuyer ?? "");
        setPasabuyStatus(record?.pasabuyStatus ?? "");
        setPasabuyDateOfPaymentInput(record?.pasabuyDateOfPayment ?? "");
        setPasabuyPaidPeriodInput(record?.pasabuyPaidPeriod?.toString() ?? "");
        setPasabuyAccountReceiverId(record?.pasabuyAccountReceiverId ?? "");
        setEditingId(record?.id ?? null);
        setEditing(mode === "new");
        setSaveError(null);
        setModal({
            mode,
            title
        });
    }
    async function handleSaveExpense() {
        if (!descriptionInput.trim()) {
            setSaveError("Description is required.");
            return;
        }
        const payload = {
            description: descriptionInput.trim(),
            purchaseDate: purchaseDateInput,
            datePaid: datePaidInput || null,
            amount: parseNumberInput(expenseAmountInput),
            interest: parseNumberInput(interestInput),
            accountId: formAccountId,
            categoryId: formCategoryId,
            paymentStatus: paymentStatus || "Unpaid",
            paymentFrequency: paymentFrequency || null,
            periodCount: parseOptionalNumberInput(periodCountInput),
            paidPeriod: parseOptionalNumberInput(paidPeriodInput),
            pasabuyer: pasabuyer || null,
            pasabuyStatus: pasabuyStatus || null,
            pasabuyDateOfPayment: pasabuyDateOfPaymentInput || null,
            pasabuyPaidPeriod: parseOptionalNumberInput(pasabuyPaidPeriodInput),
            pasabuyAccountReceiverId: pasabuyAccountReceiverId || null
        };
        setSaving(true);
        setSaveError(null);
        const res = modal?.mode === "edit" && editingId ? await __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["expensesApi"].update(editingId, payload) : await __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["expensesApi"].create(payload);
        setSaving(false);
        if (!res.success) {
            setSaveError(res.error.message || "Failed to save to Notion.");
            return;
        }
        setModal(null);
        await refetch();
    }
    function handleDuplicateExpense() {
        // Keep the loaded field values but detach from the source record so Save
        // creates a fresh expense instead of updating the original.
        setEditingId(null);
        setEditing(true);
        setSaveError(null);
        setModal({
            mode: "new",
            title: "New Expense (Copy)"
        });
    }
    async function handleDeleteExpense() {
        if (!editingId) return;
        if (!window.confirm("Soft-delete this expense in Notion?")) return;
        setSaving(true);
        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["expensesApi"].delete(editingId);
        setSaving(false);
        if (!res.success) {
            setSaveError(res.error.message || "Failed to delete.");
            return;
        }
        setModal(null);
        await refetch();
    }
    function handleExpenseViewModeChange(nextViewMode) {
        if (nextViewMode === "Unpaid Pasabuy") {
            setExpenseCategoryFilter("");
        }
        onViewModeChange(nextViewMode);
    }
    // Publish a printable receipt of the current view for the floating button.
    // The "Amount" column is remapped per view per the receipt spec.
    const { setReceipt } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$fab$2d$export$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useFabRegister"])();
    const receiptContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const amountHeader = viewMode === "Installments" ? "Installment Amount" : "Amount";
        const receiptValue = (record)=>{
            if (viewMode === "Installments") {
                return deriveExpenseComputed(record).installment ?? 0;
            }
            if (viewMode === "Unpaid CC") {
                return deriveExpenseComputed(record).remaining;
            }
            if (viewMode === "Unpaid Pasabuy") {
                return record.pasabuyBalance ?? 0;
            }
            return record.amount;
        };
        const rows = visibleExpenseRecords.map((record)=>({
                date: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"])(record.purchaseDate),
                description: stripNotionTag(record.description),
                amount: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(receiptValue(record))
            }));
        const total = visibleExpenseRecords.reduce((sum, record)=>sum + receiptValue(record), 0);
        return {
            viewTitle: `${viewMode} Expenses`,
            periodLabel: getMonthLabel((0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$date$2d$range$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["anchorMonth"])(selectedDate)),
            amountHeader,
            rows,
            total: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(total)
        };
    // deriveExpenseComputed is a stable closure over the same render inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        viewMode,
        selectedDate,
        visibleExpenseRecords
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setReceipt(receiptContext);
        return ()=>setReceipt(null);
    }, [
        receiptContext,
        setReceipt
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "page-stack",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PageToolbar, {
                title: "Expense",
                actions: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FilterSelect, {
                            placeholder: "All accounts",
                            placeholderDisabled: false,
                            value: accountFilterId,
                            onChange: setAccountFilterId,
                            children: activeAccounts.map((account)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: account.id,
                                    children: account.name
                                }, account.id, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2503,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2496,
                            columnNumber: 13
                        }, this),
                        viewMode !== "Unpaid Pasabuy" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FilterSelect, {
                            placeholder: "All Categories",
                            placeholderDisabled: false,
                            value: expenseCategoryFilter,
                            onChange: setExpenseCategoryFilter,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: expenseCategoryFilterWithoutPasabuy,
                                    children: "W/out Pasabuy"
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2513,
                                    columnNumber: 17
                                }, this),
                                expenseCategories.map((category)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: category.id,
                                        children: category.name
                                    }, category.id, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 2515,
                                        columnNumber: 19
                                    }, this))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2507,
                            columnNumber: 15
                        }, this),
                        viewMode === "Unpaid Pasabuy" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FilterSelect, {
                            placeholder: "All pasabuyers",
                            placeholderDisabled: false,
                            value: pasabuyerFilter,
                            onChange: setPasabuyerFilter,
                            children: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pasabuyerLabels"].map((name)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: name,
                                    children: name
                                }, name, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2527,
                                    columnNumber: 19
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2520,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "button button--primary",
                            onClick: ()=>openExpenseModal("new", "New Expense"),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2536,
                                    columnNumber: 15
                                }, this),
                                "New Expense"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2531,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 2492,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SegmentedControl, {
                label: "Expense view",
                options: expenseViewModes.map((mode)=>({
                        label: mode,
                        value: mode
                    })),
                value: viewMode,
                onChange: (value)=>handleExpenseViewModeChange(value)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 2543,
                columnNumber: 7
            }, this),
            isAnnual && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "annual-controls",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SegmentedControl, {
                        label: "Annual display",
                        options: [
                            {
                                label: "Table",
                                value: "table"
                            },
                            {
                                label: "Chart",
                                value: "chart"
                            }
                        ],
                        value: annualView,
                        onChange: (v)=>setAnnualView(v)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 2552,
                        columnNumber: 11
                    }, this),
                    annualView === "chart" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(GroupBySelect, {
                        value: groupBy,
                        onChange: setGroupBy
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 2562,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 2551,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Panel, {
                title: `${viewMode} Expenses`,
                children: [
                    isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LoadingBlock, {
                        label: "Querying Notion…"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 2568,
                        columnNumber: 23
                    }, this),
                    isAnnual && annualView === "chart" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AnnualBarChart, {
                        data: annualExpenseGroups,
                        color: "#E11D48"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 2570,
                        columnNumber: 11
                    }, this) : viewMode === "Unpaid Pasabuy" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DataTable, {
                        wide: true,
                        headers: [
                            "Date",
                            "Name",
                            "Balance",
                            "Pasabuyer",
                            "Status",
                            "DOP",
                            "Account Receiver"
                        ],
                        rows: visibleExpenseRecords.map((record)=>[
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"])(record.purchaseDate),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "expense-cell--unpaid",
                                    children: stripNotionTag(record.description)
                                }, `${record.id}-desc`, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2577,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "expense-cell--unpaid",
                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(record.pasabuyBalance)
                                }, `${record.id}-bal`, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2580,
                                    columnNumber: 15
                                }, this),
                                record.pasabuyer ?? "—",
                                record.pasabuyStatus ?? "—",
                                record.pasabuyDateOfPayment ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"])(record.pasabuyDateOfPayment) : "—",
                                accountNameById.get(record.pasabuyAccountReceiverId ?? "") ?? "—"
                            ]),
                        footerRows: [
                            [
                                "Total",
                                "",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(visibleExpenseRecords.reduce((sum, r)=>sum + (r.pasabuyBalance ?? 0), 0)),
                                "",
                                "",
                                "",
                                ""
                            ]
                        ],
                        onRowClick: (rowIndex)=>{
                            const record = visibleExpenseRecords[rowIndex];
                            if (record) {
                                openExpenseModal("edit", record.description, record.id);
                            }
                        }
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 2572,
                        columnNumber: 11
                    }, this) : viewMode === "Unpaid CC" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DataTable, {
                        wide: true,
                        headers: [
                            "Date",
                            "Description",
                            "Account",
                            "Amount",
                            "Category",
                            "Interest",
                            "Gross Amount",
                            "Remaining Balance",
                            "Payment Status",
                            "Expected payment date",
                            "Date Paid"
                        ],
                        rows: visibleExpenseRecords.map((record)=>{
                            const c = deriveExpenseComputed(record);
                            return [
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"])(record.purchaseDate),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "expense-cell--unpaid",
                                    children: stripNotionTag(record.description)
                                }, `${record.id}-desc`, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2628,
                                    columnNumber: 17
                                }, this),
                                accountNameById.get(record.accountId ?? "") ?? "—",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "expense-cell--unpaid",
                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(record.amount)
                                }, `${record.id}-amt`, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2632,
                                    columnNumber: 17
                                }, this),
                                expenseCategoryNameById.get(record.categoryId) ?? "—",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(record.interest ?? 0),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(c.gross),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(c.remaining),
                                record.paymentStatus ?? "—",
                                c.expected ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"])(c.expected) : "-",
                                record.datePaid ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"])(record.datePaid) : "-"
                            ];
                        }),
                        footerRows: [
                            [
                                "Total",
                                "",
                                "",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(visibleExpenseRecords.reduce((s, r)=>s + r.amount, 0)),
                                "",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(visibleExpenseRecords.reduce((s, r)=>s + (r.interest ?? 0), 0)),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(visibleExpenseRecords.reduce((s, r)=>s + deriveExpenseComputed(r).gross, 0)),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(visibleExpenseRecords.reduce((s, r)=>s + deriveExpenseComputed(r).remaining, 0)),
                                "",
                                "",
                                ""
                            ]
                        ],
                        onRowClick: (rowIndex)=>{
                            const record = visibleExpenseRecords[rowIndex];
                            if (record) {
                                openExpenseModal("edit", record.description, record.id);
                            }
                        }
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 2609,
                        columnNumber: 11
                    }, this) : viewMode === "Installments" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DataTable, {
                        wide: true,
                        headers: [
                            "Date",
                            "Description",
                            "Account",
                            "Amount",
                            "Category",
                            "Interest",
                            "Gross Amount",
                            "Period Count",
                            "Installment Amount",
                            "Paid Period",
                            "Paid Amount",
                            "Remaining Balance",
                            "Payment Status",
                            "Expected payment date",
                            "Date Paid"
                        ],
                        rows: visibleExpenseRecords.map((record)=>{
                            const c = deriveExpenseComputed(record);
                            return [
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"])(record.purchaseDate),
                                stripNotionTag(record.description),
                                accountNameById.get(record.accountId ?? "") ?? "—",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(record.amount),
                                expenseCategoryNameById.get(record.categoryId) ?? "—",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(record.interest ?? 0),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(c.gross),
                                record.periodCount ?? "—",
                                c.installment != null ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(c.installment) : "—",
                                record.paidPeriod ?? "—",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(c.paid),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(c.remaining),
                                record.paymentStatus ?? "—",
                                c.expected ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"])(c.expected) : "-",
                                record.datePaid ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"])(record.datePaid) : "-"
                            ];
                        }),
                        footerRows: [
                            [
                                "Total",
                                "",
                                "",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(visibleExpenseRecords.reduce((s, r)=>s + r.amount, 0)),
                                "",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(visibleExpenseRecords.reduce((s, r)=>s + (r.interest ?? 0), 0)),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(visibleExpenseRecords.reduce((s, r)=>s + deriveExpenseComputed(r).gross, 0)),
                                "",
                                "",
                                "",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(visibleExpenseRecords.reduce((s, r)=>s + deriveExpenseComputed(r).paid, 0)),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(visibleExpenseRecords.reduce((s, r)=>s + deriveExpenseComputed(r).remaining, 0)),
                                "",
                                "",
                                ""
                            ]
                        ],
                        onRowClick: (rowIndex)=>{
                            const record = visibleExpenseRecords[rowIndex];
                            if (record) {
                                openExpenseModal("edit", record.description, record.id);
                            }
                        }
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 2671,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DataTable, {
                        wide: true,
                        headers: [
                            "Date",
                            "Description",
                            "Amount",
                            "Account",
                            "Category",
                            "Date Paid"
                        ],
                        rows: visibleExpenseRecords.map((record)=>{
                            const isUnpaid = !record.datePaid;
                            return [
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"])(record.purchaseDate),
                                stripNotionTag(record.description),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(record.amount),
                                accountNameById.get(record.accountId ?? "") ?? "—",
                                expenseCategoryNameById.get(record.categoryId) ?? "—",
                                record.datePaid ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"])(record.datePaid) : "-"
                            ].map((cell, cellIndex)=>isUnpaid && (cellIndex === 1 || cellIndex === 2) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "expense-cell--unpaid",
                                    children: cell
                                }, `cell-${record.id}-${cellIndex}`, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2757,
                                    columnNumber: 19
                                }, this) : cell);
                        }),
                        footerRows: [
                            [
                                "Total",
                                "",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(getExpenseTotal(visibleExpenseRecords)),
                                "",
                                "",
                                ""
                            ]
                        ],
                        onRowClick: (rowIndex)=>{
                            const record = visibleExpenseRecords[rowIndex];
                            if (record) {
                                openExpenseModal("edit", record.description, record.id);
                            }
                        }
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 2743,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 2567,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FormModal, {
                deleteLabel: "Soft Delete",
                modal: modal,
                editing: editing,
                saving: saving,
                error: saveError,
                subtitle: "Context fields change from the selected account and category.",
                onEdit: ()=>setEditing(true),
                onSave: handleSaveExpense,
                onDelete: handleDeleteExpense,
                onDuplicate: handleDuplicateExpense,
                onClose: ()=>setModal(null),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "form-grid form-grid--single",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Purchase description",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                placeholder: "Purchase description",
                                value: descriptionInput,
                                onChange: (event)=>setDescriptionInput(event.target.value)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 2800,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2799,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Purchase Date",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "date",
                                value: purchaseDateInput,
                                onChange: (event)=>setPurchaseDateInput(event.target.value)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 2807,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2806,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Accounts",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: formAccountId,
                                onChange: (event)=>setFormAccountId(event.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "— None —"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 2815,
                                        columnNumber: 15
                                    }, this),
                                    activeAccounts.map((account)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: account.id,
                                            children: account.name
                                        }, account.id, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 2817,
                                            columnNumber: 17
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 2814,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2813,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Categories",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: formCategoryId,
                                onChange: (event)=>setFormCategoryId(event.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "— None —"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 2823,
                                        columnNumber: 15
                                    }, this),
                                    expenseCategories.map((category)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: category.id,
                                            children: category.name
                                        }, category.id, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 2825,
                                            columnNumber: 17
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 2822,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2821,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Expense Amount",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                inputMode: "decimal",
                                placeholder: "0.00",
                                value: expenseAmountInput,
                                onChange: (event)=>setExpenseAmountInput(event.target.value)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 2830,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2829,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Date Paid",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "date",
                                value: datePaidInput,
                                onChange: (event)=>setDatePaidInput(event.target.value)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 2838,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 2837,
                            columnNumber: 11
                        }, this),
                        sections.creditCard && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FormSectionDivider, {
                                    title: "CC Transaction"
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2846,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                    label: "Payment Status",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: paymentStatus,
                                        onChange: (event)=>setPaymentStatus(event.target.value),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "",
                                                children: "— None —"
                                            }, void 0, false, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 2852,
                                                columnNumber: 19
                                            }, this),
                                            __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["paymentStatusLabels"].map((status)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: status,
                                                    children: status
                                                }, status, false, {
                                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                    lineNumber: 2854,
                                                    columnNumber: 21
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 2848,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2847,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                    label: "Interest",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        inputMode: "decimal",
                                        placeholder: "0.00",
                                        value: interestInput,
                                        onChange: (event)=>setInterestInput(event.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 2859,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2858,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                                    label: "Gross Price",
                                    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(grossPrice)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2866,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                    label: "Payment Frequency",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: paymentFrequency,
                                        onChange: (event)=>setPaymentFrequency(event.target.value),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "",
                                                children: "— None —"
                                            }, void 0, false, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 2872,
                                                columnNumber: 19
                                            }, this),
                                            __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["paymentFrequencyLabels"].map((frequency)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: frequency,
                                                    children: frequency
                                                }, frequency, false, {
                                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                    lineNumber: 2874,
                                                    columnNumber: 21
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 2868,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2867,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                    label: "Period Count",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        inputMode: "numeric",
                                        placeholder: "0",
                                        value: periodCountInput,
                                        onChange: (event)=>setPeriodCountInput(event.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 2879,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2878,
                                    columnNumber: 15
                                }, this),
                                paymentStatus === "Installment" && installmentAmount !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                                    label: "Installment Amount",
                                    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(installmentAmount)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2887,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                    label: "Paid period",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        inputMode: "numeric",
                                        placeholder: "0",
                                        value: paidPeriodInput,
                                        onChange: (event)=>setPaidPeriodInput(event.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 2890,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2889,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                                    label: "Paid Amount",
                                    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(paidAmount)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2897,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                                    label: "Remaining Balance",
                                    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(remainingBalance)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2898,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                                    label: "Expected payment date",
                                    value: expectedPaymentDate ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"])(expectedPaymentDate) : "-"
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2899,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true),
                        sections.pasabuy && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FormSectionDivider, {
                                    title: "Pasabuy Transaction"
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2907,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                    label: "Pasabuyer",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: pasabuyer,
                                        onChange: (event)=>setPasabuyer(event.target.value),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "",
                                                children: "— None —"
                                            }, void 0, false, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 2910,
                                                columnNumber: 19
                                            }, this),
                                            __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pasabuyerLabels"].map((name)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: name,
                                                    children: name
                                                }, name, false, {
                                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                    lineNumber: 2912,
                                                    columnNumber: 21
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 2909,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2908,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                    label: "Pasabuy Status",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: pasabuyStatus,
                                        onChange: (event)=>setPasabuyStatus(event.target.value),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "",
                                                children: "— None —"
                                            }, void 0, false, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 2921,
                                                columnNumber: 19
                                            }, this),
                                            __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pasabuyStatusLabels"].map((status)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: status,
                                                    children: status
                                                }, status, false, {
                                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                    lineNumber: 2923,
                                                    columnNumber: 21
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 2917,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2916,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                    label: "Pasabuy Date of Payment",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "date",
                                        value: pasabuyDateOfPaymentInput,
                                        onChange: (event)=>setPasabuyDateOfPaymentInput(event.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 2928,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2927,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                    label: "Pasabuy Account Receiver",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: pasabuyAccountReceiverId,
                                        onChange: (event)=>setPasabuyAccountReceiverId(event.target.value),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "",
                                                children: "— None —"
                                            }, void 0, false, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 2939,
                                                columnNumber: 19
                                            }, this),
                                            activeAccounts.map((account)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: account.id,
                                                    children: account.name
                                                }, account.id, false, {
                                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                    lineNumber: 2941,
                                                    columnNumber: 21
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 2935,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2934,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                    label: "Pasabuy paid period",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        inputMode: "numeric",
                                        placeholder: "0",
                                        value: pasabuyPaidPeriodInput,
                                        onChange: (event)=>setPasabuyPaidPeriodInput(event.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 2946,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2945,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                                    label: "Pasabuy Received Amount",
                                    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(pasabuyReceivedAmount)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2953,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                                    label: "Pasabuyer Balance",
                                    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(pasabuyerBalance)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 2954,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 2798,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 2785,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 2491,
        columnNumber: 5
    }, this);
}
function WorkflowPage({ section, selectedMonth }) {
    const { nonCreditActiveAccounts, creditActiveAccounts, normalIncomeCategories, accountNameById, incomeCategoryNameById } = useLiveCollections();
    const fixedCategory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getWorkflowFixedCategory"])(section);
    const label = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getActiveSectionLabel"])(section);
    const isTransfer = section === "transfer";
    const isCreditCardPayment = section === "credit-card-payment";
    const isAlkansya = section === "alkansya";
    const isReceivables = section === "receivables";
    // Receivables have no fixed category; Alkansya defaults to Savings but the
    // user may change it to move the record out of the bucket into normal Income.
    const categoryEditable = isReceivables || isAlkansya;
    const savingsCategoryId = normalIncomeCategories.find((c)=>c.source.toLowerCase() === "savings")?.id ?? "";
    const sourceAccountLabel = isTransfer ? "Source Account" : isCreditCardPayment ? "CC Account" : isReceivables ? "Receiving Account" : "Accounts";
    const sourceAccountOptions = isCreditCardPayment ? creditActiveAccounts : nonCreditActiveAccounts;
    const secondaryAccountLabel = isTransfer ? "Transfer Account" : isCreditCardPayment ? "Payer Account" : null;
    const amountLabel = isTransfer ? "Transfer Amount" : isCreditCardPayment ? "Payment Amount" : isAlkansya ? "Savings Amount" : "Gross Income";
    const [modal, setModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [workflowNameInput, setWorkflowNameInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [workflowDateInput, setWorkflowDateInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [receivingAccountId, setReceivingAccountId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [transactedAccountId, setTransactedAccountId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [workflowCategoryIdInput, setWorkflowCategoryIdInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [workflowAmountInput, setWorkflowAmountInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [workflowCapitalExpenditureInput, setWorkflowCapitalExpenditureInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [editing, setEditing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [saveError, setSaveError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editingId, setEditingId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const workflowNetIncome = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateNetIncome"])(parseNumberInput(workflowAmountInput), parseNumberInput(workflowCapitalExpenditureInput));
    // Auto-update [YYMMDD] tag when date changes (new or edit mode).
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (modal?.mode !== "new" && modal?.mode !== "edit") return;
        const yyymmdd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toYYMMDD"])(workflowDateInput);
        if (!yyymmdd) return;
        setWorkflowNameInput((prev)=>applyIncomeTag(prev, yyymmdd));
    }, [
        workflowDateInput,
        modal?.mode
    ]);
    // Each workflow is the Incomes data source filtered server-side by its fixed
    // category (transfer→Transfer, credit-card-payment→Credit Card Payment,
    // alkansya→Savings) or, for receivables, by an empty receiving account.
    // Alkansya and Receivables are month-independent buckets — they show every
    // matching record so items can be triaged and updated later, so no month is
    // passed for them.
    const monthScoped = section === "transfer" || section === "credit-card-payment";
    const { state: workflowState, refetch } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$use$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWorkflowRecords"])(section, {
        month: monthScoped ? selectedMonth : undefined
    });
    const isLoading = workflowState.status === "loading";
    const workflowIncomes = (workflowState.status === "success" ? workflowState.data : []).filter((r)=>!r.name?.includes("[Deleted:"));
    const workflowApi = section === "transfer" ? __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["transfersApi"] : section === "credit-card-payment" ? __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["creditCardPaymentsApi"] : section === "alkansya" ? __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["alkansyaApi"] : __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["receivablesApi"];
    // Transfer has its own column layout (source + destination account and a
    // computed "Transferred Amount" = Amount × -1); the other workflows share a
    // simpler Name/Date/Account/Category/Amount table.
    const workflowHeaders = isTransfer ? [
        "Date",
        "Name",
        "Source Account",
        "Amount",
        "Transfer Account",
        "Transferred Amount"
    ] : isCreditCardPayment ? [
        "Date",
        "Name",
        "CC Account",
        "Amount",
        "Payer Account"
    ] : [
        "Name",
        "Date",
        sourceAccountLabel,
        "Category",
        "Amount"
    ];
    const workflowRows = workflowIncomes.map((record)=>{
        if (isTransfer) {
            return [
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"])(record.date),
                stripNotionTag(record.name),
                accountNameById.get(record.accountId ?? "") ?? "—",
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MoneyValue, {
                    value: record.grossIncome
                }, `${record.id}-amount`, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 3069,
                    columnNumber: 9
                }, this),
                accountNameById.get(record.transactedAccountId ?? "") ?? "—",
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MoneyValue, {
                    value: -record.grossIncome
                }, `${record.id}-transferred`, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 3071,
                    columnNumber: 9
                }, this)
            ];
        }
        if (isCreditCardPayment) {
            return [
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"])(record.date),
                stripNotionTag(record.name),
                accountNameById.get(record.accountId ?? "") ?? "—",
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MoneyValue, {
                    value: record.grossIncome
                }, `${record.id}-amount`, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 3079,
                    columnNumber: 9
                }, this),
                accountNameById.get(record.transactedAccountId ?? "") ?? "—"
            ];
        }
        return [
            stripNotionTag(record.name),
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"])(record.date),
            accountNameById.get(record.accountId ?? "") ?? "—",
            fixedCategory ?? incomeCategoryNameById.get(record.categoryId) ?? "—",
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(record.grossIncome)
        ];
    });
    function openWorkflowModal(mode, title, recordId) {
        const record = recordId != null ? workflowIncomes.find((r)=>r.id === recordId) : undefined;
        setWorkflowNameInput(record?.name ?? "");
        setWorkflowDateInput(record?.date ?? "");
        setReceivingAccountId(record?.accountId ?? "");
        setTransactedAccountId(record?.transactedAccountId ?? "");
        // New Alkansya records default to the Savings category (editable).
        setWorkflowCategoryIdInput(record?.categoryId ?? (isAlkansya ? savingsCategoryId : ""));
        setWorkflowAmountInput(record?.grossIncome?.toString() ?? "");
        setWorkflowCapitalExpenditureInput(record?.capitalExpenditure?.toString() ?? "");
        setEditingId(record?.id ?? null);
        setEditing(mode === "new");
        setSaveError(null);
        setModal({
            mode,
            title
        });
    }
    async function handleSaveWorkflow() {
        if (!workflowNameInput.trim() || !isReceivables && !workflowDateInput || !isReceivables && !isTransfer && !isCreditCardPayment && !receivingAccountId) {
            setSaveError("Name is required.");
            return;
        }
        const payload = {
            name: workflowNameInput.trim(),
            date: workflowDateInput,
            grossIncome: parseNumberInput(workflowAmountInput),
            capitalExpenditure: parseNumberInput(workflowCapitalExpenditureInput),
            accountId: receivingAccountId
        };
        // Transfer & CC Payment carry a transacted/payer account.
        if (secondaryAccountLabel) {
            payload.transactedAccountId = transactedAccountId || null;
        }
        // Receivables and Alkansya let the user choose/change the income category
        // (Alkansya defaults to Savings). Transfer & CC Payment stay locked to
        // their fixed category server-side (must NOT send categoryId).
        if (categoryEditable) {
            payload.categoryId = workflowCategoryIdInput;
        }
        setSaving(true);
        setSaveError(null);
        const res = modal?.mode === "edit" && editingId ? await workflowApi.update(editingId, payload) : await workflowApi.create(payload);
        setSaving(false);
        if (!res.success) {
            setSaveError(res.error.message || "Failed to save to Notion.");
            return;
        }
        setModal(null);
        await refetch();
    }
    function handleDuplicateWorkflow() {
        // Keep the loaded field values but detach from the source record so Save
        // creates a fresh record instead of updating the original.
        setEditingId(null);
        setEditing(true);
        setSaveError(null);
        setModal({
            mode: "new",
            title: `New ${label} Record (Copy)`
        });
    }
    async function handleDeleteWorkflow() {
        if (!editingId) return;
        if (!window.confirm(`Soft-delete this ${label} record in Notion?`)) return;
        setSaving(true);
        const res = await workflowApi.delete(editingId);
        setSaving(false);
        if (!res.success) {
            setSaveError(res.error.message || "Failed to delete.");
            return;
        }
        setModal(null);
        await refetch();
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "page-stack",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PageToolbar, {
                title: label,
                actions: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    className: "button button--primary",
                    onClick: ()=>openWorkflowModal("new", `New ${label} Record`),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                            size: 16
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3185,
                            columnNumber: 13
                        }, this),
                        "New Record"
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 3180,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 3177,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Panel, {
                title: "Records",
                children: [
                    isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LoadingBlock, {
                        label: "Querying Notion…"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3192,
                        columnNumber: 23
                    }, this),
                    workflowRows.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DataTable, {
                        headers: workflowHeaders,
                        rows: workflowRows,
                        onRowClick: (rowIndex)=>{
                            const record = workflowIncomes[rowIndex];
                            if (record) {
                                openWorkflowModal("edit", record.name, record.id);
                            }
                        }
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3194,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
                        title: monthScoped ? `No ${label.toLowerCase()} records this month` : `No ${label.toLowerCase()} records`,
                        detail: isReceivables ? "Receivables are income records that do not yet have a receiving account." : isAlkansya ? "Alkansya holds income records in the Savings category." : `No ${label} entries were found for ${getMonthLabel(selectedMonth)}.`
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3205,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 3191,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FormModal, {
                deleteLabel: "Soft Delete",
                modal: modal,
                editing: editing,
                saving: saving,
                error: saveError,
                subtitle: `${label} uses the same income-backed write path with workflow-only fields exposed.`,
                onEdit: ()=>setEditing(true),
                onSave: handleSaveWorkflow,
                onDelete: handleDeleteWorkflow,
                onDuplicate: handleDuplicateWorkflow,
                onClose: ()=>setModal(null),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "form-grid form-grid--single",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Name",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                placeholder: `${label} title`,
                                value: workflowNameInput,
                                onChange: (event)=>setWorkflowNameInput(event.target.value)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3233,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3232,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Date",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "date",
                                value: workflowDateInput,
                                onChange: (event)=>setWorkflowDateInput(event.target.value)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3240,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3239,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: amountLabel,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                inputMode: "decimal",
                                placeholder: isAlkansya ? "-0.00" : "0.00",
                                value: workflowAmountInput,
                                onChange: (event)=>setWorkflowAmountInput(event.target.value)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3247,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3246,
                            columnNumber: 11
                        }, this),
                        isReceivables && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Capital Expenditure",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                inputMode: "decimal",
                                placeholder: "0.00",
                                value: workflowCapitalExpenditureInput,
                                onChange: (event)=>setWorkflowCapitalExpenditureInput(event.target.value)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3256,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3255,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: sourceAccountLabel,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: receivingAccountId,
                                onChange: (event)=>setReceivingAccountId(event.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "— None —"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 3266,
                                        columnNumber: 15
                                    }, this),
                                    sourceAccountOptions.map((account)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: account.id,
                                            children: account.name
                                        }, account.id, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 3268,
                                            columnNumber: 17
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3265,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3264,
                            columnNumber: 11
                        }, this),
                        secondaryAccountLabel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: secondaryAccountLabel,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: transactedAccountId,
                                onChange: (event)=>setTransactedAccountId(event.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "— None —"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 3275,
                                        columnNumber: 17
                                    }, this),
                                    nonCreditActiveAccounts.map((account)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: account.id,
                                            children: account.name
                                        }, account.id, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 3277,
                                            columnNumber: 19
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3274,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3273,
                            columnNumber: 13
                        }, this),
                        !categoryEditable && fixedCategory ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                            label: "Categories",
                            value: fixedCategory
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3283,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Categories",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: workflowCategoryIdInput,
                                onChange: (event)=>setWorkflowCategoryIdInput(event.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "— None —"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 3287,
                                        columnNumber: 17
                                    }, this),
                                    normalIncomeCategories.map((category)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: category.id,
                                            children: category.source
                                        }, category.id, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 3289,
                                            columnNumber: 19
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3286,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3285,
                            columnNumber: 13
                        }, this),
                        isReceivables && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                            label: "Net Income",
                            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(workflowNetIncome),
                            valueTone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMoneyValueTone"])(workflowNetIncome)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3295,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 3231,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 3218,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 3176,
        columnNumber: 5
    }, this);
}
function MonthlyMonitoringPage({ selectedMonth }) {
    const [incomeCategoryView, setIncomeCategoryView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("table");
    const [expenseCategoryView, setExpenseCategoryView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("simplified");
    const [hideZeroIncomeCategories, setHideZeroIncomeCategories] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [zeroFilter, setZeroFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("all");
    const { normalIncomeCategories, expenseCategories } = useLiveCollections();
    const { state: incomesState } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$use$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useIncomes"])({
        month: selectedMonth
    });
    const { state: expensesState } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$use$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useExpenses"])({
        month: selectedMonth
    });
    // ── Forecast income (Monitoring-only, local, NOT written to Notion) ──────
    // Since real income lands mid/end of month, monthly income can read negative
    // beforehand. A forecast income temporarily props up Monthly Income here.
    // Persisted per-month in localStorage; removed once the real income is logged.
    const forecastKey = `nf_forecast_income_${selectedMonth}`;
    const [forecasts, setForecasts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [forecastModalOpen, setForecastModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [forecastLabel, setForecastLabel] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [forecastAmount, setForecastAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Load this month's forecasts from the local store when the month changes.
        let items = [];
        try {
            const raw = localStorage.getItem(forecastKey);
            if (raw) items = JSON.parse(raw);
        } catch  {
            items = [];
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForecasts(items);
    }, [
        forecastKey
    ]);
    function persistForecasts(next) {
        setForecasts(next);
        try {
            localStorage.setItem(forecastKey, JSON.stringify(next));
        } catch  {
        // ignore storage errors (private mode, quota)
        }
    }
    function addForecast() {
        const amount = parseNumberInput(forecastAmount);
        if (!amount) return;
        persistForecasts([
            ...forecasts,
            {
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                label: forecastLabel.trim() || "Forecast income",
                amount
            }
        ]);
        setForecastLabel("");
        setForecastAmount("");
        setForecastModalOpen(false);
    }
    function removeForecast(id) {
        persistForecasts(forecasts.filter((f)=>f.id !== id));
    }
    const forecastTotal = forecasts.reduce((sum, f)=>sum + f.amount, 0);
    const scopedIncomeRecords = (incomesState.status === "success" ? incomesState.data : []).filter((record)=>!record.name?.includes("[Deleted:"));
    const scopedExpenseRecords = (expensesState.status === "success" ? expensesState.data : []).filter((record)=>!record.description?.includes("[Deleted:"));
    const monthlyGrossIncome = getIncomeGrossTotal(scopedIncomeRecords);
    const monthlyCapitalExpenditure = getIncomeCapitalExpenditureTotal(scopedIncomeRecords);
    // Forecast income only lifts the Monitoring metrics, never the dashboard.
    const monthlyIncome = monthlyGrossIncome + forecastTotal;
    // Pasabuy expenses are fronted for others ("pinasabay lang"), so they are
    // excluded from the user's own Monthly Expense.
    const pasabuyCategoryIds = new Set(expenseCategories.filter((c)=>/pasabuy/i.test(c.name)).map((c)=>c.id));
    const ownExpenseRecords = scopedExpenseRecords.filter((record)=>!pasabuyCategoryIds.has(record.categoryId));
    const monthlyExpense = getExpenseTotal(ownExpenseRecords);
    const grossMargin = monthlyIncome - monthlyExpense;
    const monitoring = {
        month: selectedMonth,
        monthlyIncome,
        monthlyGrossIncome,
        monthlyCapitalExpenditure,
        monthlyExpense,
        grossMargin,
        forNeeds: monthlyIncome * 0.5,
        forWants: monthlyIncome * 0.3,
        forSavings: monthlyIncome * 0.2
    };
    const incomeCategorySummaries = getIncomeCategorySummaries(scopedIncomeRecords, normalIncomeCategories);
    const visibleIncomeCategorySummaries = hideZeroIncomeCategories ? incomeCategorySummaries.filter((category)=>category.grossIncome !== 0) : incomeCategorySummaries;
    const expenseCategorySummaries = getExpenseCategorySummaries(scopedExpenseRecords, expenseCategories);
    const visibleExpenseCategorySummaries = expenseCategorySummaries.filter((category)=>{
        if (zeroFilter === "hide-both" && category.monthlyBudget === 0 && category.spending === 0) return false;
        if (zeroFilter === "hide-budget" && category.monthlyBudget === 0) return false;
        if (zeroFilter === "hide-spending" && category.spending === 0) return false;
        return true;
    });
    const incomeNetTotal = getIncomeNetTotal(scopedIncomeRecords);
    const incomeGrossTotal = getIncomeGrossTotal(scopedIncomeRecords);
    const incomeCapitalExpenditureTotal = getIncomeCapitalExpenditureTotal(scopedIncomeRecords);
    const monthlyBudgetTotal = expenseCategorySummaries.reduce((sum, category)=>sum + category.monthlyBudget, 0);
    const budgetSpendingTotal = expenseCategorySummaries.reduce((sum, category)=>sum + category.spending, 0);
    const remainingTotal = expenseCategorySummaries.reduce((sum, category)=>sum + category.remaining, 0);
    // Expose this view's DOM to the FAB so it can capture a Monthly Insight Shot.
    const { setInsight } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$fab$2d$export$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useFabRegister"])();
    const captureRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setInsight({
            monthLabel: getMonthLabel(selectedMonth),
            getNode: ()=>captureRef.current
        });
        return ()=>setInsight(null);
    }, [
        selectedMonth,
        setInsight
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "page-stack",
        ref: captureRef,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PageToolbar, {
                title: "Monthly Monitoring",
                actions: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    className: cx("button button--primary", __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$export$2d$node$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHOT_HIDE_CLASS"]),
                    onClick: ()=>setForecastModalOpen(true),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                            size: 16
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3460,
                            columnNumber: 13
                        }, this),
                        "Add Forecast Income"
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 3455,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 3452,
                columnNumber: 7
            }, this),
            forecasts.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "forecast-banner",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "forecast-banner__icon",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                            size: 16
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3468,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3467,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "forecast-banner__body",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "forecast-banner__title",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Forecast income"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 3472,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "forecast-banner__tag",
                                        children: "Monitoring only"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 3473,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3471,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "forecast-banner__items",
                                children: forecasts.map((f)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "forecast-chip",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "forecast-chip__label",
                                                children: f.label
                                            }, void 0, false, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 3478,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "forecast-chip__amount",
                                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(f.amount)
                                            }, void 0, false, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 3479,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                "aria-label": `Remove ${f.label}`,
                                                onClick: ()=>removeForecast(f.id),
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                                    size: 12
                                                }, void 0, false, {
                                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                    lineNumber: 3485,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 3480,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, f.id, true, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 3477,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3475,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3470,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "forecast-banner__total",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Applied"
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3492,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(forecastTotal)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3493,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3491,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 3466,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "metric-grid",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                        title: "Monthly Income",
                        value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(monitoring.monthlyIncome),
                        detail: forecastTotal ? `${getMonthLabel(selectedMonth)} · incl. ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(forecastTotal, {
                            compact: true
                        })} forecast` : getMonthLabel(selectedMonth),
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpRight$3e$__["ArrowUpRight"],
                        tone: "green"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3498,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                        title: "Monthly Expense",
                        value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(monitoring.monthlyExpense),
                        detail: getMonthLabel(selectedMonth),
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$receipt$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Receipt$3e$__["Receipt"],
                        tone: "rose"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3509,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                        title: "Gross Margin",
                        value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(monitoring.grossMargin),
                        detail: "Income less expenses",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$dollar$2d$sign$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CircleDollarSign$3e$__["CircleDollarSign"],
                        tone: "blue"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3510,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                        title: "For Savings",
                        value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(monitoring.forSavings),
                        detail: "30% allocation",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$piggy$2d$bank$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PiggyBank$3e$__["PiggyBank"],
                        tone: "amber"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3511,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 3497,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "two-column",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Panel, {
                        title: "Budget Allocation",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(BudgetRow, {
                                label: "Needs",
                                percent: 50,
                                amount: monitoring.forNeeds
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3515,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(BudgetRow, {
                                label: "Wants",
                                percent: 30,
                                amount: monitoring.forWants
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3516,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(BudgetRow, {
                                label: "Savings",
                                percent: 20,
                                amount: monitoring.forSavings
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3517,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3514,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Panel, {
                        title: "Monthly Insight",
                        children: (()=>{
                            const setBudget = monitoring.forNeeds + monitoring.forWants;
                            // On track when actual spending stays within the Needs+Wants budget.
                            const onTrack = monitoring.monthlyExpense <= setBudget;
                            const difference = Math.abs(setBudget - monitoring.monthlyExpense);
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: cx("insight", onTrack ? "insight--good" : "insight--bad"),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "insight__icon",
                                        children: onTrack ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$smile$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Smile$3e$__["Smile"], {
                                            size: 40
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 3528,
                                            columnNumber: 30
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$frown$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Frown$3e$__["Frown"], {
                                            size: 40
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 3528,
                                            columnNumber: 52
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 3527,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "insight__body",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "insight__budget",
                                                children: [
                                                    "Total Set Budget: ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(setBudget)
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 3532,
                                                        columnNumber: 39
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 3531,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "insight__message",
                                                children: onTrack ? `You spent ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(difference)} less than your set budget this month — you're on track!` : `You've exceeded your set budget by ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(difference)}.`
                                            }, void 0, false, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 3534,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 3530,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3526,
                                columnNumber: 15
                            }, this);
                        })()
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3519,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 3513,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Panel, {
                title: "Income Portfolio",
                action: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: cx("panel-header-actions", __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$export$2d$node$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHOT_HIDE_CLASS"]),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SegmentedControl, {
                            label: "Income category view",
                            options: [
                                {
                                    label: "Table",
                                    value: "table"
                                },
                                {
                                    label: "Chart",
                                    value: "chart"
                                },
                                {
                                    label: "Cards",
                                    value: "cards"
                                }
                            ],
                            value: incomeCategoryView,
                            onChange: setIncomeCategoryView
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3550,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FilterToggle, {
                            label: "Hide zero gross",
                            checked: hideZeroIncomeCategories,
                            onChange: setHideZeroIncomeCategories
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3560,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 3549,
                    columnNumber: 11
                }, this),
                children: [
                    incomeCategoryView === "table" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DataTable, {
                        headers: [
                            "Income Type",
                            "Gross Income",
                            "Expenditure",
                            "Net Income",
                            "Earning Percentage"
                        ],
                        rows: visibleIncomeCategorySummaries.map((category)=>[
                                category.source,
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(category.grossIncome),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(category.capitalExpenditure),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MoneyValue, {
                                    value: category.netIncome
                                }, `${category.id}-net`, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3575,
                                    columnNumber: 15
                                }, this),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatPercent"])(category.earningPercentage)
                            ]),
                        footerRows: [
                            [
                                "Total",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(incomeGrossTotal),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(incomeCapitalExpenditureTotal),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(incomeNetTotal),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatPercent"])(incomeNetTotal > 0 ? 100 : 0)
                            ]
                        ]
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3569,
                        columnNumber: 11
                    }, this),
                    incomeCategoryView === "chart" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CategoryDonutChart, {
                        data: visibleIncomeCategorySummaries.map((category, index)=>({
                                name: category.source,
                                value: Math.max(category.netIncome, 0),
                                color: categoryPalette[index % categoryPalette.length]
                            }))
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3590,
                        columnNumber: 11
                    }, this),
                    incomeCategoryView === "cards" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "category-grid",
                        children: visibleIncomeCategorySummaries.map((category)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CategoryCard, {
                                title: category.source,
                                detail: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatPercent"])(category.earningPercentage),
                                value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(category.netIncome)
                            }, category.id, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3601,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3599,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 3546,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Panel, {
                title: "Monthly Budget",
                action: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: cx("panel-header-actions", __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$export$2d$node$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHOT_HIDE_CLASS"]),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SegmentedControl, {
                            label: "Expense category view",
                            options: [
                                {
                                    label: "Simplified",
                                    value: "simplified"
                                },
                                {
                                    label: "MB Breakdown",
                                    value: "breakdown"
                                },
                                {
                                    label: "Chart",
                                    value: "chart"
                                },
                                {
                                    label: "Cards",
                                    value: "cards"
                                }
                            ],
                            value: expenseCategoryView,
                            onChange: setExpenseCategoryView
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3616,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FilterSelect, {
                            placeholder: "Show All",
                            placeholderDisabled: false,
                            value: zeroFilter,
                            onChange: (value)=>setZeroFilter(value),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: "hide-both",
                                    children: "Hide Zero Spending & Budget"
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3633,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: "hide-spending",
                                    children: "Hide Zero Spending"
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3634,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: "hide-budget",
                                    children: "Hide Zero Budget"
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3635,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3627,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 3615,
                    columnNumber: 11
                }, this),
                children: [
                    expenseCategoryView === "simplified" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DataTable, {
                        headers: [
                            "Expense category",
                            "Monthly Budget",
                            "Spending",
                            "Remaining"
                        ],
                        rows: visibleExpenseCategorySummaries.map((category)=>[
                                category.name,
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(category.monthlyBudget),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(category.spending),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(category.remaining)
                            ]),
                        footerRows: [
                            [
                                "Total",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(monthlyBudgetTotal),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(budgetSpendingTotal),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(remainingTotal)
                            ]
                        ]
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3641,
                        columnNumber: 11
                    }, this),
                    expenseCategoryView === "breakdown" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DataTable, {
                        headers: [
                            "Expense category",
                            "Monthly Budget",
                            "Spending",
                            "Remaining",
                            "Overview",
                            "Total Overview"
                        ],
                        rows: visibleExpenseCategorySummaries.map((category)=>[
                                category.name,
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(category.monthlyBudget),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(category.spending),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(category.remaining),
                                category.overview,
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatPercent"])(category.totalOverview)
                            ]),
                        footerRows: [
                            [
                                "Total",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(monthlyBudgetTotal),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(budgetSpendingTotal),
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(remainingTotal),
                                "",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatPercent"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateCategoryTotalOverview"])(budgetSpendingTotal, monitoring.monthlyExpense))
                            ]
                        ]
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3655,
                        columnNumber: 11
                    }, this),
                    expenseCategoryView === "chart" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CategoryDonutChart, {
                        data: visibleExpenseCategorySummaries.map((category, index)=>({
                                name: category.name,
                                value: category.spending,
                                color: categoryPalette[index % categoryPalette.length]
                            }))
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3685,
                        columnNumber: 11
                    }, this),
                    expenseCategoryView === "cards" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "category-grid",
                        children: visibleExpenseCategorySummaries.map((category)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CategoryCard, {
                                title: category.name,
                                detail: `Remaining ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(category.remaining, {
                                    compact: true
                                })}`,
                                value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(category.monthlyBudget, {
                                    compact: true
                                })
                            }, category.id, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3696,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3694,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 3612,
                columnNumber: 7
            }, this),
            forecastModalOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "modal-backdrop",
                role: "presentation",
                onMouseDown: (event)=>{
                    if (event.target === event.currentTarget) setForecastModalOpen(false);
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                    "aria-labelledby": "forecast-modal-title",
                    "aria-modal": "true",
                    className: "modal-panel modal-panel--narrow",
                    role: "dialog",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "modal-panel__header",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            id: "forecast-modal-title",
                                            children: "Add Forecast Income"
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 3723,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: "Temporary, Monitoring-only. Not saved to Notion."
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 3724,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3722,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "icon-button",
                                    "aria-label": "Close modal",
                                    onClick: ()=>setForecastModalOpen(false),
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                        size: 17
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 3732,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3726,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3721,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "modal-panel__body",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "form-grid form-grid--single",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                        label: "Label",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            placeholder: "e.g. Salary (15th)",
                                            value: forecastLabel,
                                            onChange: (event)=>setForecastLabel(event.target.value)
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 3738,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 3737,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                        label: "Amount",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            inputMode: "decimal",
                                            placeholder: "0.00",
                                            value: forecastAmount,
                                            onChange: (event)=>setForecastAmount(event.target.value),
                                            onKeyDown: (event)=>{
                                                if (event.key === "Enter") addForecast();
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 3745,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 3744,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3736,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3735,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "modal-panel__footer",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "button",
                                    onClick: ()=>setForecastModalOpen(false),
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3758,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "button button--primary",
                                    onClick: addForecast,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                            size: 16
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 3762,
                                            columnNumber: 17
                                        }, this),
                                        "Add Forecast"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3761,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3757,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 3715,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 3708,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 3451,
        columnNumber: 5
    }, this);
}
function SyncPage({ lastSync, pendingOperations, schemaHealth, syncState, onSchemaVerify, onSync }) {
    const { state: syncStatusState } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$use$2d$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSyncStatus"])();
    // Use API sync status when available, fall back to parent props
    const apiStatus = syncStatusState.status === "success" ? syncStatusState.data : null;
    const displayLastSync = apiStatus?.lastSyncAt?.replace("T", " ").slice(0, 16) ?? lastSync;
    const displayPending = apiStatus?.pendingOperations ?? pendingOperations;
    const displayFailed = apiStatus?.failedOperations ?? 1;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "page-stack",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "metric-grid",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                        title: "Last Successful Sync",
                        value: displayLastSync.split(" ")[1] || "-",
                        detail: displayLastSync.split(" ")[0] || "-",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"],
                        tone: "blue"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3803,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                        title: "Pending Operations",
                        value: `${displayPending}`,
                        detail: "Queued changes",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardCheck$3e$__["ClipboardCheck"],
                        tone: "amber"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3804,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                        title: "Failed Operations",
                        value: `${displayFailed}`,
                        detail: "Needs review",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"],
                        tone: "rose"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3805,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MetricCard, {
                        title: "Schema Health",
                        value: schemaHealth === "warning" ? "Review" : schemaHealth === "verified" ? "Verified" : "Unchecked",
                        detail: "/api/v1/system/schema-status",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__["Database"],
                        tone: "green"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3806,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 3802,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "two-column",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Panel, {
                        title: "Sync Actions",
                        action: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                            syncState: syncState,
                            schemaHealth: schemaHealth
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3809,
                            columnNumber: 45
                        }, this),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "action-list",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "button button--primary",
                                        onClick: onSync,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                                size: 16,
                                                className: syncState === "syncing" ? "spin" : undefined
                                            }, void 0, false, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 3812,
                                                columnNumber: 15
                                            }, this),
                                            "Commit Queue"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 3811,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "button",
                                        onClick: onSchemaVerify,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__["ShieldCheck"], {
                                                size: 16
                                            }, void 0, false, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 3816,
                                                columnNumber: 15
                                            }, this),
                                            "Verify Schema"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 3815,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3810,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "snapshot-card",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "snapshot-card__title",
                                        children: "Refresh Source"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 3821,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "Local optimistic state is replaced by the fresh backend snapshot after direct-save or queued sync."
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 3822,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 3820,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3809,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Panel, {
                        title: "Errors",
                        action: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Badge, {
                            tone: "amber",
                            children: "User safe"
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3825,
                            columnNumber: 39
                        }, this),
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "error-list",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ErrorRow, {
                                    code: "VALIDATION_ERROR",
                                    detail: "Expense Amount is required."
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3827,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ErrorRow, {
                                    code: "SCHEMA_DRIFT_DETECTED",
                                    detail: "Payment Status option changed."
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3828,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ErrorRow, {
                                    code: "CONFLICT_ERROR",
                                    detail: "Record changed after the app loaded it."
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3829,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ErrorRow, {
                                    code: "NOTION_RATE_LIMITED",
                                    detail: "Retry after the backend cooldown."
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3830,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ErrorRow, {
                                    code: "FORBIDDEN",
                                    detail: "The signed-in user cannot sync this resource."
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3831,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3826,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3825,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 3808,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Panel, {
                title: "Activity Log",
                action: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Badge, {
                    tone: "neutral",
                    children: "0 entries"
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 3835,
                    columnNumber: 43
                }, this),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "activity-list",
                    children: [].map((entry)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "activity-row",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Badge, {
                                    tone: entry.type === "error" || entry.type === "conflict" ? "amber" : "blue",
                                    children: entry.type
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3839,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: entry.resource
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 3843,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: entry.description
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 3844,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3842,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("time", {
                                    children: entry.timestamp
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3846,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, entry.id, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3838,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 3836,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 3835,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 3801,
        columnNumber: 5
    }, this);
}
const KNOWN_DB_ID_KEYS = [
    {
        key: "accounts",
        label: "Accounts"
    },
    {
        key: "incomeCategories",
        label: "Income Portfolio"
    },
    {
        key: "incomes",
        label: "Incomes"
    },
    {
        key: "expenseCategories",
        label: "Expense Categories"
    },
    {
        key: "expenses",
        label: "Expenses"
    },
    {
        key: "monthlyMonitoring",
        label: "Monthly Monitoring"
    }
];
function SettingsPage({ schemaHealth, onSchemaVerify, showFab, onShowFabChange }) {
    const { user, loading, logout } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const [modal, setModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const { mode, primaryColor, secondaryColor, setMode, setPrimaryColor, setSecondaryColor } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$theme$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTheme"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "page-stack",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Panel, {
                title: "Interface",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "settings-row",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "settings-toggle__title",
                                    children: "Quick-action button"
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3886,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "settings-toggle__hint",
                                    children: "Show a floating button for adding income/expense and printing receipts or monthly insights."
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3887,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3885,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: cx("switch", showFab && "switch--on"),
                            "aria-label": "Toggle quick-action button",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "checkbox",
                                    checked: showFab,
                                    onChange: (event)=>onShowFabChange(event.target.checked)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3896,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "switch__track",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "switch__thumb"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 3901,
                                        columnNumber: 45
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3901,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3892,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 3884,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 3883,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Panel, {
                title: "Theme",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "settings-row",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "settings-toggle__title",
                                    children: "Appearance & Colors"
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3908,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "settings-toggle__hint",
                                    children: [
                                        "Click here to",
                                        " ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            className: "settings-inline-link",
                                            onClick: ()=>setModal("theme"),
                                            children: "customize"
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 3911,
                                            columnNumber: 15
                                        }, this),
                                        " ",
                                        "your appearance settings."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3909,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3907,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "button",
                            onClick: ()=>setModal("theme"),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$palette$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Palette$3e$__["Palette"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3926,
                                    columnNumber: 13
                                }, this),
                                "Customize"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3921,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 3906,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 3905,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "two-column",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Panel, {
                        title: "Account",
                        action: user ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Badge, {
                            tone: "green",
                            children: user.email
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3936,
                            columnNumber: 17
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Badge, {
                            tone: "neutral",
                            children: "Not signed in"
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3937,
                            columnNumber: 17
                        }, this),
                        children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: "Loading..."
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3941,
                            columnNumber: 13
                        }, this) : user ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-grid form-grid--single",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                    label: "Name",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        value: user.name,
                                        readOnly: true
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 3944,
                                        columnNumber: 35
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3944,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                    label: "Email",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        value: user.email,
                                        readOnly: true
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 3945,
                                        columnNumber: 36
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3945,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "settings-actions",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            className: "button",
                                            onClick: ()=>setModal("email"),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__["Mail"], {
                                                    size: 16
                                                }, void 0, false, {
                                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                    lineNumber: 3948,
                                                    columnNumber: 19
                                                }, this),
                                                "Change Email"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 3947,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            className: "button",
                                            onClick: ()=>setModal("password"),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$key$2d$round$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__KeyRound$3e$__["KeyRound"], {
                                                    size: 16
                                                }, void 0, false, {
                                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                    lineNumber: 3952,
                                                    columnNumber: 19
                                                }, this),
                                                "Change Password"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 3951,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            className: "button",
                                            onClick: logout,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                                    size: 16
                                                }, void 0, false, {
                                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                    lineNumber: 3956,
                                                    columnNumber: 19
                                                }, this),
                                                "Sign Out"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 3955,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3946,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3943,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "auth-preview",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/login",
                                    className: "button button--primary",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2d$keyhole$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LockKeyhole$3e$__["LockKeyhole"], {
                                            size: 16
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 3964,
                                            columnNumber: 17
                                        }, this),
                                        "Sign In"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3963,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/register",
                                    className: "button",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__["ShieldCheck"], {
                                            size: 16
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 3968,
                                            columnNumber: 17
                                        }, this),
                                        "Create Account"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3967,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3962,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3932,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Panel, {
                        title: "Schema",
                        action: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                            syncState: "idle",
                            schemaHealth: schemaHealth
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3974,
                            columnNumber: 39
                        }, this),
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-grid form-grid--single",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                    label: "Backend API Base Path",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        value: "/api/v1",
                                        readOnly: true
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 3977,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3976,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                                    label: "Token Storage",
                                    value: "Backend only (AES-256-GCM encrypted)"
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3979,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                                    label: "Database Mapping",
                                    value: "Per-user Notion configuration"
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3980,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "button button--primary",
                                    onClick: onSchemaVerify,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__["Database"], {
                                            size: 16
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 3982,
                                            columnNumber: 15
                                        }, this),
                                        "Verify Schema"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3981,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3975,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 3974,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 3931,
                columnNumber: 7
            }, this),
            user && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Panel, {
                title: "Notion Configuration",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "settings-row",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: "Your Notion integration token and database IDs are stored encrypted on the backend."
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3992,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "button button--primary",
                            onClick: ()=>setModal("notion"),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__["Database"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 3994,
                                    columnNumber: 15
                                }, this),
                                "Manage Configuration"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 3993,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 3991,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 3990,
                columnNumber: 9
            }, this),
            user && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Panel, {
                title: "Danger Zone",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "settings-row settings-row--danger",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: "Permanently delete your account and all associated data. This cannot be undone."
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4004,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "button button--danger",
                            onClick: ()=>setModal("delete"),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4006,
                                    columnNumber: 15
                                }, this),
                                "Delete Account"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4005,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4003,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4002,
                columnNumber: 9
            }, this),
            modal === "notion" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(NotionConfigModal, {
                onClose: ()=>setModal(null)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4013,
                columnNumber: 30
            }, this),
            modal === "email" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ChangeEmailModal, {
                onClose: ()=>setModal(null)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4014,
                columnNumber: 29
            }, this),
            modal === "password" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ChangePasswordModal, {
                onClose: ()=>setModal(null)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4015,
                columnNumber: 32
            }, this),
            modal === "delete" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DeleteAccountModal, {
                onClose: ()=>setModal(null)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4016,
                columnNumber: 30
            }, this),
            modal === "theme" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ThemeCustomizeModal, {
                onClose: ()=>setModal(null)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4017,
                columnNumber: 29
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 3882,
        columnNumber: 5
    }, this);
}
function ThemeCustomizeModal({ onClose }) {
    const { mode, primaryColor, secondaryColor, setMode, setPrimaryColor, setSecondaryColor } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$theme$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTheme"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SettingsModal, {
        title: "Customize Theme",
        subtitle: "Personalize your appearance and accent colors.",
        onClose: onClose,
        footer: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "button",
            className: "button button--primary",
            onClick: onClose,
            children: "Done"
        }, void 0, false, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 4032,
            columnNumber: 9
        }, this),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "theme-modal-grid",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "theme-modal-section",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "settings-toggle__title",
                            children: "Appearance"
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4039,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "settings-toggle__hint",
                            children: "Choose light, dark, or follow your system setting."
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4040,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                            className: "settings-select",
                            value: mode,
                            onChange: (e)=>setMode(e.target.value),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: "light",
                                    children: "Light"
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4048,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: "dark",
                                    children: "Dark"
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4049,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: "system",
                                    children: "System"
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4050,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4043,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4038,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "theme-modal-section",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "settings-toggle__title",
                            children: "Colors"
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4054,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "settings-toggle__hint",
                            children: "Customize accent colors applied globally."
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4055,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "theme-color-pickers",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "theme-color-picker-group",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "settings-color-label",
                                            children: "Primary"
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 4060,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$components$2f$color$2d$picker$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ColorPicker"], {
                                            value: primaryColor,
                                            onChange: setPrimaryColor
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 4061,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4059,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "theme-color-picker-group",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "settings-color-label",
                                            children: "Secondary"
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 4064,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$components$2f$color$2d$picker$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ColorPicker"], {
                                            value: secondaryColor,
                                            onChange: setSecondaryColor
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 4065,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4063,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4058,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4053,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 4037,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4027,
        columnNumber: 5
    }, this);
}
function SettingsModal({ title, subtitle, onClose, children, footer }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "modal-backdrop",
        role: "presentation",
        onMouseDown: (event)=>{
            if (event.target === event.currentTarget) onClose();
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            className: "modal-panel",
            role: "dialog",
            "aria-modal": "true",
            "aria-label": title,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "modal-panel__header",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    children: title
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4098,
                                    columnNumber: 13
                                }, this),
                                subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: subtitle
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4099,
                                    columnNumber: 26
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4097,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "icon-button",
                            "aria-label": "Close",
                            onClick: onClose,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                size: 17
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 4102,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4101,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4096,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "modal-panel__body",
                    children: children
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4105,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "modal-panel__footer",
                    children: footer
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4106,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 4095,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4088,
        columnNumber: 5
    }, this);
}
function NotionConfigModal({ onClose }) {
    const [notionToken, setNotionToken] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [dbIds, setDbIds] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [notice, setNotice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let cancelled = false;
        __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["userNotionConfigApi"].get().then((res)=>{
            if (cancelled || !res.success || !res.data.configured) return;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["startTransition"])(()=>{
                setNotionToken(res.data.tokenConfigured ? "stored" : "");
                setDbIds(res.data.dbIds);
            });
        });
        return ()=>{
            cancelled = true;
        };
    }, []);
    function setDbId(key, value) {
        setDbIds((prev)=>({
                ...prev,
                [key]: value.trim()
            }));
    }
    async function handleSave() {
        setSaving(true);
        setError(null);
        setNotice(null);
        const token = notionToken === "stored" ? undefined : notionToken;
        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["userNotionConfigApi"].save({
            token: token || undefined,
            dbIds
        });
        setSaving(false);
        if (res.success) {
            setNotice("Configuration saved.");
            setNotionToken(token ? "stored" : notionToken === "stored" ? "stored" : "");
        } else {
            setError(res.error.message);
        }
    }
    async function handleRemove() {
        if (!window.confirm("Remove your Notion configuration?")) return;
        setSaving(true);
        setError(null);
        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["userNotionConfigApi"].remove();
        setSaving(false);
        if (res.success) {
            setNotionToken("");
            setDbIds({});
            setNotice("Configuration removed.");
        } else {
            setError(res.error.message);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SettingsModal, {
        title: "Notion Configuration",
        subtitle: "View, edit, or remove your Notion token and database IDs.",
        onClose: onClose,
        footer: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    className: "button",
                    onClick: handleRemove,
                    disabled: saving,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                            size: 16
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4175,
                            columnNumber: 13
                        }, this),
                        "Remove"
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4174,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    className: "button button--primary",
                    onClick: handleSave,
                    disabled: saving,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                            size: 16
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4179,
                            columnNumber: 13
                        }, this),
                        saving ? "Saving…" : "Save"
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4178,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "form-grid form-grid--single",
            children: [
                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "auth-form__error",
                    children: error
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4186,
                    columnNumber: 19
                }, this),
                notice && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "auth-form__notice",
                    children: notice
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4187,
                    columnNumber: 20
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                    label: "Notion Integration Token",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "password",
                        value: notionToken,
                        onChange: (e)=>setNotionToken(e.target.value),
                        placeholder: notionToken === "stored" ? "Stored — enter new to replace" : "ntn_…",
                        autoComplete: "off"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 4189,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4188,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FormSectionDivider, {
                    title: "Database IDs"
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4197,
                    columnNumber: 9
                }, this),
                KNOWN_DB_ID_KEYS.map(({ key, label })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                        label: `${label} Database ID`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            value: dbIds[key] ?? "",
                            onChange: (e)=>setDbId(key, e.target.value),
                            placeholder: `${key} database ID`,
                            spellCheck: false,
                            autoComplete: "off"
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4200,
                            columnNumber: 13
                        }, this)
                    }, key, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 4199,
                        columnNumber: 11
                    }, this))
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 4185,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4168,
        columnNumber: 5
    }, this);
}
function ChangeEmailModal({ onClose }) {
    const { user, changeEmail } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const [newEmail, setNewEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [currentPassword, setCurrentPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [done, setDone] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    async function submit() {
        if (!newEmail.trim() || !currentPassword) {
            setError("New email and current password are required.");
            return;
        }
        setBusy(true);
        setError(null);
        const res = await changeEmail(currentPassword, newEmail.trim());
        setBusy(false);
        if (res.ok) setDone(true);
        else setError(res.error ?? "Failed to change email.");
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SettingsModal, {
        title: "Change Email",
        subtitle: `Current: ${user?.email ?? ""}`,
        onClose: onClose,
        footer: done ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "button",
            className: "button button--primary",
            onClick: onClose,
            children: "Done"
        }, void 0, false, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 4242,
            columnNumber: 11
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "button",
            className: "button button--primary",
            onClick: submit,
            disabled: busy,
            children: busy ? "Saving…" : "Update Email"
        }, void 0, false, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 4244,
            columnNumber: 11
        }, this),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "form-grid form-grid--single",
            children: [
                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "auth-form__error",
                    children: error
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4251,
                    columnNumber: 19
                }, this),
                done ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "auth-form__notice",
                    children: [
                        "Email updated to ",
                        user?.email,
                        "."
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4253,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "New Email",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "email",
                                value: newEmail,
                                onChange: (e)=>setNewEmail(e.target.value),
                                autoComplete: "off"
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 4257,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4256,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Current Password",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "password",
                                value: currentPassword,
                                onChange: (e)=>setCurrentPassword(e.target.value),
                                autoComplete: "current-password"
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 4260,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4259,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true)
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 4250,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4236,
        columnNumber: 5
    }, this);
}
function ChangePasswordModal({ onClose }) {
    const { changePassword } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const [currentPassword, setCurrentPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [newPassword, setNewPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [confirm, setConfirm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [done, setDone] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    async function submit() {
        if (!currentPassword || !newPassword) {
            setError("Current and new password are required.");
            return;
        }
        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters.");
            return;
        }
        if (newPassword !== confirm) {
            setError("New password and confirmation do not match.");
            return;
        }
        setBusy(true);
        setError(null);
        const res = await changePassword(currentPassword, newPassword);
        setBusy(false);
        if (res.ok) setDone(true);
        else setError(res.error ?? "Failed to change password.");
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SettingsModal, {
        title: "Change Password",
        onClose: onClose,
        footer: done ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "button",
            className: "button button--primary",
            onClick: onClose,
            children: "Done"
        }, void 0, false, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 4305,
            columnNumber: 11
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "button",
            className: "button button--primary",
            onClick: submit,
            disabled: busy,
            children: busy ? "Saving…" : "Update Password"
        }, void 0, false, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 4307,
            columnNumber: 11
        }, this),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "form-grid form-grid--single",
            children: [
                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "auth-form__error",
                    children: error
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4314,
                    columnNumber: 19
                }, this),
                done ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "auth-form__notice",
                    children: "Your password has been updated."
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4316,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Current Password",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "password",
                                value: currentPassword,
                                onChange: (e)=>setCurrentPassword(e.target.value),
                                autoComplete: "current-password"
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 4320,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4319,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "New Password",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "password",
                                value: newPassword,
                                onChange: (e)=>setNewPassword(e.target.value),
                                autoComplete: "new-password",
                                minLength: 6
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 4323,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4322,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Confirm New Password",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "password",
                                value: confirm,
                                onChange: (e)=>setConfirm(e.target.value),
                                autoComplete: "new-password"
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 4326,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4325,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true)
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 4313,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4300,
        columnNumber: 5
    }, this);
}
function DeleteAccountModal({ onClose }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const { deleteAccount } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const [currentPassword, setCurrentPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    async function submit() {
        if (!currentPassword) {
            setError("Enter your password to confirm.");
            return;
        }
        if (!window.confirm("Delete your account permanently? This cannot be undone.")) return;
        setBusy(true);
        setError(null);
        const res = await deleteAccount(currentPassword);
        setBusy(false);
        if (res.ok) {
            router.push("/login");
        } else {
            setError(res.error ?? "Failed to delete account.");
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SettingsModal, {
        title: "Delete Account",
        subtitle: "This permanently deletes your account and Notion configuration.",
        onClose: onClose,
        footer: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "button",
            className: "button button--danger",
            onClick: submit,
            disabled: busy,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                    size: 16
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4366,
                    columnNumber: 11
                }, this),
                busy ? "Deleting…" : "Delete My Account"
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 4365,
            columnNumber: 9
        }, this),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "form-grid form-grid--single",
            children: [
                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "auth-form__error",
                    children: error
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4372,
                    columnNumber: 19
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "auth-form__error",
                    children: "Warning: this action is irreversible. All your data will be removed."
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4373,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                    label: "Confirm Password",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "password",
                        value: currentPassword,
                        onChange: (e)=>setCurrentPassword(e.target.value),
                        autoComplete: "current-password"
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 4377,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4376,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 4371,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4360,
        columnNumber: 5
    }, this);
}
function PageToolbar({ title, actions }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "page-toolbar",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    children: title
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4394,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4393,
                columnNumber: 7
            }, this),
            actions && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "page-toolbar__actions",
                children: actions
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4396,
                columnNumber: 19
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4392,
        columnNumber: 5
    }, this);
}
function Panel({ title, action, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "panel",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "panel__header",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 4413,
                        columnNumber: 9
                    }, this),
                    action
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4412,
                columnNumber: 7
            }, this),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4411,
        columnNumber: 5
    }, this);
}
function MetricCard({ title, value, detail, icon: Icon, tone }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
        className: cx("metric-card", `metric-card--${tone}`),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "metric-card__top",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 4437,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "metric-card__icon",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                            size: 14
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4439,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 4438,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4436,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                children: value
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4442,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: detail
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4443,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4435,
        columnNumber: 5
    }, this);
}
function Badge({ tone, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: cx("badge", `badge--${tone}`),
        children: children
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4449,
        columnNumber: 10
    }, this);
}
function MoneyLine({ label, value }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "money-line",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: label
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4455,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(value)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4456,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4454,
        columnNumber: 5
    }, this);
}
function Field({ label, className, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: cx("field", className),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: label
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4472,
                columnNumber: 7
            }, this),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4471,
        columnNumber: 5
    }, this);
}
function ComputedField({ label, value, valueTone = "ink" }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "computed-field",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: label
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4489,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                className: cx("computed-field__value", `computed-field__value--${valueTone}`),
                children: value
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4490,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4488,
        columnNumber: 5
    }, this);
}
function FormSectionDivider({ title }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "form-section-divider",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            children: title
        }, void 0, false, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 4498,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4497,
        columnNumber: 5
    }, this);
}
function MoneyValue({ value }) {
    const tone = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMoneyValueTone"])(value);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: cx("money-value", `money-value--${tone}`),
        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(value)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4507,
        columnNumber: 5
    }, this);
}
function AccountDetailModal({ account, onClose }) {
    const isCredit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isCreditLikeAccountType"])(account.type);
    const [showQr, setShowQr] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "modal-backdrop",
        role: "presentation",
        onMouseDown: (event)=>{
            if (event.target === event.currentTarget) {
                onClose();
            }
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            "aria-labelledby": "account-modal-title",
            "aria-modal": "true",
            className: "modal-panel modal-panel--account",
            role: "dialog",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "modal-panel__header",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "account-modal__title-row",
                            children: [
                                account.icon && isImageUrl(account.icon) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    src: account.icon,
                                    alt: "",
                                    width: 40,
                                    height: 40,
                                    className: "account-icon account-icon--large",
                                    unoptimized: true
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4542,
                                    columnNumber: 15
                                }, this) : account.icon ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "account-icon account-icon--emoji account-icon--large",
                                    "aria-hidden": "true",
                                    children: account.icon
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4544,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "account-icon account-icon--fallback account-icon--large",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AccountTypeIcon, {
                                        type: account.type,
                                        size: 22
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 4549,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4548,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            id: "account-modal-title",
                                            children: account.name
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 4553,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: account.information
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 4554,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4552,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4540,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "account-modal__header-actions",
                            children: [
                                showQr && account.qrCode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: account.qrCode,
                                    download: `${account.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`,
                                    className: "icon-button",
                                    "aria-label": "Download QR code",
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"], {
                                        size: 17
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 4567,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4559,
                                    columnNumber: 15
                                }, this),
                                account.qrCode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "icon-button",
                                    "aria-label": showQr ? "Show account details" : "Show QR code",
                                    onClick: ()=>setShowQr((prev)=>!prev),
                                    children: showQr ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                                        size: 17
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 4577,
                                        columnNumber: 27
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$qr$2d$code$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__QrCode$3e$__["QrCode"], {
                                        size: 17
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 4577,
                                        columnNumber: 53
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4571,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "icon-button",
                                    "aria-label": "Close modal",
                                    onClick: onClose,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                        size: 17
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 4581,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4580,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4557,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4539,
                    columnNumber: 9
                }, this),
                showQr && account.qrCode ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "account-qr",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: account.qrCode,
                        alt: `${account.name} QR code`
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 4587,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4586,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "modal-panel__body",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "account-detail-grid",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "account-detail-section",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "account-detail-section__title",
                                        children: "Account Info"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 4593,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "account-detail-fields",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "account-detail-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Type"
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4596,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: account.type
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4597,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 4595,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "account-detail-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Status"
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4600,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: account.inactive ? "Inactive" : "Active"
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4601,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 4599,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 4594,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 4592,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "account-detail-section",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "account-detail-section__title",
                                        children: "Balances"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 4608,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "account-detail-fields",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "account-detail-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Starting Balance"
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4611,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MoneyValue, {
                                                        value: account.startingBalance
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4612,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 4610,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "account-detail-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Current Balance"
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4615,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MoneyValue, {
                                                        value: account.currentBalance
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4616,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 4614,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "account-detail-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: isCredit ? "Total Payment Made" : "Total Cash Inflow"
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4619,
                                                        columnNumber: 19
                                                    }, this),
                                                    account.totalIncomes !== null ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MoneyValue, {
                                                        value: account.totalIncomes
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4621,
                                                        columnNumber: 21
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "money-value",
                                                        children: "—"
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4623,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 4618,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "account-detail-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: isCredit ? "Total Purchase Expenses" : "Total Cash Outflow"
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4627,
                                                        columnNumber: 19
                                                    }, this),
                                                    account.totalExpenses !== null ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MoneyValue, {
                                                        value: account.totalExpenses
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4629,
                                                        columnNumber: 21
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "money-value",
                                                        children: "—"
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4631,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 4626,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 4609,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 4607,
                                columnNumber: 13
                            }, this),
                            isCredit && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "account-detail-section",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "account-detail-section__title",
                                        children: "Credit Details"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 4639,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "account-detail-fields",
                                        children: [
                                            account.creditLimit !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "account-detail-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Credit Limit"
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4643,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MoneyValue, {
                                                        value: account.creditLimit
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4644,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 4642,
                                                columnNumber: 21
                                            }, this),
                                            account.availableLimit !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "account-detail-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Available Limit"
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4649,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MoneyValue, {
                                                        value: account.availableLimit
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4650,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 4648,
                                                columnNumber: 21
                                            }, this),
                                            account.creditPoints !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "account-detail-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Credit Points"
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4655,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: account.creditPoints.toLocaleString()
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4656,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 4654,
                                                columnNumber: 21
                                            }, this),
                                            account.annualFee !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "account-detail-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Annual Fee"
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4661,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MoneyValue, {
                                                        value: account.annualFee
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4662,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 4660,
                                                columnNumber: 21
                                            }, this),
                                            account.billingDay !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "account-detail-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Billing Day"
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4667,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: [
                                                            "Day ",
                                                            account.billingDay
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4668,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 4666,
                                                columnNumber: 21
                                            }, this),
                                            account.dueDay !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "account-detail-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Due Day"
                                                    }, void 0, false, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4673,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: [
                                                            "Day ",
                                                            account.dueDay
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                        lineNumber: 4674,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 4672,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 4640,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 4638,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 4591,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4590,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 4533,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4524,
        columnNumber: 5
    }, this);
}
function FormModal({ modal, subtitle, deleteLabel, editing, saving, error, onEdit, onSave, onDelete, onDuplicate, onClose, children }) {
    if (!modal) {
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "modal-backdrop",
        role: "presentation",
        onMouseDown: (event)=>{
            if (event.target === event.currentTarget && !saving) {
                onClose();
            }
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            "aria-labelledby": "form-modal-title",
            "aria-modal": "true",
            className: "modal-panel",
            role: "dialog",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "modal-panel__header",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    id: "form-modal-title",
                                    children: modal.title
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4739,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: editing ? subtitle : "Read-only — click Edit to change and save to Notion."
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4740,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4738,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "icon-button",
                            "aria-label": "Close modal",
                            onClick: onClose,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                size: 17
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 4743,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4742,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4737,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "modal-panel__body",
                    children: [
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "auth-form__error",
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4747,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
                            className: "modal-fieldset",
                            disabled: !editing || saving,
                            children: children
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4748,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4746,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "modal-panel__footer",
                    children: [
                        modal.mode === "edit" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "button",
                            onClick: onDelete,
                            disabled: saving,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4755,
                                    columnNumber: 15
                                }, this),
                                deleteLabel
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4754,
                            columnNumber: 13
                        }, this),
                        modal.mode === "edit" && onDuplicate && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "button",
                            onClick: onDuplicate,
                            disabled: saving,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__["Copy"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4761,
                                    columnNumber: 15
                                }, this),
                                "Duplicate"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4760,
                            columnNumber: 13
                        }, this),
                        !editing && modal.mode === "edit" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "button button--primary",
                            onClick: onEdit,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__["Pencil"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4767,
                                    columnNumber: 15
                                }, this),
                                "Edit"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4766,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "button button--primary",
                            onClick: onSave,
                            disabled: saving,
                            children: [
                                saving ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                    size: 16,
                                    className: "spin"
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4773,
                                    columnNumber: 17
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4775,
                                    columnNumber: 17
                                }, this),
                                saving ? "Saving…" : "Save"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4771,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4752,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 4731,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4722,
        columnNumber: 5
    }, this);
}
function EmptyState({ title, detail }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "empty-state",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                children: title
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4789,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: detail
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4790,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4788,
        columnNumber: 5
    }, this);
}
function LoadingBlock({ label }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "loading-block",
        role: "status",
        "aria-live": "polite",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                size: 16,
                className: "spin"
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4798,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: label
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4799,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4797,
        columnNumber: 5
    }, this);
}
/** Pull a comparable value out of a table cell (string, number, or element). */ function cellText(node) {
    if (node == null || typeof node === "boolean") return "";
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(cellText).join("");
    if (/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"])(node)) {
        const props = node.props;
        if (typeof props.value === "number") return String(props.value);
        return cellText(props.children);
    }
    return "";
}
function cellSortKey(node) {
    // MoneyValue and similar carry a numeric `value` prop — sort numerically.
    if (/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidElement"])(node) && typeof node.props.value === "number") {
        return {
            num: node.props.value,
            text: ""
        };
    }
    const text = cellText(node).trim();
    const numeric = text.replace(/[₱,\s]/g, "");
    if (numeric && /^-?\d*\.?\d+$/.test(numeric)) {
        return {
            num: Number(numeric),
            text
        };
    }
    // Dates like "Jul 5, 2026".
    if (/\b\d{4}\b/.test(text)) {
        const parsed = Date.parse(text);
        if (!Number.isNaN(parsed)) return {
            num: parsed,
            text
        };
    }
    return {
        num: null,
        text: text.toLowerCase()
    };
}
function DataTable({ headers, rows, footerRows = [], onRowClick, unsortableColumns = [], wide = false }) {
    const [sort, setSort] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const skip = new Set(unsortableColumns);
    function toggleSort(col) {
        setSort((prev)=>{
            if (!prev || prev.col !== col) return {
                col,
                dir: "asc"
            };
            if (prev.dir === "asc") return {
                col,
                dir: "desc"
            };
            return null; // third click restores original order
        });
    }
    // Keep original indices so row clicks still map to the right record.
    const ordered = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const indexed = rows.map((row, index)=>({
                row,
                index
            }));
        if (!sort) return indexed;
        const { col, dir } = sort;
        return [
            ...indexed
        ].sort((a, b)=>{
            const ka = cellSortKey(a.row[col]);
            const kb = cellSortKey(b.row[col]);
            let cmp;
            if (ka.num !== null && kb.num !== null) cmp = ka.num - kb.num;
            else cmp = ka.text.localeCompare(kb.text);
            return dir === "asc" ? cmp : -cmp;
        });
    }, [
        rows,
        sort
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "table-wrap",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
            className: cx(wide && "data-table--wide"),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                        children: headers.map((header, columnIndex)=>{
                            const sortable = !skip.has(columnIndex);
                            const active = sort?.col === columnIndex;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                "aria-sort": active ? sort?.dir === "asc" ? "ascending" : "descending" : "none",
                                children: sortable ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: cx("th-sort", active && "th-sort--active"),
                                    onClick: ()=>toggleSort(columnIndex),
                                    children: [
                                        header,
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "th-sort__icon",
                                            children: active ? sort?.dir === "asc" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__["ChevronUp"], {
                                                size: 13
                                            }, void 0, false, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 4903,
                                                columnNumber: 29
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                                size: 13
                                            }, void 0, false, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 4905,
                                                columnNumber: 29
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevrons$2d$up$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronsUpDown$3e$__["ChevronsUpDown"], {
                                                size: 13
                                            }, void 0, false, {
                                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                                lineNumber: 4908,
                                                columnNumber: 27
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 4900,
                                            columnNumber: 23
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4894,
                                    columnNumber: 21
                                }, this) : header
                            }, header, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 4887,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 4882,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4881,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                    children: ordered.map(({ row, index })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                            className: cx(onRowClick && "table-row--clickable"),
                            tabIndex: onRowClick ? 0 : undefined,
                            onClick: ()=>onRowClick?.(index),
                            onKeyDown: (event)=>{
                                if (!onRowClick) {
                                    return;
                                }
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    onRowClick(index);
                                }
                            },
                            children: row.map((cell, cellIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    children: cell
                                }, `cell-${index}-${cellIndex}`, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4939,
                                    columnNumber: 17
                                }, this))
                        }, `row-${index}`, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4922,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4920,
                    columnNumber: 9
                }, this),
                footerRows.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tfoot", {
                    children: footerRows.map((row, rowIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                            children: row.map((cell, cellIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    children: cell
                                }, `footer-cell-${rowIndex}-${cellIndex}`, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 4949,
                                    columnNumber: 19
                                }, this))
                        }, `footer-${rowIndex}`, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 4947,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 4945,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 4880,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4879,
        columnNumber: 5
    }, this);
}
function SegmentedControl({ label, options, value, onChange }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "segmented",
        "aria-label": label,
        children: options.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: cx(option.value === value && "segmented__item--active"),
                onClick: ()=>onChange(option.value),
                children: option.label
            }, option.value, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4974,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4972,
        columnNumber: 5
    }, this);
}
function FilterToggle({ label, checked, onChange }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: cx("filter-toggle", checked && "filter-toggle--active"),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "checkbox",
                checked: checked,
                onChange: (event)=>onChange(event.target.checked)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 4998,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: label
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5003,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 4997,
        columnNumber: 5
    }, this);
}
function FilterSelect({ placeholder, placeholderDisabled = true, value, onChange, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: "filter-select",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
            value: value,
            onChange: (event)=>onChange(event.target.value),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                    value: "",
                    disabled: placeholderDisabled,
                    children: placeholder
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5024,
                    columnNumber: 9
                }, this),
                children
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 5023,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 5022,
        columnNumber: 5
    }, this);
}
function CategoryDonutChart({ data }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "category-chart",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "category-chart__visual",
                "aria-label": "Category chart",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$ResponsiveContainer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ResponsiveContainer"], {
                    width: "100%",
                    height: "100%",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$PieChart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PieChart"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$Pie$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Pie"], {
                                cx: "50%",
                                cy: "50%",
                                data: data,
                                dataKey: "value",
                                innerRadius: 54,
                                isAnimationActive: false,
                                outerRadius: 86,
                                stroke: "none",
                                children: data.map((entry)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Cell$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Cell"], {
                                        fill: entry.color
                                    }, entry.name, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5054,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5043,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Tooltip$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Tooltip"], {
                                contentStyle: {
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid rgba(28,25,23,0.09)",
                                    borderRadius: 10,
                                    fontSize: 12
                                },
                                formatter: (value)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(Number(value))
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5057,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5042,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5041,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5040,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "category-chart__legend",
                children: data.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                        style: {
                                            backgroundColor: item.color
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5072,
                                        columnNumber: 19
                                    }, this),
                                    item.name
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5072,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(item.value, {
                                    compact: true
                                })
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5073,
                                columnNumber: 13
                            }, this)
                        ]
                    }, item.name, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5071,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5069,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 5039,
        columnNumber: 5
    }, this);
}
function BudgetRow({ label, percent, amount }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "budget-row",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                className: "budget-row__label",
                children: label
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5084,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "budget-row__percent",
                children: [
                    percent,
                    "%"
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5085,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "budget-row__amount",
                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(amount)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5086,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 5083,
        columnNumber: 5
    }, this);
}
function CategoryCard({ title, detail, value, muted = false, onClick }) {
    const content = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: title
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5106,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: detail
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5107,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                children: value
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5108,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
    const className = cx("category-card", muted && "category-card--muted", onClick && "category-card--button");
    if (onClick) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "button",
            className: className,
            onClick: onClick,
            children: content
        }, void 0, false, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 5115,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
        className: cx("category-card", muted && "category-card--muted"),
        children: content
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 5122,
        columnNumber: 5
    }, this);
}
function ErrorRow({ code, detail }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "error-row",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$exclamation$2d$point$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileWarning$3e$__["FileWarning"], {
                size: 16
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5131,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: code
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5133,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: detail
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5134,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5132,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 5130,
        columnNumber: 5
    }, this);
}
// ── Floating action button ────────────────────────────────────────────
/** Broadcast so open Income/Expense lists refetch after a quick add. */ const DATA_CHANGED_EVENT = "nf:data-changed";
function emitDataChanged() {
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
}
function WorkspaceFab({ activeSection, selectedDate }) {
    const { receipt, insight } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$fab$2d$export$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useFabExport"])();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [modal, setModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const canPrintReceipt = activeSection === "expense" && receipt !== null;
    const canShotInsight = activeSection === "monthly-monitoring" && insight !== null;
    function choose(kind) {
        setOpen(false);
        setModal(kind);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fab",
                children: [
                    open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "fab__menu",
                        role: "menu",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "fab__action",
                                onClick: ()=>choose("income"),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "fab__action-label",
                                        children: "Add New Income"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5175,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "fab__action-icon fab__action-icon--income",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$right$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpRight$3e$__["ArrowUpRight"], {
                                            size: 18
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 5177,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5176,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5174,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "fab__action",
                                onClick: ()=>choose("expense"),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "fab__action-label",
                                        children: "Add New Expense"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5181,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "fab__action-icon fab__action-icon--expense",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$receipt$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Receipt$3e$__["Receipt"], {
                                            size: 18
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 5183,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5182,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5180,
                                columnNumber: 13
                            }, this),
                            canPrintReceipt && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "fab__action",
                                onClick: ()=>choose("receipt"),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "fab__action-label",
                                        children: "Print Receipt"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5188,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "fab__action-icon",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$printer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Printer$3e$__["Printer"], {
                                            size: 18
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 5190,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5189,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5187,
                                columnNumber: 15
                            }, this),
                            canShotInsight && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "fab__action",
                                onClick: ()=>choose("insight"),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "fab__action-label",
                                        children: "Monthly Insight Shot"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5196,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "fab__action-icon",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$camera$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Camera$3e$__["Camera"], {
                                            size: 18
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 5198,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5197,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5195,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5173,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: cx("fab__toggle", open && "fab__toggle--open"),
                        "aria-label": open ? "Close quick actions" : "Open quick actions",
                        "aria-expanded": open,
                        onClick: ()=>setOpen((v)=>!v),
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                            size: 24
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5211,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5204,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5171,
                columnNumber: 7
            }, this),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fab__backdrop",
                role: "presentation",
                onClick: ()=>setOpen(false)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5216,
                columnNumber: 9
            }, this),
            modal === "income" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(QuickAddIncomeModal, {
                onClose: ()=>setModal(null)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5224,
                columnNumber: 9
            }, this),
            modal === "expense" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(QuickAddExpenseModal, {
                selectedDate: selectedDate,
                onClose: ()=>setModal(null)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5227,
                columnNumber: 9
            }, this),
            modal === "receipt" && receipt && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ReceiptModal, {
                receipt: receipt,
                onClose: ()=>setModal(null)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5233,
                columnNumber: 9
            }, this),
            modal === "insight" && insight && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(InsightShotModal, {
                insight: insight,
                onClose: ()=>setModal(null)
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5236,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true);
}
// ── Quick-add modals (mirror the Income/Expense page forms) ────────────
// These are intentionally self-contained so the working Income/Expense pages
// stay untouched. All money math is shared via finance-rules — only the form
// layout is duplicated here.
function QuickAddIncomeModal({ onClose }) {
    const { nonCreditActiveAccounts, normalIncomeCategories } = useLiveCollections();
    const [nameInput, setNameInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [dateInput, setDateInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$date$2d$range$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["todayIso"])());
    const [formAccountId, setFormAccountId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [formCategoryId, setFormCategoryId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [grossIncomeInput, setGrossIncomeInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [capitalExpenditureInput, setCapitalExpenditureInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [saveError, setSaveError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Auto-update [YYMMDD] tag when date changes.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const yyymmdd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toYYMMDD"])(dateInput);
        if (!yyymmdd) return;
        setNameInput((prev)=>applyIncomeTag(prev, yyymmdd));
    }, [
        dateInput
    ]);
    const calculatedNetIncome = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateNetIncome"])(parseNumberInput(grossIncomeInput), parseNumberInput(capitalExpenditureInput));
    async function handleSave() {
        if (!nameInput.trim() || !dateInput) {
            setSaveError("Name and date are required.");
            return;
        }
        setSaving(true);
        setSaveError(null);
        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["incomesApi"].create({
            name: nameInput.trim(),
            date: dateInput,
            grossIncome: parseNumberInput(grossIncomeInput),
            capitalExpenditure: parseNumberInput(capitalExpenditureInput),
            accountId: formAccountId,
            categoryId: formCategoryId
        });
        setSaving(false);
        if (!res.success) {
            setSaveError(res.error.message || "Failed to save to Notion.");
            return;
        }
        emitDataChanged();
        onClose();
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FormModal, {
        deleteLabel: "Soft Delete",
        modal: {
            mode: "new",
            title: "New Income"
        },
        editing: true,
        saving: saving,
        error: saveError,
        subtitle: "Net income updates from gross income less capital expenditure.",
        onEdit: ()=>{},
        onSave: handleSave,
        onDelete: ()=>{},
        onClose: onClose,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "form-grid form-grid--single",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                    label: "Name",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        placeholder: "Income title",
                        value: nameInput,
                        onChange: (event)=>setNameInput(event.target.value)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5309,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5308,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                    label: "Date",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "date",
                        value: dateInput,
                        onChange: (event)=>setDateInput(event.target.value)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5316,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5315,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                    label: "Gross Income",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        inputMode: "decimal",
                        placeholder: "0.00",
                        value: grossIncomeInput,
                        onChange: (event)=>setGrossIncomeInput(event.target.value)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5323,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5322,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                    label: "Capital Expenditure",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        inputMode: "decimal",
                        placeholder: "0.00",
                        value: capitalExpenditureInput,
                        onChange: (event)=>setCapitalExpenditureInput(event.target.value)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5331,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5330,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                    label: "Accounts",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: formAccountId,
                        onChange: (event)=>setFormAccountId(event.target.value),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "— None —"
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5340,
                                columnNumber: 13
                            }, this),
                            nonCreditActiveAccounts.map((account)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: account.id,
                                    children: account.name
                                }, account.id, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 5342,
                                    columnNumber: 15
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5339,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5338,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                    label: "Categories",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: formCategoryId,
                        onChange: (event)=>setFormCategoryId(event.target.value),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "— None —"
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5348,
                                columnNumber: 13
                            }, this),
                            normalIncomeCategories.map((category)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: category.id,
                                    children: category.source
                                }, category.id, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 5350,
                                    columnNumber: 15
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5347,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5346,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                    label: "Net Income",
                    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(calculatedNetIncome),
                    valueTone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMoneyValueTone"])(calculatedNetIncome)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5354,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 5307,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 5295,
        columnNumber: 5
    }, this);
}
function QuickAddExpenseModal({ selectedDate, onClose }) {
    const { activeAccounts, expenseCategories, expenseCategoryNameById } = useLiveCollections();
    const [descriptionInput, setDescriptionInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [formAccountId, setFormAccountId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [formCategoryId, setFormCategoryId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [purchaseDateInput, setPurchaseDateInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>selectedDate || (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$date$2d$range$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["todayIso"])());
    const [datePaidInput, setDatePaidInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [expenseAmountInput, setExpenseAmountInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [interestInput, setInterestInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [paymentStatus, setPaymentStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [paymentFrequency, setPaymentFrequency] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [periodCountInput, setPeriodCountInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [paidPeriodInput, setPaidPeriodInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [pasabuyer, setPasabuyer] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [pasabuyStatus, setPasabuyStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [pasabuyDateOfPaymentInput, setPasabuyDateOfPaymentInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [pasabuyPaidPeriodInput, setPasabuyPaidPeriodInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [pasabuyAccountReceiverId, setPasabuyAccountReceiverId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [saveError, setSaveError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Auto-update [YYMMDDx] tag when purchase date changes.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const yyymmdd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toYYMMDD"])(purchaseDateInput);
        if (!yyymmdd) return;
        setDescriptionInput((prev)=>applyNotionTag(prev, yyymmdd));
    }, [
        purchaseDateInput
    ]);
    const selectedFormAccount = activeAccounts.find((a)=>a.id === formAccountId);
    const accountType = selectedFormAccount?.type ?? "Cash";
    const categoryName = expenseCategoryNameById.get(formCategoryId) ?? "";
    const sections = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getExpenseConditionalSections"])({
        accountType,
        viewMode: "Monthly",
        categoryName
    });
    const expenseAmount = parseNumberInput(expenseAmountInput);
    const interestAmount = sections.creditCard ? parseNumberInput(interestInput) : 0;
    const periodCount = parseOptionalNumberInput(periodCountInput);
    const paidPeriod = parseOptionalNumberInput(paidPeriodInput);
    const pasabuyPaidPeriod = parseOptionalNumberInput(pasabuyPaidPeriodInput);
    const grossPrice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateGrossPrice"])(expenseAmount, interestAmount);
    const installmentAmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateInstallmentAmount"])({
        grossPrice,
        paymentStatus,
        periodCount
    });
    const paidAmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculatePaidAmount"])({
        grossPrice,
        paymentStatus,
        installmentAmount,
        paidPeriod
    });
    const remainingBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateRemainingBalance"])(grossPrice, paidAmount);
    const expectedPaymentDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateExpectedPaymentDate"])({
        purchaseDate: purchaseDateInput,
        billingDay: selectedFormAccount?.billingDay ?? null,
        dueDay: selectedFormAccount?.dueDay ?? null
    });
    const pasabuyReceivedAmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculatePasabuyReceivedAmount"])({
        grossPrice,
        pasabuyStatus,
        installmentAmount,
        pasabuyPaidPeriod,
        periodCount
    });
    const pasabuyerBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculatePasabuyerBalance"])(grossPrice, pasabuyReceivedAmount);
    async function handleSave() {
        if (!descriptionInput.trim()) {
            setSaveError("Description is required.");
            return;
        }
        setSaving(true);
        setSaveError(null);
        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["expensesApi"].create({
            description: descriptionInput.trim(),
            purchaseDate: purchaseDateInput,
            datePaid: datePaidInput || null,
            amount: parseNumberInput(expenseAmountInput),
            interest: parseNumberInput(interestInput),
            accountId: formAccountId,
            categoryId: formCategoryId,
            paymentStatus: paymentStatus || "Unpaid",
            paymentFrequency: paymentFrequency || null,
            periodCount: parseOptionalNumberInput(periodCountInput),
            paidPeriod: parseOptionalNumberInput(paidPeriodInput),
            pasabuyer: pasabuyer || null,
            pasabuyStatus: pasabuyStatus || null,
            pasabuyDateOfPayment: pasabuyDateOfPaymentInput || null,
            pasabuyPaidPeriod: parseOptionalNumberInput(pasabuyPaidPeriodInput),
            pasabuyAccountReceiverId: pasabuyAccountReceiverId || null
        });
        setSaving(false);
        if (!res.success) {
            setSaveError(res.error.message || "Failed to save to Notion.");
            return;
        }
        emitDataChanged();
        onClose();
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FormModal, {
        deleteLabel: "Soft Delete",
        modal: {
            mode: "new",
            title: "New Expense"
        },
        editing: true,
        saving: saving,
        error: saveError,
        subtitle: "Context fields change from the selected account and category.",
        onEdit: ()=>{},
        onSave: handleSave,
        onDelete: ()=>{},
        onClose: onClose,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "form-grid form-grid--single",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                    label: "Purchase description",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        placeholder: "Purchase description",
                        value: descriptionInput,
                        onChange: (event)=>setDescriptionInput(event.target.value)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5490,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5489,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                    label: "Purchase Date",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "date",
                        value: purchaseDateInput,
                        onChange: (event)=>setPurchaseDateInput(event.target.value)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5497,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5496,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                    label: "Accounts",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: formAccountId,
                        onChange: (event)=>setFormAccountId(event.target.value),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "— None —"
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5505,
                                columnNumber: 13
                            }, this),
                            activeAccounts.map((account)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: account.id,
                                    children: account.name
                                }, account.id, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 5507,
                                    columnNumber: 15
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5504,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5503,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                    label: "Categories",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: formCategoryId,
                        onChange: (event)=>setFormCategoryId(event.target.value),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "— None —"
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5513,
                                columnNumber: 13
                            }, this),
                            expenseCategories.map((category)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: category.id,
                                    children: category.name
                                }, category.id, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 5515,
                                    columnNumber: 15
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5512,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5511,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                    label: "Expense Amount",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        inputMode: "decimal",
                        placeholder: "0.00",
                        value: expenseAmountInput,
                        onChange: (event)=>setExpenseAmountInput(event.target.value)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5520,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5519,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                    label: "Date Paid",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "date",
                        value: datePaidInput,
                        onChange: (event)=>setDatePaidInput(event.target.value)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5528,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5527,
                    columnNumber: 9
                }, this),
                sections.creditCard && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FormSectionDivider, {
                            title: "CC Transaction"
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5536,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Payment Status",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: paymentStatus,
                                onChange: (event)=>setPaymentStatus(event.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "— None —"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5542,
                                        columnNumber: 17
                                    }, this),
                                    __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["paymentStatusLabels"].map((status)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: status,
                                            children: status
                                        }, status, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 5544,
                                            columnNumber: 19
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5538,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5537,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Interest",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                inputMode: "decimal",
                                placeholder: "0.00",
                                value: interestInput,
                                onChange: (event)=>setInterestInput(event.target.value)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5549,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5548,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                            label: "Gross Price",
                            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(grossPrice)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5556,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Payment Frequency",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: paymentFrequency,
                                onChange: (event)=>setPaymentFrequency(event.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "— None —"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5562,
                                        columnNumber: 17
                                    }, this),
                                    __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["paymentFrequencyLabels"].map((frequency)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: frequency,
                                            children: frequency
                                        }, frequency, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 5564,
                                            columnNumber: 19
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5558,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5557,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Period Count",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                inputMode: "numeric",
                                placeholder: "0",
                                value: periodCountInput,
                                onChange: (event)=>setPeriodCountInput(event.target.value)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5569,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5568,
                            columnNumber: 13
                        }, this),
                        paymentStatus === "Installment" && installmentAmount !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                            label: "Installment Amount",
                            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(installmentAmount)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5577,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Paid period",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                inputMode: "numeric",
                                placeholder: "0",
                                value: paidPeriodInput,
                                onChange: (event)=>setPaidPeriodInput(event.target.value)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5580,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5579,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                            label: "Paid Amount",
                            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(paidAmount)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5587,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                            label: "Remaining Balance",
                            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(remainingBalance)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5588,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                            label: "Expected payment date",
                            value: expectedPaymentDate ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"])(expectedPaymentDate) : "-"
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5589,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true),
                sections.pasabuy && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FormSectionDivider, {
                            title: "Pasabuy Transaction"
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5597,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Pasabuyer",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: pasabuyer,
                                onChange: (event)=>setPasabuyer(event.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "— None —"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5600,
                                        columnNumber: 17
                                    }, this),
                                    __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pasabuyerLabels"].map((name)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: name,
                                            children: name
                                        }, name, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 5602,
                                            columnNumber: 19
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5599,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5598,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Pasabuy Status",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: pasabuyStatus,
                                onChange: (event)=>setPasabuyStatus(event.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "— None —"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5611,
                                        columnNumber: 17
                                    }, this),
                                    __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$finance$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pasabuyStatusLabels"].map((status)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: status,
                                            children: status
                                        }, status, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 5613,
                                            columnNumber: 19
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5607,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5606,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Pasabuy Date of Payment",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "date",
                                value: pasabuyDateOfPaymentInput,
                                onChange: (event)=>setPasabuyDateOfPaymentInput(event.target.value)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5618,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5617,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Pasabuy Account Receiver",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: pasabuyAccountReceiverId,
                                onChange: (event)=>setPasabuyAccountReceiverId(event.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "— None —"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5629,
                                        columnNumber: 17
                                    }, this),
                                    activeAccounts.map((account)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: account.id,
                                            children: account.name
                                        }, account.id, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 5631,
                                            columnNumber: 19
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5625,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5624,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Pasabuy paid period",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                inputMode: "numeric",
                                placeholder: "0",
                                value: pasabuyPaidPeriodInput,
                                onChange: (event)=>setPasabuyPaidPeriodInput(event.target.value)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5636,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5635,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                            label: "Pasabuy Received Amount",
                            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(pasabuyReceivedAmount)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5643,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ComputedField, {
                            label: "Pasabuyer Balance",
                            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatMoney"])(pasabuyerBalance)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5644,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true)
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 5488,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 5476,
        columnNumber: 5
    }, this);
}
// ── Print Receipt ─────────────────────────────────────────────────────
function ExportModalShell({ title, subtitle, onClose, onPrint, onSaveImage, busy, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "modal-backdrop",
        role: "presentation",
        onMouseDown: (event)=>{
            if (event.target === event.currentTarget) onClose();
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            className: "modal-panel modal-panel--export",
            role: "dialog",
            "aria-modal": "true",
            "aria-label": title,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "modal-panel__header fab-shot-hide",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    children: title
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 5687,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: subtitle
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 5688,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5686,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "icon-button",
                            "aria-label": "Close",
                            onClick: onClose,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                size: 17
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5691,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5690,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5685,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "modal-panel__body export-preview",
                    children: children
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5694,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "modal-panel__footer fab-shot-hide",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "button",
                            onClick: onSaveImage,
                            disabled: busy,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ImageDown$3e$__["ImageDown"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 5697,
                                    columnNumber: 13
                                }, this),
                                "Save as Image"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5696,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "button button--primary",
                            onClick: onPrint,
                            disabled: busy,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$down$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileDown$3e$__["FileDown"], {
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 5701,
                                    columnNumber: 13
                                }, this),
                                "Print / Save as PDF"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5700,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5695,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 5679,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 5672,
        columnNumber: 5
    }, this);
}
function ReceiptModal({ receipt, onClose }) {
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const surfaceRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ExportModalShell, {
        title: "Print Receipt",
        subtitle: "Export the current expense view as a receipt.",
        onClose: onClose,
        onPrint: ()=>surfaceRef.current && (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$export$2d$node$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["printNode"])(surfaceRef.current),
        onSaveImage: ()=>surfaceRef.current && (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$export$2d$node$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["downloadNodeAsPng"])(surfaceRef.current, "notable-receipt"),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "receipt",
            ref: surfaceRef,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "receipt__head",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "receipt__brand",
                            children: "Notable Finance Receipt"
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5732,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "receipt__tagline",
                            children: [
                                "by ",
                                user?.name ?? user?.email ?? "Guest"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5733,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "receipt__meta",
                            children: receipt.viewTitle
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5734,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "receipt__meta",
                            children: receipt.periodLabel
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5735,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5731,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "receipt__rule"
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5737,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                    className: "receipt__table",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("colgroup", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("col", {
                                    className: "receipt__col-date"
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 5740,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("col", {
                                    className: "receipt__col-desc"
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 5741,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("col", {
                                    className: "receipt__col-amount"
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 5742,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5739,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        children: "Date of Purchase"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5746,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        children: "Description"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5747,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "receipt__amount",
                                        children: receipt.amountHeader
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5748,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5745,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5744,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            children: receipt.rows.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    colSpan: 3,
                                    className: "receipt__empty",
                                    children: "No items to display."
                                }, void 0, false, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 5754,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5753,
                                columnNumber: 15
                            }, this) : receipt.rows.map((row, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "receipt__date",
                                            children: row.date
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 5759,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            children: row.description
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 5760,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "receipt__amount",
                                            children: row.amount
                                        }, void 0, false, {
                                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                                            lineNumber: 5761,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, `${row.date}-${index}`, true, {
                                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                                    lineNumber: 5758,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5751,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tfoot", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        colSpan: 2,
                                        children: "Total"
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5768,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        className: "receipt__amount",
                                        children: receipt.total
                                    }, void 0, false, {
                                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                                        lineNumber: 5769,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5767,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5766,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5738,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "receipt__rule"
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5773,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "receipt__disclaimer",
                    children: "This document is electronically generated and does not require a signature."
                }, void 0, false, {
                    fileName: "[project]/application/src/components/finance-workspace.tsx",
                    lineNumber: 5774,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/application/src/components/finance-workspace.tsx",
            lineNumber: 5730,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 5721,
        columnNumber: 5
    }, this);
}
// ── Monthly Insight Shot ──────────────────────────────────────────────
function InsightShotModal({ insight, onClose }) {
    const surfaceRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [snapshot, setSnapshot] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("capturing");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let cancelled = false;
        const node = insight.getNode();
        if (!node) {
            queueMicrotask(()=>{
                if (!cancelled) setStatus("error");
            });
            return;
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$export$2d$node$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["nodeToPngDataUrl"])(node).then((url)=>{
            if (!cancelled) {
                setSnapshot(url);
                setStatus("ready");
            }
        }).catch(()=>{
            if (!cancelled) setStatus("error");
        });
        return ()=>{
            cancelled = true;
        };
    }, [
        insight
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ExportModalShell, {
        title: "Monthly Insight Shot",
        subtitle: "A clean snapshot of your monthly monitoring.",
        busy: status !== "ready",
        onClose: onClose,
        onPrint: ()=>surfaceRef.current && (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$export$2d$node$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["printNode"])(surfaceRef.current),
        onSaveImage: ()=>surfaceRef.current && (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$src$2f$lib$2f$export$2d$node$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["downloadNodeAsPng"])(surfaceRef.current, `notable-insight-${insight.monthLabel}`),
        children: [
            status === "capturing" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LoadingBlock, {
                label: "Building snapshot…"
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5834,
                columnNumber: 34
            }, this),
            status === "error" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
                title: "Couldn't build the snapshot",
                detail: "Open the Monthly Monitoring view and try again."
            }, void 0, false, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5836,
                columnNumber: 9
            }, this),
            status === "ready" && snapshot && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "insight-shot",
                ref: surfaceRef,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "insight-shot__head",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "insight-shot__brand",
                                children: "NOTABLE FINANCE"
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5844,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "insight-shot__title",
                                children: "Monthly Monitoring"
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5845,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "insight-shot__month",
                                children: insight.monthLabel
                            }, void 0, false, {
                                fileName: "[project]/application/src/components/finance-workspace.tsx",
                                lineNumber: 5846,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5843,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "insight-shot__body",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$application$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            className: "insight-shot__image",
                            src: snapshot,
                            alt: "Monthly monitoring snapshot"
                        }, void 0, false, {
                            fileName: "[project]/application/src/components/finance-workspace.tsx",
                            lineNumber: 5850,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/application/src/components/finance-workspace.tsx",
                        lineNumber: 5848,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/application/src/components/finance-workspace.tsx",
                lineNumber: 5842,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/application/src/components/finance-workspace.tsx",
        lineNumber: 5823,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=application_src_17fs3ku._.js.map