package com.smartcampus.services;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.smartcampus.dao.CommentDao;
import com.smartcampus.dao.NotificationDao;
import com.smartcampus.dao.TicketDao;
import com.smartcampus.models.Comment;
import com.smartcampus.models.Ticket;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class TicketService {

    private final TicketDao ticketDao;
    private final CommentDao commentDao;
    private final NotificationDao notificationDao;

    public TicketService(TicketDao ticketDao, CommentDao commentDao, NotificationDao notificationDao) {
        this.ticketDao = ticketDao;
        this.commentDao = commentDao;
        this.notificationDao = notificationDao;
    }

    public String createTicket(Ticket ticket) throws ExecutionException, InterruptedException {
        ticket.setStatus("OPEN");
        ticket.setCreatedAt(new Date());
        // Set SLA: deadlines based on priority
        ticket.setSlaDeadline(calculateSla(ticket.getPriority()));

        String ticketId = ticketDao.createTicket(ticket);

        // Notify all ADMINs
        notifyAdmins("🎫 New maintenance ticket: " + ticket.getTitle(), "INFO", "/admin/tickets");

        return ticketId;
    }

    public void updateTicketStatus(String ticketId, String status, String reporterId)
            throws ExecutionException, InterruptedException {
        ticketDao.updateTicketStatus(ticketId, status);

        // Notify the reporter
        String message = "🔄 Your ticket status has been updated to: " + status;
        notificationDao.send(reporterId, message, "INFO", "/user/tickets");
    }

    public void assignTechnician(String ticketId, String technicianId, String reporterId)
            throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        db.collection("tickets").document(ticketId).update("technicianId", technicianId).get();

        // Notify the technician
        notificationDao.send(technicianId, "🛠️ A new ticket has been assigned to you.", "INFO", "/tech/tickets");
        // Notify the reporter
        notificationDao.send(reporterId, "👷 A technician has been assigned to your ticket.", "SUCCESS", "/user/tickets");
    }

    public String addComment(Comment comment, String reporterId, String technicianId)
            throws ExecutionException, InterruptedException {
        String commentId = commentDao.addComment(comment);

        String message = "💬 New comment added on your ticket.";
        // Notify reporter
        if (reporterId != null && !reporterId.equals(comment.getUserId())) {
            notificationDao.send(reporterId, message, "INFO", "/user/tickets");
        }
        // Notify technician if assigned
        if (technicianId != null && !technicianId.equals(comment.getUserId())) {
            notificationDao.send(technicianId, message, "INFO", "/tech/tickets");
        }
        return commentId;
    }

    public List<Ticket> getAllTickets() throws ExecutionException, InterruptedException {
        return ticketDao.getAllTickets();
    }

    public List<Ticket> getTicketsByReporter(String reporterId) throws ExecutionException, InterruptedException {
        return ticketDao.getTicketsByReporter(reporterId);
    }

    public List<Ticket> getTicketsByTechnician(String technicianId) throws ExecutionException, InterruptedException {
        return ticketDao.getTicketsByTechnician(technicianId);
    }

    public List<Comment> getComments(String ticketId) throws ExecutionException, InterruptedException {
        return commentDao.getCommentsByTicket(ticketId);
    }

    // SLA: URGENT=4h, HIGH=24h, MEDIUM=72h, LOW=7 days
    private Date calculateSla(String priority) {
        Calendar cal = Calendar.getInstance();
        switch (priority != null ? priority.toUpperCase() : "MEDIUM") {
            case "URGENT": cal.add(Calendar.HOUR, 4); break;
            case "HIGH":   cal.add(Calendar.HOUR, 24); break;
            case "LOW":    cal.add(Calendar.DAY_OF_MONTH, 7); break;
            default:       cal.add(Calendar.HOUR, 72); break;
        }
        return cal.getTime();
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
