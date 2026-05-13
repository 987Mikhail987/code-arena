import "./FormInput.css";
import { forwardRef } from "react";

type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, ...otherProps }, ref) => {
    const inputId = otherProps.id || otherProps.name;

    return (
      <div className="form-input-wrapper">
        <input
          {...otherProps}
          ref={ref}
          id={inputId}
          autoComplete="off"
          className="form-input"
        />
        {label && (
          <label className="form-input-label" htmlFor={inputId}>
            {label}
          </label>
        )}
      </div>
    );
  },
);

FormInput.displayName = "FormInput";

export default FormInput;
