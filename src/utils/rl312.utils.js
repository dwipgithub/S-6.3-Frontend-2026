import * as XLSX from "xlsx-js-style";
import { MONTHS } from "../constants/date";

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
  if (periode.includes("-")) {
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

export const exportRL312ExcelSatuSehat = (data = [], periode) => {
  const { periodeFormatted, tahun, bulan } = getPeriodeInfo(periode);

  // ======================================================
  // TOTAL
  // ======================================================

  const sub_total = {
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
    Object.keys(sub_total).forEach((key) => {
      sub_total[key] += Number(item[key]) || 0;
    });

    const jenisSpesialisasi = item.jenis_spesialisasi?.nama_spesialisasi ?? "-";

    excelData.push([
      index + 1,
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

  excelData.push([
    "",
    "TOTAL",

    sub_total.khusus,
    sub_total.besar,
    sub_total.sedang,
    sub_total.kecil,
    sub_total.total,
  ]);

  // ======================================================
  // WORKSHEET
  // ======================================================

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  // ======================================================
  // MERGE JUDUL
  // A1:N1
  // ======================================================

  worksheet["!merges"] = [
    // ==========================================
    // JUDUL
    // ==========================================

    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 13 },
    },

    // ==========================================
    // HEADER VERTIKAL
    // ==========================================

    // No.
    {
      s: { r: 6, c: 0 },
      e: { r: 8, c: 0 },
    },

    // Jenis Spesialisasi
    {
      s: { r: 6, c: 1 },
      e: { r: 8, c: 1 },
    },

    // ==========================================
    // RUJUKAN MASUK
    // ==========================================

    {
      s: { r: 6, c: 2 },
      e: { r: 6, c: 9 },
    },

    // Diterima Dari
    {
      s: { r: 7, c: 2 },
      e: { r: 7, c: 5 },
    },

    // Dikembalikan Ke
    {
      s: { r: 7, c: 6 },
      e: { r: 7, c: 9 },
    },

    // ==========================================
    // DIRUJUK KELUAR
    // ==========================================

    {
      s: { r: 6, c: 10 },
      e: { r: 7, c: 13 },
    },
  ];

  // ======================================================
  // LEBAR KOLOM
  // ======================================================

  worksheet["!cols"] = [
    { wch: 7 }, // No.
    { wch: 28 }, // Jenis Spesialisasi

    { wch: 15 }, // Puskesmas
    { wch: 12 }, // RS Lain
    { wch: 15 }, // Faskes Lain
    { wch: 20 }, // Total Rujukan Masuk

    { wch: 15 }, // Puskesmas
    { wch: 12 }, // RS Asal
    { wch: 15 }, // Faskes Lain
    { wch: 25 }, // Total Rujukan Masuk Dikembalikan

    { wch: 20 }, // Pasien Rujukan
    { wch: 22 }, // Pasien Datang Sendiri
    { wch: 20 }, // Total Dirujuk Keluar
    { wch: 18 }, // Diterima Kembali
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

  // ==========================================
  // STYLE HEADER BERTINGKAT
  // ROW 7 - 9
  // ==========================================

  for (let row = 6; row <= 8; row++) {
    for (let col = 0; col <= 13; col++) {
      const cellAddress = XLSX.utils.encode_cell({
        r: row,
        c: col,
      });

      if (worksheet[cellAddress]) {
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
    }
  }

  // ======================================================
  // DATA TABEL
  // ======================================================

  const totalRow = excelData.length - 1;

  for (let row = 9; row < totalRow; row++) {
    for (let col = 0; col <= 13; col++) {
      const cellAddress = XLSX.utils.encode_cell({
        r: row,
        c: col,
      });

      if (!worksheet[cellAddress]) {
        continue;
      }

      worksheet[cellAddress].s = {
        font: {
          name: "Calibri",
          sz: 12,
        },
        alignment: {
          // No + semua angka di tengah
          // Jenis Spesialisasi kiri
          horizontal: col === 0 || col >= 2 ? "center" : "left",
          vertical: "center",
          wrapText: true,
        },
        border: thinBorder,
      };
    }
  }

  // ======================================================
  // TOTAL
  // ======================================================

  for (let col = 0; col <= 13; col++) {
    const cellAddress = XLSX.utils.encode_cell({
      r: totalRow,
      c: col,
    });

    if (worksheet[cellAddress]) {
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
  // PERIODE DATA
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
    { hpt: 20 }, // Row 3
    { hpt: 20 }, // Row 4 - Tahun
    { hpt: 20 }, // Row 5 - Bulan
    { hpt: 10 }, // Row 6
    { hpt: 30 }, // Row 7 - Header level 1
    { hpt: 30 }, // Row 8 - Header level 2
    { hpt: 55 }, // Row 9 - Header level 3
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
