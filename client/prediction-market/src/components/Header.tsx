import { NavLink } from "react-router-dom";
import { shortenAddress } from "../utils/constants";

interface Props {
  address: string | null;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function Header({ address, connecting, onConnect, onDisconnect }: Props) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? "text-accent bg-bg-elevated"
        : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
        <NavLink to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-500 grid place-items-center text-white text-xs font-extrabold">
            PM
          </div>
          <span className="text-text-primary font-bold text-lg tracking-tight">
            Prediction<span className="text-text-muted font-normal">Market</span>
          </span>
        </NavLink>

        <nav className="flex items-center gap-1.5">
          <NavLink to="/" className={linkClass} end>
            Markets
          </NavLink>
          <NavLink to="/create" className={linkClass}>
            Create
          </NavLink>
          <NavLink to="/lookup" className={linkClass}>
            Lookup
          </NavLink>

          {address ? (
            <button
              onClick={onDisconnect}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-bg-card font-mono text-xs text-text-primary cursor-pointer transition-all hover:border-accent hover:bg-accent-glow ml-2"
            >
              <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_var(--color-success)]" />
              {shortenAddress(address)}
            </button>
          ) : (
            <button
              onClick={onConnect}
              disabled={connecting}
              className="px-5 py-2 rounded-xl border border-accent bg-accent-glow text-accent font-semibold text-sm cursor-pointer transition-all hover:bg-accent hover:text-white disabled:opacity-50 ml-2"
            >
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
