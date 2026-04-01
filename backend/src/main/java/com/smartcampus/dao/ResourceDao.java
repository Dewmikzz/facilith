package com.smartcampus.dao;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.smartcampus.models.Resource;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class ResourceDao {

    private static final String COLLECTION = "resources";

    public String createResource(Resource resource) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<DocumentReference> future = db.collection(COLLECTION).add(resource);
        return future.get().getId();
    }

    public Resource getResourceById(String id) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference docRef = db.collection(COLLECTION).document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();
        if (document.exists()) {
            Resource resource = document.toObject(Resource.class);
            if (resource != null) {
                resource.setId(document.getId());
            }
            return resource;
        }
        return null;
    }

    public List<Resource> getAllResources() throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        List<Resource> resources = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            Resource resource = document.toObject(Resource.class);
            resource.setId(document.getId());
            resources.add(resource);
        }
        return resources;
    }
}
