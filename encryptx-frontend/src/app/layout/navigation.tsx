"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HomeIcon, Lock, Menu, X, Zap } from "lucide-react"
import { useState, ComponentType, SVGProps } from "react"

export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Home", icon: HomeIcon },
    { href: "/encrypt", label: "Encrypt", icon: Lock },
    { href: "/decrypt", label: "Decrypt", icon: Zap },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 nav-cyberpunk backdrop-blur-lg">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 via-cyan-500 to-pink-500 opacity-60"></div>
      
      <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-lg blur-md group-hover:blur-lg transition-all duration-300"></div>
              <div className="relative p-1 sm:p-2 rounded-lg hero-lock-glow border border-cyan-500/30 backdrop-blur-sm group-hover:border-cyan-400/50 transition-all duration-300">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div className="relative">
              <span className="gradient-text text-lg sm:text-2xl font-bold">EncryptX</span>
              {/* Text glow effect */}
              <span className="absolute inset-0 gradient-text text-lg sm:text-2xl font-bold blur-sm opacity-50 group-hover:opacity-75 transition-opacity duration-300">EncryptX</span>
            </div>
          </Link>

          {/* Mobile menu button */}
          <div className="block sm:hidden">
            <MobileNav navItems={navItems} pathname={pathname} />
          </div>

          {/* Desktop navigation */}
          <div className="hidden sm:flex items-center space-x-4 sm:space-x-8 md:space-x-12">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative text-base sm:text-lg font-medium transition-all duration-300 group ${
                  pathname === item.href 
                    ? "text-white" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-2">
                  {item.icon && (
                    <item.icon className={`w-4 h-4 transition-all duration-300 ${
                      pathname === item.href ? "text-cyan-400" : "group-hover:text-cyan-400"
                    }`} />
                  )}
                  <span>{item.label}</span>
                </div>
                
                {/* Active indicator */}
                {pathname === item.href && (
                  <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"></div>
                )}
                
                {/* Hover effect */}
                <div className={`absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500/50 to-purple-500/50 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${
                  pathname === item.href ? "hidden" : ""
                }`}></div>
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
        className="relative p-2 rounded-lg border border-white/20 bg-black/20 backdrop-blur-sm hover:border-white/30 transition-all duration-300 group"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open navigation menu"
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          {open ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <Menu className="w-5 h-5 text-white" />
          )}
        </div>
        
        {/* Button glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>
      
      {open && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
          ></div>
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-[#18182a]/95 backdrop-blur-lg rounded-xl shadow-2xl py-2 z-50 border border-white/10 overflow-hidden">
            {/* Menu background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-cyan-900/20"></div>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-60"></div>
            
            <div className="relative z-10">
              {navItems.map((item: NavItem, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 text-base font-medium transition-all duration-300 group ${
                    pathname === item.href 
                      ? "text-white bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border-r-2 border-cyan-400" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {item.icon && (
                    <item.icon className={`w-4 h-4 transition-all duration-300 ${
                      pathname === item.href ? "text-cyan-400" : "group-hover:text-cyan-400"
                    }`} />
                  )}
                  <span>{item.label}</span>
                  
                  {pathname === item.href && (
                    <div className="ml-auto w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  )}
                </Link>
              ))}

            </div>
          </div>
        </>
      )}
    </div>
  )
}