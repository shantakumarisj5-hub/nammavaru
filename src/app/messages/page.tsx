
"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";

type Member = {
  id: string;
  name: string;
};

type Message = {
  id: number;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function MessagesPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function loadMembers() {
    try {
      const response = await fetch("/api/connections");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load connections");
      }

      const accepted = (data.connections || []).filter(
        (item: any) => item.status === "accepted"
      );

      const ids = Array.from(
        new Set(
          accepted.map((item: any) =>
            item.requester_id === data.currentUserId
              ? item.receiver_id
              : item.requester_id
          )
        )
      ) as string[];

      const availableMembers = (data.members || [])
        .filter((member: Member) => ids.includes(member.id));

      setMembers(availableMembers);
      setCurrentUserId(data.currentUserId || "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load connections"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(member: Member) {
    setSelectedMember(member);
    setError("");

    try {
      const response = await fetch(
        `/api/messages?with=${encodeURIComponent(member.id)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load messages");
      }

      setCurrentUserId(data.currentUserId);
      setMessages(data.messages || []);
    } catch (err) {
      setMessages([]);
      setError(
        err instanceof Error ? err.message : "Unable to load messages"
      );
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedMember || !messageText.trim() || sending) return;

    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedMember.id,
          message: messageText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to send message");
      }

      setMessages((previous) => [...previous, data.message]);
      setMessageText("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to send message"
      );
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  // Refresh the open conversation periodically.
  useEffect(() => {
    if (!selectedMember) return;

    const interval = setInterval(() => {
      loadMessages(selectedMember);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedMember?.id]);

  return (
    <main className="min-h-screen bg-[#0F0A0A] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="text-sm text-yellow-400 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold">
            Messages <span className="text-yellow-400">.</span>
          </h1>
          <p className="mt-2 text-gray-400">
            Connect and chat with your Nammavaru community.
          </p>
        </div>

        <div className="grid min-h-[600px] overflow-hidden rounded-2xl border border-white/10 bg-[#191111] md:grid-cols-[300px_1fr]">
          <aside className="border-b border-white/10 p-5 md:border-b-0 md:border-r">
            <h2 className="mb-4 font-semibold">Your Connections</h2>

            {loading ? (
              <p className="text-sm text-gray-400">Loading connections...</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-400">
                No accepted connections yet. Visit the community page to
                connect with members.
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => loadMessages(member)}
                    className={`w-full rounded-xl p-3 text-left transition ${
                      selectedMember?.id === member.id
                        ? "bg-yellow-400 text-black"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <p className="font-medium">{member.name}</p>
                    <p className={`mt-1 text-xs ${
                      selectedMember?.id === member.id
                        ? "text-black/70"
                        : "text-gray-400"
                    }`}>
                      Open conversation
                    </p>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="flex min-h-[600px] flex-col">
            {selectedMember ? (
              <>
                <div className="border-b border-white/10 p-5">
                  <h2 className="font-semibold">{selectedMember.name}</h2>
                  <p className="text-xs text-green-400">
                    Connected member
                  </p>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                  {messages.length === 0 ? (
                    <p className="mt-20 text-center text-sm text-gray-500">
                      No messages yet. Start the conversation!
                    </p>
                  ) : (
                    messages.map((message) => {
                      const own = message.sender_id === currentUserId;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            own ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            own
                              ? "bg-yellow-400 text-black"
                              : "bg-white/10 text-white"
                          }`}>
                            <p className="break-words text-sm">
                              {message.message}
                            </p>
                            <p className={`mt-2 text-[10px] ${
                              own ? "text-black/60" : "text-gray-400"
                            }`}>
                              {new Date(message.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={sendMessage}
                  className="flex gap-3 border-t border-white/10 p-4"
                >
                  <input
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder="Write a message..."
                    maxLength={2000}
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim() || sending}
                    className="rounded-xl bg-yellow-400 px-5 py-3 font-semibold text-black disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-center">
                <div>
                  <div className="mb-4 text-5xl">💬</div>
                  <h2 className="text-xl font-semibold">
                    Your conversations
                  </h2>
                  <p className="mt-2 text-sm text-gray-400">
                    Select a connection to start messaging.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
