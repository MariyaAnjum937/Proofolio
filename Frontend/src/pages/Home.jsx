import React from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icons";
import { StatusBadge } from "../components/Badge";

function Home() {
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("proofolioUser") || "null");
    } catch {
      return null;
    }
  })();

  const role = storedUser?.role?.toLowerCase();
  const dashboardLink = role === "faculty" ? "/faculty" : role === "admin" ? "/admin" : "/dashboard";

  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden text-center max-w-4xl mx-auto pt-6 pb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-orange-950/40 text-indigo-700 dark:text-orange-400 border border-indigo-200/80 dark:border-orange-800/50 mb-6 shadow-xs">
          <Icon name="award" className="w-4 h-4 text-indigo-600 dark:text-orange-400" />
          <span>Institutional Achievement & Certificate Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-[1.15] mb-6">
          Showcase, verify, and mentor{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-orange-400 dark:to-amber-400">
            student excellence.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
          Proofolio unifies student achievement portfolios, department-level faculty verification, and structured academic mentoring into one secure, institutional platform.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3.5">
          {storedUser ? (
            <Link
              to={dashboardLink}
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm hover:shadow transition-all"
            >
              <Icon name="award" className="w-5 h-5" />
              Go to Your Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm hover:shadow transition-all"
              >
                <span>Get Started as Student / Faculty</span>
                <Icon name="chevron-right" className="w-4 h-4" />
              </Link>
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs transition-all"
              >
                Sign In to Portal
              </Link>
            </>
          )}
        </div>

        {/* Live UI Mockup Preview */}
        <div className="mt-12 p-3 sm:p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl max-w-3xl mx-auto">
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Icon name="award" className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">National Hackathon — 1st Place Winner</h4>
                  <p className="text-xs text-slate-500">Issued by Smart India Hackathon · Computer Science & Eng.</p>
                </div>
              </div>
              <StatusBadge status="verified" />
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 font-medium">
                  <Icon name="calendar" className="w-4 h-4 text-slate-400" />
                  Oct 2026
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Icon name="shield" className="w-4 h-4 text-emerald-600" />
                  Verified by Prof. Sharma (CSE Dept)
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold">
                <Icon name="eye" className="w-4 h-4" />
                Digital Proof Attached
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-8 border-t border-slate-200/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Built for authentic academic accomplishments</h2>
          <p className="text-slate-600 text-sm mt-2">Every feature designed to maintain academic integrity while providing students a competitive advantage.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Icon name="shield" className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Faculty Verification Queue</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every certificate undergoes departmental faculty review. Faculty can approve authentic credentials or provide feedback for corrections.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Icon name="users" className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Structured Mentoring</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Schedule 1-on-1 mentoring sessions, define measurable goals, assign action items, and maintain historical progress notes all in one place.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Icon name="building" className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Institutional Analytics</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Administrators gain comprehensive visibility across branches, academic years, semesters, and overall student achievement metrics.
            </p>
          </div>
        </div>
      </section>

      {/* Role-Specific Workflows */}
      <section className="py-8 border-t border-slate-200/80">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Tailored experiences for every role</h2>
          <p className="text-slate-600 text-sm mt-2">Clear permissions and purpose-built interfaces for Students, Faculty, and Administrators.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                For Students
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-4 mb-2">Build Your Proof of Work</h3>
              <ul className="text-sm text-slate-600 space-y-2.5">
                <li className="flex items-start gap-2">
                  <Icon name="check" className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Upload certificates with digital proof</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check" className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Track verification status in real-time</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check" className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Collaborate with assigned faculty mentors</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check" className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Manage academic profile & milestones</span>
                </li>
              </ul>
            </div>
            <Link to="/signup" className="mt-6 text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Join as Student <Icon name="chevron-right" className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                For Faculty
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-4 mb-2">Validate & Guide Students</h3>
              <ul className="text-sm text-slate-600 space-y-2.5">
                <li className="flex items-start gap-2">
                  <Icon name="check" className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Branch-filtered student directories</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check" className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>1-click verification or remark-based rejection</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check" className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Mentoring session scheduling & action items</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check" className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Maintain own professional certificates</span>
                </li>
              </ul>
            </div>
            <Link to="/signup" className="mt-6 text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Register as Faculty <Icon name="chevron-right" className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                For Administrators
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-4 mb-2">Institutional Governance</h3>
              <ul className="text-sm text-slate-600 space-y-2.5">
                <li className="flex items-start gap-2">
                  <Icon name="check" className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Faculty account approvals and verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check" className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Branch assignments controlling review scope</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check" className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Institutional achievement directories</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check" className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Comprehensive reports and filter tools</span>
                </li>
              </ul>
            </div>
            <Link to="/signin" className="mt-6 text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Admin Portal <Icon name="chevron-right" className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Ready Banner */}
      <section className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center shadow-lg">
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Elevate your institution's achievement management</h2>
        <p className="text-indigo-200 max-w-xl mx-auto text-sm sm:text-base mb-6">
          Start recording certified milestones today. Build credibility with verified proofs.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-indigo-950 bg-white hover:bg-indigo-50 rounded-xl shadow-md transition-all"
        >
          <span>Create Account Now</span>
          <Icon name="chevron-right" className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}

export default Home;