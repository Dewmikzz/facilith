package com.smartcampus.dao;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.smartcampus.models.Notification;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Repository
public class NotificationDao {

    private static final String COLLECTION = "notifications";

    public String send(String userId, String message, String type, String link) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        Map<String, Object> data = new HashMap<>();
        data.put("userId", userId);
        data.put("message", message);
        data.put("type", type);
        data.put("link", link);
        data.put("readStatus", false);
        data.put("createdAt", com.google.cloud.Timestamp.now());
        ApiFuture<DocumentReference> future = db.collection(COLLECTION).add(data);
        return future.get().getId();
    }

    public void markRead(String notificationId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        db.collection(COLLECTION).document(notificationId).update("readStatus", true).get();
    }
}
