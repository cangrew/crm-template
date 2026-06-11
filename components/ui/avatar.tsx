import { initials } from "@/lib/design/format";

type Props = {
  name?: string | null;
  size?: number;
  color?: string;
};

export function Avatar({ name, size = 34, color }: Props) {
  return (
    <span
      className="um-av"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: color,
      }}
    >
      {initials(name)}
    </span>
  );
}
