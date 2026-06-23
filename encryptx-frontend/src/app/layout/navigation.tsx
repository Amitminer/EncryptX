"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HomeIcon, Lock, Menu, X, Unlock } from "lucide-react"
import { useState, ComponentType, SVGProps } from "react"

/**
 * Renders a responsive, fixed navigation bar with a subtle design.
 */
export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Home", icon: HomeIcon },
    { href: "/encrypt", label: "Encrypt", icon: Lock },
    { href: "/decrypt", label: "Decrypt", icon: Unlock },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 nav-subtle">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 transition-all duration-300">
              <Lock className="w-5 h-5 text-slate-200" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white subtle-title">EncryptX</span>
          </Link>

          {/* Mobile menu button */}
          <div className="block sm:hidden">
            <MobileNav navItems={navItems} pathname={pathname} />
          </div>

          {/* Desktop navigation */}
          <div className="hidden sm:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative text-sm font-medium transition-all duration-200 group ${
                  pathname === item.href 
                    ? "text-white" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-2">
                  {item.icon && (
                    <item.icon className={`w-4 h-4 transition-all duration-200 ${
                      pathname === item.href ? "text-indigo-400" : "text-slate-400 group-hover:text-indigo-400"
                    }`} />
                  )}
                  <span>{item.label}</span>
                </div>
                
                {/* Active indicator */}
                {pathname === item.href && (
                  <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"></div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

type NavItem = { href: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> };
type MobileNavProps = {
  navItems: NavItem[];
  pathname: string;
};

function MobileNav({ navItems, pathname }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  
  return (
    <div className="relative">
      <button
        className="p-2 rounded-lg border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all duration-200"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open navigation menu"
      >
        {open ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </button>
      
      {open && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
          ></div>
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-slate-900 rounded-xl shadow-xl py-2 z-50 border border-slate-800 overflow-hidden">
            <div className="relative z-10">
              {navItems.map((item: NavItem) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    pathname === item.href 
                      ? "text-white bg-slate-800 border-r-2 border-indigo-500" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {item.icon && (
                    <item.icon className={`w-4 h-4 ${
                      pathname === item.href ? "text-indigo-400" : "text-slate-400"
                    }`} />
                  )}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}