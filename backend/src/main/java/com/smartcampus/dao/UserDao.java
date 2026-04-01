package com.smartcampus.dao;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.cloud.FirestoreClient;
import com.smartcampus.models.User;
import org.springframework.stereotype.Repository;

import java.util.concurrent.ExecutionException;

@Repository
public class UserDao {

    private static final String COLLECTION = "users";

    public String saveUser(User user) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        // Uses the Firebase UID as the document ID
        ApiFuture<WriteResult> collectionsApiFuture = db.collection(COLLECTION).document(user.getId()).set(user);
        return collectionsApiFuture.get().getUpdateTime().toString();
    }

    public User getUserById(String uid) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference documentReference = db.collection(COLLECTION).document(uid);
        ApiFuture<DocumentSnapshot> future = documentReference.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            return document.toObject(User.class);
        }
        return null;
    }

    public void updateRole(String uid, String newRole) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        db.collection(COLLECTION).document(uid).update("role", newRole).get();
    }
}
