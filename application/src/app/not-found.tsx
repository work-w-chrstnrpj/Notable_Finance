import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <div className="not-found__panel">
        <p className="eyebrow">Notion Finance</p>
        <h1>Section not found</h1>
        <p>The requested finance workspace section is not available.</p>
        <Link href="/dashboard">Go to Dashboard</Link>
      </div>
    </main>
  );
}
