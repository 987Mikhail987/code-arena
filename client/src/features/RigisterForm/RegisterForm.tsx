import { useNavigate } from "react-router";
import { UserValidator } from "../../entities/user/model/UserValidator";
import UserApi from "../../entities/user/api/UserApi";
import { setAccessToken } from "../../shared/lib/axiosInstance";
import { useState } from "react";
import type { AuthorizationProps } from "../../pages/AuthorizationPage";
import "../AuthorizationForm/AuthorizationForm.css";

type FormData = {
  name: string;
  email: string;
  level?: "student" | "junior" | "middle" | "senior" | "";
  password: string;
  confirmPassword: string;
};

export default function RegisterForm({ setUser }: AuthorizationProps) {
  const initialInputsData: FormData = {
    name: "",
    email: "",
    level: "",
    password: "",
    confirmPassword: "",
  };
  const [inputs, setInputs] = useState<FormData>(initialInputsData);
  const navigate = useNavigate();

  const inputHandler = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setInputs((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const onSubmitForm = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (inputs.level === "") {
      alert("Выберите уровень");
      return;
    }

    const dataToValidate = {
      name: inputs.name,
      email: inputs.email,
      level: inputs.level as "student" | "junior" | "middle" | "senior",
      password: inputs.password,
      confirmPassword: inputs.confirmPassword,
    };

    const { isValid, error: validationError } =
      UserValidator.validateRegistrationData(dataToValidate);

    if (!isValid) {
      alert(validationError);
      return;
    }

    const { statusCode, data, message } = await UserApi.register(inputs);

    if (statusCode === 201) {
      setAccessToken(data.accessToken);
      setUser(data.user);
      navigate("/");
      setInputs(initialInputsData);
    } else {
      alert(message || "Ошибка при регистрации");
    }
  };

  return (
    <div className="form-shell">
      <form className="auth-form" onSubmit={onSubmitForm}>
        <input
          className="form-field"
          placeholder="Введите ваше имя"
          name="name"
          type="text"
          required
          onChange={inputHandler}
          value={inputs.name}
        />
        <input
          className="form-field"
          placeholder="Ваш email"
          name="email"
          type="email"
          required
          onChange={inputHandler}
          value={inputs.email}
        />
        <select
          className="form-field"
          name="level"
          required
          onChange={inputHandler}
          value={inputs.level}
        >
          <option value="">Выберите уровень</option>
          <option value="student">Студент</option>
          <option value="junior">Junior</option>
          <option value="middle">Middle</option>
          <option value="senior">Senior</option>
        </select>
        <input
          className="form-field"
          placeholder="Ваш пароль"
          name="password"
          type="password"
          required
          onChange={inputHandler}
          value={inputs.password}
        />
        <input
          className="form-field"
          placeholder="Подтвердите пароль"
          name="confirmPassword"
          type="password"
          required
          onChange={inputHandler}
          value={inputs.confirmPassword}
        />
        <button className="button-primary" type="submit">
          Зарегистрироваться
        </button>
      </form>
      <div className="auth-form__footer">
        <p>Уже зарегистрированы?</p>
        <div className="auth-form__actions">
          <button
            className="button-secondary"
            onClick={() => navigate("/authorization")}
          >
            Войти в профиль
          </button>
        </div>
      </div>
    </div>
  );
}
