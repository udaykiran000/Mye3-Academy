import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";
import {
  FaMagnifyingGlass,
  FaDownload,
  FaCircleCheck,
  FaCircleXmark,
  FaClock,
  FaMoneyBillWave,
  FaCalendar,
  FaArrowTrendUp,
  FaHandshake,
} from "react-icons/fa6";

// Helper function to format INR currency
const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

// Helper function to render status badges
const StatusBadge = ({ status }) => {
  const baseClass =
    "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit transition-colors duration-200";

  switch (status?.toLowerCase()) {
    case "success":
      return (
        <span className={`${baseClass} bg-green-100 text-green-700`}>
          <FaCircleCheck className="w-3 h-3" /> Success
        </span>
      );
    case "failed":
      return (
        <span className={`${baseClass} bg-red-100 text-red-700`}>
          <FaCircleXmark className="w-3 h-3" /> Failed
        </span>
      );
    case "pending":
    default:
      return (
        <span className={`${baseClass} bg-yellow-100 text-yellow-700`}>
          <FaClock className="w-3 h-3" /> Pending
        </span>
      );
  }
};

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FILTER STATES ---
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // "mock" or "grand"
  const [courseFilter, setCourseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // --- KPI DATA ---
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todaysRevenue: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    totalPending: 0,
  });

  /* ---------------------- FETCH DATA ---------------------- */

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch both payments and courses in parallel
      const [paymentsRes, coursesRes] = await Promise.all([
        api.get("/api/admin/payments"),
        api.get("/api/admin/mocktests/published/list"),
      ]);

      const paymentsData = paymentsRes.data;
      setPayments(paymentsData);
      setCourses(coursesRes.data);

      // --- KPI CALCULATIONS ---
      const successPayments = paymentsData.filter((p) => p.status === "success");
      const pendingPayments = paymentsData.filter((p) => p.status === "pending");
      
      const totalRevenue = successPayments.reduce((sum, p) => sum + p.amount, 0);

      const today = new Date().toLocaleDateString();
      const todaysRevenue = successPayments
        .filter((p) => new Date(p.date).toLocaleDateString() === today)
        .reduce((sum, p) => sum + p.amount, 0);

      const aov =
        successPayments.length > 0
          ? Math.round(totalRevenue / successPayments.length)
          : 0;

      setStats({
        totalRevenue: totalRevenue,
        todaysRevenue: todaysRevenue,
        totalTransactions: paymentsData.length,
        averageOrderValue: aov,
        totalPending: pendingPayments.length,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------- FILTER LOGIC ---------------------- */

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // 1. Search
      const matchesSearch =
        p.studentName?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase()) ||
        p.orderId?.toLowerCase().includes(search.toLowerCase());

      // 2. Type Filter (CRITICAL FIX: Cross-reference with courses array)
      let matchesType = true;
      if (typeFilter !== "") {
        // Find the course object that matches this payment
        const linkedCourse = courses.find((c) => c.title === p.courseName);
        
        if (typeFilter === "grand") {
          // It matches if the found course has isGrandTest: true
          matchesType = linkedCourse?.isGrandTest === true;
        } else if (typeFilter === "mock") {
          // It matches if isGrandTest is false OR undefined
          matchesType = !linkedCourse?.isGrandTest;
        }
      }

      // 3. Course Name
      const matchesCourse =
        courseFilter === "" || p.courseName === courseFilter;

      // 4. Status
      const matchesStatus =
        statusFilter === "" || p.status === statusFilter;

      // 5. Date
      const matchesDate =
        dateFilter === "" ||
        new Date(p.date).toISOString().split("T")[0] === dateFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesCourse &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [payments, courses, search, typeFilter, courseFilter, statusFilter, dateFilter]);

  /* ---------------------- STYLES ---------------------- */
  const tableHeadClassLeft =
    "px-6 py-3 text-left font-bold text-gray-600 tracking-wider border-b text-sm uppercase";
  const tableDataClass = "px-6 py-4 whitespace-nowrap text-sm text-gray-700";
  const inputClass =
    "w-full p-2.5 bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 outline-none";

  const KpiCard = ({ title, value, icon: Icon, colorClass }) => {
    const isColoredBg =
      colorClass.includes("bg-indigo") || colorClass.includes("bg-orange");
    const textColor = isColoredBg ? "text-white" : "text-gray-900";
    const iconColor = isColoredBg ? "text-white" : "text-gray-500";

    return (
      <div
        className={`flex flex-col p-5 rounded-xl shadow-lg border-b-4 ${colorClass}`}
      >
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <h2 className={`text-2xl font-extrabold mt-3 ${textColor}`}>
          {value}
        </h2>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen font-sans">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
        <FaMoneyBillWave className="text-blue-600" /> Payment Management
      </h1>

      {/* --- KPI CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <KpiCard
          title="Total Revenue"
          value={formatPrice(stats.totalRevenue)}
          icon={FaMoneyBillWave}
          colorClass="bg-white border-l-4 border-indigo-600 shadow-lg"
        />
        <KpiCard
          title="Today's Revenue"
          value={formatPrice(stats.todaysRevenue)}
          icon={FaCalendar}
          colorClass="bg-white border-l-4 border-orange-500 shadow-lg"
        />
        <KpiCard
          title="Total Transactions"
          value={stats.totalTransactions}
          icon={FaArrowTrendUp}
          colorClass="bg-white border-l-4 border-blue-500 shadow-lg"
        />
        <KpiCard
          title="Avg. Order Value"
          value={formatPrice(stats.averageOrderValue)}
          icon={FaHandshake}
          colorClass="bg-white border-l-4 border-green-500 shadow-lg"
        />
        <KpiCard
          title="Pending Payments"
          value={stats.totalPending}
          icon={FaClock}
          colorClass="bg-white border-l-4 border-red-500 shadow-lg"
        />
      </div>

      {/* --- FILTER SECTION --- */}
      <div className="bg-white rounded-xl shadow p-5 mb-8 border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Filter Transactions
          </h3>
          <button
            className="flex items-center bg-blue-600 text-white px-4 py-2.5 rounded-lg shadow hover:bg-blue-700 transition text-sm font-medium"
            onClick={() => alert("Downloading report...")}
          >
            <FaDownload className="w-4 h-4 mr-2" /> Download Report (
            {filteredPayments.length})
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* 1. Search */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <label className="block text-gray-700 text-xs font-bold uppercase mb-1">
              Search
            </label>
            <div className="relative">
              <FaMagnifyingGlass className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Name, Email, ID..."
                className={`${inputClass} pl-9`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* 2. Type Filter (Mock vs Grand) */}
          <div>
            <label className="block text-gray-700 text-xs font-bold uppercase mb-1">
              Test Type
            </label>
            <select
              className={inputClass}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="mock">Mock Test</option>
              <option value="grand">Grand Test</option>
            </select>
          </div>

          {/* 3. Test Name */}
          <div>
            <label className="block text-gray-700 text-xs font-bold uppercase mb-1">
              Test Name
            </label>
            <select
              className={inputClass}
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <option value="">All Tests</option>
              {courses.map((c) => (
                <option key={c._id} value={c.title}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Status */}
          <div>
            <label className="block text-gray-700 text-xs font-bold uppercase mb-1">
              Status
            </label>
            <select
              className={inputClass}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* 5. Date */}
          <div>
            <label className="block text-gray-700 text-xs font-bold uppercase mb-1">
              Date
            </label>
            <input
              type="date"
              className={inputClass}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Transaction History
          </h3>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
            {filteredPayments.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-100/70">
                <th className={tableHeadClassLeft}>Student</th>
                <th className={tableHeadClassLeft}>Test Name</th>
                <th className={tableHeadClassLeft}>Type</th> 
                <th className={tableHeadClassLeft}>Email</th>
                <th className="px-6 py-3 text-right font-bold text-gray-600 tracking-wider border-b text-sm uppercase">
                  Amount
                </th>
                <th className={tableHeadClassLeft}>Date</th>
                <th className={tableHeadClassLeft}>Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FaClock className="animate-spin w-6 h-6 text-blue-500" />
                      <span>Loading transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500">
                    No transactions found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  // Logic to find the linked course for this payment row
                  const linkedCourse = courses.find(c => c.title === p.courseName);
                  const isGrand = linkedCourse?.isGrandTest === true;

                  return (
                    <tr
                      className="hover:bg-blue-50/40 transition duration-150 group"
                      key={p._id}
                    >
                      {/* Name */}
                      <td className={tableDataClass}>
                        <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition">
                          {p.studentName}
                        </p>
                      </td>

                      {/* Test Name */}
                      <td className={tableDataClass}>
                        <span className="font-medium">{p.courseName}</span>
                      </td>

                      {/* Type (Based on isGrandTest flag) */}
                      <td className={tableDataClass}>
                         <span className={`text-xs px-2 py-1 rounded border ${
                           isGrand
                           ? 'bg-purple-50 text-purple-700 border-purple-100'
                           : 'bg-gray-50 text-gray-600 border-gray-200'
                         }`}>
                           {isGrand ? "Grand Test" : "Mock Test"}
                         </span>
                      </td>

                      {/* Email */}
                      <td className={`${tableDataClass} text-gray-500`}>
                        {p.email}
                      </td>

                      {/* Amount */}
                      <td
                        className={`${tableDataClass} font-bold text-right text-green-600`}
                      >
                        {formatPrice(p.amount)}
                      </td>

                      {/* Date */}
                      <td className={tableDataClass}>
                        {new Date(p.date).toLocaleDateString()}
                      </td>

                      {/* Status */}
                      <td className={tableDataClass}>
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentManagement;