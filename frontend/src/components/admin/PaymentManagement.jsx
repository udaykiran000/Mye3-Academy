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
  FaChevronRight,
  FaCreditCard,
} from "react-icons/fa6";
import toast from "react-hot-toast";

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
        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
          <FaCircleCheck className="w-2.5 h-2.5" /> Success
        </span>
      );
    case "failed":
      return (
        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100">
          <FaCircleXmark className="w-2.5 h-2.5" /> Failed
        </span>
      );
    case "pending":
    default:
      return (
        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100">
          <FaClock className="w-2.5 h-2.5" /> Pending
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

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, courseFilter, statusFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / ITEMS_PER_PAGE));

  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPayments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredPayments]);

  /* ---------------------- STYLES ---------------------- */
  const tableHeadClassLeft =
    "px-6 py-3 text-left font-black text-[#3e4954] tracking-widest border-b text-[10px] uppercase";
  const tableDataClass = "px-6 py-3 whitespace-nowrap text-[11px] font-bold text-gray-700 border-b border-slate-100";
  const inputClass =
    "w-full px-3 py-1.5 bg-slate-50 border border-slate-200 text-[10px] font-bold text-gray-700 focus:border-blue-500 outline-none transition duration-150 rounded-none";

  const KpiCard = ({ title, value, icon: Icon, colorClass }) => {
    const isColoredBg =
      colorClass.includes("bg-indigo") || colorClass.includes("bg-orange");
    const textColor = isColoredBg ? "text-white" : "text-gray-900";
    const iconColor = isColoredBg ? "text-white" : "text-gray-500";

    return (
      <div
        className={`flex flex-col p-4 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border-b-4 ${colorClass}`}
      >
        <div className="flex justify-between items-center">
          <p className="text-[10px] text-gray-400 font-bold tracking-widest mb-1 opacity-70 uppercase"> {title} </p>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <h2 className={`text-lg font-black mt-2 ${textColor}`}>
          {value}
        </h2>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#EDF0FF] font-poppins">
      {/* WHITE HEADER STRIP */}
      <div className="bg-white border-b border-slate-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] mb-8">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6 py-8 animate-in fade-in slide-in-from-top-1 duration-700">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.2)]" />
              <div>
                <h1 className="text-2xl font-black text-[#3e4954] tracking-tight uppercase flex items-center gap-3">
                  <FaCreditCard className="text-blue-600" size={24} />
                  Payment Management
                </h1>
                <p className="text-[10px] font-black text-[#7e7e7e] uppercase tracking-[0.1em] opacity-60 mt-1">
                  Monitor financial transactions, revenue metrics and order history
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                className="flex items-center gap-2 bg-white border border-slate-200 text-[#7e7e7e] px-4 py-2.5 rounded-none shadow-sm hover:bg-slate-50 transition font-black text-[10px] uppercase tracking-widest border-b-2 hover:border-b-blue-600"
                onClick={async () => {
                  try {
                    const response = await api.get("/api/admin/payments/report", { responseType: "blob" });
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute("download", "Payments_Report.csv");
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    toast.success("Payment report downloaded");
                  } catch (err) {
                    toast.error("Download failed");
                  }
                }}
              >
                <FaDownload className="w-3.5 h-3.5" /> Download Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-4 md:px-6 pb-12">
        <div className="space-y-8">
          {/* --- KPI CARDS --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <KpiCard
              title="Total Revenue"
              value={formatPrice(stats.totalRevenue)}
              icon={FaMoneyBillWave}
              colorClass="bg-white border-l-4 border-indigo-600 shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
            />
            <KpiCard
              title="Today's Revenue"
              value={formatPrice(stats.todaysRevenue)}
              icon={FaCalendar}
              colorClass="bg-white border-l-4 border-orange-500 shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
            />
            <KpiCard
              title="Total Transactions"
              value={stats.totalTransactions}
              icon={FaArrowTrendUp}
              colorClass="bg-white border-l-4 border-blue-500 shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
            />
            <KpiCard
              title="Avg. Order Value"
              value={formatPrice(stats.averageOrderValue)}
              icon={FaHandshake}
              colorClass="bg-white border-l-4 border-green-500 shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
            />
            <KpiCard
              title="Pending Payments"
              value={stats.totalPending}
              icon={FaClock}
              colorClass="bg-white border-l-4 border-red-500 shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
            />
          </div>

      {/* --- FILTER SECTION --- */}
      <div className="bg-white rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-4 mb-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
          <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">
            Filter Transactions
          </h3>
          <button
            className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-none shadow-lg shadow-blue-100 hover:bg-blue-700 transition text-[10px] font-black uppercase tracking-widest"
            onClick={async () => {
              try {
                const response = await api.get("/api/admin/payments/report", { responseType: "blob" });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", "Payments_Report.csv");
                document.body.appendChild(link);
                link.click();
                link.remove();
                toast.success("Payment report downloaded");
              } catch (err) {
                toast.error("Download failed");
              }
            }}
          >
            <FaDownload className="w-3 h-3 mr-2" /> Download Report (
            {filteredPayments.length})
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* 1. Search */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <label className="block text-gray-700 text-[10px] font-bold tracking-widest mb-1">
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
            <label className="block text-gray-700 text-[10px] font-bold tracking-widest mb-1">
              Test type
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
            <label className="block text-gray-700 text-[10px] font-bold tracking-widest mb-1">
              Test name
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
            <label className="block text-gray-700 text-[10px] font-bold tracking-widest mb-1">
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
            <label className="block text-gray-700 text-[10px] font-bold tracking-widest mb-1">
              Date
            </label>
            <input
              type="date"
              className={`${inputClass} !py-1.5`}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="bg-white rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.12)] border border-gray-200 overflow-hidden">
        <div className="px-4 py-2 bg-[#fdfdfd] border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-[10px] font-black text-[#3e4954] uppercase tracking-widest">
            Transaction History
          </h3>
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-none border border-blue-100 text-[9px] font-black uppercase tracking-widest">
            {filteredPayments.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-[#fdfdfd] border-b border-slate-200">
                <th className={tableHeadClassLeft}>Student</th>
                <th className={tableHeadClassLeft}>Test Name</th>
                <th className={tableHeadClassLeft}>Type</th> 
                <th className={tableHeadClassLeft}>Email</th>
                <th className="px-6 py-3 text-right font-black text-[#3e4954] tracking-widest border-b text-[10px] uppercase">
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
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500">
                    No transactions found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((p) => {
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
                         <span className={`text-[9px] px-1.5 py-0.5 rounded-none font-black uppercase tracking-widest border ${
                           isGrand
                           ? 'bg-purple-50 text-purple-600 border-purple-100'
                           : 'bg-slate-50 text-slate-500 border-slate-200'
                         }`}>
                           {isGrand ? "Grand" : "Mock"}
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

        {/* PAGINATION CONTROLS */}
        {!loading && filteredPayments.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#fdfdfd] border-t border-slate-200">
            <div className="text-[10px] font-black text-[#7e7e7e] uppercase tracking-widest font-poppins">
              Showing <span className="text-[#3e4954]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-[#3e4954]">{Math.min(currentPage * ITEMS_PER_PAGE, filteredPayments.length)}</span> of <span className="text-[#21b731]">{filteredPayments.length}</span> results
            </div>
            
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="w-10 h-10 flex items-center justify-center border border-slate-200 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-[#3e4954] transition-all"
              >
                <FaChevronRight size={14} className="rotate-180" />
              </button>

              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    pageNum === 1 || 
                    pageNum === totalPages || 
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 text-[11px] font-black transition-all border ${
                          currentPage === pageNum 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-[#3e4954]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 2 || 
                    pageNum === currentPage + 2
                  ) {
                    return <span key={pageNum} className="px-1 text-slate-300 font-bold">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="w-10 h-10 flex items-center justify-center border border-slate-200 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-[#3e4954] transition-all"
              >
                <FaChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentManagement;