import { useState, useEffect } from "react";

type Habit = { id: number; name: string; days: string[] };

function today() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newName, setNewName] = useState("");

  const load = () =>
    fetch("/api/habits")
      .then((r) => r.json())
      .then(setHabits);

  useEffect(() => {
    load();
  }, []);

  const addHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    }).then(() => {
      setNewName("");
      load();
    });
  };

  const toggleCheck = (habitId: number, day: string) => {
    const h = habits.find((x) => x.id === habitId);
    const checked = h?.days.includes(day);
    const url = `/api/habits/${habitId}/check`;
    if (checked) {
      fetch(url + `?day=${encodeURIComponent(day)}`, { method: "DELETE" }).then(
        load,
      );
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day }),
      }).then(load);
    }
  };

  const deleteHabit = (id: number) => {
    fetch(`/api/habits/${id}`, { method: "DELETE" }).then(load);
  };

  const days = (() => {
    const out: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  })();

  return (
    <div
      style={{
        fontFamily: "system-ui",
        maxWidth: 720,
        margin: "0 auto",
        padding: 24,
      }}
    >
      <h1>Habit Tracker</h1>
      <form
        onSubmit={addHabit}
        style={{ display: "flex", gap: 8, marginBottom: 24 }}
      >
        <input
          type="text"
          placeholder="New habit"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit">Add</button>
      </form>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: 8,
                borderBottom: "2px solid #333",
              }}
            >
              Habit
            </th>
            {days.map((d) => (
              <th
                key={d}
                style={{ padding: 8, borderBottom: "2px solid #333" }}
              >
                {d.slice(5)}
              </th>
            ))}
            <th style={{ width: 80 }} />
          </tr>
        </thead>
        <tbody>
          {habits.map((h) => (
            <tr key={h.id}>
              <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                {h.name}
              </td>
              {days.map((day) => (
                <td
                  key={day}
                  style={{
                    padding: 8,
                    borderBottom: "1px solid #eee",
                    textAlign: "center",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={h.days.includes(day)}
                    onChange={() => toggleCheck(h.id, day)}
                  />
                </td>
              ))}
              <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                <button type="button" onClick={() => deleteHabit(h.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
