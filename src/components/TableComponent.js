import React, { useState, useEffect, useCallback } from "react";
import { getFirestore, collection, query, orderBy, getDocs } from "firebase/firestore";
import DatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.css'; // Ensure this file exists
import './TableComponent.css'; // Ensure this file exists
import { parse, format, isValid } from 'date-fns'; // Import date-fns functions

const PAGE_SIZE = 10;
const db = getFirestore();

const TableComponent = () => {
  const [downloads, setDownloads] = useState([]);
  const [visibleDownloads, setVisibleDownloads] = useState([]);
  const [searchDate, setSearchDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchDownloads = useCallback(async () => {
    setLoading(true);
    try {
      const downloadsRef = collection(db, "downloads");
      const downloadsQuery = query(downloadsRef, orderBy("date", "desc"));

      const snapshot = await getDocs(downloadsQuery);
      const downloadsArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setDownloads(downloadsArray);
      setVisibleDownloads(downloadsArray.slice(0, PAGE_SIZE));
    } catch (error) {
      console.error("Error fetching downloads:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDownloads();
  }, [fetchDownloads]);

  useEffect(() => {
    const filterDownloads = () => {
      if (!searchDate) {
        setVisibleDownloads(downloads.slice(0, PAGE_SIZE));
        return;
      }

      const formattedSearchDate = format(searchDate, 'M/dd/yyyy');

      const filteredDownloads = downloads.filter(download => {
        try {
          // Convert download.date to a Date object
          const parsedDate = parse(download.date, 'M/dd/yyyy, hh:mm:ss a', new Date());
          if (!isValid(parsedDate)) {
            console.error("Invalid download date:", download.date);
            return false;
          }

          // Format the parsed date to compare
          const formattedDownloadDate = format(parsedDate, 'M/dd/yyyy');
          return formattedDownloadDate === formattedSearchDate;
        } catch (error) {
          console.error("Error parsing date:", error);
          return false;
        }
      });

      setVisibleDownloads(filteredDownloads.slice(0, PAGE_SIZE));
    };

    filterDownloads();
  }, [searchDate, downloads]);

  const handleShowMore = () => {
    if (loading) return; // Prevent further fetching if already loading

    const nextIndex = currentPage * PAGE_SIZE;
    const nextDownloads = downloads.slice(nextIndex, nextIndex + PAGE_SIZE);
    
    setVisibleDownloads(prevDownloads => [
      ...prevDownloads,
      ...nextDownloads
    ]);
    setCurrentPage(prevPage => prevPage + 1);
  };

  const handleSearch = (date) => {
    setSearchDate(date);
  };

  const handleReset = () => {
    setSearchDate(null);
    setVisibleDownloads(downloads.slice(0, PAGE_SIZE));
    setCurrentPage(1);
  };

  // Helper function to format date and time
  const formatDateAndTime = (dateString) => {
    try {
      // Convert download.date to a Date object
      const parsedDate = parse(dateString, 'M/dd/yyyy, hh:mm:ss a', new Date());
      if (!isValid(parsedDate)) {
        throw new Error(`Invalid date: ${dateString}`);
      }
      const formattedDate = format(parsedDate, 'MM/dd/yyyy'); // Format date
      const formattedTime = format(parsedDate, 'HH:mm:ss'); // Format time
      return { formattedDate, formattedTime };
    } catch (error) {
      console.error("Error formatting date and time:", error);
      return { formattedDate: 'Invalid date', formattedTime: 'Invalid time' };
    }
  };

  return (
    <div className="table-component">
      <div className="search-bar-container">
        <DatePicker
          selected={searchDate}
          onChange={handleSearch}
          dateFormat="MM/dd/yyyy"
          placeholderText="Select a date"
          className="date-picker"
        />
        <button onClick={handleReset} className="reset-button">Reset to 10</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Date</th>
            <th>Time</th>
            <th>Latitude</th>
            <th>Longitude</th>
          </tr>
        </thead>
        <tbody>
          {visibleDownloads.map((download) => {
            const { formattedDate, formattedTime } = formatDateAndTime(download.date);
            return (
              <tr key={download.id}>
                <td>{download.email}</td>
                <td>{formattedDate}</td> {/* Display date */}
                <td>{formattedTime}</td> {/* Display time */}
                <td>{download.latitude}</td>
                <td>{download.longitude}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {visibleDownloads.length < downloads.length && (
        <button onClick={handleShowMore} className="show-more-button" disabled={loading}>
          {loading ? "Loading..." : "+10"}
        </button>
      )}
    </div>
  );
};

export default TableComponent;
