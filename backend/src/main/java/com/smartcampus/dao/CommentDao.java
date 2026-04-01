package com.smartcampus.dao;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.smartcampus.models.Comment;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class CommentDao {

    private static final String COLLECTION = "comments";

    public String addComment(Comment comment) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        comment.setCreatedAt(new java.util.Date());
        ApiFuture<DocumentReference> future = db.collection(COLLECTION).add(comment);
        return future.get().getId();
    }

    public List<Comment> getCommentsByTicket(String ticketId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION)
                .whereEqualTo("ticketId", ticketId)
                .orderBy("createdAt")
                .get();

        List<Comment> comments = new ArrayList<>();
        for (QueryDocumentSnapshot doc : future.get().getDocuments()) {
            Comment c = doc.toObject(Comment.class);
            c.setId(doc.getId());
            comments.add(c);
        }
        return comments;
    }
}
