/** The animated Z buddy: pulses while idle, bounces while thinking (CSS keyframes in globals.css). */
export function ZBuddy({ size = 56, state = "idle" }: { size?: number; state?: "idle" | "thinking" }) {
  return (
    <span
      aria-hidden
      className={`zbuddy ${state === "thinking" ? "zbuddy-bounce" : "zbuddy-pulse"} inline-flex items-center justify-center rounded-full bg-gradient-to-br from-zido-400 to-zido-600 font-semibold text-white shadow-lg shadow-zido-600/40`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      Z
    </span>
  );
}
