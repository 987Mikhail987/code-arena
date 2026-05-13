import { useEffect, useState } from "react";
import "./App.css";
import UserApi from "../../entities/user/api/UserApi";
import { setAccessToken } from "../../shared/lib/axiosInstance";
import AppRouter from "../routing/AppRouter";
import type { UserType } from "../../entities/user/model";

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const { statusCode, data } = await UserApi.refresh();
      if (statusCode === 200) {
        setAccessToken(data.accessToken);
        setUser(data.user);
      }
    }
    fetchUser();
  }, []);

  return (
    <div className="app-root">
      <AppRouter user={user} setUser={setUser} />
    </div>
  );
}
