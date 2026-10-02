import React from "react";
import { Spinner } from "react-bootstrap";

import style from "./RL311.module.css";

import { calculateTotals } from "../../utils/rl311.utils";

const RL311SatuSehatTable = ({
  isFilterApplied,
  loadingTable,
  dataRL,
  sync,
  totalPages,
  page,
  fetchData,
}) => {
  const totals = calculateTotals(dataRL);

  const FullLoading = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        minHeight: "350px",
        textAlign: "center",
        gap: 16,
      }}
    >
      <Spinner animation="border" variant="primary" />
      <p style={{ margin: 0 }}>
        Sedang mengambil data dari SatuSehat, mohon tunggu...
      </p>
    </div>
  );

  // Komponen loading di dalam tabel
  const TableLoading = () => (
    <tr>
      <td colSpan={4}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "250px",
            gap: 16,
            textAlign: "center",
          }}
        >
          <Spinner animation="border" variant="primary" />
          <p
            style={{
              margin: 0,
              color: "#555",
              fontSize: 14,
            }}
          >
            Sedang mengambil data dari SatuSehat, mohon tunggu...
          </p>
        </div>
      </td>
    </tr>
  );

  return (
    <>
      {/* Konten utama */}
      <div
        className={style["outer-wrapper"]}
        style={{ width: "100%", overflowX: "auto" }}
      >
        <div className={style["inner-content"]}>
          {!isFilterApplied ? (
            <div className={style.satuSehatFilterNotApplied}>
              <strong>Silakan pilih filter terlebih dahulu.</strong>
            </div>
          ) : loadingTable && dataRL.length === 0 ? (
            <FullLoading />
          ) : !loadingTable &&
            dataRL.length === 0 &&
            sync.status === "success" ? (
            <div className={style.satuSehatFilteredSyncSuccessNoData}>
              <strong>
                Data tidak ditemukan di SatuSehat untuk periode ini.
              </strong>
            </div>
          ) : !loadingTable &&
            dataRL.length === 0 &&
            sync.status === "failed" ? (
            <div className={style.satuSehatFilteredSyncFailed}>
              <strong>
                Gagal mengambil data dari SatuSehat. Coba filter ulang.
              </strong>
            </div>
          ) : (
            <div className={style["table-container"]}>
              <table className={style["table"]}>
                <thead className={style["thead"]}>
                  <tr className="main-header-row">
                    <th style={{ width: "5%" }}>No</th>
                    <th>Jenis Kegiatan</th>
                    <th style={{ width: "45%", textAlign: "center" }}>
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTable ? (
                    <TableLoading />
                  ) : (
                    <>
                      {dataRL.map((item, index) => (
                        <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td style={{ textAlign: "left" }}>
                            {item.rl_tiga_titik_sebelas_jenis_kegiatan
                              ?.nama_jenis_kegiatan ?? "-"}
                          </td>
                          <td style={{ textAlign: "center" }}>{item.jumlah}</td>
                        </tr>
                      ))}

                      <tr>
                        <td
                          colSpan={2}
                          style={{ textAlign: "center", fontWeight: "bold" }}
                        >
                          Total
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "bold" }}>
                          {totals.jumlah}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RL311SatuSehatTable;
