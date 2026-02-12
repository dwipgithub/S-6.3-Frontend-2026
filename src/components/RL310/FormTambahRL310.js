import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { Link, useNavigate } from "react-router-dom";
import style from "./FormTambahRL310.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import Table from "react-bootstrap/Table";
import "react-toastify/dist/ReactToastify.css";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const FormTambahRL310 = () => {
  const navigate = useNavigate();
  const [tahun, setTahun] = useState(2025);
  const [bulan, setBulan] = useState(1);
  const [daftarBulan, setDaftarBulan] = useState([]);
  // Data RS
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  // Cred
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [dataRL, setDataRL] = useState([]);
  const { CSRFToken } = useCSRFTokenContext();

  const startYear = 2025;
  const currentYear = new Date().getFullYear(); // sekarang 2026

  const years = [];
  for (let y = startYear; y <= currentYear; y++) {
    years.push(y);
  }

  useEffect(() => {
    refreshToken();
    getRLTigaTitikTigaTemplate();
    getBulan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const months = [
    { value: "1", label: "Januari" },
    { value: "2", label: "Februari" },
    { value: "3", label: "Maret" },
    { value: "4", label: "April" },
    { value: "5", label: "Mei" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "Agustus" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  const getBulan = async () => {
    const results = [];
    results.push({
      key: "Januari",
      value: "1",
    });
    results.push({
      key: "Febuari",
      value: "2",
    });
    results.push({
      key: "Maret",
      value: "3",
    });
    results.push({
      key: "April",
      value: "4",
    });
    results.push({
      key: "Mei",
      value: "5",
    });
    results.push({
      key: "Juni",
      value: "6",
    });
    results.push({
      key: "Juli",
      value: "7",
    });
    results.push({
      key: "Agustus",
      value: "8",
    });
    results.push({
      key: "September",
      value: "9",
    });
    results.push({
      key: "Oktober",
      value: "10",
    });
    results.push({
      key: "November",
      value: "11",
    });
    results.push({
      key: "Desember",
      value: "12",
    });

    setDaftarBulan([...results]);
  };

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

  const getRLTigaTitikTigaTemplate = async () => {
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/jenisspesialistigatitiksepuluh",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(response);

      const rlTemplate = response.data.data.map((value, index) => {
        return {
          id: value.id,
          no: value.no,
          jenisSpesialis: value.nama,
          rm_diterima_puskesmas: 0,
          rm_diterima_rs: 0,
          rm_diterima_faskes_lain: 0,
          rm_diterima_total_rm: 0,
          rm_dikembalikan_puskesmas: 0,
          rm_dikembalikan_rs: 0,
          rm_dikembalikan_faskes_lain: 0,
          rm_dikembalikan_total_rm: 0,
          keluar_pasien_rujukan: 0,
          keluar_pasien_datang_sendiri: 0,
          keluar_total_keluar: 0,
          keluar_diterima_kembali: 0,
          disabledInput: true,
          checked: false,
        };
      });
      setDataRL(rlTemplate);
    } catch (error) {}
  };

  const changeHandlerSingle = (event) => {
    setTahun(event.target.value);
  };

  const bulanChangeHandler = async (e) => {
    setBulan(e.target.value);
  };

  const handleFocus = (event) => {
    event.target.select();
  };

  const changeHandler = (event, index) => {
    console.log(index);
    let newDataRL = [...dataRL];
    const name = event.target.name;
    if (name === "check") {
      if (index != 20) {
        if (event.target.checked === true) {
          newDataRL[index].disabledInput = false;
        } else if (event.target.checked === false) {
          newDataRL[index].disabledInput = true;
        }
      }
      newDataRL[index].checked = event.target.checked;
    } else if (name === "rm_diterima_puskesmas") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rm_diterima_puskesmas = event.target.value;
      newDataRL[index].rm_diterima_total_rm =
        parseInt(newDataRL[index].rm_diterima_rs) +
        parseInt(newDataRL[index].rm_diterima_faskes_lain) +
        parseInt(event.target.value);
    } else if (name === "rm_diterima_rs") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rm_diterima_rs = event.target.value;
      newDataRL[index].rm_diterima_total_rm =
        parseInt(newDataRL[index].rm_diterima_puskesmas) +
        parseInt(newDataRL[index].rm_diterima_faskes_lain) +
        parseInt(event.target.value);
    } else if (name === "rm_diterima_faskes_lain") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rm_diterima_faskes_lain = event.target.value;
      newDataRL[index].rm_diterima_total_rm =
        parseInt(newDataRL[index].rm_diterima_rs) +
        parseInt(newDataRL[index].rm_diterima_puskesmas) +
        parseInt(event.target.value);
    } else if (name === "rm_dikembalikan_puskesmas") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rm_dikembalikan_puskesmas = event.target.value;
      newDataRL[index].rm_dikembalikan_total_rm =
        parseInt(newDataRL[index].rm_dikembalikan_rs) +
        parseInt(newDataRL[index].rm_dikembalikan_faskes_lain) +
        parseInt(event.target.value);
    } else if (name === "rm_dikembalikan_rs") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rm_dikembalikan_rs = event.target.value;
      newDataRL[index].rm_dikembalikan_total_rm =
        parseInt(newDataRL[index].rm_dikembalikan_puskesmas) +
        parseInt(newDataRL[index].rm_dikembalikan_faskes_lain) +
        parseInt(event.target.value);
    } else if (name === "rm_dikembalikan_faskes_lain") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].rm_dikembalikan_faskes_lain = event.target.value;
      newDataRL[index].rm_dikembalikan_total_rm =
        parseInt(newDataRL[index].rm_dikembalikan_rs) +
        parseInt(newDataRL[index].rm_dikembalikan_puskesmas) +
        parseInt(event.target.value);
    } else if (name === "keluar_pasien_rujukan") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].keluar_pasien_rujukan = event.target.value;
      newDataRL[index].keluar_total_keluar =
        parseInt(newDataRL[index].keluar_pasien_datang_sendiri) +
        parseInt(event.target.value);
    } else if (name === "keluar_pasien_datang_sendiri") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].keluar_pasien_datang_sendiri = event.target.value;
      newDataRL[index].keluar_total_keluar =
        parseInt(newDataRL[index].keluar_pasien_rujukan) +
        parseInt(event.target.value);
    } else if (name === "keluar_diterima_kembali") {
      if (event.target.value === "") {
        event.target.value = 0;
        event.target.select(event.target.value);
      }
      newDataRL[index].keluar_diterima_kembali = event.target.value;
    }

    setDataRL(newDataRL);
  };

  const Simpan = async (e) => {
    e.preventDefault();
    try {
      const dataRLArray = dataRL
        .filter((value) => {
          return value.checked === true;
        })
        .map((value, index) => {
          return {
            jenisSpesialisTigaTitikSepuluhId: parseInt(value.id),
            rm_diterima_puskesmas: parseInt(value.rm_diterima_puskesmas),
            rm_diterima_rs: parseInt(value.rm_diterima_rs),
            rm_diterima_faskes_lain: parseInt(value.rm_diterima_faskes_lain),
            rm_diterima_total_rm: parseInt(value.rm_diterima_total_rm),
            rm_dikembalikan_puskesmas: parseInt(
              value.rm_dikembalikan_puskesmas,
            ),
            rm_dikembalikan_rs: parseInt(value.rm_dikembalikan_rs),
            rm_dikembalikan_faskes_lain: parseInt(
              value.rm_dikembalikan_faskes_lain,
            ),
            rm_dikembalikan_total_rm: parseInt(value.rm_dikembalikan_total_rm),
            keluar_pasien_rujukan: parseInt(value.keluar_pasien_rujukan),
            keluar_pasien_datang_sendiri: parseInt(
              value.keluar_pasien_datang_sendiri,
            ),
            keluar_total_keluar: parseInt(value.keluar_total_keluar),
            keluar_diterima_kembali: parseInt(value.keluar_diterima_kembali),
          };
        });

      const customConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "XSRF-TOKEN": CSRFToken,
        },
      };
      const result = await axiosJWT.post(
        "/apisirs6v2/rltigatitiksepuluh",
        {
          tahun: parseInt(tahun),
          bulan: parseInt(bulan),
          data: dataRLArray,
        },
        customConfig,
      );

      if (result.status === 201) {
        toast("Data Berhasil Disimpan", {
          position: toast.POSITION.TOP_RIGHT,
        });

        setTimeout(() => {
          navigate("/rl310");
        }, 2000);
      } else {
        toast(`Data Gagal Disimpan, ${result.data.message}`, {
          position: toast.POSITION.TOP_RIGHT,
        });
      }
    } catch (error) {
      toast(`Data tidak bisa disimpan karena ,${error.response.data.message}`, {
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

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      <h2>RL. 3.10</h2>
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
                  style={{ width: "50%", display: "inline-block" }}
                >
                  <select
                    typeof="select"
                    className="form-control"
                    onChange={bulanChangeHandler}
                  >
                    {daftarBulan.map((bulan) => {
                      return (
                        <option
                          key={bulan.value}
                          name={bulan.key}
                          value={bulan.value}
                        >
                          {bulan.key}
                        </option>
                      );
                    })}
                  </select>
                  <label htmlFor="bulan">Bulan</label>
                </div>
                <div
                  className="form-floating"
                  style={{ width: "50%", display: "inline-block" }}
                >
                  {/* <input
                    name="tahun"
                    type="number"
                    className="form-control"
                    id="tahun"
                    placeholder="Tahun"
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
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
                  <label htmlFor="tahun">Tahun</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row mt-3">
          <div className="col-md-12">
            <Link
              to={`/rl310/`}
              className="btn btn-info"
              style={{
                fontSize: "18px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
            >
              {/* <IoArrowBack size={30} style={{ color: "gray", cursor: "pointer" }} /><span style={{ color: "gray" }}></span> */}
              &lt;
            </Link>
            <span style={{ color: "gray" }}>RL 3.10 Rujukan</span>

            <div className={`${style["table-container"]} mt-2 mb-1 pb-2 `}>
              <table className={style.table}>
                <thead className={style.thead}>
                  <tr className="">
                    <th
                      className={style["sticky-header"]}
                      style={{ width: "4%" }}
                      rowSpan={3}
                    >
                      No Spesialisasi
                    </th>
                    <th
                      className={style["sticky-header"]}
                      style={{ width: "3%" }}
                      rowSpan={3}
                    ></th>
                    <th
                      className={style["sticky-header"]}
                      style={{ width: "20%" }}
                      rowSpan={3}
                    >
                      Jenis Spesialisasi
                    </th>
                    <th colSpan={8}>Rujukan Masuk</th>
                    <th
                      colSpan={4}
                      rowSpan={2}
                      style={{ verticalAlign: "middle" }}
                    >
                      Dirujuk Keluar
                    </th>
                  </tr>
                  <tr className={style["subheader-row"]}>
                    <th colSpan={4}>Diterima Dari</th>
                    <th colSpan={4}>Dikembalikan Ke</th>
                  </tr>
                  <tr className={style["subsubheader-row"]}>
                    <th>Puskesmas</th>
                    <th>RS Lain</th>
                    <th>Faskes Lain</th>
                    <th>Total Rujukan Masuk</th>
                    <th>Puskesmas</th>
                    <th>RS Asal</th>
                    <th>Faskes Lain</th>
                    <th>Total Rujukan Masuk Dikembalikan</th>
                    <th>Pasien Rujukn</th>
                    <th>Pasien Datang Sendiri</th>
                    <th>Total Dirujuk Keluar</th>
                    <th>Diterima Kembali</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRL.map((value, index) => {
                    return (
                      <tr key={value.id}>
                        <td className={style["sticky-column"]}>
                          <input
                            type="text"
                            name="no"
                            className="form-control"
                            value={value.no}
                            disabled={true}
                          />
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
                          />
                        </td>
                        <td className={style["sticky-column"]}>
                          <input
                            type="text"
                            name="jenisKegiatan"
                            className="form-control"
                            value={value.jenisSpesialis}
                            disabled={true}
                            onFocus={handleFocus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            name="rm_diterima_puskesmas"
                            className="form-control"
                            value={value.rm_diterima_puskesmas}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                            onFocus={handleFocus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            name="rm_diterima_rs"
                            className="form-control"
                            value={value.rm_diterima_rs}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                            onFocus={handleFocus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            name="rm_diterima_faskes_lain"
                            className="form-control"
                            value={value.rm_diterima_faskes_lain}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                            onFocus={handleFocus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            name="rm_diterima_total_rm"
                            className="form-control"
                            value={value.rm_diterima_total_rm}
                            disabled={true}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                            onFocus={handleFocus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            name="rm_dikembalikan_puskesmas"
                            className="form-control"
                            value={value.rm_dikembalikan_puskesmas}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                            onFocus={handleFocus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            name="rm_dikembalikan_rs"
                            className="form-control"
                            value={value.rm_dikembalikan_rs}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                            onFocus={handleFocus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            name="rm_dikembalikan_faskes_lain"
                            className="form-control"
                            value={value.rm_dikembalikan_faskes_lain}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                            onFocus={handleFocus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            name="rm_dikembalikan_total_rm"
                            className="form-control"
                            value={value.rm_dikembalikan_total_rm}
                            disabled={true}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                            onFocus={handleFocus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            name="keluar_pasien_rujukan"
                            className="form-control"
                            value={value.keluar_pasien_rujukan}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                            onFocus={handleFocus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            name="keluar_pasien_datang_sendiri"
                            className="form-control"
                            value={value.keluar_pasien_datang_sendiri}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                            onFocus={handleFocus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            name="keluar_total_keluar"
                            className="form-control"
                            value={value.keluar_total_keluar}
                            disabled={true}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                            onFocus={handleFocus}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            name="keluar_diterima_kembali"
                            className="form-control"
                            value={value.keluar_diterima_kembali}
                            onChange={(e) => changeHandler(e, index)}
                            disabled={value.disabledInput}
                            onPaste={preventPasteNegative}
                            onKeyPress={preventMinus}
                            onFocus={handleFocus}
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
          <button type="submit" className="btn btn-outline-success">
            <HiSaveAs /> Simpan
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormTambahRL310;
