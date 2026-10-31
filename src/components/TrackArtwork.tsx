import type { Track } from "../models";
import { useApp } from "../app/context";
import { tracks } from "../content/scenarios";

/** Original decoration, never a representation of learner metrics. */
export function TrackGlyph({ track }: { track: Track }) {
  return (
    <svg
      className={`track-glyph ${track}`}
      viewBox="0 0 160 120"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="12"
        y="12"
        width="136"
        height="96"
        rx="35"
        fill="var(--track-soft)"
      />
      {track === "builder" ? (
        <g
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="30" y="27" width="100" height="66" rx="9" fill="white" />
          <path d="M30 43h100M62 57l-11 10 11 10m36-20 11 10-11 10M86 55l-9 24" />
          <circle cx="40" cy="35" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="47" cy="35" r="1.5" fill="currentColor" stroke="none" />
        </g>
      ) : track === "founder" ? (
        <g
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M42 59h76M80 43v42" />
          <circle cx="80" cy="38" r="15" fill="white" />
          <rect x="27" y="53" width="32" height="32" rx="10" fill="white" />
          <rect x="101" y="53" width="32" height="32" rx="10" fill="white" />
          <path d="M73 38l5 5 10-11M37 69h12m58 0h12M65 96h30" />
        </g>
      ) : (
        <g
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M31 93h100" />
          <rect x="39" y="66" width="18" height="27" rx="4" fill="white" />
          <rect x="71" y="50" width="18" height="43" rx="4" fill="white" />
          <rect x="103" y="31" width="18" height="62" rx="4" fill="white" />
          <path d="M38 44l20-12 20 5 16-12" />
          <circle cx="39" cy="44" r="4" fill="currentColor" stroke="none" />
        </g>
      )}
      <circle cx="140" cy="27" r="5" fill="currentColor" opacity=".5" />
      <path
        d="M19 88h10m-5-5v10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function JourneyArtwork() {
  const { text } = useApp();
  return (
    <div className="path-landscape" aria-hidden="true">
      {(["builder", "founder", "investor"] as Track[]).map((track) => (
        <div className={`mini-path ${track}`} key={track}>
          <TrackGlyph track={track} />
          <span>{text(tracks[track].name)}</span>
        </div>
      ))}
      <svg
        className="landscape-connector"
        viewBox="0 0 300 25"
        fill="none"
        focusable="false"
      >
        <path
          d="M48 2v8a8 8 0 0 0 8 8h188a8 8 0 0 0 8-8V2M150 18v7"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="3 5"
        />
      </svg>
    </div>
  );
}

export function StepMotif({ step }: { step: number }) {
  return (
    <svg
      className="step-motif"
      width="72"
      height="48"
      viewBox="0 0 72 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {step === 0 ? (
        <>
          <circle cx="36" cy="24" r="19" fill="var(--indigo-soft)" />
          <path
            d="m44 14-4 14-12 6 4-14 12-6Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="36" cy="24" r="2" fill="currentColor" />
        </>
      ) : step === 1 ? (
        <>
          <path
            d="M12 34h16V14h32"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="12"
            cy="34"
            r="6"
            fill="var(--indigo-soft)"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="28"
            cy="14"
            r="6"
            fill="white"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="60"
            cy="14"
            r="6"
            fill="var(--indigo-soft)"
            stroke="currentColor"
            strokeWidth="2"
          />
        </>
      ) : (
        <>
          <rect
            x="17"
            y="5"
            width="38"
            height="38"
            rx="9"
            fill="var(--indigo-soft)"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M27 16h18M27 23h10m-8 9 5 5 11-11"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
