import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./FormTambahRL39.module.css";
import { HiSaveAs } from "react-icons/hi";
import { RiDeleteBin5Fill, RiEdit2Fill } from "react-icons/ri";
import { AiFillFileAdd } from "react-icons/ai";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import { DownloadTableExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

export const RL39 = () => {
  const [bulan, setBulan] = useState(1);
  const [tahun, setTahun] = useState("2025");
  const [filterLabel, setFilterLabel] = useState([]);
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [rumahSakit, setRumahSakit] = useState("");
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});
  const [total, setTotal] = useState(0);
  const [spinner, setSpinner] = useState(false);
  const [namafile, setNamaFile] = useState("");
  const tableRef = useRef(null);
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    // getDataRS()
    // getRL39();
    setTotal();
    getBulan();
    // const getLastYear = async () => {
    //     const date = new Date()
    //     setTahun(date.getFullYear())
    //     return date.getFullYear()
    // }
    // getLastYear().then((results) => {

    // })
    // getCariTahun(202y2)

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

  const getBulan = async () => {
    const results = [];
    results.push({
      key: "Januari",
      value: "1",
    });
    results.push({
      key: "Febuari",
      value: "2",
    });
    results.push({
      key: "Maret",
      value: "3",
    });
    results.push({
      key: "April",
      value: "4",
    });
    results.push({
      key: "Mei",
      value: "5",
    });
    results.push({
      key: "Juni",
      value: "6",
    });
    results.push({
      key: "Juli",
      value: "7",
    });
    results.push({
      key: "Agustus",
      value: "8",
    });
    results.push({
      key: "September",
      value: "9",
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
    filter.push("filtered by nama: ".concat(rumahSakit.nama));
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
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitiksembilan",
        customConfig
      );

      console.log(results);

      const rlTigaTitikSembilanDetails = results.data.data.map((value) => {
        return value;
      });
      //   console.log(rlTigaTitikSembilanDetails)

      //   let dataRLTigaTitikSembilanDetails = [];
      //   rlTigaTitikSembilanDetails.forEach((element) => {
      //     element.forEach((value) => {
      //       dataRLTigaTitikSembilanDetails.push(value);
      //     });
      //   });
      let sortedProducts = rlTigaTitikSembilanDetails.sort((p1, p2) =>
        p1.jenis_kegiatan_id > p2.jenis_kegiatan_id
          ? 1
          : p1.jenis_kegiatan_id < p2.jenis_kegiatan_id
          ? -1
          : 0
      );
      // console.log(sortedProducts)
      let groups = [];
      sortedProducts.reduce(function (res, value) {
        if (!res[value.group_jenis_kegiatan_id]) {
          res[value.group_jenis_kegiatan_id] = {
            groupId: value.group_jenis_kegiatan_id,
            groupNama: value.nama_group_jenis_kegiatan,
            groupNo: value.no_group_jenis_kegiatan,
            jumlah: 0,
          };
          groups.push(res[value.group_jenis_kegiatan_id]);
        }
        res[value.group_jenis_kegiatan_id].jumlah += value.jumlah;

        return res;
      }, {});

      let data = [];
      groups.forEach((element) => {
        if (element.groupId != null) {
          const filterData = sortedProducts.filter((value, index) => {
            return value.group_jenis_kegiatan_id === element.groupId;
          });
          data.push({
            groupNo: element.groupId,
            groupNama: element.groupNama,
            groupNomor: element.groupNo,
            details: filterData,
            subTotal: element.jumlah,
          });
        }
      });

      const total = data.reduce((previousValue, currentValue) => {
        return previousValue + currentValue.subTotal;
      }, 0);
      setTotal(total);
      setDataRL(data);
      setNamaFile(
        "RL39_" +
          rumahSakit.id +
          "_".concat(String(tahun).concat("-").concat(bulan).concat("-01"))
      );
      setSpinner(false);
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
    const response = await axios.get("/apisirs6v2/token", customConfig);
    try {
      await axiosJWT.delete(
        `/apisirs6v2/rltigatitiksembilan/${id}`,
        customConfig
      );
      toast("Data Berhasil Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
      });
      // getRL()
      // setDataRL((current) =>
      //     current.filter((value) => value.id !== id)
      // )
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
        const results = await axiosJWT.get(
          "/apisirs6v2/rltigatitiksembilan",
          customConfig
        );

        console.log(results);

        const rlTigaTitikSembilanDetails = results.data.data.map((value) => {
          return value;
        });
        //   console.log(rlTigaTitikSembilanDetails)

        //   let dataRLTigaTitikSembilanDetails = [];
        //   rlTigaTitikSembilanDetails.forEach((element) => {
        //     element.forEach((value) => {
        //       dataRLTigaTitikSembilanDetails.push(value);
        //     });
        //   });
        let sortedProducts = rlTigaTitikSembilanDetails.sort((p1, p2) =>
          p1.jenis_kegiatan_id > p2.jenis_kegiatan_id
            ? 1
            : p1.jenis_kegiatan_id < p2.jenis_kegiatan_id
            ? -1
            : 0
        );
        // console.log(sortedProducts)
        let groups = [];
        sortedProducts.reduce(function (res, value) {
          if (!res[value.group_jenis_kegiatan_id]) {
            res[value.group_jenis_kegiatan_id] = {
              groupId: value.group_jenis_kegiatan_id,
              groupNama: value.nama_group_jenis_kegiatan,
              groupNo: value.no_group_jenis_kegiatan,
              jumlah: 0,
            };
            groups.push(res[value.group_jenis_kegiatan_id]);
          }
          res[value.group_jenis_kegiatan_id].jumlah += value.jumlah;

          return res;
        }, {});

        let data = [];
        groups.forEach((element) => {
          if (element.groupId != null) {
            const filterData = sortedProducts.filter((value, index) => {
              return value.group_jenis_kegiatan_id === element.groupId;
            });
            data.push({
              groupNo: element.groupId,
              groupNama: element.groupNama,
              groupNomor: element.groupNo,
              details: filterData,
              subTotal: element.jumlah,
            });
          }
        });

        const total = data.reduce((previousValue, currentValue) => {
          return previousValue + currentValue.subTotal;
        }, 0);
        setTotal(total);
        setDataRL(data);
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      console.log(error);
      toast("Data Gagal Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  const hapus = (id) => {
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

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      <h4 style={{ color: "grey" }}>
        {" "}
        <span> RL 3.9-Radiologi</span>
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
          <div style={{ marginBottom: "10px" }}>
            {user.jenisUserId === 4 ? (
              <Link
                className="btn"
                to={`/rl39/tambah/`}
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
              sheet="Data RL 39"
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

          <div>
            <h5 style={{ fontSize: "14px" }}>
              {filterLabel
                .map((value) => {
                  return value;
                })
                .join(", ")}
            </h5>
          </div>
          <div className="row mt-3 mb-3">
            <div className="col-md-12">
              <div className="container" style={{ textAlign: "center" }}>
                {spinner && (
                  <Spinner animation="grow" variant="success"></Spinner>
                )}
                {spinner && (
                  <Spinner animation="grow" variant="success"></Spinner>
                )}
                {spinner && (
                  <Spinner animation="grow" variant="success"></Spinner>
                )}
                {spinner && (
                  <Spinner animation="grow" variant="success"></Spinner>
                )}
                {spinner && (
                  <Spinner animation="grow" variant="success"></Spinner>
                )}
                {spinner && (
                  <Spinner animation="grow" variant="success"></Spinner>
                )}
              </div>
              <table className={style.rlTable} ref={tableRef}>
                <thead>
                  <tr>
                    <th style={{ width: "6%" }}>No</th>
                    <th style={{ width: "12%" }}> </th>
                    {/* <th style={{"width": "7%"}}>No Kegiatan</th> */}
                    <th>Jenis Kegiatan</th>
                    <th>Jumlah</th>
                  </tr>
                </thead>

                <tbody>
                  {
                    // eslint-disable-next-line
                    dataRL.map((value, index) => {
                      // const sum = dataRL.reduce((accumulator, object) => {
                      //   return accumulator + object.subTotal;
                      // }, 0);

                      // console.log(sum);

                      if (value.groupNama != null) {
                        return (
                          <React.Fragment key={index}>
                            <tr>
                              <td>{value.groupNomor}</td>
                              <td></td>
                              <td style={{ textAlign: "left" }}>
                                {value.groupNama}
                              </td>
                              <td>{value.subTotal}</td>
                            </tr>
                            {value.details.map((value2, index2) => {
                              return (
                                <tr key={index2}>
                                  <td>{value2.no_jenis_kegiatan}</td>
                                  <td>
                                    <ToastContainer />
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
                                          onClick={(e) => hapus(value2.id)}
                                        >
                                          Hapus
                                        </button>
                                        {value2.no_jenis_kegiatan === "0" ? (
                                          ""
                                        ) : (
                                          <Link
                                            to={`/rl39/ubah/${value2.id}`}
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
                                  <td style={{ textAlign: "left" }}>
                                    &emsp;{value2.nama_jenis_kegiatan}
                                  </td>
                                  <td>{value2.jumlah}</td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      } else if (value.groupNama == null) {
                        return (
                          <React.Fragment key={index}>
                            <tr>
                              <td style={{ textAlign: "left" }}>
                                {value.details[0].nama}
                              </td>
                              <td>{value.details[0].nilai}</td>
                            </tr>
                          </React.Fragment>
                        );
                      }
                    })
                  }

                  {dataRL.length > 0 ? (
                    <tr>
                      <td colSpan={1}>99</td>
                      <td colSpan={2}>TOTAL</td>
                      <td>{total}</td>
                    </tr>
                  ) : (
                    <></>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RL39;
