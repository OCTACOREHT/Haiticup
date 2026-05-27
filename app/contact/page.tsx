"use client";

import { FormEvent, useEffect, useState } from "react";
import AppIcon from "@/components/AppIcon";
import SiteFooter from "@/components/SiteFooter";
import SiteNavbar from "@/components/SiteNavbar";

type StatusTone = "info" | "success" | "error";

const navLinks = [
  { href: "/match-schedule", label: "Match Schedule" },
  { href: "/#rules", label: "Rules" },
  { href: "/match-schedule#groups", label: "Groups" },
  { href: "/match-schedule#bracket", label: "Bracket" },
];

const mobileLinks = [
  { href: "/match-schedule", icon: "calendar_today", label: "Match Schedule" },
  { href: "/#rules", icon: "gavel", label: "Rules" },
  { href: "/match-schedule#groups", icon: "groups", label: "Groups" },
  { href: "/match-schedule#bracket", icon: "account_tree", label: "Bracket" },
];

const inputClassName =
  "w-full rounded-md border border-[#004AD3]/20 bg-white px-3 py-2 text-sm text-[#004AD3] outline-none transition focus:border-[#004AD3] focus:ring-2 focus:ring-[#004AD3]/15";

const contactInfoCards = [
  { icon: "mail", label: "Official Email", value: "info@granpanpannationscup.com" },
  { icon: "call", label: "Operations Desk", value: "+1 (561) 704-4613" },
  { icon: "location_on", label: "Venue", value: "Ezell Hester Community Center" },
  { icon: "calendar_month", label: "Championship Start", value: "July 12, 2026" },
];

export default function ContactPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [clubName, setClubName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [subject, setSubject] = useState("General Inquiry");
  const [subjectOther, setSubjectOther] = useState("");
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<StatusTone>("info");

  const showStatus = (nextMessage: string, nextTone: StatusTone) => {
    setStatusMessage(nextMessage);
    setStatusTone(nextTone);
  };
  const closeStatus = () => {
    setStatusMessage(null);
  };

  useEffect(() => {
    if (!statusMessage) return undefined;

    const timer = window.setTimeout(() => setStatusMessage(null), 5000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [statusMessage]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const finalSubject = subject === "Other" ? subjectOther.trim() : subject.trim();

    if (!fullName.trim() || !email.trim() || !finalSubject || !message.trim()) {
      showStatus("Please complete all required fields.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          club_name: clubName.trim() || null,
          phone_number: phoneNumber.trim() || null,
          subject: finalSubject,
          message: message.trim(),
        }),
      });

      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(result?.error || "Unable to send your message right now.");
      }

      showStatus("Your message has been sent. A confirmation email was sent to your inbox.", "success");
      setFullName("");
      setEmail("");
      setClubName("");
      setPhoneNumber("");
      setSubject("General Inquiry");
      setSubjectOther("");
      setMessage("");
    } catch (error: unknown) {
      const errorMessage =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Unable to send your message right now.";

      showStatus(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F8FF]">
      <SiteNavbar desktopLinks={navLinks} mobileLinks={mobileLinks} registerHref="/register" />

      <main className="flex-1 pt-24 pb-16">
        <section className="mx-auto w-full max-w-[1200px] px-4 md:px-10">
          <div className="rounded-xl border border-[#004AD3]/12 bg-white p-8 shadow-[0_20px_44px_rgba(0,74,211,0.09)] md:p-10">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#004AD3]/70 uppercase">
              Contact Center
            </p>
            <h1 className="mt-2 text-3xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#004AD3] uppercase md:text-5xl">
              Contact Granpanpan Nations Cup
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#004AD3]/78 md:text-base">
              Send your request to tournament operations. We handle registration assistance, schedule clarifications,
              administrative support, and official club communication.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
              <aside className="space-y-6 lg:col-span-5">
                <div className="rounded-lg border border-[#004AD3]/14 bg-[#F8FBFF] p-5">
                  <h2 className="text-lg font-extrabold [font-family:var(--font-nav),sans-serif] text-[#004AD3] uppercase">
                    Operations Details
                  </h2>
                  <div className="mt-4 space-y-3.5">
                    {contactInfoCards.map((item) => (
                      <div key={item.label} className="flex items-start gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#004AD3] shadow-[inset_0_0_0_1px_rgba(0,74,211,0.16)]">
                          <AppIcon name={item.icon} className="text-[18px]" />
                        </span>
                        <div>
                          <p className="text-[10px] font-semibold tracking-[0.1em] text-[#004AD3]/60 uppercase">{item.label}</p>
                          <p className="text-sm font-semibold text-[#0D47B5]">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </aside>

              <div className="rounded-lg border border-[#004AD3]/14 bg-white p-6 lg:col-span-7">
                <h2 className="text-xl font-extrabold [font-family:var(--font-nav),sans-serif] text-[#004AD3] uppercase">
                  Send a Message
                </h2>
                <p className="mt-2 text-sm text-[#004AD3]/78">
                  Complete the form and we will send you an automatic confirmation email after submission.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">Full Name *</span>
                      <input className={inputClassName} value={fullName} onChange={(event) => setFullName(event.target.value)} required />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">Email *</span>
                      <input type="email" className={inputClassName} value={email} onChange={(event) => setEmail(event.target.value)} required />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">Club Name</span>
                      <input className={inputClassName} value={clubName} onChange={(event) => setClubName(event.target.value)} placeholder="Optional" />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">Phone Number</span>
                      <input className={inputClassName} value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="Optional" />
                    </label>
                  </div>

                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">Subject *</span>
                    <select className={inputClassName} value={subject} onChange={(event) => setSubject(event.target.value)} required>
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Team Registration Support">Team Registration Support</option>
                      <option value="Schedule Question">Schedule Question</option>
                      <option value="Operations Request">Operations Request</option>
                      <option value="Technical Issue">Technical Issue</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  {subject === "Other" ? (
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">Other Subject *</span>
                      <input
                        className={inputClassName}
                        value={subjectOther}
                        onChange={(event) => setSubjectOther(event.target.value)}
                        placeholder="Enter your subject"
                        required
                      />
                    </label>
                  ) : null}

                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold tracking-[0.08em] text-[#004AD3]/70 uppercase">Message *</span>
                    <textarea
                      className={`${inputClassName} min-h-[170px] resize-y`}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="Write your message..."
                      required
                    />
                  </label>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`rounded-none border border-[#0B6A9B] px-7 py-3 text-sm font-extrabold tracking-[0.08em] text-white uppercase ${
                        isSubmitting ? "cursor-not-allowed bg-[#0B6A9B]/70" : "bg-[#1AD1D7] hover:bg-[#0B6A9B]"
                      }`}
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {statusMessage ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#02163D]/45 px-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeStatus();
            }
          }}
        >
          <div
            className={`relative w-full max-w-[760px] rounded-2xl border px-6 py-5 shadow-[0_20px_44px_rgba(0,0,0,0.24)] ${
              statusTone === "error"
                ? "border-[#B3261E]/35 bg-[#FFF4F4] text-[#8A1C18]"
                : "border-[#0D47B5]/35 bg-[#0D47B5] text-white"
            }`}
            role="status"
            aria-live="polite"
          >
            <button
              type="button"
              onClick={closeStatus}
              aria-label="Close notification"
              className={`absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                statusTone === "error" ? "text-[#8A1C18] hover:bg-[#8A1C18]/10" : "text-white hover:bg-white/15"
              }`}
            >
              <AppIcon name="close" className="text-[18px]" />
            </button>
            <div className="flex items-start gap-3 pr-10">
              <span
                className={`inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                  statusTone === "error" ? "bg-[#8A1C18]/12 text-[#8A1C18]" : "bg-white/16 text-white"
                }`}
              >
                <AppIcon name={statusTone === "error" ? "error" : "check_circle"} className="text-[18px]" />
              </span>
              <p className="text-lg leading-8">{statusMessage}</p>
            </div>
          </div>
        </div>
      ) : null}

      <SiteFooter variant="contact" />
    </div>
  );
}
