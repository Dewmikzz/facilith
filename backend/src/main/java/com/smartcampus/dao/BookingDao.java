package com.smartcampus.dao;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.smartcampus.models.Booking;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class BookingDao {

    private static final String COLLECTION = "bookings";

    public String createBooking(Booking booking) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<DocumentReference> future = db.collection(COLLECTION).add(booking);
        return future.get().getId();
    }

    public List<Booking> getAllBookings() throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION).get();
        List<Booking> bookings = new ArrayList<>();
        for (QueryDocumentSnapshot document : future.get().getDocuments()) {
            Booking booking = document.toObject(Booking.class);
            booking.setId(document.getId());
            bookings.add(booking);
        }
        return bookings;
    }

    public List<Booking> getBookingsByUser(String userId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION).whereEqualTo("userId", userId).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        List<Booking> bookings = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            Booking booking = document.toObject(Booking.class);
            booking.setId(document.getId());
            bookings.add(booking);
        }
        return bookings;
    }

    public String updateBookingStatus(String bookingId, String status) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference docRef = db.collection(COLLECTION).document(bookingId);
        ApiFuture<WriteResult> future = docRef.update("status", status);
        return future.get().getUpdateTime().toString();
    }
}
