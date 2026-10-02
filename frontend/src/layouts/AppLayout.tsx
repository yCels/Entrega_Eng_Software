import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearToken } from '../api/auth'
import Brand from '../components/ui/Brand'
import {
  CalendarIcon,
  CloseIcon,
  LogOutIcon,
  MenuIcon,
  TableIcon,
  TrophyIcon,
  UsersIcon,
} from '../components/ui/Icons'
import ThemeToggle from '../components/ui/ThemeToggle'
import styles from './AppLayout.module.css'

const DESKTOP_QUERY = '(min-width: 901px)'

type DisabledItem = { label: string; icon: ReactNode }

const CAMPEONATO_ITEMS: DisabledItem[] = [
  { label: 'Times', icon: <UsersIcon /> },
  { label: 'Partidas', icon: <CalendarIcon /> },
  { label: 'Classificação', icon: <TableIcon /> },
]

function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()

  function closeMenu(returnFocus = false) {
    setMenuOpen(false)
    if (returnFocus) {
      menuButtonRef.current?.focus()
    }
  }

  useEffect(() => {
    if (!menuOpen) return

    // joga o foco pro menu pra quem navega pelo teclado
    sidebarRef.current?.querySelector('a')?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeMenu(true)
    }

    // se a tela crescer com o menu aberto, fecha pra página não ficar travada
    const desktop = window.matchMedia(DESKTOP_QUERY)
    function handleViewportChange() {
      if (desktop.matches) setMenuOpen(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    desktop.addEventListener('change', handleViewportChange)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
      desktop.removeEventListener('change', handleViewportChange)
    }
  }, [menuOpen])

  function handleLogout() {
    clearToken()
    navigate('/login')
  }

  return (
    <div className={styles.shell}>
      <header className={styles.mobileBar} inert={menuOpen || undefined}>
        <button
          ref={menuButtonRef}
          type="button"
          className={styles.iconButton}
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu"
        >
          <MenuIcon size={18} />
        </button>
        <Link to="/campeonatos" className={styles.brandLink}>
          <Brand />
        </Link>
      </header>

      {menuOpen && <div className={styles.overlay} onClick={() => closeMenu(true)} />}

      <aside ref={sidebarRef} className={styles.sidebar} data-open={menuOpen}>
        <div className={styles.sidebarHeader}>
          <Link to="/campeonatos" className={styles.brandLink} onClick={() => closeMenu()}>
            <Brand />
          </Link>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.closeButton}`}
            onClick={() => closeMenu(true)}
            aria-label="Fechar menu"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li>
              <NavLink
                to="/campeonatos"
                className={({ isActive }) =>
                  isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
                }
                onClick={() => closeMenu()}
              >
                <TrophyIcon />
                Campeonatos
              </NavLink>
            </li>
          </ul>

          <p className={styles.navGroupLabel}>Campeonato</p>
          <ul className={styles.navList}>
            {CAMPEONATO_ITEMS.map((item) => (
              <li key={item.label}>
                <span className={`${styles.navItem} ${styles.navItemDisabled}`}>
                  {item.icon}
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.sidebarFooter}>
          <ThemeToggle withLabel />
          <button type="button" className={styles.footerButton} onClick={handleLogout}>
            <LogOutIcon />
            Sair
          </button>
        </div>
      </aside>

      <main className={styles.main} inert={menuOpen || undefined}>
        <div className={styles.container}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AppLayout
