import React from "react";
import { FaSyncAlt } from "react-icons/fa";
import { Spinner } from "react-bootstrap"; // Sesuaikan jika kamu pakai komponen Spinner lain

const SyncButton = ({
  canSync,
  isSyncing,
  isFilterApplied,
  cooldownDisplay,
  onSync,
  customTitle,
}) => {
  // Menentukan status disabled
  const isDisabled = !canSync || isSyncing || !isFilterApplied;

  // Tooltip bawaan jika tidak kustom
  const defaultTitle = !isFilterApplied
    ? "Terapkan filter terlebih dahulu"
    : isSyncing
      ? "Sedang sinkronisasi..."
      : !canSync
        ? "Dalam cooldown..."
        : "Klik untuk sync manual";

  return (
    <button
      onClick={onSync}
      disabled={isDisabled}
      title={customTitle || defaultTitle}
      style={{
        background: "#059669",
        color: "#fff",
        border: "none",
        borderRadius: 7,
        padding: "6px 18px",
        fontWeight: 700,
        fontSize: 13,
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: !isDisabled ? "pointer" : "not-allowed",
        opacity: !isDisabled ? 1 : 0.55,
        transition: "all 0.2s ease",
        minHeight: 42,
      }}
    >
      {isSyncing ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Spinner animation="border" size="sm" /> Syncing...
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            lineHeight: 1.2,
          }}
        >
          <FaSyncAlt size={13} />
          {cooldownDisplay ? (
            <span>
              SYNC <span>{cooldownDisplay}</span>
            </span>
          ) : (
            <span>SYNC SATUSEHAT</span>
          )}
        </div>
      )}
    </button>
  );
};

export default SyncButton;
