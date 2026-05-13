import type { UserType } from "../../entities/user/model";

export type AppRouterProps = {
  user: UserType | null;
  setUser: React.Dispatch<React.SetStateAction<UserType | null>>;
};
