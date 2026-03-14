import { AVATAR_PALETTES, getInitials } from '@/app/data/employees';

interface EmployeeAvatarProps {
  name: string;
  avatarIndex: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  /** When set, show photo from Firestore (employee_photos) instead of initials */
  photoUrl?: string | null;
}

const sizeMap = {
  sm: { container: 40, text: 14, font: 600 },
  md: { container: 64, text: 20, font: 700 },
  lg: { container: 80, text: 26, font: 700 },
  xl: { container: 96, text: 32, font: 700 },
};

export function EmployeeAvatar({
  name,
  avatarIndex,
  size = 'md',
  className = '',
  photoUrl,
}: EmployeeAvatarProps) {
  const palette = AVATAR_PALETTES[avatarIndex % AVATAR_PALETTES.length];
  const initials = getInitials(name);
  const { container, text, font } = sizeMap[size];

  if (photoUrl?.trim()) {
    return (
      <div
        className={`rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-accent ${className}`}
        style={{ width: container, height: container }}
      >
        <img
          src={photoUrl}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 select-none ${className}`}
      style={{
        width: container,
        height: container,
        background: `radial-gradient(circle at 35% 35%, ${palette.bg}dd, ${palette.bg})`,
        boxShadow: `0 4px 16px ${palette.bg}50, inset 0 1px 0 rgba(255,255,255,0.25)`,
        color: palette.text,
        fontSize: text,
        fontWeight: font,
        letterSpacing: '0.05em',
      }}
    >
      {initials}
    </div>
  );
}
