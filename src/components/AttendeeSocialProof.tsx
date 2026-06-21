type Props = {
  count: number;
  primaryColor: string;
  accentColor: string;
  /** Shown on the form before submit — next participant number. */
  nextParticipantNumber?: number;
};

export function AttendeeSocialProof({
  count,
  primaryColor,
  accentColor,
  nextParticipantNumber,
}: Props) {
  if (count <= 0 && (nextParticipantNumber ?? 0) <= 1) return null;

  return (
    <div
      className="rounded-xl px-4 py-3 text-center"
      style={{
        backgroundColor: `${accentColor}18`,
        borderColor: accentColor,
        borderWidth: 2,
      }}
    >
      {nextParticipantNumber != null && nextParticipantNumber > 0 ? (
        <p
          className="text-base font-bold md:text-lg"
          style={{ color: primaryColor }}
        >
          You&apos;ll be participant #{nextParticipantNumber.toLocaleString()}
        </p>
      ) : null}
      {count > 0 ? (
        <p
          className={`text-sm text-gray-600 ${nextParticipantNumber != null ? "mt-1" : ""}`}
        >
          Join{" "}
          <strong style={{ color: primaryColor }}>
            {count.toLocaleString("en-US")}+
          </strong>{" "}
          attendees who already created their frame
        </p>
      ) : null}
    </div>
  );
}
