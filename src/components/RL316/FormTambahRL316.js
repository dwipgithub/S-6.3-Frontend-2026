import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./RL316.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Table from "react-bootstrap/Table";
// import Spinner from "react-bootstrap/Spinner";
// import { IoArrowBack } from "react-icons/io5";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import { IoArrowBack } from "react-icons/io5";

const FormTambahRL316 = () => {
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  // const [tahun, setTahun] = useState("2025");
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [buttonStatus, setButtonStatus] = useState(false);
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
    getRLTigaTitikEnamBelasTemplate();
    const date = new Date();
    // setTahun(date.getFullYear());
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

  const getRLTigaTitikEnamBelasTemplate = async () => {
    // setSpinner(true);
    try {
      const response = await axiosJWT.get(
        // "/apisirs6v2/jenispelayanankeluargaberencana",
        "/apisirs6v2/rltigatitikenambelasjenispelayanankeluargaberencana",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const rlTemplate = response.data.data.map((value, index) => {
        return {
          id: value.id,
          JenisPelayananKeluargaBerencana: value.nama,
          no: value.id,
          pelayananKbPaskaPersalinan: 0,
          pelayananKbPaskaKeguguran: 0,
          pelayananKbInterval: 0,
          komplikasiKB: 0,
          kegagalanKB: 0,
          efekSamping: 0,
          dropOut: 0,
          disabledInput: true,
          checked: false,
        };
      });
      setDataRL(rlTemplate);
      // setSpinner(false);
    } catch (error) {}
  };

  const changeHandlerSingle = (event) => {
    setTahun(event.target.value);
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
    } else if (name === "pelayananKbPaskaPersalinan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].pelayananKbPaskaPersalinan = event.target.value;
    } else if (name === "pelayananKbPaskaKeguguran") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].pelayananKbPaskaKeguguran = event.target.value;
    } else if (name === "pelayananKbInterval") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].pelayananKbInterval = event.target.value;
    } else if (name === "komplikasiKB") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].komplikasiKB = event.target.value;
    } else if (name === "kegagalanKB") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].kegagalanKB = event.target.value;
    } else if (name === "efekSamping") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].efekSamping = event.target.value;
    } else if (name === "dropOut") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].dropOut = event.target.value;
    }
    setDataRL(newDataRL);
  };

  const Simpan = async (e) => {
    e.preventDefault();
    setButtonStatus(true);
    try {
      const dataRLArray = dataRL
        .filter((value) => {
          return value.checked === true;
        })
        .map((value, index) => {
          return {
            JenisPelayananKeluargaBerencanaId: value.id,
            pelayananKbPaskaPersalinan: parseInt(
              value.pelayananKbPaskaPersalinan,
            ),
            pelayananKbPaskaKeguguran: parseInt(
              value.pelayananKbPaskaKeguguran,
            ),
            pelayananKbInterval: parseInt(value.pelayananKbInterval),
            komplikasiKB: parseInt(value.komplikasiKB),
            kegagalanKB: parseInt(value.kegagalanKB),
            efekSamping: parseInt(value.efekSamping),
            dropOut: parseInt(value.dropOut),
          };
        });

      // console.log(dataRLArray);

      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };

      await axiosJWT.post(
        "/apisirs6v2/rltigatitikenambelas",
        {
          tahun: parseInt(tahun),
          data: dataRLArray,
        },
        customConfig,
      );

      toast("Data Berhasil Disimpan", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setTimeout(() => {
        navigate("/rl316");
      }, 1000);
    } catch (error) {
      toast(`Gagal Simpan,${error.response.data.message}`, {
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

  const handleFocus = (event) => {
    event.target.select();
  };

  const maxLengthCheck = (object) => {
    if (object.target.value.length > object.target.maxLength) {
      object.target.value = object.target.value.slice(
        0,
        object.target.maxLength,
      );
    }
  };

  const totalPaskaPersalinan = dataRL.reduce(
    (acc, item) => acc + Number(item.pelayananKbPaskaPersalinan || 0),
    0,
  );

  const totalPaskaKeguguran = dataRL.reduce(
    (acc, item) => acc + Number(item.pelayananKbPaskaKeguguran || 0),
    0,
  );

  const totalInterval = dataRL.reduce(
    (acc, item) => acc + Number(item.pelayananKbInterval || 0),
    0,
  );

  const totalKomplikasi = dataRL.reduce(
    (acc, item) => acc + Number(item.komplikasiKB || 0),
    0,
  );

  const totalKegagalan = dataRL.reduce(
    (acc, item) => acc + Number(item.kegagalanKB || 0),
    0,
  );

  const totalEfekSamping = dataRL.reduce(
    (acc, item) => acc + Number(item.efekSamping || 0),
    0,
  );

  const totalDropOut = dataRL.reduce(
    (acc, item) => acc + Number(item.dropOut || 0),
    0,
  );

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
                    id="kabkotaRS"
                    value={namaKabKota}
                    disabled={true}
                  />
                  <label htmlFor="kabkotaRS">Kab/Kota</label>
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
                  {/* <input
                    name="tahun"
                    type="text"
                    className="form-control"
                    id="floatingInput"
                    placeholder="Tahun"
                    value={tahun}
                    disabled
                    onChange={(e) => changeHandlerSingle(e)}
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
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* RL 3.16 Keluarga Berencana */}
        <div className="row mt-3">
          <div className="col-md-12">
            <div className={style.headerAction}>
              <Link to="/rl316">
                <button type="button" className={style.btnPrimary}>
                  <IoArrowBack />
                </button>
              </Link>
              <h4 className={style.pageHeader}>RL 3.16 Keluarga Berencana</h4>
            </div>

            <div className={style["table-container"]}>
              <table className={style.table}>
                <thead className={style.thead}>
                  <tr>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      No
                    </th>
                    <th rowSpan="2" style={{ width: "4%" }}>
                      Pilih
                    </th>
                    <th rowSpan="2" style={{ width: "20%" }}>
                      Jenis Pelayanan KB
                    </th>
                    <th colSpan="3">Pelayanan KB</th>
                    <th rowSpan="2">Komplikasi</th>
                    <th rowSpan="2">Kegagalan</th>
                    <th rowSpan="2">Efek Samping</th>
                    <th rowSpan="2">Drop Out</th>
                  </tr>
                  <tr>
                    <th>Paska Persalinan</th>
                    <th>Paska Keguguran</th>
                    <th>Interval</th>
                  </tr>
                </thead>

                <tbody>
                  {dataRL.map((value, index) => (
                    <tr key={value.id}>
                      {/* NO */}
                      <td className={style.center}>{value.id}</td>

                      {/* CHECKBOX */}
                      <td className={style.center}>
                        <input
                          type="checkbox"
                          name="check"
                          onChange={(e) => changeHandler(e, index)}
                          checked={value.checked}
                        />
                      </td>

                      {/* JENIS */}
                      <td className={style.left}>
                        {value.JenisPelayananKeluargaBerencana}
                      </td>

                      {/* INPUT - SEMUA PAKAI STYLE SAMA */}
                      {[
                        "pelayananKbPaskaPersalinan",
                        "pelayananKbPaskaKeguguran",
                        "pelayananKbInterval",
                        "komplikasiKB",
                        "kegagalanKB",
                        "efekSamping",
                        "dropOut",
                      ].map((field) => (
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
                            disabled={value.id === 9 || value.disabledInput}
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
                  <tr className={style.totalRow}>
                    <td colSpan={3} className={style.center}>
                      <strong>TOTAL</strong>
                    </td>

                    <td className={style.center}>
                      <strong>{totalPaskaPersalinan}</strong>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <strong>{totalPaskaKeguguran}</strong>
                    </td>
                    <td className={style.center}>
                      <strong>{totalInterval}</strong>
                    </td>
                    <td className={style.center}>
                      <strong>{totalKomplikasi}</strong>
                    </td>
                    <td className={style.center}>
                      <strong>{totalKegagalan}</strong>
                    </td>
                    <td className={style.center}>
                      <strong>{totalEfekSamping}</strong>
                    </td>
                    <td className={style.center}>
                      <strong>{totalDropOut}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-3 mb-3">
              <ToastContainer />
              <button type="submit" className={style.btnPrimary}>
                <HiSaveAs /> Simpan
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FormTambahRL316;
