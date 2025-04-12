/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./src/lib/auth-provider.tsx":
/*!***********************************!*\
  !*** ./src/lib/auth-provider.tsx ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   AuthProvider: () => (/* binding */ AuthProvider),\n/* harmony export */   useAuth: () => (/* binding */ useAuth)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _supabase__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./supabase */ \"./src/lib/supabase.ts\");\n\n\n\nconst AuthContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)(null);\nconst AuthProvider = ({ children })=>{\n    const [user, setUser] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        const session = _supabase__WEBPACK_IMPORTED_MODULE_2__.supabase.auth.getSession().then(({ data })=>{\n            setUser(data.session?.user ?? null);\n        });\n        const { data: listener } = _supabase__WEBPACK_IMPORTED_MODULE_2__.supabase.auth.onAuthStateChange((_event, session)=>{\n            setUser(session?.user ?? null);\n        });\n        return ()=>{\n            listener.subscription.unsubscribe();\n        };\n    }, []);\n    const login = async (email, password)=>{\n        const { error } = await _supabase__WEBPACK_IMPORTED_MODULE_2__.supabase.auth.signInWithPassword({\n            email,\n            password\n        });\n        return {\n            error\n        };\n    };\n    const logout = async ()=>{\n        await _supabase__WEBPACK_IMPORTED_MODULE_2__.supabase.auth.signOut();\n    };\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(AuthContext.Provider, {\n        value: {\n            user,\n            login,\n            logout\n        },\n        children: children\n    }, void 0, false, {\n        fileName: \"E:\\\\website\\\\xampp\\\\htdocs\\\\Sensasiwangiweb\\\\src\\\\lib\\\\auth-provider.tsx\",\n        lineNumber: 44,\n        columnNumber: 5\n    }, undefined);\n};\nconst useAuth = ()=>{\n    const context = (0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(AuthContext);\n    if (!context) {\n        throw new Error(\"useAuth must be used within an AuthProvider\");\n    }\n    return context;\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvbGliL2F1dGgtcHJvdmlkZXIudHN4IiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQXlGO0FBRW5EO0FBUXRDLE1BQU1NLDRCQUFjTCxvREFBYUEsQ0FBeUI7QUFNbkQsTUFBTU0sZUFBZSxDQUFDLEVBQUVDLFFBQVEsRUFBcUI7SUFDMUQsTUFBTSxDQUFDQyxNQUFNQyxRQUFRLEdBQUdOLCtDQUFRQSxDQUFjO0lBRTlDRCxnREFBU0EsQ0FBQztRQUNSLE1BQU1RLFVBQVVOLCtDQUFRQSxDQUFDTyxJQUFJLENBQUNDLFVBQVUsR0FBR0MsSUFBSSxDQUFDLENBQUMsRUFBRUMsSUFBSSxFQUFFO1lBQ3ZETCxRQUFRSyxLQUFLSixPQUFPLEVBQUVGLFFBQVE7UUFDaEM7UUFFQSxNQUFNLEVBQUVNLE1BQU1DLFFBQVEsRUFBRSxHQUFHWCwrQ0FBUUEsQ0FBQ08sSUFBSSxDQUFDSyxpQkFBaUIsQ0FBQyxDQUFDQyxRQUFRUDtZQUNsRUQsUUFBUUMsU0FBU0YsUUFBUTtRQUMzQjtRQUVBLE9BQU87WUFDTE8sU0FBU0csWUFBWSxDQUFDQyxXQUFXO1FBQ25DO0lBQ0YsR0FBRyxFQUFFO0lBRUwsTUFBTUMsUUFBUSxPQUFPQyxPQUFlQztRQUNsQyxNQUFNLEVBQUVDLEtBQUssRUFBRSxHQUFHLE1BQU1uQiwrQ0FBUUEsQ0FBQ08sSUFBSSxDQUFDYSxrQkFBa0IsQ0FBQztZQUFFSDtZQUFPQztRQUFTO1FBQzNFLE9BQU87WUFBRUM7UUFBTTtJQUNqQjtJQUVBLE1BQU1FLFNBQVM7UUFDYixNQUFNckIsK0NBQVFBLENBQUNPLElBQUksQ0FBQ2UsT0FBTztJQUM3QjtJQUVBLHFCQUNFLDhEQUFDckIsWUFBWXNCLFFBQVE7UUFBQ0MsT0FBTztZQUFFcEI7WUFBTVk7WUFBT0s7UUFBTztrQkFDaERsQjs7Ozs7O0FBR1AsRUFBRTtBQUVLLE1BQU1zQixVQUFVO0lBQ3JCLE1BQU1DLFVBQVU3QixpREFBVUEsQ0FBQ0k7SUFDM0IsSUFBSSxDQUFDeUIsU0FBUztRQUNaLE1BQU0sSUFBSUMsTUFBTTtJQUNsQjtJQUNBLE9BQU9EO0FBQ1QsRUFBRSIsInNvdXJjZXMiOlsid2VicGFjazovL3NlbnNhc2l3YW5naS8uL3NyYy9saWIvYXV0aC1wcm92aWRlci50c3g/NzU4YyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgY3JlYXRlQ29udGV4dCwgdXNlQ29udGV4dCwgdXNlRWZmZWN0LCB1c2VTdGF0ZSwgUmVhY3ROb2RlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgU2Vzc2lvbiwgVXNlciB9IGZyb20gJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyc7XG5pbXBvcnQgeyBzdXBhYmFzZSB9IGZyb20gJy4vc3VwYWJhc2UnO1xuXG5pbnRlcmZhY2UgQXV0aENvbnRleHRUeXBlIHtcbiAgdXNlcjogVXNlciB8IG51bGw7XG4gIGxvZ2luOiAoZW1haWw6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZykgPT4gUHJvbWlzZTx7IGVycm9yOiBhbnkgfT47XG4gIGxvZ291dDogKCkgPT4gUHJvbWlzZTx2b2lkPjtcbn1cblxuY29uc3QgQXV0aENvbnRleHQgPSBjcmVhdGVDb250ZXh0PEF1dGhDb250ZXh0VHlwZSB8IG51bGw+KG51bGwpO1xuXG5pbnRlcmZhY2UgQXV0aFByb3ZpZGVyUHJvcHMge1xuICBjaGlsZHJlbjogUmVhY3ROb2RlO1xufVxuXG5leHBvcnQgY29uc3QgQXV0aFByb3ZpZGVyID0gKHsgY2hpbGRyZW4gfTogQXV0aFByb3ZpZGVyUHJvcHMpID0+IHtcbiAgY29uc3QgW3VzZXIsIHNldFVzZXJdID0gdXNlU3RhdGU8VXNlciB8IG51bGw+KG51bGwpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3Qgc2Vzc2lvbiA9IHN1cGFiYXNlLmF1dGguZ2V0U2Vzc2lvbigpLnRoZW4oKHsgZGF0YSB9KSA9PiB7XG4gICAgICBzZXRVc2VyKGRhdGEuc2Vzc2lvbj8udXNlciA/PyBudWxsKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHsgZGF0YTogbGlzdGVuZXIgfSA9IHN1cGFiYXNlLmF1dGgub25BdXRoU3RhdGVDaGFuZ2UoKF9ldmVudCwgc2Vzc2lvbikgPT4ge1xuICAgICAgc2V0VXNlcihzZXNzaW9uPy51c2VyID8/IG51bGwpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGxpc3RlbmVyLnN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIH07XG4gIH0sIFtdKTtcblxuICBjb25zdCBsb2dpbiA9IGFzeW5jIChlbWFpbDogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgeyBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuYXV0aC5zaWduSW5XaXRoUGFzc3dvcmQoeyBlbWFpbCwgcGFzc3dvcmQgfSk7XG4gICAgcmV0dXJuIHsgZXJyb3IgfTtcbiAgfTtcblxuICBjb25zdCBsb2dvdXQgPSBhc3luYyAoKSA9PiB7XG4gICAgYXdhaXQgc3VwYWJhc2UuYXV0aC5zaWduT3V0KCk7XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8QXV0aENvbnRleHQuUHJvdmlkZXIgdmFsdWU9e3sgdXNlciwgbG9naW4sIGxvZ291dCB9fT5cbiAgICAgIHtjaGlsZHJlbn1cbiAgICA8L0F1dGhDb250ZXh0LlByb3ZpZGVyPlxuICApO1xufTtcblxuZXhwb3J0IGNvbnN0IHVzZUF1dGggPSAoKSA9PiB7XG4gIGNvbnN0IGNvbnRleHQgPSB1c2VDb250ZXh0KEF1dGhDb250ZXh0KTtcbiAgaWYgKCFjb250ZXh0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd1c2VBdXRoIG11c3QgYmUgdXNlZCB3aXRoaW4gYW4gQXV0aFByb3ZpZGVyJyk7XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQ7XG59O1xuIl0sIm5hbWVzIjpbIlJlYWN0IiwiY3JlYXRlQ29udGV4dCIsInVzZUNvbnRleHQiLCJ1c2VFZmZlY3QiLCJ1c2VTdGF0ZSIsInN1cGFiYXNlIiwiQXV0aENvbnRleHQiLCJBdXRoUHJvdmlkZXIiLCJjaGlsZHJlbiIsInVzZXIiLCJzZXRVc2VyIiwic2Vzc2lvbiIsImF1dGgiLCJnZXRTZXNzaW9uIiwidGhlbiIsImRhdGEiLCJsaXN0ZW5lciIsIm9uQXV0aFN0YXRlQ2hhbmdlIiwiX2V2ZW50Iiwic3Vic2NyaXB0aW9uIiwidW5zdWJzY3JpYmUiLCJsb2dpbiIsImVtYWlsIiwicGFzc3dvcmQiLCJlcnJvciIsInNpZ25JbldpdGhQYXNzd29yZCIsImxvZ291dCIsInNpZ25PdXQiLCJQcm92aWRlciIsInZhbHVlIiwidXNlQXV0aCIsImNvbnRleHQiLCJFcnJvciJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/lib/auth-provider.tsx\n");

/***/ }),

/***/ "./src/lib/supabase.ts":
/*!*****************************!*\
  !*** ./src/lib/supabase.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   supabase: () => (/* binding */ supabase)\n/* harmony export */ });\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @supabase/supabase-js */ \"@supabase/supabase-js\");\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__);\n\nconst supabaseUrl = \"https://schstfgcamkqvvxhmrlg.supabase.co\" || 0;\nconst supabaseAnonKey = \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjaHN0ZmdjYW1rcXZ2eGhtcmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MDk2NDcsImV4cCI6MjA1ODI4NTY0N30.bG058Mryfqis03yo8esObJc7OtKejwduojVMldZOcYI\" || 0;\nconst supabase = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__.createClient)(supabaseUrl, supabaseAnonKey);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvbGliL3N1cGFiYXNlLnRzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUFxRDtBQUVyRCxNQUFNQyxjQUFjQywwQ0FBb0MsSUFBSTtBQUM1RCxNQUFNRyxrQkFBa0JILGtOQUF5QyxJQUFJO0FBRTlELE1BQU1LLFdBQVdQLG1FQUFZQSxDQUFDQyxhQUFhSSxpQkFBaUIiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9zZW5zYXNpd2FuZ2kvLi9zcmMvbGliL3N1cGFiYXNlLnRzPzA2ZTEiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJztcblxuY29uc3Qgc3VwYWJhc2VVcmwgPSBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwgfHwgJyc7XG5jb25zdCBzdXBhYmFzZUFub25LZXkgPSBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TVVBBQkFTRV9BTk9OX0tFWSB8fCAnJztcblxuZXhwb3J0IGNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHN1cGFiYXNlVXJsLCBzdXBhYmFzZUFub25LZXkpO1xuIl0sIm5hbWVzIjpbImNyZWF0ZUNsaWVudCIsInN1cGFiYXNlVXJsIiwicHJvY2VzcyIsImVudiIsIk5FWFRfUFVCTElDX1NVUEFCQVNFX1VSTCIsInN1cGFiYXNlQW5vbktleSIsIk5FWFRfUFVCTElDX1NVUEFCQVNFX0FOT05fS0VZIiwic3VwYWJhc2UiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/lib/supabase.ts\n");

/***/ }),

/***/ "./src/pages/_app.tsx":
/*!****************************!*\
  !*** ./src/pages/_app.tsx ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ App)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _clerk_nextjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @clerk/nextjs */ \"@clerk/nextjs\");\n/* harmony import */ var _clerk_nextjs__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_clerk_nextjs__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _lib_auth_provider__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../lib/auth-provider */ \"./src/lib/auth-provider.tsx\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../styles/globals.css */ \"./src/styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_4__);\n\n\n\n\n\nfunction App({ Component, pageProps }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_clerk_nextjs__WEBPACK_IMPORTED_MODULE_2__.ClerkProvider, {\n        ...pageProps,\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_lib_auth_provider__WEBPACK_IMPORTED_MODULE_3__.AuthProvider, {\n            children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                ...pageProps\n            }, void 0, false, {\n                fileName: \"E:\\\\website\\\\xampp\\\\htdocs\\\\Sensasiwangiweb\\\\src\\\\pages\\\\_app.tsx\",\n                lineNumber: 11,\n                columnNumber: 9\n            }, this)\n        }, void 0, false, {\n            fileName: \"E:\\\\website\\\\xampp\\\\htdocs\\\\Sensasiwangiweb\\\\src\\\\pages\\\\_app.tsx\",\n            lineNumber: 10,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"E:\\\\website\\\\xampp\\\\htdocs\\\\Sensasiwangiweb\\\\src\\\\pages\\\\_app.tsx\",\n        lineNumber: 9,\n        columnNumber: 5\n    }, this);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvcGFnZXMvX2FwcC50c3giLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBMEI7QUFFb0I7QUFDTTtBQUNyQjtBQUVoQixTQUFTRyxJQUFJLEVBQUVDLFNBQVMsRUFBRUMsU0FBUyxFQUFZO0lBQzVELHFCQUNFLDhEQUFDSix3REFBYUE7UUFBRSxHQUFHSSxTQUFTO2tCQUMxQiw0RUFBQ0gsNERBQVlBO3NCQUNYLDRFQUFDRTtnQkFBVyxHQUFHQyxTQUFTOzs7Ozs7Ozs7Ozs7Ozs7O0FBSWhDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vc2Vuc2FzaXdhbmdpLy4vc3JjL3BhZ2VzL19hcHAudHN4P2Y5ZDYiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB0eXBlIHsgQXBwUHJvcHMgfSBmcm9tICduZXh0L2FwcCc7XG5pbXBvcnQgeyBDbGVya1Byb3ZpZGVyIH0gZnJvbSAnQGNsZXJrL25leHRqcyc7XG5pbXBvcnQgeyBBdXRoUHJvdmlkZXIgfSBmcm9tICcuLi9saWIvYXV0aC1wcm92aWRlcic7XG5pbXBvcnQgJy4uL3N0eWxlcy9nbG9iYWxzLmNzcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEFwcCh7IENvbXBvbmVudCwgcGFnZVByb3BzIH06IEFwcFByb3BzKSB7XG4gIHJldHVybiAoXG4gICAgPENsZXJrUHJvdmlkZXIgey4uLnBhZ2VQcm9wc30+XG4gICAgICA8QXV0aFByb3ZpZGVyPlxuICAgICAgICA8Q29tcG9uZW50IHsuLi5wYWdlUHJvcHN9IC8+XG4gICAgICA8L0F1dGhQcm92aWRlcj5cbiAgICA8L0NsZXJrUHJvdmlkZXI+XG4gICk7XG59XG4iXSwibmFtZXMiOlsiUmVhY3QiLCJDbGVya1Byb3ZpZGVyIiwiQXV0aFByb3ZpZGVyIiwiQXBwIiwiQ29tcG9uZW50IiwicGFnZVByb3BzIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./src/pages/_app.tsx\n");

/***/ }),

/***/ "./src/styles/globals.css":
/*!********************************!*\
  !*** ./src/styles/globals.css ***!
  \********************************/
/***/ (() => {



/***/ }),

/***/ "@clerk/nextjs":
/*!********************************!*\
  !*** external "@clerk/nextjs" ***!
  \********************************/
/***/ ((module) => {

"use strict";
module.exports = require("@clerk/nextjs");

/***/ }),

/***/ "@supabase/supabase-js":
/*!****************************************!*\
  !*** external "@supabase/supabase-js" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@supabase/supabase-js");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("./src/pages/_app.tsx"));
module.exports = __webpack_exports__;

})();