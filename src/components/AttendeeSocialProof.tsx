type Props = {
  count: number;
  primaryColor: string;
};

export function AttendeeSocialProof({ count, primaryColor }: Props) {
  if (count <= 0) return null;

  return (
    <p className="mt-5 text-center text-sm text-gray-600">
      Join{" "}
      <strong style={{ color: primaryColor }}>
        {count.toLocaleString()}+
      </strong>{" "}
      attendees already going
    </p>
  );
}
