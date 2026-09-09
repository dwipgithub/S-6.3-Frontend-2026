import { Spinner } from "react-bootstrap";

import style from "./RL312.module.css";

import { calculateTotals } from "../../utils/rl312.utils";

const RL312SatuSehatTable = ({
  isFilterApplied,
  loadingTable,
  dataRL,
  sync,
  totalPages,
  page,
  fetchData,
}) => {
  const sub_total = calculateTotals(dataRL);

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
      <td colSpan={7}>
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
                    >
                      Jenis Spesialisasi
                    </th>
                    <th style={{ textAlign: "center" }}>Khusus</th>
                    <th style={{ textAlign: "center" }}>Besar</th>
                    <th style={{ textAlign: "center" }}>Sedang</th>
                    <th style={{ textAlign: "center" }}>Kecil</th>
                    <th style={{ textAlign: "center" }}>Total</th>
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
                              {item.jenis_spesialisasi?.nama_spesialisasi ??
                                "-"}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {item.khusus}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {item.besar}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {item.sedang}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {item.kecil}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {item.total}
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
                            {sub_total.khusus}
                          </td>
                          <td
                            style={{ textAlign: "center", fontWeight: "bold" }}
                          >
                            {sub_total.besar}
                          </td>
                          <td
                            style={{ textAlign: "center", fontWeight: "bold" }}
                          >
                            {sub_total.sedang}
                          </td>
                          <td
                            style={{ textAlign: "center", fontWeight: "bold" }}
                          >
                            {sub_total.kecil}
                          </td>
                          <td
                            style={{ textAlign: "center", fontWeight: "bold" }}
                          >
                            {sub_total.total}
                          </td>
                        </tr>
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

export default RL312SatuSehatTable;
