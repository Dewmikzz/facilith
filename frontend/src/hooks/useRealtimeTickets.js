import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Custom hook to fetch real-time updates from Firestore without WebSockets.
 * Replaces the need for a complex Spring WebSocket broker for UI updates.
 */
export const useRealtimeTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Create a query for all tickets, ordered by creation date
    const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));
    
    // onSnapshot establishes a WebSocket/long-polling connection to Firestore
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTickets(liveData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching live tickets:", error);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  return { tickets, loading };
};
