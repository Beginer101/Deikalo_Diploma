// Універсальний бейдж статусу. CSS-клас формується як `${prefix}${value}`.
export default function StatusBadge({ value, labels, prefix = 'badge-' }) {
  const label = labels?.[value] ?? value;
  return <span className={`badge ${prefix}${value}`}>{label}</span>;
}
