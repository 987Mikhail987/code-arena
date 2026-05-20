"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/app/store/hooks";
import { setUser } from "@/entities/user/model/userSlice";
import UserApi from "@/entities/user/api/UserApi";
import {
  loginSchema,
  type LoginFormValues,
} from "@/entities/user/model/schemas";
import { setAccessToken } from "@/shared/lib/axiosInstance";
import FormInput from "@/shared/ui/FormInput/FormInput";
import "./SignInForm.css";

export default function SignInForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function signInHandler(values: LoginFormValues) {
    const { statusCode, data } = await UserApi.login(values);

    if (statusCode === 200) {
      setAccessToken(data.accessToken);
      dispatch(setUser(data.user));
      router.replace("/");
      return;
    }

    setError("root", {
      message: "Неправильный логин или пароль",
    });
  }

  return (
    <div>
      <form className="form" onSubmit={handleSubmit(signInHandler)}>
        <div className="form-field">
          <FormInput placeholder=" " type="email" label="Почта" {...register("email")} />
          {errors.email ? <p className="form-error">{errors.email.message}</p> : null}
        </div>
        <div className="form-field">
          <FormInput
            placeholder=" "
            type="password"
            label="Пароль"
            {...register("password")}
          />
          {errors.password ? <p className="form-error">{errors.password.message}</p> : null}
        </div>
        {errors.root ? <p className="form-error">{errors.root.message}</p> : null}
        <button className="form-action-button" disabled={isSubmitting}>
          {isSubmitting ? "Входим..." : "Войти"}
        </button>
      </form>
    </div>
  );
}
