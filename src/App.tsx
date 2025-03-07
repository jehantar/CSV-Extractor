import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, Download } from 'lucide-react';

function App() {
  const [rawData, setRawData] = useState<string[][]>([]);
  const [processedData, setProcessedData] = useState<Array<{ date: string; description: string; amount: string }>>([]);
  const [columnMapping, setColumnMapping] = useState({
    date: 0,
    description: 1,
    amount: 2
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        setRawData(results.data as string[][]);
        processData(results.data as string[][], columnMapping);
      },
      header: false,
      skipEmptyLines: true
    });
  };

  const processData = (data: string[][], mapping: typeof columnMapping) => {
    const processed = data
      .filter(row => row.length >= Math.max(mapping.date, mapping.description, mapping.amount) + 1)
      .map(row => ({
        date: row[mapping.date],
        description: row[mapping.description],
        amount: row[mapping.amount]
      }));
    setProcessedData(processed);
  };

  const handleColumnChange = (field: keyof typeof columnMapping, value: string) => {
    const newMapping = { ...columnMapping, [field]: parseInt(value) };
    setColumnMapping(newMapping);
    if (rawData.length > 0) {
      processData(rawData, newMapping);
    }
  };

  const downloadCSV = () => {
    if (processedData.length === 0) return;

    const csv = Papa.unparse(processedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'processed_transactions.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-center mb-8">CSV Converter</h1>
          
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <label className="cursor-pointer inline-flex flex-col items-center">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Upload CSV file</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".csv" 
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {rawData.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {(['date', 'description', 'amount'] as const).map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.charAt(0).toUpperCase() + field.slice(1)} Column
                      </label>
                      <select
                        value={columnMapping[field]}
                        onChange={(e) => handleColumnChange(field, e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      >
                        {rawData[0].map((_, index) => (
                          <option key={index} value={index}>Column {index + 1}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {processedData.slice(0, 5).map((row, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <button
                  onClick={downloadCSV}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Processed CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;