// src/pages/common/LoginPage/LoginPage.tsx
import { useNavigate, Link as RouterLink } from "react-router-dom";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { Alert, Box, Button, CircularProgress, Container, Stack, Typography, Link, Card, CardContent } from "@mui/material";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import logo from "../../../assets/images/eBios.png";
import type { Company } from "../../../types/Common/Company.type";
import FloatingLabelTextBox from "../../../components/TextBox/FloatingLabelTextBox/FloatingLabelTextBox";
import DropdownSelect from "../../../components/DropDown/DropdownSelect";
import AuthService from "../../../services/AuthService/AuthService";
import { CompanyService } from "../../../services/CommonServices/CompanyService";
import { ClientParameterService } from "../../../services/CommonServices/ClientParameterService";
import { useAppDispatch } from "../../../store/hooks";
import { setUserDetails } from "../../../store/features/auth/authSlice";

interface LoginFormState {
  userName: string;
  password: string;
  companyID: string;
  companyCode: string;
  companies: Company[];
  errorMessage: string;
  isLoggingIn: boolean;
  amcExpiryMessage: string;
  licenseExpiryMessage: string;
  licenseDaysRemaining: number;
}

const initialFormState: LoginFormState = {
  userName: "",
  password: "",
  companyID: "",
  companyCode: "",
  companies: [],
  errorMessage: "",
  isLoggingIn: false,
  amcExpiryMessage: "",
  licenseExpiryMessage: "",
  licenseDaysRemaining: 0,
};

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [formState, setFormState] = React.useState<LoginFormState>(initialFormState);
  const [showPassword] = useState(false);

  const companySelectRef = useRef<HTMLSelectElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const [loginAttempts, setLoginAttempts] = useState({
    count: 0,
    lastAttempt: null as Date | null,
    isLocked: false,
    lockoutEndTime: null as Date | null,
  });

  const [fieldLoading, setFieldLoading] = useState({
    company: false,
    username: false,
    password: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const focusableElements = [companySelectRef.current, usernameInputRef.current, passwordInputRef.current, submitButtonRef.current].filter(Boolean);

        const activeElement = document.activeElement as HTMLElement | null;

        if (!activeElement) return;

        const currentIndex = focusableElements.findIndex((el) => el instanceof HTMLElement && el.isEqualNode(activeElement));

        if (currentIndex > -1) {
          const nextIndex = e.shiftKey ? (currentIndex - 1 + focusableElements.length) % focusableElements.length : (currentIndex + 1) % focusableElements.length;

          const nextElement = focusableElements[nextIndex];
          if (nextElement instanceof HTMLElement) {
            nextElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const checkRateLimit = useCallback(() => {
    //const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes
    //const MAX_ATTEMPTS = 3;

    if (loginAttempts.isLocked && loginAttempts.lockoutEndTime) {
      const now = new Date();
      if (now < loginAttempts.lockoutEndTime) {
        const remainingTime = Math.ceil((loginAttempts.lockoutEndTime.getTime() - now.getTime()) / 1000);
        return `Account locked. Try again in ${remainingTime} seconds.`;
      }
      setLoginAttempts((prev) => ({ ...prev, isLocked: false, count: 0 }));
    }
    return null;
  }, [loginAttempts]);

  const selectedCompanyName = useMemo(() => {
    const selectedCompany = formState.companies.find((c) => c.compIDCompCode === `${formState.companyID},${formState.companyCode}`);
    return selectedCompany?.compName || "Select Company";
  }, [formState.companyID, formState.companyCode, formState.companies]);

  const checkDateValidity = useCallback((dateString: string): number => {
    const [day, month, year] = dateString.split("/").map(Number);
    const today = new Date();
    const targetDate = new Date(year, month - 1, day);
    const differenceInTime = targetDate.getTime() - today.getTime();
    return differenceInTime / (1000 * 3600 * 24);
  }, []);

  const checkExpiryDates = useCallback(async () => {
    try {
      const [amcDetails, licenseDetails] = await Promise.all([ClientParameterService.getClientParameter("AMCSUP"), ClientParameterService.getClientParameter("CINLIC")]);

      const amcDaysRemaining = checkDateValidity(amcDetails[0].clParValue);
      const licenseDaysRemaining = checkDateValidity(licenseDetails[0].clParValue);

      setFormState((prev) => ({
        ...prev,
        licenseDaysRemaining,
        amcExpiryMessage: amcDaysRemaining <= 30 ? `Your AMC support will expire in ${Math.ceil(amcDaysRemaining)} day(s)` : "",
        licenseExpiryMessage:
          licenseDaysRemaining < 0
            ? "Cannot log in. Your License has expired"
            : licenseDaysRemaining <= 30
            ? `Your License will expire in ${Math.ceil(licenseDaysRemaining)} day(s)`
            : "",
      }));
    } catch (error) {
      console.error("Failed to fetch client parameters:", error);
    }
  }, [checkDateValidity]);

  const handleSelectCompany = useCallback((CompIDCompCode: string, compName: string) => {
    const [compID, compCode] = CompIDCompCode.split(",");
    setFormState((prev) => ({
      ...prev,
      companyID: compID || "0",
      companyCode: compCode || "",
      errorMessage: !compID || !compCode ? "Please select a company" : "",
    }));
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      //setLoading(true);

      try {
        const companyData = await CompanyService.getCompanies();
        setFormState((prev) => ({ ...prev, companies: companyData }));
        if (companyData.length === 1) {
          handleSelectCompany(companyData[0].compIDCompCode, companyData[0].compName);
        }
      } catch (error) {
        console.error("Fetching companies failed: ", error);
        setFormState((prev) => ({
          ...prev,
          errorMessage: "Failed to load companies.",
        }));
      } finally {
        //setLoading(false);
      }
    };

    fetchCompanies();
    checkExpiryDates();
  }, [checkExpiryDates, handleSelectCompany]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const lockoutMessage = checkRateLimit();
      if (lockoutMessage) {
        setFormState((prev) => ({ ...prev, errorMessage: lockoutMessage }));
        return;
      }

      if (formState.licenseExpiryMessage === "Cannot log in. Your License has expired") {
        setFormState((prev) => ({
          ...prev,
          errorMessage: formState.licenseExpiryMessage,
        }));
        return;
      }

      if (!formState.companyID || !formState.userName || !formState.password) {
        setFormState((prev) => ({
          ...prev,
          errorMessage: !formState.companyID ? "Please select a company." : !formState.userName ? "Username is required." : "Password is required.",
        }));
        return;
      }

      setFieldLoading({ company: true, username: true, password: true });
      setFormState((prev) => ({ ...prev, isLoggingIn: true, errorMessage: "" }));

      try {
        const tokenResponse = await AuthService.generateToken({
          UserName: formState.userName,
          Password: formState.password,
          CompanyID: parseInt(formState.companyID),
          CompanyCode: formState.companyCode,
          CompanyName: selectedCompanyName,
        });

        if (tokenResponse.token) {
          const jwtToken = JSON.parse(atob(tokenResponse.token.split(".")[1]));
          const tokenExpiry = new Date(jwtToken.exp * 1000).getTime();

          dispatch(
            setUserDetails({
              userID: tokenResponse.user.userID,
              token: tokenResponse.token,
              adminYN: tokenResponse.user.adminYN,
              userName: tokenResponse.user.userName,
              compID: parseInt(formState.companyID),
              compCode: formState.companyCode,
              compName: selectedCompanyName,
              tokenExpiry,
            })
          );

          navigate("/registrationpage");
        } else {
          setLoginAttempts((prev) => {
            const newCount = prev.count + 1;
            return {
              count: newCount,
              lastAttempt: new Date(),
              isLocked: newCount >= 3,
              lockoutEndTime: newCount >= 3 ? new Date(Date.now() + 5 * 60 * 1000) : null,
            };
          });
          setFormState((prev) => ({
            ...prev,
            errorMessage: tokenResponse.user.ErrorMessage || "Invalid credentials",
            isLoggingIn: false,
          }));
        }
      } catch (error) {
        console.error("Login failed:", error);
        setFormState((prev) => ({
          ...prev,
          errorMessage: "An error occurred during login. Please try again.",
          isLoggingIn: false,
        }));
      }
    },
    [formState, checkRateLimit, selectedCompanyName, dispatch, navigate]
  );

  return (
    <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card sx={{ width: "100%", maxWidth: 450 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo Section */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <img src={logo} alt="e-Bios Logo" style={{ maxWidth: "100px", marginBottom: "16px" }} />
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
              e-Bios
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Hospital Information System
            </Typography>
          </Box>

          {/* Alerts */}
          {formState.amcExpiryMessage && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {formState.amcExpiryMessage}
            </Alert>
          )}

          {formState.licenseExpiryMessage && (
            <Alert severity={formState.licenseDaysRemaining <= 0 ? "error" : "warning"} sx={{ mb: 2 }}>
              {formState.licenseExpiryMessage}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ "& .MuiTextField-root, & .MuiSelect-root": { mb: 3 } }}>
            <Stack spacing={3}>
              <DropdownSelect
                ref={companySelectRef}
                label="Select Company"
                name="companyID"
                value={formState.companyID && formState.companyCode ? `${formState.companyID},${formState.companyCode}` : ""}
                options={formState.companies.map((c) => ({
                  value: c.compIDCompCode,
                  label: c.compName,
                }))}
                onChange={(event) => {
                  const compIDCompCode = event.target.value as string;
                  const selectedCompany = formState.companies.find((c) => c.compIDCompCode === compIDCompCode);
                  handleSelectCompany(compIDCompCode, selectedCompany?.compName || "");
                }}
                size="small"
                loading={fieldLoading.company}
                aria-label="Company selection"
                aria-required="true"
              />

              <FloatingLabelTextBox
                ref={usernameInputRef}
                ControlID="username"
                title="Username"
                value={formState.userName}
                onChange={(e) => setFormState((prev) => ({ ...prev, userName: e.target.value }))}
                size="small"
                isMandatory
                loading={fieldLoading.username}
                aria-label="Username input"
                aria-required="true"
              />

              <FloatingLabelTextBox
                ref={passwordInputRef}
                ControlID="password"
                title="Password"
                type={showPassword ? "text" : "password"}
                value={formState.password}
                onChange={(e) => setFormState((prev) => ({ ...prev, password: e.target.value }))}
                size="small"
                isMandatory
                loading={fieldLoading.password}
                aria-label="Password input"
                aria-required="true"
              />
            </Stack>

            <Box sx={{ textAlign: "right", mb: 2 }}>
              <Link component={RouterLink} to="/ForgotPasswordPage" variant="body2">
                Forgot password?
              </Link>
            </Box>

            <Button
              ref={submitButtonRef}
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={formState.isLoggingIn || loginAttempts.isLocked}
              endIcon={formState.isLoggingIn ? <CircularProgress size={20} color="inherit" /> : <KeyboardArrowRightIcon />}
              aria-label="Sign in button"
              sx={{ height: 52 }}
            >
              {formState.isLoggingIn ? "Signing In..." : "Sign In"}
            </Button>

            {formState.errorMessage && (
              <Alert severity="error" sx={{ mt: 2 }} role="alert" aria-live="polite">
                {formState.errorMessage}
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default LoginPage;
