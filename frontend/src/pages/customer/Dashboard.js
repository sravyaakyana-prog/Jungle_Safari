import React, { useState, useEffect, useContext } from "react";
import {
  Grid,
  Typography,
  Paper,
  Box,
  Button,
  Divider,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Dialog,
  DialogContent,
  DialogActions,
  Alert,
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  alpha,
} from "@mui/material";
import {
  ShoppingCart as CartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Store as StoreIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as AccountBalanceIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { InventoryContext } from "../inventory/Dashboard";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

const DarkOverlay = ({ children }) => (
  <Box
    sx={{
      position: "relative",
      zIndex: 1,
      "&::before": {
        content: '""',
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: "url('/images/img6.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        filter: "brightness(0.4)",
        zIndex: -1,
      },
    }}
  >
    {children}
  </Box>
);

const normalizeOrder = (order) => ({
  id: order._id || order.id,
  date: order.date || order.createdAt || new Date().toISOString(),
  products: (order.items || order.products || []).map((item) => ({
    id: item._id || item.id,
    name: item.name,
    price: Number(item.price || 0),
    quantity: Number(item.quantity || 0),
  })),
  subtotal: Number(order.subtotal || 0),
  tax: Number(order.taxAmount || order.tax || 0),
  total: Number(order.totalAmount || order.total || 0),
  paymentMethod: order.payment?.method || order.paymentMethod || "card",
  status: order.status || "completed",
});

const paymentMethodLabel = (method) => {
  switch (method) {
    case "credit-card":
      return "Credit Card";
    case "debit-card":
      return "Debit Card";
    case "upi":
      return "UPI";
    case "cash":
      return "Cash on Delivery";
    case "card":
      return "Card";
    default:
      return method;
  }
};

const toApiPaymentMethod = (method) => {
  if (method === "upi") return "upi";
  if (method === "cash") return "cash";
  return "card";
};

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const inventoryContext = useContext(InventoryContext);

  const products = inventoryContext?.products || [];
  const loadingProducts = inventoryContext?.loading ?? true;

  const [cart, setCart] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [orderHistoryLoading, setOrderHistoryLoading] = useState(true);
  const [activeView, setActiveView] = useState("shop");
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [orderTotals, setOrderTotals] = useState({
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    setActiveView(location.pathname.includes("/orders") ? "orders" : "shop");
  }, [location.pathname]);

  useEffect(() => {
    const subtotal = cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const taxAmount = subtotal * 0.18;
    setOrderTotals({
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
    });
  }, [cart]);

  useEffect(() => {
    const loadOrderHistory = async () => {
      if (!user?.id && !user?._id) {
        setOrderHistory([]);
        setOrderHistoryLoading(false);
        return;
      }

      try {
        setOrderHistoryLoading(true);
        const userId = user.id || user._id;
        const response = await api.get(`/api/orders/user/${userId}`);
        setOrderHistory((response.data || []).map(normalizeOrder));
      } catch (error) {
        console.error("Error loading customer orders:", error);
        setOrderHistory([]);
        setErrorMessage(
          error.response?.data?.msg || "Failed to load your order history."
        );
      } finally {
        setOrderHistoryLoading(false);
      }
    };

    loadOrderHistory();
  }, [user]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });

  const handleAddToCart = (product) => {
    setErrorMessage("");
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity + 1 > product.stock) {
        setErrorMessage(`Only ${product.stock} units are available for ${product.name}.`);
        return;
      }

      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
      return;
    }

    setCart((prevCart) => [...prevCart, { ...product, quantity: 1 }]);
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    if (newQuantity > product.stock) {
      setErrorMessage(`Only ${product.stock} units are available for ${product.name}.`);
      return;
    }

    if (newQuantity <= 0) {
      setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }
    setErrorMessage("");
    setCheckoutOpen(true);
  };

  const handleCloseCheckout = () => {
    if (!submittingOrder) {
      setCheckoutOpen(false);
    }
  };

  const handleProcessPayment = async (paymentDetails) => {
    if (!user?.email) {
      setErrorMessage("Please log in again before placing an order.");
      return;
    }

    try {
      setSubmittingOrder(true);
      setErrorMessage("");

      const payload = {
        items: cart.map((item) => ({
          _id: item._id || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        customer: {
          name: user.name || "Customer",
          email: user.email,
          phone: user.phone || "",
        },
        subtotal: orderTotals.subtotal,
        taxAmount: orderTotals.taxAmount,
        totalAmount: orderTotals.totalAmount,
        payment: {
          method: toApiPaymentMethod(paymentDetails.method),
          transactionId: `TXN-${Date.now()}`,
          orderId: `ORD-${Date.now()}`,
          details: paymentDetails.details || {},
        },
      };

      const response = await api.post("/api/orders", payload);
      const createdOrder = normalizeOrder(response.data);

      setOrderHistory((prevOrders) => [createdOrder, ...prevOrders]);
      setOrderDetails(createdOrder);
      setCart([]);
      setCheckoutOpen(false);
      setSuccessOpen(true);

      if (inventoryContext?.refreshProducts) {
        await inventoryContext.refreshProducts();
      }
    } catch (error) {
      console.error("Error creating order:", error);
      setErrorMessage(
        error.response?.data?.msg || "Failed to place your order."
      );
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccessOpen(false);
    setOrderDetails(null);
  };

  const renderProductGrid = () => {
    if (loadingProducts) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress className="custom-spinner" />
        </Box>
      );
    }

    if (!products.length) {
      return (
        <Alert severity="info">
          No products are available right now. Add products in inventory to start selling.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3} className="grid-background">
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <Card className="product-card">
              <CardMedia
                component="img"
                height="140"
                image={
                  product.imageUrl ||
                  `https://source.unsplash.com/random/300x200?${(product.category || "souvenir").toLowerCase()}`
                }
                alt={product.name}
              />
              <CardActions className="product-card-actions" sx={{ justifyContent: "center", px: 2, pt: 1.5, pb: 0 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                  className="primary-button product-add-button"
                  sx={{
                    width: 76,
                    minWidth: "76px !important",
                    height: 76,
                    borderRadius: "50% !important",
                    backgroundColor: "#1565c0 !important",
                    boxShadow: "0 6px 14px rgba(21, 101, 192, 0.35) !important",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.4,
                    p: "8px !important",
                    lineHeight: 1.05,
                    textAlign: "center",
                    "&:hover": {
                      backgroundColor: "#0d47a1 !important",
                      boxShadow: "0 8px 18px rgba(13, 71, 161, 0.45) !important",
                    },
                    "&.Mui-disabled": {
                      backgroundColor: "rgba(21, 101, 192, 0.45) !important",
                      color: "rgba(255, 255, 255, 0.75) !important",
                    },
                  }}
                >
                  <CartIcon sx={{ fontSize: 18 }} />
                  <Box component="span" sx={{ fontSize: 11, fontWeight: 700 }}>
                    {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </Box>
                </Button>
              </CardActions>
              <CardContent className="card-content">
                <Typography
                  variant="h6"
                  component="div"
                  gutterBottom
                  className="card-title text-white"
                >
                  {product.name}
                </Typography>
                <Typography variant="body2" className="text-light" gutterBottom>
                  {product.description || `Quality ${product.category} item`}
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" className="card-price">
                    {formatCurrency(product.price)}
                  </Typography>
                  <Chip
                    label={`Stock: ${product.stock}`}
                    size="small"
                    color={
                      product.stock > 5
                        ? "primary"
                        : product.stock > 0
                          ? "warning"
                          : "error"
                    }
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderCart = () => (
    <Paper elevation={0} variant="outlined" className="cart-paper" sx={{ p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <CartIcon sx={{ mr: 1 }} className="tertiary-text" />
        <Typography variant="h6" className="secondary-text">
          Shopping Cart{" "}
          {cart.length > 0 &&
            `(${cart.length} ${cart.length === 1 ? "item" : "items"})`}
        </Typography>
      </Box>
      <div className="custom-divider"></div>

      {cart.length === 0 ? (
        <Box
          className="empty-state-container"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
          }}
        >
          <CartIcon className="empty-state-icon" />
          <Typography variant="h6" className="text-light" align="center" gutterBottom>
            Your cart is empty
          </Typography>
          <Typography variant="body2" className="text-light" align="center">
            Add products to begin shopping
          </Typography>
        </Box>
      ) : (
        <>
          <List sx={{ mb: 2 }}>
            {cart.map((item) => (
              <ListItem
                key={item.id}
                className="cart-item"
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <ListItemText
                      primary={<span className="text-white">{item.name}</span>}
                      secondary={
                        <span className="text-light">
                          {formatCurrency(item.price)} each
                        </span>
                      }
                    />
                    <Typography className="primary-text">
                      {formatCurrency(item.price * item.quantity)}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                    <Box display="flex" alignItems="center">
                      <Button
                        size="small"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <RemoveIcon fontSize="small" />
                      </Button>
                      <Typography sx={{ mx: 1 }} className="text-white">
                        {item.quantity}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <AddIcon fontSize="small" />
                      </Button>
                    </Box>

                    <Button color="error" onClick={() => handleRemoveItem(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </Button>
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>

          <div className="custom-divider"></div>

          <Box sx={{ mt: 2 }}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography className="text-light">Subtotal</Typography>
              <Typography className="text-white">
                {formatCurrency(orderTotals.subtotal)}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography className="text-light">Tax (18% GST)</Typography>
              <Typography className="text-white">
                {formatCurrency(orderTotals.taxAmount)}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="h6" className="secondary-text">
                Total
              </Typography>
              <Typography variant="h6" className="primary-text">
                {formatCurrency(orderTotals.totalAmount)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<PaymentIcon />}
              onClick={handleCheckout}
            >
              Checkout
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );

  const renderOrderHistory = () => {
    if (orderHistoryLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="300px">
          <CircularProgress className="custom-spinner" />
        </Box>
      );
    }

    if (!orderHistory.length) {
      return (
        <Box
          className="empty-state-container"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
          }}
        >
          <ReceiptIcon className="empty-state-icon" />
          <Typography variant="h6" className="text-light" align="center" gutterBottom>
            No order history
          </Typography>
          <Typography variant="body2" className="text-light" align="center">
            Your purchases will appear here
          </Typography>
        </Box>
      );
    }

    return (
      <Box className="grid-background">
        <Typography variant="h5" gutterBottom className="secondary-text">
          Order History
        </Typography>

        {orderHistory.map((order) => (
          <Paper
            key={order.id}
            elevation={0}
            variant="outlined"
            className="order-paper"
            sx={{ p: 2, mb: 2 }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography
                variant="subtitle1"
                className="primary-text"
                fontWeight="bold"
              >
                {order.id}
              </Typography>
              <Chip icon={<CheckCircleIcon />} label={order.status} color="primary" size="small" />
            </Box>

            <Typography variant="body2" className="text-light" gutterBottom>
              {formatDate(order.date)}
            </Typography>

            <div className="custom-divider"></div>

            <List dense>
              {order.products.map((item, index) => (
                <ListItem key={`${order.id}-${index}`} sx={{ py: 0 }}>
                  <ListItemText
                    primary={
                      <span className="text-white">{`${item.name} x ${item.quantity}`}</span>
                    }
                    secondary={
                      <span className="text-light">{formatCurrency(item.price)}</span>
                    }
                  />
                  <Typography className="tertiary-text">
                    {formatCurrency(item.price * item.quantity)}
                  </Typography>
                </ListItem>
              ))}
            </List>

            <div className="custom-divider"></div>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2" className="text-light">
                  Subtotal: {formatCurrency(order.subtotal)}
                </Typography>
                <Typography variant="body2" className="text-light">
                  Tax: {formatCurrency(order.tax)}
                </Typography>
              </Box>
              <Typography variant="h6" className="primary-text">
                Total: {formatCurrency(order.total)}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    );
  };

  return (
    <DarkOverlay>
      <Container
        maxWidth="xl"
        className="customer-dashboard-container sales-dashboard-container"
        sx={{
          "--primary-color": "#c62828",
          "--primary-light": "#ef5350",
          "--primary-dark": "#8e0000",
          "--secondary-color": "#ff8a80",
          "--secondary-light": "#ffb4a9",
          "--secondary-dark": "#b61827",
          "--accent-color": "#d84315",
          "--text-tertiary": "#ff8a80",
          "--background-default": "#24090c",
          "--background-dark": "#1f080b",
          "--background-light": "#341116",
          "--background-paper": "#2a0f14",
          "--border-color": "rgba(239, 83, 80, 0.28)",
          "--card-background": "#261014",
          "--glow-color": "rgba(229, 57, 53, 0.28)",
          "--input-bg": "rgba(31, 8, 11, 0.8)",
          "--hover-bg": "rgba(239, 83, 80, 0.14)",
          "--active-bg": "rgba(239, 83, 80, 0.22)",
          mt: 3,
          mb: 4,
          backgroundColor: alpha("#140507", 0.82),
          backdropFilter: "blur(5px)",
          borderRadius: 2,
          padding: 3,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          color: "#fff",
          "& .MuiAlert-standardInfo": {
            backgroundColor: alpha("#d32f2f", 0.16),
            color: "#ffcdd2",
            border: "1px solid rgba(211, 47, 47, 0.35)",
          },
          "& .MuiAlert-standardInfo .MuiAlert-icon": {
            color: "#ef5350",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 3,
            textAlign: "center",
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            className="primary-text"
            sx={{ color: "#fff", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
          >
            <PersonIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Customer Dashboard
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              flexWrap: "wrap",
              width: "100%",
              mt: 1,
            }}
          >
            <Button
              variant={activeView === "shop" ? "contained" : "outlined"}
              color="primary"
              startIcon={<StoreIcon />}
              onClick={() => {
                setActiveView("shop");
                navigate("/customer");
              }}
              sx={{
                minWidth: 160,
                borderColor: "var(--primary-light)",
                color: activeView !== "shop" ? "var(--primary-light)" : undefined,
              }}
              className={activeView === "shop" ? "primary-button" : ""}
            >
              Shop
            </Button>
            <Button
              variant={activeView === "orders" ? "contained" : "outlined"}
              color="primary"
              startIcon={<ReceiptIcon />}
              onClick={() => {
                setActiveView("orders");
                navigate("/customer/orders");
              }}
              sx={{
                minWidth: 160,
                borderColor: "var(--primary-light)",
                color: activeView !== "orders" ? "var(--primary-light)" : undefined,
              }}
              className={activeView === "orders" ? "secondary-button" : ""}
            >
              My Orders
            </Button>
          </Box>
        </Box>

        <div className="custom-divider"></div>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        {inventoryContext?.error && activeView === "shop" && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {inventoryContext.error}
          </Alert>
        )}

        {activeView === "shop" ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  position: { md: "sticky" },
                  top: { md: 24 },
                }}
              >
                {renderCart()}
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              {renderProductGrid()}
            </Grid>
          </Grid>
        ) : (
          renderOrderHistory()
        )}

        <Dialog
          open={checkoutOpen}
          onClose={handleCloseCheckout}
          maxWidth="sm"
          fullWidth
          PaperProps={{ className: "custom-dialog-paper" }}
        >
          <DialogContent>
            <Typography variant="h6" gutterBottom>
              Complete Your Purchase
            </Typography>

            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                Order Summary
              </Typography>
              <List dense>
                {cart.map((item) => (
                  <ListItem key={item.id}>
                    <ListItemText
                      primary={`${item.name} x ${item.quantity}`}
                      secondary={formatCurrency(item.price)}
                    />
                    <Typography>{formatCurrency(item.price * item.quantity)}</Typography>
                  </ListItem>
                ))}
              </List>

              <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                <Box>
                  <Typography variant="body2">
                    Subtotal: {formatCurrency(orderTotals.subtotal)}
                  </Typography>
                  <Typography variant="body2">
                    Tax (18% GST): {formatCurrency(orderTotals.taxAmount)}
                  </Typography>
                </Box>
                <Typography variant="h6" color="primary">
                  Total: {formatCurrency(orderTotals.totalAmount)}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              Payment Method
            </Typography>

            <Box mb={3}>
              <FormControl component="fieldset">
                <RadioGroup
                  aria-label="payment-method"
                  name="payment-method"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                >
                  <FormControlLabel
                    value="credit-card"
                    control={<Radio />}
                    label={
                      <Box display="flex" alignItems="center">
                        <CreditCardIcon sx={{ mr: 1 }} /> Credit Card
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="debit-card"
                    control={<Radio />}
                    label={
                      <Box display="flex" alignItems="center">
                        <CreditCardIcon sx={{ mr: 1 }} /> Debit Card
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="cash"
                    control={<Radio />}
                    label={
                      <Box display="flex" alignItems="center">
                        <PaymentIcon sx={{ mr: 1 }} /> Cash on Delivery
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="upi"
                    control={<Radio />}
                    label={
                      <Box display="flex" alignItems="center">
                        <AccountBalanceIcon sx={{ mr: 1 }} /> UPI
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            {(paymentMethod === "credit-card" || paymentMethod === "debit-card") && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Card Number"
                    fullWidth
                    placeholder="1234 5678 9012 3456"
                    inputProps={{ maxLength: 19 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="Expiry Date" fullWidth placeholder="MM/YY" inputProps={{ maxLength: 5 }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="CVV" fullWidth placeholder="123" type="password" inputProps={{ maxLength: 3 }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Cardholder Name" fullWidth placeholder="John Doe" />
                </Grid>
              </Grid>
            )}

            {paymentMethod === "upi" && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="UPI ID"
                    fullWidth
                    placeholder="username@upi"
                    helperText="Example: yourname@okaxis or yourname@ybl"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info">
                    You will receive a payment request on your UPI app. Please keep your UPI app ready.
                  </Alert>
                </Grid>
              </Grid>
            )}

            {paymentMethod === "cash" && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Pay with cash when your order is delivered.
              </Alert>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseCheckout} disabled={submittingOrder}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PaymentIcon />}
              disabled={submittingOrder}
              onClick={() => {
                let details = {};

                if (
                  paymentMethod === "credit-card" ||
                  paymentMethod === "debit-card"
                ) {
                  details = {
                    cardType: paymentMethod,
                    cardholderName:
                      document.querySelector('input[placeholder="John Doe"]')?.value ||
                      user?.name ||
                      "Customer",
                    cardNumber:
                      document.querySelector(
                        'input[placeholder="1234 5678 9012 3456"]'
                      )?.value || "",
                    expiry:
                      document.querySelector('input[placeholder="MM/YY"]')?.value || "",
                  };
                } else if (paymentMethod === "upi") {
                  details = {
                    upiId:
                      document.querySelector('input[placeholder="username@upi"]')
                        ?.value || "",
                  };
                }

                handleProcessPayment({
                  method: paymentMethod,
                  details,
                });
              }}
            >
              {submittingOrder
                ? "Processing..."
                : `Pay ${formatCurrency(orderTotals.totalAmount)}`}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={successOpen}
          onClose={handleCloseSuccess}
          PaperProps={{ className: "custom-dialog-paper" }}
        >
          <DialogContent>
            <Box display="flex" flexDirection="column" alignItems="center" p={2}>
              <CheckCircleIcon sx={{ fontSize: 60, mb: 2, color: "#ef5350" }} />
              <Typography variant="h5" gutterBottom>
                Order Placed Successfully!
              </Typography>
              <Typography variant="body1" align="center" gutterBottom>
                Your order #{orderDetails?.id} has been placed successfully.
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Payment Method: {paymentMethodLabel(orderDetails?.paymentMethod)}
              </Typography>

              <Box my={2} width="100%">
                <Alert severity="info">
                  Inventory has been updated from MongoDB and your order is now part of your account history.
                </Alert>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                handleCloseSuccess();
                setActiveView("orders");
                navigate("/customer/orders");
              }}
            >
              View Orders
            </Button>
            <Button variant="contained" color="primary" onClick={handleCloseSuccess}>
              Continue Shopping
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DarkOverlay>
  );
};

export default CustomerDashboard;
