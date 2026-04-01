package com.smartcampus.dao;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.smartcampus.models.Ticket;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class TicketDao {

    private static final String COLLECTION = "tickets";

    public String createTicket(Ticket ticket) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<DocumentReference> future = db.collection(COLLECTION).add(ticket);
        return future.get().getId();
    }

    public List<Ticket> getTicketsByReporter(String reporterId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION).whereEqualTo("reporterId", reporterId).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        List<Ticket> tickets = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            Ticket ticket = document.toObject(Ticket.class);
            ticket.setId(document.getId());
            tickets.add(ticket);
        }
        return tickets;
    }

    public List<Ticket> getAllTickets() throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION).get();
        List<Ticket> tickets = new ArrayList<>();
        for (QueryDocumentSnapshot document : future.get().getDocuments()) {
            Ticket ticket = document.toObject(Ticket.class);
            ticket.setId(document.getId());
            tickets.add(ticket);
        }
        return tickets;
    }

    public List<Ticket> getTicketsByTechnician(String technicianId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION).whereEqualTo("technicianId", technicianId).get();
        List<Ticket> tickets = new ArrayList<>();
        for (QueryDocumentSnapshot document : future.get().getDocuments()) {
            Ticket ticket = document.toObject(Ticket.class);
            ticket.setId(document.getId());
            tickets.add(ticket);
        }
        return tickets;
    }

    public String updateTicketStatus(String ticketId, String status) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference docRef = db.collection(COLLECTION).document(ticketId);
        ApiFuture<WriteResult> future = docRef.update("status", status);
        return future.get().getUpdateTime().toString();
    }
}
