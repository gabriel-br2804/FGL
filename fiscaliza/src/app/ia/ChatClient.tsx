"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Source {
  label: string;
  href?: string;
}

interface Message {
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
  followUps?: string[];
}

const EXAMPLES = [
  "Quanto a Prefeitura de Jandira gastou com saúde em 2025?",
  "Quais empresas receberam mais dinheiro da Prefeitura de Jandira?",
  "Quais obras estão atrasadas?",
  "Quais contratos aumentaram mais de 30% após aditivos?",
  "Existem gastos fora do padrão na área da saúde em Jandira?",
];

export function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Olá! Pergunte sobre gastos, contratos, obras ou fornecedores de um município ou empresa. Vou pesquisar a base do Fiscaliza e responder sempre com fontes.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.answer, sources: data.sources, followUps: data.followUps }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Não consegui processar a pergunta agora. Tente novamente em instantes." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <div className="lg:col-span-3">
        <div className="card flex h-[600px] flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto scrollbar-thin p-5">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-navy-900 px-4 py-3 text-sm text-white"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm border border-base-border bg-base-bg px-4 py-3 text-sm text-ink-900"
                  }
                >
                  <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-ink-900/10 pt-2.5">
                      {m.sources.map((s, si) =>
                        s.href ? (
                          <Link key={si} href={s.href} className="rounded-full bg-signal-blue/10 px-2.5 py-1 text-[11px] font-medium text-signal-blue hover:bg-signal-blue/20">
                            {s.label}
                          </Link>
                        ) : (
                          <span key={si} className="rounded-full bg-ink-900/5 px-2.5 py-1 text-[11px] font-medium text-ink-500">
                            {s.label}
                          </span>
                        )
                      )}
                    </div>
                  )}
                  {m.followUps && m.followUps.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {m.followUps.map((f, fi) => (
                        <button
                          key={fi}
                          onClick={() => send(f)}
                          className="rounded-full border border-navy-700/20 px-2.5 py-1 text-[11px] font-medium text-navy-700 hover:bg-navy-700/5"
                        >
                          {f} →
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-base-border bg-base-bg px-4 py-3 text-sm text-ink-500">
                  Pesquisando dados…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-base-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte algo sobre gastos públicos…"
              className="flex-1 rounded-full border border-base-border px-4 py-2.5 text-sm outline-none focus:border-navy-700"
            />
            <button type="submit" className="btn-primary px-5 py-2.5" disabled={loading}>
              Enviar
            </button>
          </form>
        </div>
        <p className="mt-3 text-xs text-ink-500">
          Toda afirmação apresentada possui fonte indicada. Pontos de atenção não constituem acusação — ver{" "}
          <Link href="/metodologia" className="text-signal-blue hover:underline">
            metodologia
          </Link>
          .
        </p>
      </div>

      <div>
        <div className="data-label">Exemplos de perguntas</div>
        <div className="mt-3 space-y-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => send(ex)}
              className="block w-full rounded-xl2 border border-base-border bg-white px-3.5 py-2.5 text-left text-sm text-ink-700 hover:border-navy-700 hover:text-navy-900"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
