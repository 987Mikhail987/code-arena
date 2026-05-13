import type { ReactNode } from "react";
import type { UserType } from "../../entities/user/model";

export type HocsProps = {
  user: UserType | null;
  children: ReactNode;
};
