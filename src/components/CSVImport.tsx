import React, { useState, useEffect } from 'react';

interface CSVImportProps {
    rawData: string[][];
    columnMapping: { date: number; description: number; amount: number };
    setProcessedData: React.Dispatch<React.SetStateAction<{ date: string; description: string; amount: string; }[]>>;
}

export function CSVImport({ rawData, columnMapping, setProcessedData }: CSVImportProps) {

    useEffect(() => {
        if (rawData.length > 0) {
            processData();
        }
    }, [rawData, columnMapping, setProcessedData]);

    const processData = () => {
        const processed = rawData
            .filter(row => row.length >= Math.max(columnMapping.date, columnMapping.description, columnMapping.amount) + 1)
            .map(row => {
                //Date Parsing
                let dateValue: string | null = null;
                try {
                    const originalDate = row[columnMapping.date];

                    const parseMMDDYYYY = (dateString: string): string | null => {
                        const dateParts = dateString.split('/');
                        if (dateParts.length === 3) {
                            const month = parseInt(dateParts[0], 10);
                            const day = parseInt(dateParts[1], 10);
                            const year = parseInt(dateParts[2], 10);

                            if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1000 && year <= 9999) {
                                const isoDateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                return isoDateString;
                            }
                        }
                        return null;
                    };
                    dateValue = parseMMDDYYYY(originalDate);
                }
                catch (e) {
                    console.error('Error parsing date:', row[columnMapping.date], e);
                    return null; // Skip this transaction
                }
                return {
                    date: dateValue ? dateValue : row[columnMapping.date],
                    description: row[columnMapping.description],
                    amount: row[columnMapping.amount]
                };
            })
            .filter(Boolean);
        setProcessedData(processed as any); // Update state in parent component
    };

    return (
        null // This component doesn't need to render anything directly
    );
}