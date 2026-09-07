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

export const exportRL310ExcelSatuSehat = (data = [], periode) => {
  const { periodeFormatted, tahun, bulan } = getPeriodeInfo(periode);

  // ======================================================
  // TOTAL
  // ======================================================

  const total = {
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
  };

  // ======================================================
  // DATA EXCEL
  // ======================================================

  const excelData = [
    ["SIRS ONLINE RL 3.10 Rujukan - SATUSEHAT"],
    [],
    ["Periode Data"],
    [`Tahun : ${tahun}`],
    [`Bulan : ${bulan}`],
    [],
    [
      "No.",
      "Rumah Sakit",
      "Jenis Spesialisasi",
      "Rujukan Masuk",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "Dirujuk Keluar",
      "",
      "",
      "",
    ],
    [
      "",
      "",
      "",
      "Diterima Dari",
      "",
      "",
      "",
      "Dikembalikan Ke",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "",
      "",
      "",
      "Puskesmas",
      "RS Lain",
      "Faskes Lain",
      "Total Rujukan Masuk",
      "Puskesmas",
      "RS Asal",
      "Faskes Lain",
      "Total Rujukan Masuk Dikembalikan",
      "Pasien Rujukan",
      "Pasien Datang Sendiri",
      "Total Dirujuk Keluar",
      "Diterima Kembali",
    ],
  ];

  // ======================================================
  // DATA
  // ======================================================

  data.forEach((item, index) => {
    Object.keys(total).forEach((key) => {
      total[key] += Number(item[key]) || 0;
    });

    const namaRumahSakit =
      item.organization_name ??
      item.nama_rumah_sakit ??
      item.rumah_sakit ??
      item.nama_rs ??
      item.rs_name ??
      "-";

    const jenisSpesialisasi = item.jenis_spesialisasi?.nama ?? "-";

    excelData.push([
      index + 1,
      namaRumahSakit,
      jenisSpesialisasi,

      Number(item.rm_diterima_puskesmas) || 0,
      Number(item.rm_diterima_rs) || 0,
      Number(item.rm_diterima_faskes_lain) || 0,
      Number(item.rm_diterima_total_rm) || 0,

      Number(item.rm_dikembalikan_puskesmas) || 0,
      Number(item.rm_dikembalikan_rs) || 0,
      Number(item.rm_dikembalikan_faskes_lain) || 0,
      Number(item.rm_dikembalikan_total_rm) || 0,

      Number(item.keluar_pasien_rujukan) || 0,
      Number(item.keluar_pasien_datang_sendiri) || 0,
      Number(item.keluar_total_keluar) || 0,
      Number(item.keluar_diterima_kembali) || 0,
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

    total.rm_diterima_puskesmas,
    total.rm_diterima_rs,
    total.rm_diterima_faskes_lain,
    total.rm_diterima_total_rm,

    total.rm_dikembalikan_puskesmas,
    total.rm_dikembalikan_rs,
    total.rm_dikembalikan_faskes_lain,
    total.rm_dikembalikan_total_rm,

    total.keluar_pasien_rujukan,
    total.keluar_pasien_datang_sendiri,
    total.keluar_total_keluar,
    total.keluar_diterima_kembali,
  ]);

  // ======================================================
  // WORKSHEET
  // ======================================================

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  // ======================================================
  // MERGE JUDUL
  // A1:O1
  // ======================================================

  worksheet["!merges"] = [
    // ==========================================
    // JUDUL
    // ==========================================
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 14 },
    },

    // ==========================================
    // HEADER VERTIKAL
    // ==========================================

    // No.
    {
      s: { r: 6, c: 0 },
      e: { r: 8, c: 0 },
    },

    // Rumah Sakit
    {
      s: { r: 6, c: 1 },
      e: { r: 8, c: 1 },
    },

    // Jenis Spesialisasi
    {
      s: { r: 6, c: 2 },
      e: { r: 8, c: 2 },
    },

    // ==========================================
    // RUJUKAN MASUK
    // ==========================================

    {
      s: { r: 6, c: 3 },
      e: { r: 6, c: 10 },
    },

    // Diterima Dari
    {
      s: { r: 7, c: 3 },
      e: { r: 7, c: 6 },
    },

    // Dikembalikan Ke
    {
      s: { r: 7, c: 7 },
      e: { r: 7, c: 10 },
    },

    // ==========================================
    // DIRUJUK KELUAR
    // ==========================================

    {
      s: { r: 6, c: 11 },
      e: { r: 7, c: 14 },
    },

    // ==========================================
    // FOOTER TOTAL
    // No. + Rumah Sakit + Jenis Spesialisasi
    // ==========================================

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
    for (let col = 0; col <= 14; col++) {
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

  for (let row = 9; row < totalRow; row++) {
    for (let col = 0; col <= 14; col++) {
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
          // Rumah Sakit + Jenis Spesialisasi kiri
          horizontal: col === 0 || col >= 3 ? "center" : "left",
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

  for (let col = 0; col <= 14; col++) {
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

  XLSX.utils.book_append_sheet(workbook, worksheet, "RL310");

  // ======================================================
  // EXPORT
  // ======================================================

  XLSX.writeFile(workbook, `RL310-Rujukan-${periodeFormatted}.xlsx`);
};
