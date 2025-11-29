import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Export to Excel
export const exportToExcel = (data, filename = 'export') => {
  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  // Save file
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Export to CSV
export const exportToCSV = (data, filename = 'export') => {
  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Convert to CSV
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  // Save file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
};

// Format player data for export
export const formatPlayerDataForExport = (players) => {
  return players.map((player, index) => ({
    'Rank': index + 1,
    'Player Name': player.name,
    'Received Amount': `$${player.receivedAmount.toFixed(2)}`,
    'Received Count': player.receivedCount,
    'Sent Amount': `$${player.sentAmount.toFixed(2)}`,
    'Sent Count': player.sentCount,
    'Net Balance': `$${player.netBalance.toFixed(2)}`,
    'Apps Used': player.appCount,
    'Total Transactions': player.totalTransactions,
    'Last Active': new Date(player.lastActive).toLocaleString()
  }));
};

// Format app data for export
export const formatAppDataForExport = (apps) => {
  return apps.map((app, index) => ({
    'Rank': index + 1,
    'App Name': app.name,
    'App Type': app.appType,
    'Received Amount': `$${app.receivedAmount.toFixed(2)}`,
    'Received Count': app.receivedCount,
    'Sent Amount': `$${app.sentAmount.toFixed(2)}`,
    'Sent Count': app.sentCount,
    'Net Balance': `$${app.netBalance.toFixed(2)}`,
    'Players': app.playerCount,
    'Total Transactions': app.totalTransactions,
    'Last Active': new Date(app.lastActive).toLocaleString()
  }));
};

// Export to PDF with dashboard summary
export const exportToPDF = (data, filename = 'export', summaryData = {}) => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.setTextColor(102, 126, 234);
  doc.text('Transaction Dashboard Report', 14, 20);

  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  let yPosition = 35;

  // Add summary section if provided
  if (summaryData && Object.keys(summaryData).length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Dashboard Summary', 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    if (summaryData.dateRange) {
      doc.text(`Period: ${summaryData.dateRange}`, 14, yPosition);
      yPosition += 6;
    }

    if (summaryData.totalTransactions !== undefined) {
      doc.text(`Total Transactions: ${summaryData.totalTransactions}`, 14, yPosition);
      yPosition += 6;
    }

    if (summaryData.totalAmount !== undefined) {
      doc.text(`Total Amount: $${summaryData.totalAmount.toFixed(2)}`, 14, yPosition);
      yPosition += 6;
    }

    if (summaryData.activeCount !== undefined) {
      doc.text(`Active ${summaryData.viewMode === 'app' ? 'Apps' : 'Players'}: ${summaryData.activeCount}`, 14, yPosition);
      yPosition += 6;
    }

    yPosition += 5;
  }

  // Prepare table data
  if (data && data.length > 0) {
    const headers = Object.keys(data[0]);
    const rows = data.map(item => headers.map(header => item[header]));

    // Add table
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: yPosition,
      theme: 'grid',
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { top: 10, left: 14, right: 14 },
      styles: {
        overflow: 'linebreak',
        cellPadding: 3
      }
    });
  }

  // Save PDF
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};
