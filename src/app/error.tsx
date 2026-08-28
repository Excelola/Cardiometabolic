"use client";

export default function ErrorPage({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <main className="centered-page" id="main-content">
      <div className="card flow-card">
        <h1>Something went wrong</h1>
        <p>No sensitive details have been displayed. You can safely try again.</p>
        <button className="button button--primary" onClick={reset} type="button">
          Try again
        </button>
      </div>
    </main>
  );
}
