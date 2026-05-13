"use client";

import { useState } from "react";
import { useAppDispatch } from "@/app/store/hooks";
import UserApi from "../../../../entities/user/api/UserApi";
import { UserValidator } from "../../../../entities/user/model/UserValidator";
import { setUser } from "../../../../entities/user/model/userSlice";
import type { UserRole } from "../../../../entities/user/model/types";
import { setAccessToken } from "../../../../shared/lib/axiosInstance";
import FormInput from "../../../../shared/ui/FormInput/FormInput";
import "./SignUpForm.css";

export default function SignUpForm() {
  const dispatch = useAppDispatch();
  const initialValue: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  } = {
    name: "",
    email: "",
    password: "",
    role: "candidate",
  };

  const [signUpData, setSignUpData] = useState(initialValue);
  const [repeat, setRepeat] = useState("");

  function inputHandler(event: React.ChangeEvent<HTMLInputElement>) {
    setSignUpData({
      ...signUpData,
      [event.target.name]: event.target.value,
    });
  }

  async function signUpHandler(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { isValid, error: validationError } =
      UserValidator.validateRegistrationData(signUpData);

    if (!isValid) {
      alert(validationError);
      return;
    }

    const { statusCode, data, message, error } = await UserApi.register(signUpData);

    if (statusCode === 201) {
      setAccessToken(data.accessToken);
      dispatch(setUser(data.user));
      window.location.href = "/";
      return;
    }

    alert(error || message || "Ошибка при регистрации");
  }

  return (
    <div>
      <form className="form" onSubmit={signUpHandler}>
        <FormInput
          placeholder=" "
          name="name"
          type="text"
          required
          onChange={inputHandler}
          value={signUpData.name}
          label="Имя"
        />
        <FormInput
          placeholder=" "
          name="email"
          type="email"
          required
          onChange={inputHandler}
          value={signUpData.email}
          label="Почта"
        />
        <FormInput
          placeholder=" "
          name="password"
          type="password"
          required
          onChange={inputHandler}
          value={signUpData.password}
          label="Пароль"
        />
        <div className="form-input-wrapper">
          <select
            id="role"
            name="role"
            className="form-input"
            value={signUpData.role}
            onChange={(event) =>
              setSignUpData({
                ...signUpData,
                role: event.target.value as UserRole,
              })
            }
          >
            <option value="candidate">Кандидат</option>
            <option value="intervier">Интервьюер</option>
          </select>
          <label className="form-input-label" htmlFor="role">
            Роль
          </label>
        </div>
        <FormInput
          placeholder=" "
          name="repeat"
          type="password"
          required
          label="Повторите пароль"
          value={repeat}
          onChange={(event) => setRepeat(event.target.value)}
        />
        <button
          className="form-action-button"
          disabled={!signUpData.password || repeat !== signUpData.password}
        >
          Зарегистрироваться
        </button>
      </form>
    </div>
  );
}
