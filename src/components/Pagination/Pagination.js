import React from "react";

/**
 * Pagination
 *
 * Props:
 * - page: halaman aktif saat ini (1-based)
 * - totalPages: total jumlah halaman
 * - onPageChange: (page) => void — dipanggil saat user pindah halaman
 * - siblingCount: berapa nomor di kiri/kanan halaman aktif yang ditampilkan (default 1)
 */
export default function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
}) {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(page, totalPages, siblingCount);

  const goTo = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    onPageChange(p);
  };

  return (
    <nav aria-label="Navigasi halaman" style={styles.wrapper}>
      <div style={styles.info}>
        Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong>
      </div>

      <div style={styles.controls}>
        <PageButton
          label="«"
          title="Halaman pertama"
          disabled={page === 1}
          onClick={() => goTo(1)}
        />
        <PageButton
          label="‹"
          title="Sebelumnya"
          disabled={page === 1}
          onClick={() => goTo(page - 1)}
        />

        {pageNumbers.map((p, idx) =>
          p === "..." ? (
            <span key={`dots-${idx}`} style={styles.dots}>
              …
            </span>
          ) : (
            <PageButton
              key={p}
              label={p}
              active={p === page}
              onClick={() => goTo(p)}
            />
          ),
        )}

        <PageButton
          label="›"
          title="Berikutnya"
          disabled={page === totalPages}
          onClick={() => goTo(page + 1)}
        />
        <PageButton
          label="»"
          title="Halaman terakhir"
          disabled={page === totalPages}
          onClick={() => goTo(totalPages)}
        />
      </div>
    </nav>
  );
}

function PageButton({ label, onClick, disabled, active, title }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      style={{
        ...styles.btn,
        ...(active ? styles.btnActive : {}),
        ...(disabled ? styles.btnDisabled : {}),
      }}
      onMouseEnter={(e) => {
        if (!disabled && !active) e.currentTarget.style.background = "#f1f3f5";
      }}
      onMouseLeave={(e) => {
        if (!disabled && !active) e.currentTarget.style.background = "#fff";
      }}
    >
      {label}
    </button>
  );
}

/**
 * Menghasilkan array nomor halaman + separator "..." untuk ditampilkan.
 * Contoh (page=7, totalPages=20, siblingCount=1):
 * [1, "...", 6, 7, 8, "...", 20]
 */
function getPageNumbers(page, totalPages, siblingCount) {
  const totalNumbers = siblingCount * 2 + 5; // first + last + current + 2*dots + siblings
  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(page - siblingCount, 1);
  const rightSibling = Math.min(page + siblingCount, totalPages);

  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < totalPages - 1;

  const pages = [1];

  if (showLeftDots) pages.push("...");
  for (let i = leftSibling; i <= rightSibling; i++) {
    if (i !== 1 && i !== totalPages) pages.push(i);
  }
  if (showRightDots) pages.push("...");

  pages.push(totalPages);

  return pages;
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "16px 0",
    borderTop: "1px solid #e5e7eb",
  },
  info: {
    fontSize: 13,
    color: "#6b7280",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  btn: {
    minWidth: 34,
    height: 34,
    padding: "0 8px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    fontSize: 14,
    cursor: "pointer",
    transition: "background 0.15s, border-color 0.15s, color 0.15s",
  },
  btnActive: {
    background: "#2563eb",
    borderColor: "#2563eb",
    color: "#fff",
    fontWeight: 600,
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  dots: {
    minWidth: 24,
    textAlign: "center",
    color: "#9ca3af",
    userSelect: "none",
  },
};
