import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL315.module.css";
import { HiSaveAs } from "react-icons/hi";
import { confirmAlert } from "react-confirm-alert";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Modal from "react-bootstrap/Modal";
// import Table from "react-bootstrap/Table";
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const RL315 = () => {
  const [bulan, setBulan] = useState(1);
  const [tahun, setTahun] = useState("");
  const [filterLabel, setFilterLabel] = useState([]);
  const [rumahSakit, setRumahSakit] = useState("");
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    const date = new Date();
    setTahun(date.getFullYear());
    setBulan(date.getMonth() + 1);
    // getRLTigaTitikLimaBelasTemplate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshToken = async () => {
    try {
      const customConfig = {
        headers: {
          "XSRF-TOKEN": CSRFToken,
        },
      };
      const response = await axios.get("/apisirs6v2/token", customConfig);
      setToken(response.data.accessToken);
      const decoded = jwt_decode(response.data.accessToken);
      showRumahSakit(decoded.satKerId);
      setExpire(decoded.exp);
      setUser(decoded);
    } catch (error) {
      if (error.response) {
        navigate("/");
      }
    }
  };

  const axiosJWT = axios.create();
  axiosJWT.interceptors.request.use(
    async (config) => {
      const currentDate = new Date();
      if (expire * 1000 < currentDate.getTime()) {
        const customConfig = {
          headers: {
            "XSRF-TOKEN": CSRFToken,
          },
        };
        const response = await axios.get("/apisirs6v2/token", customConfig);
        config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        setToken(response.data.accessToken);
        const decoded = jwt_decode(response.data.accessToken);
        setExpire(decoded.exp);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const getRumahSakit = async (kabKotaId) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          kabKotaId: kabKotaId,
        },
      });
      setDaftarRumahSakit(response.data.data);
    } catch (error) {}
  };

  const showRumahSakit = async (id) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRumahSakit(response.data.data);
    } catch (error) {}
  };

  const getDataRLTigaTitikLimaBelas = async (event) => {
    event.preventDefault();
    if (rumahSakit == null) {
      toast(`rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    const filter = [];
    filter.push("Nama: ".concat(rumahSakit.nama));
    filter.push("Periode ".concat(String(tahun)));
    setFilterLabel(filter);

    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          tahun: tahun,
        },
      };
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitiklimabelas",
        customConfig
      );

      const rlTigaTitikLimaBelasDetails = results.data.data.map((value) => {
        return value.rl_tiga_titik_lima_belas_details;
      });

      let dataRLTigaTitikLimaBelasDetails = [];
      rlTigaTitikLimaBelasDetails.forEach((element) => {
        element.forEach((value) => {
          dataRLTigaTitikLimaBelasDetails.push(value);
        });
      });

      setDataRL(dataRLTigaTitikLimaBelasDetails);
      setRumahSakit(null);
      handleClose();
    } catch (error) {
      console.log(error);
    }
  };

  const hapusData = async (id) => {
    const customConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "XSRF-TOKEN": CSRFToken,
      },
    };
    try {
      const results = await axiosJWT.delete(
        `/apisirs6v2/rltigatitiklimabelas/${id}`,
        customConfig
      );
      toast("Data Berhasil Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setDataRL((current) => current.filter((value) => value.id !== id));
    } catch (error) {
      console.log(error);
      toast("Data Gagal Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  const hapus = (id) => {
    confirmAlert({
      title: "Konfirmasi Penghapusan",
      message: "Apakah Anda Yakin ?",
      buttons: [
        {
          label: "Ya",
          onClick: () => {
            hapusData(id);
          },
        },
        {
          label: "Tidak",
        },
      ],
    });
  };

  const handleClose = () => setShow(false);

  const handleShow = () => {
    const jenisUserId = user.jenisUserId;
    const satKerId = user.satKerId;
    switch (jenisUserId) {
      case 1:
        getProvinsi();
        setBulan(1);
        setShow(true);
        break;
      case 2:
        getKabKota(satKerId);
        setBulan(1);
        setShow(true);
        break;
      case 3:
        getRumahSakit(satKerId);
        setBulan(1);
        setShow(true);
        break;
      case 4:
        showRumahSakit(satKerId);
        setBulan(1);
        setShow(true);
        break;
      default:
    }
  };

  const getProvinsi = async () => {
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      const results = await axiosJWT.get("/apisirs6v2/provinsi", customConfig);

      const daftarProvinsi = results.data.data.map((value) => {
        return value;
      });

      setDaftarProvinsi(daftarProvinsi);
    } catch (error) {
      console.log(error);
    }
  };

  const getKabKota = async (provinsiId) => {
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          provinsiId: provinsiId,
        },
      };
      const results = await axiosJWT.get("/apisirs6v2/kabkota", customConfig);

      const daftarKabKota = results.data.data.map((value) => {
        return value;
      });

      setDaftarKabKota(daftarKabKota);
    } catch (error) {
      console.log(error);
    }
  };

  let total = { laki: 0, perempuan: 0, jumlah: 0 };
  dataRL.map((value, index) => {
    total.perempuan += parseInt(value.perempuan);
    total.laki += parseInt(value.laki);
    total.jumlah += parseInt(value.jumlah);
  });

  function handleDownloadExcel() {
    const header = ["No", "No Kegiatan", "Jenis Kegiatan", "Jumlah"];
    const body = dataRL.map((value, index) => {
      const data = [
        index + 1,
        value.jenis_kegiatan_rl_tiga_titik_lima_belas.no,
        value.jenis_kegiatan_rl_tiga_titik_lima_belas.nama,
        value.jumlah,
      ];
      return data;
    });
    downloadExcel({
      fileName: "RL_3_15",
      sheet: "react-export-table-to-excel",
      tablePayload: {
        header,
        body: body,
      },
    });
  }

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>

        <form onSubmit={getDataRLTigaTitikLimaBelas}>
          <Modal.Body>
            {user.jenisUserId === 1 ? (
              <>
                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="provinsi"
                    id="provinsi"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => getKabKota(e.target.value)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarProvinsi.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="provinsi">Provinsi</label>
                </div>

                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="kabKota"
                    id="kabKota"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => getRumahSakit(e.target.value)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarKabKota.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="kabKota">Kab/Kota</label>
                </div>

                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => showRumahSakit(e.target.value)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarRumahSakit.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              </>
            ) : (
              <></>
            )}
            {user.jenisUserId === 2 ? (
              <>
                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="kabKota"
                    id="kabKota"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => getRumahSakit(e.target.value)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarKabKota.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="kabKota">Kab/Kota</label>
                </div>

                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => showRumahSakit(e.target.value)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarRumahSakit.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              </>
            ) : (
              <></>
            )}
            {user.jenisUserId === 3 ? (
              <>
                <div
                  className="form-floating"
                  style={{ width: "100%", paddingBottom: "5px" }}
                >
                  <select
                    name="rumahSakit"
                    id="rumahSakit"
                    typeof="select"
                    className="form-select"
                    onChange={(e) => showRumahSakit(e.target.value)}
                  >
                    <option key={0} value={0}>
                      Pilih
                    </option>
                    {daftarRumahSakit.map((nilai) => {
                      return (
                        <option key={nilai.id} value={nilai.id}>
                          {nilai.nama}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="rumahSakit">Rumah Sakit</label>
                </div>
              </>
            ) : (
              <></>
            )}
            <div
              className="form-floating"
              style={{ width: "100%", display: "inline-block" }}
            >
              <input
                name="tahun"
                type="number"
                className="form-control"
                id="tahun"
                placeholder="Tahun"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                disabled={false}
              />
              <label htmlFor="tahun">Tahun</label>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="mt-3 mb-3">
              <ToastContainer />
              <button type="submit" className="btn btn-outline-success">
                <HiSaveAs size={20} /> Terapkan
              </button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
      <div className="row">
        <div className="col-md-12">
          <h4>
            <span style={{ color: "gray" }}>RL. 3.15 Kesehatan Jiwa</span>
          </h4>
          <div style={{ marginBottom: "10px" }}>
            {user.jenisUserId === 4 ? (
              <Link
                className="btn"
                to={`/rl315/tambah/`}
                style={{
                  marginRight: "5px",
                  fontSize: "18px",
                  backgroundColor: "#779D9E",
                  color: "#FFFFFF",
                }}
              >
                +
              </Link>
            ) : (
              <></>
            )}
            <button
              className="btn"
              style={{
                fontSize: "18px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
              onClick={handleShow}
            >
              Filter
            </button>
            <button
              className="btn"
              style={{
                fontSize: "18px",
                marginLeft: "5px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
              onClick={handleDownloadExcel}
            >
              Download
            </button>
          </div>

          {filterLabel.length > 0 ? (
            <div>
              <h5 style={{ fontSize: "14px" }}>
                Filtered By{" "}
                {filterLabel
                  .map((value) => {
                    return value;
                  })
                  .join(", ")}
              </h5>
            </div>
          ) : (
            <></>
          )}

          <div className={style["table-container"]}>
            <table className={style.table}>
              <thead className={style.thead}>
                <tr className="">
                  <th
                    // className={style["sticky-header"]}
                    style={{ width: "4%" }}
                  >
                    No
                  </th>
                  <th
                    // className={style["sticky-header"]}
                    style={{ width: "12%" }}
                  >
                    Aksi
                  </th>
                  <th
                  // className={style["sticky-header"]}
                  // style={{ width: "30%" }}
                  >
                    Jenis Kegiatan
                  </th>
                  <th>Laki-laki</th>
                  <th>Perempuan</th>
                  <th>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {dataRL.length > 0 ? (
                  <>
                    {dataRL.map((value, index) => {
                      return (
                        <tr key={value.id}>
                          <td className={style["sticky-column"]}>
                            <input
                              type="text"
                              name="no"
                              className="form-control"
                              value={
                                value.jenis_kegiatan_rl_tiga_titik_lima_belas.no
                              }
                              disabled={true}
                            />
                          </td>
                          {/* <td className={style["sticky-column"]}>
                            <ToastContainer />
                            {value.jenis_kegiatan_rl_tiga_titik_lima_belas
                              .no === 0 ? (
                              <></>
                            ) : (
                              <div
                                style={{
                                  display:
                                    value
                                      .jenis_kegiatan_rl_tiga_titik_lima_belas
                                      .no == "0"
                                      ? "none"
                                      : "flex",
                                }}
                              >
                                <button
                                  className="btn btn-danger"
                                  style={{
                                    margin: "0 5px 0 0",
                                    backgroundColor: "#FF6663",
                                    border: "1px solid #FF6663",
                                  }}
                                  type="button"
                                  onClick={(e) => hapus(value.id)}
                                >
                                  Hapus
                                </button>
                                <Link
                                  to={`/rl315/ubah/${value.id}`}
                                  className="btn btn-warning"
                                  style={{
                                    margin: "0 5px 0 0",
                                    backgroundColor: "#CFD35E",
                                    border: "1px solid #CFD35E",
                                    color: "#FFFFFF",
                                  }}
                                >
                                  Ubah
                                </Link>
                              </div>
                            )}
                          </td> */}
                          <td className={style["sticky-column"]}>
                            <ToastContainer />
                            <div
                              style={{
                                display: "flex",
                                justifyContent:
                                  value.jenis_kegiatan_rl_tiga_titik_lima_belas
                                    .nama === "Tidak Ada Data"
                                    ? "center" // kalau tidak ada data -> tombol hapus di tengah
                                    : "flex-start", // kalau ada data -> tombol hapus + ubah sejajar dari kiri
                              }}
                            >
                              <button
                                className="btn btn-danger"
                                style={{
                                  margin: "0 5px 0 0",
                                  backgroundColor: "#FF6663",
                                  border: "1px solid #FF6663",
                                }}
                                type="button"
                                onClick={(e) => hapus(value.id)}
                              >
                                Hapus
                              </button>

                              {/* Tampilkan tombol Ubah hanya jika bukan "Tidak Ada Data" */}
                              {value.jenis_kegiatan_rl_tiga_titik_lima_belas
                                .nama !== "Tidak Ada Data" && (
                                <Link
                                  to={`/rl315/ubah/${value.id}`}
                                  className="btn btn-warning"
                                  style={{
                                    margin: "0 5px 0 0",
                                    backgroundColor: "#CFD35E",
                                    border: "1px solid #CFD35E",
                                    color: "#FFFFFF",
                                  }}
                                >
                                  Ubah
                                </Link>
                              )}
                            </div>
                          </td>
                          <td className={style["sticky-column"]}>
                            <input
                              type="text"
                              name="jenisKegiatan"
                              className="form-control"
                              value={
                                value.jenis_kegiatan_rl_tiga_titik_lima_belas
                                  .nama
                              }
                              disabled={true}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="jumlah"
                              className="form-control"
                              value={
                                value.jenis_kegiatan_rl_tiga_titik_lima_belas
                                  .no > 0
                                  ? value.laki
                                  : 0
                              }
                              disabled={true}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="jumlah"
                              className="form-control"
                              value={
                                value.jenis_kegiatan_rl_tiga_titik_lima_belas
                                  .no > 0
                                  ? value.perempuan
                                  : 0
                              }
                              disabled={true}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="jumlah"
                              className="form-control"
                              value={
                                value.jenis_kegiatan_rl_tiga_titik_lima_belas
                                  .no > 0
                                  ? value.jumlah
                                  : 0
                              }
                              disabled={true}
                            />
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <th colSpan={3} className="text-center">
                        Total
                      </th>
                      <td className="text-center align-middle">{total.laki}</td>
                      <td className="text-center align-middle">
                        {total.perempuan}
                      </td>
                      <td className="text-center align-middle">
                        {total.jumlah}
                      </td>
                    </tr>
                  </>
                ) : (
                  <></>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RL315;
