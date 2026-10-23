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

    if (bulan) {
      return `${tahun}-${String(bulan.value).padStart(2, "0")}`;
    }
  }

  return value;
};

// ======================================================
// MENDAPATKAN INFORMASI PERIODE
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

  return {
    periodeFormatted,
    tahun,
    bulan,
  };
};

// ======================================================
// HELPER MENGAMBIL NILAI FIELD
// ======================================================

const getValue = (...values) => {
  return (
    values.find(
      (value) =>
        value !== undefined && value !== null && String(value).trim() !== "",
    ) ?? "-"
  );
};

const getNamaReferensi = (value) => {
  if (value && typeof value === "object") {
    return getValue(value.nama, value.name, value.label);
  }

  return getValue(value);
};

// ======================================================
// EXPORT RL 3.10 EXCEL SATUSEHAT
// ======================================================

export const exportRL310ExcelSatuSehat = (data = [], periode) => {
  const { periodeFormatted, tahun, bulan } = getPeriodeInfo(periode);

  // ======================================================
  // HEADER EXCEL
  // ======================================================

  const excelData = [
    ["RL 3.10 Rujukan - SATUSEHAT"],
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
    ],
    [
      "",
      "",
      "",
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
  // DATA RUMAH SAKIT
  // ======================================================

  const daftarData = Array.isArray(data) ? data : [];

  daftarData.forEach((item, index) => {
    // -----------------------------------------------
    // IDENTITAS RS
    // -----------------------------------------------

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
      item.nama_rs,
      item.rs_name,
      item.rumah_sakit?.nama,
      item.rumah_sakit?.nama_rs,
      typeof item.rumah_sakit === "string" ? item.rumah_sakit : undefined,
    );

    const provinsi = getNamaReferensi(
      getValue(
        item.provinsiNama,
        item.provinsi_nama,
        item.nama_provinsi,
        item.provinsi_name,
        item.provinsi?.nama,
        item.provinsi?.name,
        item.provinsi?.label,
        typeof item.provinsi === "string" ? item.provinsi : undefined,
      ),
    );

    const kabupatenKota = getNamaReferensi(
      getValue(
        item.kabKotaNama,
        item.kab_kota_nama,
        item.kabupatenKotaNama,
        item.kabupaten_kota_nama,
        item.namaKabKota,
        item.namaKabupatenKota,
        item.nama_kabupaten_kota,
        item.nama_kabupaten,
        item.nama_kota,
        item.kabupaten_kota_name,
        item.kabkota?.nama,
        item.kabkota?.name,
        item.kabKota?.nama,
        item.kabKota?.name,
        item.kabupatenKota?.nama,
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

    const jenisSpesialisasi = getNamaReferensi(item.jenis_spesialisasi);

    // -----------------------------------------------
    // INDIKATOR RL 3.10
    // -----------------------------------------------

    excelData.push([
      index + 1,
      kodeRS,
      namaRumahSakit,
      provinsi,
      kabupatenKota,
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
  // WORKSHEET
  // ======================================================

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  // ======================================================
  // MERGE CELL
  // ======================================================

  worksheet["!merges"] = [
    // Judul A1:R1
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 17 },
    },

    // Header vertikal: No.
    {
      s: { r: 6, c: 0 },
      e: { r: 8, c: 0 },
    },

    // Header vertikal: Kode RS
    {
      s: { r: 6, c: 1 },
      e: { r: 8, c: 1 },
    },

    // Header vertikal: Rumah Sakit
    {
      s: { r: 6, c: 2 },
      e: { r: 8, c: 2 },
    },

    // Header vertikal: Provinsi
    {
      s: { r: 6, c: 3 },
      e: { r: 8, c: 3 },
    },

    // Header vertikal: Kabupaten/Kota
    {
      s: { r: 6, c: 4 },
      e: { r: 8, c: 4 },
    },

    // Header vertikal: Jenis Spesialisasi
    {
      s: { r: 6, c: 5 },
      e: { r: 8, c: 5 },
    },

    // Rujukan Masuk: 8 kolom
    {
      s: { r: 6, c: 6 },
      e: { r: 6, c: 13 },
    },

    // Diterima Dari
    {
      s: { r: 7, c: 6 },
      e: { r: 7, c: 9 },
    },

    // Dikembalikan Ke
    {
      s: { r: 7, c: 10 },
      e: { r: 7, c: 13 },
    },

    // Dirujuk Keluar: 4 kolom
    {
      s: { r: 6, c: 14 },
      e: { r: 7, c: 17 },
    },
  ];

  // ======================================================
  // LEBAR KOLOM
  // ======================================================

  worksheet["!cols"] = [
    { wch: 7 }, // No.
    { wch: 16 }, // Kode RS
    { wch: 32 }, // Rumah Sakit
    { wch: 22 }, // Provinsi
    { wch: 25 }, // Kabupaten/Kota
    { wch: 28 }, // Jenis Spesialisasi

    { wch: 15 }, // Puskesmas
    { wch: 12 }, // RS Lain
    { wch: 15 }, // Faskes Lain
    { wch: 20 }, // Total Rujukan Masuk

    { wch: 15 }, // Puskesmas
    { wch: 12 }, // RS Asal
    { wch: 15 }, // Faskes Lain
    { wch: 27 }, // Total Rujukan Masuk Dikembalikan

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

  // ======================================================
  // STYLE HEADER BERTINGKAT
  // Baris Excel 7-9 (index 6-8)
  // Semua header rata tengah
  // ======================================================

  for (let row = 6; row <= 8; row++) {
    for (let col = 0; col <= 17; col++) {
      const cellAddress = XLSX.utils.encode_cell({
        r: row,
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
  }

  // ======================================================
  // STYLE DATA TABEL
  //
  // No.                       : rata tengah
  // Kolom identitas RS        : rata kiri
  // Rujukan Masuk s.d. Keluar : rata kanan
  // ======================================================

  const firstDataRow = 9;

  for (let row = firstDataRow; row < excelData.length; row++) {
    for (let col = 0; col <= 17; col++) {
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
  // STYLE PERIODE DATA
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
    { hpt: 35 }, // Row 7 - Header level 1
    { hpt: 35 }, // Row 8 - Header level 2
    { hpt: 60 }, // Row 9 - Header level 3
  ];

  // ======================================================
  // WORKBOOK
  // ======================================================

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "RL310");

  // ======================================================
  // EXPORT EXCEL
  // ======================================================

  XLSX.writeFile(workbook, `RL310-Rujukan-${periodeFormatted}.xlsx`);
};
