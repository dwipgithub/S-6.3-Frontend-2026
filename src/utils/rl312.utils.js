import * as XLSX from "xlsx-js-style";
import { MONTHS } from "../constants/date";

// ======================================================
// FORMAT TANGGAL
// ======================================================

export const formatDate = (dateStr) => {
  if (!dateStr) return "-";

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const day = date.getDate();

  const month =
    MONTHS.find((m) => m.value === String(date.getMonth() + 1))?.label ?? "-";

  const year = date.getFullYear();

  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${day} ${month} ${year}, ${hour}.${minute}.${second} WIB`;
};

// ======================================================
// NORMALISASI PERIODE MENJADI YYYY-MM
// ======================================================

const formatPeriode = (periode) => {
  if (!periode) return "-";

  const value = String(periode).trim();

  if (/^\d{4}-\d{2}$/.test(value)) {
    return value;
  }

  if (value.includes("-")) {
    const [namaBulan, tahun] = value.split("-");

    const bulan = MONTHS.find(
      (m) => m.label.toLowerCase() === namaBulan.trim().toLowerCase(),
    );

    if (bulan && tahun) {
      return `${tahun}-${String(bulan.value).padStart(2, "0")}`;
    }
  }

  return value;
};

// ======================================================
// MENDAPATKAN TAHUN DAN BULAN
// ======================================================

const getPeriodeInfo = (periode) => {
  const periodeFormatted = formatPeriode(periode);

  let tahun = "-";
  let bulan = "-";

  if (/^\d{4}-\d{2}$/.test(periodeFormatted)) {
    const [tahunValue, bulanValue] = periodeFormatted.split("-");

    tahun = tahunValue;

    bulan =
      MONTHS.find((m) => String(m.value).padStart(2, "0") === bulanValue)
        ?.label ?? "-";

    return {
      periodeFormatted,
      tahun,
      bulan,
    };
  }

  if (String(periode ?? "").includes("-")) {
    const [namaBulan, tahunValue] = String(periode).split("-");

    tahun = tahunValue;

    bulan =
      MONTHS.find(
        (m) => m.label.toLowerCase() === namaBulan.trim().toLowerCase(),
      )?.label ?? "-";

    return {
      periodeFormatted,
      tahun,
      bulan,
    };
  }

  if (/^\d{4}$/.test(String(periode ?? ""))) {
    tahun = String(periode);
  }

  return {
    periodeFormatted,
    tahun,
    bulan,
  };
};

// ======================================================
// HELPER FIELD
// ======================================================

const getValue = (...values) =>
  values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
  ) ?? "-";

const getNamaReferensi = (value) => {
  if (value && typeof value === "object") {
    return getValue(value.nama, value.name, value.label);
  }

  return getValue(value);
};

// ======================================================
// PERHITUNGAN TOTAL
// ======================================================

export const calculateTotals = (data = []) => {
  return data.reduce(
    (acc, item) => {
      acc.khusus += Number(item.khusus) || 0;
      acc.besar += Number(item.besar) || 0;
      acc.sedang += Number(item.sedang) || 0;
      acc.kecil += Number(item.kecil) || 0;
      acc.total += Number(item.total) || 0;

      return acc;
    },
    {
      khusus: 0,
      besar: 0,
      sedang: 0,
      kecil: 0,
      total: 0,
    },
  );
};

// ======================================================
// EXPORT RL 3.12 EXCEL SATUSEHAT
// LAPORAN BULANAN
// ======================================================

export const exportRL312ExcelSatuSehat = (data = [], periode) => {
  const { periodeFormatted, tahun, bulan } = getPeriodeInfo(periode);

  // ======================================================
  // HEADER EXCEL
  // ======================================================

  const excelData = [
    ["RL 3.12 Pembedahan - SATUSEHAT"],
    [],
    ["Periode Data"],
    [`Bulan : ${bulan}`],
    [`Tahun : ${tahun}`],
    [],
    [
      "No.",
      "Kode RS",
      "Rumah Sakit",
      "Provinsi",
      "Kabupaten/Kota",
      "Jenis Spesialisasi",
      "Khusus",
      "Besar",
      "Sedang",
      "Kecil",
      "Total",
    ],
  ];

  // ======================================================
  // DATA
  // ======================================================

  data.forEach((item, index) => {
    // Kode RS
    const kodeRS = getValue(
      item.kodeRs,
      item.kode_rs,
      item.kodeRS,
      item.kd_rs,
      item.kode_rumah_sakit,
      item.rumah_sakit?.kode_rs,
      item.organization?.kode_rs,
    );

    // Nama rumah sakit
    const namaRumahSakit = getValue(
      item.namaRs,
      item.organization_name,
      item.nama_rumah_sakit,
      item.nama_rs,
      item.rs_name,
      item.rumah_sakit?.nama,
      item.rumah_sakit?.nama_rs,
      typeof item.rumah_sakit === "string" ? item.rumah_sakit : undefined,
    );

    // Provinsi
    const provinsi = getNamaReferensi(
      getValue(
        item.provinsiNama,
        item.provinsi_nama,
        item.nama_provinsi,
        item.provinsi_name,
        item.provinsi?.nama,
        item.provinsi?.name,
        typeof item.provinsi === "string" ? item.provinsi : undefined,
      ),
    );

    // Kabupaten/Kota
    const kabupatenKota = getNamaReferensi(
      getValue(
        item.kabKotaNama,
        item.kab_kota_nama,
        item.kabupatenKotaNama,
        item.kabupaten_kota_nama,
        item.nama_kabupaten_kota,
        item.nama_kabupaten,
        item.nama_kota,
        item.kabupaten_kota_name,
        item.kabupaten_kota?.nama,
        item.kabupaten_kota?.name,
        item.kabupaten?.nama,
        item.kabupaten?.name,
        item.kota?.nama,
        item.kota?.name,
        typeof item.kabupaten_kota === "string"
          ? item.kabupaten_kota
          : undefined,
        typeof item.kabupaten === "string" ? item.kabupaten : undefined,
        typeof item.kota === "string" ? item.kota : undefined,
      ),
    );

    // Jenis spesialisasi
    const jenisSpesialisasi = getValue(
      item.jenis_spesialisasi?.nama_spesialisasi,
      item.jenis_spesialisasi?.nama,
      item.nama_spesialisasi,
    );

    excelData.push([
      index + 1,
      kodeRS,
      namaRumahSakit,
      provinsi,
      kabupatenKota,
      jenisSpesialisasi,
      Number(item.khusus) || 0,
      Number(item.besar) || 0,
      Number(item.sedang) || 0,
      Number(item.kecil) || 0,
      Number(item.total) || 0,
    ]);
  });

  // ======================================================
  // WORKSHEET
  // ======================================================

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  // ======================================================
  // MERGE JUDUL
  // A1:K1
  // ======================================================

  worksheet["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 10 },
    },
  ];

  // ======================================================
  // LEBAR KOLOM
  // ======================================================

  worksheet["!cols"] = [
    { wch: 7 }, // No.
    { wch: 16 }, // Kode RS
    { wch: 35 }, // Rumah Sakit
    { wch: 22 }, // Provinsi
    { wch: 25 }, // Kabupaten/Kota
    { wch: 32 }, // Jenis Spesialisasi
    { wch: 15 }, // Khusus
    { wch: 15 }, // Besar
    { wch: 15 }, // Sedang
    { wch: 15 }, // Kecil
    { wch: 15 }, // Total
  ];

  // ======================================================
  // BORDER
  // ======================================================

  const thinBorder = {
    top: {
      style: "thin",
      color: { rgb: "000000" },
    },
    bottom: {
      style: "thin",
      color: { rgb: "000000" },
    },
    left: {
      style: "thin",
      color: { rgb: "000000" },
    },
    right: {
      style: "thin",
      color: { rgb: "000000" },
    },
  };

  // ======================================================
  // STYLE HEADER
  // Baris Excel 7 (index 6)
  // Semua header rata tengah
  // ======================================================

  const headerRow = 6;

  for (let col = 0; col <= 10; col++) {
    const cellAddress = XLSX.utils.encode_cell({
      r: headerRow,
      c: col,
    });

    if (!worksheet[cellAddress]) continue;

    worksheet[cellAddress].s = {
      font: {
        name: "Calibri",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: thinBorder,
    };
  }

  // ======================================================
  // STYLE DATA
  // No.             : rata tengah
  // Kolom teks      : rata kiri
  // Khusus s.d. Total: rata kanan
  // ======================================================

  const dataStartRow = headerRow + 1;

  for (let row = dataStartRow; row < excelData.length; row++) {
    for (let col = 0; col <= 10; col++) {
      const cellAddress = XLSX.utils.encode_cell({
        r: row,
        c: col,
      });

      if (!worksheet[cellAddress]) continue;

      worksheet[cellAddress].s = {
        font: {
          name: "Calibri",
          sz: 12,
        },
        alignment: {
          horizontal: col === 0 ? "center" : col >= 6 ? "right" : "left",
          vertical: "center",
          wrapText: true,
        },
        border: thinBorder,
      };
    }
  }

  // ======================================================
  // STYLE JUDUL
  // ======================================================

  worksheet["A1"].s = {
    font: {
      name: "Calibri",
      sz: 16,
      bold: true,
    },
    alignment: {
      horizontal: "left",
      vertical: "center",
    },
  };

  // ======================================================
  // STYLE PERIODE
  // ======================================================

  ["A3", "A4", "A5"].forEach((cellAddress) => {
    if (!worksheet[cellAddress]) return;

    worksheet[cellAddress].s = {
      font: {
        name: "Calibri",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "left",
        vertical: "center",
      },
    };
  });

  // ======================================================
  // TINGGI BARIS
  // ======================================================

  worksheet["!rows"] = [
    { hpt: 25 }, // Row 1 - Judul
    { hpt: 10 }, // Row 2
    { hpt: 20 }, // Row 3 - Periode Data
    { hpt: 20 }, // Row 4 - Bulan
    { hpt: 20 }, // Row 5 - Tahun
    { hpt: 10 }, // Row 6
    { hpt: 35 }, // Row 7 - Header
  ];

  // ======================================================
  // WORKBOOK
  // ======================================================

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "RL312");

  // ======================================================
  // EXPORT EXCEL
  // ======================================================

  XLSX.writeFile(workbook, `RL312-Pembedahan-${periodeFormatted}.xlsx`);
};
