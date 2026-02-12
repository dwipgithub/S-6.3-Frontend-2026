import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, useParams, Link } from "react-router-dom";
import style from "./FormTambahRL312.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Table from "react-bootstrap/Table";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

export const FormEditRL312 = () => {
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  const [setSpesialis, setNamaSpesialis] = useState("");
  const [khusus, setKhusus] = useState("");
  const [besar, setBesar] = useState("");
  const [sedang, setSedang] = useState("");
  const [kecil, setKecil] = useState("");
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const [buttonStatus, setButtonStatus] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    refreshToken();
    getRLTigaTitikDuaBelasById();
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

  const getRLTigaTitikDuaBelasById = async () => {
    // setSpinner(true);
    const response = await axiosJWT.get(
      "/apisirs6v2/rltigatitikduabelas/" + id,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    setNamaSpesialis(response.data.data.nama_spesialisasi);
    setKhusus(response.data.data.khusus);
    setBesar(response.data.data.besar);
    setSedang(response.data.data.sedang);
    setKecil(response.data.data.kecil);

    // setSpinner(false);
    // setNo(response.data.data.jenis_spesialis_id);
  };

  const changeHandler = (event, index) => {
    switch (event.target.name) {
      case "Khusus":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setKhusus(parseInt(event.target.value));
        break;

      case "Besar":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setBesar(parseInt(event.target.value));
        break;
      case "Sedang":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setSedang(parseInt(event.target.value));
        break;

      case "Kecil":
        if (event.target.value === "") {
          event.target.value = 0;
          event.target.select(event.target.value);
        }
        setKecil(parseInt(event.target.value));
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
        "/apisirs6v2/rltigatitikduabelas/" + id,
        {
          khusus,
          besar,
          sedang,
          kecil,
        },
        customConfig
      );
      toast("Data Berhasil Diupdate", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setTimeout(() => {
        navigate("/rl312");
      }, 1000);
      //   console.log(parseInt(khusus));
    } catch (error) {
      setButtonStatus(false);
      toast("Data tidak bisa disimpan karena ", {
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
    <div className="container" style={{ marginTop: "70px" }}>
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
              to={`/rl312/`}
              className="btn btn-info"
              style={{
                fontSize: "18px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
            >
              &lt;
            </Link>
            <span style={{ color: "gray" }}> Kembali RL 3.12 Pembedahan</span>
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
            <Table className={style.rlTable}>
              <thead>
                <tr>
                  <th style={{ width: "20%" }}>Jenis Spesialisasi</th>
                  <th>Khusus</th>
                  <th>Besar</th>
                  <th>Sedang</th>
                  <th>Kecil</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <input
                      name="nama"
                      type="text"
                      className="form-control"
                      id="nama"
                      placeholder="Jenis Spesialisasi"
                      value={setSpesialis}
                      // onChange={(e) => changeHandler(e)}
                      disabled={true}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="Khusus"
                      className="form-control"
                      value={khusus}
                      min={0}
                      maxLength={7}
                      onInput={(e) => maxLengthCheck(e)}
                      // onChange={(e) => setKhusus(parseInt(e.target.value))}
                      onChange={(e) => changeHandler(e)}
                      onPaste={preventPasteNegative}
                      onKeyPress={preventMinus}
                      onFocus={handleFocus}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="Besar"
                      className="form-control"
                      value={besar}
                      min={0}
                      maxLength={7}
                      onInput={(e) => maxLengthCheck(e)}
                      // onChange={(e) => setBesar(parseInt(e.target.value))}
                      onChange={(e) => changeHandler(e)}
                      onPaste={preventPasteNegative}
                      onKeyPress={preventMinus}
                      onFocus={handleFocus}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="Sedang"
                      className="form-control"
                      value={sedang}
                      min={0}
                      maxLength={7}
                      onInput={(e) => maxLengthCheck(e)}
                      // onChange={(e) => setSedang(parseInt(e.target.value))}
                      onChange={(e) => changeHandler(e)}
                      onPaste={preventPasteNegative}
                      onKeyPress={preventMinus}
                      onFocus={handleFocus}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="Kecil"
                      className="form-control"
                      value={kecil}
                      min={0}
                      maxLength={7}
                      onInput={(e) => maxLengthCheck(e)}
                      // onChange={(e) => setKecil(parseInt(e.target.value))}
                      onChange={(e) => changeHandler(e)}
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

export default FormEditRL312;
