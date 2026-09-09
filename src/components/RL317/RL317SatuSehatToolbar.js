import { Spinner } from "react-bootstrap";
import { FaSyncAlt, FaCalendarAlt, FaSlidersH } from "react-icons/fa";
import { SiMicrosoftexcel } from "react-icons/si";

const RL317Toolbar = ({
  tahun,
  setTahun,
  handleManualSync,
  getRL,
  handleDownloadExcel,
  canSync,
  isManualSyncing,
  isFilterApplied,
  cooldownLeft,
  sync,
}) => {
  return (
    <div
      style={{
        background: "var(--color-background-primary, #fff)",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "16px 20px",
        marginBottom: 14,
      }}
    >
      {/* Heading */}
      <p
        style={{
          fontWeight: 700,
          fontSize: 13,
          color: "#1e293b",
          margin: "0 0 14px 0",
          letterSpacing: 0.2,
        }}
      >
        Periode Data
      </p>

      {/* Row: input + tombol */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Tahun */}
        <div>
          <label
            style={{
              fontSize: 12,
              color: "#64748b",
              display: "block",
              marginBottom: 5,
              fontWeight: 500,
            }}
          >
            Tahun
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #cbd5e1",
              borderRadius: 7,
              padding: "7px 10px",
              background: "#f8fafc",
              width: 125,
            }}
          >
            <FaCalendarAlt
              size={13}
              color="#94a3b8"
              style={{ marginRight: 7, flexShrink: 0 }}
            />
            <input
              type="number"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                width: "100%",
                fontSize: 13,
                color: "#334155",
              }}
            />
          </div>
        </div>

        {/* ── Tombol-tombol ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {/* FILTER */}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={getRL}
              style={{
                background: "#1d4ed8",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                padding: "9px 18px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 7,
                whiteSpace: "nowrap",
              }}
            >
              <FaSlidersH size={14} /> FILTER
            </button>
          </div>

          {/* SYNC SATUSEHAT */}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleManualSync}
              disabled={!canSync || isManualSyncing || !isFilterApplied}
              title={
                !isFilterApplied
                  ? "Terapkan filter terlebih dahulu"
                  : isManualSyncing || sync.isUpdating
                    ? "Sedang sinkronisasi..."
                    : !canSync
                      ? `Tunggu ${cooldownLeft} menit lagi`
                      : "Klik untuk sync manual"
              }
              style={{
                background: "#059669",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                padding: "9px 18px",
                fontWeight: 700,
                fontSize: 13,
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 7,
                cursor:
                  canSync && !isManualSyncing && isFilterApplied
                    ? "pointer"
                    : "not-allowed",
                opacity:
                  canSync && !isManualSyncing && isFilterApplied ? 1 : 0.55,
              }}
            >
              {isManualSyncing || sync.isUpdating ? (
                <>
                  <Spinner animation="border" size="sm" /> Syncing...
                </>
              ) : (
                <>
                  <FaSyncAlt size={14} /> SYNC SATUSEHAT
                </>
              )}
            </button>
          </div>

          {/* DOWNLOAD EXCEL */}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleDownloadExcel}
              // disabled={dataRL?.length === 0}
              style={{
                background: "#059669",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                padding: "9px 18px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 7,
                whiteSpace: "nowrap",
              }}
            >
              <SiMicrosoftexcel size={15} /> DOWNLOAD EXCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RL317Toolbar;
