import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";
import style from "./RL314.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { Link } from "react-router-dom";
import { Spinner, Modal } from "react-bootstrap";
import { downloadExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const RL314 = () => {
  const [bulan, setBulan] = useState("1");
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [total, setTotal] = useState("");
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  const [nama, setNama] = useState("");
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();
  const [spinner, setSpinner] = useState(false);
  const tableRef = useRef(null);
  const [namafile, setNamaFile] = useState("");

  // untuk validasi
  const [idValidasi, setidValidasi] = useState("");
  const [idValidasiSubmited, setidValidasiSubmited] = useState("");
  const [statusValidasi, setStatusValidasi] = useState("");
  const [keteranganValidasi, setKeteranganValidasi] = useState("");
  const [tglValidasi, setTglValidasi] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [loadingRS, setLoadingRS] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();
  const [selectedRsID, setSelectedRsID] = useState(null);

  //baru
  const [filterLabel, setFilterLabel] = useState([]);
  const [rumahSakit, setRumahSakit] = useState(null);
  const [daftarRumahSakit, setDaftarRumahSakit] = useState([]);
  const [daftarProvinsi, setDaftarProvinsi] = useState([]);
  const [daftarKabKota, setDaftarKabKota] = useState([]);
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});

  useEffect(() => {
    refreshToken();
    getBulan();

    const currentYear = new Date().getFullYear().toString();
    setTahun(currentYear);
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

  function handleDownloadExcel() {
    const header = ["No", "No Kegiatan", "Jenis Kegiatan", "Jumlah"];

    const body = dataRL.map((value, index) => {
      const data = [
        index + 1,
        value.jenisKegiatanRLTigaTitikEmpatBelasId,
        value.namaJenisKegiatan,
        value.jumlah,
      ];

      return data;
    });

    downloadExcel({
      fileName: "RL_3_14",
      sheet: "react-export-table-to-excel",
      tablePayload: {
        header,
        body: body,
      },
    });
  }

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
    let date = tahun + "-" + bulan + "-01";
    e.preventDefault();

    if (user.jenisUserId == 3) {
      if (!selectedRsID) {
        toast(`rumah sakit harus dipilih`, {
          position: toast.POSITION.TOP_RIGHT,
        });
        return;
      }
    }

    if (rumahSakit == null) {
      toast(`Rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }
    const filter = [];
    filter.push("Nama Rumah Sakit: ".concat(rumahSakit.nama));
    // filter.push("Periode ".concat(String(tahun).concat("-").concat(bulan)));
    filter.push(
      "Periode ".concat(`${tahun}-${bulan.toString().padStart(2, "0")}`),
    );
    setFilterLabel(filter);
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          rsId: rumahSakit.id,
          tahun: `${tahun}-${bulan.toString().padStart(2, "0")}-01`,
        },
      };
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitikempatbelas",
        customConfig,
      );

      const rlTigaTitikEmpatBelasDetails = results.data.data.map((value) => {
        return {
          id: value.id,
          jenisKegiatanRLTigaTitikEmpatBelasId:
            value.rl_tiga_titik_empat_belas_jenis_kegiatan.id,
          no: value.rl_tiga_titik_empat_belas_jenis_kegiatan.no,
          namaJenisKegiatan:
            value.rl_tiga_titik_empat_belas_jenis_kegiatan.nama,
          jumlah: value.jumlah,
        };
      });

      // 🔥 SORT FUNCTION (WAJIB DI SINI)
      const sortByNo = (a, b) => {
        const aParts = a.no.toString().split(".").map(Number);
        const bParts = b.no.toString().split(".").map(Number);

        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          const diff = (aParts[i] || 0) - (bParts[i] || 0);
          if (diff !== 0) return diff;
        }
        return 0;
      };

      const total16 = rlTigaTitikEmpatBelasDetails
        .filter(
          (rlTigaTitikEmpatBelasDetails) =>
            rlTigaTitikEmpatBelasDetails.jenisKegiatanRLTigaTitikEmpatBelasId >
              15 &&
            rlTigaTitikEmpatBelasDetails.jenisKegiatanRLTigaTitikEmpatBelasId <
              21,
        )
        .reduce(
          (acc, rlTigaTitikEmpatBelasDetails) =>
            acc + rlTigaTitikEmpatBelasDetails.jumlah,
          0,
        );

      setTotal(
        rlTigaTitikEmpatBelasDetails.reduce(
          (acc, rlTigaTitikEmpatBelasDetails) =>
            acc + rlTigaTitikEmpatBelasDetails.jumlah,
          0,
        ),
      );

      const below15Above16 = [];
      const restOfData = [];

      if (total16 > 0) {
        const newObj = {
          id: null,
          jenisKegiatanRLTigaTitikEmpatBelasId: null,
          no: "16",
          namaJenisKegiatan: "Kunjungan Rumah (Homecare)",
          jumlah: total16,
        };

        rlTigaTitikEmpatBelasDetails.forEach((item) => {
          if (
            parseInt(item.jenisKegiatanRLTigaTitikEmpatBelasId) < 15 ||
            parseInt(item.jenisKegiatanRLTigaTitikEmpatBelasId) > 16
          ) {
            below15Above16.push(item);
          } else {
            restOfData.push(item);
          }
        });

        below15Above16.push(newObj);

        const newData = [...below15Above16, ...restOfData];

        newData.sort(sortByNo);

        setDataRL(newData);
        // setRumahSakit(null);
        handleClose();
        setSpinner(false);
      } else {
        const sorted = [...rlTigaTitikEmpatBelasDetails];

        sorted.sort(sortByNo);

        setDataRL(sorted);
        handleClose();
        setSpinner(false);
      }
      setIsFilterApplied(true);
      await getValidasi();
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
        setBulan("1");
        setShow(true);
        break;
      case 2:
        getKabKota(satKerId);
        setBulan("1");
        setShow(true);
        break;
      case 3:
        getRumahSakit(satKerId);
        setBulan("1");
        setShow(true);
        break;
      case 4:
        showRumahSakit(satKerId);
        setBulan("1");
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
        `/apisirs6v2/rltigatitikempatbelas/${id}`,
        customConfig,
      );
      setDataRL((current) => current.filter((value) => value.id !== id));
      // window.location.reload(false);
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
          periode: `${tahun}-${bulan.toString().padStart(2, "0")}`,
        },
      };
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitikempatbelasvalidasi",
        customConfig,
      );

      if (results.data.data != null && results.data.data.length > 0) {
        setidValidasi(results.data.data[0].id);
        setidValidasiSubmited(results.data.data[0].statusValidasiId);

        setStatusValidasi("");

        setKeteranganValidasi(results.data.data[0].catatan || "");
        setTglValidasi(results.data.data[0].modifiedAt);
        setIsValidated(results.data.data[0].statusValidasiId === 3);
      } else {
        setidValidasi("");
        setStatusValidasi("");
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
          "/apisirs6v2/rltigatitikempatbelasvalidasi/" + idValidasi,
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
          "/apisirs6v2/rltigatitikempatbelasvalidasi",
          {
            rsId: rumahSakit.id,
            periode: `${tahun}-${bulan.toString().padStart(2, "0")}-01`,
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
                    className="form-select"
                    value={selectedRsID || ""}
                    onChange={handleSelectRumahSakit}
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
              <button type="submit" className={style.btnPrimary}>
                <HiSaveAs size={20} /> Terapkan
              </button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>

      {/* RL 3.14 - Pelayanan Khusus */}
      <div className="row">
        <div className="col-md-12">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className={style.pageHeader}>RL 3.14 - Pelayanan Khusus</h4>
          </div>

          <div className={style.toolbar}>
            {user.jenisUserId === 4 ? (
              <Link
                to={`/rl314/tambah/`}
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
                <div className={style.tableContainer}>
                  <table className={`table table-bordered ${style.table}`}>
                    <thead>
                      <tr>
                        <th style={{ width: "5%", textAlign: "center" }}>No</th>

                        {user.jenisUserId === 4 && (
                          <th style={{ width: "15%", textAlign: "center" }}>
                            Aksi
                          </th>
                        )}

                        <th style={{ textAlign: "center" }}>Jenis Kegiatan</th>

                        <th style={{ textAlign: "center" }}>Jumlah</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dataRL.map((value, index) => {
                        return value.no === "16" ? (
                          /* ROW KHUSUS (SUMMARY) */
                          <tr
                            key={value.jenisKegiatanRLTigaTitikEmpatBelasId}
                            style={{ backgroundColor: "#90C8AC" }}
                          >
                            <td className={style["sticky-column-view"]}>
                              {value.no}
                            </td>

                            {user.jenisUserId === 4 && <td></td>}

                            <td
                              style={{ textAlign: "left", fontWeight: "bold" }}
                            >
                              {value.namaJenisKegiatan}
                              <br />
                              <small>
                                (Hasil Penjumlahan dari 16.1 - 16.5)
                              </small>
                            </td>

                            <td
                              style={{
                                textAlign: "center",
                                fontWeight: "bold",
                              }}
                            >
                              {value.jumlah}
                            </td>
                          </tr>
                        ) : (
                          /* ROW NORMAL */
                          <tr key={value.jenisKegiatanRLTigaTitikEmpatBelasId}>
                            {/* NO */}
                            <td className={style["sticky-column-view"]}>
                              {value.no}
                            </td>

                            {/* AKSI */}
                            {user.jenisUserId === 4 && (
                              <td className={style["sticky-column"]}>
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
                                    onClick={() => hapus(value.id)}
                                  >
                                    Hapus
                                  </button>

                                  {value.no != 0 && (
                                    <Link
                                      to={`/rl314/ubah/${value.id}`}
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

                            {/* NAMA */}
                            <td style={{ textAlign: "left" }}>
                              {value.namaJenisKegiatan}
                            </td>

                            {/* JUMLAH */}
                            <td style={{ textAlign: "center" }}>
                              {value.jumlah}
                            </td>
                          </tr>
                        );
                      })}

                      {/* TOTAL */}
                      {dataRL.length > 0 && (
                        <tr>
                          <td
                            colSpan={user.jenisUserId === 4 ? 3 : 2}
                            style={{ textAlign: "center", fontWeight: "bold" }}
                          >
                            TOTAL
                          </td>

                          <td style={{ textAlign: "center" }}>{total}</td>
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
                <h3 className={style.validasiCardTitle}>Validasi RL 3.14</h3>
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
                            value={statusValidasi || ""}
                            required
                            onChange={(e) => statusValidasiChangeHadler(e)}
                          >
                            {user.jenisUserId === 4 ? (
                              <>
                                <option value="" disabled>
                                  Pilih Status
                                </option>
                                <option value="2">Selesai Diperbaiki</option>
                              </>
                            ) : (
                              <>
                                <option value="" disabled>
                                  Pilih Status
                                </option>
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

export default RL314;
