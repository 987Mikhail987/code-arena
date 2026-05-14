import "./FormInput.css";

type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

const FormInput = ({ label, ...otherProps }: FormInputProps) => {
  const inputId = otherProps.id || otherProps.name;

  return (
    <div className="form-input-wrapper">
      <input
        {...otherProps}
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
};

export default FormInput;
