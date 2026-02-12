import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, useParams, Link } from "react-router-dom";
import style from "./FormTambahRL316.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Table from "react-bootstrap/Table";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

export const FormEditRL316 = () => {
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  const [namaJenisPelayanan, setNamaJenisPelayanan] = useState("");

  const [noMetoda, setNoMetoda] = useState("");
  const [pelayanan_kb_paska_persalinan, setKBPaskaPersalinan] = useState("");
  const [pelayanan_kb_paska_keguguran, setKBPaskaKeguguran] = useState("");
  const [pelayanan_kb_interval, setKBInterval] = useState("");
  const [komplikasi_kb, setKomplikasiKB] = useState("");
  const [kegagalan_kb, setKegagalanKB] = useState("");
  const [efek_samping, setEfekSamping] = useState("");
  const [drop_out, setDropOut] = useState("");

  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const [buttonStatus, setButtonStatus] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getRLTigaTitikEnamBelasById();
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

  const getRLTigaTitikEnamBelasById = async () => {
    // setSpinner(true);
    const response = await axiosJWT.get(
      "/apisirs6v2/rltigatitikenambelas/" + id,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // console.log(response);
    setNoMetoda(response.data.data.id_metoda);
    setNamaJenisPelayanan(response.data.data.nama);
    setKBPaskaPersalinan(response.data.data.pelayanan_kb_paska_persalinan);
    setKBPaskaKeguguran(response.data.data.pelayanan_kb_paska_keguguran);
    setKBInterval(response.data.data.pelayanan_kb_interval);
    setKomplikasiKB(response.data.data.komplikasi_kb);
    setKegagalanKB(response.data.data.kegagalan_kb);
    setEfekSamping(response.data.data.efek_samping);
    setDropOut(response.data.data.drop_out);

    // setSpinner(false);
    // setNo(response.data.data.jenis_spesialis_id);
  };

  const changeHandler = (event, index) => {
    switch (event.target.no) {
      case "noMetoda":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setNoMetoda(parseInt(event.target.value));
        break;

      case "pelayananKbPaskaPersalinan":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setKBPaskaPersalinan(parseInt(event.target.value));
        break;

      case "pelayananKbPaskaKeguguran":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setKBPaskaKeguguran(parseInt(event.target.value));
        break;
      case "pelayananKbInterval":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setKBInterval(parseInt(event.target.value));
        break;

      case "komplikasiKB":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setKomplikasiKB(parseInt(event.target.value));
        break;

      case "kegagalanKB":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setKegagalanKB(parseInt(event.target.value));
        break;

      case "efekSamping":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setEfekSamping(parseInt(event.target.value));
        break;

      case "dropOut":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setDropOut(parseInt(event.target.value));
        break;

      default:
        console.log(event.target.name);
        break;
    }
  };

  const UpdateRLTigaTitikDuaBelas = async (e) => {
    e.preventDefault();
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
        "/apisirs6v2/rltigatitikenambelas/" + id,
        {
          pelayanan_kb_paska_persalinan,
          pelayanan_kb_paska_keguguran,
          pelayanan_kb_interval,
          komplikasi_kb,
          kegagalan_kb,
          efek_samping,
          drop_out,
        },
        customConfig
      );
      toast("Data Berhasil Diupdate", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setTimeout(() => {
        navigate("/rl316");
      }, 1000);
    } catch (error) {
      console.log(error);
      setButtonStatus(false);
      toast("Data tidak bisa. ", {
        position: toast.POSITION.TOP_RIGHT,
      });
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

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      <form onSubmit={UpdateRLTigaTitikDuaBelas}>
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
        </div>
        <div className="row mt-3">
          <div className="col-md-12">
            <Link
              to={`/rl316/`}
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
              Kembali RL 3.16 Keluarga Berencana
            </span>
            {/* <div className="container" style={{ textAlign: "center" }}>
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
            </div> */}
            <Table className={style.table}>
              <thead>
                <tr>
                  <th
                    className={style["sticky-header-ubah"]}
                    rowSpan="2"
                    style={{ width: "1%" }}
                  >
                    No
                  </th>
                  <th
                    className={style["sticky-header-ubah"]}
                    rowSpan="2"
                    style={{ width: "8%" }}
                  >
                    Jenis Pelayanan Keluarga Berencana
                  </th>
                  <th colSpan="3" style={{ width: "5%" }}>
                    Pelayanan KB
                  </th>
                  <th rowSpan="2" style={{ width: "5%" }}>
                    Komplikasi KB
                  </th>
                  <th rowSpan="2" style={{ width: "5%" }}>
                    Kegagalan KB
                  </th>
                  <th rowSpan="2" style={{ width: "5%" }}>
                    Efek Samping
                  </th>
                  <th rowSpan="2" style={{ width: "5%" }}>
                    Drop Out
                  </th>
                </tr>
                <tr>
                  <th style={{ width: "5%" }}>{"Paska Persalinan"}</th>
                  <th style={{ width: "5%" }}>{"Paska Keguguran"}</th>
                  <th style={{ width: "5%" }}>{"Interval"}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={style["sticky-column-ubah"]}>
                    <input
                      name="noMetoda"
                      type="text"
                      className="form-control"
                      id="noMetoda"
                      value={noMetoda}
                      // onChange={(e) => changeHandler(e)}
                      disabled={true}
                    />
                  </td>
                  <td className={style["sticky-column-ubah"]}>
                    <input
                      name="jenisPelayanan"
                      type="text"
                      className="form-control"
                      id="jenisPelayanan"
                      placeholder="Jenis Metoda"
                      value={namaJenisPelayanan}
                      // onChange={(e) => changeHandler(e)}
                      disabled={true}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="pelayanan_kb_paska_persalinan"
                      className="form-control"
                      value={pelayanan_kb_paska_persalinan}
                      min="0"
                      maxLength={7}
                      onInput={(e) => maxLengthCheck(e)}
                      onChange={(e) =>
                        setKBPaskaPersalinan(parseInt(e.target.value))
                      }
                      // onChange={(e) => changeHandler(e)}
                      onPaste={preventPasteNegative}
                      onKeyPress={preventMinus}
                      onFocus={handleFocus}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="pelayanan_kb_paska_keguguran"
                      className="form-control"
                      value={pelayanan_kb_paska_keguguran}
                      min="0"
                      maxLength={7}
                      onInput={(e) => maxLengthCheck(e)}
                      onChange={(e) =>
                        setKBPaskaKeguguran(parseInt(e.target.value))
                      }
                      // onChange={(e) => changeHandler(e)}
                      onPaste={preventPasteNegative}
                      onKeyPress={preventMinus}
                      onFocus={handleFocus}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="pelayanan_kb_interval"
                      className="form-control"
                      value={pelayanan_kb_interval}
                      min="0"
                      maxLength={7}
                      onInput={(e) => maxLengthCheck(e)}
                      onChange={(e) => setKBInterval(parseInt(e.target.value))}
                      // onChange={(e) => changeHandler(e)}
                      onPaste={preventPasteNegative}
                      onKeyPress={preventMinus}
                      onFocus={handleFocus}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="komplikasi_kb"
                      className="form-control"
                      value={komplikasi_kb}
                      min="0"
                      maxLength={7}
                      onInput={(e) => maxLengthCheck(e)}
                      onChange={(e) =>
                        setKomplikasiKB(parseInt(e.target.value))
                      }
                      // onChange={(e) => changeHandler(e)}
                      onPaste={preventPasteNegative}
                      onKeyPress={preventMinus}
                      onFocus={handleFocus}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="kegagalan_kb"
                      className="form-control"
                      value={kegagalan_kb}
                      min="0"
                      maxLength={7}
                      onInput={(e) => maxLengthCheck(e)}
                      onChange={(e) => setKegagalanKB(parseInt(e.target.value))}
                      // onChange={(e) => changeHandler(e)}
                      onPaste={preventPasteNegative}
                      onKeyPress={preventMinus}
                      onFocus={handleFocus}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="efek_samping"
                      className="form-control"
                      value={efek_samping}
                      min="0"
                      maxLength={7}
                      onInput={(e) => maxLengthCheck(e)}
                      onChange={(e) => setEfekSamping(parseInt(e.target.value))}
                      // onChange={(e) => changeHandler(e)}
                      onPaste={preventPasteNegative}
                      onKeyPress={preventMinus}
                      onFocus={handleFocus}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="drop_out"
                      className="form-control"
                      value={drop_out}
                      min="0"
                      maxLength={7}
                      onInput={(e) => maxLengthCheck(e)}
                      onChange={(e) => setDropOut(parseInt(e.target.value))}
                      // onChange={(e) => changeHandler(e)}
                      onPaste={preventPasteNegative}
                      onKeyPress={preventMinus}
                      onFocus={handleFocus}
                    />
                  </td>
                </tr>
              </tbody>
            </Table>
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
          </div>
        </div>
      </form>
    </div>
  );
};

export default FormEditRL316;
