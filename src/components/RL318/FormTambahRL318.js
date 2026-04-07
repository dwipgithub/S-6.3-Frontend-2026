import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL318.module.css"; // Pastikan file ini ada
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Table from "react-bootstrap/esm/Table";
import Spinner from "react-bootstrap/esm/Spinner";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import { IoArrowBack } from "react-icons/io5";

const FormTambahRL318 = () => {
  // const [tahun, setTahun] = useState("2025");
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [spinner, setSpinner] = useState(false);
  const [buttonStatus, setButtonStatus] = useState(false);
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();

  const startYear = 2025;
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = startYear; y <= currentYear; y++) {
    years.push(y);
  }

  useEffect(() => {
    refreshToken();
    getRLTigaTitikDelapanBelasTemplate();
  }, []);

  const refreshToken = async () => {
    try {
      const customConfig = { headers: { "XSRF-TOKEN": CSRFToken } };
      const response = await axios.get("/apisirs6v2/token", customConfig);
      setToken(response.data.accessToken);
      const decoded = jwt_decode(response.data.accessToken);
      setExpire(decoded.exp);
      getRumahSakit(decoded.satKerId);
    } catch (error) {
      if (error.response) navigate("/");
    }
  };

  const axiosJWT = axios.create();
  axiosJWT.interceptors.request.use(
    async (config) => {
      const currentDate = new Date();
      if (expire * 1000 < currentDate.getTime()) {
        const customConfig = { headers: { "XSRF-TOKEN": CSRFToken } };
        const response = await axios.get("/apisirs6v2/token", customConfig);
        config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        setToken(response.data.accessToken);
        const decoded = jwt_decode(response.data.accessToken);
        setExpire(decoded.exp);
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  const getRumahSakit = async (id) => {
    try {
      const response = await axiosJWT.get("/apisirs6v2/rumahsakit/" + id, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNamaRS(response.data.data.nama);
      setAlamatRS(response.data.data.alamat);
      setNamaPropinsi(response.data.data.provinsi_nama);
      setNamaKabKota(response.data.data.kab_kota_nama);
    } catch (error) {}
  };

  const getRLTigaTitikDelapanBelasTemplate = async () => {
    setSpinner(true);
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitikdelapanbelasgolonganobat",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const rlTemplate = response.data.data.map((value) => ({
        id: value.id,
        no: value.no,
        golonganObat: value.nama,
        rawatJalan: 0,
        igd: 0,
        rawatInap: 0,
        disabledInput: true,
        checked: false,
      }));
      setDataRL(rlTemplate);
      setSpinner(false);
    } catch (error) {
      setSpinner(false);
    }
  };

  const changeHandler = (event, index) => {
    let newDataRL = [...dataRL];
    const { name, value, checked, type } = event.target;

    if (name === "check") {
      newDataRL[index].disabledInput = !checked;
      newDataRL[index].checked = checked;
    } else {
      newDataRL[index][name] = value === "" ? 0 : value;
    }
    setDataRL(newDataRL);
  };

  const Simpan = async (e) => {
    e.preventDefault();
    setSpinner(true);
    setButtonStatus(true);
    try {
      const dataRLArray = dataRL
        .filter((v) => v.checked)
        .map((v) => ({
          golonganObatId: v.id,
          rawatJalan: parseInt(v.rawatJalan),
          igd: parseInt(v.igd),
          rawatInap: parseInt(v.rawatInap),
        }));

      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };
      await axiosJWT.post(
        "/apisirs6v2/rltigatitikdelapanbelas",
        {
          periodeTahun: parseInt(tahun),
          data: dataRLArray,
        },
        customConfig,
      );

      setSpinner(false);
      toast.success("Data Berhasil Disimpan");
      setTimeout(() => navigate("/rl318"), 1000);
    } catch (error) {
      toast.error(
        `Gagal simpan: ${error.response?.data?.message || error.message}`,
      );
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

  const maxLengthCheck = (object) => {
    if (object.target.value.length > object.target.maxLength) {
      object.target.value = object.target.value.slice(
        0,
        object.target.maxLength,
      );
    }
  };

  const totalRawatJalan = dataRL.reduce(
    (acc, item) => acc + Number(item.rawatJalan || 0),
    0,
  );

  const totalIGD = dataRL.reduce((acc, item) => acc + Number(item.igd || 0), 0);

  const totalRawatInap = dataRL.reduce(
    (acc, item) => acc + Number(item.rawatInap || 0),
    0,
  );

  return (
    <div
      className="container"
      style={{ marginTop: "20px", marginBottom: "70px" }}
    >
      <form onSubmit={Simpan}>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Profile Fasyankes</h5>

                <div className="form-floating mb-2">
                  <input
                    type="text"
                    className="form-control"
                    value={namaRS}
                    disabled
                  />
                  <label>Nama Rumah Sakit</label>
                </div>

                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    value={alamatRS}
                    disabled
                  />
                  <label>Alamat</label>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h6 className="card-title h5">Periode Laporan</h6>
                <div className="form-floating">
                  <select
                    className="form-select"
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
                  <label>Tahun Pelaporan</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-12">
            <div className={style.headerAction}>
              <Link to="/rl318">
                <button type="button" className={style.btnPrimary}>
                  ←
                </button>
              </Link>

              <h4 className={style.pageHeader}>RL 3.18 Farmasi Resep</h4>
            </div>

            <div className={style["table-container"]}>
              <table className={style.table}>
                <thead className={style.thead}>
                  <tr>
                    <th style={{ width: "5%" }}>No</th>
                    <th style={{ width: "5%" }}>Pilih</th>
                    <th>Golongan Obat</th>
                    <th style={{ width: "15%" }}>Rawat Jalan</th>
                    <th style={{ width: "15%" }}>IGD</th>
                    <th style={{ width: "15%" }}>Rawat Inap</th>
                  </tr>
                </thead>

                <tbody>
                  {dataRL.map((value, index) => (
                    <tr key={value.id}>
                      {/* NO */}
                      <td className={style.center}>{value.no}</td>

                      {/* CHECKBOX */}
                      <td className={style.center}>
                        <input
                          type="checkbox"
                          name="check"
                          onChange={(e) => changeHandler(e, index)}
                          checked={value.checked}
                        />
                      </td>

                      {/* NAMA */}
                      <td className={style.left}>{value.golonganObat}</td>

                      {/* INPUT */}
                      {["rawatJalan", "igd", "rawatInap"].map((field) => (
                        <td key={field} className={style.inputCell}>
                          <input
                            type="number"
                            name={field}
                            min={0}
                            maxLength={15}
                            onInput={(e) => maxLengthCheck(e)}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                            value={value[field]}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.no === "0" || value.disabledInput}
                            className={style.inputExcel}
                            style={{
                              width: "100%",
                              height: "100%",
                              textAlign: "center",
                              backgroundColor:
                                value.id === 88 || value.disabledInput
                                  ? "#e0e0e0"
                                  : "#ffffff",
                              border: "none",
                              outline: "none",
                              boxShadow: "none",
                              margin: 0,
                              padding: "8px 4px",
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* TOTAL */}
                  {dataRL.length > 0 && (
                    <tr className={style.totalRow}>
                      <td colSpan={3} className={style.center}>
                        <strong>TOTAL</strong>
                      </td>
                      <td className={style.center}>
                        <strong>{totalRawatJalan}</strong>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <strong>{totalIGD}</strong>
                      </td>
                      <td className={style.center}>
                        <strong>{totalRawatInap}</strong>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-4">
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

export default FormTambahRL318;
