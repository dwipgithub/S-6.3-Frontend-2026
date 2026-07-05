import React from "react";
import { Spinner } from "react-bootstrap";

import style from "./RL317.module.css";

import { calculateTotals } from "../../utils/rl317.utils";

const RL317Table = ({
  isFilterApplied,
  loadingTable,
  dataRL,
  sync,
  totalPages,
  page,
  fetchData,
}) => {
  const totals = calculateTotals(dataRL);

  // Komponen loading di dalam tabel
  const TableLoading = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 0",
        gap: 16,
      }}
    >
      <Spinner animation="border" variant="primary" />
      <p style={{ margin: 0, color: "#555", fontSize: 14 }}>
        Sedang mengambil data dari SatuSehat, mohon tunggu...
      </p>
    </div>
  );

  return (
    <>
      {/* Konten utama */}
      {!isFilterApplied ? (
        <div
          style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #ffc107",
            color: "#856404",
            padding: 15,
            borderRadius: 4,
            textAlign: "center",
          }}
        >
          <strong>Silakan pilih filter terlebih dahulu.</strong>
        </div>
      ) : loadingTable && dataRL.length === 0 ? (
        <TableLoading />
      ) : !loadingTable && dataRL.length === 0 && sync.status === "success" ? (
        <div
          style={{
            backgroundColor: "#d1ecf1",
            border: "1px solid #bee5eb",
            color: "#0c5460",
            padding: 15,
            borderRadius: 4,
            textAlign: "center",
          }}
        >
          <strong>Data tidak ditemukan di SatuSehat untuk periode ini.</strong>
        </div>
      ) : !loadingTable && dataRL.length === 0 && sync.status === "failed" ? (
        <div
          style={{
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            color: "#721c24",
            padding: 15,
            borderRadius: 4,
            textAlign: "center",
          }}
        >
          <strong>
            Gagal mengambil data dari SatuSehat. Coba filter ulang.
          </strong>
        </div>
      ) : (
        <div
          className={style["outer-wrapper"]}
          style={{ width: "100%", overflowX: "auto" }}
        >
          <div className={style["inner-content"]}>
            <div className={style["table-container"]}>
              <table className={style["table"]}>
                <thead className={style["thead"]}>
                  <tr className="main-header-row">
                    <th style={{ width: "5%" }}>No</th>
                    <th>Golongan Obat</th>
                    <th style={{ width: "25%", textAlign: "center" }}>
                      Jumlah Item Obat
                    </th>
                    <th style={{ width: "30%", textAlign: "center" }}>
                      Jumlah Item Obat yang Tersedia di Rumah Sakit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTable ? (
                    <TableLoading />
                  ) : (
                    dataRL.length > 0 && (
                      <>
                        {dataRL.map((item, index) => (
                          <tr key={item.id}>
                            <td>{index + 1}</td>

                            <td>
                              {item.rl_tiga_titik_tujuh_belas_golongan_obat
                                ?.nama ?? "-"}
                            </td>

                            <td style={{ textAlign: "center" }}>
                              {item.jumlah_item_obat}
                            </td>

                            <td style={{ textAlign: "center" }}>
                              {item.jumlah_item_obat_rs}
                            </td>
                          </tr>
                        ))}

                        <tr>
                          <td
                            colSpan={2}
                            style={{ textAlign: "center", fontWeight: "bold" }}
                          >
                            Total
                          </td>
                          <td
                            style={{ textAlign: "center", fontWeight: "bold" }}
                          >
                            {totals.jumlahItemObat}
                          </td>
                          <td
                            style={{ textAlign: "center", fontWeight: "bold" }}
                          >
                            {totals.jumlahItemObatRs}
                          </td>
                        </tr>
                      </>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  padding: "12px 0",
                  display: "flex",
                  justifyContent: "center",
                  gap: 12,
                  borderTop: "1px solid #ddd",
                }}
              >
                <button
                  disabled={page === 1}
                  onClick={() => fetchData(page - 1)}
                >
                  ◀ Prev
                </button>
                <span>
                  Halaman {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => fetchData(page + 1)}
                >
                  Next ▶
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default RL317Table;
