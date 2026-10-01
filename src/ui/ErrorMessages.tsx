import { Icon } from "./Icon";

/** Error messages for a field, referenced by aria-describedby as `${id}-error`. */
export function ErrorMessages({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return (
    <div id={`${id}-error`}>
      {errors.map((message, index) => (
        <p key={`${index}-${message}`} role="alert" className="error-msg">
          <Icon name="circle-alert" size={16} className="mt-px" />
          {message}
        </p>
      ))}
    </div>
  );
}
