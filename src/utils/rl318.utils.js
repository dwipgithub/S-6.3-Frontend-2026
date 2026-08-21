import * as XLSX from "xlsx-js-style";

export const calculateTotals = (data = []) => {
  return data.reduce(
    (acc, item) => {
      acc.jumlahRawatInap += Number(item.rawat_inap) || 0;
      acc.jumlahRawatJalan += Number(item.rawat_jalan) || 0;
      acc.jumlahIgd += Number(item.igd) || 0;
      acc.jumlahTotalResep += Number(item.total_resep) || 0;

      return acc;
    },
    {
      jumlahRawatInap: 0,
      jumlahIgd: 0,
      jumlahRawatJalan: 0,
      jumlahTotalResep: 0,
    },
  );
};

export const exportRL318ExcelSatuSehat = (data = [], tahun) => {
  let totalRawatJalan = 0;
  let totalRawatInap = 0;
  let totalIgd = 0;
  let totalResep = 0;

  // ==========================================
  // DATA EXCEL
  // ==========================================

  const excelData = [
    ["SIRS ONLINE RL 3.18 Farmasi Resep - SATUSEHAT"],
    [],
    ["Periode Data"],
    [`Tahun : ${tahun}`],
    [],
    ["No", "Golongan Obat", "Rawat Jalan", "IGD", "Rawat Inap", "Total Resep"],
  ];

  // ==========================================
  // DATA
  // ==========================================

  data.forEach((item, index) => {
    const jumlahRawatJalan = Number(item.rawat_jalan) || 0;
    const jumlahIgd = Number(item.igd) || 0;
    const jumlahRawatInap = Number(item.rawat_inap) || 0;
    const jumlahTotalResep = Number(item.total_resep) || 0;

    totalRawatJalan += jumlahRawatJalan;
    totalIgd += jumlahIgd;
    totalRawatInap += jumlahRawatInap;
    totalResep += jumlahTotalResep;

    const namaGolonganObat =
      item.nama_golongan_obat ??
      item.rl_tiga_titik_delapan_belas_golongan_obat?.nama ??
      "-";

    excelData.push([
      index + 1,
      namaGolonganObat,
      jumlahRawatJalan,
      jumlahIgd,
      jumlahRawatInap,
      jumlahTotalResep,
    ]);
  });

  // ==========================================
  // TOTAL
  // ==========================================

  excelData.push([
    "",
    "TOTAL",
    totalRawatJalan,
    totalIgd,
    totalRawatInap,
    totalResep,
  ]);

  // ==========================================
  // WORKSHEET
  // ==========================================

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  // ==========================================
  // MERGE JUDUL
  // A1:F1
  // ==========================================

  worksheet["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 5 },
    },
  ];

  // ==========================================
  // LEBAR KOLOM
  // ==========================================

  worksheet["!cols"] = [
    { wch: 8 }, // No
    { wch: 40 }, // Golongan Obat
    { wch: 15 }, // Rawat Jalan
    { wch: 12 }, // IGD
    { wch: 15 }, // Rawat Inap
    { wch: 15 }, // Total Resep
  ];

  // ==========================================
  // BORDER
  // ==========================================

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
  // STYLE HEADER
  // ROW 6
  // ==========================================

  for (let col = 0; col <= 5; col++) {
    const cellAddress = XLSX.utils.encode_cell({
      r: 5,
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

  // ==========================================
  // STYLE DATA
  // ==========================================

  const totalRow = excelData.length - 1;

  for (let row = 6; row < totalRow; row++) {
    for (let col = 0; col <= 5; col++) {
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
          // No dan angka berada di tengah
          // Golongan Obat kiri
          horizontal: col === 0 || col >= 2 ? "center" : "left",
          vertical: "center",
          wrapText: true,
        },
        border: thinBorder,
      };
    }
  }

  // ==========================================
  // STYLE TOTAL
  // ==========================================

  for (let col = 0; col <= 5; col++) {
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

  // ==========================================
  // STYLE JUDUL
  // ==========================================

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

  // ==========================================
  // STYLE PERIODE
  // ==========================================

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

  // ==========================================
  // TINGGI BARIS
  // ==========================================

  worksheet["!rows"] = [
    { hpt: 25 }, // Row 1
    { hpt: 10 }, // Row 2
    { hpt: 20 }, // Row 3
    { hpt: 20 }, // Row 4
    { hpt: 15 }, // Row 5
    { hpt: 35 }, // Row 6
  ];

  // ==========================================
  // WORKBOOK
  // ==========================================

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Farmasi Resep");

  // ==========================================
  // EXPORT
  // ==========================================

  XLSX.writeFile(workbook, `RL318-Farmasi Resep-${tahun}.xlsx`);
};
