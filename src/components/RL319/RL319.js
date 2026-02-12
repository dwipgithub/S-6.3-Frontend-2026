import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL319.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import Modal from "react-bootstrap/Modal";
// import Table from "react-bootstrap/Table";
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const RL319 = () => {
  const [tahun, setTahun] = useState("");
  const [bulan, setBulan] = useState("");
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
    setTahun("2025");
    setBulan(date.getMonth() + 1);

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
    },
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

  const getDataRLTigaTitikSembilanBelas = async (e) => {
    e.preventDefault();
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
        "/apisirs6v2/rltigatitiksembilanbelas",
        customConfig,
      );

      const rlTigaTitikSembilanBelasDetails = results.data.data.map((value) => {
        return value.rl_tiga_titik_sembilan_belas_details;
      });

      let dataRLTigaTitikSembilanBelasDetails = [];
      rlTigaTitikSembilanBelasDetails.forEach((element) => {
        element.forEach((value) => {
          dataRLTigaTitikSembilanBelasDetails.push(value);
        });
      });
      const hasChildren2 = dataRLTigaTitikSembilanBelasDetails.some((item) => {
        const no = item.golongan_obat_rl_tiga_titik_sembilan_belas?.no;
        return no && String(no).startsWith("2.");
      });
      const hasChildren4 = dataRLTigaTitikSembilanBelasDetails.some((item) => {
        const no = item.golongan_obat_rl_tiga_titik_sembilan_belas?.no;
        return no && String(no).startsWith("4.");
      });
      const filteredData = dataRLTigaTitikSembilanBelasDetails.filter(
        (item) => {
          const no = String(
            item.golongan_obat_rl_tiga_titik_sembilan_belas?.no,
          );
          if (no === "2" && !hasChildren2) return false;
          if (no === "4" && !hasChildren4) return false;
          return true;
        },
      );
      setDataRL(filteredData);
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
      let parent;
      const currentData = await getRLTigaTitikSembilanBelasById(id);

      if (
        currentData.golongan_obat_rl_tiga_titik_sembilan_belas.no.includes("4.")
      ) {
        parent = await getParent(4, id);
      } else if (
        currentData.golongan_obat_rl_tiga_titik_sembilan_belas.no.includes("2.")
      ) {
        parent = await getParent(2, id);
      }

      if (parent) {
        await axiosJWT.patch(
          "/apisirs6v2/rltigatitiksembilanbelasdetail/" + parent.id,
          parent.data,
          customConfig,
        );
      }
      await axiosJWT.delete(
        `/apisirs6v2/rltigatitiksembilanbelas/${id}`,
        customConfig,
      );

      setDataRL((prevData) => {
        const updatedData = prevData.filter((item) => item.id !== id);

        const hasChildren2 = updatedData.some((item) => {
          const no = item.golongan_obat_rl_tiga_titik_sembilan_belas?.no;
          return no && String(no).startsWith("2.");
        });
        const hasChildren4 = updatedData.some((item) => {
          const no = item.golongan_obat_rl_tiga_titik_sembilan_belas?.no;
          return no && String(no).startsWith("4.");
        });
        const filteredData = updatedData.filter((item) => {
          const no = String(
            item.golongan_obat_rl_tiga_titik_sembilan_belas?.no,
          );
          if (no === "2" && !hasChildren2) return false;
          if (no === "4" && !hasChildren4) return false;
          return true;
        });

        if (parent) {
          return filteredData.map((item) => {
            if (item.id === parent.id) {
              return { ...item, ...parent.data };
            }
            return item;
          });
        }
        return filteredData;
      });

      toast("Data Berhasil Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
      });
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

  const getParent = async (filter, id) => {
    const response = await axiosJWT.get(
      "/apisirs6v2/rltigatitiksembilanbelasdetail/" + id,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const newResponse = await axiosJWT.get(
      "/apisirs6v2/rltigatitiksembilanbelas",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          tahun: tahun,
        },
      },
    );

    let dataRLTigaTitikSembilanBelasDetails = [];
    const rlTigaTitikSembilanBelasDetails = newResponse.data.data.map(
      (value) => {
        return value.rl_tiga_titik_sembilan_belas_details;
      },
    );
    rlTigaTitikSembilanBelasDetails.forEach((element) => {
      element.forEach((value) => {
        dataRLTigaTitikSembilanBelasDetails.push(value);
      });
    });

    const parent = dataRLTigaTitikSembilanBelasDetails
      .filter((value) => {
        return value.golongan_obat_rl_tiga_titik_sembilan_belas.no == filter;
      })
      .map((value) => {
        return {
          id: value.id,
          data: {
            ranap_pasien_keluar:
              value.ranap_pasien_keluar -
              response.data.data.ranap_pasien_keluar,
            ranap_lama_dirawat:
              value.ranap_lama_dirawat - response.data.data.ranap_lama_dirawat,
            jumlah_pasien_rajal:
              value.jumlah_pasien_rajal -
              response.data.data.jumlah_pasien_rajal,
            rajal_lab: value.rajal_lab - response.data.data.rajal_lab,
            rajal_radiologi:
              value.rajal_radiologi - response.data.data.rajal_radiologi,
            rajal_lain_lain:
              value.rajal_lain_lain - response.data.data.rajal_lain_lain,
          },
        };
      });

    return parent[0];
  };

  const getRLTigaTitikSembilanBelasById = async (id) => {
    const response = await axiosJWT.get(
      "/apisirs6v2/rltigatitiksembilanbelasdetail/" + id,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data.data;
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

  let total = {
    ranap_pasien_keluar: 0,
    ranap_lama_dirawat: 0,
    jumlah_pasien_rajal: 0,
    rajal_lab: 0,
    rajal_radiologi: 0,
    rajal_lain_lain: 0,
  };

  dataRL
    .filter((value) => {
      return (
        value.golongan_obat_rl_tiga_titik_sembilan_belas.no != 4 &&
        value.golongan_obat_rl_tiga_titik_sembilan_belas.no != 2
      );
    })
    .map((value, index) => {
      total.ranap_lama_dirawat += parseInt(value.ranap_lama_dirawat);
      total.ranap_pasien_keluar += parseInt(value.ranap_pasien_keluar);
      total.jumlah_pasien_rajal += parseInt(value.jumlah_pasien_rajal);
      total.rajal_lab += parseInt(value.rajal_lab);
      total.rajal_lain_lain += parseInt(value.rajal_lain_lain);
      total.rajal_radiologi += parseInt(value.rajal_radiologi);
    });

  function handleDownloadExcel() {
    const header = [
      "No",
      "No. Cara Bayar",
      "Cara Pembayaran",
      "Pasien Rawat Inap Jumlah Pasien Dirawat",
      "Pasien Rawat Inap Jumlah Lama Dirawat",
      "Jumlah Pasien Rawat Jalan",
      "Jumlah Pasien Rawat Jalan Laboratorium",
      "Jumlah Pasien Rawat Jalan Radiologi",
      "Jumlah Pasien Rawat Jalan Radiologi Lain-lain",
    ];
    const body = dataRL.map((value, index) => {
      const data = [
        index + 1,
        value.golongan_obat_rl_tiga_titik_sembilan_belas.no,
        value.golongan_obat_rl_tiga_titik_sembilan_belas.nama,
        value.ranap_pasien_keluar,
        value.ranap_lama_dirawat,
        value.jumlah_pasien_rajal,
        value.rajal_lab,
        value.rajal_radiologi,
        value.rajal_lain_lain,
      ];
      return data;
    });
    downloadExcel({
      fileName: "RL_3_19",
      sheet: "react-export-table-to-excel",
      tablePayload: {
        header,
        body: body,
      },
    });
  }

  return (
    <div className="container" style={{ marginTop: "70px" }}>
      <ToastContainer />
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>

        <form onSubmit={getDataRLTigaTitikSembilanBelas}>
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
        <div className="col-sm-12">
          <h4>
            <span style={{ color: "gray" }}>RL. 3.19 Cara Bayar</span>
          </h4>
          <div style={{ marginBottom: "10px" }}>
            {user.jenisUserId === 4 ? (
              <Link
                className="btn"
                to={`/rl319/tambah/`}
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
                    className={style["sticky-header"]}
                    style={{ width: "4%" }}
                    rowSpan={2}
                  >
                    No. Cara Bayar
                  </th>
                  <th
                    className={style["sticky-header"]}
                    style={{ width: "6%" }}
                    rowSpan={2}
                  >
                    Aksi
                  </th>
                  <th
                    className={style["sticky-header"]}
                    style={{ width: "20%" }}
                    rowSpan={2}
                  >
                    Cara Pembayaran
                  </th>
                  <th colSpan={2}>Pasien Rawat Inap</th>
                  <th
                    style={{ width: "10%", verticalAlign: "middle" }}
                    rowSpan={2}
                  >
                    Jumlah Pasien Rawat Jalan
                  </th>
                  <th colSpan={3}>Jumlah Pasien Rawat Jalan</th>
                </tr>
                <tr className={style["subheader-row"]}>
                  <th style={{ width: "8%" }}>Jumlah Pasien Keluar</th>
                  <th style={{ width: "8%" }}>Jumlah Lama Dirawat</th>
                  <th style={{ width: "8%" }}>Laboratorium</th>
                  <th style={{ width: "8%" }}>Radiologi</th>
                  <th style={{ width: "8%" }}>Lain-lain</th>
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
                                value.golongan_obat_rl_tiga_titik_sembilan_belas
                                  .no
                              }
                              disabled={true}
                            />
                          </td>
                          <td className={style["sticky-column"]}>
                            {value.golongan_obat_rl_tiga_titik_sembilan_belas
                              .no != 4 &&
                            value.golongan_obat_rl_tiga_titik_sembilan_belas
                              .no != 2 ? (
                              <div style={{ display: "flex" }}>
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
                                  to={`/rl319/ubah/${value.id}`}
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
                            ) : (
                              ""
                            )}
                          </td>
                          <td className={style["sticky-column"]}>
                            <input
                              type="text"
                              name="golonganObat"
                              className="form-control"
                              value={
                                value.golongan_obat_rl_tiga_titik_sembilan_belas
                                  .nama
                              }
                              disabled={true}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="ranap_pasien_keluar"
                              className="form-control"
                              value={value.ranap_pasien_keluar}
                              disabled={true}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="ranap_lama_dirawat"
                              className="form-control"
                              value={value.ranap_lama_dirawat}
                              disabled={true}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="jumlah_pasien_rajal"
                              className="form-control"
                              value={value.jumlah_pasien_rajal}
                              disabled={true}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="rajal_lab"
                              className="form-control"
                              value={value.rajal_lab}
                              disabled={true}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="rajal_radiologi"
                              className="form-control"
                              value={value.rajal_radiologi}
                              disabled={true}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="rajal_lain_lain"
                              className="form-control"
                              value={value.rajal_lain_lain}
                              disabled={true}
                            />
                          </td>
                        </tr>
                      );
                    })}

                    <tr>
                      <td colSpan={3} className="text-center">
                        <strong>Total</strong>
                      </td>
                      <td className="text-center">
                        {total.ranap_pasien_keluar}
                      </td>
                      <td className="text-center">
                        {total.ranap_lama_dirawat}
                      </td>
                      <td className="text-center">
                        {total.jumlah_pasien_rajal}
                      </td>
                      <td className="text-center">{total.rajal_lab}</td>
                      <td className="text-center">{total.rajal_radiologi}</td>
                      <td className="text-center">{total.rajal_lain_lain}</td>
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

export default RL319;
