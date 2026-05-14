"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/app/store/hooks";
import { setUser } from "@/entities/user/model/userSlice";
import UserApi from "@/entities/user/api/UserApi";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/entities/user/model/schemas";
import { setAccessToken } from "@/shared/lib/axiosInstance";
import FormInput from "@/shared/ui/FormInput/FormInput";
import "./SignUpForm.css";
import { useRef } from "react";

export default function SignUpForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      repeatPassword: "",
      role: "candidate",
    },
  });

  async function signUpHandler(values: RegisterFormValues) {
    const { repeatPassword, ...payload } = values;
    void repeatPassword;

    const { statusCode, data, message, error } = await UserApi.register(payload);

    if (statusCode === 201) {
      setAccessToken(data.accessToken);
      dispatch(setUser(data.user));
      router.replace("/");
      return;
    }

    setError("root", {
      message: error || message || "Ошибка при регистрации",
    });
  }

  return (
    <div>
      <form className="form" onSubmit={handleSubmit(signUpHandler)}>
        <div className="form-field">
          <FormInput placeholder=" " type="text" label="Имя" {...register("name")} />
          {errors.name ? <p className="form-error">{errors.name.message}</p> : null}
        </div>
        <div className="form-field">
          <FormInput placeholder=" " type="email" label="Почта" {...register("email")} />
          {errors.email ? <p className="form-error">{errors.email.message}</p> : null}
        </div>
        <div className="form-field">
          <FormInput placeholder=" " type="password" label="Пароль" {...register("password")} />
          {errors.password ? <p className="form-error">{errors.password.message}</p> : null}
        </div>
        <div className="form-field">
          <FormInput
            placeholder=" "
            type="password"
            label="Повторите пароль"
            {...register("repeatPassword")}
          />
          {errors.repeatPassword ? (
            <p className="form-error">{errors.repeatPassword.message}</p>
          ) : null}
        </div>
        <div className="form-field">
          <div className="form-input-wrapper">
            <select id="role" className="form-input" {...register("role")}>
              <option value="candidate">Кандидат</option>
              <option value="intervier">Интервьюер</option>
            </select>
            <label className="form-input-label" htmlFor="role">
              Роль
            </label>
          </div>
          {errors.role ? <p className="form-error">{errors.role.message}</p> : null}
        </div>
        {errors.root ? <p className="form-error">{errors.root.message}</p> : null}
        <button className="form-action-button" disabled={isSubmitting}>
          {isSubmitting ? "Регистрируем..." : "Зарегистрироваться"}
        </button>
      </form>
    </div>
  );
}
