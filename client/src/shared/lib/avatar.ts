import type { User } from "@/entities/user/model/types";

export function getAvatarUrl(user?: Pick<User, "avatar_url" | "avatarUrl"> | null) {
  const avatarUrl = user?.avatar_url || user?.avatarUrl;

  if (!avatarUrl) {
    return "";
  }

  if (/^https?:\/\//.test(avatarUrl)) {
    return avatarUrl;
  }

  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}${avatarUrl}`;
}

export function getUserInitial(name?: string | null) {
  return name?.trim().charAt(0).toUpperCase() || "?";
}
