import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { CreditCard, Wallet, Banknote, Save, CheckCircle, XCircle, Loader } from "lucide-react";

const PaymentGatewaySettings = () => {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Razorpay");

  const fetchSettings = async () => {
    try {
      const { data } = await api.get("/api/payment/admin/settings");
      setGateways(data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load payment settings");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (index, field, value) => {
    const updated = [...gateways];
    updated[index][field] = value;
    setGateways(updated);
  };

  const handleSave = async (gateway) => {
    const toastId = toast.loading(`Updating ${gateway.name}...`);
    try {
      await api.put("/api/payment/admin/update", {
        name: gateway.name,
        isActive: gateway.isActive,
        keyId: gateway.keyId,
        keySecret: gateway.keySecret,
        currency: gateway.currency,
        isTestMode: gateway.isTestMode,
        themeColor: gateway.themeColor
      });
      toast.success(`${gateway.name} Updated!`, { id: toastId });
      fetchSettings();
    } catch (error) {
      toast.error("Update failed", { id: toastId });
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500 flex justify-center items-center"><Loader className="animate-spin mr-2"/> Loading Payment Settings...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Wallet className="text-blue-600"/> Payment Gateway Settings
      </h2>

      {/* TABS */}
      <div className="flex space-x-4 mb-6 border-b border-gray-300 pb-1 overflow-x-auto">
        {gateways.map((g) => (
          <button
            key={g.name}
            onClick={() => setActiveTab(g.name)}
            className={`pb-3 px-6 text-lg font-medium transition-colors relative whitespace-nowrap ${
              activeTab === g.name
                ? "text-blue-600 border-b-4 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-2">
              {g.name === "Razorpay" && <Banknote size={20} />}
              {g.name === "Stripe" && <CreditCard size={20} />}
              {g.name === "Paypal" && <Wallet size={20} />}
              {g.name}
            </span>
          </button>
        ))}
      </div>

      {/* FORM CONTENT */}
      {gateways.map((g, index) => (
        <div key={g._id} className={activeTab === g.name ? "block" : "hidden"}>
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100 flex-wrap gap-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{g.name} Configuration</h3>
                <p className="text-gray-500 mt-1">Manage API keys and active status for {g.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold flex items-center gap-1 ${g.isActive ? "text-green-600" : "text-gray-400"}`}>
                  {g.isActive ? <CheckCircle size={16}/> : <XCircle size={16}/>}
                  {g.isActive ? "ENABLED" : "DISABLED"}
                </span>
                <button
                  onClick={() => handleChange(index, "isActive", !g.isActive)}
                  className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
                    g.isActive ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                    g.isActive ? "translate-x-6" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {g.name === "Paypal" ? "Client ID" : "Public Key / Key ID"}
                  </label>
                  <input
                    type="text"
                    value={g.keyId}
                    onChange={(e) => handleChange(index, "keyId", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
                    placeholder="Enter Public Key"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {g.name === "Paypal" ? "Client Secret" : "Secret Key"}
                  </label>
                  <input
                    type="password"
                    value={g.keySecret}
                    onChange={(e) => handleChange(index, "keySecret", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
                    placeholder="****************"
                  />
                  <p className="text-xs text-gray-400 mt-1">Keep empty to retain existing secret.</p>
                </div>
              </div>

              <div className="space-y-6">
                 <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                  <select
                    value={g.currency}
                    onChange={(e) => handleChange(index, "currency", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                        <span className="block text-sm font-bold text-gray-700">Test Mode (Sandbox)</span>
                        <span className="text-xs text-gray-500">Use for testing without real money</span>
                    </div>
                    <input 
                        type="checkbox" 
                        checked={g.isTestMode}
                        onChange={(e) => handleChange(index, "isTestMode", e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                </div>

                {g.name === "Razorpay" && (
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Theme Color</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="color" 
                                value={g.themeColor}
                                onChange={(e) => handleChange(index, "themeColor", e.target.value)}
                                className="h-10 w-16 p-1 rounded border border-gray-300 cursor-pointer"
                            />
                            <span className="text-gray-600 font-mono text-sm">{g.themeColor}</span>
                        </div>
                    </div>
                )}
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end">
                <button
                    onClick={() => handleSave(g)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-1"
                >
                    <Save size={18} /> Save Changes
                </button>
            </div>

          </div>
        </div>
      ))}
    </div>
  );
};

export default PaymentGatewaySettings;