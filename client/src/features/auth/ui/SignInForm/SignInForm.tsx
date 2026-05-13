"use client";

import { useState } from "react";
import { useAppDispatch } from "@/app/store/hooks";
import { setUser } from "@/entities/user/model/userSlice";
import UserApi from "../../../../entities/user/api/UserApi";
import { UserValidator } from "../../../../entities/user/model/UserValidator";
import { setAccessToken } from "../../../../shared/lib/axiosInstance";
import FormInput from "../../../../shared/ui/FormInput/FormInput";
import "./SignInForm.css";

export default function SignInForm() {
  const dispatch = useAppDispatch();
  const initialValue = { email: "", password: "" };
  const [signInData, setSignInData] = useState(initialValue);

  function inputHandler(event: React.ChangeEvent<HTMLInputElement>) {
    setSignInData({
      ...signInData,
      [event.target.name]: event.target.value,
    });
  }

  async function signInHandler(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { isValid, error: validationError } =
      UserValidator.validateLoginData(signInData);

    if (!isValid) {
      alert(validationError);
      return;
    }

    const { statusCode, data, error } = await UserApi.login(signInData);

    if (statusCode === 200) {
      setAccessToken(data.accessToken);
      dispatch(setUser(data.user));
      window.location.href = "/";
    } else {
      alert(error || "Ошибка при входе");
    }
  }

  return (
    <div>
      <form className="form" onSubmit={signInHandler}>
        <FormInput
          placeholder=" "
          name="email"
          type="email"
          required
          onChange={inputHandler}
          value={signInData.email}
          label="Почта"
        />
        <FormInput
          placeholder=" "
          name="password"
          type="password"
          required
          onChange={inputHandler}
          value={signInData.password}
          label="Пароль"
        />
        <button className="form-action-button">Войти</button>
      </form>
    </div>
  );
}
