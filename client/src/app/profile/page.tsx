"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import UserApi from "@/entities/user/api/UserApi";
import { selectUser } from "@/entities/user/model/selectors";
import {
  passwordChangeSchema,
  profileSchema,
  type PasswordChangeFormValues,
  type ProfileFormValues,
} from "@/entities/user/model/schemas";
import { clearUser, setUser } from "@/entities/user/model/userSlice";
import { setAccessToken } from "@/shared/lib/axiosInstance";
import FormInput from "@/shared/ui/FormInput/FormInput";
import styles from "./page.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      role: user?.role ?? "candidate",
    },
  });

  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      password: "",
      newPassword: "",
    },
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    profileForm.reset({
      name: user.name,
      role: user.role,
    });
  }, [profileForm, user]);

  if (!user) {
    return null;
  }

  async function saveProfileHandler(values: ProfileFormValues) {
    setAccountMessage("");
    setProfileMessage("");

    const response = await UserApi.updateProfile(values);

    if (response?.statusCode === 200) {
      dispatch(setUser(response.data));
      setProfileMessage("Профиль успешно обновлен");
      return;
    }

    profileForm.setError("root", {
      message: response?.error || response?.message || "Не удалось обновить профиль",
    });
  }

  async function changePasswordHandler(values: PasswordChangeFormValues) {
    setAccountMessage("");
    setPasswordMessage("");

    const response = await UserApi.changePassword(values);

    if (response?.statusCode === 200) {
      passwordForm.reset({
        password: "",
        newPassword: "",
      });
      setPasswordMessage("Пароль успешно обновлен");
      return;
    }

    passwordForm.setError("root", {
      message: response?.error || response?.message || "Не удалось обновить пароль",
    });
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
    setAccountMessage("");

    const response = await UserApi.deleteAccount();

    if (response?.statusCode === 200) {
      dispatch(clearUser());
      setAccessToken("");
      router.replace("/auth");
      return;
    }

    setAccountMessage(response?.error || response?.message || "Не удалось удалить аккаунт");
    setIsDeleting(false);
  }

  return (
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
          <form className={styles.form} onSubmit={profileForm.handleSubmit(saveProfileHandler)}>
            <div className={styles.formField}>
              <FormInput
                placeholder=" "
                type="text"
                label="Имя"
                {...profileForm.register("name")}
              />
              {profileForm.formState.errors.name ? (
                <p className={styles.formError}>
                  {profileForm.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <div className={styles.formField}>
              <div className={styles.selectWrapper}>
                <select
                  id="role"
                  className={`${styles.select} form-input`}
                  {...profileForm.register("role")}
                >
                  <option value="candidate">Кандидат</option>
                  <option value="intervier">Интервьюер</option>
                </select>
                <label className={`form-input-label ${styles.selectLabel}`} htmlFor="role">
                  Роль
                </label>
              </div>
              {profileForm.formState.errors.role ? (
                <p className={styles.formError}>
                  {profileForm.formState.errors.role.message}
                </p>
              ) : null}
            </div>
            {profileForm.formState.errors.root ? (
              <p className={styles.formError}>{profileForm.formState.errors.root.message}</p>
            ) : null}
            <button
              className={styles.primaryButton}
              disabled={profileForm.formState.isSubmitting}
            >
              {profileForm.formState.isSubmitting ? "Сохраняем..." : "Сохранить профиль"}
            </button>
            {profileMessage ? <p className={styles.message}>{profileMessage}</p> : null}
          </form>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Безопасность</h2>
          <form
            className={styles.form}
            onSubmit={passwordForm.handleSubmit(changePasswordHandler)}
          >
            <div className={styles.formField}>
              <FormInput
                placeholder=" "
                type="password"
                label="Текущий пароль"
                {...passwordForm.register("password")}
              />
              {passwordForm.formState.errors.password ? (
                <p className={styles.formError}>
                  {passwordForm.formState.errors.password.message}
                </p>
              ) : null}
            </div>
            <div className={styles.formField}>
              <FormInput
                placeholder=" "
                type="password"
                label="Новый пароль"
                {...passwordForm.register("newPassword")}
              />
              {passwordForm.formState.errors.newPassword ? (
                <p className={styles.formError}>
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              ) : null}
            </div>
            {passwordForm.formState.errors.root ? (
              <p className={styles.formError}>{passwordForm.formState.errors.root.message}</p>
            ) : null}
            <button
              className={styles.primaryButton}
              disabled={passwordForm.formState.isSubmitting}
            >
              {passwordForm.formState.isSubmitting ? "Обновляем..." : "Изменить пароль"}
            </button>
            {passwordMessage ? <p className={styles.message}>{passwordMessage}</p> : null}
          </form>
        </section>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Действия</h2>
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={logoutHandler}>
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
        {accountMessage ? <p className={styles.message}>{accountMessage}</p> : null}
      </section>
    </div>
  );
}
