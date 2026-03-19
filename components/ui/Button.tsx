import { type ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
};

const Button = (props: ButtonProps) => {
  const combinedClassName = [
    "btn",
    `btn--${props.variant}`,
    `btn--${props.size}`,
    props.fullWidth ? "btn--full" : "",
    props.className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...props} className={combinedClassName}>
      {props.children}
    </button>
  );
};

export default Button;
