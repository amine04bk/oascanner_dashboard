import React, { useState, useEffect } from "react";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { Line } from 'react-chartjs-2';
import './ChartsComponent.css'; // Import the CSS file
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Polygon coordinates
const polygonCoords = [
  { lat: 33.891896, lng: 10.077119 },
  { lat: 33.892131, lng: 10.074921 },
  { lat: 33.884996, lng: 10.066983 },
  { lat: 33.876125, lng: 10.064322 },
  { lat: 33.870933, lng: 10.062777 },
  { lat: 33.865310, lng: 10.061268 },
  { lat: 33.863244, lng: 10.061309 },
  { lat: 33.859213, lng: 10.070243 },
  { lat: 33.864023, lng: 10.068489 },
  { lat: 33.873067, lng: 10.088397 },
  { lat: 33.883373, lng: 10.085827 },
  { lat: 33.893389, lng: 10.077391 },
];

function isInPolygon(lat, lng, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;

    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

const db = getDatabase();
const firestore = getFirestore();

function ChartsComponent({ onDataUpdate }) {
  const [chartData, setChartData] = useState({
    scoreDiffCounts: {},
    totalMarks: 0,
    positiveMarksTotal: 0,
    firestoreData: {} // New field for Firestore data
  });

  useEffect(() => {
    const scoresRef = ref(db, "building_scores");

    const unsubscribe = onValue(scoresRef, (snapshot) => {
      const data = snapshot.val();

      console.log("Raw data:", data);

      if (!Array.isArray(data)) {
        console.error("Data format is not as expected.");
        return;
      }

      const scoreDiffCounts = {};
      let totalMarks = 0;
      let positiveMarksTotal = 0;

      data.forEach(item => {
        const scoreDiff = Math.floor(item.score_diff);
        const { bottom_lat, bottom_lon, top_lat, top_lon } = item;
        const lat = (bottom_lat + top_lat) / 2;
        const lng = (bottom_lon + top_lon) / 2;

        totalMarks += 1;

        if (scoreDiff > 0 && isInPolygon(lat, lng, polygonCoords)) {
          positiveMarksTotal++;
        }

        if (scoreDiff >= 0) {
          if (scoreDiffCounts[scoreDiff]) {
            scoreDiffCounts[scoreDiff]++;
          } else {
            scoreDiffCounts[scoreDiff] = 1;
          }
        }
      });

      const sortedScoreDiffCounts = Object.entries(scoreDiffCounts)
        .sort(([keyA], [keyB]) => parseInt(keyA) - parseInt(keyB))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      const updatedData = {
        scoreDiffCounts: sortedScoreDiffCounts,
        totalMarks,
        positiveMarksTotal
      };

      console.log("Processed data:", updatedData);

      setChartData(prevData => ({
        ...prevData,
        ...updatedData
      }));

      if (onDataUpdate) onDataUpdate(updatedData);

      const positiveMarksRef = ref(db, "count_marks_positive_score_diff");
      set(positiveMarksRef, { total: positiveMarksTotal })
        .then(() => {
          console.log("Positive marks total saved successfully.");
        })
        .catch((error) => {
          console.error("Error saving positive marks total:", error);
        });
    });

    return () => unsubscribe();
  }, [onDataUpdate]);

  useEffect(() => {
    const fetchFirestoreData = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "chart"));
        const dataByDate = {};

        querySnapshot.forEach(doc => {
          const data = doc.data();
          const dateProcessed = data.date_processed; // Ensure this field exists
          const count = (data.count_marks_positive_score_diff)-330 || 0; // Ensure this field exists

          if (dateProcessed) {
            if (!dataByDate[dateProcessed]) {
              dataByDate[dateProcessed] = 0;
            }
            dataByDate[dateProcessed] += count;
          }
        });

        const sortedDataByDate = Object.entries(dataByDate)
          .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
          .reduce((acc, [date, count]) => ({ ...acc, [date]: count }), {});

        setChartData(prevData => ({
          ...prevData,
          firestoreData: sortedDataByDate
        }));
      } catch (error) {
        console.error("Error fetching Firestore data:", error);
      }
    };

    fetchFirestoreData();
  }, []);

  const scoreDiffData = {
    labels: Object.keys(chartData.scoreDiffCounts),
    datasets: [
      {
        label: 'Score Diff Counts',
        data: Object.values(chartData.scoreDiffCounts),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      }
    ]
  };

  const positiveMarksData = {
    labels: Object.keys(chartData.firestoreData),
    datasets: [
      {
        label: 'Count of Positive Score Differences by Date',
        data: Object.values(chartData.firestoreData),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
      }
    ]
  };

  return (
    <div className="chart-container">
      <h2>Score Difference Counts</h2>
      <div className="chart">
        <Line data={scoreDiffData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Score Difference Counts (Non-Negative)' } } }} />
      </div>

      <h2>Count of Positive Score Differences by Date</h2>
      <div className="chart">
        <Line data={positiveMarksData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Count of Positive Score Differences by Date' } } }} />
      </div>
    </div>
  );
}

export default ChartsComponent;
