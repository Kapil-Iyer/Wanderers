/**
 * PLEXUS BACKGROUND — low-poly network/plexus graphic behind all page content.
 * Fixed, full-viewport, purely decorative (pointer-events: none). Reinforces the
 * "find your people" idea via a connected node mesh, dense/bright on the left
 * fading to a sparse starfield on the right.
 */
export default function PlexusBackground() {
  return (
    <div
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    >
      <svg
        viewBox="0 0 1560 860"
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id="plxWash" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffa24d" stopOpacity="0.5" />
            <stop offset="0.3" stopColor="#ff9a4d" stopOpacity="0.2" />
            <stop offset="0.56" stopColor="#ff9a4d" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="plxTri" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffc48a" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ff6a1a" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <rect width="1560" height="860" fill="url(#plxWash)" />
        <g fill="url(#plxTri)" stroke="#ffbe80" strokeOpacity="0.35" strokeWidth="1">
          <polygon points="0,0 240,120 120,340" />
          <polygon points="240,120 120,340 420,360" />
          <polygon points="240,120 560,220 420,360" />
          <polygon points="560,220 420,360 700,320" />
          <polygon points="120,340 300,560 420,360" />
          <polygon points="420,360 300,560 620,560" />
          <polygon points="0,0 560,220 240,120" />
          <polygon points="700,320 620,560 940,540" />
          <polygon points="560,220 700,320 820,140" />
        </g>
        <g stroke="#ff9a4d" strokeOpacity="0.42" strokeWidth="1" fill="none">
          <path d="M240,120 L560,220 L820,140 L1120,90 L1430,180" />
          <path d="M240,120 L120,340 L420,360 L700,320 L1000,300 L1300,360" />
          <path d="M120,340 L300,560 L620,560 L940,540 L1240,560" />
          <path d="M300,560 L180,720 L520,740 L860,720 L1180,760" />
          <path d="M560,220 L420,360 M420,360 L700,320 M700,320 L1000,300 M1000,300 L1300,360" />
          <path d="M420,360 L620,560 M700,320 L620,560 M700,320 L940,540 M1000,300 L940,540 M1300,360 L1240,560" />
          <path d="M560,220 L620,560 M420,360 L300,560 M620,560 L520,740 M940,540 L860,720 M1240,560 L1180,760" />
        </g>
        <g fill="#ffd08a">
          <circle cx="240" cy="120" r="4.5" /><circle cx="560" cy="220" r="5" /><circle cx="820" cy="140" r="3.5" /><circle cx="1120" cy="90" r="3" /><circle cx="1430" cy="180" r="4" />
          <circle cx="120" cy="340" r="4" /><circle cx="420" cy="360" r="5" /><circle cx="700" cy="320" r="4" /><circle cx="1000" cy="300" r="3.5" /><circle cx="1300" cy="360" r="4.5" />
          <circle cx="300" cy="560" r="4.5" /><circle cx="620" cy="560" r="4" /><circle cx="940" cy="540" r="3.5" /><circle cx="1240" cy="560" r="4" />
          <circle cx="180" cy="720" r="3.5" /><circle cx="520" cy="740" r="4" /><circle cx="860" cy="720" r="3.5" /><circle cx="1180" cy="760" r="3" />
        </g>
        <g fill="#ff5a2e">
          <circle cx="700" cy="320" r="2.5" /><circle cx="1120" cy="90" r="2.5" /><circle cx="940" cy="540" r="2.5" /><circle cx="520" cy="740" r="2.5" />
        </g>
        <g fill="#ffe08a" opacity="0.8">
          <circle cx="1350" cy="470" r="2" /><circle cx="1220" cy="240" r="1.6" /><circle cx="1460" cy="620" r="2.2" /><circle cx="980" cy="700" r="1.6" /><circle cx="1100" cy="600" r="1.4" /><circle cx="1300" cy="700" r="1.8" /><circle cx="880" cy="450" r="1.4" /><circle cx="760" cy="600" r="1.6" /><circle cx="1420" cy="360" r="1.5" /><circle cx="1180" cy="440" r="1.3" />
        </g>
        <g fill="#ff8a3d" opacity="0.7">
          <circle cx="1400" cy="520" r="1.6" /><circle cx="1050" cy="500" r="1.4" /><circle cx="1250" cy="480" r="1.2" /><circle cx="960" cy="380" r="1.4" /><circle cx="1330" cy="240" r="1.3" />
        </g>
      </svg>
    </div>
  );
}
