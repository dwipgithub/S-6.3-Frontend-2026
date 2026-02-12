import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { Link, useNavigate, useParams } from "react-router-dom";
import style from "./RL41.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { IoArrowBack } from "react-icons/io5";
import { Spinner, Table } from "react-bootstrap";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

export const FormUbahRL41 = () => {
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

  // const [no, setNo] = useState("");
  // const [nodtd, setNoDTD] = useState("");
  // const [nama, setNama] = useState("");
  // const [par6hrL, setpar6hrL] = useState("");
  // const [par6hrP, setpar6hrP] = useState("");
  // const [par28hrL, setpar28hrL] = useState("");
  // const [par28hrP, setpar28hrP] = useState("");
  // const [par28hr1thL, setpar28hr1thL] = useState("");
  // const [par28hr1thP, setpar28hr1thP] = useState("");
  // const [par14thL, setpar14thL] = useState("");
  // const [par14thP, setpar14thP] = useState("");
  // const [par414thL, setpar414thL] = useState("");
  // const [par414thP, setpar414thP] = useState("");
  // const [par1424thL, setpar1424thL] = useState("");
  // const [par1424thP, setpar1424thP] = useState("");
  // const [par2444thL, setpar2444thL] = useState("");
  // const [par2444thP, setpar2444thP] = useState("");
  // const [par4464thL, setpar4464thL] = useState("");
  // const [par4464thP, setpar4464thP] = useState("");
  // const [parLebih64thL, setparLebih64thL] = useState("");
  // const [parLebih64thP, setparLebih64thP] = useState("");
  // const [jmlhPasKeluarMati, setjmlhPasKeluarMati] = useState("");

  useEffect(() => {
    refreshToken();
    getRLEmpatA();
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

  const getRLEmpatA = async () => {
    setSpinner(true);
    const response = await axiosJWT
      .get("/apisirs6v2/rlempattitiksatu/" + id, {
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

  const UpdateRLEmpatTitikSatu = async (e) => {
    e.preventDefault();
    setButtonStatus(true);

    const total =
      datainput.jmlh_pas_hidup_mati_umur_gen_0_1jam_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_0_1jam_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_1_23jam_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_1_23jam_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_1_7hr_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_1_7hr_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_8_28hr_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_8_28hr_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_29hr_3bln_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_29hr_3bln_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_3_6bln_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_3_6bln_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_6_11bln_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_6_11bln_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_1_4th_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_1_4th_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_5_9th_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_5_9th_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_10_14th_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_10_14th_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_15_19th_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_15_19th_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_20_24th_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_20_24th_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_25_29th_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_25_29th_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_30_34th_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_30_34th_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_35_39th_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_35_39th_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_40_44th_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_40_44th_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_45_49th_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_45_49th_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_50_54th_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_50_54th_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_55_59th_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_55_59th_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_60_64th_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_60_64th_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_65_69th_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_65_69th_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_70_74th_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_70_74th_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_75_79th_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_75_79th_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_80_84th_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_80_84th_p +
      datainput.jmlh_pas_hidup_mati_umur_gen_lebih85th_l +
      datainput.jmlh_pas_hidup_mati_umur_gen_lebih85th_p;

    const totalMati =
      datainput.jmlh_pas_keluar_mati_gen_l +
      datainput.jmlh_pas_keluar_mati_gen_p;

    const {
      icd,
      id,
      icd_id,
      periode,
      rl_empat_titik_satu_id,
      rs_id,
      total_pas_hidup_mati,
      total_pas_keluar_mati,
      user_id,
      jmlh_pas_hidup_mati_gen_l,
      jmlh_pas_hidup_mati_gen_p,
      ...payloadInsert
    } = datainput;

    // console.log("inih ", totalMati<=total, " " );
    if (totalMati <= total) {
      try {
        const customConfig = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "XSRF-TOKEN": CSRFToken,
          },
        };
        await axiosJWT.patch(
          "/apisirs6v2/rlempattitiksatu/" + id,
          payloadInsert,
          customConfig
        );
        toast("Data Berhasil Diupdate", {
          position: toast.POSITION.TOP_RIGHT,
        });
        setTimeout(() => {
          navigate("/rl41");
        }, 1000);
      } catch (error) {
        toast("Data Gagal Diupdate, " + error.response.data.message, {
          position: toast.POSITION.TOP_RIGHT,
        });
        setButtonStatus(false);
      }
    } else {
      toast(
        `Data Gagal Disimpan, Data Jumlah Pasien Keluar Mati Lebih Dari Jumlah Pasien Hidup dan Mati`,
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
    <div className="container" style={{ marginTop: "70px" }}>
      <form onSubmit={UpdateRLEmpatTitikSatu}>
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
        {datainput ? (
          <div className="row mt-3 mb-3">
            <div className="col-md-12">
              <Link
                to={`/rl41/`}
                className="btn btn-info"
                style={{
                  fontSize: "18px",
                  backgroundColor: "#779D9E",
                  color: "#FFFFFF",
                }}
              >
                {/* <IoArrowBack
                size={30}
                style={{ color: "gray", cursor: "pointer" }}
              /> */}
                &lt;
              </Link>
              <span style={{ color: "gray" }}>
                {" "}
                Kembali RL 41 Penyakit Rawat Inap
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
                        name="jmlh_pas_hidup_mati_umur_gen_0_1jam_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_0_1jam_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_0_1jam_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_0_1jam_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_1_23jam_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_1_23jam_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_1_23jam_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_1_23jam_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_1_7hr_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_1_7hr_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_1_7hr_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_1_7hr_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_8_28hr_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_8_28hr_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_8_28hr_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_8_28hr_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_29hr_3bln_l"
                        className="form-control"
                        value={
                          datainput.jmlh_pas_hidup_mati_umur_gen_29hr_3bln_l
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
                        name="jmlh_pas_hidup_mati_umur_gen_29hr_3bln_p"
                        className="form-control"
                        value={
                          datainput.jmlh_pas_hidup_mati_umur_gen_29hr_3bln_p
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
                        name="jmlh_pas_hidup_mati_umur_gen_3_6bln_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_3_6bln_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_3_6bln_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_3_6bln_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_6_11bln_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_6_11bln_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_6_11bln_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_6_11bln_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_1_4th_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_1_4th_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_1_4th_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_1_4th_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_5_9th_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_5_9th_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_5_9th_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_5_9th_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_10_14th_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_10_14th_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_10_14th_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_10_14th_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_15_19th_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_15_19th_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_15_19th_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_15_19th_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_20_24th_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_20_24th_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_20_24th_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_20_24th_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_25_29th_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_25_29th_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_25_29th_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_25_29th_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_30_34th_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_30_34th_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_30_34th_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_30_34th_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_35_39th_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_35_39th_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_35_39th_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_35_39th_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_40_44th_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_40_44th_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_40_44th_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_40_44th_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_45_49th_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_45_49th_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_45_49th_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_45_49th_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_50_54th_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_50_54th_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_50_54th_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_50_54th_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_55_59th_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_55_59th_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_55_59th_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_55_59th_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_60_64th_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_60_64th_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_60_64th_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_60_64th_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_65_69th_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_65_69th_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_65_69th_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_65_69th_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_70_74th_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_70_74th_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_70_74th_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_70_74th_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_75_79th_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_75_79th_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_75_79th_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_75_79th_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_80_84th_l"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_80_84th_l}
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
                        name="jmlh_pas_hidup_mati_umur_gen_80_84th_p"
                        className="form-control"
                        value={datainput.jmlh_pas_hidup_mati_umur_gen_80_84th_p}
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
                        name="jmlh_pas_hidup_mati_umur_gen_lebih85th_l"
                        className="form-control"
                        value={
                          datainput.jmlh_pas_hidup_mati_umur_gen_lebih85th_l
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
                        name="jmlh_pas_hidup_mati_umur_gen_lebih85th_p"
                        className="form-control"
                        value={
                          datainput.jmlh_pas_hidup_mati_umur_gen_lebih85th_p
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
                    <td>Jumlah Pasien Keluar Mati</td>
                    <td>
                      <input
                        type="number"
                        name="jmlh_pas_keluar_mati_gen_l"
                        className="form-control"
                        value={datainput.jmlh_pas_keluar_mati_gen_l}
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
                        name="jmlh_pas_keluar_mati_gen_p"
                        className="form-control"
                        value={datainput.jmlh_pas_keluar_mati_gen_p}
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
