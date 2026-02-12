import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { Link, useNavigate } from "react-router-dom";
import style from "./FormTambahRL310.module.css";
import { HiSaveAs } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

// Pindahkan Interceptor ke luar atau gunakan instance tetap
const axiosJWT = axios.create();

const FormTambahRL310 = () => {
  const navigate = useNavigate();
  const { CSRFToken } = useCSRFTokenContext();

  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [bulan, setBulan] = useState(1);
  const [namaRS, setNamaRS] = useState("");
  const [alamatRS, setAlamatRS] = useState("");
  const [namaPropinsi, setNamaPropinsi] = useState("");
  const [namaKabKota, setNamaKabKota] = useState("");
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [dataRL, setDataRL] = useState([]);

  const years = Array.from(
    { length: new Date().getFullYear() - 2024 },
    (_, i) => 2025 + i,
  );

  const daftarBulan = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
  ];

  // Setup Interceptor
  useEffect(() => {
    const interceptor = axiosJWT.interceptors.request.use(
      async (config) => {
        const currentDate = new Date();
        if (expire * 1000 < currentDate.getTime()) {
          const response = await axios.get("/apisirs6v2/token", {
            headers: { "XSRF-TOKEN": CSRFToken },
          });
          config.headers.Authorization = `Bearer ${response.data.accessToken}`;
          setToken(response.data.accessToken);
          const decoded = jwt_decode(response.data.accessToken);
          setExpire(decoded.exp);
        } else {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );
    return () => axiosJWT.interceptors.request.eject(interceptor);
  }, [expire, token, CSRFToken]);

  const refreshToken = useCallback(async () => {
    try {
      const response = await axios.get("/apisirs6v2/token", {
        headers: { "XSRF-TOKEN": CSRFToken },
      });
      const accessToken = response.data.accessToken;
      setToken(accessToken);
      const decoded = jwt_decode(accessToken);
      setExpire(decoded.exp);
      getDataRS(decoded.satKerId, accessToken);
      getTemplate(accessToken);
    } catch (error) {
      navigate("/");
    }
  }, [CSRFToken, navigate]);

  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  const getDataRS = async (id, currentToken) => {
    try {
      const response = await axiosJWT.get(`/apisirs6v2/rumahsakit/${id}`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const { nama, alamat, provinsi_nama, kab_kota_nama } = response.data.data;
      setNamaRS(nama);
      setAlamatRS(alamat);
      setNamaPropinsi(provinsi_nama);
      setNamaKabKota(kab_kota_nama);
    } catch (error) {
      console.error("Gagal mengambil data RS");
    }
  };

  const getTemplate = async (currentToken) => {
    try {
      const response = await axiosJWT.get(
        "/apisirs6v2/jenisspesialistigatitiksepuluh",
        {
          headers: { Authorization: `Bearer ${currentToken}` },
        },
      );
      const rlTemplate = response.data.data.map((v) => ({
        id: v.id,
        no: v.no,
        jenisSpesialis: v.nama,
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
      }));
      setDataRL(rlTemplate);
    } catch (error) {
      console.error("Gagal mengambil template");
    }
  };

  const changeHandler = (event, index) => {
    const { name, value, checked, type } = event.target;
    let newDataRL = [...dataRL];

    if (type === "checkbox") {
      newDataRL[index].checked = checked;
      newDataRL[index].disabledInput = !checked;
    } else {
      const val = value === "" ? 0 : parseInt(value);
      newDataRL[index][name] = val;

      // Kalkulasi Otomatis
      const d = newDataRL[index];
      if (name.startsWith("rm_diterima")) {
        d.rm_diterima_total_rm =
          Number(d.rm_diterima_puskesmas) +
          Number(d.rm_diterima_rs) +
          Number(d.rm_diterima_faskes_lain);
      } else if (name.startsWith("rm_dikembalikan")) {
        d.rm_dikembalikan_total_rm =
          Number(d.rm_dikembalikan_puskesmas) +
          Number(d.rm_dikembalikan_rs) +
          Number(d.rm_dikembalikan_faskes_lain);
      } else if (name.startsWith("keluar_pasien")) {
        d.keluar_total_keluar =
          Number(d.keluar_pasien_rujukan) +
          Number(d.keluar_pasien_datang_sendiri);
      }
    }
    setDataRL(newDataRL);
  };

  const Simpan = async (e) => {
    e.preventDefault();
    const dataToSend = dataRL
      .filter((v) => v.checked)
      .map((v) => ({
        jenisSpesialisTigaTitikSepuluhId: parseInt(v.id),
        rm_diterima_puskesmas: v.rm_diterima_puskesmas,
        rm_diterima_rs: v.rm_diterima_rs,
        rm_diterima_faskes_lain: v.rm_diterima_faskes_lain,
        rm_diterima_total_rm: v.rm_diterima_total_rm,
        rm_dikembalikan_puskesmas: v.rm_dikembalikan_puskesmas,
        rm_dikembalikan_rs: v.rm_dikembalikan_rs,
        rm_dikembalikan_faskes_lain: v.rm_dikembalikan_faskes_lain,
        rm_dikembalikan_total_rm: v.rm_dikembalikan_total_rm,
        keluar_pasien_rujukan: v.keluar_pasien_rujukan,
        keluar_pasien_datang_sendiri: v.keluar_pasien_datang_sendiri,
        keluar_total_keluar: v.keluar_total_keluar,
        keluar_diterima_kembali: v.keluar_diterima_kembali,
      }));

    if (dataToSend.length === 0) return toast.error("Pilih minimal satu data!");

    try {
      await axiosJWT.post(
        "/apisirs6v2/rltigatitiksepuluh",
        {
          tahun: parseInt(tahun),
          bulan: parseInt(bulan),
          data: dataToSend,
        },
        {
          headers: { "XSRF-TOKEN": CSRFToken },
        },
      );
      toast.success("Data Berhasil Disimpan");
      setTimeout(() => navigate("/rl310"), 2000);
    } catch (error) {
      toast.error(`Gagal: ${error.response?.data?.message || "Server Error"}`);
    }
  };

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      <ToastContainer />
      <h2>RL. 3.10 - Rujukan</h2>
      <form onSubmit={Simpan}>
        {/* Row Profile & Periode */}
        <div className="row g-3">
          {/* Sisi Kiri: Profile */}
          <div className="col-md-6">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="mb-3">Profile Fasyankes</h5>
                <div className="form-floating mb-2">
                  <input className="form-control" value={namaRS} disabled />
                  <label>Nama RS</label>
                </div>
                <div className="form-floating mb-2">
                  <input className="form-control" value={alamatRS} disabled />
                  <label>Alamat</label>
                </div>
              </div>
            </div>
          </div>
          {/* Sisi Kanan: Periode */}
          <div className="col-md-6">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="mb-3">Periode Laporan</h5>
                <div className="row">
                  <div className="col-6">
                    <div className="form-floating">
                      <select
                        className="form-select"
                        value={bulan}
                        onChange={(e) => setBulan(e.target.value)}
                      >
                        {daftarBulan.map((b) => (
                          <option key={b.value} value={b.value}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                      <label>Bulan</label>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-floating">
                      <select
                        className="form-select"
                        value={tahun}
                        onChange={(e) => setTahun(e.target.value)}
                      >
                        {years.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                      <label>Tahun</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabel */}
        <div className="table-responsive mt-4">
          <table className="table table-bordered align-middle text-center">
            <thead className="table-dark">
              <tr>
                <th rowSpan="3">No</th>
                <th rowSpan="3">Pilih</th>
                <th rowSpan="3">Jenis Spesialisasi</th>
                <th colSpan="8">Rujukan Masuk</th>
                <th colSpan="4">Dirujuk Keluar</th>
              </tr>
              <tr>
                <th colSpan="4">Diterima Dari</th>
                <th colSpan="4">Dikembalikan Ke</th>
                <th rowSpan="2">Rujukan</th>
                <th rowSpan="2">Sendiri</th>
                <th rowSpan="2">Total</th>
                <th rowSpan="2">Kembali</th>
              </tr>
              <tr>
                <th>Pusk</th>
                <th>RS</th>
                <th>Lain</th>
                <th>Total</th>
                <th>Pusk</th>
                <th>RS</th>
                <th>Lain</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {dataRL.map((item, idx) => (
                <tr key={item.id}>
                  <td>{item.no}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => changeHandler(e, idx)}
                    />
                  </td>
                  <td className="text-start">{item.jenisSpesialis}</td>
                  {/* Mapping input rujukan masuk diterima */}
                  {[
                    "rm_diterima_puskesmas",
                    "rm_diterima_rs",
                    "rm_diterima_faskes_lain",
                  ].map((f) => (
                    <td key={f}>
                      <input
                        type="number"
                        name={f}
                        className="form-control"
                        value={item[f]}
                        onChange={(e) => changeHandler(e, idx)}
                        disabled={item.disabledInput}
                      />
                    </td>
                  ))}
                  <td className="bg-light">{item.rm_diterima_total_rm}</td>

                  {/* Mapping input rujukan masuk dikembalikan */}
                  {[
                    "rm_dikembalikan_puskesmas",
                    "rm_dikembalikan_rs",
                    "rm_dikembalikan_faskes_lain",
                  ].map((f) => (
                    <td key={f}>
                      <input
                        type="number"
                        name={f}
                        className="form-control"
                        value={item[f]}
                        onChange={(e) => changeHandler(e, idx)}
                        disabled={item.disabledInput}
                      />
                    </td>
                  ))}
                  <td className="bg-light">{item.rm_dikembalikan_total_rm}</td>

                  {/* Dirujuk Keluar */}
                  <td>
                    <input
                      type="number"
                      name="keluar_pasien_rujukan"
                      className="form-control"
                      value={item.keluar_pasien_rujukan}
                      onChange={(e) => changeHandler(e, idx)}
                      disabled={item.disabledInput}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="keluar_pasien_datang_sendiri"
                      className="form-control"
                      value={item.keluar_pasien_datang_sendiri}
                      onChange={(e) => changeHandler(e, idx)}
                      disabled={item.disabledInput}
                    />
                  </td>
                  <td className="bg-light">{item.keluar_total_keluar}</td>
                  <td>
                    <input
                      type="number"
                      name="keluar_diterima_kembali"
                      className="form-control"
                      value={item.keluar_diterima_kembali}
                      onChange={(e) => changeHandler(e, idx)}
                      disabled={item.disabledInput}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="submit" className="btn btn-success mt-3">
          <HiSaveAs className="me-2" /> Simpan Data
        </button>
      </form>
    </div>
  );
};

export default FormTambahRL310;
