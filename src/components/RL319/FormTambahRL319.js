import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { Link, useNavigate } from "react-router-dom";
import style from "./FormTambahRL319.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
// import Table from "react-bootstrap/Table";
import "react-toastify/dist/ReactToastify.css";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import { IoArrowBack } from "react-icons/io5";

const FormTambahRL319 = () => {
  const [tahun, setTahun] = useState("");
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [buttonStatus, setButtonStatus] = useState(false);
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();

  // const startYear = 2025;

  // const today = new Date();
  // const currentYear = today.getFullYear();

  // // batas: 31 Maret
  // const batasTanggal = new Date(currentYear, 2, 31); // bulan 0-based → 2 = Maret

  // // kalau hari ini lewat 31 Maret → hanya boleh current year
  // const maxYear = today > batasTanggal ? currentYear : currentYear;

  // const minYear = today > batasTanggal ? currentYear : currentYear - 1;

  // // generate list tahun
  // const years = [];
  // for (let y = startYear; y <= maxYear; y++) {
  //   if (y >= minYear) {
  //     years.push(y);
  //   }
  // }

  const startYear = 2025;

  const today = new Date();
  const currentYear = today.getFullYear();
  
  const years = [];
  for (let y = startYear; y <= currentYear; y++) {
    years.push(y);
  }

  useEffect(() => {
    refreshToken();
    getRLTigaTitikSembilanBelasTemplate();
    const date = new Date();
    setTahun(years);
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
      setExpire(decoded.exp);
      getDataRS(decoded.satKerId);
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

  const getDataRS = async (id) => {
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

  const getRLTigaTitikSembilanBelasTemplate = async () => {
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/golonganobattigatitiksembilanbelas",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const rlTemplate = response.data.data
        .filter((value) => {
          return value.no !== "4" && value.no !== "2";
        })
        .map((value, index) => {
          return {
            id: value.id,
            no: value.no,
            golonganObat: value.nama,
            ranap_pasien_keluar: 0,
            ranap_lama_dirawat: 0,
            jumlah_pasien_rajal: 0,
            rajal_lab: 0,
            rajal_radiologi: 0,
            rajal_lain_lain: 0,
            disabledInput: true,
            checked: false,
          };
        });
      setDataRL(rlTemplate);
    } catch (error) {}
  };

  // const changeHandler = (event, index) => {
  //   let newDataRL = [...dataRL];
  //   const name = event.target.name;
  //   if (name === "check") {
  //     if (event.target.checked === true) {
  //       newDataRL[index].disabledInput = false;
  //     } else if (event.target.checked === false) {
  //       newDataRL[index].disabledInput = true;
  //     }
  //     newDataRL[index].checked = event.target.checked;
  //   } else if (name === "ranap_pasien_keluar") {
  //     if (event.target.value === "") {
  //       event.target.value = 0;
  //       event.target.select(event.target.value);
  //     }
  //     newDataRL[index].ranap_pasien_keluar = event.target.value;
  //   } else if (name === "ranap_lama_dirawat") {
  //     if (event.target.value === "") {
  //       event.target.value = 0;
  //       event.target.select(event.target.value);
  //     }

  //     if (event.target.value > newDataRL[index].ranap_pasien_keluar) {
  //       toast(
  //         "Jumlah Lama Dirawat harus lebih kecil dari Jumlah Pasien Keluar",
  //         {
  //           position: toast.POSITION.TOP_RIGHT,
  //         }
  //       );
  //     } else {
  //       newDataRL[index].ranap_lama_dirawat = event.target.value;
  //     }
  //   } else if (name === "rajal_lab") {
  //     if (event.target.value === "") {
  //       event.target.value = 0;
  //       event.target.select(event.target.value);
  //     }
  //     newDataRL[index].rajal_lab = event.target.value;
  //     newDataRL[index].jumlah_pasien_rajal =
  //       parseInt(newDataRL[index].rajal_radiologi) +
  //       parseInt(event.target.value) +
  //       parseInt(newDataRL[index].rajal_lain_lain);
  //   } else if (name === "rajal_radiologi") {
  //     if (event.target.value === "") {
  //       event.target.value = 0;
  //       event.target.select(event.target.value);
  //     }
  //     newDataRL[index].rajal_radiologi = event.target.value;
  //     newDataRL[index].jumlah_pasien_rajal =
  //       parseInt(newDataRL[index].rajal_lab) +
  //       parseInt(event.target.value) +
  //       parseInt(newDataRL[index].rajal_lain_lain);
  //   } else if (name === "rajal_lain_lain") {
  //     if (event.target.value === "") {
  //       event.target.value = 0;
  //       event.target.select(event.target.value);
  //     }
  //     newDataRL[index].rajal_lain_lain = event.target.value;
  //     newDataRL[index].jumlah_pasien_rajal =
  //       parseInt(newDataRL[index].rajal_radiologi) +
  //       parseInt(event.target.value) +
  //       parseInt(newDataRL[index].rajal_lab);
  //   }

  //   setDataRL(newDataRL);
  // };

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
    } else if (name === "ranap_pasien_keluar") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].ranap_pasien_keluar = event.target.value;
    } else if (name === "ranap_lama_dirawat") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }

      newDataRL[index].ranap_lama_dirawat = event.target.value;
    } else if (name === "rajal_lab") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rajal_lab = event.target.value;
      newDataRL[index].jumlah_pasien_rajal =
        parseInt(newDataRL[index].rajal_radiologi) +
        parseInt(event.target.value) +
        parseInt(newDataRL[index].rajal_lain_lain);
    } else if (name === "rajal_radiologi") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rajal_radiologi = event.target.value;
      newDataRL[index].jumlah_pasien_rajal =
        parseInt(newDataRL[index].rajal_lab) +
        parseInt(event.target.value) +
        parseInt(newDataRL[index].rajal_lain_lain);
    } else if (name === "rajal_lain_lain") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rajal_lain_lain = event.target.value;
      newDataRL[index].jumlah_pasien_rajal =
        parseInt(newDataRL[index].rajal_radiologi) +
        parseInt(event.target.value) +
        parseInt(newDataRL[index].rajal_lab);
    }

    setDataRL(newDataRL);
  };

  const Simpan = async (e) => {
    e.preventDefault();
    setButtonStatus(true);

    try {
      // 🔴 FILTER DATA YANG DICENTANG
      const selectedData = dataRL.filter((value) => value.checked === true);

      // ❌ JIKA TIDAK ADA YANG DICENTANG → STOP
      if (selectedData.length === 0) {
        toast("Pilih minimal 1 data untuk disimpan", {
          position: toast.POSITION.TOP_RIGHT,
        });
        setButtonStatus(false);
        return;
      }

      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };

      // // 🔵 DATA UTAMA
      let dataRLArray = selectedData.map((value) => ({
        golonganObatTigaTitikSembilanBelasId: parseInt(value.id),
        ranap_pasien_keluar: parseInt(value.ranap_pasien_keluar),
        ranap_lama_dirawat: parseInt(value.ranap_lama_dirawat),
        jumlah_pasien_rajal: parseInt(value.jumlah_pasien_rajal),
        rajal_lab: parseInt(value.rajal_lab),
        rajal_lain_lain: parseInt(value.rajal_lain_lain),
        rajal_radiologi: parseInt(value.rajal_radiologi),
      }));

      // // ==============================
      // // 🔵 ASURANSI (NO ;

      // // ==============================
      // // 🔵 ASURANSI (NO 2)
      // // ==============================
      // const asuransiSelected = selectedData.filter((v) => v.no.includes("2."));

      // if (asuransiSelected.length > 0) {
      //   let asuransiData = {
      //     ranap_pasien_keluar: 0,
      //     ranap_lama_dirawat: 0,
      //     jumlah_pasien_rajal: 0,
      //     rajal_lab: 0,
      //     rajal_radiologi: 0,
      //     rajal_lain_lain: 0,
      //   };

      //   const getAsuransiData = await axiosJWT.get(
      //     "/apisirs6v2/cekrltigatitiksembilanbelasdetail",
      //     {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //       },
      //       params: {
      //         tahun: parseInt(tahun),
      //         specificId: 2,
      //       },
      //     },
      //   );

      //   // akumulasi dari checkbox
      //   asuransiSelected.forEach((value) => {
      //     asuransiData.ranap_pasien_keluar += parseInt(
      //       value.ranap_pasien_keluar,
      //     );
      //     asuransiData.ranap_lama_dirawat += parseInt(value.ranap_lama_dirawat);
      //     asuransiData.jumlah_pasien_rajal += parseInt(
      //       value.jumlah_pasien_rajal,
      //     );
      //     asuransiData.rajal_lab += parseInt(value.rajal_lab);
      //     asuransiData.rajal_radiologi += parseInt(value.rajal_radiologi);
      //     asuransiData.rajal_lain_lain += parseInt(value.rajal_lain_lain);
      //   });

      //   if (getAsuransiData.data.data) {
      //     const db = getAsuransiData.data.data;

      //     asuransiData.ranap_pasien_keluar += parseInt(db.ranap_pasien_keluar);
      //     asuransiData.ranap_lama_dirawat += parseInt(db.ranap_lama_dirawat);
      //     asuransiData.jumlah_pasien_rajal += parseInt(db.jumlah_pasien_rajal);
      //     asuransiData.rajal_lab += parseInt(db.rajal_lab);
      //     asuransiData.rajal_radiologi += parseInt(db.rajal_radiologi);
      //     asuransiData.rajal_lain_lain += parseInt(db.rajal_lain_lain);

      //     await axiosJWT.patch(
      //       `/apisirs6v2/rltigatitiksembilanbelasdetail/${db.id}`,
      //       asuransiData,
      //       customConfig,
      //     );
      //   } else {
      //     asuransiData.golonganObatTigaTitikSembilanBelasId = 2;
      //     dataRLArray.push(asuransiData);
      //   }
      // }

      // // ==============================
      // // 🔵 GRATIS (NO 4)
      // // ==============================
      // const gratisSelected = selectedData.filter((v) => v.no.includes("4."));

      // if (gratisSelected.length > 0) {
      //   let gratisData = {
      //     ranap_pasien_keluar: 0,
      //     ranap_lama_dirawat: 0,
      //     jumlah_pasien_rajal: 0,
      //     rajal_lab: 0,
      //     rajal_radiologi: 0,
      //     rajal_lain_lain: 0,
      //   };

      //   const getGratisData = await axiosJWT.get(
      //     "/apisirs6v2/cekrltigatitiksembilanbelasdetail",
      //     {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //       },
      //       params: {
      //         tahun: parseInt(tahun),
      //         specificId: 8,
      //       },
      //     },
      //   );

      //   gratisSelected.forEach((value) => {
      //     gratisData.ranap_pasien_keluar += parseInt(value.ranap_pasien_keluar);
      //     gratisData.ranap_lama_dirawat += parseInt(value.ranap_lama_dirawat);
      //     gratisData.jumlah_pasien_rajal += parseInt(value.jumlah_pasien_rajal);
      //     gratisData.rajal_lab += parseInt(value.rajal_lab);
      //     gratisData.rajal_radiologi += parseInt(value.rajal_radiologi);
      //     gratisData.rajal_lain_lain += parseInt(value.rajal_lain_lain);
      //   });

      //   if (getGratisData.data.data) {
      //     const db = getGratisData.data.data;

      //     gratisData.ranap_pasien_keluar += parseInt(db.ranap_pasien_keluar);
      //     gratisData.ranap_lama_dirawat += parseInt(db.ranap_lama_dirawat);
      //     gratisData.jumlah_pasien_rajal += parseInt(db.jumlah_pasien_rajal);
      //     gratisData.rajal_lab += parseInt(db.rajal_lab);
      //     gratisData.rajal_radiologi += parseInt(db.rajal_radiologi);
      //     gratisData.rajal_lain_lain += parseInt(db.rajal_lain_lain);

      //     await axiosJWT.patch(
      //       `/apisirs6v2/rltigatitiksembilanbelasdetail/${db.id}`,
      //       gratisData,
      //       customConfig,
      //     );
      //   } else {
      //     gratisData.golonganObatTigaTitikSembilanBelasId = 8;
      //     dataRLArray.push(gratisData);
      //   }
      // }

      // // ==============================
      // // 🔵 FINAL SUBMIT
      // // ==============================
      const result = await axiosJWT.post(
        "/apisirs6v2/rltigatitiksembilanbelas",
        {
          tahun: parseInt(tahun),
          data: dataRLArray,
        },
        customConfig,
      );

      if (result.status === 201) {
        toast("Data Berhasil Disimpan", {
          position: toast.POSITION.TOP_RIGHT,
        });

        setTimeout(() => {
          navigate("/rl319");
        }, 2000);
      }
    } catch (error) {
      console.log(error);
      toast(`Gagal simpan data`, {
        position: toast.POSITION.TOP_RIGHT,
      });
      setButtonStatus(false);
    }
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
      style={{ marginTop: "20px", marginBottom: "70px" }}
    >
      <form onSubmit={Simpan}>
        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title h5">Profil Fasyankes</h5>
                <div
                  className="form-floating"
                  style={{ width: "100%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    value={namaRS}
                    disabled={true}
                  />
                  <label>Nama</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "100%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    value={alamatRS}
                    disabled={true}
                  />
                  <label>Alamat</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "50%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    value={namaPropinsi}
                    disabled={true}
                  />
                  <label>Provinsi</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "50%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    value={namaKabKota}
                    disabled={true}
                  />
                  <label>Kab/Kota</label>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              {/* <div className="card-body">
                <h5 className="card-title h5">Periode Laporan</h5>
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
                    onChange={(e) => setTahun(e.target.value)}
                    min="0"
                    maxLength={4}
                    onInput={(e) => maxLengthCheck(e)}
                    onPaste={preventPasteNegative}
                  />
                  <label htmlFor="tahun">Tahun</label>
                </div>
              </div> */}

              <div className="card-body">
                <h5 className="card-title h5">Periode Laporan</h5>

                <div className="form-floating" style={{ width: "100%" }}>
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
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-md-12">
            <div className={style.headerAction}>
              <Link to="/rl319">
                <button type="button" className={style.btnPrimary}>
                  <IoArrowBack />
                </button>
              </Link>
              <span className={style.backText}>
                <h4 className={style.pageHeader}>RL 3.19 - Cara Bayar</h4>
              </span>
            </div>

            <div className={`${style["table-container"]} mt-2 mb-1 pb-2 `}>
              <table className={style.table}>
                <thead className={style.thead}>
                  <tr className="main-header-row">
                    <th
                      className={style["sticky-header"]}
                      style={{ width: "4%" }}
                      rowSpan={2}
                    >
                      No.
                    </th>
                    <th style={{ width: "3%" }} rowSpan={2}>
                      <small>input</small>
                    </th>
                    <th
                      className={style["sticky-header"]}
                      style={{ width: "4%" }}
                      rowSpan={2}
                    >
                      No. Cara Bayar
                    </th>
                    <th
                      className={style["sticky-header"]}
                      style={{ width: "15%" }}
                      rowSpan={2}
                    >
                      Cara Pembayaran
                    </th>
                    <th colSpan={2}>Pasien Rawat Inap</th>
                    <th
                      style={{ width: "5%", verticalAlign: "middle" }}
                      rowSpan={2}
                    >
                      Jumlah Pasien Rawat Jalan
                    </th>
                    <th colSpan={3}>Pasien Rawat Jalan</th>
                  </tr>
                  <tr className={style["subheader-row"]}>
                    <th style={{ width: "5%" }}>Jumlah Pasien Keluar</th>
                    <th style={{ width: "5%" }}>Jumlah Lama Dirawat</th>
                    <th style={{ width: "5%" }}>Laboratorium</th>
                    <th style={{ width: "5%" }}>Radiologi</th>
                    <th style={{ width: "5%" }}>Lain-lain</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRL.map((value, index) => {
                    return (
                      <tr key={value.id}>
                        <td
                          className={style["sticky-column"]}
                          style={{ textAlign: "center" }}
                        >
                          {/* <input
                            type="text"
                            name="id"
                            className="form-control"
                            value={//index + 1}
                            disabled={true}
                          /> */}

                          {index + 1}
                        </td>
                        <td
                          className={style["sticky-column"]}
                          style={{ textAlign: "center" }}
                        >
                          <input
                            type="checkbox"
                            name="check"
                            className="form-check-input"
                            onChange={(e) => changeHandler(e, index)}
                            checked={value.checked}
                          />
                        </td>
                        <td
                          className={style["sticky-column"]}
                          style={{ textAlign: "center" }}
                        >
                          {/* <input
                            type="text"
                            name="no"
                            className="form-control"
                            value={value.no}
                            disabled={true}
                          /> */}
                          {value.no}
                        </td>
                        <td className={style["sticky-column"]}>
                          {/* <input
                            type="text"
                            name="golonganObat"
                            className="form-control"
                            value={value.golonganObat}
                            disabled={true}
                          /> */}
                          {value.golonganObat}
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            onPaste={preventPasteNegative}
                            name="ranap_pasien_keluar"
                            className="form-control"
                            value={value.ranap_pasien_keluar}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            onPaste={preventPasteNegative}
                            name="ranap_lama_dirawat"
                            className="form-control"
                            value={value.ranap_lama_dirawat}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            maxLength={7}
                            // onInput={(e) => maxLengthCheck(e)}
                            // onPaste={preventPasteNegative}
                            name="jumlah_pasien_rajal"
                            className="form-control"
                            value={value.jumlah_pasien_rajal}
                            // onChange={(e) => changeHandler(e, index)}
                            // disabled={value.disabledInput}
                            disabled={true}
                            readOnly={true}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            onPaste={preventPasteNegative}
                            name="rajal_lab"
                            className="form-control"
                            value={value.rajal_lab}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            onPaste={preventPasteNegative}
                            name="rajal_radiologi"
                            className="form-control"
                            value={value.rajal_radiologi}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            onPaste={preventPasteNegative}
                            name="rajal_lain_lain"
                            className="form-control"
                            value={value.rajal_lain_lain}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="mt-3 mb-3">
          <ToastContainer />
          <button
            type="submit"
            className={style.btnPrimary}
            disabled={buttonStatus}
          >
            <HiSaveAs /> Simpan
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormTambahRL319;
