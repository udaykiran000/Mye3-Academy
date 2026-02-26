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
      const { data } = await api.get("/api/admin/payment-settings");
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
      await api.put("/api/admin/payment-settings", {
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
    <div className="px-6 py-2 max-w-6xl mx-auto font-sans">
      <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
        <Wallet className="text-blue-600" size={20} /> Payment Gateway Settings
      </h2>

      {/* TABS */}
      <div className="flex space-x-2 mb-4 border-b border-gray-200 pb-0 overflow-x-auto">
        {gateways.map((g) => (
          <button
            key={g.name}
            onClick={() => setActiveTab(g.name)}
            className={`pb-2 px-4 text-sm font-black tracking-widest transition-all relative whitespace-nowrap uppercase ${
              activeTab === g.name
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-2">
              {g.name === "Razorpay" && <Banknote size={14} />}
              {g.name === "Stripe" && <CreditCard size={14} />}
              {g.name === "Paypal" && <Wallet size={14} />}
              {g.name}
            </span>
          </button>
        ))}
      </div>

      {/* FORM CONTENT */}
      {gateways.map((g, index) => (
        <div key={g._id} className={activeTab === g.name ? "block" : "hidden"}>
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-black text-gray-800">{g.name} configuration</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1 opacity-70">Manage API keys and active status for {g.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold tracking-widest flex items-center gap-1 ${g.isActive ? "text-green-600" : "text-gray-400"}`}>
                  {g.isActive ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                  {g.isActive ? "Enabled" : "Disabled"}
                </span>
                <button
                  onClick={() => handleChange(index, "isActive", !g.isActive)}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-300 ${
                    g.isActive ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    g.isActive ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 tracking-widest mb-2 opacity-70 uppercase">
                    {g.name === "Paypal" ? "Client ID" : "Public Key / Key ID"}
                  </label>
                  <input
                    type="text"
                    value={g.keyId}
                    onChange={(e) => handleChange(index, "keyId", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm"
                    placeholder="Enter Public Key"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 tracking-widest mb-2 opacity-70 uppercase">
                    {g.name === "Paypal" ? "Client Secret" : "Secret Key"}
                  </label>
                  <input
                    type="password"
                    value={g.keySecret}
                    onChange={(e) => handleChange(index, "keySecret", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm"
                    placeholder="****************"
                  />
                  <p className="text-xs text-gray-400 mt-1">Keep empty to retain existing secret.</p>
                </div>
              </div>

              <div className="space-y-4">
                 <div>
                  <label className="block text-xs font-bold text-gray-700 tracking-widest mb-2 opacity-70 uppercase">Currency</label>
                  <select
                    value={g.currency}
                    onChange={(e) => handleChange(index, "currency", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                        <span className="block text-xs font-black text-gray-600 uppercase tracking-widest">Test Mode (Sandbox)</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Use for testing without real money</span>
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
                        <label className="block text-xs font-bold text-gray-700 tracking-widest mb-2 opacity-70 uppercase">Theme Color</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="color" 
                                value={g.themeColor}
                                onChange={(e) => handleChange(index, "themeColor", e.target.value)}
                                className="h-8 w-14 p-1 rounded border border-gray-200 cursor-pointer"
                            />
                            <span className="text-gray-400 font-black text-[10px] tracking-widest">{g.themeColor}</span>
                        </div>
                    </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <button
                    onClick={() => handleSave(g)}
                    className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] py-3 px-8 rounded-none shadow-lg shadow-blue-100 transition-all hover:-translate-y-0.5 active:scale-95 uppercase tracking-widest"
                >
                    <Save size={14} /> Save {g.name} settings
                </button>
            </div>

          </div>
        </div>
      ))}
    </div>
  );
};

export default PaymentGatewaySettings;