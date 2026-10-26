import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
  AdminPanelSettings,
} from "@mui/icons-material";
import { AuthContext } from "../context/AuthContext";
import { validateLoginForm } from "../utils/validation";
import { keyframes } from "@mui/system";

// Animation keyframes
const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const fadeInOut = keyframes`
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
`;

// Animal emoji component with animation
const AnimatedEmoji = ({ emoji, size = 50, top, left, delay = 0 }) => (
  <Box
    sx={{
      position: "absolute",
      fontSize: `${size}px`,
      top: `${top}%`,
      left: `${left}%`,
      zIndex: 1,
      animation: `${float} 5s ease-in-out infinite, ${fadeInOut} 3s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      textShadow: "3px 3px 10px rgba(0,0,0,0.5)",
    }}
  >
    {emoji}
  </Box>
);
console.log("Login.js loaded"); // Debugging statement

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  const { login, isAuthenticated, loading, user, error } =
    useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on user role
      switch (user.role) {
        case "admin":
          navigate("/admin");
          break;
        case "sales":
          navigate("/sales");
          break;
        case "inventory_manager":
          navigate("/inventory");
          break;
        case "customer":
          navigate("/customer");
          break;
        default:
          navigate("/login");
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Set form error if auth error exists
  useEffect(() => {
    if (error) {
      setFormError(error);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validation = validateLoginForm(email, password);
    setErrors(validation.errors);

    if (!validation.isValid) return;

    setFormError("");

    try {
      await login(email, password);
    } catch (err) {
      setFormError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  console.log("Login.js rendered"); // Debugging statement
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url('/images/img1.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated animal emojis */}
      <AnimatedEmoji emoji="🦁" size={70} top={15} left={10} delay={0} />
      <AnimatedEmoji emoji="🐘" size={60} top={70} left={15} delay={1} />
      <AnimatedEmoji emoji="🦒" size={65} top={25} left={85} delay={0.5} />
      <AnimatedEmoji emoji="🐅" size={55} top={80} left={85} delay={1.5} />
      <AnimatedEmoji emoji="🦓" size={50} top={10} left={50} delay={2} />
      <AnimatedEmoji emoji="🐊" size={45} top={85} left={50} delay={2.5} />

      <Container component="main" maxWidth="xs">
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(5px)",
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          }}
        >
          <Typography
            component="h1"
            variant="h5"
            sx={{
              mb: 1,
              color: "#2e7d32",
              fontWeight: "bold",
              textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            Jungle Safari Inventory
          </Typography>

          <Typography
            component="h2"
            variant="h6"
            sx={{
              mb: 3,
              color: "#333",
              textShadow: "1px 1px 1px rgba(0,0,0,0.05)",
            }}
          >
            Login to your account
          </Typography>

          {formError && (
            <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
              {formError}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 1, width: "100%" }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                },
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={toggleShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                backgroundColor: "#2e7d32",
                "&:hover": {
                  backgroundColor: "#1b5e20",
                },
                boxShadow: "0 4px 12px rgba(46, 125, 50, 0.3)",
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Login"}
            </Button>

            <Box textAlign="center" mt={2}>
              <Typography
                variant="body2"
                sx={{
                  color: "#333",
                  "& a": {
                    transition: "color 0.3s ease",
                    "&:hover": {
                      color: "#1b5e20",
                    },
                  },
                }}
              >
                Don't have an account?{" "}
                <Link
                  to="/register"
                  style={{
                    textDecoration: "none",
                    color: "#2e7d32",
                    fontWeight: "bold",
                  }}
                >
                  Register here
                </Link>
              </Typography>

              <Typography
                variant="body2"
                align="center"
                mt={2}
                sx={{
                  color: "#666",
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.05)",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.1)",
                    },
                  }}
                >
                  <Link
                    to="/admin/login"
                    style={{
                      textDecoration: "none",
                      color: "#d32f2f",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <LockIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    Admin Access
                  </Link>
                </Box>
              </Typography>

              <Divider sx={{ mt: 3, mb: 3 }} />

              <Box sx={{ width: "100%", textAlign: "center" }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  <strong>For System Administrators</strong>
                </Typography>
                <Button
                  component={Link}
                  to="/admin/login"
                  variant="outlined"
                  color="secondary"
                  startIcon={<AdminPanelSettings />}
                  size="small"
                  sx={{
                    borderColor: "rgba(211, 47, 47, 0.5)",
                    "&:hover": {
                      borderColor: "#d32f2f",
                      backgroundColor: "rgba(211, 47, 47, 0.08)",
                    },
                  }}
                >
                  Admin Portal
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
