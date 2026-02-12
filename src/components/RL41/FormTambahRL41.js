import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { Link, useNavigate, useHistory } from "react-router-dom";
import style from "./RL41.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Table from "react-bootstrap/Table";
import { IoArrowBack } from "react-icons/io5";
import { Spinner } from "react-bootstrap";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const FormTambahRL41 = () => {
  const [tahun, setTahun] = useState("2025");
  const [bulan, setBulan] = useState("00");
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [caripenyakit, setCariPenyakit] = useState("");
  const [dataPenyakit, setDataPenyakit] = useState([]);
  const [datainput, setDataInput] = useState([]);
  const [buttonStatus, setButtonStatus] = useState(false);
  const [spinnerSearch, setSpinnerSearch] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();

  const startYear = 2025;
  const currentYear = new Date().getFullYear(); // sekarang 2026

  const years = [];
  for (let y = startYear; y <= currentYear; y++) {
    years.push(y);
  }

  useEffect(() => {
    refreshToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datainput]);

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
      setExpire(decoded.exp);
      getRumahSakit(decoded.satKerId);
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

  const getRumahSakit = async (id) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNamaRS(response.data.data.nama);
      setAlamatRS(response.data.data.alamat);
      setNamaPropinsi(response.data.data.provinsi_nama);
      setNamaKabKota(response.data.data.kab_kota_nama);
    } catch (error) {}
  };

  const CariPenyakit = async (e) => {
    e.preventDefault();
    setSpinnerSearch(true);
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/icd/rawat_inap/find?search=" + caripenyakit,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const rlEmpatPenyakit = response.data.data.map((value) => {
        return value;
      });

      let dataRLEmpatDaftarPenyakit = [];
      rlEmpatPenyakit.forEach((element) => {
        dataRLEmpatDaftarPenyakit.push(element);
      });

      setDataPenyakit(dataRLEmpatDaftarPenyakit);
      setSpinnerSearch(false);
    } catch (error) {
      console.log(error);
    }
  };

  const changeHandlerSingle = (event) => {
    const name = event.target.name;
    if (name === "tahun") {
      setTahun(event.target.value);
    } else if (name === "bulan") {
      setBulan(event.target.value);
    }
  };

  const handleFocus = (event) => {
    event.target.select();
  };

  const changeHandler = (event, index) => {
    if (event.target.value === "") {
      event.target.value = 0;
      event.target.select(event.target.value);
    }
  };

  const DetailPenyakit = async (id) => {
    setSpinner(true);
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/icd/rawat_inap/id?id=" + id,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const DetailPenyakitTemplate = response.data.data.map((value) => {
        return {
          id: value.id,
          namaPenyakit: value.nama,
          statusLaki: value.status_laki,
          statusPerempuan: value.status_perempuan,
          label: [
            {
              label: "Umur < 1 Jam",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen01JamL",
              namaP: "jmlhPasHidupMatiUmurGen01JamP",
            },
            {
              label: "Umur 1 - 23 Jam",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen123JamL",
              namaP: "jmlhPasHidupMatiUmurGen123JamP",
            },
            {
              label: "Umur 1 - 7 Hari",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen17hrL",
              namaP: "jmlhPasHidupMatiUmurGen17hrP",
            },
            {
              label: "Umur 8 - 28 Hari",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen828hrL",
              namaP: "jmlhPasHidupMatiUmurGen828hrP",
            },
            {
              label: "Umur 29 Hari - <3 Bulan",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen29hr3blnL",
              namaP: "jmlhPasHidupMatiUmurGen29hr3blnP",
            },
            {
              label: "Umur 3 - <6 Bulan",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen36blnL",
              namaP: "jmlhPasHidupMatiUmurGen36blnP",
            },
            {
              label: "Umur 6 - 11 Bulan",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen611blnL",
              namaP: "jmlhPasHidupMatiUmurGen611blnP",
            },
            {
              label: "Umur 1 - 4 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen14thL",
              namaP: "jmlhPasHidupMatiUmurGen14thP",
            },
            {
              label: "Umur 5 - 9 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen59thL",
              namaP: "jmlhPasHidupMatiUmurGen59thP",
            },
            {
              label: "Umur 10 - 14 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen1014thL",
              namaP: "jmlhPasHidupMatiUmurGen1014thP",
            },
            {
              label: "Umur 15 - 19 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen1519thL",
              namaP: "jmlhPasHidupMatiUmurGen1519thP",
            },
            {
              label: "Umur 20 - 24 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen2024thL",
              namaP: "jmlhPasHidupMatiUmurGen2024thP",
            },
            {
              label: "Umur 25 - 29 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen2529thL",
              namaP: "jmlhPasHidupMatiUmurGen2529thP",
            },
            {
              label: "Umur 30 - 34 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen3034thL",
              namaP: "jmlhPasHidupMatiUmurGen3034thP",
            },
            {
              label: "Umur 35 - 39 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen3539thL",
              namaP: "jmlhPasHidupMatiUmurGen3539thP",
            },
            {
              label: "Umur 40 - 44 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen4044thL",
              namaP: "jmlhPasHidupMatiUmurGen4044thP",
            },
            {
              label: "Umur 45 - 49 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen4549thL",
              namaP: "jmlhPasHidupMatiUmurGen4549thP",
            },
            {
              label: "Umur 50 - 54 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen5054thL",
              namaP: "jmlhPasHidupMatiUmurGen5054thP",
            },
            {
              label: "Umur 55 - 59 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen5559thL",
              namaP: "jmlhPasHidupMatiUmurGen5559thP",
            },
            {
              label: "Umur 60 - 64 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen6064thL",
              namaP: "jmlhPasHidupMatiUmurGen6064thP",
            },
            {
              label: "Umur 65 - 69 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen6569thL",
              namaP: "jmlhPasHidupMatiUmurGen6569thP",
            },
            {
              label: "Umur 70 - 74 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen7074thL",
              namaP: "jmlhPasHidupMatiUmurGen7074thP",
            },
            {
              label: "Umur 75 - 79 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen7579thL",
              namaP: "jmlhPasHidupMatiUmurGen7579thP",
            },
            {
              label: "Umur 80 - 84 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGen8084thL",
              namaP: "jmlhPasHidupMatiUmurGen8084thP",
            },
            {
              label: "Umur  ≥ 85 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasHidupMatiUmurGenLebih85thL",
              namaP: "jmlhPasHidupMatiUmurGenLebih85thP",
            },
            {
              label: "Jumlah Pasien Keluar Mati",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jmlhPasKeluarMatiGenL",
              namaP: "jmlhPasKeluarMatiGenP",
            },
          ],
        };
      });
      setDataInput(DetailPenyakitTemplate);
      setSpinner(false);
    } catch (error) {
      console.log(error);
    }
  };

  const changeHandlerCariPenyakit = (event) => {
    setCariPenyakit(event.target.value);
  };

  const preventPasteNegative = (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedData = parseFloat(clipboardData.getData("text"));

    if (pastedData < 0) {
      e.preventDefault();
    }
  };

  const preventMinus = (e) => {
    if (e.code === "Minus") {
      e.preventDefault();
    }
  };

  const Simpan = async (e) => {
    let periode = tahun + "-" + bulan + "-01";
    e.preventDefault();
    setButtonStatus(true);

    let total = 0;
    let totalMati =
      parseInt(e.target[datainput[0].label.length * 2 + 1].value) +
      parseInt(e.target[datainput[0].label.length * 2 + 2].value);

    for (let i = 3; i <= datainput[0].label.length * 2; i++) {
      total = parseInt(e.target[i].value) + total;
    }

    const transformedObject = {};

    datainput[0].label.forEach((item, index) => {
      transformedObject[item.namaL] = parseInt(e.target[3 + index * 2].value);
      transformedObject[item.namaP] = parseInt(e.target[4 + index * 2].value);
    });

    const dataReady = {
      periodeBulan: parseInt(bulan),
      periodeTahun: parseInt(tahun),
      icdId: parseInt(e.target[1].value),
      data: [transformedObject],
    };

    if (bulan === "00" || bulan == 0) {
      toast(`Data tidak bisa disimpan karena belum pilih periode laporan`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      setButtonStatus(false);
    } else {
      if (totalMati <= total) {
        try {
          const customConfig = {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "XSRF-TOKEN": CSRFToken,
            },
          };

          const result = await axiosJWT.post(
            "/apisirs6v2/rlempattitiksatu",
            dataReady,
            customConfig,
          );
          toast("Data Berhasil Disimpan", {
            position: toast.POSITION.TOP_RIGHT,
          });
          setTimeout(() => {
            navigate("/rl41");
          }, 1000);
        } catch (error) {
          toast(
            `Data tidak bisa disimpan karena ,${error.response.data.message}`,
            {
              position: toast.POSITION.TOP_RIGHT,
            },
          );
          setButtonStatus(false);
        }
      } else {
        toast(
          `Data Gagal Disimpan, Data Jumlah Pasien Keluar Mati Lebih Dari Jumlah Pasien Hidup dan Mati`,
          {
            position: toast.POSITION.TOP_RIGHT,
          },
        );
        setButtonStatus(false);
      }
    }
  };

  const maxLengthCheck = (object) => {
    if (object.target.value.length > object.target.maxLength) {
      object.target.value = object.target.value.slice(
        0,
        object.target.maxLength,
      );
    }
  };

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "100px" }}
    >
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title h5">Profile Fasyankes</h5>
              <div
                className="form-floating"
                style={{ width: "100%", display: "inline-block" }}
              >
                <input
                  type="text"
                  className="form-control"
                  id="floatingInput"
                  value={namaRS}
                  disabled={true}
                />
                <label htmlFor="floatingInput">Nama</label>
              </div>
              <div
                className="form-floating"
                style={{ width: "100%", display: "inline-block" }}
              >
                <input
                  type="text"
                  className="form-control"
                  id="floatingInput"
                  value={alamatRS}
                  disabled={true}
                />
                <label htmlFor="floatingInput">Alamat</label>
              </div>
              <div
                className="form-floating"
                style={{ width: "50%", display: "inline-block" }}
              >
                <input
                  type="text"
                  className="form-control"
                  id="floatingInput"
                  value={namaPropinsi}
                  disabled={true}
                />
                <label htmlFor="floatingInput">Provinsi </label>
              </div>
              <div
                className="form-floating"
                style={{ width: "50%", display: "inline-block" }}
              >
                <input
                  type="text"
                  className="form-control"
                  id="floatingInput"
                  value={namaKabKota}
                  disabled={true}
                />
                <label htmlFor="floatingInput">Kab/Kota</label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row mt-3">
        <div className="col-md-6">
          <Link
            to={`/rl41/`}
            className="btn btn-info"
            style={{
              fontSize: "18px",
              backgroundColor: "#779D9E",
              color: "#FFFFFF",
            }}
          >
            {/* <IoArrowBack size={30} style={{ color: "gray", cursor: "pointer" }} /> */}
            &lt;
          </Link>
          <span style={{ color: "gray" }}>
            Kembali RL 41 Penyakit Rawat Inap
          </span>
          <div className="card">
            <div className="card-body">
              <h5 className="card-title h5">Search Nama Penyakit</h5>
              <form onSubmit={CariPenyakit}>
                <div
                  className="form-floating"
                  style={{ width: "100%", display: "inline-block" }}
                >
                  <input
                    name="caripenyakit"
                    type="text"
                    className="form-control"
                    id="floatingInput"
                    placeholder="Nama Penyakit / KODE ICD 10"
                    value={caripenyakit}
                    onChange={(e) => changeHandlerCariPenyakit(e)}
                  />
                  <label htmlFor="floatingInput">
                    Search Nama Penyakit / KODE ICD10
                  </label>
                </div>
                <div className="mt-3 mb-3">
                  <button type="submit" className="btn btn-outline-success">
                    <HiSaveAs /> Cari
                  </button>
                </div>
              </form>
              <div className="container" style={{ textAlign: "center" }}>
                {/* <h5>test</h5> */}
                {spinnerSearch && (
                  <Spinner animation="grow" variant="success"></Spinner>
                )}
                {spinnerSearch && (
                  <Spinner animation="grow" variant="success"></Spinner>
                )}
                {spinnerSearch && (
                  <Spinner animation="grow" variant="success"></Spinner>
                )}
                {spinnerSearch && (
                  <Spinner animation="grow" variant="success"></Spinner>
                )}
                {spinnerSearch && (
                  <Spinner animation="grow" variant="success"></Spinner>
                )}
                {spinnerSearch && (
                  <Spinner animation="grow" variant="success"></Spinner>
                )}
              </div>
              <div className={style["table-container"]}>
                <table
                  responsive
                  className={style["table"]}
                  style={{ width: "100%" }}
                >
                  <thead className={style["thead"]}>
                    <tr className="main-header-row">
                      <th style={{ width: "5%" }}>No.</th>
                      <th style={{ width: "10%" }}>Code ICD 10</th>
                      <th style={{ width: "40%" }}>Deskripsi ICD 10</th>
                      <th style={{ width: "10%" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataPenyakit.map((value, index) => {
                      return (
                        <tr key={value.id}>
                          <td>{index + 1}</td>
                          <td style={{ textAlign: "center" }}>
                            {value.icd_code}
                          </td>
                          <td style={{ textAlign: "left" }}>
                            {value.description_code}
                          </td>
                          <td>
                            <button
                              className="btn btn-outline-success"
                              onClick={() => DetailPenyakit(value.id)}
                            >
                              Tambah
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        {datainput.length > 0 && (
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <form onSubmit={Simpan}>
                  <div className="container">
                    <h5 className="card-title h5">Periode Laporan</h5>
                    <h5 className="card-title h5">
                      Tambah Data Penyakit {datainput[0].namaPenyakit}
                    </h5>
                    <div
                      className="form-floating"
                      style={{ width: "100%", display: "inline-block" }}
                    >
                      {/* <input
                        name="tahun"
                        type="number"
                        className="form-control"
                        id="floatingInput"
                        placeholder="Tahun"
                        value={tahun}
                        onChange={(e) => changeHandlerSingle(e)}
                        disabled={true}
                      />
                      <label htmlFor="floatingInput">Tahun</label> */}

                      <select
                        name="tahun"
                        className="form-select"
                        id="tahun"
                        value={tahun}
                        onChange={(e) => setTahun(e.target.value)}
                      >
                        <option value="">Pilih Tahun</option>

                        {years.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>

                      <label htmlFor="tahun">Tahun</label>

                      <input
                        type="number"
                        id="jenisgolsebabid"
                        value={datainput[0].id}
                        readOnly
                        hidden
                      />
                    </div>
                    <div
                      className="form-floating"
                      style={{ width: "100%", display: "inline-block" }}
                    >
                      <select
                        name="bulan"
                        className="form-control"
                        id="bulan"
                        onChange={(e) => changeHandlerSingle(e)}
                      >
                        <option value="00">--PILIH BULAN--</option>
                        <option value="01">Januari</option>
                        <option value="02">Februari</option>
                        <option value="03">Maret</option>
                        <option value="04">April</option>
                        <option value="05">Mei</option>
                        <option value="06">Juni</option>
                        <option value="07">Juli</option>
                        <option value="08">Agustus</option>
                        <option value="09">September</option>
                        <option value="10">Oktober</option>
                        <option value="11">November</option>
                        <option value="12">Desember</option>
                      </select>
                      <label htmlFor="bulan">Bulan</label>
                    </div>
                  </div>
                  <div className="container mt-3">
                    <div className="container" style={{ textAlign: "center" }}>
                      {/* <h5>test</h5> */}
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
                    <div className={style["table-container"]}>
                      <table
                        responsive
                        className={style["table"]}
                        style={{ width: "100%" }}
                      >
                        <thead className={style["thead"]}>
                          <tr className="main-header-row">
                            <th>No.</th>
                            <th>Golongan Berdasarkan Umur</th>
                            <th>Laki Laki</th>
                            <th>Perempuan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {datainput.map((value) => {
                            return value.label.map((test, no) => {
                              const isPerempuanDisabled =
                                value.statusPerempuan === 0;
                              const isLakiDisabled = value.statusLaki === 0;
                              return (
                                <tr key={no}>
                                  <td>{no + 1}</td>
                                  <td style={{ textAlign: "left" }}>
                                    <label>{test.label}</label>
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      name={test.namaL}
                                      className="input is-primary is-small form-control"
                                      defaultValue={0}
                                      min={0}
                                      maxLength={7}
                                      onInput={(e) => maxLengthCheck(e)}
                                      onPaste={preventPasteNegative}
                                      onKeyPress={preventMinus}
                                      onChange={(e) => changeHandler(e, no)}
                                      onFocus={handleFocus}
                                      disabled={isLakiDisabled}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      name={test.namaP}
                                      className="input is-primary is-small form-control"
                                      defaultValue={0}
                                      min={0}
                                      maxLength={7}
                                      onInput={(e) => maxLengthCheck(e)}
                                      onPaste={preventPasteNegative}
                                      onKeyPress={preventMinus}
                                      onChange={(e) => changeHandler(e, no)}
                                      onFocus={handleFocus}
                                      disabled={isPerempuanDisabled}
                                    />
                                  </td>
                                </tr>
                              );
                            });
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="mt-3 mb-3">
                    <ToastContainer />
                    <button
                      type="submit"
                      className="btn btn-outline-success"
                      disabled={buttonStatus}
                    >
                      <HiSaveAs /> Simpan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormTambahRL41;
