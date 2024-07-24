import React, { useState, useEffect } from "react";
import "./Map.css";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { ref, get } from "firebase/database";
import { database } from "../firebase";
import jsPDF from "jspdf";
import QRCode from "qrcode.react";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const mapContainerStyle = {
  width: "100%",
  height: "100vh",
};

const center = {
  lat: 33.874927,
  lng: 10.076513,
};

const options = {
  mapTypeId: "satellite",
  disableDefaultUI: true,
  styles: [
    {
      featureType: "all",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

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

const auth = getAuth();
const db = getFirestore();

function MapComponent() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-maps-script",
    googleMapsApiKey: "AIzaSyBEOC880MD93Jy7pMDELKkuprOrZ6ZXMWg",
    libraries: ['geometry'],
  });

  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dbRef = ref(database, 'building_scores');
        const snapshot = await get(dbRef);

        if (snapshot.exists()) {
          const data = snapshot.val();

          const markersArray = Object.keys(data).map(key => {
            const item = data[key];
            // Calculate the center of the polygon using average of the corner coordinates
            const centerLat = (item.bottom_lat + item.top_lat) / 2;
            const centerLng = (item.bottom_lon + item.top_lon) / 2;

            return {
              id: key,
              latitude: centerLat,
              longitude: centerLng,
              building_score_2010: item.score_date1,
              building_score_2023: item.score_date2,
              image_name_2010: item.tile_path_date1,
              image_name_2023: item.tile_path_date2,
              building_score_diff: item.score_diff,
            };
          }).filter(marker => 
            marker.building_score_diff > 0 && isInPolygon(marker.latitude, marker.longitude)
          ); // Filter markers with score_diff > 0 and within the polygon

          setMarkers(markersArray);
        } else {
          console.log("No data available");
        }
      } catch (error) {
        console.error("Error fetching data from Firebase:", error);
      }
    };

    fetchData();
  }, []);

  const isInPolygon = (lat, lng) => {
    if (!window.google || !window.google.maps || !window.google.maps.geometry) {
      return false;
    }
    const point = new window.google.maps.LatLng(lat, lng);
    const polygon = new window.google.maps.Polygon({ paths: polygonCoords });
    return window.google.maps.geometry.poly.containsLocation(point, polygon);
  };

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
  };

  const handleDownloadPDF = async () => {
    if (selectedMarker) {
      const { latitude, longitude } = selectedMarker;
      const doc = new jsPDF();

      const qrCodeDataURL = document.getElementById('qrCode').toDataURL();
      const currentDate = new Date().toLocaleString();
      const user = auth.currentUser;
      const userEmail = user ? user.email : "Unknown user";

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Ordre de Mission", 105, 30, null, null, "center");

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${currentDate}`, 20, 50);
      doc.text(`Latitude: ${latitude}`, 20, 60);
      doc.text(`Longitude: ${longitude}`, 20, 70);
      doc.text(`Email: ${userEmail}`, 20, 80);
      doc.text("Veuillez vérifier la position de batiment dans une marge de ±5 mètres de précision.", 20, 90);

      doc.text("QR Code:", 20, 110);
      doc.addImage(qrCodeDataURL, 'PNG', 20, 120, 50, 50);

      doc.save("ordre_de_mission.pdf");

      // Save download data to Firestore
      await saveDownloadData(userEmail, currentDate, latitude, longitude);
    }
  };

  const saveDownloadData = async (email, date, latitude, longitude) => {
    try {
      await addDoc(collection(db, "downloads"), {
        email: email,
        date: date,
        latitude: latitude,
        longitude: longitude,
      });
      console.log("Download data saved successfully");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="map-container">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={14.2}
        options={options}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={{ lat: marker.latitude, lng: marker.longitude }}
            onClick={() => handleMarkerClick(marker)}
            label={`${marker.building_score_diff.toFixed(0)}`}
          />
        ))}
      </GoogleMap>
      {selectedMarker && (
        <div className="popup">
          <div className="popup-inner">
            <button className="close-btn" onClick={() => setSelectedMarker(null)}>X</button>
            <p>{selectedMarker.description}</p>
            <QRCode 
              id="qrCode"
              value={`https://www.google.com/maps/search/?api=1&query=${selectedMarker.latitude},${selectedMarker.longitude}`}
              size={200}
            />
            <button onClick={handleDownloadPDF}>
              Download Ordre de Mission
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapComponent;
