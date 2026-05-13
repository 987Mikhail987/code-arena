import { useState } from "react";
import type { RequestItem } from "../../entities/request";
import AiApi from "../../entities/ai/api/AiApi";
import "./RequestForm.css";

type Props = {
  onSuccess: (
    data: Pick<
      RequestItem,
      "content" | "level" | "type" | "problem" | "solution" | "explanation"
    >,
  ) => void;
};

type FormState = {
  content: string;
  level: "" | RequestItem["level"];
  type: "" | RequestItem["type"];
};

export default function RequestForm({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const initialInputs: FormState = {
    content: "",
    level: "",
    type: "",
  };

  const [inputs, setInputs] = useState<FormState>(initialInputs);

  const inputHandler = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setInputs((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!inputs.content || !inputs.level || !inputs.type) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        content: inputs.content,
        level: inputs.level,
        type: inputs.type,
      };

      const { statusCode, data } = await AiApi.getResponse(payload);
      if (statusCode === 200) {
        onSuccess({
          content: inputs.content,
          level: inputs.level,
          type: inputs.type,
          problem: data?.problem,
          solution: data?.solution,
          explanation: data?.explanation,
        });
        setInputs(initialInputs);
      }
    } catch (error) {
      console.error("Ошибка при создании запроса:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="request-form" onSubmit={handleSubmitForm}>
      <label className="request-form__label">
        <span className="request-form__caption">Ваш вопрос</span>
        <input
          className="request-form__field request-form__field--input"
          placeholder="Опишите задачу или вставьте фрагмент кода"
          name="content"
          type="text"
          required
          onChange={inputHandler}
          value={inputs.content}
        />
      </label>

      <label className="request-form__label">
        <span className="request-form__caption">Уровень</span>
        <select
          className="request-form__field"
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
      </label>

      <label className="request-form__label">
        <span className="request-form__caption">Тип запроса</span>
        <select
          className="request-form__field"
          name="type"
          required
          onChange={inputHandler}
          value={inputs.type}
        >
          <option value="">Выберите тип запроса</option>
          <option value="explain">Объяснение</option>
          <option value="fix">Исправление</option>
          <option value="review">Ревью</option>
        </select>
      </label>

      <button className="request-form__submit" type="submit" disabled={loading}>
        {loading ? "Отправка..." : "Отправить запрос"}
      </button>
    </form>
  );
}
