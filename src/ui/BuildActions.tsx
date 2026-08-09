import { useEffect, useState } from "react";

export interface BuildActionsProps {
  disabled: boolean;
  onReset: () => void;
}

/**
 * Header actions. The link is the current canonical URL (spec R6) — the build
 * state is already encoded there by App on every change, so there is nothing to
 * serialise here and no server involved.
 *
 * The build name is a local label only: it is not carried in the link, because
 * the shared URL is the frozen `vs2` contract and this phase changes no
 * contract.
 */
export function BuildActions({ disabled, onReset }: BuildActionsProps) {
  const [name, setName] = useState("My build");
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");

  useEffect(() => {
    if (copied === "idle") return;
    const timer = window.setTimeout(() => setCopied("idle"), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied("done");
    } catch (error) {
      console.error("Copying the build link failed", error);
      setCopied("failed");
    }
  }

  return (
    <div className="build-actions">
      <label className="visually-hidden" htmlFor="build-name">
        Build name
      </label>
      <input
        id="build-name"
        className="build-name"
        data-testid="build-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name this build"
      />

      <span className="copy-status" data-testid="copy-status" role="status">
        {copied === "done"
          ? "Link copied — anyone with it sees this build."
          : copied === "failed"
            ? "Could not copy. Copy the address bar instead."
            : ""}
      </span>

      <button
        type="button"
        className="action-button action-primary"
        data-testid="copy-link"
        onClick={() => void copyLink()}
        disabled={disabled}
      >
        Copy link
      </button>
      <button
        type="button"
        className="action-button"
        data-testid="reset-build"
        onClick={onReset}
        disabled={disabled}
      >
        Reset
      </button>
    </div>
  );
}
