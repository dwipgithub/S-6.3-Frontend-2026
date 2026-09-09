import { Spinner } from "react-bootstrap";
import { FaSyncAlt, FaCalendarAlt, FaSlidersH } from "react-icons/fa";
import { SiMicrosoftexcel } from "react-icons/si";

import style from "./RL310.module.css";
import { MONTHS } from "../../constants/date";

const RL310Toolbar = ({
  dataRL,
  bulan,
  setBulan,
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
    <div className={style.satusehatControlPanel}>
      {/* Heading */}
      <h5 className={style.satusehatPanelTitle}>Periode Data</h5>

      {/* Row: input + tombol */}
      <div className={style.satusehatControlRow}>
        {/* Bulan */}
        <div className={style.satusehatField}>
          <label htmlFor="bulan" className={style.satusehatLabel}>
            Bulan
          </label>
          <div className={style.satusehatInputWrap}>
            <FaCalendarAlt size={13} className={style.satusehatInputIcon} />
            <select
              id="bulan"
              name="bulan"
              className={style.satusehatSelect}
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
            >
              {MONTHS.map((value) => (
                <option key={value.value} value={value.value}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Tahun */}
        <div className={style.satusehatFieldSmall}>
          <label htmlFor="tahun" className={style.satusehatLabel}>
            Tahun
          </label>
          <div className={style.satusehatInputWrap}>
            <FaCalendarAlt size={13} className={style.satusehatInputIcon} />
            <input
              id="tahun"
              name="tahun"
              type="number"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className={style.satusehatInput}
            />
          </div>
        </div>

        {/* ── Tombol-tombol ── */}
        <div className={style.satusehatActionGroup}>
          {/* FILTER */}
          <div className={style.satusehatActionItem}>
            <button
              onClick={getRL}
              className={`${style.satusehatActionButton} ${style.satusehatFilterButton}`}
            >
              <FaSlidersH size={14} /> FILTER
            </button>
          </div>

          {/* SYNC SATUSEHAT */}
          <div className={style.satusehatActionItem}>
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
              className={`${style.satusehatActionButton} ${style.satusehatSyncButton}`}
              style={{
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
          <div className={style.satusehatActionItem}>
            <button
              onClick={handleDownloadExcel}
              disabled={dataRL?.length === 0}
              className={`${style.satusehatActionButton} ${style.satusehatExcelButton}`}
            >
              <SiMicrosoftexcel size={15} /> DOWNLOAD EXCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RL310Toolbar;
