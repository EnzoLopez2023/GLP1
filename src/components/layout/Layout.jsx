import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Syringe, Droplets, Scale, User, LogOut,
} from 'lucide-react'
import { useMsal } from '@azure/msal-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

// Primary tab bar — five items, mobile-first.
const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Today'   },
  { to: '/medication', icon: Syringe,         label: 'Meds'    },
  { to: '/glucose',    icon: Droplets,        label: 'Glucose' },
  { to: '/progress',   icon: Scale,           label: 'Weight'  },
  { to: '/settings',   icon: User,            label: 'You'     },
]

// Header titles for every route, including those reached via the You hub.
// Falls back to "Tare" if no match.
const ROUTE_LABELS = [
  ['/medication',  'Meds'        ],
  ['/glucose',     'Glucose'     ],
  ['/nutrition',   'Nutrition'   ],
  ['/progress',    'Weight'      ],
  ['/sideeffects', 'Side Effects'],
  ['/wellbeing',   'Well-being'  ],
  ['/insights',    'Insights'    ],
  ['/reports',     'Reports'     ],
  ['/knowledge',   'Learn'       ],
  ['/settings',    'You'         ],
  ['/',            'Today'       ],
]

export default function Layout({ children }) {
  const location = useLocation()
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  const displayName = account?.name ?? account?.username ?? 'Account'
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('') || '?'

  const handleSignOut = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin })
  }

  // Resolve the current label by longest-prefix match (so /settings matches
  // exactly while /settings/foo would also match → "You").
  const currentLabel =
    ROUTE_LABELS.find(([prefix]) =>
      prefix === '/' ? location.pathname === '/' : location.pathname.startsWith(prefix)
    )?.[1] ?? 'Tare'

  return (
    <div className="flex flex-col h-screen bg-wood-50 font-sans text-wood-900">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="bg-wood-50/95 backdrop-blur-sm border-b border-wood-200/60 px-4 py-3.5 flex items-center justify-between shrink-0 z-20">
        <AnimatePresence mode="wait">
          <motion.h1
            key={currentLabel}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="display text-base font-semibold text-wood-900"
          >
            {currentLabel}
          </motion.h1>
        </AnimatePresence>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-wood-100 border border-wood-200/60">
            <div className="w-6 h-6 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
              {initials}
            </div>
            <span className="text-xs font-medium text-wood-800 max-w-[140px] truncate">
              {displayName}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-2 rounded-lg text-wood-600 hover:bg-wood-100 hover:text-wood-900 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-2xl mx-auto px-4 py-5">
          {children}
        </div>
      </main>

      {/* ── Bottom tab bar (always visible) ──────────────────────────────── */}
      <nav className="fixed bottom-3 inset-x-3 mx-auto max-w-md bg-wood-50/95 backdrop-blur-md border border-wood-200/60 rounded-full shadow-tile z-40">
        <div className="grid grid-cols-5 h-14 px-2">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-x-1 inset-y-1 bg-wood-100 rounded-full -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon
                    size={18}
                    className={clsx(
                      'transition-colors',
                      isActive ? 'text-brand-700' : 'text-wood-500',
                    )}
                  />
                  <span className={clsx(
                    'relative transition-colors',
                    isActive ? 'text-brand-700' : 'text-wood-500',
                  )}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
