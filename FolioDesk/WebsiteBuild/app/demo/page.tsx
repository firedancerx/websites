"use client";

import { useState } from "react";
import Link from "next/link";

export default function DemoRequest() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/foliodesk/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to submit demo request.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="page-hero">
        <div className="eyebrow">PROJECT FINANCE CONTROL</div>
        <h1>Request a FolioDesk Demo</h1>
        <p>
          Discover how FolioDesk can help your engineering or construction firm protect project margins and streamline progress claims.
        </p>
      </section>

      <section className="form-shell">
        <div className="form-card">
          <h2 style={{ fontSize: 32 }}>Tell us about your business</h2>
          {error && <p className="notice error">{error}</p>}

          {success ? (
            <div className="success-message" style={{ padding: "40px 0", textAlign: "center" }}>
              <h3 style={{ fontSize: 24, marginBottom: 16, color: "var(--color-primary, #0f172a)" }}>
                Demo Request Submitted!
              </h3>
              <p style={{ color: "var(--color-text-muted, #475569)", marginBottom: 24 }}>
                Thank you for your interest. One of our project control specialists will reach out to you within 24 hours to schedule your personalized walkthrough.
              </p>
              <Link href="/" className="button primary">
                Back to Homepage
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="field">
                <label htmlFor="fullName">Contact Name</label>
                <input id="fullName" name="fullName" required maxLength={160} />
              </div>

              <div className="field">
                <label htmlFor="email">Business Email</label>
                <input id="email" name="email" type="email" required />
              </div>

              <div className="field">
                <label htmlFor="phone">Telephone Number</label>
                <input id="phone" name="phone" required />
              </div>

              <div className="field">
                <label htmlFor="companyName">Company Name</label>
                <input id="companyName" name="companyName" required />
              </div>

              <div className="field">
                <label htmlFor="region">Operating Region</label>
                <select id="region" name="region" required>
                  <option value="SG">Singapore</option>
                  <option value="MY">Malaysia</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="tier">Pricing Tier of Interest</label>
                <select id="tier" name="tier" required>
                  <option value="STARTER">Starter (1–5 users)</option>
                  <option value="GROWTH">Growth (6–15 users)</option>
                  <option value="BUSINESS">Business (16–50 users)</option>
                </select>
              </div>

              <div className="field full">
                <label htmlFor="message">Message / Specific Requirements (Optional)</label>
                <textarea id="message" name="message" rows={4} maxLength={2000} placeholder="Tell us about your active projects, current challenges, or specific features you want to see." />
              </div>

              <button className="button primary submit" type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Schedule My Demo"}
              </button>
            </form>
          )}
        </div>

        <aside className="side-panel">
          <div className="section-kicker">WHAT TO EXPECT</div>
          <h3>A personalized walkthrough</h3>
          <ul>
            <li>Margin analysis dashboard demo</li>
            <li>Tailored SG/MY tax & currency handling</li>
            <li>Customized integration options for site tools</li>
            <li>15-minute quick call, no high-pressure sales</li>
          </ul>
        </aside>
      </section>
    </>
  );
}
