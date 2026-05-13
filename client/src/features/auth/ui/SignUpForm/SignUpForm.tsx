"use client";

import { useState } from "react";
import "./SignUpForm.css";
import { UserValidator } from "../../../../entities/user/model/UserValidator";
import UserApi from "../../../../entities/user/api/UserApi";
import { setAccessToken } from "../../../../shared/lib/axiosInstance";
import FormInput from "../../../../shared/ui/FormInput/FormInput";

export default function SignUpForm() {
  const initialValue = { name: "", email: "", password: "" };
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

    const { statusCode, data, message } = await UserApi.register(signUpData);

    if (statusCode === 201) {
      setAccessToken(data.accessToken);
      window.location.href = "/";
    } else {
      alert(message || "Ошибка при регистрации");
    }
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
