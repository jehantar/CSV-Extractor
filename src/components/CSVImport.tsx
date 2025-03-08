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
          .map((row: any) => {
            // Convert date to YYYY-MM-DD format
            let dateValue;
            try {
              // First, log the original date format
              console.log("Original date from CSV:", row.date);
              
              // Check if the date contains slashes (MM/DD/YYYY)
              if (row.date.includes('/')) {
                const dateParts = row.date.split('/');
                // Ensure we have month, day, year
                if (dateParts.length === 3) {
                  // MM/DD/YYYY to YYYY-MM-DD
                  const month = dateParts[0].padStart(2, '0');
                  const day = dateParts[1].padStart(2, '0');
                  const year = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2];
                  dateValue = `${year}-${month}-${day}`;
                }
              } else if (row.date.includes('-')) {
                // If it's already in YYYY-MM-DD format, validate it
                const dateParts = row.date.split('-');
                if (dateParts.length === 3 && dateParts[0].length === 4) {
                  // Already in YYYY-MM-DD format
                  dateValue = row.date;
                } else {
                  // Might be DD-MM-YYYY or MM-DD-YYYY
                  const month = dateParts[1].padStart(2, '0');
                  const day = dateParts[0].padStart(2, '0');
                  const year = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2];
                  dateValue = `${year}-${month}-${day}`;
                }
              } else {
                // Try other date formats using Date object
                const date = new Date(row.date);
                if (!isNaN(date.getTime())) {
                  dateValue = date.toISOString().split('T')[0];
                } else {
                  throw new Error("Couldn't parse date format");
                }
              }
              
              // Log the converted date
              console.log("Converted date format:", dateValue);
              
              // Verify with a Date object
              const validDate = new Date(dateValue);
              if (isNaN(validDate.getTime())) {
                throw new Error("Converted date is invalid");
              }
              
            } catch (e) {
              console.error('Error parsing date:', row.date, e);
              return null;
            }
        
            return {
              date: dateValue,
              description: row.description,
              amount: parseFloat(row.amount),
              category: 'Uncategorized',
              account: file.name.split('.')[0]
            };
          })
          .filter(Boolean); // Remove any null entries from failed date parsing

          if (transactions.length === 0) {
            throw new Error('No valid transactions found in CSV');
          }

// Debug before sending to Supabase
console.log("First few transactions to insert:", transactions.slice(0, 3));

// Check if any transaction has an invalid date format
const invalidDates = transactions.filter(t => t && t.date && !t.date.match(/^\d{4}-\d{2}-\d{2}$/));
if (invalidDates.length > 0) {
  console.error("Found transactions with invalid date format:", invalidDates);
  throw new Error("Some transactions have invalid date formats");
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