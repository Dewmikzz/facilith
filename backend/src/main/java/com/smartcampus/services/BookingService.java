package com.smartcampus.services;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.smartcampus.dao.BookingDao;
import com.smartcampus.dao.NotificationDao;
import com.smartcampus.dao.UserDao;
import com.smartcampus.models.Booking;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class BookingService {

    private final BookingDao bookingDao;
    private final NotificationDao notificationDao;
    private final UserDao userDao;

    public BookingService(BookingDao bookingDao, NotificationDao notificationDao, UserDao userDao) {
        this.bookingDao = bookingDao;
        this.notificationDao = notificationDao;
        this.userDao = userDao;
    }

    public String createBooking(Booking booking) throws ExecutionException, InterruptedException {
        // 1. Conflict detection: check for overlapping APPROVED bookings
        if (hasConflict(booking)) {
            throw new IllegalStateException("Resource already booked for that time slot.");
        }

        // 2. Set initial state
        booking.setStatus("PENDING");

        // 3. Save booking
        String bookingId = bookingDao.createBooking(booking);

        // 4. Notify all ADMINs about new booking request
        notifyAdmins("📅 New booking request from user " + booking.getUserId() +
                " for resource " + booking.getResourceId(), "INFO", "/admin/bookings");

        return bookingId;
    }

    public void updateBookingStatus(String bookingId, String status, String userId, String rejectionReason)
            throws ExecutionException, InterruptedException {

        Firestore db = FirestoreClient.getFirestore();
        Map<String, Object> updates = new HashMap<>();
        updates.put("status", status);
        if (rejectionReason != null && !rejectionReason.isEmpty()) {
            updates.put("rejectionReason", rejectionReason);
        }
        db.collection("bookings").document(bookingId).update(updates).get();

        // Notify the booking owner
        String message = status.equals("APPROVED")
                ? "✅ Your booking has been approved!"
                : "❌ Your booking was rejected. Reason: " + (rejectionReason != null ? rejectionReason : "N/A");

        notificationDao.send(userId, message,
                status.equals("APPROVED") ? "SUCCESS" : "ALERT",
                "/user/bookings");
    }

    public List<Booking> getAllBookings() throws ExecutionException, InterruptedException {
        return bookingDao.getAllBookings();
    }

    public List<Booking> getBookingsByUser(String userId) throws ExecutionException, InterruptedException {
        return bookingDao.getBookingsByUser(userId);
    }

    // --- Private helpers ---

    private boolean hasConflict(Booking newBooking) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection("bookings")
                .whereEqualTo("resourceId", newBooking.getResourceId())
                .whereEqualTo("status", "APPROVED")
                .get();

        for (QueryDocumentSnapshot doc : future.get().getDocuments()) {
            Booking existing = doc.toObject(Booking.class);
            // Overlap check: new.start < existing.end AND new.end > existing.start
            if (newBooking.getStartTime().before(existing.getEndTime()) &&
                newBooking.getEndTime().after(existing.getStartTime())) {
                return true;
            }
        }
        return false;
    }

    private void notifyAdmins(String message, String type, String link) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection("users")
                    .whereEqualTo("role", "ADMIN").get();
            for (QueryDocumentSnapshot doc : future.get().getDocuments()) {
                notificationDao.send(doc.getId(), message, type, link);
            }
        } catch (Exception e) {
            System.err.println("Failed to notify admins: " + e.getMessage());
        }
    }
}
