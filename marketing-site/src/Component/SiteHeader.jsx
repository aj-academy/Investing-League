import { Link } from "react-router-dom";
import { DECISION_LAB_LOGIN_URL } from "../lib/config";

function navClass(active) {
  return active
    ? "text-green-500 border-b-2 border-primary px-1 pt-1 font-medium"
    : "text-gray-700 hover:text-green-500 px-1 pt-1 font-medium";
}

export function SiteHeader({ active = "home", onLogin, onSignup }) {
  const handleAuth = (e, type) => {
    e.stopPropagation();
    if (type === "login") onLogin?.();
    else onSignup?.();
  };

  const scannerLink =
    active === "home"
      ? <a href="#scanner" className={navClass(false)}>Scanner</a>
      : (
        <Link to="/home#scanner" className={navClass(false)}>
          Scanner
        </Link>
      );

  return (
    <header className="bg-white shadow-md overflow-x-hidden">
      <nav className="flex items-center justify-between px-4 sm:px-12 h-16 lg:gap-8">
        <Link to="/home" className="flex-shrink-0 flex items-center">
          <img src="/Icon.png" className="h-14" alt="The Investing League" />
          <span className="text-2xl sm:text-4xl text-green-700 px-2 font-semibold hidden sm:inline">
            The Investing League
          </span>
        </Link>
        <div className="dropdown-menu absolute -top-full left-0 max-lg:bg-gray-300 w-full flex flex-col gap-6 items-center py-2 text-lg font-bold lg:static lg:flex-row lg:justify-between">
          <ul className="flex flex-col items-center gap-6 lg:flex-row lg:gap-6">
            <li className={navClass(active === "home")}>
              <Link to="/home">Home</Link>
            </li>
            <li className={navClass(active === "about")}>
              <Link to="/about">About us</Link>
            </li>
            <li className={navClass(active === "course")}>
              <Link to="/course">Courses</Link>
            </li>
            <li className="text-gray-700 hover:text-green-500 px-1 pt-1 font-medium whitespace-nowrap">
              {scannerLink}
            </li>
            <li className={navClass(active === "contact")}>
              <Link to="/contact">Contact</Link>
            </li>
          </ul>

          <div className="flex flex-col items-center gap-3 lg:flex-row lg:gap-2">
            <a
              href={DECISION_LAB_LOGIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 border border-green-500 px-3 py-2 rounded whitespace-nowrap hover:bg-green-50 text-sm font-semibold"
            >
              Decision Lab
            </a>
            {onLogin && (
              <button
                type="button"
                className="bg-white text-green-500 border border-green-500 px-4 py-2 rounded whitespace-nowrap hover:bg-gray-50"
                onClick={(e) => handleAuth(e, "login")}
              >
                Log in
              </button>
            )}
            {onSignup && (
              <button
                type="button"
                className="bg-green-500 text-white px-4 py-2 rounded whitespace-nowrap hover:bg-green-500/90"
                onClick={(e) => handleAuth(e, "signup")}
              >
                Sign up
              </button>
            )}
          </div>
        </div>

        <div className="toggle-button w-6 h-6 flex items-center justify-center lg:hidden">
          <i className="fa-solid fa-bars" />
        </div>
      </nav>
    </header>
  );
}
