import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL38.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirmAlert } from "react-confirm-alert";
import { Modal, Table } from "react-bootstrap";
import { DownloadTableExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const RL38 = () => {
  const [tahun, setTahun] = useState("2025");
  const [bulan, setBulan] = useState("");
  // const [namaRS, setNamaRS] = useState("");
  // const [alamatRS, setAlamatRS] = useState("");
  // const [namaPropinsi, setNamaPropinsi] = useState("");
  // const [namaKabKota, setNamaKabKota] = useState("");
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [spinner, setSpinner] = useState(false);
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();

  //baru
  const [filterLabel, setFilterLabel] = useState([]);
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [rumahSakit, setRumahSakit] = useState("");
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});
  const tableRef = useRef(null);
  const [namafile, setNamaFile] = useState("");

  useEffect(() => {
    refreshToken();
    // getDataRLTigaTitikDelapan('2023-01-01');
    getBulan();
    // const getLastYear = async () => {
    //   const date = new Date();
    //   setTahun(date.getFullYear());
    //   return date.getFullYear();
    // };
    // getLastYear().then((results) => {});
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
      // setExpire(decoded.exp);
      // getDataRS(decoded.rsId);
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

  const getBulan = async () => {
    const results = [];
    results.push({
      key: "Januari",
      value: "01",
    });
    results.push({
      key: "Febuari",
      value: "02",
    });
    results.push({
      key: "Maret",
      value: "03",
    });
    results.push({
      key: "April",
      value: "04",
    });
    results.push({
      key: "Mei",
      value: "05",
    });
    results.push({
      key: "Juni",
      value: "06",
    });
    results.push({
      key: "Juli",
      value: "07",
    });
    results.push({
      key: "Agustus",
      value: "08",
    });
    results.push({
      key: "September",
      value: "09",
    });
    results.push({
      key: "Oktober",
      value: "10",
    });
    results.push({
      key: "November",
      value: "11",
    });
    results.push({
      key: "Desember",
      value: "12",
    });

    setDaftarBulan([...results]);
  };

  const bulanChangeHandler = async (e) => {
    setBulan(e.target.value);
  };

  const tahunChangeHandler = (event) => {
    setTahun(event.target.value);
  };

  const provinsiChangeHandler = (e) => {
    const provinsiId = e.target.value;
    getKabKota(provinsiId);
  };

  const kabKotaChangeHandler = (e) => {
    const kabKotaId = e.target.value;
    getRumahSakit(kabKotaId);
  };

  const rumahSakitChangeHandler = (e) => {
    const rsId = e.target.value;
    showRumahSakit(rsId);
  };

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

  const getRL = async (e) => {
    e.preventDefault();
    if (rumahSakit == null) {
      toast(`rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }
    const filter = [];
    filter.push("nama: ".concat(rumahSakit.nama));
    filter.push("periode: ".concat(String(tahun).concat("-").concat(bulan)));
    setFilterLabel(filter);
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rumahSakit.id,
          periode: String(tahun).concat("-").concat(bulan),
        },
      };

      const detailkegiatan = await axiosJWT.get(
        "/apisirs6v2/rltigatitikdelapan",
        customConfig
      );

      const rlTemplate = detailkegiatan.data.data.map((value, index) => {
        return {
          id: value.id,
          groupId:
            value.rl_tiga_titik_delapan_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan_header.no,
          groupNama:
            value.rl_tiga_titik_delapan_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan_header.nama,
          subGroupId:
            value.rl_tiga_titik_delapan_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan.id,
          subGroupNo:
            value.rl_tiga_titik_delapan_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan.no,
          subGroupNama:
            value.rl_tiga_titik_delapan_pemeriksaan
              .rl_tiga_titik_delapan_group_pemeriksaan.nama,
          jenisKegiatanId: value.rl_tiga_titik_delapan_pemeriksaan.id,
          jenisKegiatanNo: value.rl_tiga_titik_delapan_pemeriksaan.no,
          jenisKegiatanNama: value.rl_tiga_titik_delapan_pemeriksaan.nama,
          jumlahLaki: value.jumlahLaki,
          jumlahPerempuan: value.jumlahPerempuan,
          rataLaki: value.rataLaki,
          rataPerempuan: value.rataPerempuan,
        };
      });

      let subGroups = [];
      rlTemplate.reduce(function (res, value) {
        if (!res[value.subGroupId]) {
          res[value.subGroupId] = {
            groupId: value.groupId,
            groupNama: value.groupNama,
            subGroupId: value.subGroupId,
            subGroupNo: value.subGroupNo,
            subGroupNama: value.subGroupNama,
            subGroupJumlahLaki: 0,
            subGroupJumlahPerempuan: 0,
          };
          subGroups.push(res[value.subGroupId]);
        }
        res[value.subGroupId].subGroupJumlahLaki += value.jumlahLaki;
        res[value.subGroupId].subGroupJumlahPerempuan += value.jumlahPerempuan;
        return res;
      }, {});

      let groups = [];
      subGroups.reduce(function (res, value) {
        if (!res[value.groupId]) {
          res[value.groupId] = {
            groupId: value.groupId,
            groupNama: value.groupNama,
            groupJumlahLaki: 0,
            groupJumlahPerempuan: 0,
          };
          groups.push(res[value.groupId]);
        }
        res[value.groupId].groupJumlahLaki += value.subGroupJumlahLaki;
        res[value.groupId].groupJumlahPerempuan +=
          value.subGroupJumlahPerempuan;
        return res;
      }, {});

      let satu = [];
      let dua = [];

      subGroups.forEach((element2) => {
        const filterData2 = rlTemplate.filter((value2, index2) => {
          return value2.subGroupId === element2.subGroupId;
        });
        dua.push({
          groupId: element2.groupId,
          subGroupId: element2.subGroupId,
          subGroupNo: element2.subGroupNo,
          subGroupNama: element2.subGroupNama,
          subGroupJumlahLaki: element2.subGroupJumlahLaki,
          subGroupJumlahPerempuan: element2.subGroupJumlahPerempuan,
          kegiatan: filterData2,
        });
      });

      groups.forEach((element) => {
        const filterData = dua.filter((value, index) => {
          return value.groupId === element.groupId;
        });
        satu.push({
          groupId: element.groupId,
          groupNama: element.groupNama,
          groupJumlahLaki: element.groupJumlahLaki,
          groupJumlahPerempuan: element.groupJumlahPerempuan,
          details: filterData,
        });
      });

      setDataRL(satu);
      setNamaFile(
        "rl38_" +
          rumahSakit.id +
          "_".concat(String(tahun).concat("-").concat(bulan).concat("-01"))
      );
      setRumahSakit(null);
      handleClose();
      setSpinner(false);
    } catch (error) {
      console.log(error);
    }
  };

  const handleClose = () => setShow(false);

  const handleShow = () => {
    const jenisUserId = user.jenisUserId;
    const satKerId = user.satKerId;
    switch (jenisUserId) {
      case 1:
        getProvinsi();
        setBulan("01");
        setShow(true);
        break;
      case 2:
        getKabKota(satKerId);
        setBulan("01");
        setShow(true);
        break;
      case 3:
        getRumahSakit(satKerId);
        setBulan("01");
        setShow(true);
        break;
      case 4:
        showRumahSakit(satKerId);
        setBulan("01");
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

  const deleteRL38 = async (id) => {
    const customConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "XSRF-TOKEN": CSRFToken,
      },
    };

    const response = await axios.get("/apisirs6v2/token", customConfig);
    try {
      await axiosJWT.delete(
        `/apisirs6v2/rltigatitikdelapan/${id}`,
        customConfig
      );
      window.location.reload(false);
      toast("Data Berhasil Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
      });
    } catch (error) {
      console.log(error);
      toast("Data Gagal Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  const confirmationDelete = (id) => {
    confirmAlert({
      title: "Konfirmasi Penghapusan",
      message: "Apakah Anda Yakin ?",
      buttons: [
        {
          label: "Ya",
          onClick: () => {
            deleteRL38(id);
          },
        },
        {
          label: "Tidak",
        },
      ],
    });
  };
  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "100px" }}
    >
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>
        <form onSubmit={getRL}>
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
                    onChange={(e) => provinsiChangeHandler(e)}
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
                    onChange={(e) => kabKotaChangeHandler(e)}
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
                    onChange={(e) => rumahSakitChangeHandler(e)}
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
                    onChange={(e) => kabKotaChangeHandler(e)}
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
                    onChange={(e) => rumahSakitChangeHandler(e)}
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
                    onChange={(e) => rumahSakitChangeHandler(e)}
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
              style={{ width: "70%", display: "inline-block" }}
            >
              <select
                typeof="select"
                className="form-control"
                onChange={bulanChangeHandler}
              >
                {daftarBulan.map((bulan) => {
                  return (
                    <option
                      key={bulan.value}
                      name={bulan.key}
                      value={bulan.value}
                    >
                      {bulan.key}
                    </option>
                  );
                })}
              </select>
              <label>Bulan</label>
            </div>
            <div
              className="form-floating"
              style={{ width: "30%", display: "inline-block" }}
            >
              <input
                name="tahun"
                type="number"
                className="form-control"
                id="tahun"
                placeholder="Tahun"
                value={tahun}
                onChange={(e) => tahunChangeHandler(e)}
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
          <span style={{ color: "gray" }}>
            <h4>RL 3.8 - Laboratorium</h4>
          </span>
          <div style={{ marginBottom: "10px" }}>
            {user.jenisUserId === 4 ? (
              <Link
                className="btn"
                to={`/rl38/tambah/`}
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
            <DownloadTableExcel
              filename={namafile}
              sheet="data RL 35"
              currentTableRef={tableRef.current}
            >
              {/* <button> Export excel </button> */}
              <button
                className="btn"
                style={{
                  fontSize: "18px",
                  marginLeft: "5px",
                  backgroundColor: "#779D9E",
                  color: "#FFFFFF",
                }}
              >
                {" "}
                Download
              </button>
            </DownloadTableExcel>
          </div>
        </div>
        <div>
          <h5 style={{ fontSize: "14px" }}>
            {filterLabel
              .map((value) => {
                return "filtered by" + value;
              })
              .join(", ")}
          </h5>
        </div>
        <div className={style["table-container"]}>
          <table className={style["table"]} ref={tableRef}>
            <thead className={style["thead"]}>
              <tr className="main-header-row">
                <th
                  rowSpan={2}
                  style={{ width: "4%", verticalAlign: "middle" }}
                >
                  No.
                </th>
                <th
                  rowSpan={2}
                  style={{ width: "14%", verticalAlign: "middle" }}
                >
                  Aksi
                </th>
                <th
                  rowSpan={2}
                  style={{
                    width: "30%",
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >
                  Jenis Pemeriksaan
                </th>
                <th colSpan={2} style={{ textAlign: "center" }}>
                  Jumlah Pemeriksaan
                </th>
                <th colSpan={2} style={{ textAlign: "center" }}>
                  Rata-Rata Pemeriksaan
                </th>
              </tr>
              <tr className={style["subheader-row"]}>
                <th style={{ textAlign: "center" }}>Laki-Laki</th>
                <th style={{ textAlign: "center" }}>Perempuan</th>
                <th style={{ textAlign: "center" }}>Laki-Laki</th>
                <th style={{ textAlign: "center" }}>Perempuan</th>
              </tr>
            </thead>
            <tbody>
              {dataRL.map((value, index) => {
                return (
                  <React.Fragment key={index}>
                    <tr
                      key={index}
                      style={{
                        textAlign: "center",
                        backgroundColor: "#C4DFAA",
                        fontWeight: "bold",
                        // color:"#354259"
                      }}
                    >
                      <td>{value.groupId}</td>
                      <td></td>
                      <td>{value.groupNama}</td>
                      <td>{value.groupJumlahLaki}</td>
                      <td>{value.groupJumlahPerempuan}</td>
                      <td></td>
                      <td></td>
                    </tr>
                    {value.details.map((value2, index2) => {
                      return (
                        <React.Fragment key={index2}>
                          <tr
                            key={index}
                            style={{
                              textAlign: "center",
                              backgroundColor: "#90C8AC",
                              fontWeight: "bold",
                              // color:"#354259"
                            }}
                          >
                            <td>{value2.subGroupNo}</td>
                            <td></td>
                            <td>{value2.subGroupNama}</td>
                            <td>{value2.subGroupJumlahLaki}</td>
                            <td>{value2.subGroupJumlahPerempuan}</td>
                            <td></td>
                            <td></td>
                          </tr>
                          {value2.kegiatan.map((value3, index3) => {
                            return (
                              <tr
                                key={index3}
                                style={{
                                  textAlign: "center",
                                  fontWeight: "bold",
                                }}
                              >
                                <td>{value3.jenisKegiatanNo}</td>
                                <td>
                                  <ToastContainer />
                                  {user.jenisUserId === 4 ? (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        width: "100%",
                                      }}
                                    >
                                      <button
                                        className="btn btn-danger"
                                        style={{
                                          margin: "0 5px 0 0",
                                          backgroundColor: "#FF6663",
                                          border: "1px solid #FF6663",
                                          flex: "1",
                                        }}
                                        type="button"
                                        onClick={(e) =>
                                          confirmationDelete(value3.id)
                                        }
                                      >
                                        Hapus
                                      </button>
                                      <Link
                                        to={`/rl38/ubah/${value3.id}`}
                                        className="btn btn-warning"
                                        style={{
                                          margin: "0 5px 0 0",
                                          backgroundColor: "#CFD35E",
                                          border: "1px solid #CFD35E",
                                          color: "#FFFFFF",
                                          flex: "1",
                                        }}
                                      >
                                        Ubah
                                      </Link>
                                    </div>
                                  ) : (
                                    <></>
                                  )}
                                </td>
                                <td>{value3.jenisKegiatanNama}</td>
                                <td>{value3.jumlahLaki}</td>
                                <td>{value3.jumlahPerempuan}</td>
                                <td>{value3.rataLaki}</td>
                                <td>{value3.rataPerempuan}</td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RL38;
