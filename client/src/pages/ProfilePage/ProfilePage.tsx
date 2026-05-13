import { useState } from "react";
import type { AppRouterProps } from "../../app/routing";
import type { UserType } from "../../entities/user/model/index";
import ProfileApi from "../../entities/profile/api/ProfileApi";
import { useNavigate } from "react-router";
import { UserValidator } from "../../entities/user/model/UserValidator";
import "./ProfilePage.css";

export default function ProfilePage({ user, setUser }: AppRouterProps) {
  const initialInputsNewPassword = {
    password: "",
    newPassword: "",
    confirmNewPassword: "",
  };
  const initialInputsEmail = {
    email: "",
  };
  const initialInputsProfile = {
    name: "",
    level: "",
  };

  const [inputsProfile, setInputsProfile] = useState(initialInputsProfile);
  const [inputsEmail, setInputsEmail] = useState(initialInputsEmail);
  const [inputsPassword, setInputsPassword] = useState(initialInputsNewPassword);

  const [editProfile, setEditProfile] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [editPassword, setEditPassword] = useState(false);

  const navigate = useNavigate();

  const inputHandler = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (event.target.name === "email") {
      setInputsEmail((current) => ({
        ...current,
        [event.target.name]: event.target.value,
      }));
    }
    if (event.target.name === "name" || event.target.name === "level") {
      setInputsProfile((current) => ({
        ...current,
        [event.target.name]: event.target.value,
      }));
    }
    if (
      event.target.name === "confirmNewPassword" ||
      event.target.name === "newPassword" ||
      event.target.name === "password"
    ) {
      setInputsPassword((current) => ({
        ...current,
        [event.target.name]: event.target.value,
      }));
    }
  };

  const onSubmitFormEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isValid = UserValidator.validateEmail(inputsEmail.email);
    if (!isValid) {
      alert("Некорректный адрес электронной почты");
      return;
    }
    const { statusCode, message } = await ProfileApi.updateProfile({
      email: inputsEmail.email,
    });
    if (statusCode === 200) {
      setUser((current) =>
        current ? { ...current, email: inputsEmail.email } : null,
      );
      setInputsEmail(initialInputsEmail);
      setEditEmail(false);
      alert("Почта успешно изменена");
    } else {
      alert(message || "Ошибка при смене почты");
    }
  };

  const handleEditProfile = () => {
    setInputsProfile({
      name: user?.name ?? "",
      level: user?.level ?? "",
    });
    setEditProfile(true);
  };

  const onSubmitFormProfile = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const name = inputsProfile.name.trim();
    const level = inputsProfile.level.trim();

    if (!name || !level) {
      alert("Имя и уровень не могут быть пустыми.");
      return;
    }

    const levelValue = level as UserType["level"];
    const { statusCode, message } = await ProfileApi.updateProfile({
      name,
      level: levelValue,
    });

    if (statusCode === 200) {
      setUser((current) =>
        current ? { ...current, name, level: levelValue } : null,
      );
      setInputsProfile(initialInputsProfile);
      setEditProfile(false);
      alert("Профиль успешно изменен");
    } else {
      alert(message || "Ошибка при изменении профиля");
    }
  };

  const onSubmitFormPassword = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const { isValid, error: validationError } =
      UserValidator.validateNewPassword(inputsPassword);
    if (!isValid) {
      alert(validationError);
      return;
    }

    const { statusCode, message } =
      await ProfileApi.updateProfilePassword(inputsPassword);

    if (statusCode === 200) {
      setInputsPassword(initialInputsNewPassword);
      setEditPassword(false);
      alert("Пароль успешно изменен");
    } else {
      alert(message || "Ошибка при смене пароля");
    }
  };

  const cancelPasswordEdit = () => {
    setInputsPassword(initialInputsNewPassword);
    setEditPassword(false);
  };

  const cancelProfileEdit = () => {
    setInputsProfile(initialInputsProfile);
    setEditProfile(false);
  };

  const handleDeleteAccount = async () => {
    const isConfirmed = window.confirm(
      "Вы уверены, что хотите удалить профиль? Это действие необратимо.",
    );
    if (isConfirmed) {
      try {
        await ProfileApi.deleteProfile();
        setUser(null);
        navigate("/");
      } catch (error) {
        alert("Не удалось удалить профиль. Попробуйте позже.");
        console.error(error);
      }
    }
  };

  return (
    <section className="page-section">
      <div className="page-shell profile-page">
        <div className="section-intro">
          <span className="section-kicker">Profile</span>
          <h2>Личный кабинет</h2>
          <p>Управляйте данными профиля, почтой и безопасностью аккаунта.</p>
        </div>

        <div className="profile-page__grid">
          <section className="page-card profile-page__card">
            <h3>Общие данные</h3>
            {editProfile ? (
              <form className="profile-page__form" onSubmit={onSubmitFormProfile}>
                <input
                  className="form-field"
                  placeholder="Имя"
                  name="name"
                  type="text"
                  required
                  onChange={inputHandler}
                  value={inputsProfile.name}
                />
                <select
                  className="form-field"
                  name="level"
                  required
                  onChange={inputHandler}
                  value={inputsProfile.level}
                >
                  <option value="">Выберите уровень</option>
                  <option value="student">Студент</option>
                  <option value="junior">Junior</option>
                  <option value="middle">Middle</option>
                  <option value="senior">Senior</option>
                </select>
                <div className="profile-page__actions">
                  <button className="button-primary" type="submit">
                    Сохранить
                  </button>
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={cancelProfileEdit}
                  >
                    Отменить
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-page__view">
                <p>
                  Имя: <span className="profile-page__value">{user?.name}</span>
                </p>
                <p>
                  Уровень:{" "}
                  <span className="profile-page__value">{user?.level}</span>
                </p>
                <div className="profile-page__actions">
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={handleEditProfile}
                  >
                    Изменить имя и уровень
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="page-card profile-page__card">
            <h3>Данные авторизации</h3>
            {editEmail ? (
              <form className="profile-page__form" onSubmit={onSubmitFormEmail}>
                <input
                  className="form-field"
                  placeholder="Email"
                  name="email"
                  type="email"
                  required
                  onChange={inputHandler}
                  value={inputsEmail.email}
                />
                <div className="profile-page__actions">
                  <button className="button-primary" type="submit">
                    Сохранить
                  </button>
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={() => setEditEmail(false)}
                  >
                    Отменить
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-page__view">
                <p>
                  Email: <span className="profile-page__value">{user?.email}</span>
                </p>
                <div className="profile-page__actions">
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={() => setEditEmail(true)}
                  >
                    Изменить почту
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="page-card profile-page__card">
            <h3>Безопасность</h3>
            {editPassword ? (
              <form
                className="profile-page__form"
                onSubmit={onSubmitFormPassword}
              >
                <input
                  className="form-field"
                  placeholder="Старый пароль"
                  name="password"
                  type="password"
                  required
                  onChange={inputHandler}
                  value={inputsPassword.password}
                />
                <input
                  className="form-field"
                  placeholder="Новый пароль"
                  name="newPassword"
                  type="password"
                  required
                  onChange={inputHandler}
                  value={inputsPassword.newPassword}
                />
                <input
                  className="form-field"
                  placeholder="Подтвердите новый пароль"
                  name="confirmNewPassword"
                  type="password"
                  required
                  onChange={inputHandler}
                  value={inputsPassword.confirmNewPassword}
                />
                <div className="profile-page__actions">
                  <button className="button-primary" type="submit">
                    Сохранить
                  </button>
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={cancelPasswordEdit}
                  >
                    Отменить
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-page__actions">
                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => setEditPassword(true)}
                >
                  Изменить пароль
                </button>
              </div>
            )}
          </section>
        </div>

        <section className="profile-page__danger">
          <h3>Опасная зона</h3>
          <p>Удаление профиля необратимо. История запросов и доступ будут потеряны.</p>
          <div className="profile-page__actions">
            <button
              className="button-danger"
              type="button"
              onClick={handleDeleteAccount}
            >
              Удалить профиль
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}
