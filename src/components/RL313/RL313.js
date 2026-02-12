import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./FormTambahRL313.module.css";
import { HiSaveAs } from "react-icons/hi";
import { confirmAlert } from "react-confirm-alert";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import { DownloadTableExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const RL313 = () => {
  const [tahun, setTahun] = useState("2025");
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
  // const [dataHeader, setdataHeader] = useState([]);
  const [totalall, settotalall] = useState(0);
  // const [totalmedis, settotalmedis] = useState(0);
  // const [totalfisoterapi, settotalfisioterapi] = useState(0);
  // const [totalokupasiterapi, settotalokupasiterapi] = useState(0);
  // const [totalterapiwicara, settotalterapiwicara] = useState(0);
  // const [totalpsikologi, settotalpsikologi] = useState(0);
  // const [totalsosialmedik, settotalsosialmedik] = useState(0);
  // const [totalortotikprostetik, settotalortotikprostetik] = useState(0);

  const navigate = useNavigate();
  const tableRef = useRef(null);
  const [namafile, setNamaFile] = useState("");
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    // const getLastYear = async () => {
    //   const date = new Date();
    //   // setTahun(date.getFullYear() - 1);
    //   // return date.getFullYear() - 1;
    //   setTahun(date.getFullYear());
    //   return date.getFullYear();
    // };
    // getLastYear().then((results) => {});

    // getRLTigaTitikTigaTemplate()
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

  const handleClose = () => setShow(false);

  const handleShow = () => {
    const jenisUserId = user.jenisUserId;
    const satKerId = user.satKerId;
    switch (jenisUserId) {
      case 1:
        getProvinsi();
        setShow(true);
        break;
      case 2:
        getKabKota(satKerId);
        setShow(true);
        break;
      case 3:
        getRumahSakit(satKerId);
        setShow(true);
        break;
      case 4:
        showRumahSakit(satKerId);
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
        "/apisirs6v2/rltigatitiktigabelas",
        customConfig
      );

      const rlTigaTitikTigaBelasDetails = results.data.data.map((value) => {
        return value;
      });
      setDataRL(rlTigaTitikTigaBelasDetails);

      let dataRLTigaTitikTigaBelasDetails = [];

      let totalMedis = 0;
      let totalFisioterapi = 0;
      let totalOkupasiterapi = 0;
      let totalTerapiWicara = 0;
      let totalPsikologi = 0;
      let totalSosialMedik = 0;
      let totalOrtotikProstetik = 0;

      rlTigaTitikTigaBelasDetails.forEach((element) => {
        dataRLTigaTitikTigaBelasDetails.push(element);
        switch (element.kelompok_id) {
          case 1:
            totalMedis += element.jumlah;
            break;
          case 2:
            totalFisioterapi += element.jumlah;
            break;
          case 3:
            totalOkupasiterapi += element.jumlah;
            break;
          case 4:
            totalTerapiWicara += element.jumlah;
            break;
          case 5:
            totalPsikologi += element.jumlah;
            break;
          case 6:
            totalSosialMedik += element.jumlah;
            break;
          case 7:
            totalOrtotikProstetik += element.jumlah;
            break;
          default:
            break;
        }
      });

      let totalALL =
        totalMedis +
        totalFisioterapi +
        totalOkupasiterapi +
        totalTerapiWicara +
        totalPsikologi +
        totalSosialMedik +
        totalOrtotikProstetik;
      // settotalmedis(totalMedis);
      // settotalfisioterapi(totalFisioterapi);
      // settotalokupasiterapi(totalOkupasiterapi);
      // settotalterapiwicara(totalTerapiWicara);
      // settotalpsikologi(totalPsikologi);
      // settotalsosialmedik(totalSosialMedik);
      // settotalortotikprostetik(totalOrtotikProstetik);
      settotalall(totalALL);

      let sortedProducts = dataRLTigaTitikTigaBelasDetails.sort((p1, p2) =>
        p1.jenis_tindakan_id > p2.jenis_tindakan_id ? 1 : -1
      );
      let groups = [];
      sortedProducts.reduce(function (res, value) {
        if (!res[value.kelompok_id]) {
          res[value.kelompok_id] = {
            groupId: value.kelompok_id,
            groupNama: value.nama_kelompok_jenis_tindakan,
            jumlah: 0,
          };
          groups.push(res[value.kelompok_id]);
        }
        res[value.kelompok_id].jumlah += value.jumlah;
        return res;
      }, {});

      let data = [];
      groups.forEach((element) => {
        if (element.groupId != null) {
          const filterData = sortedProducts.filter((value, index) => {
            return value.kelompok_id === element.groupId;
          });
          data.push({
            groupNo: element.groupId,
            groupNama: element.groupNama,
            details: filterData,
            subTotal: element.jumlah,
          });
        }
      });

      setDataRL(data);
      setNamaFile("RL313_" + rumahSakit.id + "_".concat(String(tahun)));

      setRumahSakit(null);
      handleClose();
    } catch (error) {
      console.log(error);
    }
  };

  const deleteRL = async (idtindakan) => {
    const customConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "XSRF-TOKEN": CSRFToken,
      },
    };
    try {
      await axiosJWT.delete(
        `/apisirs6v2/rltigatitiktigabelas/${idtindakan}`,
        customConfig
      );
      toast("Data Berhasil Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
      });
      try {
        const satKerId = user.satKerId;
        const customConfig = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          params: {
            rsId: satKerId,
            periode: String(tahun),
          },
        };
        const results = await axiosJWT.get(
          "/apisirs6v2/rltigatitiktigabelas",
          customConfig
        );

        const rlTigaTitikTigaBelasDetails = results.data.data.map((value) => {
          return value;
        });
        setDataRL(rlTigaTitikTigaBelasDetails);

        let dataRLTigaTitikTigaBelasDetails = [];

        let totalMedis = 0;
        let totalFisioterapi = 0;
        let totalOkupasiterapi = 0;
        let totalTerapiWicara = 0;
        let totalPsikologi = 0;
        let totalSosialMedik = 0;
        let totalOrtotikProstetik = 0;

        rlTigaTitikTigaBelasDetails.forEach((element) => {
          dataRLTigaTitikTigaBelasDetails.push(element);
          switch (element.kelompok_id) {
            case 1:
              totalMedis += element.jumlah;
              break;
            case 2:
              totalFisioterapi += element.jumlah;
              break;
            case 3:
              totalOkupasiterapi += element.jumlah;
              break;
            case 4:
              totalTerapiWicara += element.jumlah;
              break;
            case 5:
              totalPsikologi += element.jumlah;
              break;
            case 6:
              totalSosialMedik += element.jumlah;
              break;
            case 7:
              totalOrtotikProstetik += element.jumlah;
              break;
            default:
              break;
          }
        });

        let totalALL =
          totalMedis +
          totalFisioterapi +
          totalOkupasiterapi +
          totalTerapiWicara +
          totalPsikologi +
          totalSosialMedik +
          totalOrtotikProstetik;
        // settotalmedis(totalMedis);
        // settotalfisioterapi(totalFisioterapi);
        // settotalokupasiterapi(totalOkupasiterapi);
        // settotalterapiwicara(totalTerapiWicara);
        // settotalpsikologi(totalPsikologi);
        // settotalsosialmedik(totalSosialMedik);
        // settotalortotikprostetik(totalOrtotikProstetik);
        settotalall(totalALL);

        let sortedProducts = dataRLTigaTitikTigaBelasDetails.sort((p1, p2) =>
          p1.jenis_tindakan_id > p2.jenis_tindakan_id ? 1 : -1
        );
        let groups = [];
        sortedProducts.reduce(function (res, value) {
          if (!res[value.kelompok_id]) {
            res[value.kelompok_id] = {
              groupId: value.kelompok_id,
              groupNama: value.nama_kelompok_jenis_tindakan,
              jumlah: 0,
            };
            groups.push(res[value.kelompok_id]);
          }
          res[value.kelompok_id].jumlah += value.jumlah;
          return res;
        }, {});

        let data = [];
        groups.forEach((element) => {
          if (element.groupId != null) {
            const filterData = sortedProducts.filter((value, index) => {
              return value.kelompok_id === element.groupId;
            });
            data.push({
              groupNo: element.groupId,
              groupNama: element.groupNama,
              details: filterData,
              subTotal: element.jumlah,
            });
          }
        });

        setDataRL(data);
        setRumahSakit(null);
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

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
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
              style={{ width: "100%", display: "inline-block" }}
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
            <h4>RL 3.13 - Rehabilitasi Medik</h4>
          </span>
          <div style={{ marginBottom: "10px" }}>
            {user.jenisUserId === 4 ? (
              <Link
                className="btn"
                to={`/rl313/tambah/`}
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
              sheet="data RL 313"
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
              {filterLabel.length > 0 ? (
                <>
                  filtered by{" "}
                  {filterLabel
                    .map((value) => {
                      return value;
                    })
                    .join(", ")}
                </>
              ) : (
                <></>
              )}
            </h5>
          </div>
          <Table
            className={style.rlTable}
            striped
            responsive
            style={{ width: "100%" }}
            ref={tableRef}
          >
            <thead>
              <tr>
                <th style={{ width: "2%" }}>No.</th>
                <th style={{ width: "2%" }}>Aksi</th>
                <th style={{ width: "10%" }}>Jenis Tindakan</th>
                <th style={{ width: "5%" }}>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {dataRL.map((value, index) => {
                return (
                  <React.Fragment key={index}>
                    <tr className="table-primary">
                      {value.groupNo === 8 && (
                        <td
                          style={{
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          -
                        </td>
                      )}
                      {value.groupNo !== 8 && (
                        <td
                          style={{
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          <strong>{value.groupNo}</strong>
                        </td>
                      )}
                      <td></td>
                      <td
                        style={{
                          textAlign: "left",
                          verticalAlign: "middle",
                        }}
                      >
                        <strong>{value.groupNama}</strong>
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        <strong>{value.subTotal}</strong>
                      </td>
                    </tr>
                    {value.details.map((value2, index2) => {
                      return (
                        <tr key={index2}>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            {value2.jenis_tindakan_no}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <ToastContainer />
                            {user.jenisUserId === 4 ? (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
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
                                  onClick={(e) => deleteConfirmation(value2.id)}
                                >
                                  Hapus
                                </button>

                                {value2.jenis_tindakan_no != 88 ? (
                                  <Link
                                    to={`/rl313/edit/${value2.id}`}
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
                                ) : (
                                  <></>
                                )}
                              </div>
                            ) : (
                              <></>
                            )}
                          </td>
                          <td style={{ textAlign: "left" }}>
                            &emsp;
                            {value2.nama_jenis_tindakan}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            {value2.jumlah}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {dataRL.length > 0 ? (
                <tr>
                  <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                    <h6>99</h6>
                  </td>
                  <td></td>
                  <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                    <h6>TOTAL</h6>
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    {totalall}
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

export default RL313;
