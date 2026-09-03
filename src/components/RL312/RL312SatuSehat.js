import { ToastContainer } from "react-toastify";

import style from "./RL312.module.css";

import RL312Toolbar from "./RL312SatuSehatToolbar";
import SatuSehatCardRow from "./RL312SatuSehatCardRow";
import RL312SatuSehatTable from "./RL312SatuSehatTable";

import { MONTHS } from "../../constants/date";
import { useRL312, useRL312Bootstrap } from "../../hooks/useRL312";
import { exportRL312ExcelSatuSehat } from "../../utils/rl312.utils";
import { useState } from "react";

const RL312SatuSehat = () => {
  const { axiosJWT, user, token, CSRFToken } = useRL312Bootstrap();

  const {
    dataRL,
    bulan,
    tahun,
    loadingTable,
    filterLabel,
    isFilterApplied,
    sync,
    canSync,
    isManualSyncing,
    cooldownLeft,
    page,
    totalPages,
    getRL,
    setBulan,
    setTahun,
    fetchData,
    handleManualSync,
    MANUAL_SYNC_COOLDOWN,
  } = useRL312(axiosJWT, token, CSRFToken, user);

  const handleDownloadExcel = () => {
    const monthLabel =
      MONTHS.find((m) => m.value === String(bulan))?.label ?? bulan;
    exportRL312ExcelSatuSehat(dataRL, `${monthLabel}-${tahun}`);
  };

  return (
    <div
      className="container"
      style={{ marginTop: "0px", marginBottom: "70px" }}
    >
      <ToastContainer />

      <div className="row">
        <div className="col-md-12">
          <RL312Toolbar
            dataRL={dataRL}
            bulan={bulan}
            setBulan={setBulan}
            tahun={tahun}
            setTahun={setTahun}
            handleManualSync={handleManualSync}
            getRL={getRL}
            handleDownloadExcel={handleDownloadExcel}
            canSync={canSync}
            isManualSyncing={isManualSyncing}
            isFilterApplied={isFilterApplied}
            cooldownLeft={cooldownLeft}
            sync={sync}
          />

          <SatuSehatCardRow
            sync={sync}
            manualSyncCooldown={MANUAL_SYNC_COOLDOWN}
          />
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          {/* Filter label + status sync */}
          <div className={style.filterLabel}>
            {filterLabel.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h5 style={{ fontSize: "14px", margin: 0 }}>
                  Filtered By {filterLabel}
                </h5>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <RL312SatuSehatTable
          isFilterApplied={isFilterApplied}
          loadingTable={loadingTable}
          dataRL={dataRL}
          sync={sync}
          totalPages={totalPages}
          page={page}
          fetchData={fetchData}
        />
      </div>
    </div>
  );
};

export default RL312SatuSehat;
