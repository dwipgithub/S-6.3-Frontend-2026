import * as XLSX from "xlsx-js-style";
import { MONTHS } from "../constants/date";

// ======================================================
// FORMAT DATE
// ======================================================

export const formatDate = (dateStr) => {
  if (!dateStr) return "-";

  const date = new Date(dateStr);

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
// CALCULATE TOTALS
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
// NORMALISASI PERIODE MENJADI YYYY-MM
// ======================================================

const formatPeriode = (periode) => {
  if (!periode) return "-";

  // Jika sudah YYYY-MM
  if (/^\d{4}-\d{2}$/.test(periode)) {
    return periode;
  }

  // Jika format "Juni-2026"
  if (periode.includes("-")) {
    const [namaBulan, tahun] = periode.split("-");

    const bulan = MONTHS.find(
      (m) => m.label.toLowerCase() === namaBulan.toLowerCase(),
    );

    if (bulan) {
      return `${tahun}-${String(bulan.value).padStart(2, "0")}`;
    }
  }

  return periode;
};

// ======================================================
// MENDAPATKAN TAHUN DAN BULAN
// ======================================================

const getPeriodeInfo = (periode) => {
  const periodeFormatted = formatPeriode(periode);

  let tahun = "-";
  let bulan = "-";

  // Format YYYY-MM
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

  // Format Juni-2026
  if (periode?.includes("-")) {
    const [namaBulan, tahunValue] = periode.split("-");

    tahun = tahunValue;

    bulan =
      MONTHS.find((m) => m.label.toLowerCase() === namaBulan.toLowerCase())
        ?.label ?? "-";

    return {
      periodeFormatted,
      tahun,
      bulan,
    };
  }

  return {
    periodeFormatted,
    tahun,
    bulan,
  };
};

// ======================================================
// EXPORT RL 3.12
// ======================================================

export const exportRL312ExcelSatuSehat = (data = [], periode) => {
  const { periodeFormatted, tahun, bulan } = getPeriodeInfo(periode);

  // ======================================================
  // TOTAL
  // ======================================================

  const total = {
    khusus: 0,
    besar: 0,
    sedang: 0,
    kecil: 0,
    total: 0,
  };

  // ======================================================
  // DATA EXCEL
  // ======================================================

  const excelData = [
    ["SIRS ONLINE RL 3.12 Pembedahan - SATUSEHAT"],
    [],
    ["Periode Data"],
    [`Tahun : ${tahun}`],
    [`Bulan : ${bulan}`],
    [],
    [
      "No.",
      "Rumah Sakit",
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
    total.khusus += Number(item.khusus) || 0;
    total.besar += Number(item.besar) || 0;
    total.sedang += Number(item.sedang) || 0;
    total.kecil += Number(item.kecil) || 0;
    total.total += Number(item.total) || 0;

    // ------------------------------------------
    // RUMAH SAKIT
    // ------------------------------------------

    const namaRumahSakit =
      item.organization_name ??
      item.nama_rumah_sakit ??
      item.rumah_sakit ??
      item.nama_rs ??
      item.rs_name ??
      "-";

    // ------------------------------------------
    // JENIS SPESIALISASI
    // ------------------------------------------

    const jenisSpesialisasi =
      item.jenis_spesialisasi?.nama_spesialisasi ??
      item.jenis_spesialisasi?.nama ??
      item.nama_spesialisasi ??
      "-";

    excelData.push([
      index + 1,
      namaRumahSakit,
      jenisSpesialisasi,

      Number(item.khusus) || 0,
      Number(item.besar) || 0,
      Number(item.sedang) || 0,
      Number(item.kecil) || 0,
      Number(item.total) || 0,
    ]);
  });

  // ======================================================
  // TOTAL
  // ======================================================

  const totalRow = excelData.length;

  excelData.push([
    "TOTAL",
    "",
    "",
    total.khusus,
    total.besar,
    total.sedang,
    total.kecil,
    total.total,
  ]);

  // ======================================================
  // WORKSHEET
  // ======================================================

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  // ======================================================
  // MERGE
  // ======================================================

  worksheet["!merges"] = [
    // ------------------------------------------
    // JUDUL
    // A1:H1
    // ------------------------------------------

    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 7 },
    },

    // ------------------------------------------
    // TOTAL
    // A:C
    // ------------------------------------------

    {
      s: { r: totalRow, c: 0 },
      e: { r: totalRow, c: 2 },
    },
  ];

  // ======================================================
  // LEBAR KOLOM
  // ======================================================

  worksheet["!cols"] = [
    { wch: 7 }, // No.
    { wch: 30 }, // Rumah Sakit
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
  // ======================================================

  const headerRow = 6;

  for (let col = 0; col <= 7; col++) {
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
  // ======================================================

  const dataStartRow = 7;

  for (let row = dataStartRow; row < totalRow; row++) {
    for (let col = 0; col <= 7; col++) {
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
          // No + angka = center
          // Rumah Sakit + Jenis Spesialisasi = left
          horizontal: col === 0 || col >= 3 ? "center" : "left",

          vertical: "center",
          wrapText: true,
        },
        border: thinBorder,
      };
    }
  }

  // ======================================================
  // STYLE TOTAL
  // ======================================================

  for (let col = 0; col <= 7; col++) {
    const cellAddress = XLSX.utils.encode_cell({
      r: totalRow,
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
  // JUDUL
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
  // PERIODE
  // ======================================================

  worksheet["A3"].s = {
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

  worksheet["A4"].s = {
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

  worksheet["A5"].s = {
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

  // ======================================================
  // TINGGI BARIS
  // ======================================================

  worksheet["!rows"] = [
    { hpt: 25 }, // Row 1 - Judul
    { hpt: 10 }, // Row 2
    { hpt: 20 }, // Row 3 - Periode
    { hpt: 20 }, // Row 4 - Tahun
    { hpt: 20 }, // Row 5 - Bulan
    { hpt: 10 }, // Row 6
    { hpt: 30 }, // Row 7 - Header
  ];

  // ======================================================
  // WORKBOOK
  // ======================================================

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "RL312");

  // ======================================================
  // EXPORT
  // ======================================================

  XLSX.writeFile(workbook, `RL312-Pembedahan-${periodeFormatted}.xlsx`);
};
