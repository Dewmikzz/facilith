package com.smartcampus.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initialize() {
        try {
            String jsonConfig = System.getenv("FIREBASE_SERVICE_ACCOUNT_JSON");
            GoogleCredentials credentials;

            if (jsonConfig != null && !jsonConfig.isEmpty()) {
                System.out.println("Initializing Firebase from Environment Variable...");
                credentials = GoogleCredentials.fromStream(new java.io.ByteArrayInputStream(jsonConfig.getBytes()));
            } else {
                System.out.println("Initializing Firebase from local file 'firebase-service-account.json'...");
                FileInputStream serviceAccount = new FileInputStream("firebase-service-account.json");
                credentials = GoogleCredentials.fromStream(serviceAccount);
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
            System.out.println("Firebase Admin SDK implicitly initialized!");
        } catch (IOException e) {
            System.err.println("Firebase Initialization Error: " + e.getMessage());
        }
    }
}
