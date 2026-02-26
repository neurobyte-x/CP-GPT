/**
 * Public landing page — hero, features, CTA.
 */

import { Link } from 'react-router-dom';
import {
  Route,
  Brain,
  BarChart3,
  Target,
  Zap,
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Route,
    title: 'Guided Practice Paths',
    description:
      'AI-generated sequences of problems that smoothly increase in difficulty, tailored to your skill level and target topics.',
  },
  {
    icon: Brain,
    title: 'AI Coaching',
    description:
      'Get progressive hints, not answers. Our Gemini-powered coach guides you through problems with a 5-level hint ladder.',
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    description:
      'Track your progress per topic, visualize your rating growth, identify weak areas, and measure your improvement over time.',
  },
  {
    icon: Target,
    title: 'Codeforces Integration',
    description:
      'Link your Codeforces handle to auto-exclude solved problems, sync your rating, and get personalized recommendations.',
  },
  {
    icon: Zap,
    title: 'Multiple Practice Modes',
    description:
      'Choose Learning mode for steady growth, Revision for reinforcement, or Challenge mode to push your limits.',
  },
  {
    icon: BookOpen,
    title: '10,000+ Problems',
    description:
      'Access the entire Codeforces problem database, organized by topics and difficulty, synced automatically.',
  },
];

const STATS = [
  { value: '10,000+', label: 'Problems Available' },
  { value: '40+', label: 'Topic Categories' },
  { value: '800–3500', label: 'Rating Range' },
  { value: '3', label: 'Practice Modes' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Route className="h-7 w-7 text-brand-600" />
            <span className="text-lg font-bold text-gray-900">CP Path Builder</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-purple-50" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
              <Zap className="h-4 w-4" />
              Powered by Codeforces + Gemini AI
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Master Competitive Programming,{' '}
              <span className="text-brand-600">One Path at a Time</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Stop randomly grinding problems. CP Path Builder transforms the Codeforces database
              into structured, progressive learning paths with AI coaching — so every problem you
              solve builds real skill.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700 transition-all hover:shadow-xl hover:shadow-brand-600/30"
              >
                Start Practicing Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-brand-600">{stat.value}</div>
                <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything You Need to Level Up
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              A complete practice platform designed for serious competitive programmers.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:border-brand-200 hover:shadow-lg hover:shadow-brand-600/5"
              >
                <div className="mb-4 inline-flex rounded-xl bg-brand-50 p-3 text-brand-600 group-hover:bg-brand-100 transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────── */}
      <section className="border-t border-gray-100 bg-gray-50 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Three simple steps to structured practice.
            </p>
          </div>

          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Choose Your Topics',
                description:
                  'Select the topics you want to practice — DP, graphs, number theory, or any combination. Set your rating range.',
              },
              {
                step: '2',
                title: 'Generate a Path',
                description:
                  'Our algorithm picks the best problems, orders them by difficulty, and creates a personalized practice sequence.',
              },
              {
                step: '3',
                title: 'Solve & Grow',
                description:
                  'Work through problems one by one. Get AI hints when stuck. Track your progress and watch your skills improve.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Coaching Highlight ──────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-sm font-medium text-purple-700">
                <Brain className="h-4 w-4" />
                AI-Powered
              </div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                A Coach, Not a Solver
              </h2>
              <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                Our AI coaching system uses a progressive hint ladder — starting with gentle nudges
                and only revealing full solutions at the deepest level, when you explicitly ask.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'Level 1: General approach direction',
                  'Level 2: Key algorithm or technique',
                  'Level 3: Detailed step-by-step hints',
                  'Level 4: Pseudocode with explanations',
                  'Level 5: Full solution (only if requested)',
                ].map((hint) => (
                  <li key={hint} className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    {hint}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-purple-50 p-8 lg:p-12">
              <div className="space-y-4">
                <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                  <p className="text-xs font-medium text-gray-400 mb-1">You</p>
                  <p className="text-sm text-gray-700">I'm stuck on this DP problem. Can you help?</p>
                </div>
                <div className="rounded-xl bg-brand-50 p-4 border border-brand-100">
                  <p className="text-xs font-medium text-brand-400 mb-1">AI Coach (Level 1)</p>
                  <p className="text-sm text-brand-800">
                    Think about what subproblems you can define. What state do you need to track?
                    Consider how the answer for a larger input relates to smaller inputs.
                  </p>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                  <p className="text-xs font-medium text-gray-400 mb-1">You</p>
                  <p className="text-sm text-gray-700">I think it's something with intervals, but I need more help.</p>
                </div>
                <div className="rounded-xl bg-brand-50 p-4 border border-brand-100">
                  <p className="text-xs font-medium text-brand-400 mb-1">AI Coach (Level 2)</p>
                  <p className="text-sm text-brand-800">
                    You're on the right track! This is an interval DP problem. Try defining dp[i][j]
                    as the answer for the subarray from index i to j...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="border-t border-gray-100 bg-gradient-to-br from-brand-600 to-brand-800 py-20 lg:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Stop Grinding Randomly?
          </h2>
          <p className="mt-4 text-lg text-brand-100">
            Join and start building structured practice paths today. It's free.
          </p>
          <div className="mt-10">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-brand-700 shadow-lg hover:bg-gray-50 transition-colors"
            >
              Create Free Account
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Route className="h-5 w-5 text-brand-600" />
              <span className="text-sm font-semibold text-gray-900">CP Path Builder</span>
            </div>
            <p className="text-sm text-gray-400">
              Built for competitive programmers. Problems sourced from Codeforces.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
