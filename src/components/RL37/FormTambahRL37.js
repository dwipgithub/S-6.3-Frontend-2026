import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./FormTambahRL37.module.css";
import { HiSaveAs } from "react-icons/hi";
import { IoArrowBack } from "react-icons/io5";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Table from "react-bootstrap/Table";
import Spinner from "react-bootstrap/Spinner";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const FormTambahRL37 = () => {
  const [tahun, setTahun] = useState("2025");
  const [bulan, setBulan] = useState("00");
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();
  const [buttonStatus, setButtonStatus] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getRLTigaTitikTujuhTemplate();
    const date = new Date();
    // setTahun(date.getFullYear())

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
    }
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

  const getRLTigaTitikTujuhTemplate = async () => {
    setSpinner(true);
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/jeniskegiatanrltigatitiktujuh",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const rlTemplate = response.data.data.map((value, index) => {
        return {
          id: value.id,
          no: value.no,
          jenisKegiatan: value.nama,
          rmRumahSakit: 0,
          rmBidan: 0,
          rmPuskesmas: 0,
          rmFaskesLainnya: 0,
          rmHidup: 0,
          rmMati: 0,
          rmTotal: 0,
          rnmHidup: 0,
          rnmMati: 0,
          rnmTotal: 0,
          nrHidup: 0,
          nrMati: 0,
          nrTotal: 0,
          dirujuk: 0,
          disabledInput: true,
          checked: false,
        };
      });
      setDataRL(rlTemplate);
      setSpinner(false);
    } catch (error) {}
  };

  const changeHandlerSingle = (event) => {
    const name = event.target.name;
    if (name === "tahun") {
      setTahun(parseInt(event.target.value));
    } else if (name === "bulan") {
      setBulan(parseInt(event.target.value));
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
      newDataRL[index].rmHidup =
        parseInt(dataRL[index].rmTotal) - parseInt(dataRL[index].rmMati);
    } else if (name === "rmRumahSakit") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rmRumahSakit = parseInt(event.target.value);
      newDataRL[index].rmTotal =
        parseInt(event.target.value) +
        parseInt(dataRL[index].rmBidan) +
        parseInt(dataRL[index].rmPuskesmas) +
        parseInt(dataRL[index].rmFaskesLainnya);
      newDataRL[index].rmHidup =
        parseInt(dataRL[index].rmTotal) - parseInt(dataRL[index].rmMati);
    } else if (name === "rmBidan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rmBidan = parseInt(event.target.value);
      newDataRL[index].rmTotal =
        parseInt(event.target.value) +
        parseInt(dataRL[index].rmRumahSakit) +
        parseInt(dataRL[index].rmPuskesmas) +
        parseInt(dataRL[index].rmFaskesLainnya);
      newDataRL[index].rmHidup =
        parseInt(dataRL[index].rmTotal) - parseInt(dataRL[index].rmMati);
    } else if (name === "rmPuskesmas") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rmPuskesmas = parseInt(event.target.value);
      newDataRL[index].rmTotal =
        parseInt(event.target.value) +
        parseInt(dataRL[index].rmBidan) +
        parseInt(dataRL[index].rmRumahSakit) +
        parseInt(dataRL[index].rmFaskesLainnya);
      newDataRL[index].rmHidup =
        parseInt(dataRL[index].rmTotal) - parseInt(dataRL[index].rmMati);
    } else if (name === "rmFaskesLainnya") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rmFaskesLainnya = parseInt(event.target.value);
      newDataRL[index].rmTotal =
        parseInt(event.target.value) +
        parseInt(dataRL[index].rmBidan) +
        parseInt(dataRL[index].rmPuskesmas) +
        parseInt(dataRL[index].rmRumahSakit);
      newDataRL[index].rmHidup =
        parseInt(dataRL[index].rmTotal) - parseInt(dataRL[index].rmMati);
    } else if (name === "rmHidup") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rmHidup = parseInt(event.target.value);
      newDataRL[index].rmHidup =
        parseInt(dataRL[index].rmTotal) - parseInt(dataRL[index].rmMati);
    } else if (name === "rmMati") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rmMati = parseInt(event.target.value);
      newDataRL[index].rmHidup =
        parseInt(dataRL[index].rmTotal) - parseInt(event.target.value);
    } else if (name === "rmTotal") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rmTotal = parseInt(event.target.value);
    } else if (name === "rnmHidup") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rnmHidup = parseInt(event.target.value);
      newDataRL[index].rnmTotal =
        parseInt(event.target.value) + parseInt(dataRL[index].rnmMati);
    } else if (name === "rnmMati") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rnmMati = parseInt(event.target.value);
      newDataRL[index].rnmTotal =
        parseInt(event.target.value) + parseInt(dataRL[index].rnmHidup);
    } else if (name === "rnmTotal") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rnmTotal = parseInt(event.target.value);
    } else if (name === "nrHidup") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].nrHidup = parseInt(event.target.value);
      newDataRL[index].nrTotal =
        parseInt(event.target.value) + parseInt(dataRL[index].nrMati);
    } else if (name === "nrMati") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].nrMati = parseInt(event.target.value);
      newDataRL[index].nrTotal =
        parseInt(event.target.value) + parseInt(dataRL[index].nrHidup);
    } else if (name === "nrTotal") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].nrTotal = parseInt(event.target.value);
    } else if (name === "dirujuk") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      // newDataRL[index].dirujuk = parseInt(event.target.value)

      if (
        parseInt(event.target.value) >
        parseInt(dataRL[index].rmTotal) +
          parseInt(dataRL[index].rnmTotal) +
          parseInt(dataRL[index].nrTotal)
      ) {
        alert(
          "Total Dirujuk tidak boleh lebih besar dari RM Total + RNM Total + NR TOTAL"
        );
        newDataRL[index].dirujuk = 0;
      } else {
        newDataRL[index].dirujuk = parseInt(event.target.value);
      }
    }

    setDataRL(newDataRL);

    // let checkedDataRL = [...dataRL]
    // if(dataRL[3].checked === false && dataRL[4].checked === false && dataRL[5].checked === false && dataRL[6].checked === false && dataRL[7].checked === false && dataRL[8].checked === false){
    //     checkedDataRL[2].checked = false
    //     setDataRL(checkedDataRL)
    // }
  };

  const Simpan = async (e) => {
    let date = tahun + "-" + bulan + "-01";
    e.preventDefault();
    setSpinner(true);
    setButtonStatus(true);
    try {
      const dataRLArray = dataRL
        .filter((value) => {
          return value.checked === true;
        })
        .map((value, index) => {
          return {
            jenisKegiatanId: value.id,
            rmRumahSakit: value.rmRumahSakit,
            rmBidan: value.rmBidan,
            rmPuskesmas: value.rmPuskesmas,
            rmFaskesLainnya: value.rmFaskesLainnya,
            rmHidup: value.rmHidup,
            rmMati: value.rmMati,
            rmTotal: value.rmTotal,
            rnmHidup: value.rnmHidup,
            rnmMati: value.rnmMati,
            rnmTotal: value.rnmTotal,
            nrHidup: value.nrHidup,
            nrMati: value.nrMati,
            nrTotal: value.nrTotal,
            dirujuk: value.dirujuk,
          };
        });

      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };
      if (bulan === "00" || bulan == 0) {
        toast(`Data tidak bisa disimpan karena belum pilih periode laporan`, {
          position: toast.POSITION.TOP_RIGHT,
        });
        setButtonStatus(false);
        setSpinner(false);
      } else {
        const result = await axiosJWT.post(
          "/apisirs6v2/rltigatitiktujuh",
          {
            tahun: parseInt(tahun),
            tahunDanBulan: date,
            data: dataRLArray,
          },
          customConfig
        );
        console.log(result.data);
        setSpinner(false);
        toast("Data Berhasil Disimpan", {
          position: toast.POSITION.TOP_RIGHT,
        });
        setTimeout(() => {
          navigate("/rl37");
        }, 1000);
      }
    } catch (error) {
      console.log(error);
      toast("Data Gagal Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setButtonStatus(false);
      setSpinner(false);
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

  const handleFocus = (event) => {
    event.target.select();
  };

  const maxLengthCheck = (object) => {
    if (object.target.value.length > object.target.maxLength) {
      object.target.value = object.target.value.slice(
        0,
        object.target.maxLength
      );
    }
  };

  const currentYear = new Date().getFullYear();
  const daftarTahun = [];
  for (let i = 2025; i <= currentYear; i++) {
    daftarTahun.push(i);
  }


  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      <form onSubmit={Simpan}>
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
                    id="nama"
                    value={namaRS}
                    disabled={true}
                  />
                  <label htmlFor="nama">Nama</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "100%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    id="alamat"
                    value={alamatRS}
                    disabled={true}
                  />
                  <label htmlFor="alamat">Alamat</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "50%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    id="provinsi"
                    value={namaPropinsi}
                    disabled={true}
                  />
                  <label htmlFor="provinsi">Provinsi </label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "50%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    id="kabkota"
                    value={namaKabKota}
                    disabled={true}
                  />
                  <label htmlFor="kabkota">Kab/Kota</label>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title h5">Periode Laporan</h5>
                <div
                  className="form-floating"
                  style={{ width: "100%", display: "inline-block" }}
                >
                  <select
                    name="tahun"
                    className="form-control"
                    id="floatingInput"
                    value={tahun}
                    onChange={(e) => changeHandlerSingle(e)}
                  >
                    {daftarTahun.map((tahun) => (
                      <option key={tahun} value={tahun}>
                        {tahun}
                      </option>
                    ))}
                  </select>

                  <label htmlFor="floatingInput">Tahun</label>
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
                    <option value="00">--Pilih Bulan--</option>
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
            </div>
          </div>
        </div>
        <div className="row mt-3">
          <div className="col-md-12">
            <Link
              to={`/rl37/`}
              className="btn btn-info"
              style={{
                fontSize: "18px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
            >
              {/* <IoArrowBack size={30} style={{color:"gray",cursor: "pointer"}}/><span style={{color: "gray"}}></span>
                            <span style={{color:"gray"}}>Tambah data RL 3.5 -  Kunjungan Rawat Jalan</span> */}
              &lt;
            </Link>
            <span style={{ color: "gray" }}>
              Kembali RL 3.7 - Neonatal, Bayi, dan Balita
            </span>
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
            {/* <Table
                            className={style.rlTable}
                            striped
                            bordered
                            responsive
                            style={{ width: "200%" }}
                        > */}
            <div className={`${style["table-container"]} mt-2 mb-1 pb-2 `}>
              <table
                className={style.table}
                striped
                bordered
                responsive
                style={{ width: "200%" }}
              >
                <thead className={style.thead}>
                  {/* <tr> */}
                  <tr className="main-header-row">
                    <th
                      className={style["sticky-header"]}
                      rowSpan="2"
                      style={{ width: "50px" }}
                    >
                      No.
                    </th>
                    <th
                      className={style["sticky-header"]}
                      rowSpan="2"
                      style={{ width: "35px" }}
                    ></th>
                    <th
                      className={style["sticky-header"]}
                      rowSpan="2"
                      style={{ width: "300px" }}
                    >
                      Jenis Kegiatan
                    </th>
                    <th>Rujukan Medis Rumah Sakit</th>
                    <th>Rujukan Medis Bidan</th>
                    <th>Rujukan Medis Puskesmas</th>
                    <th>Rujukan Medis Faskes Lainnya</th>
                    <th>Rujukan Medis Hidup</th>
                    <th>Rujukan Medis Mati</th>
                    <th>Rujukan Medis Total</th>
                    <th>Rujukan Non Medis Hidup</th>
                    <th>Rujukan Non Medis Mati</th>
                    <th>Rujukan Non Medis Total</th>
                    <th>Non Rujukan Hidup</th>
                    <th>Non Rujukan Mati</th>
                    <th>Non Rujukan Total</th>
                    <th>Dirujuk</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRL.map((value, index) => {
                    let disabled = false;
                    let visibled = "block";
                    let disabledRmMati = true;
                    let disabledRnmMati = true;
                    let disabledNRMati = true;
                    let disabledDirujuk = true;
                    let disabledrmRumahSakit = true;
                    let disabledrmBidan = true;
                    let disabledrmPuskesmas = true;
                    let disabledrmFaskesLainnya = true;
                    let disabledrmHidup = true;
                    let disabledrnmHidup = true;
                    let disablednrHidup = true;
                    // if(value.no == 1 || value.no == 2 || value.no == 3){
                    //     disabled = true
                    //     visibled = "none"
                    // } else {
                    //     disabled = false
                    //     visibled = "block"
                    // }

                    if (value.no === "0") {
                      disabledRmMati = true;
                      disabledRnmMati = true;
                      disabledNRMati = true;
                      disabledDirujuk = true;
                      disabledrmRumahSakit = true;
                      disabledrmBidan = true;
                      disabledrmPuskesmas = true;
                      disabledrmFaskesLainnya = true;
                      disabledrmHidup = true;
                      disabledrnmHidup = true;
                      disablednrHidup = true;
                    } else {
                      if (value.checked === false) {
                        disabledRmMati = true;
                        disabledRnmMati = true;
                        disabledNRMati = true;
                        disabledDirujuk = true;
                      } else {
                        if (
                          value.no === "2.1" ||
                          value.no === "2.2" ||
                          value.no === "3.1" ||
                          value.no === "3.2"
                        ) {
                          disabledRmMati = false;
                          disabledRnmMati = false;
                          disabledNRMati = false;
                          // disabledDirujuk = false
                          disabledrmRumahSakit = false;
                          disabledrmBidan = false;
                          disabledrmPuskesmas = false;
                          disabledrmFaskesLainnya = false;
                          value.rmHidup = 0;
                          value.rmMati =
                            value.rmRumahSakit +
                            value.rmBidan +
                            value.rmPuskesmas +
                            value.rmFaskesLainnya;
                          // disabledrnmHidup = false
                          disabledRmMati = true;
                        } else {
                          disabledRmMati = false;
                          disabledRnmMati = false;
                          disabledNRMati = false;
                          disabledDirujuk = false;
                          disabledrmRumahSakit = false;
                          disabledrmBidan = false;
                          disabledrmPuskesmas = false;
                          disabledrmFaskesLainnya = false;
                          disabledrnmHidup = false;
                          disablednrHidup = false;
                        }
                      }
                    }
                    return (
                      <tr key={value.id}>
                        <td className={style["sticky-column"]}>
                          <input
                            type="hidden"
                            name="id"
                            value={value.id}
                            disabled={true}
                          />
                          {/* <input type='text' name='no' className="form-control" value={value.no} disabled={true}/> */}
                          {value.no}
                        </td>
                        <td
                          className={style["sticky-column"]}
                          style={{
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          <input
                            type="checkbox"
                            name="check"
                            className="form-check-input"
                            onChange={(e) => changeHandler(e, index)}
                            checked={value.checked}
                            disabled={disabled}
                            style={{ display: visibled }}
                          />
                        </td>
                        <td className={style["sticky-column"]}>
                          {/* <input type="text" name="jenisKegiatan" className="form-control" value={value.jenisKegiatan} disabled={true} /> */}
                          {value.jenisKegiatan}
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            onFocus={handleFocus}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="rmRumahSakit"
                            className="form-control"
                            value={value.rmRumahSakit}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={disabledrmRumahSakit}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            onFocus={handleFocus}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="rmBidan"
                            className="form-control"
                            value={value.rmBidan}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={disabledrmBidan}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            onFocus={handleFocus}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="rmPuskesmas"
                            className="form-control"
                            value={value.rmPuskesmas}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={disabledrmPuskesmas}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            onFocus={handleFocus}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="rmFaskesLainnya"
                            className="form-control"
                            value={value.rmFaskesLainnya}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={disabledrmFaskesLainnya}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            onFocus={handleFocus}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="rmHidup"
                            className="form-control"
                            value={value.rmHidup}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={disabledrmHidup}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            onFocus={handleFocus}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="rmMati"
                            className="form-control"
                            value={value.rmMati}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={disabledRmMati}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            onFocus={handleFocus}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="rmTotal"
                            className="form-control"
                            value={value.rmTotal}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={true}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            onFocus={handleFocus}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="rnmHidup"
                            className="form-control"
                            value={value.rnmHidup}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={disabledrnmHidup}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            onFocus={handleFocus}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="rnmMati"
                            className="form-control"
                            value={value.rnmMati}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={disabledRnmMati}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            onFocus={handleFocus}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="rnmTotal"
                            className="form-control"
                            value={value.rnmTotal}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={true}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            onFocus={handleFocus}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="nrHidup"
                            className="form-control"
                            value={value.nrHidup}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={disablednrHidup}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            onFocus={handleFocus}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="nrMati"
                            className="form-control"
                            value={value.nrMati}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={disabledNRMati}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            onFocus={handleFocus}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="nrTotal"
                            className="form-control"
                            value={value.nrTotal}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={true}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            onFocus={handleFocus}
                            maxLength={7}
                            onInput={(e) => maxLengthCheck(e)}
                            name="dirujuk"
                            className="form-control"
                            value={value.dirujuk}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={disabledDirujuk}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
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
            disabled={buttonStatus}
            className="btn btn-outline-success"
          >
            <HiSaveAs /> Simpan
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormTambahRL37;
