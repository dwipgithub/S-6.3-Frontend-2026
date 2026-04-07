import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";
import style from "./FormTambahRL31.module.css"; // sesuaikan kalau path berbeda
import { HiSaveAs, HiSearch } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const RL31 = () => {
  const [bulan, setBulan] = useState("1");
  const [tahun, setTahun] = useState("");
  const [bulanAll, setBulanAll] = useState(false);
  const [filterLabel, setFilterLabel] = useState([]);

  const [daftarBulan, setDaftarBulan] = useState([]);
  const [provinsiValue, setProvinsiValue] = useState("0");
  const [kabKotaValue, setKabKotaValue] = useState("0");
  const [rumahSakitValue, setRumahSakitValue] = useState("0");

  const [rumahSakit, setRumahSakit] = useState(null); // null / "all" / object RS
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState(0);
  const [user, setUser] = useState({});
  const [statusValidasi, setStatusValidasi] = useState(0);
  const [keteranganValidasi, setKeteranganValidasi] = useState("");
  const [validasiId, setValidasiId] = useState(null);
  const [dataValidasi, setDataValidasi] = useState(null);
  const [activeTab, setActiveTab] = useState("tab1");
  const [show, setShow] = useState(false);

  const [aveBOR, setAveBor] = useState(0);
  const [aveALOS, setAveLos] = useState(0);
  const [aveBTO, setAveBto] = useState(0);
  const [aveTOI, setAveToi] = useState(0);
  const [aveNDR, setAveNdr] = useState(0);
  const [aveGDR, setAveGdr] = useState(0);

  const { CSRFToken } = useCSRFTokenContext();
  const navigate = useNavigate();

  useEffect(() => {
    refreshToken();
    initBulanTahun();
  }, []);

  // Load validasi data secara realtime saat bulan/tahun/rumahSakit berubah
  useEffect(() => {
    if (activeTab === "tab2" && rumahSakit && rumahSakit !== "all" && rumahSakit.id && bulan !== "all" && tahun) {
      getValidasi();
    }
  }, [bulan, tahun, rumahSakit, activeTab]);

  useEffect(() => {
    if (user.jenisUserId && user.jenisUserId !== 2) {
      if (dataRL.length > 0) {
        let sumBOR = 0,
          sumALOS = 0,
          sumBTO = 0,
          sumTOI = 0,
          sumNDR = 0,
          sumGDR = 0;
        dataRL.forEach((item) => {
          sumBOR += parseFloat(item.BOR || 0);
          sumALOS += parseFloat(item.ALOS || 0);
          sumBTO += parseFloat(item.BTO || 0);
          sumTOI += parseFloat(item.TOI || 0);
          sumNDR += parseFloat(item.NDR || 0);
          sumGDR += parseFloat(item.GDR || 0);
        });
        const n = dataRL.length;
        setAveBor(sumBOR / n);
        setAveLos(sumALOS / n);
        setAveBto(sumBTO / n);
        setAveToi(sumTOI / n);
        setAveNdr(sumNDR / n);
        setAveGdr(sumGDR / n);
      } else {
        setAveBor(0);
        setAveLos(0);
        setAveBto(0);
        setAveToi(0);
        setAveNdr(0);
        setAveGdr(0);
      }
    }
  }, [dataRL, user.jenisUserId]);

  const initBulanTahun = () => {
    const bulanList = [
      { key: "Januari", value: "1" },
      { key: "Februari", value: "2" },
      { key: "Maret", value: "3" },
      { key: "April", value: "4" },
      { key: "Mei", value: "5" },
      { key: "Juni", value: "6" },
      { key: "Juli", value: "7" },
      { key: "Agustus", value: "8" },
      { key: "September", value: "9" },
      { key: "Oktober", value: "10" },
      { key: "November", value: "11" },
      { key: "Desember", value: "12" },
    ];
    setDaftarBulan(bulanList);
    const now = new Date();
    setTahun(now.getFullYear().toString());
  };

  const refreshToken = async () => {
    try {
      const customConfig = {
        headers: {
          "XSRF-TOKEN": CSRFToken,
        },
      };
      const resp = await axios.get("/apisirs6v2/token", customConfig);
      setToken(resp.data.accessToken);
      const decoded = jwt_decode(resp.data.accessToken);
      setUser(decoded);
      setExpire(decoded.exp);

      if (decoded.jenisUserId === 2) {
        getKabKota(decoded.satKerId);
      }
      if (decoded.jenisUserId === 3) {
        getRumahSakit(decoded.satKerId);
      }
      if (decoded.jenisUserId === 4) {
        showRumahSakit(decoded.satKerId);
      }
    } catch (err) {
      if (err.response) {
        navigate("/");
      }
    }
  };

  const axiosJWT = axios.create();
  axiosJWT.interceptors.request.use(
    async (config) => {
      const now = new Date();
      if (expire * 1000 < now.getTime()) {
        const config2 = { headers: { "XSRF-TOKEN": CSRFToken } };
        const resp2 = await axios.get("/apisirs6v2/token", config2);
        config.headers.Authorization = `Bearer ${resp2.data.accessToken}`;
        setToken(resp2.data.accessToken);
        const decoded2 = jwt_decode(resp2.data.accessToken);
        setExpire(decoded2.exp);
        setUser(decoded2);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  const getProvinsi = async () => {
    try {
      const resp = await axiosJWT.get("/apisirs6v2/provinsi", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDaftarProvinsi(resp.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getKabKota = async (provinsiId) => {
    try {
      const resp = await axiosJWT.get("/apisirs6v2/kabkota", {
        headers: { Authorization: `Bearer ${token}` },
        params: { provinsiId },
      });
      setDaftarKabKota(resp.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getRumahSakit = async (kabKotaId) => {
    try {
      const resp = await axiosJWT.get("/apisirs6v2/rumahsakit", {
        headers: { Authorization: `Bearer ${token}` },
        params: { kabKotaId },
      });
      setDaftarRumahSakit(resp.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const showRumahSakit = async (rsId) => {
    try {
      const resp = await axiosJWT.get(`/apisirs6v2/rumahsakit/${rsId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRumahSakit(resp.data.data || null);
    } catch (err) {
      console.error(err);
      setRumahSakit(null);
    }
  };

  const provinsiChangeHandler = (e) => {
    const val = e.target.value;
    setProvinsiValue(val);
    setKabKotaValue("0");
    setRumahSakitValue("0");
    setRumahSakit(null);
    setBulanAll(false);
    if (val && val !== "0") {
      getKabKota(val);
    } else {
      setDaftarKabKota([]);
      setDaftarRumahSakit([]);
    }
  };

  const kabKotaChangeHandler = (e) => {
    const val = e.target.value;
    setKabKotaValue(val);
    setRumahSakitValue("0");
    setRumahSakit(null);
    setBulanAll(false);
    if (val === "all") {
      setRumahSakit("all");
      setRumahSakitValue("all");
    } else if (val && val !== "0") {
      getRumahSakit(val);
    } else {
      setDaftarRumahSakit([]);
    }
  };

  const rumahSakitChangeHandler = (e) => {
    const rsId = e.target.value;
    setRumahSakitValue(rsId);
    if (rsId === "all") {
      setRumahSakit("all");
      setBulanAll(true);
    } else if (rsId && rsId !== "0") {
      showRumahSakit(rsId);
    } else {
      setRumahSakit(null);
    }
  };

const getRL = async (e) => {
  e.preventDefault();

  if (!rumahSakit) {
    toast("Rumah sakit harus dipilih", {
      position: toast.POSITION.TOP_RIGHT,
    });
    return;
  }

  const filter = [];
  const params = {};  // kita pakai objek kosong

  if (rumahSakit === "all") {
    filter.push("nama: All Rumah Sakit");
    params.provId = user.satKerId;

    if (bulanAll || bulan === "all") {
      // bulan “all” dipilih → tidak kirim periode
      filter.push("All Bulan");
      // tidak set params.periode
    } else {
      filter.push(`periode: ${tahun}-${bulan}`);
      params.periode = `${tahun}-${bulan}`;
    }
  } else {
    filter.push(`nama: ${rumahSakit.nama}`);
    params.rsId = rumahSakit.id;

    if (bulanAll || bulan === "all") {
      filter.push("All Bulan");
      // tidak set params.periode
    } else {
      filter.push(`periode: ${tahun}-${bulan}`);
      params.periode = `${tahun}-${bulan}`;
    }
  }
  setFilterLabel(filter);

  setValidasiId(null);
  setStatusValidasi(0);
  setKeteranganValidasi("");
  setDataValidasi(null);

  try {
    const resp = await axiosJWT.get("/apisirs6v2/rltigatitiksatu", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      params: params,
    });
    setDataRL(resp.data.data || []);

    // Load validasi data setelah filter diterapkan
    if (rumahSakit !== "all" && bulan !== "all") {
      try {
        const validasiConfig = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          params: {
            rsId: rumahSakit.id,
            periode: String(tahun).concat("-").concat(String(bulan).padStart(2, "0")),
          },
        };
        const validasiResponse = await axiosJWT.get(
          "/apisirs6v2/rltigatitikduavalidasi",
          validasiConfig
        );

        if (validasiResponse.data.data && validasiResponse.data.data.length > 0) {
          const validasi = validasiResponse.data.data[0];
          setValidasiId(validasi.id);
          setStatusValidasi(validasi.statusValidasiId);
          setKeteranganValidasi(validasi.catatan || "");
          setDataValidasi(validasi);
        }
      } catch (error) {}
    }
    setShow(false);
  } catch (err) {
    console.error(err);
    toast("Gagal mengambil data", {
      position: toast.POSITION.TOP_RIGHT,
    });
  }
};

  const getValidasi = async () => {
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rumahSakit.id,
          periode: String(tahun).concat("-").concat(String(bulan).padStart(2, "0")),
        },
      };
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitikduavalidasi",
        customConfig
      );

      if (response.data.data && response.data.data.length > 0) {
        const validasi = response.data.data[0];
        setValidasiId(validasi.id);
        setStatusValidasi(validasi.statusValidasiId);
        setKeteranganValidasi(validasi.catatan || "");
        setDataValidasi(validasi);
      } else {
        setValidasiId(null);
        setStatusValidasi(0);
        setKeteranganValidasi("");
        setDataValidasi(null);
      }
    } catch (error) {
      setValidasiId(null);
      setStatusValidasi(0);
      setKeteranganValidasi("");
      setDataValidasi(null);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleDownloadExcel = () => {
    const extraCols = user.jenisUserId === 2 ? ["rs_id", "RUMAH_SAKIT", "nama"] : [];
    const header = [
      "Jenis Pelayanan",
      "BOR",
      "ALOS",
      "BTO",
      "TOI",
      "NDR",
      "GDR",
    ];
    const headerFinal = ["No",...extraCols, ...header];

    const body = dataRL.map((item, index) => {
        const base = [];

        // selalu tambahkan index + 1 dulu
        base.push(index + 1);

        if (user.jenisUserId === 2) {
          // bila user jenis = 2, langsung sisipkan kolom tambahan setelah index+1
          base.push(item.rs_id || "");
          base.push(item.RUMAH_SAKIT || "");
          base.push(item.nama || "");
        }

        // sisanya kolom umum
        base.push(item.nama_kelompok_jenis_pelayanan);
        base.push(parseFloat(item.BOR || 0).toFixed(2));
        base.push(parseFloat(item.ALOS || 0).toFixed(2));
        base.push(parseFloat(item.BTO || 0).toFixed(2));
        base.push(parseFloat(item.TOI || 0).toFixed(2));
        base.push(parseFloat(item.NDR || 0).toFixed(2));
        base.push(parseFloat(item.GDR || 0).toFixed(2));

        return base;
      });


    downloadExcel({
      fileName: user.jenisUserId === 2 ? "RL_3_1_AllRS" : "RL_3_1",
      sheet: "RL31",
      tablePayload: { header: headerFinal, body },
    });
  };

  return (
    <div className="container" style={{ marginTop: "20px" }}>
      <h4 className={style.pageHeader}>RL 3.1 - Indikator Pelayanan</h4>

      <Modal show={show} onHide={() => setShow(false)} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>
        <form onSubmit={getRL}>
          <Modal.Body>
            {(user.jenisUserId === 1 || user.jenisUserId === 2) && (
              <>
                {user.jenisUserId === 1 && (
                  <div className="form-floating" style={{ width: "100%", paddingBottom: "5px" }}>
                    <select
                      name="provinsi"
                      id="provinsi"
                      className="form-select"
                      onChange={provinsiChangeHandler}
                      value={provinsiValue}
                    >
                      <option key="0" value="0">
                        Pilih Provinsi
                      </option>
                      {daftarProvinsi.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nama}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="provinsi">Provinsi</label>
                  </div>
                )}
                <div className="form-floating" style={{ width: "100%", paddingBottom: "5px" }}>
                  <select
                    name="kabKota"
                    id="kabKota"
                    className="form-select"
                    onChange={kabKotaChangeHandler}
                    value={kabKotaValue}
                  >
                    <option key="0" value="0">
                      Pilih Kab/Kota
                    </option>
                    {user.jenisUserId === 2 && <option key="all" value="all">All Kab/Kota</option>}
                    {daftarKabKota.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="kabKota">Kab/Kota</label>
                </div>
              </>
            )}

            {(user.jenisUserId === 1 || user.jenisUserId === 2 || user.jenisUserId === 3) && (
              <div className="form-floating" style={{ width: "100%", paddingBottom: "5px" }}>
                <select
                  name="rumahSakit"
                  id="rumahSakit"
                  className="form-select"
                  onChange={rumahSakitChangeHandler}
                  value={rumahSakitValue}
                >
                  <option key="0" value="0">
                    Pilih Rumah Sakit
                  </option>
                  {user.jenisUserId === 2 && <option key="all" value="all">All Rumah Sakit</option>}
                  {daftarRumahSakit.map((rs) => (
                    <option key={rs.id} value={rs.id}>
                      {rs.nama}
                    </option>
                  ))}
                </select>
                <label htmlFor="rumahSakit">Rumah Sakit</label>
              </div>
            )}

            <div className="form-floating" style={{ width: "70%", display: "inline-block", paddingRight: "5px" }}>
              <select
                className="form-control"
                onChange={(e) => {
                  setBulan(e.target.value);
                  setBulanAll(false);
                }}
                value={bulanAll ? "all" : bulan}
              >
                {rumahSakit === "all" && <option key="all" value="all">All</option>}
                {daftarBulan.map((b) => (
                  <option key={b.value} value={b.value}>{b.key}</option>
                ))}
              </select>
              <label htmlFor="bulan">Bulan</label>
            </div>
            <div className="form-floating" style={{ width: "30%", display: "inline-block" }}>
              <input
                name="tahun"
                type="number"
                className="form-control"
                placeholder="Tahun"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
              />
              <label htmlFor="tahun">Tahun</label>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <ToastContainer />
            <button type="submit" className="btn btn-outline-success">
              <HiSaveAs size={20} /> Terapkan
            </button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Tabel & bagian Download dll tetap seperti sebelumnya */}
      <div className="row">
        <div className="col-md-12">
          <div className={style.toolbar}>
            <button
              type="button"
              className={style.btnPrimary}
              onClick={() => setShow(true)}
            >
              Filter
            </button>

            <button
              type="button"
              className={style.btnPrimary}
              onClick={handleDownloadExcel}
            >
              Download
            </button>
          </div>

          {filterLabel.length > 0 && (
            <div>
              <h5 style={{ fontSize: "14px" }}>
                Filtered by: {filterLabel.join(", ")}
              </h5>
            </div>
          )}

          <div>
            <ul className={`nav nav-tabs ${style.navTabs}`}>
               <li className={`nav-item ${style.navItem}`}>
                <button
                  type="button"
                  className={`${style.navLink} ${activeTab === "tab1" ? style.active : ""}`}
                  onClick={() => handleTabClick("tab1")}
                >
                  Data
                </button>
              </li>
              {[3, 4].includes(user.jenisUserId) && (
                 <li className={`nav-item ${style.navItem}`}>
                  <button
                    type="button"
                    className={`${style.navLink} ${activeTab === "tab2" ? style.active : ""}`}
                    onClick={() => handleTabClick("tab2")}
                  >
                    Validasi
                  </button>
                </li>
              )}
            </ul>

            <div className="tab-content mt-3">
              <div className={`tab-pane fade ${activeTab === "tab1" ? "show active" : ""}`}>
           <table className={style.table}>
            <thead>
              <tr>
                <th style={{ width: "5%" }}>No.</th>
                {user.jenisUserId === 2 && (
                  <>
                    <th>rs_id</th>
                    <th>RUMAH_SAKIT</th>
                    <th>nama</th>
                  </>
                )}
                <th>Jenis Pelayanan</th>
                <th>BOR</th>
                <th>ALOS</th>
                <th>BTO</th>
                <th>TOI</th>
                <th>NDR</th>
                <th>GDR</th>
              </tr>
            </thead>
            <tbody>
              {dataRL.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td>{idx + 1}</td>
                  {user.jenisUserId === 2 && (
                    <>
                      <td>{item.rs_id || ""}</td>
                      <td>{item.RUMAH_SAKIT || ""}</td>
                      <td>{item.nama || ""}</td>
                    </>
                  )}
                  <td>{item.nama_kelompok_jenis_pelayanan}</td>
                  <td style={{ textAlign: "right" }}>{parseFloat(item.BOR || 0).toFixed(2)}</td>
                  <td style={{ textAlign: "right" }}>{parseFloat(item.ALOS || 0).toFixed(2)}</td>
                  <td style={{ textAlign: "right" }}>{parseFloat(item.BTO || 0).toFixed(2)}</td>
                  <td style={{ textAlign: "right" }}>{parseFloat(item.TOI || 0).toFixed(2)}</td>
                  <td style={{ textAlign: "right" }}>{parseFloat(item.NDR || 0).toFixed(2)}</td>
                  <td style={{ textAlign: "right" }}>{parseFloat(item.GDR || 0).toFixed(2)}</td>
                </tr>
              ))}
              {user.jenisUserId !== 2 && dataRL.length > 0 && (
                <tr>
                  <td colspan="2">Rata - Rata</td>
                  <td style={{ textAlign: "right" }}>{aveBOR.toFixed(2)}</td>
                  <td style={{ textAlign: "right" }}>{aveALOS.toFixed(2)}</td>
                  <td style={{ textAlign: "right" }}>{aveBTO.toFixed(2)}</td>
                  <td style={{ textAlign: "right" }}>{aveTOI.toFixed(2)}</td>
                  <td style={{ textAlign: "right" }}>{aveNDR.toFixed(2)}</td>
                  <td style={{ textAlign: "right" }}>{aveGDR.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
              </div>

              <div className={`tab-pane fade ${activeTab === "tab2" ? "show active" : ""}`}>
                <div className={style.validasiCard}>
                  <h3 className={style.validasiCardTitle}>Validasi RL 3.1</h3>

                  {dataRL.length === 0 ? (
                    <div>
                    <div
                    style={{
                      backgroundColor: "#d1ecf1",
                      color: "#0c5460",
                      padding: "15px",
                      borderRadius: "5px",
                      marginBottom: "20px",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: "#bee5eb",
                    }}
                  >
                    <p style={{ margin: "0" }}>
                      Info : Validasi RL 3.1 ini berdasarkan validasi RL 3.2
                    </p>
                  </div>
                    <div className="alert alert-warning text-center">
                      <strong>Silahkan pilih filter terlebih dahulu untuk menampilkan data.</strong>
                    </div>
                    </div>
                  ) : !dataValidasi ? (
                    <div className="alert alert-warning text-center">
                      <strong>Data Belum di Validasi pada RL 3.2</strong>
                    </div>
                  ) : (
                    <>
                      {dataValidasi && (
                        <div>
                          <div
                    style={{
                      backgroundColor: "#d1ecf1",
                      color: "#0c5460",
                      padding: "15px",
                      borderRadius: "5px",
                      marginBottom: "20px",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: "#bee5eb",
                    }}
                  >
                    <p style={{ margin: "0" }}>
                      Info : Validasi RL 3.1 ini berdasarkan validasi RL 3.2
                    </p>
                  </div>

                        <div style={{ backgroundColor: "#f0f0f0", padding: "12px", borderRadius: "4px", marginBottom: "15px" }}>
                          <div style={{ display: "flex", marginBottom: "4px" }}>
                            <div style={{ width: "90px"}}><strong>Status</strong></div>
                            <div style={{ width: "10px" }}>:</div>
                            <div>
                              {dataValidasi.statusValidasiId === 1
                                ? "Perlu Perbaikan"
                                : dataValidasi.statusValidasiId === 2
                                ? "Selesai Diperbaiki"
                                : dataValidasi.statusValidasiId === 3
                                ? "Disetujui"
                                : "-"}
                            </div>
                          </div>

                            <div style={{ display: "flex", marginBottom: "4px" }}>
                              <div style={{ width: "90px" }}><strong>Catatan</strong></div>
                              <div style={{ width: "10px" }}>:</div>
                              <div>{dataValidasi.catatan || dataValidasi.keterangan}</div>
                            </div>
                          
                          <div style={{ display: "flex" }}>
                            <div style={{ width: "90px" }}><strong>Dibuat</strong></div>
                            <div style={{ width: "10px" }}>:</div>
                            <div>{new Date(dataValidasi.createdAt).toLocaleDateString("id-ID")}</div>
                          </div>
                        </div>
                        </div>
                      )}

                      {dataValidasi.statusValidasiId === 3 && (
                        <div className="alert alert-warning text-center mt-3">
                          <strong>Data telah divalidasi</strong>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RL31;