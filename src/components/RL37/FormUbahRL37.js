import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, useParams, Link } from "react-router-dom";
import style from "./FormTambahRL37.module.css";
import { HiSaveAs } from "react-icons/hi";
import { IoArrowBack } from "react-icons/io5";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Table from "react-bootstrap/Table";
import Spinner from "react-bootstrap/Spinner";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

export const FormUbahRL37 = () => {
  const [tahun, setTahun] = useState("");
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  // const [jenisKegiatan, setJeniskegiatan] = useState('')

  const [no, setNo] = useState("");
  const [nama, setNama] = useState("");
  const [rmRumahSakit, setRmRumahSakit] = useState("");
  const [rmBidan, setRmBidan] = useState("");
  const [rmPuskesmas, setRmPuskesmas] = useState("");
  const [rmFaskesLainnya, setRmFaskesLainnya] = useState("");
  const [rmHidup, setRmHidup] = useState("");
  const [rmMati, setRmMati] = useState("");
  const [rmTotal, setRmTotal] = useState("");
  const [rnmHidup, setRnmHidup] = useState("");
  const [rnmMati, setRnmMati] = useState("");
  const [rnmTotal, setRnmTotal] = useState("");
  const [nrHidup, setNrHidup] = useState("");
  const [nrMati, setNrMati] = useState("");
  const [nrTotal, setNrTotal] = useState("");
  const [dirujuk, setDirujuk] = useState("");

  // const [dataRL, setDataRL] = useState([])
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();

  const [disabledRmMati, setDisabledRmMati] = useState("");
  const [disabledRnmMati, setDisabledRnmMati] = useState("");
  const [disabledNrMati, setDisabledNrMati] = useState("");

  // const [disabledDirujuk, setDisabledDirujuk] = useState('')

  const [buttonStatus, setButtonStatus] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getRLTigaTitikTujuhById();

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

  const changeHandlerSingle = (event) => {
    setTahun(parseInt(event.target.value));
  };

  const changeHandler = (event) => {
    const name = event.target.name;

    if (name === "rmRumahSakit") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setRmRumahSakit(parseInt(event.target.value));
      console.log(no);
      if (no === "2.1" || no === "2.2" || no === "3.1" || no === "3.2") {
        setRmMati(
          parseInt(event.target.value) +
            parseInt(rmBidan) +
            parseInt(rmPuskesmas) +
            parseInt(rmFaskesLainnya)
        );
      } else {
        setRmHidup(
          parseInt(event.target.value) +
            parseInt(rmBidan) +
            parseInt(rmPuskesmas) +
            parseInt(rmFaskesLainnya)
        );
      }
      setRmTotal(
        parseInt(event.target.value) +
          parseInt(rmBidan) +
          parseInt(rmPuskesmas) +
          parseInt(rmFaskesLainnya)
      );
    } else if (name === "rmBidan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setRmBidan(parseInt(event.target.value));
      if (no === "2.1" || no === "2.2" || no === "3.1" || no === "3.2") {
        setRmMati(
          parseInt(event.target.value) +
            parseInt(rmRumahSakit) +
            parseInt(rmPuskesmas) +
            parseInt(rmFaskesLainnya)
        );
      } else {
        setRmHidup(
          parseInt(event.target.value) +
            parseInt(rmRumahSakit) +
            parseInt(rmPuskesmas) +
            parseInt(rmFaskesLainnya)
        );
      }
      setRmTotal(
        parseInt(event.target.value) +
          parseInt(rmRumahSakit) +
          parseInt(rmPuskesmas) +
          parseInt(rmFaskesLainnya)
      );
    } else if (name === "rmPuskesmas") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setRmPuskesmas(parseInt(event.target.value));
      if (no === "2.1" || no === "2.2" || no === "3.1" || no === "3.2") {
        setRmMati(
          parseInt(event.target.value) +
            parseInt(rmBidan) +
            parseInt(rmRumahSakit) +
            parseInt(rmFaskesLainnya)
        );
      } else {
        setRmHidup(
          parseInt(event.target.value) +
            parseInt(rmBidan) +
            parseInt(rmRumahSakit) +
            parseInt(rmFaskesLainnya)
        );
      }
      setRmTotal(
        parseInt(event.target.value) +
          parseInt(rmBidan) +
          parseInt(rmRumahSakit) +
          parseInt(rmFaskesLainnya)
      );
    } else if (name === "rmFaskesLainnya") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setRmFaskesLainnya(parseInt(event.target.value));
      if (no === "2.1" || no === "2.2" || no === "3.1" || no === "3.2") {
        setRmMati(
          parseInt(event.target.value) +
            parseInt(rmBidan) +
            parseInt(rmPuskesmas) +
            parseInt(rmRumahSakit)
        );
      } else {
        setRmHidup(
          parseInt(event.target.value) +
            parseInt(rmBidan) +
            parseInt(rmPuskesmas) +
            parseInt(rmRumahSakit)
        );
      }
      setRmTotal(
        parseInt(event.target.value) +
          parseInt(rmBidan) +
          parseInt(rmPuskesmas) +
          parseInt(rmRumahSakit)
      );
    } else if (name === "rmHidup") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setRmHidup(parseInt(event.target.value));
    } else if (name === "rmMati") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setRmMati(parseInt(event.target.value));
      setRmHidup(parseInt(rmTotal) - parseInt(event.target.value));
    } else if (name === "rmTotal") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setRmTotal(parseInt(event.target.value));
    } else if (name === "rnmHidup") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setRnmHidup(parseInt(event.target.value));
      setRnmTotal(parseInt(event.target.value) + parseInt(rnmMati));
    } else if (name === "rnmMati") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setRnmMati(parseInt(event.target.value));
      setRnmTotal(parseInt(event.target.value) + parseInt(rnmHidup));
    } else if (name === "rnmTotal") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setRnmTotal(parseInt(event.target.value));
    } else if (name === "nrHidup") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setNrHidup(parseInt(event.target.value));
      setNrTotal(parseInt(event.target.value) + parseInt(nrMati));
    } else if (name === "nrMati") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setNrMati(parseInt(event.target.value));
      setNrTotal(parseInt(event.target.value) + parseInt(nrHidup));
    } else if (name === "nrTotal") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      setNrTotal(parseInt(event.target.value));
    } else if (name === "dirujuk") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      if (
        parseInt(event.target.value) >
        parseInt(rmTotal) + parseInt(rnmTotal) + parseInt(nrTotal)
      ) {
        alert(
          "Total Dirujuk tidak boleh lebih besar dari RM Total + RNM Total + NR TOTAL"
        );
        setDirujuk(0);
      } else {
        setDirujuk(parseInt(event.target.value));
      }
    }
  };

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
  const updateDataRLTigaTitikTujuh = async (e) => {
    e.preventDefault();
    setSpinner(true);
    setButtonStatus(true);
    try {
      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };
      await axiosJWT.patch(
        "/apisirs6v2/rltigatitiktujuhdetail/" + id,
        {
          rmRumahSakit,
          rmBidan,
          rmPuskesmas,
          rmFaskesLainnya,
          rmHidup,
          rmMati,
          rmTotal,
          rnmHidup,
          rnmMati,
          rnmTotal,
          nrHidup,
          nrMati,
          nrTotal,
          dirujuk,
        },
        customConfig
      );
      setSpinner(false);
      toast("Data Berhasil Diupdate", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setTimeout(() => {
        navigate("/rl37");
      }, 1000);
    } catch (error) {
      console.log(error);
      toast("Data Gagal Diupdate", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setButtonStatus(false);
      setSpinner(false);
    }
  };

  const getRLTigaTitikTujuhById = async () => {
    setSpinner(true);
    const response = await axiosJWT.get(
      "/apisirs6v2/rltigatitiktujuhdetail/" + id,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // console.log(response);
    setNama(response.data.data.jenis_kegiatan_rl_tiga_titik_tujuh.nama);
    setNo(response.data.data.jenis_kegiatan_rl_tiga_titik_tujuh.no);
    // setJeniskegiatan(response.data.data.rl_tiga_titik_lima_id);
    setRmRumahSakit(response.data.data.rmRumahSakit);
    setRmBidan(response.data.data.rmBidan);
    setRmPuskesmas(response.data.data.rmPuskesmas);
    setRmFaskesLainnya(response.data.data.rmFaskesLainnya);
    setRmHidup(response.data.data.rmHidup);
    setRmMati(response.data.data.rmMati);
    setRmTotal(response.data.data.rmTotal);
    setRnmHidup(response.data.data.rnmHidup);
    setRnmMati(response.data.data.rnmMati);
    setRnmTotal(response.data.data.rnmTotal);
    setNrHidup(response.data.data.nrHidup);
    setNrMati(response.data.data.nrMati);
    setNrTotal(response.data.data.nrTotal);
    setDirujuk(response.data.data.dirujuk);

    setTahun(response.data.data.tahun);
    setSpinner(false);
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

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      <form onSubmit={updateDataRLTigaTitikTujuh}>
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
          {/* <div className="col-md-6">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title h5">Periode Laporan</h5>
                                    <div className="form-floating" style={{width:"100%", display:"inline-block"}}>
                                        <input name="tahun" type="text" className="form-control" id="floatingInput" 
                                            placeholder="Tahun" value={tahun.substring(0,4)} onChange={e => changeHandlerSingle(e)} disabled={true}/>
                                        <label htmlFor="floatingInput">Tahun</label>
                                    </div>
                                    <div className="form-floating" style={{width:"100%", display:"inline-block"}}>
                                        <input name="bulan" type="text" className="form-control" id="floatingInput" 
                                            placeholder="bulan" value={tahun.substring(5,7)} onChange={e => changeHandlerSingle(e)} disabled={true}/>
                                        <label htmlFor="floatingInput">Bulan</label>
                                    </div>
                            </div>
                        </div>
                    </div> */}
        </div>
        <div className="row mt-3 mb-3">
          <div className="col-md-12">
            {/* <h3>Ubah data RL 5.1 -  Pengunjung</h3> */}
            <Link to={`/rl37/`} style={{ textDecoration: "none" }}>
              <IoArrowBack
                size={30}
                style={{ color: "gray", cursor: "pointer" }}
              />
              <span style={{ color: "gray" }}>
                Ubah data RL 3.7 - Neonatal, Bayi dan Balita
              </span>
            </Link>
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
            <Table
              className={style.table}
              striped
              bordered
              responsive
              style={{ width: "200%" }}
            >
              <thead className={style.thead}>
                <tr>
                  <th style={{ width: "3%" }}>No.</th>
                  <th style={{ width: "12%" }}>Jenis Kegiatan</th>
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
                <tr key={id}>
                  {
                    // console.log(disabledDirujuk)
                  }
                  <td>
                    <input
                      type="text"
                      name="id"
                      className="form-control"
                      value={no}
                      disabled={true}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      name="jenisKegiatan"
                      className="form-control"
                      value={nama}
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
                      name="rmRumahSakit"
                      className="form-control"
                      value={rmRumahSakit}
                      onChange={(e) => changeHandler(e)}
                      onPaste={preventPasteNegative}
                      onKeyPress={preventMinus}
                      disabled={false}
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
                      value={rmBidan}
                      onChange={(e) => changeHandler(e)}
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
                      value={rmPuskesmas}
                      onChange={(e) => changeHandler(e)}
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
                      value={rmFaskesLainnya}
                      onChange={(e) => changeHandler(e)}
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
                      value={rmHidup}
                      onChange={(e) => changeHandler(e)}
                      onPaste={preventPasteNegative}
                      onKeyPress={preventMinus}
                      disabled={true}
                    />
                  </td>
                  {no === "2.1" ||
                  no === "2.2" ||
                  no === "3.1" ||
                  no === "3.2" ? (
                    <td>
                      <input
                        type="number"
                        min="0"
                        onFocus={handleFocus}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        name="rmMati"
                        className="form-control"
                        value={rmMati}
                        onChange={(e) => changeHandler(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        disabled={true}
                      />
                    </td>
                  ) : (
                    <td>
                      <input
                        type="number"
                        min="0"
                        onFocus={handleFocus}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        name="rmMati"
                        className="form-control"
                        value={rmMati}
                        onChange={(e) => changeHandler(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        disabled={false}
                      />
                    </td>
                  )}
                  <td>
                    <input
                      type="number"
                      min="0"
                      onFocus={handleFocus}
                      maxLength={7}
                      onInput={(e) => maxLengthCheck(e)}
                      name="rmTotal"
                      className="form-control"
                      value={rmTotal}
                      onChange={(e) => changeHandler(e)}
                      onPaste={preventPasteNegative}
                      onKeyPress={preventMinus}
                      disabled={true}
                    />
                  </td>
                  {no === "2.1" ||
                  no === "2.2" ||
                  no === "3.1" ||
                  no === "3.2" ? (
                    <td>
                      <input
                        type="number"
                        min="0"
                        onFocus={handleFocus}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        name="rnmHidup"
                        className="form-control"
                        value={rnmHidup}
                        onChange={(e) => changeHandler(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        disabled={true}
                      />
                    </td>
                  ) : (
                    <td>
                      <input
                        type="number"
                        min="0"
                        onFocus={handleFocus}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        name="rnmHidup"
                        className="form-control"
                        value={rnmHidup}
                        onChange={(e) => changeHandler(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                  )}
                  <td>
                    <input
                      type="number"
                      min="0"
                      onFocus={handleFocus}
                      maxLength={7}
                      onInput={(e) => maxLengthCheck(e)}
                      name="rnmMati"
                      className="form-control"
                      value={rnmMati}
                      onChange={(e) => changeHandler(e)}
                      onPaste={preventPasteNegative}
                      onKeyPress={preventMinus}
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
                      value={rnmTotal}
                      onChange={(e) => changeHandler(e)}
                      onPaste={preventPasteNegative}
                      onKeyPress={preventMinus}
                      disabled={true}
                    />
                  </td>
                  {no === "2.1" ||
                  no === "2.2" ||
                  no === "3.1" ||
                  no === "3.2" ? (
                    <td>
                      <input
                        type="number"
                        min="0"
                        onFocus={handleFocus}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        name="nrHidup"
                        className="form-control"
                        value={nrHidup}
                        onChange={(e) => changeHandler(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        disabled={true}
                      />
                    </td>
                  ) : (
                    <td>
                      <input
                        type="number"
                        min="0"
                        onFocus={handleFocus}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        name="nrHidup"
                        className="form-control"
                        value={nrHidup}
                        onChange={(e) => changeHandler(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                  )}
                  <td>
                    <input
                      type="number"
                      min="0"
                      onFocus={handleFocus}
                      maxLength={7}
                      onInput={(e) => maxLengthCheck(e)}
                      name="nrMati"
                      className="form-control"
                      value={nrMati}
                      onChange={(e) => changeHandler(e)}
                      onPaste={preventPasteNegative}
                      onKeyPress={preventMinus}
                      disabled={disabledNrMati}
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
                      value={nrTotal}
                      onChange={(e) => changeHandler(e)}
                      onPaste={preventPasteNegative}
                      onKeyPress={preventMinus}
                      disabled={true}
                    />
                  </td>
                  {no === "2.1" ||
                  no === "2.2" ||
                  no === "3.1" ||
                  no === "3.2" ? (
                    <td>
                      <input
                        type="number"
                        min="0"
                        onFocus={handleFocus}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        name="dirujuk"
                        className="form-control"
                        value={dirujuk}
                        onChange={(e) => changeHandler(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        disabled={true}
                      />
                    </td>
                  ) : (
                    <td>
                      <input
                        type="number"
                        min="0"
                        onFocus={handleFocus}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        name="dirujuk"
                        className="form-control"
                        value={dirujuk}
                        onChange={(e) => changeHandler(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                      />
                    </td>
                  )}
                </tr>
              </tbody>
            </Table>
          </div>
        </div>
        <div className="mt-3 mb-3">
          <ToastContainer />
          <button
            type="submit"
            disabled={buttonStatus}
            className="btn btn-outline-success"
          >
            <HiSaveAs /> Update
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormUbahRL37;
