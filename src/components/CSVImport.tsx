import React, { useCallback, useState } from 'react';
import { Upload, CheckCircle, XCircle } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '../supabaseClient';

export function CSVImport() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('loading');
    setMessage('Processing CSV file...');

    Papa.parse(file, {
      complete: async (results) => {
        try {
          if (results.errors.length > 0) {
            throw new Error('Error parsing CSV file');
          }

          const transactions = results.data
            .filter((row: any) => row.date && row.description && row.amount)
            .map((row: any) => ({
              date: row.date,
              description: row.description,
              amount: parseFloat(row.amount),
              category: 'Uncategorized',
              account: file.name.split('.')[0]
            }));

          if (transactions.length === 0) {
            throw new Error('No valid transactions found in CSV');
          }

          const { error } = await supabase
            .from('transactions')
            .insert(transactions);

          if (error) {
            throw error;
          }

          setStatus('success');
          setMessage(`Successfully imported ${transactions.length} transactions`);
          
          // Reset the file input
          event.target.value = '';
          
          // Reload the page after 2 seconds to show new transactions
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } catch (error) {
          console.error('Error importing transactions:', error);
          setStatus('error');
          setMessage(error instanceof Error ? error.message : 'Failed to import transactions');
        }
      },
      header: true,
      skipEmptyLines: true
    });
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
        <Upload className="w-8 h-8 text-gray-400" />
        <span className="mt-2 text-sm text-gray-500">Upload CSV file</span>
        <input 
          type="file" 
          className="hidden" 
          accept=".csv" 
          onChange={handleFileUpload}
          disabled={status === 'loading'} 
        />
      </label>

      {status !== 'idle' && (
        <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${
          status === 'loading' ? 'bg-blue-50 text-blue-700' :
          status === 'success' ? 'bg-green-50 text-green-700' :
          'bg-red-50 text-red-700'
        }`}>
          {status === 'success' && <CheckCircle className="w-5 h-5" />}
          {status === 'error' && <XCircle className="w-5 h-5" />}
          <p className="text-sm">{message}</p>
        </div>
      )}

      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700">CSV Format Requirements:</h3>
        <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
          <li>File must be in CSV format</li>
          <li>Required columns: date, description, amount</li>
          <li>Date format: YYYY-MM-DD</li>
          <li>Amount should be a number (positive for income, negative for expenses)</li>
        </ul>
      </div>
    </div>
  );
}