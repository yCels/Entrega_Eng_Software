import { useEffect, useRef, useState } from 'react'
import { MoreIcon } from './Icons'
import styles from './ActionMenu.module.css'

type ActionMenuItem = {
  label: string
  onSelect: () => void
  danger?: boolean
}

type ActionMenuProps = {
  label: string
  items: ActionMenuItem[]
  disabled?: boolean
}

function ActionMenu({ label, items, disabled = false }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function handleScroll() {
      setOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open])

  function toggle() {
    // o menu é fixed pra não ser cortado pela tabela, por isso a posição vai por variável css
    const wrapper = wrapperRef.current
    if (!open && wrapper) {
      const rect = wrapper.getBoundingClientRect()
      wrapper.style.setProperty('--menu-top', `${rect.bottom + 4}px`)
      wrapper.style.setProperty('--menu-right', `${window.innerWidth - rect.right}px`)
    }
    setOpen(!open)
  }

  function handleSelect(item: ActionMenuItem) {
    setOpen(false)
    item.onSelect()
  }

  return (
    // sem isso o clique no menu também abria o campeonato da linha
    <div ref={wrapperRef} className={styles.wrapper} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={label}
        aria-expanded={open}
        disabled={disabled}
        onClick={toggle}
      >
        <MoreIcon />
      </button>

      {open && (
        <div className={styles.menu}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className={item.danger ? `${styles.item} ${styles.danger}` : styles.item}
              onClick={() => handleSelect(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ActionMenu
