import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom'
import { getUsuarioLogado, logout, type UsuarioLogado } from '../api/auth'
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
import ToastProvider from '../components/ui/ToastProvider'
import styles from './AppLayout.module.css'

const DESKTOP_QUERY = '(min-width: 901px)'

type CampeonatoItem = {
  label: string
  icon: ReactNode
  // seção da página do campeonato (id do elemento); sem secao, o item fica desativado
  secao?: string
}

const CAMPEONATO_ITEMS: CampeonatoItem[] = [
  { label: 'Times', icon: <UsersIcon />, secao: 'times' },
  { label: 'Partidas', icon: <CalendarIcon />, secao: 'partidas' },
  { label: 'Classificação', icon: <TableIcon />, secao: 'classificacao' },
]

function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  // id do campeonato aberto: os itens do grupo "Campeonato" só funcionam dentro dele
  const campeonatoAberto = useMatch('/campeonatos/:id')?.params.id

  function closeMenu(returnFocus = false) {
    setMenuOpen(false)
    if (returnFocus) {
      menuButtonRef.current?.focus()
    }
  }

  useEffect(() => {
    getUsuarioLogado()
      .then(setUsuario)
      .catch(() => {
      })
  }, [])

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

  async function handleLogout() {
    await logout().catch(() => {})
    navigate('/login')
  }

  return (
    <ToastProvider>
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
                  // dentro de um campeonato, se uma seção foi escolhida (#times), o destaque vai pra ela
                  className={({ isActive }) =>
                    isActive && !(campeonatoAberto && location.hash)
                      ? `${styles.navItem} ${styles.navItemActive}`
                      : styles.navItem
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
                  {campeonatoAberto && item.secao ? (
                    <Link
                      to={`/campeonatos/${campeonatoAberto}#${item.secao}`}
                      className={
                        location.hash === `#${item.secao}`
                          ? `${styles.navItem} ${styles.navItemActive}`
                          : styles.navItem
                      }
                      aria-current={location.hash === `#${item.secao}` ? 'location' : undefined}
                      onClick={() => closeMenu()}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={`${styles.navItem} ${styles.navItemDisabled}`}
                      title={item.secao ? 'Abra um campeonato primeiro' : 'Em breve'}
                    >
                      {item.icon}
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.sidebarFooter}>
            {usuario && (
              <div className={styles.user}>
                <span className={styles.userName}>{usuario.nome}</span>
                <span className={styles.userEmail}>{usuario.email}</span>
              </div>
            )}
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
    </ToastProvider>
  )
}

export default AppLayout
