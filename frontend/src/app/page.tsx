'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { FiShield, FiSearch, FiAward, FiTrendingUp, FiArrowRight } from 'react-icons/fi';
import { BiCoin } from 'react-icons/bi';

export default function HomePage() {
  const stats = [
    { label: 'Total Bounties', value: '1,234', icon: FiAward, color: 'text-accent-cyan' },
    { label: 'Total Rewards', value: '$2.5M', icon: BiCoin, color: 'text-accent-yellow' },
    { label: 'Active Hunters', value: '5,678', icon: FiSearch, color: 'text-accent-green' },
    { label: 'Resolved Cases', value: '892', icon: FiShield, color: 'text-primary-500' },
  ];

  const features = [
    {
      icon: FiAward,
      title: 'Bug Bounty Platform',
      description: 'Find vulnerabilities in smart contracts and earn rewards. High, Medium, and Low severity bounties available.',
    },
    {
      icon: FiShield,
      title: 'Criminal Record Tracking',
      description: 'On-chain criminal records for Web3 crimes. Transparent, immutable, and globally accessible.',
    },
    {
      icon: BiCoin,
      title: 'CRIME Token Rewards',
      description: 'Stake CRIME tokens for yield, access premium features, and participate in DAO governance.',
    },
    {
      icon: FiTrendingUp,
      title: 'Advanced Analytics',
      description: 'Track bounty trends, hunter leaderboards, and platform statistics in real-time.',
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 cyber-bg opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-500/5 to-transparent" />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-500/10 border border-primary-500/30 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              <span className="text-sm font-medium text-primary-400">
                Decentralized Web3 Security Platform
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="gradient-text">Track Crime.</span>
              <br />
              <span className="text-dark-900">Secure Web3.</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl text-dark-600 max-w-2xl mx-auto">
              The ultimate platform for smart contract auditing, bug bounties, and blockchain crime tracking.
              Powered by decentralized validation and on-chain transparency.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/bounties" className="cyber-button">
                Explore Bounties
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 border border-dark-200 rounded-lg font-semibold hover:border-primary-500/50 transition-all flex items-center space-x-2"
              >
                <span>View Dashboard</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="stat-card text-center">
                  <Icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
                  <div className="text-3xl font-bold text-dark-900">{stat.value}</div>
                  <div className="text-sm text-dark-500 mt-1">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark-900 mb-4">
              Platform Features
            </h2>
            <p className="text-lg text-dark-600 max-w-2xl mx-auto">
              Comprehensive tools for Web3 security, bounty hunting, and crime tracking
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="glass-card p-8 card-hover group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary-500" />
                  </div>
                  <h3 className="text-xl font-bold text-dark-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-dark-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glow-border glass-card p-12 text-center">
            <h2 className="text-4xl font-bold text-dark-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-dark-600 mb-8 max-w-2xl mx-auto">
              Join thousands of security researchers, companies, and validators securing the Web3 ecosystem.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/bounties" className="cyber-button">
                Start Hunting
              </Link>
              <Link
                href="/docs"
                className="px-6 py-3 border border-dark-200 rounded-lg font-semibold hover:border-primary-500/50 transition-all"
              >
                Read Documentation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-200/50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FiShield className="w-6 h-6 text-primary-500" />
                <span className="font-bold text-lg">Proof of Crime</span>
              </div>
              <p className="text-sm text-dark-600">
                Decentralized platform for Web3 security and crime tracking.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-dark-600">
                <li><Link href="/bounties" className="hover:text-primary-500">Bounties</Link></li>
                <li><Link href="/dashboard" className="hover:text-primary-500">Dashboard</Link></li>
                <li><Link href="/records" className="hover:text-primary-500">Records</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-dark-600">
                <li><Link href="/docs" className="hover:text-primary-500">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-primary-500">API</Link></li>
                <li><Link href="/blog" className="hover:text-primary-500">Blog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-dark-600">
                <li><Link href="/terms" className="hover:text-primary-500">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-primary-500">Privacy</Link></li>
                <li><Link href="/security" className="hover:text-primary-500">Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-dark-200/50 text-center text-sm text-dark-600">
            <p>&copy; 2025 Proof of Crime. Built for a safer Web3 ecosystem.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
