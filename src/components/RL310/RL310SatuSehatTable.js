import { Spinner } from "react-bootstrap";

import style from "./RL310.module.css";

const RL310SatuSehatTable = ({
  isFilterApplied,
  loadingTable,
  dataRL,
  sync,
  totalPages,
  page,
  fetchData,
}) => {
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
      <td colSpan={6}>
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
                  <tr className={style.headerRow1}>
                    <th
                      className={style["sticky-header-view"]}
                      style={{ width: "4%", verticalAlign: "middle" }}
                      rowSpan={3}
                    >
                      No.
                    </th>
                    <th
                      className={style["sticky-header-view"]}
                      style={{
                        width: "20%",
                        verticalAlign: "middle",
                        textAlign: "center",
                      }}
                      rowSpan={3}
                    >
                      Jenis Spesialisasi
                    </th>
                    <th colSpan={8} style={{ textAlign: "center" }}>
                      Rujukan Masuk
                    </th>
                    <th
                      colSpan={4}
                      rowSpan={2}
                      style={{
                        verticalAlign: "middle",
                        textAlign: "center",
                      }}
                    >
                      Dirujuk Keluar
                    </th>
                  </tr>
                  <tr className={style.headerRow2}>
                    <th colSpan={4}>Diterima Dari</th>
                    <th colSpan={4}>Dikembalikan Ke</th>
                  </tr>
                  <tr className={style.headerRow3}>
                    <th>Puskesmas</th>
                    <th>RS Lain</th>
                    <th>Faskes Lain</th>
                    <th>Total Rujukan Masuk</th>
                    <th>Puskesmas</th>
                    <th>RS Asal</th>
                    <th>Faskes Lain</th>
                    <th>Total Rujukan Masuk Dikembalikan</th>
                    <th>Pasien Rujukan</th>
                    <th>Pasien Datang Sendiri</th>
                    <th>Total Dirujuk Keluar</th>
                    <th>Diterima Kembali</th>
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

                            <td style={{ textAlign: "left" }}>
                              {item.jenis_spesialisasi?.nama ?? "-"}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {item.rm_diterima_puskesmas}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {item.rm_diterima_rs}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {item.rm_diterima_faskes_lain}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {item.rm_diterima_total_rm}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {item.rm_dikembalikan_puskesmas}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {item.rm_dikembalikan_rs}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {item.rm_dikembalikan_faskes_lain}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {item.rm_dikembalikan_total_rm}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {item.keluar_pasien_rujukan}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {item.keluar_pasien_datang_sendiri}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {item.keluar_total_keluar}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {item.keluar_diterima_kembali}
                            </td>
                          </tr>
                        ))}
                      </>
                    )
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

export default RL310SatuSehatTable;
