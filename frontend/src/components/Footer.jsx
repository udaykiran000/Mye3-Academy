// src/components/Footer.jsx
import React from "react";
import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {/* BRAND COLUMN */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              <span className="text-indigo-400">MYE 3 Academy</span>
            </h3>
          </Link>
          <p className="text-xs leading-relaxed text-slate-400">
            The nation's most trusted AI-powered test series platform. Your
            partner in exam excellence and professional success.
          </p>
        </div>

        {/* QUICK LINKS */}
        <div>
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4">
            Quick Links
          </h3>
          <ul className="space-y-2 text-xs font-medium">
            <li>
              <a href="#" className="hover:text-indigo-400 transition-colors">
                All Test Series
              </a>
            </li>
            <li>
              <a
                href="#categories"
                className="hover:text-indigo-400 transition-colors"
              >
                Learning Categories
              </a>
            </li>
            <li>
              <a
                href="#mock-tests"
                className="hover:text-indigo-400 transition-colors"
              >
                Featured Mock Tests
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-indigo-400 transition-colors">
                Grand Test Schedule
              </a>
            </li>
          </ul>
        </div>

        {/* SUPPORT */}
        <div>
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4">
            Support
          </h3>
          <ul className="space-y-2 text-xs font-medium">
            <li>
              <a href="#" className="hover:text-indigo-400 transition-colors">
                About MYE 3 Academy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-indigo-400 transition-colors">
                Contact Support
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-indigo-400 transition-colors">
                Instructor Program
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-indigo-400 transition-colors">
                Help Center / FAQ
              </a>
            </li>
          </ul>
        </div>

        {/* LEGAL */}
        <div>
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4">
            Legal
          </h3>
          <ul className="space-y-2 text-xs font-medium">
            <li>
              <a href="#" className="hover:text-indigo-400 transition-colors">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-indigo-400 transition-colors">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-indigo-400 transition-colors">
                Refund Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-indigo-400 transition-colors">
                Cookie Settings
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* COPYRIGHT SECTION */}
      <div className="mt-10 border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        <p>&copy; 2025 MYE 3 Academy. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Designed By <span className="text-slate-300">Web N App Studio</span>
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
