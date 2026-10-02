import { ToastContainer } from "react-toastify";

import style from "./RL311.module.css";

import RL311Toolbar from "./RL311SatuSehatToolbar";
import SatuSehatCardRow from "./RL311SatuSehatCardRow";
import RL311SatuSehatTable from "./RL311SatuSehatTable";

import { useRL311, useRL311Bootstrap } from "../../hooks/useRL311";
import { exportRL311ExcelSatuSehat } from "../../utils/rl311.utils";

const RL311SatuSehat = () => {
  const { axiosJWT, user, token, CSRFToken } = useRL311Bootstrap();

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
  } = useRL311(axiosJWT, token, CSRFToken, user);

  const handleDownloadExcel = () => {
    exportRL311ExcelSatuSehat(dataRL, tahun);
  };

  return (
    <div
      className="container"
      style={{ marginTop: "0px", marginBottom: "70px" }}
    >
      <ToastContainer />

      <div className="row">
        <div className="col-md-12">
          <RL311Toolbar
            dataRL={dataRL}
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
        <RL311SatuSehatTable
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

export default RL311SatuSehat;
