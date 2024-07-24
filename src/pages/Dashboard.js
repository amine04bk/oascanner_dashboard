import React, { useState, useEffect } from "react";
import { getFirestore, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import ChartsComponent from "../components/ChartsComponent"; // Import ChartsComponent
import TableComponent from "../components/TableComponent"; // Adjust the import path as needed
import './Dashboard.css'; // Create a CSS file for styling

const db = getFirestore();

function Dashboard() {
  const [totalMarks, setTotalMarks] = useState(0);
  const [positiveMarksTotal, setPositiveMarksTotal] = useState(0);

  useEffect(() => {
    // Real-time listener for total marks
    const scoresRef = collection(db, "building_scores");
    const scoresQuery = query(
      scoresRef,
      orderBy("score_diff", "desc")
    );

    const unsubscribeMarks = onSnapshot(scoresQuery, (snapshot) => {
      const total = snapshot.docs.reduce((acc, doc) => acc + (doc.data().score_diff || 0), 0);
      setTotalMarks(total);
    }, (error) => {
      console.error("Error fetching total marks:", error);
    });

    // Cleanup listener on component unmount
    return () => {
      unsubscribeMarks();
    };
  }, []);

  // Callback function to handle data updates from ChartsComponent
  const handleDataUpdate = (data) => {
    setTotalMarks(data.totalMarks); // Update totalMarks
    setPositiveMarksTotal(data.positiveMarksTotal);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
      </header>
      <section className="stats">
        <h2>Total image proccessed</h2>
        <p>{totalMarks.toFixed(2)}</p>
        <h2>Total Marks for Positive Score Difference </h2>
        <p>{positiveMarksTotal.toFixed(2)}</p>
      </section>
      <section className="charts">
        <ChartsComponent onDataUpdate={handleDataUpdate} />
      </section>
      <section className="downloads">
        <h2>Downloads</h2>
        <TableComponent />
      </section>
    </div>
  );
}

export default Dashboard;
