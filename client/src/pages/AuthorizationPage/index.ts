import type { UserType } from "../../entities/user/model";

export type AuthorizationProps = {
  setUser: React.Dispatch<React.SetStateAction<UserType | null>>;
};