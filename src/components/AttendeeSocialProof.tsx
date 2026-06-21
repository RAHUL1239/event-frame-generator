type Props = {
  count: number;
  primaryColor: string;
  accentColor: string;
};

export function AttendeeSocialProof({
  count,
  primaryColor,
  accentColor,
}: Props) {
  if (count <= 0) return null;

  return (
    <div
      className="rounded-xl px-4 py-3 text-center text-sm text-gray-600"
      style={{
        backgroundColor: `${accentColor}18`,
        borderColor: accentColor,
        borderWidth: 2,
      }}
    >
      Join{" "}
      <strong style={{ color: primaryColor }}>
        {count.toLocaleString("en-US")}+
      </strong>{" "}
      attendees at the event
    </div>
  );
}
