import React, { forwardRef, useMemo } from "react";
import { FormControl, InputLabel, Select, MenuItem, FormHelperText, IconButton, InputAdornment, CircularProgress, type SelectChangeEvent } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";

interface DropdownSelectProps {
  label: string;
  name: string;
  value: string;
  options?: Array<{ value: string; label: string }>;
  onChange: (event: SelectChangeEvent<string>, child: React.ReactNode) => void;
  size?: "small" | "medium";
  disabled?: boolean;
  isMandatory?: boolean;
  defaultText?: string;
  className?: string;
  isSubmitted?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  loading?: boolean;
  "aria-label"?: string;
  "aria-required"?: string;
}

const DropdownSelect = forwardRef<HTMLSelectElement, DropdownSelectProps>(
  (
    { label, name, value, options, onChange, size = "medium", disabled = false, isMandatory = false, defaultText, className, isSubmitted = false, clearable = false, onClear },
    ref
  ) => {
    const isEmptyValue = useMemo(() => value === "" || value === "0", [value]);
    const hasError = isMandatory && isSubmitted && isEmptyValue;

    const displayValue = useMemo(() => {
      if (!options) return "";
      const selectedOption = options.find((option) => String(option.value) === String(value) || option.label === value);
      return selectedOption ? selectedOption.value : "";
    }, [value, options]);

    if (!options) {
      return <CircularProgress size={24} />;
    }

    return (
      <FormControl variant="outlined" size={size} fullWidth className={className} error={hasError} margin="normal">
        <InputLabel id={`ddl-label-${name}`} htmlFor={`ddl-${name}`}>
          {label}
        </InputLabel>
        <Select
          ref={ref}
          labelId={`ddl-label-${name}`}
          id={`ddl-${name}`}
          name={name}
          value={displayValue}
          onChange={onChange}
          label={label}
          disabled={disabled}
          endAdornment={
            clearable && value ? (
              <InputAdornment position="end">
                <IconButton
                  aria-label="clear selection"
                  onClick={onClear}
                  edge="end"
                  size="small"
                  sx={{
                    padding: "2px",
                    margin: "8px",
                  }}
                >
                  <ClearIcon sx={{ fontSize: "18px" }} />
                </IconButton>
              </InputAdornment>
            ) : null
          }
        >
          <MenuItem value="">{defaultText || `Select ${label}`}</MenuItem>
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {hasError && <FormHelperText>{label} is required.</FormHelperText>}
      </FormControl>
    );
  }
);
DropdownSelect.displayName = "DropdownSelect";
export default DropdownSelect;
