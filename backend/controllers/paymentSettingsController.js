import PaymentGateway from "../models/PaymentGateway.js";

// ----------------------------------------------------------------------
// 1. GET ALL GATEWAYS (For Admin Panel)
// ----------------------------------------------------------------------
export const getAllPaymentSettings = async (req, res) => {
  try {
    let gateways = await PaymentGateway.find({});

    // 🟢 INITIALIZATION: If DB is empty, create defaults automatically
    if (gateways.length === 0) {
      const defaults = [
        { name: "Razorpay", isActive: true, currency: "INR", credentials: { keyId: "", keySecret: "" } },
        { name: "Stripe", isActive: false, currency: "USD", credentials: { keyId: "", keySecret: "" } },
        { name: "Paypal", isActive: false, currency: "USD", credentials: { keyId: "", keySecret: "" } }
      ];
      gateways = await PaymentGateway.insertMany(defaults);
    }

    // 🔒 SECURITY: Mask the Secret Key
    const secureGateways = gateways.map(g => ({
      _id: g._id,
      name: g.name,
      isActive: g.isActive,
      isTestMode: g.isTestMode,
      currency: g.currency,
      themeColor: g.themeColor,
      keyId: g.credentials.keyId,
      // If secret exists, send a placeholder so UI knows it's set
      keySecret: g.credentials.keySecret ? "********" : "" 
    }));

    res.status(200).json(secureGateways);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ----------------------------------------------------------------------
// 2. UPDATE GATEWAY (For Admin Panel)
// ----------------------------------------------------------------------
export const updatePaymentSetting = async (req, res) => {
  try {
    const { name, isActive, keyId, keySecret, currency, isTestMode, themeColor } = req.body;

    const gateway = await PaymentGateway.findOne({ name });
    if (!gateway) return res.status(404).json({ message: "Gateway not found" });

    // Update fields if they are present in request
    if (isActive !== undefined) gateway.isActive = isActive;
    if (isTestMode !== undefined) gateway.isTestMode = isTestMode;
    if (currency) gateway.currency = currency;
    if (themeColor) gateway.themeColor = themeColor;
    
    // Update Keys
    if (keyId) gateway.credentials.keyId = keyId;
    
    // 🔒 SMART SECRET: Only update if admin typed something new (not asterisks)
    if (keySecret && keySecret !== "********") {
      gateway.credentials.keySecret = keySecret;
    }

    await gateway.save();
    res.status(200).json({ success: true, message: `${name} Updated` });

  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Update Failed" });
  }
};

// ----------------------------------------------------------------------
// 3. GET ACTIVE CONFIG (For Student Checkout)
// ----------------------------------------------------------------------
export const getActivePaymentConfig = async (req, res) => {
  try {
    const activeGateway = await PaymentGateway.findOne({ isActive: true });
    
    if (!activeGateway) {
      return res.status(404).json({ message: "No active payment gateway" });
    }

    // Return ONLY public info. NEVER return keySecret here.
    res.status(200).json({
      provider: activeGateway.name, // "Razorpay"
      keyId: activeGateway.credentials.keyId,
      currency: activeGateway.currency,
      themeColor: activeGateway.themeColor,
      isTestMode: activeGateway.isTestMode
    });
  } catch (error) {
    res.status(500).json({ message: "Config Error" });
  }
};