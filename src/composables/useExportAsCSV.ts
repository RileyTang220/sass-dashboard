import { ref } from 'vue';

export function useExportAsCSV() {
  const isExporting = ref(false);

  const exportData = (data: any[], columns: { key: string, label: string }[], filename: string) => {
    if (!data || data.length === 0) {
      alert('No data to export.');
      return;
    }

    isExporting.value = true;

    try {
      // 1. Create Headers
      const headers = columns.map(col => col.label).join(',');

      // 2. Create Rows
      const rows = data.map(item => {
        return columns
          .map(col => {
            let value = item[col.key];
            if (value === null || value === undefined) {
              value = '';
            }
            // Escape commas in data
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(',');
      });

      // 3. Combine headers and rows
      const csvContent = [headers, ...rows].join('\n');
      
      // 4. Create Blob and Download Link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export data.');
    } finally {
      isExporting.value = false;
    }
  };

  return { isExporting, exportData };
}