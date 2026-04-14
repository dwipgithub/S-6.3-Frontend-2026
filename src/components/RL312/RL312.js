import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL312.module.css";
import { HiSaveAs } from "react-icons/hi";
import { confirmAlert } from "react-confirm-alert";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const RL312 = () => {
  // const [tahun, setTahun] = useState("");
  const [bulan, setBulan] = useState(1);
  // const [tahun, setTahun] = useState("2025");
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [filterLabel, setFilterLabel] = useState([]);
  const [rumahSakit, setRumahSakit] = useState(null);
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const [totalkhusus, settotalkhusus] = useState(0);
  const [totalbesar, settotalbesar] = useState(0);
  const [totalsedang, settotalsedang] = useState(0);
  const [totalkecil, settotalkecil] = useState(0);
  const [totalall, settotalall] = useState(0);
  const tableRef = useRef(null);
  const [namafile, setNamaFile] = useState("");
  const [spinner, setSpinner] = useState(false);

  // untuk validasi
  const [idValidasi, setidValidasi] = useState("");
  const [idValidasiSubmited, setidValidasiSubmited] = useState("");
  const [statusValidasi, setStatusValidasi] = useState(1);
  const [keteranganValidasi, setKeteranganValidasi] = useState("");
  const [tglValidasi, setTglValidasi] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [loadingRS, setLoadingRS] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();
  const [selectedRsID, setSelectedRsID] = useState(null);

  useEffect(() => {
    refreshToken();
    getBulan();
    // const getLastYear = async () => {
    //   const date = new Date();
    //   setTahun(date.getFullYear());
    //   return date.getFullYear();
    //   // setTahun(date.getFullYear() - 1);
    //   // return date.getFullYear() - 1;
    // };
    // getLastYear().then((results) => {
    //   // getDataRLTigaTitikDuaBelas(results);
    // });
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

  // const rumahSakitChangeHandler = (e) => {
  //   const rsId = e.target.value;
  //   showRumahSakit(rsId);
  // };

  const handleSelectRumahSakit = (e) => {
    const id = e.target.value;
    const selected = daftarRumahSakit.find((item) => item.id == id);

    if (selected) {
      setSelectedRsID(selected.id);
      setRumahSakit(selected);
    } else {
      setSelectedRsID(null);
      setRumahSakit(null);
    }
  };

  const getRumahSakit = async (kabKotaId) => {
    setLoadingRS(true);
    setDaftarRumahSakit([]);

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

    setLoadingRS(false);
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

    if (user.jenisUserId == 3) {
      if (!selectedRsID) {
        toast(`rumah sakit harus dipilih`, {
          position: toast.POSITION.TOP_RIGHT,
        });
        return;
      }
    }

    if (!rumahSakit || !rumahSakit.id) {
      toast(`Rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }
    const filter = [];
    filter.push("Nama Rumah Sakit: ".concat(rumahSakit.nama));
    filter.push("Periode ".concat(String(tahun).concat("-").concat(bulan)));
    setFilterLabel(filter);
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rumahSakit.id,
          // periode: String(tahun),
          periode: String(tahun).concat("-").concat(bulan),
        },
      };
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitikduabelas",
        customConfig,
      );

      // const rlTigaTitikDuaBelasDetails = results.data.data.map((value) => {
      //   return value;
      // });

      const rlTigaTitikDuaBelasDetails = results.data.data;

      let dataRLTigaTitikDuaBelasDetails = [];
      let totalKhusus = 0;
      let totalBesar = 0;
      let totalKecil = 0;
      let totalSedang = 0;
      rlTigaTitikDuaBelasDetails.forEach((element) => {
        // element.forEach((value) => {
        totalKhusus += element.khusus || 0;
        totalBesar += element.besar || 0;
        totalSedang += element.sedang || 0;
        totalKecil += element.kecil || 0;
        dataRLTigaTitikDuaBelasDetails.push(element);
        // });
      });

      let totalALL = totalKhusus + totalBesar + totalSedang + totalKecil;
      settotalkhusus(totalKhusus);
      settotalbesar(totalBesar);
      settotalsedang(totalSedang);
      settotalkecil(totalKecil);
      settotalall(totalALL);
      // setDataRL(dataRLTigaTitikDuaBelasDetails);

      setDataRL(rlTigaTitikDuaBelasDetails);
      setIsFilterApplied(true);

      setNamaFile(
        "RL312_" +
          rumahSakit.id +
          "_".concat(String(tahun).concat("-").concat(bulan).concat("-01")),
      );
      // setRumahSakit(null);
      await getValidasi();
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
        `/apisirs6v2/rltigatitikduabelas/${id}`,
        customConfig,
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

  const changeHandler = (event, index) => {
    let newDataRL = [...dataRL];
    const name = event.target.name;
    if (name === "check") {
      if (event.target.checked === true) {
        newDataRL[index].disabledInput = false;
      } else if (event.target.checked === false) {
        newDataRL[index].disabledInput = true;
      }
      newDataRL[index].checked = event.target.checked;
    } else if (name === "Total") {
      newDataRL[index].Total = event.target.value;
    } else if (name === "Khusus") {
      newDataRL[index].Khusus = event.target.value;
    } else if (name === "Besar") {
      newDataRL[index].Besar = event.target.value;
    } else if (name === "Sedang") {
      newDataRL[index].Sedang = event.target.value;
    } else if (name === "Kecil") {
      newDataRL[index].Kecil = event.target.value;
    }
    setDataRL(newDataRL);
  };

  function handleDownloadExcel() {
    const header = [
      "No",
      "Kode",
      "Jenis Pelayanan",
      "Khusus",
      "Besar",
      "Sedang",
      "Kecil",
      "Total",
    ];

    const body = dataRL.map((value, index) => {
      const total =
        (value.khusus || 0) +
        (value.besar || 0) +
        (value.sedang || 0) +
        (value.kecil || 0);

      return [
        index + 1,
        value.jenis_pelayanan_rl_tiga_titik_dua_belas?.no,
        value.jenis_pelayanan_rl_tiga_titik_dua_belas?.nama,
        value.khusus,
        value.besar,
        value.sedang,
        value.kecil,
        total,
      ];
    });

    // downloadExcel({
    //   fileName: "RL_3_12",
    //   sheet: "RL312",
    //   tablePayload: {
    //     header,
    //     body: body,
    //   },
    // });

    downloadExcel({
      fileName: namafile || "RL_3_12",
      sheet: "RL312",
      tablePayload: {
        header,
        body,
      },
    });
  }

  const getValidasi = async () => {
    setSpinner(true);
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rumahSakit.id,
          periode: tahun,
        },
      };
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitikduabelasvalidasi",
        customConfig,
      );

      if (results.data.data != null && results.data.data.length > 0) {
        setidValidasi(results.data.data[0].id);
        setidValidasiSubmited(results.data.data[0].statusValidasiId);

        // 🔥 INI KUNCI
        if (user.jenisUserId === 3) {
          setStatusValidasi(1);
        } else if (user.jenisUserId === 4) {
          setStatusValidasi(2);
        } else {
          setStatusValidasi("");
        }

        setKeteranganValidasi(results.data.data[0].catatan || "");
        setTglValidasi(results.data.data[0].modifiedAt);
        setIsValidated(results.data.data[0].statusValidasiId === 3);
      } else {
        setidValidasi("");
        setStatusValidasi(1);
        setKeteranganValidasi("");
        setTglValidasi("");
        setIsValidated(false);
      }
    } catch (error) {
      console.log(error);
    }
    setSpinner(false);
  };

  const statusValidasiChangeHadler = (e) => {
    setStatusValidasi(Number(e.target.value));
  };

  const keteranganValidasiChangeHadler = (e) => {
    setKeteranganValidasi(e.target.value);
  };

  const simpanValidasi = async (e) => {
    setSpinner(true);
    e.preventDefault();
    if (rumahSakit == null) {
      toast(`Rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      setSpinner(false);
      return;
    }

    if (statusValidasi == 1 && keteranganValidasi == "") {
      toast(`Keterangan tidak boleh kosong`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      setSpinner(false);
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

      if (idValidasi != "") {
        await axiosJWT.patch(
          "/apisirs6v2/rltigatitikduabelasvalidasi/" + idValidasi,
          {
            statusValidasiId:
              statusValidasi === "" || statusValidasi === null
                ? idValidasiSubmited
                : Number(statusValidasi),
            catatan: keteranganValidasi,
          },
          customConfig,
        );
      } else {
        await axiosJWT.post(
          "/apisirs6v2/rltigatitikduabelasvalidasi",
          {
            rsId: rumahSakit.id,
            periode: `${tahun}-12-01`,
            statusValidasiId:
              statusValidasi === "" || statusValidasi === null
                ? idValidasiSubmited
                : Number(statusValidasi),
            catatan: keteranganValidasi,
          },
          customConfig,
        );
      }
      toast("Data Berhasil Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setIsValidated(statusValidasi == 3);
      await getValidasi();
    } catch (error) {
      toast(`Data tidak bisa disimpan karena ,${error.response.data.message}`, {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
    setSpinner(false);
  };

  const [activeTab, setActiveTab] = useState("tab1");

  const handleTabClick = (tab) => {
    if (tab === "tab2") {
      getValidasi();
    }
    setActiveTab(tab);
  };

  return (
    <div
      className="container"
      style={{ marginTop: "20px", marginBottom: "70px" }}
    >
      {spinner && (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 9999,
            backgroundColor: "rgba(255, 255, 255, 0.7)",
          }}
        >
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      <ToastContainer />
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>

        <form onSubmit={getRL}>
          <Modal.Body>
            {user.jenisUserId === 1 || user.jenisUserId === 99 ? (
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
                    className="form-select"
                    value={selectedRsID || ""}
                    onChange={handleSelectRumahSakit}
                  >
                    <option key={0} value={0}>
                      {loadingRS ? "Loading..." : "Pilih"}
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
                    className="form-select"
                    value={selectedRsID || ""}
                    onChange={handleSelectRumahSakit}
                  >
                    <option key={0} value={0}>
                      {loadingRS ? "Loading..." : "Pilih"}
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
                    className="form-select"
                    value={selectedRsID || ""}
                    onChange={handleSelectRumahSakit}
                  >
                    <option key={0} value={0}>
                      {loadingRS ? "Loading..." : "Pilih"}
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
              <button type="submit" className={style.btnPrimary}>
                <HiSaveAs size={20} /> Terapkan
              </button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>

      {/* RL 3.12 - Pembedahan */}
      <div className="row">
        <div className="col-md-12">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className={style.pageHeader}>RL 3.12 - Pembedahan</h4>
          </div>

          <div className={style.toolbar}>
            {user.jenisUserId === 4 ? (
              <Link
                to={`/rl312/tambah/`}
                className={style.btnPrimary}
                style={{ textDecoration: "none" }}
              >
                Tambah
              </Link>
            ) : (
              <></>
            )}
            <button className={style.btnPrimary} onClick={handleShow}>
              Filter
            </button>
            <button className={style.btnPrimary} onClick={handleDownloadExcel}>
              Download
            </button>
          </div>

          <div className={style.filterLabel}>
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
          </div>

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
              {user.jenisUserId === 1 ||
              user.jenisUserId === 2 ||
              user.jenisUserId === 3 ||
              user.jenisUserId === 4 ? (
                //   &&
                // dataRL.length > 0 &&
                // rumahSakit != null
                <li className={`nav-item ${style.navItem}`}>
                  <button
                    type="button"
                    className={`${style.navLink} ${activeTab === "tab2" ? style.active : ""}`}
                    onClick={() => handleTabClick("tab2")}
                  >
                    Validasi
                  </button>
                </li>
              ) : null}
            </ul>

            <div className={`tab-content ${style.tabContent}`}>
              <div
                className={`tab-pane fade ${
                  activeTab === "tab1" ? "show active" : ""
                }`}
              >
                <div className={style["table-container"]}>
                  <table
                    className={style["table"]}
                    ref={tableRef}
                    style={{ width: "100%", tableLayout: "fixed" }}
                  >
                    <thead className={style["thead"]}>
                      <tr className="main-header-row">
                        <th
                          className={style["sticky-header-view"]}
                          style={{ width: "4%", verticalAlign: "middle" }}
                          rowSpan={3}
                        >
                          No
                        </th>
                        {user.jenisUserId === 4 && (
                          <th
                            className={style["sticky-header-view"]}
                            style={{ verticalAlign: "middle" }}
                          >
                            Aksi
                          </th>
                        )}
                        <th
                          className={style["sticky-header-view"]}
                          style={{ verticalAlign: "middle" }}
                        >
                          Jenis Spesialisasi
                        </th>
                        <th
                          className={style["sticky-header-view"]}
                          style={{ verticalAlign: "middle" }}
                        >
                          Khusus
                        </th>
                        <th
                          className={style["sticky-header-view"]}
                          style={{ verticalAlign: "middle" }}
                        >
                          Besar
                        </th>
                        <th
                          className={style["sticky-header-view"]}
                          style={{ verticalAlign: "middle" }}
                        >
                          Sedang
                        </th>
                        <th
                          className={style["sticky-header-view"]}
                          style={{ verticalAlign: "middle" }}
                        >
                          Kecil
                        </th>
                        <th
                          className={style["sticky-header-view"]}
                          style={{ verticalAlign: "middle" }}
                        >
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataRL.map((value, index) => {
                        console.log(value);
                        return (
                          <tr key={value.id}>
                            <td className={style["sticky-column-view"]}>
                              {index + 1}
                            </td>

                            {user.jenisUserId === 4 && (
                              <td className={style["sticky-column-view"]}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "center",
                                  }}
                                >
                                  {/* Tombol Hapus tetap ada */}
                                  <button
                                    className="btn btn-danger"
                                    style={{
                                      margin: "0 5px 0 0",
                                      backgroundColor: "#FF6663",
                                      border: "1px solid #FF6663",
                                    }}
                                    type="button"
                                    onClick={() => deleteConfirmation(value.id)}
                                  >
                                    Hapus
                                  </button>

                                  {value.id !== 88 &&
                                    value.nama_spesialisasi !==
                                      "Tidak Ada Data" && (
                                      <Link
                                        to={`/rl312/edit/${value.id}`}
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
                            )}

                            <td style={{ textAlign: "left" }}>
                              {value.nama_spesialisasi}
                            </td>

                            <td style={{ textAlign: "center" }}>
                              {value.khusus}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {value.besar}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {value.sedang}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {value.kecil}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {value.total}
                            </td>
                          </tr>
                        );
                      })}

                      {/* TOTAL */}
                      {dataRL.length > 0 && (
                        <tr>
                          <td
                            colSpan={user.jenisUserId === 4 ? 3 : 2}
                            style={{
                              textAlign: "center",
                              fontWeight: "bold",
                            }}
                          >
                            TOTAL
                          </td>

                          <td style={{ textAlign: "center" }}>{totalkhusus}</td>
                          <td style={{ textAlign: "center" }}>{totalbesar}</td>
                          <td style={{ textAlign: "center" }}>{totalsedang}</td>
                          <td style={{ textAlign: "center" }}>{totalkecil}</td>
                          <td style={{ textAlign: "center" }}>{totalall}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div
              className={`tab-pane fade ${
                activeTab === "tab2" ? "show active" : ""
              }`}
            >
              <div className={style.validasiCard}>
                <h3 className={style.validasiCardTitle}>Validasi RL 3.12</h3>
                {!isFilterApplied ? (
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
                    <strong>
                      Silakan pilih filter terlebih dahulu untuk menampilkan
                      data.
                    </strong>
                  </div>
                ) : idValidasi ? (
                  <div
                    style={{
                      backgroundColor: "#E9ECEF",
                      padding: "15px",
                      borderRadius: "5px",
                      marginBottom: "20px",
                    }}
                  >
                    <p style={{ margin: "0" }}>
                      <strong
                        style={{ width: "100px", display: "inline-block" }}
                      >
                        Status
                      </strong>
                      :{" "}
                      {idValidasiSubmited == 1
                        ? "Perlu Perbaikan"
                        : idValidasiSubmited == 2
                          ? "Selesai Diperbaiki"
                          : "Disetujui"}
                    </p>
                    <p style={{ margin: "0" }}>
                      <strong
                        style={{ width: "100px", display: "inline-block" }}
                      >
                        Catatan
                      </strong>
                      : {keteranganValidasi || "-"}
                    </p>
                    <p style={{ margin: "0" }}>
                      <strong
                        style={{ width: "100px", display: "inline-block" }}
                      >
                        Tanggal
                      </strong>
                      :{" "}
                      {tglValidasi
                        ? new Date(tglValidasi).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })
                        : "-"}
                    </p>
                  </div>
                ) : (
                  user.jenisUserId !== 3 && (
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
                      <strong>Data Belum Divalidasi</strong>
                    </div>
                  )
                )}

                {dataRL.length > 0 && rumahSakit?.id ? (
                  isValidated ? (
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
                      <div className="text-center">
                        <strong>Data Telah Divalidasi</strong>
                      </div>
                    </div>
                  ) : (
                    (user.jenisUserId === 3 ||
                      (user.jenisUserId === 4 && idValidasi)) && (
                      <form onSubmit={simpanValidasi}>
                        <ToastContainer />

                        <div className={style.validasiFormGroup}>
                          <label htmlFor="statusValidasi">Status</label>
                          <select
                            id="statusValidasi"
                            name="statusValidasi"
                            value={statusValidasi}
                            required
                            onChange={(e) => statusValidasiChangeHadler(e)}
                          >
                            {user.jenisUserId === 4 ? (
                              <>
                                <option value="">Pilih Status</option>
                                <option value="2">Selesai Diperbaiki</option>
                              </>
                            ) : (
                              <>
                                <option value="1">Perlu Perbaikan</option>
                                <option value="3">Disetujui</option>
                              </>
                            )}
                          </select>
                        </div>

                        {user.jenisUserId === 3 ? (
                          <>
                            <div className={style.validasiFormGroup}>
                              <label htmlFor="keteranganValidasi">
                                Catatan
                              </label>
                              <textarea
                                id="keteranganValidasi"
                                name="keteranganValidasi"
                                value={keteranganValidasi}
                                onChange={(e) =>
                                  keteranganValidasiChangeHadler(e)
                                }
                                placeholder="Tambahkan catatan (opsional)"
                                rows={4}
                                disabled={user.jenisUserId === 4}
                              />
                            </div>
                          </>
                        ) : null}

                        <button type="submit" className={style.btnPrimary}>
                          <HiSaveAs size={20} /> Simpan
                        </button>
                      </form>
                    )
                  )
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RL312;
