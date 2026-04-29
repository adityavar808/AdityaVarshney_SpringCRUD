import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { createStudent, deleteStudent, getStudents, updateStudent } from "./api";

const emptyForm = {
  name: "",
  email: "",
  course: "",
};

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
});

const navigationGroups = [
  {
    title: "Teaching management",
    items: [
      { label: "Students management", active: true },
    ],
  },
];

function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [connection, setConnection] = useState("checking");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    loadStudents();
  }, []);

  const query = deferredSearch.trim().toLowerCase();
  const filteredStudents = query
    ? students.filter((student) =>
        [student.name, student.email, student.course].some((value) =>
          value.toLowerCase().includes(query)
        )
      )
    : students;
  const totalCourses = new Set(
    students.map((student) => student.course.toLowerCase())
  ).size;
  const editingStudent = students.find((student) => student.id === editingId) || null;

  function markConnectionOnline() {
    setConnection("online");
    setLastSyncedAt(new Date());
  }

  function handleRequestError(error) {
    if (error.code === "NETWORK_ERROR") {
      setConnection("offline");
    } else {
      setConnection("online");
    }

    setFeedback({
      type: "error",
      text: error.message,
    });
  }

  async function syncStudents(successMessage = "") {
    const data = await getStudents();
    const normalizedStudents = Array.isArray(data) ? data : [];

    markConnectionOnline();
    startTransition(() => setStudents(normalizedStudents));

    if (successMessage) {
      setFeedback({
        type: "success",
        text: successMessage,
      });
    }
  }

  async function loadStudents(successMessage = "") {
    const initialLoad = students.length === 0;

    if (initialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      await syncStudents(successMessage);
    } catch (error) {
      handleRequestError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (editingId) {
        await updateStudent(editingId, form);
        setEditingId(null);
        setForm(emptyForm);
        await syncStudents(`Saved changes for ${form.name}.`);
      } else {
        await createStudent(form);
        setForm(emptyForm);
        await syncStudents(`Added ${form.name} to the registry.`);
      }
    } catch (error) {
      handleRequestError(error);
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleEdit(student) {
    setEditingId(student.id);
    setForm({
      name: student.name,
      email: student.email,
      course: student.course,
    });
    setFeedback({
      type: "info",
      text: `Editing ${student.name}. Update the fields and save your changes.`,
    });
  }

  function handleReset() {
    setEditingId(null);
    setForm(emptyForm);
    setFeedback(null);
  }

  async function handleDelete(student) {
    const confirmed = window.confirm(
      `Delete ${student.name} from the student registry?`
    );

    if (!confirmed) {
      return;
    }

    setBusyId(student.id);

    try {
      await deleteStudent(student.id);

      if (editingId === student.id) {
        setEditingId(null);
        setForm(emptyForm);
      }

      await syncStudents(`Deleted ${student.name} successfully.`);
    } catch (error) {
      handleRequestError(error);
    } finally {
      setBusyId(null);
    }
  }

  const connectionStyles =
    connection === "online"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : connection === "offline"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  const feedbackStyles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-rose-200 bg-rose-50 text-rose-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  };

  const lastSyncedLabel = lastSyncedAt
    ? timeFormatter.format(lastSyncedAt)
    : "Not synced yet";

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-12 top-24 h-56 w-56 animate-float rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 animate-float rounded-full bg-sky-300/20 blur-3xl [animation-delay:1.2s]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-violet-200/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="overflow-hidden rounded-[30px] border border-white/60 bg-white/75 shadow-panel backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 px-5 py-4 text-white sm:px-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/80">
                Student platform
              </p>
              <h1 className="mt-1 font-display text-2xl sm:text-3xl">
                Student Bridge
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`hidden rounded-full border px-3 py-1.5 text-xs font-semibold sm:inline-flex ${connectionStyles}`}
              >
                {connection === "online"
                  ? "Live backend"
                  : connection === "offline"
                    ? "Backend offline"
                    : "Checking"}
              </span>

              <TopBarIcon />
              <TopBarIcon power />
            </div>
          </div>

          <div className="grid xl:grid-cols-[250px_minmax(0,1fr)]">
            <aside className="border-b border-slate-200 bg-white xl:border-b-0 xl:border-r">
              <div className="space-y-6 px-4 py-5 sm:px-5">
                {navigationGroups.map((group) => (
                  <div key={group.title}>
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {group.title}
                    </p>
                    <div className="space-y-1.5">
                      {group.items.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition ${
                            item.active
                              ? "bg-rose-50 text-rose-600 shadow-sm"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              item.active ? "bg-rose-500" : "bg-slate-300"
                            }`}
                          />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <main className="bg-[#f7f8ff] px-4 py-5 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Quick search
                  </p>
                  <h2 className="mt-1 font-display text-3xl text-slate-900">
                    Students management
                  </h2>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                    onClick={() => loadStudents("Student list refreshed.")}
                    disabled={refreshing}
                  >
                    {refreshing ? "Refreshing..." : "Linked to Class"}
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                    onClick={handleReset}
                  >
                    {editingId ? "Exit Edit" : "Reset Form"}
                  </button>
                </div>
              </div>

              {feedback && (
                <div
                  className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm ${feedbackStyles[feedback.type]}`}
                >
                  {feedback.text}
                </div>
              )}

              {connection === "offline" && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-800">
                  Frontend cannot reach the backend. Start Spring Boot on
                  <span className="mx-1 font-semibold">http://localhost:8080</span>
                  and restart the React dev server if you changed the proxy or `.env`.
                </div>
              )}

              <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.9fr_0.9fr]">
                <section className="rounded-[24px] border border-white/70 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Student editor
                      </p>
                      <h3 className="mt-1 font-display text-2xl text-slate-900">
                        {editingId ? "Update student" : "Add student"}
                      </h3>
                    </div>

                    {editingStudent && (
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        Editing #{editingStudent.id}
                      </span>
                    )}
                  </div>

                  <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Full name
                        </span>
                        <input
                          className="field"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Aditya"
                          required
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Course
                        </span>
                        <input
                          className="field"
                          name="course"
                          value={form.course}
                          onChange={handleChange}
                          placeholder="Spring Boot"
                          required
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Email address
                      </span>
                      <input
                        className="field"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="aditya@example.com"
                        required
                      />
                    </label>

                    <div className="flex flex-wrap gap-3 pt-1">
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={submitting}
                      >
                        {submitting
                          ? "Saving..."
                          : editingId
                            ? "Update student"
                            : "Create student"}
                      </button>

                      <button type="button" className="btn-secondary" onClick={handleReset}>
                        Clear
                      </button>
                    </div>
                  </form>
                </section>

                <SummaryCard
                  title="Academic records"
                  value={students.length}
                  subtitle="Students in current registry"
                  tone="indigo"
                />

                <SummaryCard
                  title="Pending profile"
                  value={totalCourses}
                  subtitle={`Last synced ${lastSyncedLabel}`}
                  tone="violet"
                />
              </div>

              <div className="mt-4 rounded-[24px] border border-white/70 bg-white p-4 shadow-sm">
                <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr] xl:items-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Quick search
                    </p>
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                      <input
                        className="field mt-0 flex-1"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by student name, email, or course"
                      />
                      <button
                        type="button"
                        className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                        onClick={() => loadStudents("Student list refreshed.")}
                        disabled={refreshing}
                      >
                        Refresh list
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <InfoChip label="Visible" value={filteredStudents.length} />
                    <InfoChip label="All records" value={students.length} />
                    <InfoChip label="Courses" value={totalCourses} />
                  </div>
                </div>
              </div>

              <section className="mt-5 overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Teaching management
                    </p>
                    <h3 className="mt-1 font-display text-2xl text-slate-900">
                      Students management
                    </h3>
                  </div>

                  <div className="text-sm text-slate-500">
                    Showing {filteredStudents.length} of {students.length} students
                  </div>
                </div>

                {loading ? (
                  <div className="grid gap-4 p-5 md:grid-cols-2">
                    <LoadingCard />
                    <LoadingCard />
                    <LoadingCard />
                    <LoadingCard />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <h4 className="font-display text-2xl text-slate-900">
                      {students.length === 0
                        ? "No students yet"
                        : "No students match this search"}
                    </h4>
                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      {students.length === 0
                        ? "Create the first student from the quick form above."
                        : "Try another keyword or refresh the list."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="hidden lg:block">
                      <table className="min-w-full">
                        <thead className="bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          <tr>
                            <th className="px-5 py-4">ID</th>
                            <th className="px-5 py-4">Full name</th>
                            <th className="px-5 py-4">Email</th>
                            <th className="px-5 py-4">Course</th>
                            <th className="px-5 py-4">Status</th>
                            <th className="px-5 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                          {filteredStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-slate-50/70">
                              <td className="px-5 py-4">
                                <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                                  #{student.id}
                                </span>
                              </td>
                              <td className="px-5 py-4 font-medium text-slate-900">
                                {student.name}
                              </td>
                              <td className="px-5 py-4">{student.email}</td>
                              <td className="px-5 py-4">{student.course}</td>
                              <td className="px-5 py-4">
                                <StatusPill
                                  tone={editingId === student.id ? "editing" : "live"}
                                  label={editingId === student.id ? "Editing" : "Normal"}
                                />
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                    onClick={() => handleEdit(student)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                    onClick={() => handleDelete(student)}
                                    disabled={busyId === student.id}
                                  >
                                    {busyId === student.id ? "Deleting..." : "Delete"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid gap-3 p-4 lg:hidden">
                      {filteredStudents.map((student) => (
                        <article
                          key={student.id}
                          className="rounded-[20px] border border-slate-100 bg-slate-50/70 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Student #{student.id}
                              </p>
                              <h4 className="mt-1 font-display text-xl text-slate-900">
                                {student.name}
                              </h4>
                            </div>
                            <StatusPill
                              tone={editingId === student.id ? "editing" : "live"}
                              label={editingId === student.id ? "Editing" : "Normal"}
                            />
                          </div>

                          <div className="mt-4 space-y-2 text-sm text-slate-600">
                            <p>{student.email}</p>
                            <p>{student.course}</p>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              onClick={() => handleEdit(student)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                              onClick={() => handleDelete(student)}
                              disabled={busyId === student.id}
                            >
                              {busyId === student.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </section>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtitle, tone }) {
  const toneStyles =
    tone === "violet"
      ? "from-violet-400 via-indigo-400 to-blue-400"
      : "from-indigo-500 via-blue-500 to-sky-400";

  return (
    <article className={`overflow-hidden rounded-[24px] bg-gradient-to-br ${toneStyles} p-5 text-white shadow-lg`}>
      <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
          {title}
        </p>
        <div className="mt-4 font-display text-4xl">{value}</div>
        <p className="mt-3 text-sm leading-6 text-white/85">{subtitle}</p>
      </div>
    </article>
  );
}

function InfoChip({ label, value }) {
  return (
    <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
      <span className="text-slate-400">{label}</span>{" "}
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function StatusPill({ tone, label }) {
  const styles =
    tone === "editing"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-indigo-200 bg-indigo-50 text-indigo-700";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}>
      {label}
    </span>
  );
}

function TopBarIcon({ power = false }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-sm">
      {power ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
          <path d="M12 3v8" strokeLinecap="round" />
          <path
            d="M7.76 5.94a7 7 0 1 0 8.48 0"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
          <circle cx="12" cy="12" r="3.25" />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

function LoadingCard() {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-5">
      <div className="h-3 w-24 rounded-full bg-slate-200" />
      <div className="mt-4 h-8 w-40 rounded-full bg-slate-200" />
      <div className="mt-5 h-3 w-full rounded-full bg-slate-200" />
      <div className="mt-2 h-3 w-3/4 rounded-full bg-slate-200" />
      <div className="mt-6 flex gap-3">
        <div className="h-10 w-24 rounded-full bg-slate-200" />
        <div className="h-10 w-24 rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

export default App;
