import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import style from "./FormTambahRL34.module.css";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import { getSafeDataRL } from "./rl34Helpers";

const SatuSehatRL34 = () => {
  const [bulan, setBulan] = useState(1);
  const [tahun, setTahun] = useState("");
  const [filterLabel, setFilterLabel] = useState([]);
  const [daftarBulan, setDaftarBulan] = useState([]);
  const [rumahSakit, setRumahSakit] = useState("");
  const [dataRL, setDataRL] = useState([]);
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const [spinner, setSpinner] = useState(false);
  const { CSRFToken } = useCSRFTokenContext();

  const exportRowsToExcel = async ({ fileName, sheetName, rows, columnWidths = [] }) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    rows.forEach((row) => worksheet.addRow(row));
    columnWidths.forEach((width, index) => {
      worksheet.getColumn(index + 1).width = width;
    });

    worksheet.eachRow({ includeEmpty: true }, (row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
        cell.alignment = { vertical: "middle", wrapText: true };
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `${fileName}.xlsx`
    );
  };

  // Fetch RL 3.4 Satusehat Local sesuai filter
  const getSatusehatRL34 = async (e) => {
    if (e) e.preventDefault();
    setSpinner(true);
    // Set filter label for display
    const filter = [];
    if (rumahSakit?.nama) {
      filter.push("Nama Rumah Sakit: ".concat(rumahSakit.nama));
    }
    filter.push("Periode: ".concat(String(tahun).concat("-").concat(bulan)));
    setFilterLabel(filter);
    try {
      // Ganti ke API Satusehat utama
      const params = {};
      if (rumahSakit && rumahSakit.id) params.rsId = rumahSakit.id;
      if (tahun && bulan)
        params.periode = `${tahun}-${bulan.toString().padStart(2, "0")}`;
      const customConfig = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      };
      const response = await axiosJWT.get(
        "/apisirs6v2/rltigatitikempatsatusehat",
        customConfig
      );
      const apiData = response.data.data;
      // Jika apiData array, pakai langsung. Jika object, cek jika punya property data, ambil dan bungkus array.
      let arr = [];
      if (Array.isArray(apiData)) {
        arr = apiData;
      } else if (apiData && typeof apiData === "object") {
        // Jika ada property data di dalamnya, ambil property data
        if (apiData.data && typeof apiData.data === "object") {
          arr = [apiData.data];
        } else {
          arr = [apiData];
        }
      }
      setDataRL(arr);
    } catch (error) {
      setDataRL([]);
      console.log(error);
    }
    setSpinner(false);
    handleClose();
  };

  const showRumahSakit = useCallback(async (id) => {
    try {
      const response = await axios.get("/apisirs6v2/rumahsakit/" + id, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRumahSakit(response.data.data);
    } catch (error) {}
  }, [token]);

  const refreshToken = useCallback(async () => {
    try {
      const customConfig = {
        headers: {
          "XSRF-TOKEN": CSRFToken,
        },
      };
      const response = await axios.get("/apisirs6v2/token", customConfig);
      setToken(response.data.accessToken);
      const decoded = jwt_decode(response.data.accessToken);
      showRumahSakit(decoded.satKerId);
      setExpire(decoded.exp);
      setUser(decoded);
    } catch (error) {
      if (error.response) {
        navigate("/");
      }
    }
  }, [CSRFToken, navigate, showRumahSakit]);

  useEffect(() => {
    refreshToken();
    getBulan();
    const getLastYear = async () => {
      const date = new Date();
      setTahun(date.getFullYear());
      return date.getFullYear();
    };
    getLastYear();
  }, [refreshToken]);

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

  const getBulan = async () => {
    const results = [];
    results.push({
      key: "Januari",
      value: "1",
    });
    results.push({
      key: "Februari",
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

  const bulanChangeHandler = async (e) => {
    setBulan(e.target.value);
  };

  const tahunChangeHandler = (event) => {
    setTahun(event.target.value);
  };

  const handleClose = () => setShow(false);

  const handleShow = () => {
    const satKerId = user.satKerId;
    if (satKerId) {
      showRumahSakit(satKerId);
    }
    setBulan(1);
    setShow(true);
  };

  function handleDownloadExcel() {
    const header = [
      "No.",
      "Bulan",
      "Organization ID",
      "Pengunjung Baru",
      "Pengunjung Lama",
      "Total",
    ];
    const safeData = getSafeDataRL(dataRL);
    const body = safeData.map((item, idx) => [
      idx + 1,
      item.month,
      item.organization_id,
      item.new_visitors,
      item.returning_visitors,
      item.total_visitors,
    ]);
    exportRowsToExcel({
      fileName: "RL_3_4_SatuSehat",
      sheetName: "RL 3.4 SatuSehat",
      rows: [header, ...body],
      columnWidths: [8, 16, 24, 18, 18, 14],
    });
  }

  return (
    <div className="container" style={{ marginTop: "70px" }}>
      <h2>RL 3.4 Pengunjung SatuSehat Local</h2>
      <Modal show={show} onHide={handleClose} style={{ position: "fixed" }}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>
        <form onSubmit={getSatusehatRL34}>
          <Modal.Body>
            <div
              className="form-floating"
              style={{ width: "70%", display: "inline-block" }}
            >
              <select
                typeof="select"
                className="form-control"
                value={bulan}
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
              <label>Bulan</label>
            </div>
            <div
              className="form-floating"
              style={{ width: "30%", display: "inline-block" }}
            >
              <input
                name="tahun"
                type="number"
                className="form-control"
                id="tahun"
                placeholder="Tahun"
                value={tahun}
                onChange={tahunChangeHandler}
                disabled={false}
              />
              <label htmlFor="tahun">Tahun</label>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button className="btn btn-primary" type="submit">
              Tampilkan
            </button>
          </Modal.Footer>
        </form>
      </Modal>
      <div className="row">
        <div className="col-md-12">
          <div style={{ marginBottom: "10px" }}>
            {user.jenisUserId === 4 ? (
              <Link
                className="btn"
                to={`/satusehatrl34/`}
                style={{
                  marginRight: "5px",
                  fontSize: "18px",
                  backgroundColor: "#779D9E",
                  color: "#FFFFFF",
                }}
              >
                Update SatuSehat
              </Link>
            ) : (
              <></>
            )}
            <Link
              className="btn"
              to={`/brandarl34`}
              style={{
                marginRight: "5px",
                fontSize: "18px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
            >
              ← Back
            </Link>
            <button
              className="btn"
              style={{
                fontSize: "18px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
              onClick={handleShow}
            >
              Filter
            </button>
            <button
              className="btn"
              style={{
                fontSize: "18px",
                marginLeft: "5px",
                backgroundColor: "#779D9E",
                color: "#FFFFFF",
              }}
              onClick={handleDownloadExcel}
            >
              Download
            </button>
            {spinner && <Spinner animation="border" size="sm" className="ms-2" />}
          </div>
          {filterLabel.length > 0 && (
            <div style={{ marginBottom: 12, fontSize: 12, color: "#334155" }}>
              <div style={{ fontWeight: 600 }}>
                Filtered By {filterLabel.join(", ")}
              </div>
            </div>
          )}
          {dataRL.length === 0 ? (
            <div
              style={{
                backgroundColor: "#d1ecf1",
                border: "1px solid #bee5eb",
                color: "#0c5460",
                fontSize: 14,
                fontWeight: 700,
                padding: "15px",
                borderRadius: 4,
                textAlign: "center",
              }}
            >
              Data tidak ditemukan di SATUSEHAT untuk periode ini.
            </div>
          ) : (
          <Table className={style.rlTable}>
            <thead>
              <tr>
                <th>No.</th>
                <th>Bulan</th>
                <th>Pengunjung Baru</th>
                <th>Pengunjung Lama</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(dataRL) ? dataRL : []).map((item, idx) => (
                  <tr key={idx} style={{ textAlign: "center" }}>
                    <td>{idx + 1}</td>
                    <td>{item.month}</td>
                    <td>{item.new_visitors}</td>
                    <td>{item.returning_visitors}</td>
                    <td>{item.total_visitors}</td>
                  </tr>
                ))}
            </tbody>
          </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SatuSehatRL34;
