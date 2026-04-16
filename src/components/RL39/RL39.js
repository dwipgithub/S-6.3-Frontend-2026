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
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

export const RL39 = () => {
  const [bulan, setBulan] = useState(1);
  const [tahun, setTahun] = useState("2026");
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
  const [activeTab, setActiveTab] = useState("tab1");
  const [statusValidasi, setStatusValidasi] = useState(0);
  const [keteranganValidasi, setKeteranganValidasi] = useState("");
  const [validasiId, setValidasiId] = useState(null);
  const [dataValidasi, setDataValidasi] = useState(null);
  const [submittedBulan, setSubmittedBulan] = useState(null);
  const [submittedTahun, setSubmittedTahun] = useState(null);
  const [submittedRumahSakit, setSubmittedRumahSakit] = useState(null);
  const tableRef = useRef(null);
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    setTotal();
    getBulan();
  }, []);

  useEffect(() => {
    if (activeTab === "tab2" && submittedRumahSakit && submittedRumahSakit.id && submittedBulan !== 0 && submittedTahun) {
      getValidasi();
    }
  }, [submittedBulan, submittedTahun, submittedRumahSakit, activeTab]);

  const refreshToken = async () => {
    try {
      const customConfig = {
        headers: {
          "XSRF-TOKEN": CSRFToken,
        },
      };
      const response = await axios.get("/apisirs6v2/token", customConfig);
      const accessToken = response.data.accessToken;
      setToken(accessToken);
      const decoded = jwt_decode(accessToken);
      setUser(decoded);
      if (decoded.jenisUserId === 2) {
        getKabKota(decoded.satKerId);
      } else if (decoded.jenisUserId === 3) {
        getRumahSakit(decoded.satKerId);
      } else if (decoded.jenisUserId === 4) {
        if (!rumahSakit || !rumahSakit.id) {
          showRumahSakit(decoded.satKerId, accessToken);
        }
      }

      setExpire(decoded.exp);
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
      key: "Februari",
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

  const showRumahSakit = async (id, tokenOverride) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: {
          Authorization: `Bearer ${tokenOverride || token}`,
        },
      });

      setRumahSakit(response.data.data);
    } catch (error) {}
  };

  const getRL = async (e) => {
    e.preventDefault();
    setSpinner(true);
    if (rumahSakit == null) {
      toast(`Rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
      setSpinner(false);
      return;
    }

    const filter = [];
    filter.push("filtered by nama: ".concat(rumahSakit.nama));
    filter.push("periode: ".concat(String(tahun).concat("-").concat(bulan)));
    setFilterLabel(filter);

    setValidasiId(null);
    setStatusValidasi(0);
    setKeteranganValidasi("");
    setDataValidasi(null);

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

      let sortedProducts = rlTigaTitikSembilanDetails.sort((p1, p2) =>
        p1.jenis_kegiatan_id > p2.jenis_kegiatan_id
          ? 1
          : p1.jenis_kegiatan_id < p2.jenis_kegiatan_id
          ? -1
          : 0
      );
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
      
      setSubmittedBulan(bulan);
      setSubmittedTahun(tahun);
      setSubmittedRumahSakit(rumahSakit);
      
      if (activeTab === "tab2") {
        getValidasi();
      }
    } catch (error) {
      console.log(error);
      setSpinner(false);
      toast("Gagal mengambil data RL", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
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
        `/apisirs6v2/rltigatitiksembilan/${id}`,
        customConfig
      );
      toast("Data Berhasil Dihapus", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
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

        const rlTigaTitikSembilanDetails = results.data.data.map((value) => {
          return value;
        });

        let sortedProducts = rlTigaTitikSembilanDetails.sort((p1, p2) =>
          p1.jenis_kegiatan_id > p2.jenis_kegiatan_id
            ? 1
            : p1.jenis_kegiatan_id < p2.jenis_kegiatan_id
            ? -1
            : 0
        );
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
        autoClose: 3000,
      });
    }
  };

  const getValidasi = async () => {
    try {
      if (!submittedRumahSakit || !submittedRumahSakit.id) {
        return;
      }
      const periode = String(submittedTahun).concat("-").concat(String(submittedBulan).padStart(2, "0"));
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: submittedRumahSakit.id,
          periode: periode,
        },
      };
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitiksembilanvalidasi",
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
      console.log(error);
      setValidasiId(null);
      setStatusValidasi(0);
      setKeteranganValidasi("");
      setDataValidasi(null);
    }
  };

  const statusValidasiChangeHadler = (e) => {
    setStatusValidasi(e.target.value);
  };

  const keteranganValidasiChangeHadler = (e) => {
    setKeteranganValidasi(e.target.value);
  };

  const simpanValidasi = async (e) => {
    e.preventDefault();

    if (!submittedRumahSakit || !submittedRumahSakit.id) {
      toast("Rumah sakit harus dipilih dan filter diterapkan terlebih dahulu", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
      return;
    }

    if (parseInt(statusValidasi, 10) === 0) {
      toast("Status harus dipilih terlebih dahulu", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
      return;
    }

    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };

      let payload = {
        statusValidasiId: parseInt(statusValidasi, 10),
      };

      if (user.jenisUserId !== 4) {
        payload.catatan = keteranganValidasi;
      }

      console.log("Payload yang dikirim:", payload);
      console.log("ValidasiId:", validasiId);

      if (validasiId) {
        const response = await axiosJWT.patch(
          `/apisirs6v2/rltigatitiksembilanvalidasi/${validasiId}`,
          payload,
          customConfig
        );

        console.log("Response PATCH:", response.data);

        toast("Data Validasi Berhasil Diperbarui", {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000,
        });

        setTimeout(() => {
          getValidasi();
        }, 1500);
      } else {
        let createPayload = {
          rsId: submittedRumahSakit.id,
          periode: String(submittedTahun).concat("-").concat(String(submittedBulan).padStart(2, "0")),
          jenisPeriode: 1,
          statusValidasiId: parseInt(statusValidasi, 10),
        };

        if (user.jenisUserId !== 4) {
          createPayload.catatan = keteranganValidasi;
        }

        const response = await axiosJWT.post(
          "/apisirs6v2/rltigatitiksembilanvalidasi",
          createPayload,
          customConfig
        );

        setValidasiId(response.data.data.id);

        toast("Data Validasi Berhasil Disimpan", {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000,
        });

        setTimeout(() => {
          getValidasi();
        }, 1500);
      }
    } catch (error) {
      console.log(error);

      toast(
        `Data tidak bisa disimpan karena: ${
          error.response?.data?.message || error.message
        }`,
        {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000,
        }
      );
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

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleDownloadExcel = () => {
    const header = ["No", "Jenis Kegiatan", "Jumlah"];
    const body = [];
    let counter = 1;

    dataRL.forEach(value => {
      if (value.groupNama != null) {
        value.details.forEach(value2 => {
          body.push([
            value2.no_jenis_kegiatan,
            value2.nama_jenis_kegiatan,
            value2.jumlah
          ]);
          counter++;
        });
      }
    });

    body.push(["99", "TOTAL", total]);

    downloadExcel({
      fileName: "RL_3_9",
      sheet: "Data RL 39",
      tablePayload: {
        header,
        body,
      },
    });
  };

  return (
    <div
      className="container"
      style={{ marginTop: "20px", marginBottom: "70px" }}
    >
      <ToastContainer autoClose={3000} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
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
                      className="form-select"
                      value={rumahSakit?.id || 0}
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
                      className="form-select"
                      value={rumahSakit?.id || 0}
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
                      className="form-select"
                      value={rumahSakit?.id || 0}
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
              <button type="submit" className={style.btnPrimary}>
                <HiSaveAs size={20} /> Terapkan
              </button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
      <div className="row">
        <div className="col-md-12">
            <h4 className={style.pageHeader}> RL. 3.9 - Radiologi</h4>
          <div className={style.toolbar}>
            {user.jenisUserId === 4 ? (
              <Link
                to={`/rl39/tambah/`}
                 type="button"
                 className={style.btnPrimary}
                 style={{ textDecoration: "none" }}
              >
                Tambah
              </Link>
            ) : (
              <></>
            )}
            <button
               type="button"
               className={style.btnPrimary}
              onClick={handleShow}
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

          {filterLabel.length > 0 ? (
            <div>
              <h5 style={{ fontSize: "14px" }}>
                filtered by{" "}
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

          <div>
            <ul className={`nav nav-tabs ${style.navTabs}`}>
              <li className={`nav-item ${style.navItem}`}>
                <button type="button" className={`${style.navLink} ${activeTab === "tab1" ? style.active : ""}`} onClick={() => handleTabClick("tab1")}>Data</button>
              </li>
              <li className={`nav-item ${style.navItem}`}>
                <button type="button" className={`${style.navLink} ${activeTab === "tab2" ? style.active : ""}`} onClick={() => handleTabClick("tab2")}>Validasi</button>
              </li>
            </ul>
            <div className={`tab-content ${style.tabContent}`}>
              <div className={`tab-pane fade ${activeTab === "tab1" ? "show active" : ""}`}>
                <div className={style["table-container"]}>
                   <table className={style["table"]} ref={tableRef}>
                      <thead className={style["thead"]}>
                <tr className="main-header-row">
                  <th
                    style={{ width: "6%" }}
                    rowSpan={2}
                    className={style["sticky-header-view"]}
                  >
                    No.
                  </th>
                  {user.jenisUserId === 4
                   ?
                  <th
                    style={{ width: "15%" }}
                    rowSpan={2}
                    className={style["sticky-header-view"]}
                  >
                    Aksi
                  </th>
                  : <>
                     </>
                      }
                  <th
                    style={{ width: "50%", textAlign: "center" }}
                    rowSpan={2}
                    className={style["sticky-header-view"]}
                  >
                    Jenis Kegiatan
                  </th>
                  <th
                    style={{ width: "22%" }}
                    rowSpan={2}
                    className={style["sticky-header-view"]}
                  >
                    Jumlah
                  </th>
                </tr>
              </thead>
              <tbody>
                {
                  //eslint-disable-next-line
                  dataRL.map((value, index) => {
                    if (value.groupNama != null) {
                      return (
                        <React.Fragment key={index}>
                          <tr
                            style={{
                              textAlign: "center",
                              backgroundColor: "#C4DFAA",
                              fontWeight: "bold",
                            }}
                          >
                            <td className={style["sticky-column"]}>
                              {value.groupNomor}
                            </td>
                            {user.jenisUserId === 4
                   ?
                            <td className={style["sticky-column"]}></td>
                            : <>
                     </>
                      }
                            <td className={style["sticky-column"]}>
                              {value.groupNama}
                            </td>
                            <td>{value.subTotal}</td>
                          </tr>
                          {value.details.map((value2, index2) => {
                            return (
                              <tr key={index2}>
                                <td className={style["sticky-column"]}>
                                  {value2.no_jenis_kegiatan}
                                </td>
                                {user.jenisUserId === 4
                   ?
                                <td
                                  className={style["sticky-column"]}
                                  style={{
                                    textAlign: "center",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                      className={style.btnDanger}
                                      type="button"
                                      onClick={(e) => hapus(value2.id)}
                                    >
                                      Hapus
                                    </button>
                                    {value2.nama_jenis_kegiatan !== "Tidak Ada Data" && (
                                      <Link
                                        to={`/rl39/ubah/${value2.id}`}
                                        className={style.btnWarning}
                                        style={{ textDecoration: "none" }}
                                      >
                                        Ubah
                                      </Link>
                                    )}
                                  </div>
                                </td>
                                : <>
                     </>
                      }
                                <td className={style["sticky-column"]}>
                                  &emsp;{value2.nama_jenis_kegiatan}
                                </td>
                                <td>{value2.jumlah}</td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    }
                  })
                }

                {dataRL.length > 0 ? (
                  <tr>
                    <td colSpan={1}>99</td>
                    {user.jenisUserId === 4 ?
                    <td colSpan={2}>TOTAL</td>
                    :
                    <td colSpan={1}>TOTAL</td>
                    }
                    <td>{total}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
                </div>
              </div>

              <div className={`tab-pane fade ${activeTab === "tab2" ? "show active" : ""}`}>
                <div className={style.validasiCard}>
                  <h3 className={style.validasiCardTitle}>Validasi RL 3.9</h3>

                  {dataRL.length === 0 ? (
                    <div
                      style={{
                        backgroundColor: "#fff3cd",
                        border: "1px solid #ffc107",
                        color: "#856404",
                        padding: "15px",
                        borderRadius: "4px",
                        textAlign: "center",
                      }}
                    >
                      <strong>Silahkan pilih Filter terlebih dahulu untuk melihat data.</strong>
                    </div>
                  ) : !dataValidasi && user.jenisUserId === 4 ? (
                    <div
                      style={{
                        backgroundColor: "#fff3cd",
                        border: "1px solid #ffc107",
                        color: "#856404",
                        padding: "15px",
                        borderRadius: "4px",
                        textAlign: "center",
                      }}
                    >
                      <strong>Data Belum di Validasi</strong>
                    </div>
                  ) : (
                    <>
                      {dataValidasi && (
                        <div
                          style={{
                            backgroundColor: "#f0f0f0",
                            padding: "12px",
                            borderRadius: "4px",
                            marginBottom: "15px",
                          }}
                        >
                          <div style={{ display: "flex", marginBottom: "4px" }}>
                            <div
                              style={{
                                width: "90px",
                                textAlign: "left",
                                paddingRight: "8px",
                                fontWeight: "600",
                              }}
                            >
                              Status
                            </div>
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

                          {(dataValidasi.keteranganValidasi || dataValidasi.catatan || dataValidasi.keterangan) && (
                            <div style={{ display: "flex", marginBottom: "4px" }}>
                              <div
                                style={{
                                  width: "90px",
                                  textAlign: "left",
                                  paddingRight: "8px",
                                  fontWeight: "600",
                                }}
                              >
                                Catatan
                              </div>
                              <div style={{ width: "10px" }}>:</div>
                              <div>
                                {dataValidasi.keteranganValidasi || dataValidasi.catatan || dataValidasi.keterangan}
                              </div>
                            </div>
                          )}

                          <div style={{ display: "flex" }}>
                            <div
                              style={{
                                width: "90px",
                                textAlign: "left",
                                paddingRight: "8px",
                                fontWeight: "600",
                              }}
                            >
                              Dibuat
                            </div>
                            <div style={{ width: "10px" }}>:</div>
                            <div>
                              {new Date(dataValidasi.createdAt).toLocaleDateString("id-ID")}
                            </div>
                          </div>
                        </div>
                      )}

                      {dataValidasi && dataValidasi.statusValidasiId === 3 ? (
                        <div
                          style={{
                            backgroundColor: "#fff3cd",
                            border: "1px solid #ffc107",
                            color: "#856404",
                            padding: "15px",
                            borderRadius: "4px",
                            textAlign: "center",
                          }}
                        >
                          <strong>Data telah divalidasi.</strong>
                        </div>
                      ) : (
                        <form onSubmit={simpanValidasi}>
                          <div className={style.validasiFormGroup}>
                            <label>Status</label>
                            <select value={statusValidasi} onChange={statusValidasiChangeHadler}>
                              <option value={0}>Pilih</option>
                              {user.jenisUserId === 4 ? (
                                <option value="2">Selesai Diperbaiki</option>
                              ) : (
                                <>
                                  <option value="1">Perlu Perbaikan</option>
                                  <option value="3">Disetujui</option>
                                </>
                              )}
                            </select>
                          </div>

                          {user.jenisUserId !== 4 && (
                            <div className={style.validasiFormGroup}>
                              <label>Catatan</label>
                              <textarea
                                onChange={keteranganValidasiChangeHadler}
                                rows={4}
                                value={keteranganValidasi}
                              />
                            </div>
                          )}

                          <button type="submit" className={style.btnPrimary}>
                            <HiSaveAs size={20} /> {validasiId ? "Perbarui" : "Simpan"}
                          </button>
                        </form>
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

export default RL39;
