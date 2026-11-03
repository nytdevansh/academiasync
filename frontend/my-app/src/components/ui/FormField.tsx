import React from 'react';

interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

const attachFieldAccessibility = (
  children: React.ReactNode,
  generatedId: string,
  labelId: string,
  descriptionId?: string,
  required?: boolean,
  error?: string
): { children: React.ReactNode; controlId: string } => {
  let attached = false;
  let controlId = generatedId;

  const visit = (child: React.ReactNode): React.ReactNode => {
    if (!React.isValidElement<{
      children?: React.ReactNode;
      id?: string;
      'aria-labelledby'?: string;
      'aria-describedby'?: string;
      'aria-invalid'?: boolean | 'grammar' | 'spelling';
      'aria-required'?: boolean;
      required?: boolean;
    }>(child)) {
      return child;
    }

    if (typeof child.type === 'string' && ['input', 'select', 'textarea'].includes(child.type) && !attached) {
      attached = true;
      controlId = child.props.id || generatedId;
      const describedBy = [child.props['aria-describedby'], descriptionId].filter(Boolean).join(' ') || undefined;
      return React.cloneElement(child, {
        id: controlId,
        'aria-labelledby': child.props['aria-labelledby'] || labelId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required ? true : undefined,
      });
    }

    if (child.props.children) {
      return React.cloneElement(child, undefined, React.Children.map(child.props.children, visit));
    }
    return child;
  };

  return { children: React.Children.map(children, visit), controlId };
};

export const FormField: React.FC<FormFieldProps> = ({ label, error, hint, required, className = '', children }) => {
  const generatedId = React.useId();
  const labelId = `${generatedId}-label`;
  const descriptionId = `${generatedId}-description`;
  const { children: accessibleChildren, controlId } = attachFieldAccessibility(
    children,
    generatedId,
    labelId,
    error || hint ? descriptionId : undefined,
    required,
    error
  );

  return (
    <div className={`flex flex-col gap-1.5 mb-4 ${className}`}>
      {label && (
        <label id={labelId} htmlFor={controlId} className="text-sm font-semibold uppercase tracking-wider text-slate-700">
          {label}{required && <span aria-hidden="true" className="text-rose-600 ml-1">*</span>}
        </label>
      )}
      {accessibleChildren}
      {(error || hint) && (
        <span id={descriptionId} className={`text-sm ${error ? 'text-rose-700 font-medium' : 'text-slate-600'}`}>
          {error ? `Error: ${error}` : hint}
        </span>
      )}
    </div>
  );
};
