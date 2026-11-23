const FIELDS = [
  { key: "focus", label: "Focus" },
  { key: "short", label: "Short Break" },
  { key: "long", label: "Long Break" },
];

export default function Settings({ settings, onChange }) {
  return (
    <section className="settings">
      <h3>Settings (minutes)</h3>
      <div className="settings-grid">
        {FIELDS.map((f) => (
          <label key={f.key}>
            {f.label}
            <input
              type="number"
              min="1"
              max="120"
              value={settings[f.key]}
              onChange={(e) => onChange(f.key, e.target.value)}
            />
          </label>
        ))}
      </div>
    </section>
  );
}