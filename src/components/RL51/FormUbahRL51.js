import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { Link, useNavigate, useParams } from "react-router-dom";
import style from "./FormTambahRL51.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { IoArrowBack } from "react-icons/io5";
import { Spinner, Table } from "react-bootstrap";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

export const FormUbahRL51 = () => {
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const [buttonStatus, setButtonStatus] = useState(false);
  const [spinner, setSpinner] = useState(false);

  const [datainput, setDataInput] = useState(null);
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getRLLimatTitikSatu();
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
    }
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

  const getRLLimatTitikSatu = async () => {
    setSpinner(true);
    const response = await axiosJWT
      .get("/apisirs6v2/rllimatitiksatu/" + id, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setDataInput(response.data.data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
    setSpinner(false);
  };

  const UpdateRLLimaTitikSatu = async (e) => {
    e.preventDefault();
    setButtonStatus(true);

    const total =
      datainput.jumlah_L_dibawah_1_jam +
      datainput.jumlah_P_dibawah_1_jam +
      datainput.jumlah_L_1_sampai_23_jam +
      datainput.jumlah_P_1_sampai_23_jam +
      datainput.jumlah_L_1_sampai_7_hari +
      datainput.jumlah_P_1_sampai_7_hari +
      datainput.jumlah_L_8_sampai_28_hari +
      datainput.jumlah_P_8_sampai_28_hari +
      datainput.jumlah_L_29_hari_sampai_dibawah_3_bulan +
      datainput.jumlah_P_29_hari_sampai_dibawah_3_bulan +
      datainput.jumlah_L_3_bulan_sampai_dibawah_6_bulan +
      datainput.jumlah_P_3_bulan_sampai_dibawah_6_bulan +
      datainput.jumlah_L_6_bulan_sampai_11_bulan +
      datainput.jumlah_P_6_bulan_sampai_11_bulan +
      datainput.jumlah_L_1_sampai_4_tahun +
      datainput.jumlah_P_1_sampai_4_tahun +
      datainput.jumlah_L_5_sampai_9_tahun +
      datainput.jumlah_P_5_sampai_9_tahun +
      datainput.jumlah_L_10_sampai_14_tahun +
      datainput.jumlah_P_10_sampai_14_tahun +
      datainput.jumlah_L_15_sampai_19_tahun +
      datainput.jumlah_P_15_sampai_19_tahun +
      datainput.jumlah_L_20_sampai_24_tahun +
      datainput.jumlah_P_20_sampai_24_tahun +
      datainput.jumlah_L_25_sampai_29_tahun +
      datainput.jumlah_P_25_sampai_29_tahun +
      datainput.jumlah_L_30_sampai_34_tahun +
      datainput.jumlah_P_30_sampai_34_tahun +
      datainput.jumlah_L_35_sampai_39_tahun +
      datainput.jumlah_P_35_sampai_39_tahun +
      datainput.jumlah_L_40_sampai_44_tahun +
      datainput.jumlah_P_40_sampai_44_tahun +
      datainput.jumlah_L_45_sampai_49_tahun +
      datainput.jumlah_P_45_sampai_49_tahun +
      datainput.jumlah_L_50_sampai_54_tahun +
      datainput.jumlah_P_50_sampai_54_tahun +
      datainput.jumlah_L_55_sampai_59_tahun +
      datainput.jumlah_P_55_sampai_59_tahun +
      datainput.jumlah_L_60_sampai_64_tahun +
      datainput.jumlah_P_60_sampai_64_tahun +
      datainput.jumlah_L_65_sampai_69_tahun +
      datainput.jumlah_P_65_sampai_69_tahun +
      datainput.jumlah_L_70_sampai_74_tahun +
      datainput.jumlah_P_70_sampai_74_tahun +
      datainput.jumlah_L_75_sampai_79_tahun +
      datainput.jumlah_P_75_sampai_79_tahun +
      datainput.jumlah_L_80_sampai_84_tahun +
      datainput.jumlah_P_80_sampai_84_tahun +
      datainput.jumlah_L_diatas_85_tahun +
      datainput.jumlah_P_diatas_85_tahun;

    const totalMati =
      datainput.jumlah_kunjungan_L + datainput.jumlah_kunjungan_P;

    const {
      id,
      icd,
      icd_id,
      periode,
      rl_lima_titik_satu_id,
      rs_id,
      total_kasus_baru,
      total_jumlah_kunjungan,
      user_id,
      jumlah_kasus_baru_L,
      jumlah_kasus_baru_P,
      ...payloadInsert
    } = datainput;

    if (total <= totalMati) {
      try {
        const customConfig = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "XSRF-TOKEN": CSRFToken,
          },
        };
        await axiosJWT.patch(
          "/apisirs6v2/rllimatitiksatu/" + id,
          payloadInsert,
          customConfig
        );
        toast("Data Berhasil Diupdate", {
          position: toast.POSITION.TOP_RIGHT,
        });
        setTimeout(() => {
          navigate("/MENURL51");
        }, 1000);
      } catch (error) {
        toast("Data Gagal Diupdate, " + error.response.data.message, {
          position: toast.POSITION.TOP_RIGHT,
        });
        setButtonStatus(false);
      }
    } else {
      toast(
        `Data Gagal Disimpan, Data Jumlah Pasien Baru Lebih Dari Jumlah Kunjungan`,
        {
          position: toast.POSITION.TOP_RIGHT,
        }
      );
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

  const handleFocus = (event) => {
    event.target.select();
  };

  const changeHandler = (e, index) => {
    if (e.target.value === "") {
      e.target.value = 0;
      setDataInput({
        ...datainput,
        [e.target.name]: parseInt(e.target.value),
      });
    }
    setDataInput({
      ...datainput,
      [e.target.name]: parseInt(e.target.value),
    });
  };

  const maxLengthCheck = (object) => {
    if (object.target.value.length > object.target.maxLength) {
      object.target.value = object.target.value.slice(0, object.target.max);
    }
  };

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "100px" }}
    >
      <form onSubmit={UpdateRLLimaTitikSatu}>
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
                    id="namaRS"
                    value={namaRS}
                    disabled={true}
                  />
                  <label htmlFor="namaRS">Nama</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "100%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    id="alamatRS"
                    value={alamatRS}
                    disabled={true}
                  />
                  <label htmlFor="alamatRS">Alamat</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "50%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    id="provinsiRS"
                    value={namaPropinsi}
                    disabled={true}
                  />
                  <label htmlFor="provinsiRS">Provinsi </label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "50%", display: "inline-block" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    id="kabRS"
                    value={namaKabKota}
                    disabled={true}
                  />
                  <label htmlFor="kabRS">Kab/Kota</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        {datainput ? (
          <div className="row mt-3 mb-3">
            <div className="col-md-12">
              <Link
                to={`/rl51/`}
                className="btn btn-info"
                style={{
                  fontSize: "18px",
                  backgroundColor: "#779D9E",
                  color: "#FFFFFF",
                }}
              >
                &lt;
              </Link>
              <span style={{ color: "gray" }}>
                {" "}
                Kembali RL 5.1 Mobiditas Pasien Rawat Jalan
              </span>
              <h6>Detail Penyakit :</h6>
              <h6>Kode ICD : {datainput.icd.icd_code}</h6>
              <h6>Deskripsi ICD : {datainput.icd.description_code}</h6>
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
              <Table className={style.rlTable} style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Golongan Berdasarkan Umur</th>
                    <th>Laki Laki</th>
                    <th>Perempuan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td> &lt; 1 Jam</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_dibawah_1_jam"
                        className="form-control"
                        value={datainput.jumlah_L_dibawah_1_jam}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_dibawah_1_jam"
                        className="form-control"
                        value={datainput.jumlah_P_dibawah_1_jam}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>1 - 23 Jam</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_1_sampai_23_jam"
                        className="form-control"
                        value={datainput.jumlah_L_1_sampai_23_jam}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_1_sampai_23_jam"
                        className="form-control"
                        value={datainput.jumlah_P_1_sampai_23_jam}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>1 - 7 Hari</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_1_sampai_7_hari"
                        className="form-control"
                        value={datainput.jumlah_L_1_sampai_7_hari}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_1_sampai_7_hari"
                        className="form-control"
                        value={datainput.jumlah_P_1_sampai_7_hari}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>8 - 28 Hari</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_8_sampai_28_hari"
                        className="form-control"
                        value={datainput.jumlah_L_8_sampai_28_hari}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_8_sampai_28_hari"
                        className="form-control"
                        value={datainput.jumlah_P_8_sampai_28_hari}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>29 Hari - &lt;3 Bulan</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_29_hari_sampai_dibawah_3_bulan"
                        className="form-control"
                        value={
                          datainput.jumlah_L_29_hari_sampai_dibawah_3_bulan
                        }
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_29_hari_sampai_dibawah_3_bulan"
                        className="form-control"
                        value={
                          datainput.jumlah_P_29_hari_sampai_dibawah_3_bulan
                        }
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>3 - &lt;6 Bulan</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_3_bulan_sampai_dibawah_6_bulan"
                        className="form-control"
                        value={
                          datainput.jumlah_L_3_bulan_sampai_dibawah_6_bulan
                        }
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_3_bulan_sampai_dibawah_6_bulan"
                        className="form-control"
                        value={
                          datainput.jumlah_P_3_bulan_sampai_dibawah_6_bulan
                        }
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td> 6 - 11 Bulan</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_6_bulan_sampai_11_bulan"
                        className="form-control"
                        value={datainput.jumlah_L_6_bulan_sampai_11_bulan}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_6_bulan_sampai_11_bulan"
                        className="form-control"
                        value={datainput.jumlah_P_6_bulan_sampai_11_bulan}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>1 - 4 Tahun</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_1_sampai_4_tahun"
                        className="form-control"
                        value={datainput.jumlah_L_1_sampai_4_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_1_sampai_4_tahun"
                        className="form-control"
                        value={datainput.jumlah_P_1_sampai_4_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>5 - 9 Tahun</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_5_sampai_9_tahun"
                        className="form-control"
                        value={datainput.jumlah_L_5_sampai_9_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_5_sampai_9_tahun"
                        className="form-control"
                        value={datainput.jumlah_P_5_sampai_9_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>10 - 14 Tahu</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_10_sampai_14_tahun"
                        className="form-control"
                        value={datainput.jumlah_L_10_sampai_14_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_10_sampai_14_tahun"
                        className="form-control"
                        value={datainput.jumlah_P_10_sampai_14_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>15 - 19 Tahun</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_15_sampai_19_tahun"
                        className="form-control"
                        value={datainput.jumlah_L_15_sampai_19_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_15_sampai_19_tahun"
                        className="form-control"
                        value={datainput.jumlah_P_15_sampai_19_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>20 - 24 Tahun</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_20_sampai_24_tahun"
                        className="form-control"
                        value={datainput.jumlah_L_20_sampai_24_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_20_sampai_24_tahun"
                        className="form-control"
                        value={datainput.jumlah_P_20_sampai_24_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>25 - 29 Tahun</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_25_sampai_29_tahun"
                        className="form-control"
                        value={datainput.jumlah_L_25_sampai_29_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_25_sampai_29_tahun"
                        className="form-control"
                        value={datainput.jumlah_P_25_sampai_29_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>30 - 34 Tahun</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_30_sampai_34_tahun"
                        className="form-control"
                        value={datainput.jumlah_L_30_sampai_34_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_30_sampai_34_tahun"
                        className="form-control"
                        value={datainput.jumlah_P_30_sampai_34_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>35 - 39 Tahun</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_35_sampai_39_tahun"
                        className="form-control"
                        value={datainput.jumlah_L_35_sampai_39_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_35_sampai_39_tahun"
                        className="form-control"
                        value={datainput.jumlah_P_35_sampai_39_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>40 - 44 Tahun</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_40_sampai_44_tahun"
                        className="form-control"
                        value={datainput.jumlah_L_40_sampai_44_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_40_sampai_44_tahun"
                        className="form-control"
                        value={datainput.jumlah_P_40_sampai_44_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>45 - 49 Tahun</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_45_sampai_49_tahun"
                        className="form-control"
                        value={datainput.jumlah_L_45_sampai_49_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_45_sampai_49_tahun"
                        className="form-control"
                        value={datainput.jumlah_P_45_sampai_49_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>50 - 54 Tahun</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_50_sampai_54_tahun"
                        className="form-control"
                        value={datainput.jumlah_L_50_sampai_54_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_50_sampai_54_tahun"
                        className="form-control"
                        value={datainput.jumlah_P_50_sampai_54_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>55 - 59 Tahun</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_55_sampai_59_tahun"
                        className="form-control"
                        value={datainput.jumlah_L_55_sampai_59_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_55_sampai_59_tahun"
                        className="form-control"
                        value={datainput.jumlah_P_55_sampai_59_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>60 - 64 Tahun</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_60_sampai_64_tahun"
                        className="form-control"
                        value={datainput.jumlah_L_60_sampai_64_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_60_sampai_64_tahun"
                        className="form-control"
                        value={datainput.jumlah_P_60_sampai_64_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>65 - 69 Tahun</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_65_sampai_69_tahun"
                        className="form-control"
                        value={datainput.jumlah_L_65_sampai_69_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_65_sampai_69_tahun"
                        className="form-control"
                        value={datainput.jumlah_P_65_sampai_69_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>70 - 74 Tahun</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_70_sampai_74_tahun"
                        className="form-control"
                        value={datainput.jumlah_L_70_sampai_74_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_70_sampai_74_tahun"
                        className="form-control"
                        value={datainput.jumlah_P_70_sampai_74_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>75 - 79 Tahun</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_75_sampai_79_tahun"
                        className="form-control"
                        value={datainput.jumlah_L_75_sampai_79_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_75_sampai_79_tahun"
                        className="form-control"
                        value={datainput.jumlah_P_75_sampai_79_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>80 - 84 Tahun</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_80_sampai_84_tahun"
                        className="form-control"
                        value={datainput.jumlah_L_80_sampai_84_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_80_sampai_84_tahun"
                        className="form-control"
                        value={datainput.jumlah_P_80_sampai_84_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>≥ 85 Tahun</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_L_diatas_85_tahun"
                        className="form-control"
                        value={datainput.jumlah_L_diatas_85_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_P_diatas_85_tahun"
                        className="form-control"
                        value={datainput.jumlah_P_diatas_85_tahun}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Jumlah Kunjungan</td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_kunjungan_L"
                        className="form-control"
                        value={datainput.jumlah_kunjungan_L}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="jumlah_kunjungan_P"
                        className="form-control"
                        value={datainput.jumlah_kunjungan_P}
                        placeholder="Jumlah"
                        min={0}
                        maxLength={7}
                        onInput={(e) => maxLengthCheck(e)}
                        onPaste={preventPasteNegative}
                        onKeyPress={preventMinus}
                        onFocus={handleFocus}
                        onChange={(e) => changeHandler(e)}
                      />
                    </td>
                  </tr>
                </tbody>
              </Table>
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
              {/* )} */}
            </div>
          </div>
        ) : (
          <div className="container" style={{ textAlign: "center" }}>
            {/* <h5>test</h5> */}
            {spinner && <Spinner animation="grow" variant="success"></Spinner>}
            {spinner && <Spinner animation="grow" variant="success"></Spinner>}
            {spinner && <Spinner animation="grow" variant="success"></Spinner>}
            {spinner && <Spinner animation="grow" variant="success"></Spinner>}
            {spinner && <Spinner animation="grow" variant="success"></Spinner>}
            {spinner && <Spinner animation="grow" variant="success"></Spinner>}
          </div>
        )}
      </form>
    </div>
  );
};

export default FormUbahRL51;
