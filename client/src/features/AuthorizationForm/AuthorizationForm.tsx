import { useState } from "react";
import { useNavigate } from "react-router";
import { UserValidator } from "../../entities/user/model/UserValidator";
import UserApi from "../../entities/user/api/UserApi";
import { setAccessToken } from "../../shared/lib/axiosInstance";
import type { AuthorizationProps } from "../../pages/AuthorizationPage";
import "./AuthorizationForm.css";

export default function AuthorizationForm({ setUser }: AuthorizationProps) {
  const initialInputsData = {
    email: "",
    password: "",
  };

  const [inputs, setInputs] = useState(initialInputsData);
  const navigate = useNavigate();

  const inputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputs((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const onSubmitForm = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { isValid, error: validationError } =
      UserValidator.validateLoginData(inputs);

    if (!isValid) {
      alert(validationError);
      return;
    }

    const { statusCode, data, error } = await UserApi.login(inputs);
    if (statusCode === 200) {
      setAccessToken(data.accessToken);
      setUser(data.user);
      navigate("/");
      setInputs(initialInputsData);
    } else {
      alert(error || "Ошибка при входе в приложение");
    }
  };

  return (
    <div className="form-shell">
      <form className="auth-form" onSubmit={onSubmitForm}>
        <input
          className="form-field"
          placeholder="Ваш email"
          name="email"
          type="email"
          required
          onChange={inputHandler}
          value={inputs.email}
        />
        <input
          className="form-field"
          placeholder="Ваш пароль"
          name="password"
          type="password"
          required
          onChange={inputHandler}
          value={inputs.password}
        />
        <button className="button-primary" type="submit">
          Войти
        </button>
      </form>
      <div className="auth-form__footer">
        <p>Еще нет учетной записи?</p>
        <div className="auth-form__actions">
          <button className="button-secondary" onClick={() => navigate("/register")}>
            Создать аккаунт
          </button>
        </div>
      </div>
    </div>
  );
}
