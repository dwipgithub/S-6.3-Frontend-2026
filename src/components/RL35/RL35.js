import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL35.module.css";
import { HiSaveAs } from "react-icons/hi";
import { confirmAlert } from "react-confirm-alert";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Modal from "react-bootstrap/Modal";
import { DownloadTableExcel } from "react-export-table-to-excel";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const RL35 = () => {
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
  const navigate = useNavigate();
  const [spinner, setSpinner] = useState(false);
  const [dataCount, setDataCount] = useState([]);
  const [total_kunjungan, setTotalKunjungan] = useState(0);
  const [rata_kunjungan, setRataKunjungan] = useState(0);
  const tableRef = useRef(null);
  const [namafile, setNamaFile] = useState("");
  const [statusValidasi, setStatusValidasi] = useState(0);
  const [keteranganValidasi, setKeteranganValidasi] = useState("");
  const [validasiId, setValidasiId] = useState(null);
  const [dataValidasi, setDataValidasi] = useState(null);
  const [activeTab, setActiveTab] = useState("tab1");
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getBulan();
    totalPengunjung();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataRL]);

  // Load validasi data secara realtime saat bulan/tahun/rumahSakit berubah
  useEffect(() => {
    if (activeTab === "tab2" && rumahSakit && rumahSakit.id && bulan !== 0 && tahun) {
      getValidasi();
    }
  }, [bulan, tahun, rumahSakit, activeTab]);

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
        showRumahSakit(decoded.satKerId, accessToken);
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

  const changeHandlerSingle = (event) => {
    const name = event.target.name;
    if (name === "tahun") {
      setTahun(event.target.value);
    } else if (name === "bulan") {
      setBulan(event.target.value);
    }
  };

  const changeHandler = (event, index) => {
    const name = event.target.name;
    if (name === "check") {
      if (event.target.checked === true) {
        hapus();
      } else if (event.target.checked === false) {
        // console.log('hello2')
      }
    }
  };

  const getRL = async (e) => {
    let date = tahun + "-" + bulan + "-01";
    e.preventDefault();
    setSpinner(true);
    if (!rumahSakit || !rumahSakit.id) {
      toast(`rumah sakit harus dipilih`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }
    const filter = [];
    filter.push("nama: ".concat(rumahSakit.nama));
    filter.push("periode: ".concat(String(tahun).concat("-").concat(bulan)));
    setFilterLabel(filter);
    
    // Reset validation state
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
          tahun: date,
        },
      };
      const results = await axiosJWT.get(
        "/apisirs6v2/rltigatitiklima",
        customConfig
      );

      if (!results.data.data || results.data.data.length === 0) {
        setDataRL([]);
        setTotalKunjungan(0);
        setRataKunjungan(0);
        toast("Data RL tidak ditemukan", {
          position: toast.POSITION.TOP_RIGHT,
        });
        setSpinner(false);
        handleClose();
        return;
      }

      setDataRL(results.data.data);
      if (results.data.data.length > 0) {
        setNamaFile(
          "rl35_" + results.data.data[0].rs_id + "_".concat(String(tahun).concat("-").concat(bulan).concat("-01"))
        );
      }
      setSpinner(false);
      handleClose();
      
      // Load validasi data setelah filter diterapkan
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
          "/apisirs6v2/rltigatitiklimavalidasi",
          validasiConfig
        );

        if (validasiResponse.data.data && validasiResponse.data.data.length > 0) {
          const validasi = validasiResponse.data.data[0];
          setValidasiId(validasi.id);
          setStatusValidasi(validasi.statusValidasiId);
          setKeteranganValidasi(validasi.catatan || "");
          setDataValidasi(validasi);
        }
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      console.log(error);
      setSpinner(false);
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
        "/apisirs6v2/rltigatitiklimavalidasi",
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
    
    if (!rumahSakit || !rumahSakit.id) {
      toast("Rumah sakit harus dipilih terlebih dahulu", {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    if (parseInt(statusValidasi) === 0) {
      toast("Status harus dipilih terlebih dahulu", {
        position: toast.POSITION.TOP_RIGHT,
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

      const payload = {
        statusValidasiId: parseInt(statusValidasi),
        catatan: keteranganValidasi,
      };

      console.log("Payload yang dikirim:", payload);
      console.log("ValidasiId:", validasiId);

      if (validasiId) {
        // Update existing validation
        const response = await axiosJWT.patch(
          `/apisirs6v2/rltigatitiklimavalidasi/${validasiId}`,
          payload,
          customConfig
        );
        console.log("Response PATCH:", response.data);
        toast("Data Validasi Berhasil Diperbarui", {
          position: toast.POSITION.TOP_RIGHT,
        });
        setTimeout(() => {
          getValidasi();
        }, 1500);
      } else {
        // Create new validation
        const response = await axiosJWT.post(
          "/apisirs6v2/rltigatitiklimavalidasi",
          {
            rsId: rumahSakit.id,
            periode: String(tahun).concat("-").concat(String(bulan).padStart(2, "0")),
            jenisPeriode: 1,
            ...payload,
          },
          customConfig
        );
        console.log("Response POST:", response.data);
        setValidasiId(response.data.data.id);
        toast("Data Validasi Berhasil Disimpan", {
          position: toast.POSITION.TOP_RIGHT,
        });
        // Refresh validasi data tanpa reload halaman
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
        }
      );
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const totalPengunjung = () => {
    let t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0;
    let r1 = 0, r2 = 0, r3 = 0, r4 = 0, r5 = 0;

    // Cari baris pembagi (Jumlah Hari - biasanya ID 34)
    const divisorRow = dataRL.find(item => item.jenis_kegiatan_id === 34);

    dataRL.forEach((value) => {
      // Jangan hitung baris Total, Rata-rata, atau baris non-data ke dalam Total
      if (![35, 99, 66, 77, 34].includes(value.jenis_kegiatan_id)) {
        t1 += parseInt(value.kunjungan_pasien_dalam_kabkota_laki || 0);
        t2 += parseInt(value.kunjungan_pasien_luar_kabkota_laki || 0);
        t3 += parseInt(value.kunjungan_pasien_dalam_kabkota_perempuan || 0);
        t4 += parseInt(value.kunjungan_pasien_luar_kabkota_perempuan || 0);
        t5 += parseInt(value.total_kunjungan || 0);
      }
    });

    if (divisorRow) {
      r1 = Math.ceil(t1 / (divisorRow.kunjungan_pasien_dalam_kabkota_laki || 1));
      r2 = Math.ceil(t2 / (divisorRow.kunjungan_pasien_luar_kabkota_laki || 1));
      r3 = Math.ceil(t3 / (divisorRow.kunjungan_pasien_dalam_kabkota_perempuan || 1));
      r4 = Math.ceil(t4 / (divisorRow.kunjungan_pasien_luar_kabkota_perempuan || 1));
      r5 = Math.ceil(t5 / (divisorRow.total_kunjungan || 1));
    }

    let newData = [
      {
        id: 99,
        jenis_kegiatan_id: 99,
        jenis_kegiatan_nama: "Total",
        kunjungan_pasien_dalam_kabkota_laki: t1,
        kunjungan_pasien_luar_kabkota_laki: t2,
        kunjungan_pasien_dalam_kabkota_perempuan: t3,
        kunjungan_pasien_luar_kabkota_perempuan: t4,
        total_kunjungan: t5,
      },
      {
        id: 77,
        jenis_kegiatan_id: 77,
        jenis_kegiatan_nama: "Rata-rata kunjungan per hari",
        kunjungan_pasien_dalam_kabkota_laki: r1,
        kunjungan_pasien_luar_kabkota_laki: r2,
        kunjungan_pasien_dalam_kabkota_perempuan: r3,
        kunjungan_pasien_luar_kabkota_perempuan: r4,
        total_kunjungan: r5,
      },
    ];
    setTotalKunjungan(t5);
    setRataKunjungan(r5);
    setDataCount(newData);
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
      await axiosJWT.delete(`/apisirs6v2/rltigatitiklima/${id}`, customConfig);
      setDataRL((current) => current.filter((value) => value.id !== id));
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
      message: "Apakah Anda Yakin? ",
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

  return (
    <div
      className="container"
      style={{ marginTop: "20px", marginBottom: "70px" }}
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
            <h4 className={style.pageHeader}> RL 3.5 - Kunjungan</h4>
          <div className={style.toolbar}>
            {user.jenisUserId === 4 ? (
              <Link
                to={`/rl35/tambah/`}
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
            <DownloadTableExcel
              filename={namafile}
              sheet="data RL 35"
              currentTableRef={tableRef.current}
            >
              {/* <button> Export excel </button> */}
              <button
                type="button"
                className={style.btnPrimary}
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
                  return "filtered by" + value;
                })
                .join(", ")}
            </h5>
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
              <li className={`nav-item ${style.navItem}`}>
                <button
                  type="button"
                  className={`${style.navLink} ${activeTab === "tab2" ? style.active : ""}`}
                  onClick={() => handleTabClick("tab2")}
                >
                  Validasi
                </button>
              </li>
            </ul>

            <div className={`tab-content ${style.tabContent}`}>
              <div
                className={`tab-pane fade ${
                  activeTab === "tab1" ? "show active" : ""
                }`}
              >
          <div className={style["table-container"]}>
            <div className="table-responsive">
            <table className={style.table} ref={tableRef}>
              <thead>
                <tr className={style.thead}>
                  <th
                    rowSpan={2}
                    style={{ width: "4%", verticalAlign: "middle" }}
                  >
                    No.
                  </th>

                  {user?.jenisUserId === 4 && (
                    <th
                      rowSpan={2}
                      style={{ width: "8%", verticalAlign: "middle" }}
                    >
                      Aksi
                    </th>
                  )}

                  <th
                    rowSpan={2}
                    style={{ width: "12%", verticalAlign: "middle" }}
                  >
                    Jenis Kegiatan
                  </th>

                  <th colSpan={2} style={{ textAlign: "center" }}>
                    Kunjungan Pasien Dalam Kota
                  </th>

                  <th colSpan={2} style={{ textAlign: "center" }}>
                    Kunjungan Pasien Luar Kota
                  </th>

                  <th rowSpan={2} style={{ verticalAlign: "middle" }}>
                    Total Kunjungan
                  </th>
                </tr>

                <tr className={style["subheader-row"]}>
                  <th>Laki-Laki</th>
                  <th>Perempuan</th>
                  <th>Laki-Laki</th>
                  <th>Perempuan</th>
                </tr>
              </thead>

              <tbody>
                {dataRL.map((value, index) => (
                  <tr key={value.id}>
                    <td style={{ textAlign: "center" }}>
                      {index + 1}
                    </td>

                    {user?.jenisUserId === 4 && (
                      <td style={{ textAlign: "center" }}>
                        <ToastContainer />

                        <div style={{ display: "flex" }}>
                          <button
                            className="btn btn-danger"
                            style={{
                              marginRight: "5px",
                              backgroundColor: "#FF6663",
                              border: "1px solid #FF6663",
                            }}
                            type="button"
                            onClick={() => hapus(value.id)}
                          >
                            Hapus
                          </button>

                          <Link
                            to={`/rl35/ubah/${value.id}`}
                            className="btn btn-warning"
                            style={{
                              backgroundColor: "#CFD35E",
                              border: "1px solid #CFD35E",
                              color: "#FFFFFF",
                            }}
                          >
                            Ubah
                          </Link>
                        </div>
                      </td>
                    )}

                    <td style={{ textAlign: "center" }}>
                      {value.jenis_kegiatan_rl_tiga_titik_lima.nama}
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {value.kunjungan_pasien_dalam_kabkota_laki}
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {value.kunjungan_pasien_dalam_kabkota_perempuan}
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {value.kunjungan_pasien_luar_kabkota_laki}
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {value.kunjungan_pasien_luar_kabkota_perempuan}
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {value.total_kunjungan}
                    </td>
                  </tr>
                ))}

                {/* TOTAL */}
                {total_kunjungan !== 0 && (
                  <tr>
                    <td style={{ textAlign: "center" }}>99</td>

                    {user?.jenisUserId === 4 && <td></td>}

                    <td style={{ textAlign: "center" }}>
                      Total
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {dataCount[0].kunjungan_pasien_dalam_kabkota_laki}
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {dataCount[0].kunjungan_pasien_dalam_kabkota_perempuan}
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {dataCount[0].kunjungan_pasien_luar_kabkota_laki}
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {dataCount[0].kunjungan_pasien_luar_kabkota_perempuan}
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {dataCount[0].total_kunjungan}
                    </td>
                  </tr>
                )}

                {/* RATA-RATA */}
                {rata_kunjungan !== 0 && (
                  <tr>
                    <td style={{ textAlign: "center" }}>77</td>

                    {user?.jenisUserId === 4 && <td></td>}

                    <td style={{ textAlign: "center" }}>
                      Rata-rata kunjungan per hari
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {dataCount[1].kunjungan_pasien_dalam_kabkota_laki}
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {dataCount[1].kunjungan_pasien_dalam_kabkota_perempuan}
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {dataCount[1].kunjungan_pasien_luar_kabkota_laki}
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {dataCount[1].kunjungan_pasien_luar_kabkota_perempuan}
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {dataCount[1].total_kunjungan}
                    </td>
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
                    <h3 className={style.validasiCardTitle}>Validasi RL 3.5</h3>

                    {/* =========================
                        1️⃣ DATA RL KOSONG
                    ========================== */}
                    {dataRL.length === 0 ? (
                      <div style={{
                        backgroundColor: "#fff3cd",
                        border: "1px solid #ffc107",
                        color: "#856404",
                        padding: "15px",
                        borderRadius: "4px",
                        textAlign: "center"
                      }}>
                        <strong>Silahkan pilih Filter terlebih dahulu untuk melihat data.</strong>
                      </div>

                    /* =========================
                        2️⃣ RS BELUM PERNAH DIVALIDASI
                    ========================== */
                    ) : (!dataValidasi && user.jenisUserId === 4) ? (
                      <div style={{
                        backgroundColor: "#fff3cd",
                        border: "1px solid #ffc107",
                        color: "#856404",
                        padding: "15px",
                        borderRadius: "4px",
                        textAlign: "center"
                      }}>
                        <strong>Data Belum di Validasi</strong>
                      </div>

                    ) : (

                      <>
                        {/* =========================
                            3️⃣ INFO VALIDASI
                        ========================== */}
                        {dataValidasi && (
                              <div style={{
                                backgroundColor: "#f0f0f0",
                                padding: "12px",
                                borderRadius: "4px",
                                marginBottom: "15px"
                              }}>

                                {/* STATUS */}
                                <div style={{ display: "flex", marginBottom: "4px" }}>
                                  <div style={{ width: "90px", textAlign: "left", paddingRight: "8px", fontWeight: "600" }}>
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

                                {/* CATATAN */}
                                {(dataValidasi.keteranganValidasi ||
                                  dataValidasi.catatan ||
                                  dataValidasi.keterangan) && (
                                  <div style={{ display: "flex", marginBottom: "4px" }}>
                                    <div style={{ width: "90px", textAlign: "left", paddingRight: "8px", fontWeight: "600" }}>
                                      Catatan
                                    </div>
                                    <div style={{ width: "10px" }}>:</div>
                                    <div>
                                      {dataValidasi.keteranganValidasi ||
                                        dataValidasi.catatan ||
                                        dataValidasi.keterangan}
                                    </div>
                                  </div>
                                )}

                                {/* DIBUAT */}
                                <div style={{ display: "flex" }}>
                                  <div style={{ width: "90px", textAlign: "left", paddingRight: "8px", fontWeight: "600" }}>
                                    Dibuat
                                  </div>
                                  <div style={{ width: "10px" }}>:</div>
                                  <div>
                                    {new Date(dataValidasi.createdAt).toLocaleDateString("id-ID")}
                                  </div>
                                </div>

                              </div>
                            )}

                        {/* =========================
                            4️⃣ STATUS FINAL LOCK
                        ========================== */}
                        {dataValidasi && dataValidasi.statusValidasiId === 3 ? (
                        <div style={{
                        backgroundColor: "#fff3cd",
                        border: "1px solid #ffc107",
                        color: "#856404",
                        padding: "15px",
                        borderRadius: "4px",
                        textAlign: "center"
                      }}>
                        <strong>Data telah divalidasi.</strong>
                      </div>

                        ) : (

                          /* =========================
                              5️⃣ FORM VALIDASI
                          ========================== */
                          <form onSubmit={simpanValidasi}>
                            <ToastContainer />

                            <div className={style.validasiFormGroup}>
                              <label>Status</label>
                              <select
                                value={statusValidasi}
                                onChange={statusValidasiChangeHadler}
                              >
                                <option value={0}>Pilih</option>

                                {user.jenisUserId === 4
                                  ? <option value="2">Selesai Diperbaiki</option>
                                  : <>
                                      <option value="1">Perlu Perbaikan</option>
                                      <option value="3">Disetujui</option>
                                    </>
                                }
                              </select>
                            </div>

                            {/* ✅ TEXTAREA HANYA UNTUK VALIDATOR */}
                            {user.jenisUserId !== 4 && (
                              <div className={style.validasiFormGroup}>
                                <label>Catatan</label>
                                <textarea
                                  onChange={keteranganValidasiChangeHadler}
                                  rows={4}
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

export default RL35;