'use client'
import styles from './BranchPill.module.css'

interface Props {
  loading: boolean
  name?: string
  onClear: () => void
}

export default function BranchPill({ loading, name, onClear }: Props) {
  return (
    <div className={styles.pill} data-loading={loading}>
      {loading ? (
        <span key="loading" className={`${styles.face} ${styles.loadingLabel}`}>
          <span className={styles.dots} aria-hidden="true">
            <span /><span /><span />
          </span>
          Memuat cabang
        </span>
      ) : (
        <span key="loaded" className={styles.face}>
          <span className={styles.pin} aria-hidden="true">📍</span>
          <span className={styles.name}>{name}</span>
          <button
            type="button"
            onClick={onClear}
            aria-label="Hapus cabang aktif"
            className={styles.clearBtn}
          >
            ×
          </button>
        </span>
      )}
    </div>
  )
}
