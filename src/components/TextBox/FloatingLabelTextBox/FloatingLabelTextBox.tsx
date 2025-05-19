import React, { useMemo, useCallback, forwardRef } from "react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import type { TextBoxProps } from "../../../interfaces/Common/TextBoxProps";

/**
 * FloatingLabelTextBox - A customized text input component with floating label
 *
 * @param {Object} props - Component props
 * @param {string} props.ControlID - Unique identifier for the control
 * @param {string} props.title - Label text for the input field
 * @param {string|number} props.value - Current value of the input field
 * @param {Function} props.onChange - Handler for value changes
 * @param {string} props.type - Input type (text, number, email, etc.)
 * @param {boolean} props.isMandatory - Whether the field is required
 * @param {string} props.errorMessage - Custom error message to display
 * @param {boolean} props.multiline - Whether the input allows multiple lines
 * @param {boolean} props.isSubmitted - Whether the form has been submitted
 * @param {Function} props.onKeyPress - Handler for keyboard events
 */
const FloatingLabelTextBox = forwardRef<HTMLInputElement, TextBoxProps>(
  (
    {
      ControlID,
      title,
      value = "",
      onChange = () => {},
      onBlur,
      placeholder,
      type = "text",
      className,
      style,
      size,
      isMandatory = false,
      disabled = false,
      readOnly = false,
      ariaLabel = "",
      maxLength,
      isSubmitted = false,
      errorMessage,
      max,
      min,
      step,
      autoComplete = "on",
      inputPattern,
      name,
      onKeyPress,
      multiline = false,
      rows = 0,
      loading,
      "aria-label": ariaLabelProp,
      "aria-required": ariaRequiredProp,
    },
    ref
  ) => {
    // Generate consistent control ID
    const controlId = useMemo(() => `txt${ControlID}`, [ControlID]);

    // Handle input validation with pattern
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        // Allow empty values or values that match the pattern
        if (newValue === "" || !inputPattern || inputPattern.test(newValue)) {
          onChange?.(e);
        }
      },
      [onChange, inputPattern]
    );

    // Handle keyboard events, especially Enter key
    const handleKeyPress = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !multiline && onKeyPress) {
          onKeyPress(e);
        } else if (onKeyPress) {
          onKeyPress(e);
        }
      },
      [multiline, onKeyPress]
    );

    // Calculate validation state
    const isInvalid = useMemo(
      () => (isMandatory && isSubmitted && (value === "" || value === null || value === undefined)) || !!errorMessage,
      [isMandatory, isSubmitted, value, errorMessage]
    );

    // Determine error message to display
    const errorToShow = useMemo(
      () => errorMessage || (isMandatory && isSubmitted && !value ? `${title} is required.` : ""),
      [errorMessage, isMandatory, isSubmitted, value, title]
    );

    // Configure input properties based on type
    const inputProps = useMemo(() => {
      const baseProps: React.InputHTMLAttributes<HTMLInputElement> = {
        "aria-label": ariaLabelProp || ariaLabel || title,
        "aria-required": (ariaRequiredProp || isMandatory) as boolean,
        "aria-invalid": isInvalid,
        "aria-describedby": isInvalid ? `${controlId}-error` : undefined,
        maxLength: maxLength,
      };

      if (type === "number" || type === "date") {
        baseProps.max = max;
        baseProps.min = min;
        if (type === "number") {
          baseProps.step = step;
        }
      }

      return baseProps;
    }, [ariaLabelProp, ariaLabel, title, ariaRequiredProp, isMandatory, isInvalid, controlId, maxLength, type, max, min, step]);

    // Memoize static props to prevent unnecessary re-renders
    const textFieldProps = useMemo(
      () => ({
        id: controlId,
        name,
        label: title || "",
        type,
        placeholder: placeholder || title,
        size,
        disabled,
        required: isMandatory,
        autoComplete,
        multiline,
        rows: rows || undefined,
      }),
      [controlId, name, title, type, placeholder, size, disabled, isMandatory, autoComplete, multiline, rows]
    );

    return (
      <FormControl variant="outlined" fullWidth margin="normal" className={className} style={style}>
        <TextField
          {...textFieldProps}
          ref={ref}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          // Using onKeyPress as defined in the interface, though it's deprecated
          onKeyPress={handleKeyPress}
          InputProps={{
            readOnly: readOnly,
            inputProps,
          }}
          error={isInvalid}
          helperText={isInvalid ? errorToShow : ""}
          InputLabelProps={{
            shrink: type === "date" || Boolean(value) || Boolean(placeholder),
          }}
        />
      </FormControl>
    );
  }
);

FloatingLabelTextBox.displayName = "FloatingLabelTextBox";

export default FloatingLabelTextBox;
