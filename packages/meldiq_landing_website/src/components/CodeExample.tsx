import { useState } from "react";

/** Static SDK example, never executed in the visitor's browser. */
export function CodeExample({ code, label }: { code: string; label: string }) {
  const [message, setMessage] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setMessage("Code copied.");
    } catch {
      setMessage("Copy is unavailable. Select the code below to copy it manually.");
    }
  }
  return (
    <div className="code-example">
      <div className="code-toolbar">
        <span>{label}</span>
        <button type="button" onClick={copy}>
          Copy code
        </button>
      </div>
      <pre tabIndex={0} aria-label={label}>
        <code>{code}</code>
      </pre>
      <p className="copy-status" role="status">
        {message || "Run from the extracted SDK directory on your own server."}
      </p>
    </div>
  );
}
