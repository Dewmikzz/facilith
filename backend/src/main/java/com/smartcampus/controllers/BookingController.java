package com.smartcampus.controllers;

import com.smartcampus.models.Booking;
import com.smartcampus.services.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/")
    public ResponseEntity<?> createBooking(@RequestBody Booking booking) {
        try {
            String id = bookingService.createBooking(booking);
            return ResponseEntity.ok(Map.of("id", id, "message", "Booking submitted for approval."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/")
    public ResponseEntity<?> getAllBookings() {
        try {
            return ResponseEntity.ok(bookingService.getAllBookings());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserBookings(@PathVariable String userId) {
        try {
            return ResponseEntity.ok(bookingService.getBookingsByUser(userId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PatchMapping("/{bookingId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String bookingId, @RequestBody Map<String, String> body) {
        try {
            bookingService.updateBookingStatus(
                    bookingId,
                    body.get("status"),
                    body.get("userId"),
                    body.get("rejectionReason")
            );
            return ResponseEntity.ok(Map.of("message", "Booking status updated."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}
