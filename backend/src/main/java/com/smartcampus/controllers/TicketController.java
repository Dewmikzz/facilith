package com.smartcampus.controllers;

import com.smartcampus.models.Comment;
import com.smartcampus.models.Ticket;
import com.smartcampus.services.TicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping("/")
    public ResponseEntity<?> createTicket(@RequestBody Ticket ticket) {
        try {
            return ResponseEntity.ok(Map.of("id", ticketService.createTicket(ticket)));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/")
    public ResponseEntity<?> getAllTickets() {
        try {
            return ResponseEntity.ok(ticketService.getAllTickets());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/reporter/{reporterId}")
    public ResponseEntity<?> getByReporter(@PathVariable String reporterId) {
        try {
            return ResponseEntity.ok(ticketService.getTicketsByReporter(reporterId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/technician/{technicianId}")
    public ResponseEntity<?> getByTechnician(@PathVariable String technicianId) {
        try {
            return ResponseEntity.ok(ticketService.getTicketsByTechnician(technicianId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PatchMapping("/{ticketId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String ticketId, @RequestBody Map<String, String> body) {
        try {
            ticketService.updateTicketStatus(ticketId, body.get("status"), body.get("reporterId"));
            return ResponseEntity.ok(Map.of("message", "Status updated"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PatchMapping("/{ticketId}/assign")
    public ResponseEntity<?> assignTechnician(@PathVariable String ticketId, @RequestBody Map<String, String> body) {
        try {
            ticketService.assignTechnician(ticketId, body.get("technicianId"), body.get("reporterId"));
            return ResponseEntity.ok(Map.of("message", "Technician assigned"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PostMapping("/{ticketId}/comments")
    public ResponseEntity<?> addComment(@PathVariable String ticketId, @RequestBody Map<String, String> body) {
        try {
            Comment comment = new Comment();
            comment.setTicketId(ticketId);
            comment.setUserId(body.get("userId"));
            comment.setUserFullName(body.get("userFullName"));
            comment.setComment(body.get("comment"));
            String id = ticketService.addComment(comment, body.get("reporterId"), body.get("technicianId"));
            return ResponseEntity.ok(Map.of("id", id));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/{ticketId}/comments")
    public ResponseEntity<?> getComments(@PathVariable String ticketId) {
        try {
            return ResponseEntity.ok(ticketService.getComments(ticketId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}
