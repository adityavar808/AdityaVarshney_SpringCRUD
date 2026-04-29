import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { createStudent, deleteStudent, getStudents, updateStudent } from "./api";

const emptyForm = { name: "", email: "", course: "" };
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" });

export default function App() {
  const [students, setStudents]     = useState([]);
  const [form, setForm]             = useState(emptyForm);
  const [editingId, setEditingId]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId]         = useState(null);
  const [search, setSearch]         = useState("");
  const [feedback, setFeedback]     = useState(null);
  const [status, setStatus]         = useState("checking");
  const [lastSync, setLastSync]     = useState(null);

  const deferredSearch = useDeferredValue(search);

  useEffect(() => { loadStudents(); }, []);

  const q = deferredSearch.trim().toLowerCase();
  const filtered = q
    ? students.filter(s => [s.name, s.email, s.course].some(v => v.toLowerCase().includes(q)))
    : students;
  const totalCourses = new Set(students.map(s => s.course.toLowerCase())).size;
  const editingStudent = students.find(s => s.id === editingId) || null;

  function markOnline() { setStatus("online"); setLastSync(new Date()); }

  function handleError(err) {
    setStatus(err.code === "NETWORK_ERROR" ? "offline" : "online");
    setFeedback({ type: "error", text: err.message });
  }

  async function syncStudents(msg = "") {
    const data = await getStudents();
    startTransition(() => setStudents(Array.isArray(data) ? data : []));
    markOnline();
    if (msg) setFeedback({ type: "success", text: msg });
  }

  async function loadStudents(msg = "") {
    students.length === 0 ? setLoading(true) : setRefreshing(true);
    try { await syncStudents(msg); }
    catch (err) { handleError(err); }
    finally { setLoading(false); setRefreshing(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateStudent(editingId, form);
        setEditingId(null); setForm(emptyForm);
        await syncStudents(`Saved changes for ${form.name}.`);
      } else {
        await createStudent(form);
        setForm(emptyForm);
        await syncStudents(`Added ${form.name}.`);
      }
    } catch (err) { handleError(err); }
    finally { setSubmitting(false); }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function handleEdit(student) {
    setEditingId(student.id);
    setForm({ name: student.name, email: student.email, course: student.course });
    setFeedback({ type: "info", text: `Editing ${student.name}.` });
  }

  function handleReset() {
    setEditingId(null); setForm(emptyForm); setFeedback(null);
  }

  async function handleDelete(student) {
    if (!window.confirm(`Delete ${student.name}?`)) return;
    setBusyId(student.id);
    try {
      await deleteStudent(student.id);
      if (editingId === student.id) handleReset();
      await syncStudents(`Deleted ${student.name}.`);
    } catch (err) { handleError(err); }
    finally { setBusyId(null); }
  }

  const statusColors = {
    online:   "text-emerald-600 bg-emerald-50 border-emerald-200",
    offline:  "text-rose-600 bg-rose-50 border-rose-200",
    checking: "text-amber-600 bg-amber-50 border-amber-200",
  };
  const feedbackColors = {
    success: "text-emerald-800 bg-emerald-50 border-emerald-200",
    error:   "text-rose-800 bg-rose-50 border-rose-200",
    info:    "text-sky-800 bg-sky-50 border-sky-200",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-medium text-gray-900">Student Management CRUD App</h1>
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusColors[status]}`}>
            {status === "online" ? "Live" : status === "offline" ? "Offline" : "Checking"}
          </span>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${feedbackColors[feedback.type]}`}>
            {feedback.text}
          </div>
        )}

        {/* Top row: Form + Stats */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px]">

          {/* Form */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="mb-4 text-sm font-medium text-gray-900">
              {editingId ? `Edit student #${editingId}` : "Add student"}
            </p>
            <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" name="name" value={form.name} onChange={handleChange} placeholder="Aditya" required />
              <Field label="Course" name="course" value={form.course} onChange={handleChange} placeholder="Spring Boot" required />
              <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="aditya@example.com" className="sm:col-span-2" required />
              <div className="flex gap-2 sm:col-span-2">
                <button type="submit" disabled={submitting}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                  {submitting ? "Saving…" : editingId ? "Update" : "Add"}
                </button>
                <button type="button" onClick={handleReset}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  Clear
                </button>
              </div>
            </form>
          </div>

          {/* Stats */}
          <div className="flex flex-col gap-3">
            <StatCard label="Students" value={students.length} />
            <StatCard label="Courses" value={totalCourses}
              sub={lastSync ? "Synced " + timeFmt.format(lastSync) : "Not synced"} />
          </div>
        </div>

        {/* Search + Table */}
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
            <input className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
              placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            <span className="text-xs text-gray-400">{filtered.length} / {students.length}</span>
            <button onClick={() => loadStudents("Refreshed.")} disabled={refreshing}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              {refreshing ? "…" : "Refresh"}
            </button>
          </div>

          {loading ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">
              {students.length === 0 ? "No students yet." : "No results."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-gray-400">
                <tr>
                  {["ID", "Name", "Email", "Course", "Status", ""].map(h => (
                    <th key={h} className="px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-xs text-gray-400">#{student.id}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{student.name}</td>
                    <td className="px-5 py-3 text-gray-500">{student.email}</td>
                    <td className="px-5 py-3 text-gray-600">{student.course}</td>
                    <td className="px-5 py-3">
                      {editingId === student.id && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-700">Editing</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleEdit(student)}
                        className="mr-2 rounded border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(student)} disabled={busyId === student.id}
                        className="rounded border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                        {busyId === student.id ? "…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs text-gray-500">{label}</span>
      <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
        {...props} />
    </label>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-3xl font-medium text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}