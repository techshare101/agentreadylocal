export default function AgentReadyLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hexagon outer frame */}
      <polygon
        points="150,22 272,92 272,232 150,302 28,232 28,92"
        fill="none"
        stroke="oklch(0.48 0.10 160)"
        strokeWidth="20"
        strokeLinejoin="round"
      />
      {/* Centered AR bold typography */}
      <text
        x="150"
        y="190"
        fill="oklch(0.48 0.10 160)"
        fontSize="115"
        fontWeight="800"
        fontFamily="Public Sans, system-ui, -apple-system, sans-serif"
        textAnchor="middle"
        letterSpacing="-3"
      >
        AR
      </text>
    </svg>
  );
}
