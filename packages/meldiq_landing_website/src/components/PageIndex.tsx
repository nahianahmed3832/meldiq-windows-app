export function PageIndex({ items, spanish = false }: { items: { id: string; label: string }[]; spanish?: boolean }) {
  return (
    <nav className="page-index" aria-label={spanish ? "En esta página" : "On this page"}>
      <details open>
        <summary>{spanish ? "En esta página" : "On this page"}</summary>
        <ol>
          {items.map(({ id, label }) => (
            <li key={id}>
              <a href={`#${id}`}>{label}</a>
            </li>
          ))}
        </ol>
      </details>
    </nav>
  );
}
