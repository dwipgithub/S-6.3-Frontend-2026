import React from "react";

import style from "./RL317.module.css";

import RL317Table from "./RL317SatuSehatTable";
import RL317Toolbar from "./RL317SatuSehatToolbar";

import { exportRL317ExcelSatuSehat, formatDate } from "../../utils/rl317.utils";

import { useRL317, useRL317Bootstrap } from "../../hooks/useRL317";
import { ToastContainer } from "react-toastify";
import SatuSehatCardRow from "./RL317SatuSehatCardRow";

const RL317SatuSehat = () => {
  const { axiosJWT, user, token, CSRFToken } = useRL317Bootstrap();

  const {
    dataRL,
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
    setTahun,
    fetchData,
    handleManualSync,
    MANUAL_SYNC_COOLDOWN,
  } = useRL317(axiosJWT, token, CSRFToken, user);

  const handleDownloadExcel = () => {
    exportRL317ExcelSatuSehat(dataRL);
  };

  return (
    <div
      className="container"
      style={{ marginTop: "0px", marginBottom: "70px" }}
    >
      <ToastContainer />

      <div className="row">
        <div className="col-md-12">
          <RL317Toolbar
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
                  Filtered By {filterLabel.join(", ")}
                </h5>
                {isFilterApplied && (
                  <span style={{ fontSize: 12, color: "gray" }}>
                    {sync.status === "success" && (
                      <span style={{ fontSize: 12, color: "gray" }}>
                        ✓ Diperbarui: {formatDate(sync.lastSync)} (
                        {sync.totalData} data)
                      </span>
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <RL317Table
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

export default RL317SatuSehat;
