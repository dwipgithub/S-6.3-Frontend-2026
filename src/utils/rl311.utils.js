import * as XLSX from "xlsx-js-style";
import { MONTHS } from "../constants/date";

// ======================================================
// FORMAT TANGGAL
// ======================================================

export const formatDate = (dateStr) => {
  if (!dateStr) return "-";

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) return "-";

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
// NORMALISASI PERIODE
// Mendukung format YYYY, YYYY-MM, dan Juni-2026
// ======================================================

const formatPeriode = (periode) => {
  if (!periode) return "-";

  const value = String(periode).trim();

  if (/^\d{4}$/.test(value)) {
    return value;
  }

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
// INFORMASI PERIODE TAHUNAN
// ======================================================

const getPeriodeInfo = (periode) => {
  const periodeFormatted = formatPeriode(periode);
  let tahun = "-";

  if (/^\d{4}$/.test(periodeFormatted)) {
    tahun = periodeFormatted;
  } else if (/^\d{4}-\d{2}$/.test(periodeFormatted)) {
    tahun = periodeFormatted.split("-")[0];
  } else if (String(periode ?? "").includes("-")) {
    const parts = String(periode).split("-");
    tahun = parts[1] || "-";
  }

  return {
    periodeFormatted,
    tahun,
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
// Dipertahankan untuk kompatibilitas fungsi lain.
// Tidak digunakan untuk menambahkan baris TOTAL Excel.
// ======================================================

export const calculateTotals = (data = []) => {
  return data.reduce(
    (acc, item) => {
      acc.jumlah += Number(item.jumlah) || 0;
      return acc;
    },
    { jumlah: 0 },
  );
};

// ======================================================
// EXPORT RL 3.11 EXCEL SATUSEHAT
// LAPORAN TAHUNAN
// ======================================================

export const exportRL311ExcelSatuSehat = (data = [], periode) => {
  const { periodeFormatted, tahun } = getPeriodeInfo(periode);

  // ======================================================
  // HEADER EXCEL
  // ======================================================

  const excelData = [
    ["RL 3.11 Gigi dan Mulut - SATUSEHAT"],
    [],
    ["Periode Data"],
    [`Tahun : ${tahun}`],
    [],
    [
      "No.",
      "Kode RS",
      "Rumah Sakit",
      "Provinsi",
      "Kabupaten/Kota",
      "Jenis Kegiatan",
      "Jumlah",
    ],
  ];

  // ======================================================
  // DATA RUMAH SAKIT
  // ======================================================

  data.forEach((item, index) => {
    const kodeRS = getValue(
      item.kodeRs,
      item.kode_rs,
      item.kodeRS,
      item.kd_rs,
      item.kode_rumah_sakit,
      item.rumah_sakit?.kode_rs,
      item.organization?.kode_rs,
    );

    const namaRumahSakit = getValue(
      item.namaRs,
      item.organization_name,
      item.nama_rumah_sakit,
      item.rumah_sakit?.nama,
      item.rumah_sakit?.nama_rs,
      typeof item.rumah_sakit === "string" ? item.rumah_sakit : undefined,
      item.nama_rs,
      item.rs_name,
    );

    const provinsi = getNamaReferensi(
      getValue(
        item.provinsiNama,
        item.provinsi_nama,
        item.provinsi?.nama,
        item.provinsi?.name,
        item.nama_provinsi,
        item.provinsi_name,
        typeof item.provinsi === "string" ? item.provinsi : undefined,
      ),
    );

    const kabupatenKota = getNamaReferensi(
      getValue(
        item.kabKotaNama,
        item.kab_kota_nama,
        item.kabupatenKotaNama,
        item.kabupaten_kota?.nama,
        item.kabupaten_kota?.name,
        item.kabupaten?.nama,
        item.kota?.nama,
        item.nama_kabupaten_kota,
        item.nama_kabupaten,
        item.nama_kota,
        item.kabupaten_kota_name,
        typeof item.kabupaten_kota === "string"
          ? item.kabupaten_kota
          : undefined,
        typeof item.kabupaten === "string" ? item.kabupaten : undefined,
        typeof item.kota === "string" ? item.kota : undefined,
      ),
    );

    const jenisKegiatan = getValue(
      item.rl_tiga_titik_sebelas_jenis_kegiatan?.nama_jenis_kegiatan,
      item.jenis_kegiatan?.nama_jenis_kegiatan,
      item.jenis_kegiatan?.nama,
      item.nama_jenis_kegiatan,
    );

    const jumlah = Number(item.jumlah) || 0;

    excelData.push([
      index + 1,
      kodeRS,
      namaRumahSakit,
      provinsi,
      kabupatenKota,
      jenisKegiatan,
      jumlah,
    ]);
  });

  // ======================================================
  // WORKSHEET
  // ======================================================

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  // ======================================================
  // MERGE JUDUL
  // A1:G1
  // ======================================================

  worksheet["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 6 },
    },
  ];

  // ======================================================
  // LEBAR KOLOM
  // ======================================================

  worksheet["!cols"] = [
    { wch: 8 }, // No.
    { wch: 16 }, // Kode RS
    { wch: 32 }, // Rumah Sakit
    { wch: 22 }, // Provinsi
    { wch: 25 }, // Kabupaten/Kota
    { wch: 45 }, // Jenis Kegiatan
    { wch: 15 }, // Jumlah
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
  // HEADER TABEL
  // Baris Excel 6 (index 5)
  // Semua header rata tengah
  // ======================================================

  const headerRow = 5;

  for (let col = 0; col <= 6; col++) {
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
  // DATA TABEL
  // Mulai baris Excel 7 (index 6)
  //
  // No.     : rata tengah
  // Kolom teks: rata kiri
  // Jumlah  : rata kanan
  // ======================================================

  for (let row = headerRow + 1; row < excelData.length; row++) {
    for (let col = 0; col <= 6; col++) {
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
          horizontal: col === 0 ? "center" : col === 6 ? "right" : "left",
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
  // STYLE PERIODE DATA
  // ======================================================

  ["A3", "A4"].forEach((cellAddress) => {
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
    { hpt: 20 }, // Row 4 - Tahun
    { hpt: 10 }, // Row 5
    { hpt: 35 }, // Row 6 - Header
  ];

  // ======================================================
  // WORKBOOK
  // ======================================================

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "RL311");

  // ======================================================
  // EXPORT EXCEL
  // ======================================================

  XLSX.writeFile(workbook, `RL311-Gigi dan Mulut-${periodeFormatted}.xlsx`);
};
