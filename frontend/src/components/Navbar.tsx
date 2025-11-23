'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FiMenu, FiX, FiShield, FiList, FiActivity, FiUser, FiLogOut } from 'react-icons/fi';
import { BiCoin } from 'react-icons/bi';
import { APP_CONFIG } from '@/config/contracts';

export default function Navbar() {
  const { login, logout, authenticated, user } = usePrivy();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: 'Bounties', href: '/bounties', icon: FiList },
    { name: 'Dashboard', href: '/dashboard', icon: FiActivity },
    { name: 'Criminal Records', href: '/records', icon: FiShield },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-dark-50/95 backdrop-blur-xl border-b border-dark-200/50 shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-500 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <FiShield className="relative w-8 h-8 text-primary-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">
              {APP_CONFIG.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-dark-600 hover:text-primary-500 hover:bg-dark-100/50 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {authenticated ? (
              <div className="flex items-center space-x-3">
                {/* CRIME Token Balance */}
                <div className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-dark-100/50 rounded-lg border border-dark-200/50">
                  <BiCoin className="w-5 h-5 text-accent-yellow" />
                  <span className="text-sm font-semibold">0 CRIME</span>
                </div>

                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 px-4 py-2 bg-dark-100/50 rounded-lg border border-dark-200/50 hover:border-primary-500/50 transition-all">
                    <FiUser className="w-4 h-4" />
                    <span className="hidden sm:block text-sm font-medium">
                      {user?.wallet?.address.slice(0, 6)}...{user?.wallet?.address.slice(-4)}
                    </span>
                  </button>

                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-48 bg-dark-100 border border-dark-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link
                      href="/profile"
                      className="flex items-center space-x-2 px-4 py-3 hover:bg-dark-200 transition-colors"
                    >
                      <FiUser className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full flex items-center space-x-2 px-4 py-3 hover:bg-dark-200 transition-colors text-primary-400"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={login} className="cyber-button text-sm">
                Connect Wallet
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-dark-100/50 transition-colors"
            >
              {isMobileMenuOpen ? (
                <FiX className="w-6 h-6" />
              ) : (
                <FiMenu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-dark-200/50 bg-dark-50/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-dark-600 hover:text-primary-500 hover:bg-dark-100/50 transition-all"
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
