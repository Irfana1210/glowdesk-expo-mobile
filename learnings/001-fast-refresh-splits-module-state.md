# 001 — Fast Refresh splits module-level state

**Symptom.** In a development session, every barcode entered on the scanner after the first was
rejected with "This order changed on another device. Showing the latest version." No other device
existed. The hook, screen and mock server specs all passed, and the same flow passed in a fresh
app launch.

**Cause.** `MockServer` kept its data in a module-level variable. Metro's Fast Refresh re-evaluates
an edited module and the modules that import it, so after an edit two copies of `MockServer` were
alive: the copy captured by the mutation defaults registered on the `QueryClient` at start-up, and
a new copy behind `useOrders`. A scan was applied and versioned by the first copy; the refetch read
the second, which still held the old version; the next scan carried that old version and was
rejected as a conflict, and so on for every scan after it.

**Why the tests missed it.** Every spec imports the module once, so a singleton that lives in
module scope and a singleton that lives on the process are indistinguishable to them. Only the
development runtime, where modules are re-evaluated while the React tree keeps its state, tells
them apart.

**Fix.** Server state lives on `globalThis`, so every copy of the module shares it. The mock
server spec now evaluates a second copy with `jest.isolateModules` and asserts it sees a change
made through the first.

**Habit.** Anything that must be a singleton for the life of the app (an in-memory server, a
connection, a queue) is keyed on `globalThis`, not held in module scope, because Fast Refresh
re-creates module scope but React state, and the closures it captured, survive. When a bug appears
only while editing and disappears after a full reload, suspect this before suspecting the data.
