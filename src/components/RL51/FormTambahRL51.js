import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { Link, useNavigate } from "react-router-dom";
import style from "./FormTambahRL51.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Table from "react-bootstrap/Table";
import { IoArrowBack } from "react-icons/io5";
import { Spinner } from "react-bootstrap";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const FormTambahRL51 = () => {
  // const [tahun, setTahun] = useState(new Date().getFullYear() - 1);
  // const [tahun, setTahun] = useState(new Date().getFullYear());
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
      if (caripenyakit) {
        const response = await axiosJWT.get(
          "/apisirs6v2/icd/rawat_jalan/find?search=" + caripenyakit,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const rlLimaPenyakit = response.data.data.map((value) => {
          return value;
        });
        let dataRLLimaDaftarPenyakit = [];
        rlLimaPenyakit.forEach((element) => {
          dataRLLimaDaftarPenyakit.push(element);
        });
        setDataPenyakit(dataRLLimaDaftarPenyakit);
        // setSpinnerSearch(false);
      }
    } catch (error) {
      console.log(error);
      //   toast("Error", {
      //     position: toast.POSITION.TOP_RIGHT,
      //   });
    }
    setSpinnerSearch(false);
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
        "/apisirs6v2/icd/rawat_jalan/id?id=" + id,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const DetailPenyakitTemplate = response.data.data.map((value) => {
        return {
          id: value.id,
          namaPenyakit: value.description_code,
          statusLaki: value.status_laki,
          statusPerempuan: value.status_perempuan,
          label: [
            {
              label: "Umur < 1 Jam",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_dibawah_1_jam",
              namaP: "jumlah_P_dibawah_1_jam",
            },
            {
              label: "Umur 1 - 23 Jam",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_1_sampai_23_jam",
              namaP: "jumlah_P_1_sampai_23_jam",
            },
            {
              label: "Umur 1 - 7 Hari",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_1_sampai_7_hari",
              namaP: "jumlah_P_1_sampai_7_hari",
            },
            {
              label: "Umur 8 - 28 Hari",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_8_sampai_28_hari",
              namaP: "jumlah_P_8_sampai_28_hari",
            },
            {
              label: "Umur 29 Hari - <3 Bulan",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_29_hari_sampai_dibawah_3_bulan",
              namaP: "jumlah_P_29_hari_sampai_dibawah_3_bulan",
            },
            {
              label: "Umur 3 - <6 Bulan",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_3_bulan_sampai_dibawah_6_bulan",
              namaP: "jumlah_P_3_bulan_sampai_dibawah_6_bulan",
            },
            {
              label: "Umur 6 - 11 Bulan",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_6_bulan_sampai_11_bulan",
              namaP: "jumlah_P_6_bulan_sampai_11_bulan",
            },
            {
              label: "Umur 1 - 4 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_1_sampai_4_tahun",
              namaP: "jumlah_P_1_sampai_4_tahun",
            },
            {
              label: "Umur 5 - 9 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_5_sampai_9_tahun",
              namaP: "jumlah_P_5_sampai_9_tahun",
            },
            {
              label: "Umur 10 - 14 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_10_sampai_14_tahun",
              namaP: "jumlah_P_10_sampai_14_tahun",
            },
            {
              label: "Umur 15 - 19 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_15_sampai_19_tahun",
              namaP: "jumlah_P_15_sampai_19_tahun",
            },
            {
              label: "Umur 20 - 24 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_20_sampai_24_tahun",
              namaP: "jumlah_P_20_sampai_24_tahun",
            },
            {
              label: "Umur 25 - 29 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_25_sampai_29_tahun",
              namaP: "jumlah_P_25_sampai_29_tahun",
            },
            {
              label: "Umur 30 - 34 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_30_sampai_34_tahun",
              namaP: "jumlah_P_30_sampai_34_tahun",
            },
            {
              label: "Umur 35 - 39 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_35_sampai_39_tahun",
              namaP: "jumlah_P_35_sampai_39_tahun",
            },
            {
              label: "Umur 40 - 44 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_40_sampai_44_tahun",
              namaP: "jumlah_P_40_sampai_44_tahun",
            },
            {
              label: "Umur 45 - 49 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_45_sampai_49_tahun",
              namaP: "jumlah_P_45_sampai_49_tahun",
            },
            {
              label: "Umur 50 - 54 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_50_sampai_54_tahun",
              namaP: "jumlah_P_50_sampai_54_tahun",
            },
            {
              label: "Umur 55 - 59 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_55_sampai_59_tahun",
              namaP: "jumlah_P_55_sampai_59_tahun",
            },
            {
              label: "Umur 60 - 64 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_60_sampai_64_tahun",
              namaP: "jumlah_P_60_sampai_64_tahun",
            },
            {
              label: "Umur 65 - 69 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_65_sampai_69_tahun",
              namaP: "jumlah_P_65_sampai_69_tahun",
            },
            {
              label: "Umur 70 - 74 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_70_sampai_74_tahun",
              namaP: "jumlah_P_70_sampai_74_tahun",
            },
            {
              label: "Umur 75 - 79 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_75_sampai_79_tahun",
              namaP: "jumlah_P_75_sampai_79_tahun",
            },
            {
              label: "Umur 80 - 84 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_80_sampai_84_tahun",
              namaP: "jumlah_P_80_sampai_84_tahun",
            },
            {
              label: "Umur  ≥ 85 Tahun",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_L_diatas_85_tahun",
              namaP: "jumlah_P_diatas_85_tahun",
            },
            {
              label: "Jumlah Kunjungan Pasien",
              JumlahPasienL: 0,
              JumlahPasienP: 0,
              namaL: "jumlah_kunjungan_L",
              namaP: "jumlah_kunjungan_P",
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
    let totalkunjungan =
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

    transformedObject["icdId"] = parseInt(e.target[1].value);
    // console.log(transformedObject);

    const dataReady = {
      periodeBulan: parseInt(bulan),
      periodeTahun: parseInt(tahun),
      //   icdId: parseInt(e.target[1].value),
      data: [transformedObject],
    };

    if (bulan === "00" || bulan == 0) {
      toast(
        `Data tidak bisa disimpan karena belum pilih periode bulan laporan`,
        {
          position: toast.POSITION.TOP_RIGHT,
        },
      );
      setButtonStatus(false);
    } else {
      if (total <= totalkunjungan) {
        try {
          const customConfig = {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "XSRF-TOKEN": CSRFToken,
            },
          };
          const result = await axiosJWT.post(
            "/apisirs6v2/rllimatitiksatu",
            dataReady,
            customConfig,
          );
          toast("Data Berhasil Disimpan", {
            position: toast.POSITION.TOP_RIGHT,
          });
          setTimeout(() => {
            navigate("/MENURL51");
            // window.location.reload();
            // navigate(0);
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
          `Data Gagal Disimpan, Data Jumlah Kasus Baru Lebih Dari Jumlah Kunjungan Pasien`,
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
      style={{ marginTop: "70px", marginBottom: "70px" }}
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
                  id="NamaRs"
                  value={namaRS}
                  disabled={true}
                />
                <label htmlFor="NamaRs">Nama</label>
              </div>
              <div
                className="form-floating"
                style={{ width: "100%", display: "inline-block" }}
              >
                <input
                  type="text"
                  className="form-control"
                  id="AlamatRS"
                  value={alamatRS}
                  disabled={true}
                />
                <label htmlFor="AlamatRS">Alamat</label>
              </div>
              <div
                className="form-floating"
                style={{ width: "50%", display: "inline-block" }}
              >
                <input
                  type="text"
                  className="form-control"
                  id="ProvinsiRS"
                  value={namaPropinsi}
                  disabled={true}
                />
                <label htmlFor="ProvinsiRS">Provinsi </label>
              </div>
              <div
                className="form-floating"
                style={{ width: "50%", display: "inline-block" }}
              >
                <input
                  type="text"
                  className="form-control"
                  id="KabKotaRS"
                  value={namaKabKota}
                  disabled={true}
                />
                <label htmlFor="KabKotaRS">Kab/Kota</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-3">
        <div className="col-md-6">
          <div className="pb-2">
            <Link
              to={`/rl51/`}
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
              Kembali RL 51 Mobiditas Pasien Rawat Jalan
            </span>
          </div>

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
                    minLength={2}
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
                      <th style={{ width: "8%" }}>No.</th>
                      <th style={{ width: "20%" }}>Code ICD 10</th>
                      <th style={{ width: "40%" }}>Deskripsi ICD 10</th>
                      <th style={{ width: "12%" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataPenyakit.map((value, index) => {
                      return (
                        <tr key={value.id}>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            {index + 1}
                          </td>
                          <td style={{ textAlign: "left" }}>
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
                      /> */}

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
                      <label htmlFor="floatingInput">Tahun</label>
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
                        <option value="1">Januari</option>
                        <option value="2">Februari</option>
                        <option value="3">Maret</option>
                        <option value="4">April</option>
                        <option value="5">Mei</option>
                        <option value="6">Juni</option>
                        <option value="7">Juli</option>
                        <option value="8">Agustus</option>
                        <option value="9">September</option>
                        <option value="10">Oktober</option>
                        <option value="11">November</option>
                        <option value="12">Desember</option>
                      </select>
                      <label htmlFor="bulan">Bulan</label>
                    </div>
                  </div>
                  <div className="container mt-3">
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
                    <div className={style["table-container"]}>
                      <table
                        responsive
                        className={style["table"]}
                        style={{ width: "100%" }}
                      >
                        <thead className={style["thead"]}>
                          <tr className="main-header-row">
                            <th style={{ width: "8%" }}>No.</th>
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

export default FormTambahRL51;
