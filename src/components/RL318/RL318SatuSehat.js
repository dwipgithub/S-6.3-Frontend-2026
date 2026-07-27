import React from "react";
import { ToastContainer } from "react-toastify";

import style from "./RL318.module.css";

import { useRL318, useRL318Bootstrap } from "../../hooks/useRL318";
import { formatDate } from "../../utils/rl317.utils";
import { exportRL318ExcelSatuSehat } from "../../utils/rl318.utils";

import RL318Table from "./RL318SatuSehatTable";
import RL318Toolbar from "./RL318SatuSehatToolbar";
import SatuSehatCardRow from "./RL318SatuSehatCardRow";

const RL318SatuSehat = () => {
  const { axiosJWT, user, token, CSRFToken } = useRL318Bootstrap();

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
  } = useRL318(axiosJWT, token, CSRFToken, user);

  const handleDownloadExcel = () => {
    exportRL318ExcelSatuSehat(dataRL);
  };

  return (
    <div
      className="container"
      style={{ marginTop: "0px", marginBottom: "70px" }}
    >
      <ToastContainer />

      <div className="row">
        <div className="col-md-12">
          <RL318Toolbar
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
        <RL318Table
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

export default RL318SatuSehat;
