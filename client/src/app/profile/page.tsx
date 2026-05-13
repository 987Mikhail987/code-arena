"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import UserApi from "@/entities/user/api/UserApi";
import { selectUser } from "@/entities/user/model/selectors";
import type { UserRole } from "@/entities/user/model/types";
import { clearUser, setUser } from "@/entities/user/model/userSlice";
import UserGuard from "@/features/auth/ui/UserGuard/UserGuard";
import { setAccessToken } from "@/shared/lib/axiosInstance";
import FormInput from "@/shared/ui/FormInput/FormInput";
import styles from "./page.module.css";

type ProfileFormState = {
  name: string;
  role: UserRole | "";
};

type PasswordFormState = {
  password: string;
  newPassword: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    name: "",
    role: "",
  });
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    password: "",
    newPassword: "",
  });
  const [message, setMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const profileName = profileForm.name || user?.name || "";
  const profileRole = profileForm.role || user?.role || "candidate";

  async function saveProfileHandler(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingProfile(true);
    setMessage("");

    const response = await UserApi.updateProfile({
      name: profileName,
      role: profileRole,
    });

    if (response?.statusCode === 200) {
      dispatch(setUser(response.data));
      setProfileForm({
        name: "",
        role: "",
      });
      setMessage("Профиль успешно обновлен");
    } else {
      setMessage(response?.error || response?.message || "Не удалось обновить профиль");
    }

    setIsSavingProfile(false);
  }

  async function changePasswordHandler(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingPassword(true);
    setMessage("");

    const response = await UserApi.changePassword(passwordForm);

    if (response?.statusCode === 200) {
      setPasswordForm({ password: "", newPassword: "" });
      setMessage("Пароль успешно обновлен");
    } else {
      setMessage(response?.error || response?.message || "Не удалось обновить пароль");
    }

    setIsSavingPassword(false);
  }

  async function logoutHandler() {
    await UserApi.logout();
    dispatch(clearUser());
    setAccessToken("");
    router.replace("/auth");
  }

  async function deleteAccountHandler() {
    const isConfirmed = window.confirm("Удалить аккаунт без возможности восстановления?");
    if (!isConfirmed) {
      return;
    }

    setIsDeleting(true);
    setMessage("");

    const response = await UserApi.deleteAccount();

    if (response?.statusCode === 200) {
      dispatch(clearUser());
      setAccessToken("");
      router.replace("/auth");
      return;
    }

    setMessage(response?.error || response?.message || "Не удалось удалить аккаунт");
    setIsDeleting(false);
  }

  return (
    <UserGuard mode="authenticated" redirectTo="/auth">
      {user ? (
        <div className={`app-container ${styles.profilePage}`}>
          <section className={styles.heroCard}>
            <p className={styles.kicker}>Профиль</p>
            <h1 className={styles.title}>{user.name}</h1>
            <p className={styles.subtitle}>{user.email}</p>
            <div className={styles.badges}>
              <span className={styles.badge}>
                {user.role === "candidate" ? "Кандидат" : "Интервьюер"}
              </span>
            </div>
          </section>

          <div className={styles.grid}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Данные аккаунта</h2>
              <form className={styles.form} onSubmit={saveProfileHandler}>
                <FormInput
                  name="name"
                  type="text"
                  value={profileName}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  required
                  placeholder=" "
                  label="Имя"
                />
                <div className={styles.selectWrapper}>
                  <select
                    id="role"
                    name="role"
                    className={`${styles.select} form-input`}
                    value={profileRole}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        role: event.target.value as UserRole,
                      }))
                    }
                  >
                    <option value="candidate">Кандидат</option>
                    <option value="intervier">Интервьюер</option>
                  </select>
                  <label className={`form-input-label ${styles.selectLabel}`} htmlFor="role">
                    Роль
                  </label>
                </div>
                <button className={styles.primaryButton} disabled={isSavingProfile}>
                  {isSavingProfile ? "Сохраняем..." : "Сохранить профиль"}
                </button>
              </form>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Безопасность</h2>
              <form className={styles.form} onSubmit={changePasswordHandler}>
                <FormInput
                  name="password"
                  type="password"
                  value={passwordForm.password}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  required
                  placeholder=" "
                  label="Текущий пароль"
                />
                <FormInput
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: event.target.value,
                    }))
                  }
                  required
                  placeholder=" "
                  label="Новый пароль"
                />
                <button className={styles.primaryButton} disabled={isSavingPassword}>
                  {isSavingPassword ? "Обновляем..." : "Изменить пароль"}
                </button>
              </form>
            </section>
          </div>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Действия</h2>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={logoutHandler}
              >
                Выйти из аккаунта
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={deleteAccountHandler}
                disabled={isDeleting}
              >
                {isDeleting ? "Удаляем..." : "Удалить аккаунт"}
              </button>
            </div>
            {message ? <p className={styles.message}>{message}</p> : null}
          </section>
        </div>
      ) : null}
    </UserGuard>
  );
}
