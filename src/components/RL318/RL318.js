import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./FormTambahRL318.module.css";
import { HiSaveAs } from "react-icons/hi";
import { RiDeleteBin5Fill, RiEdit2Fill } from "react-icons/ri";
import { AiFillFileAdd } from "react-icons/ai";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import Spinner from "react-bootstrap/esm/Spinner";
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

export const RL318 = () => {
  // const [tahun, setTahun] = useState('2022')
  // const [namaRS, setNamaRS] = useState('')
  // const [alamatRS, setAlamatRS] = useState('')
  // const [namaPropinsi, setNamaPropinsi] = useState('')
  // const [namaKabKota, setNamaKabKota] = useState('')
  const [total_rawat_jalan, setTotalRawatJalan] = useState(0);
  const [total_igd, setTotalIGD] = useState(0);
  const [total_rawat_inap, setTotalRawatInap] = useState(0);
  // const [token, setToken] = useState('')
  // const [expire, setExpire] = useState('')
  // const [dataRL, setDataRL] = useState([]);
  const [tahun, setTahun] = useState("2025");
  const [filterLabel, setFilterLabel] = useState([]);
  // const [daftarBulan, setDaftarBulan] = useState([])
  const [rumahSakit, setRumahSakit] = useState("");
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});
  const [spinner, setSpinner] = useState(false);
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    // getDataRS()
    // getRL37();
    // const getLastYear = async () => {
    //     const date = new Date()
    //     setTahun(date.getFullYear() - 1)
    //     return date.getFullYear() - 1
    // }
    // getLastYear().then((results) => {

    // })
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
    filter.push("filtered by nama: ".concat(rumahSakit.nama));
    filter.push("periode: ".concat(String(tahun)));
    setFilterLabel(filter);
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rumahSakit.id,
          periode: String(tahun),
        },
      };
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitikdelapanbelas",
        customConfig
      );

      const rlTigaTitikDelapanBelasDetails = results.data.data.map((value) => {
        return value;
      });

      const total_rawat_jalan = rlTigaTitikDelapanBelasDetails.reduce(
        (previousValue, currentValue) => {
          return previousValue + currentValue.rawat_jalan;
        },
        0
      );

      const total_igd = rlTigaTitikDelapanBelasDetails.reduce(
        (previousValue, currentValue) => {
          return previousValue + currentValue.igd;
        },
        0
      );

      const total_rawat_inap = rlTigaTitikDelapanBelasDetails.reduce(
        (previousValue, currentValue) => {
          return previousValue + currentValue.rawat_inap;
        },
        0
      );

      // console.log(total_obat)
      setTotalRawatJalan(total_rawat_jalan);
      setTotalIGD(total_igd);
      setTotalRawatInap(total_rawat_inap);
      setDataRL(rlTigaTitikDelapanBelasDetails);
      setRumahSakit(null);
      handleClose();
    } catch (error) {
      console.log(error);
    }
  };

  const deleteRL = async (id) => {
    const customConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "XSRF-TOKEN": CSRFToken,
      },
    };
    try {
      await axiosJWT.delete(
        `/apisirs6v2/rltigatitikdelapanbelas/${id}`,
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

  const deleteConfirmation = (id) => {
    confirmAlert({
      title: "",
      message: "Yakin data yang dipilih akan dihapus? ",
      buttons: [
        {
          label: "Yes",
          onClick: () => {
            deleteRL(id);
          },
        },
        {
          label: "No",
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
        // setBulan(1)
        setShow(true);
        break;
      case 2:
        getKabKota(satKerId);
        // setBulan(1)
        setShow(true);
        break;
      case 3:
        getRumahSakit(satKerId);
        // setBulan(1)
        setShow(true);
        break;
      case 4:
        showRumahSakit(satKerId);
        // setBulan(1)
        setShow(true);
        break;
      default:
    }
  };

  function handleDownloadExcel() {
    const header = [
      "No Golongan Obat",
      "Golongan Obat",
      "Rawat Jalan",
      "IGD",
      "Rawat Inap",
    ];
    console.log(dataRL);

    const body = dataRL.map((value, index) => {
      console.log();
      const data = [
        value.no_golongan_obat,
        value.nama_golongan_obat,
        value.rawat_jalan,
        value.igd,
        value.rawat_inap,
      ];
      return data;
    });

    downloadExcel({
      fileName: "RL318-Farmasi Resep",
      sheet: "Farmasi Resep",
      tablePayload: {
        header,
        body: body,
      },
    });
  }
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

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      <h4 style={{ color: "grey" }}>
        {" "}
        <span> RL 3.18 Farmasi Resep</span>{" "}
      </h4>
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
            {/* <div className="form-floating" style={{ width: "70%", display: "inline-block" }}>
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
                    </div> */}
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
          <div style={{ marginBottom: "10px" }}>
            {user.jenisUserId === 4 ? (
              <Link
                className="btn"
                to={`/rl318/tambah/`}
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

          <div>
            <h5 style={{ fontSize: "14px" }}>
              {filterLabel
                .map((value) => {
                  return value;
                })
                .join(", ")}
            </h5>
          </div>
          <div className="container" style={{ textAlign: "center" }}>
            {spinner && <Spinner animation="grow" variant="success"></Spinner>}
            {spinner && <Spinner animation="grow" variant="success"></Spinner>}
            {spinner && <Spinner animation="grow" variant="success"></Spinner>}
            {spinner && <Spinner animation="grow" variant="success"></Spinner>}
            {spinner && <Spinner animation="grow" variant="success"></Spinner>}
            {spinner && <Spinner animation="grow" variant="success"></Spinner>}
          </div>
          <Table className={style.rlTable}>
            <thead>
              <tr>
                <th style={{ width: "10%" }}>No Golongan Obat</th>
                <th style={{ width: "12%" }}> </th>
                <th>Golongan Obat</th>
                <th>Rawat Jalan</th>
                <th>IGD</th>
                <th>Rawat Inap</th>
              </tr>
            </thead>

            <tbody>
              {dataRL.map((value, index) => {
                return (
                  <tr key={value.id}>
                    <td>
                      <input
                        type="text"
                        name="id"
                        className="form-control"
                        value={value.no_golongan_obat}
                        disabled={true}
                      />
                    </td>
                    <td
                      style={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      <ToastContainer />
                      {/* <RiDeleteBin5Fill  size={20} onClick={(e) => hapus(value.id)} style={{color: "gray", cursor: "pointer", marginRight: "5px"}} /> */}
                      {user.jenisUserId === 4 ? (
                        <div style={{ display: "flex" }}>
                          <button
                            className="btn btn-danger"
                            style={{
                              margin: "0 5px 0 0",
                              backgroundColor: "#FF6663",
                              border: "1px solid #FF6663",
                            }}
                            type="button"
                            onClick={(e) => deleteConfirmation(value.id)}
                          >
                            Hapus
                          </button>
                          {value.no_golongan_obat === "0" ? (
                            ""
                          ) : (
                            <Link
                              to={`/rl318/ubah/${value.id}`}
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
                      ) : (
                        <></>
                      )}
                    </td>
                    <td>{value.nama_golongan_obat}</td>
                    <td>
                      <center>{value.rawat_jalan}</center>
                    </td>
                    <td>
                      <center>{value.igd}</center>
                    </td>
                    <td>
                      <center>{value.rawat_inap}</center>
                    </td>
                  </tr>
                );
              })}
              {dataRL.length > 0 ? (
                <tr>
                  <td colSpan={1}>
                    <center>99</center>
                  </td>
                  <td colSpan={2}>
                    <center>TOTAL</center>
                  </td>
                  <td>
                    <center>{total_rawat_jalan}</center>
                  </td>
                  <td>
                    <center>{total_igd}</center>
                  </td>
                  <td>
                    <center>{total_rawat_inap}</center>
                  </td>
                </tr>
              ) : (
                <></>
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default RL318;
