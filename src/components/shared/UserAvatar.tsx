import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface UserAvatarProps {
  profileUrl?: string | null;
  name?: string | null;
  className?: string; // Standard tailwind size + shape overrides
  fallbackClassName?: string;
}

/**
 * A reusable wrapper around Shadcn's Avatar that correctly extracts initials
 * and handles broken URL error states universally.
 */
export function UserAvatar({ profileUrl, name, className, fallbackClassName }: UserAvatarProps) {
  
  // Extract up to 2 initials from the provided name
  const getInitials = (fullName?: string | null) => {
    if (!fullName) return null;
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <Avatar className={className}>
      {/* 
        AvatarImage will automatically fail over to AvatarFallback 
        if src is falsy or if the image fails to load via onError.
      */}
      {profileUrl && <AvatarImage src={profileUrl} alt={name || "User Avatar"} className="object-cover" />}
      
      <AvatarFallback className={fallbackClassName}>
        {initials ? (
          <span className="font-semibold">{initials}</span>
        ) : (
          <User className="w-1/2 h-1/2 text-muted-foreground" />
        )}
      </AvatarFallback>
    </Avatar>
  );
}
